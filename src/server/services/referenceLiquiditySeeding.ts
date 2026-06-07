import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { API_KEY_SCOPES, createApiCredential, updateApiCredential } from "@/lib/canonicalAuth";
import { applyDeposit } from "@/server/services/ledger";
import { mintCompleteSetForPublicOrderbook } from "@/server/services/orderbookCollateral";
import {
  BotInitializationMetadata,
  mergeBotInitializationMetadata,
  parseBotInitializationMetadata,
} from "@/server/services/referenceBotInitialization";

const DEFAULT_CHAIN_ID = 8453;
const SYSTEM_BOT_USERNAME = "system-liquidity-bot";
const SYSTEM_BOT_EMAIL = "system-liquidity-bot@local.test";

export type SeedReferenceLiquidityBotParams = {
  marketId: string;
  capitalDollars: number;
  mintDollars: number;
  dryRun: boolean;
  confirmSeed: boolean;
  initializedBy: string;
};

export type SeedReferenceLiquidityBotResult = {
  ok: boolean;
  dryRun: boolean;
  marketId: string;
  title: string;
  referenceSource: string | null;
  importStatus: string | null;
  isListed: boolean;
  binary: boolean;
  seeded: boolean;
  alreadySeeded: boolean;
  noMutation: boolean;
  capitalCents: number;
  mintBudgetCents: number;
  cashReserveCents: number;
  mintedCompleteSets: number;
  autoReplenish: boolean;
  botUserId: string | null;
  botUsername: string | null;
  botApiCredentialId: string | null;
  botApiKeyId: string | null;
  botApiToken: string | null;
};

export async function seedReferenceLiquidityBotForMarket(
  params: SeedReferenceLiquidityBotParams,
): Promise<SeedReferenceLiquidityBotResult> {
  const market = await prisma.market.findUnique({
    where: { id: params.marketId },
    include: {
      outcomes: {
        where: { isActive: true },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!market) {
    throw new Error("Market not found.");
  }

  const review =
    market.referenceMetadata && typeof market.referenceMetadata === "object" && !Array.isArray(market.referenceMetadata)
      ? (market.referenceMetadata as Record<string, unknown>)
      : {};
  const binary = market.outcomes.length === 2;
  if (market.referenceSource !== "polymarket") {
    throw new Error("Only Polymarket reference markets can be seeded.");
  }
  if (review.importStatus !== "approved") {
    throw new Error("Market must be approved before seeding.");
  }
  if (!market.isListed) {
    throw new Error("Market must be listed before seeding.");
  }
  if (!binary) {
    throw new Error("Only binary markets are supported for live liquidity seeding.");
  }
  if (!market.outcomes.every((outcome) => outcome.referenceTokenId)) {
    throw new Error("All active outcomes must have reference token ids before seeding.");
  }
  if (!params.dryRun && market.status !== "LIVE") {
    throw new Error("Market must be LIVE before seeding.");
  }
  if (!params.dryRun) {
    assertLiveInternalSeedingAllowed();
  }
  if (!params.dryRun && !params.confirmSeed) {
    throw new Error("confirmSeed=true is required for live seeding.");
  }

  const capitalCents = Math.min(
    Math.round(params.capitalDollars * 100),
    maxSystemLiquidityPerMarketCents(),
  );
  const mintBudgetCents = Math.min(Math.round(params.mintDollars * 100), capitalCents);
  const cashReserveCents = Math.max(0, capitalCents - mintBudgetCents);
  const mintedCompleteSets = Math.round(mintBudgetCents / 100);
  const current = parseBotInitializationMetadata(market.referenceMetadata);
  const alreadySeeded = !!current?.capital?.initializedAt;

  if (params.dryRun) {
    return {
      ok: true,
      dryRun: true,
      marketId: market.id,
      title: market.title,
      referenceSource: market.referenceSource,
      importStatus: typeof review.importStatus === "string" ? review.importStatus : null,
      isListed: market.isListed,
      binary,
      seeded: alreadySeeded,
      alreadySeeded,
      noMutation: true,
      capitalCents,
      mintBudgetCents,
      cashReserveCents,
      mintedCompleteSets,
      autoReplenish: false,
      botUserId: current?.capital?.botUserId ?? null,
      botUsername: current?.capital?.botUsername ?? null,
      botApiCredentialId: current?.capital?.botApiCredentialId ?? null,
      botApiKeyId: current?.capital?.botApiKeyId ?? null,
      botApiToken: null,
    };
  }

  const botUser = await prisma.user.upsert({
    where: { username: SYSTEM_BOT_USERNAME },
    update: {
      email: SYSTEM_BOT_EMAIL,
      displayName: "System Liquidity Bot",
    },
    create: {
      username: SYSTEM_BOT_USERNAME,
      email: SYSTEM_BOT_EMAIL,
      displayName: "System Liquidity Bot",
      isAdmin: false,
    },
  });

  if (current?.capital?.botApiCredentialId) {
    await prisma.apiCredential.updateMany({
      where: {
        id: current.capital.botApiCredentialId,
        userId: botUser.id,
      },
      data: { isDisabled: true },
    });
  }

  await applyDeposit({
    eventKey: `reference-liquidity-seed:${market.id}`,
    userId: botUser.id,
    amount: (capitalCents / 100).toFixed(6),
    chainId: DEFAULT_CHAIN_ID,
    txHash: `0xrefseed${market.id.replace(/-/g, "").slice(0, 24)}`,
    logIndex: 1,
    token: "USDC",
    referenceType: "REFERENCE_LIQUIDITY_SEED",
    referenceId: market.id,
  });

  const positions = await prisma.position.findMany({
    where: {
      userId: botUser.id,
      marketId: market.id,
      outcomeId: { in: market.outcomes.map((outcome) => outcome.id) },
    },
    select: {
      outcomeId: true,
      shares: true,
    },
  });
  const mintTarget = new Prisma.Decimal(mintedCompleteSets.toFixed(6));
  const hasMintedInventory =
    positions.length === market.outcomes.length &&
    positions.every((position) => new Prisma.Decimal(position.shares).gte(mintTarget));

  if (!hasMintedInventory) {
    await mintCompleteSetForPublicOrderbook({
      marketId: market.id,
      userId: botUser.id,
      quantity: mintedCompleteSets.toFixed(6),
    });
  }

  const createdCredential = await createApiCredential({
    userId: botUser.id,
    name: `reference-liquidity-${market.id}`,
    scopes: [...API_KEY_SCOPES],
  });

  await updateApiCredential({
    userId: botUser.id,
    id: createdCredential.apiKey.id,
    body: {
      isDisabled: false,
      readOnly: false,
      maxOrderNotional: "10.000000",
      maxOpenOrders: 4,
      maxDailySubmittedNotional: "1000.000000",
      allowedMarketIds: [market.id],
    },
  });

  const nextMetadata = mergeBotInitializationMetadata(market.referenceMetadata, {
    status: current?.status === "live_enabled" ? "live_enabled" : current?.status ?? "dry_run_ready",
    capital: {
      budgetCents: capitalCents,
      mintBudgetCents,
      mintedCompleteSets,
      cashReserveCents,
      autoReplenish: false,
      initializedAt: new Date().toISOString(),
      initializedBy: params.initializedBy,
      botUserId: botUser.id,
      botUsername: botUser.username,
      botApiCredentialId: createdCredential.apiKey.id,
      botApiKeyId: createdCredential.apiKey.keyId,
      maxSingleOrderNotionalCents: 1000,
      maxOpenOrderNotionalCents: 10000,
      maxDailyLossCents: 10000,
    },
    runtime: {
      liveOrdersEnabled: false,
      emergencyStop: false,
      cancelRequestedAt: null,
      lastSeededAt: new Date().toISOString(),
      lastLiveRunAt: current?.runtime?.lastLiveRunAt ?? null,
      lastRuntimeSyncAt: current?.runtime?.lastRuntimeSyncAt ?? null,
    },
  } satisfies Partial<BotInitializationMetadata>);

  await prisma.market.update({
    where: { id: market.id },
    data: {
      referenceMetadata: nextMetadata,
    },
  });

  return {
    ok: true,
    dryRun: false,
    marketId: market.id,
    title: market.title,
    referenceSource: market.referenceSource,
    importStatus: typeof review.importStatus === "string" ? review.importStatus : null,
    isListed: market.isListed,
    binary,
    seeded: true,
    alreadySeeded,
    noMutation: false,
    capitalCents,
    mintBudgetCents,
    cashReserveCents,
    mintedCompleteSets,
    autoReplenish: false,
    botUserId: botUser.id,
    botUsername: botUser.username,
    botApiCredentialId: createdCredential.apiKey.id,
    botApiKeyId: createdCredential.apiKey.keyId,
    botApiToken: createdCredential.token,
  };
}

function assertLiveInternalSeedingAllowed() {
  if (process.env.POLY_BOTS_ENABLED !== "true") {
    throw new Error("POLY_BOTS_ENABLED=true is required for live internal seeding.");
  }
  if (process.env.POLY_BOTS_LIVE_TRADING !== "true") {
    throw new Error("POLY_BOTS_LIVE_TRADING=true is required for live internal seeding.");
  }
  if (process.env.POLY_BOTS_GLOBAL_KILL_SWITCH !== "false") {
    throw new Error("POLY_BOTS_GLOBAL_KILL_SWITCH=false is required for live internal seeding.");
  }
  if (process.env.LIVE_SYSTEM_LIQUIDITY_ENABLED !== "true") {
    throw new Error("LIVE_SYSTEM_LIQUIDITY_ENABLED=true is required for live internal seeding.");
  }
  if (process.env.SYSTEM_LIQUIDITY_DRY_RUN !== "false") {
    throw new Error("SYSTEM_LIQUIDITY_DRY_RUN=false is required for live internal seeding.");
  }
}

function maxSystemLiquidityPerMarketCents() {
  const raw = process.env.MAX_SYSTEM_LIQUIDITY_PER_MARKET;
  if (!raw?.trim()) return 100_000;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 100_000;
  return Math.round(parsed * 100);
}
