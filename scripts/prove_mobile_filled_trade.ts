import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { mintCompleteSetForPublicOrderbook } from "../src/server/services/orderbookCollateral";
import { placeOrderAndMatch } from "../src/server/services/matching";
import { submitCanonicalOrder } from "../src/server/services/canonicalOrderSubmission";
import { buildTicketSelectionMetadata } from "../src/server/services/ticketSelectionMetadata";

const prisma = new PrismaClient();
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);
const MOBILE_USERNAME = "holiwyn-mobile-dev";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const summaryPath = argValue("summaryPath") ?? "docs/mobile/harness/cycle-current-mobile-filled-trade-proof.json";

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

async function ensureBuyerBalance(userId: string) {
  const current = await prisma.userBalance.findUnique({ where: { userId } });
  if (!current) {
    await prisma.userBalance.create({
      data: { userId, availableUSDC: dec("10000"), lockedUSDC: dec("0") },
    });
    return;
  }
  if (dec(current.availableUSDC).lt("10")) {
    await prisma.userBalance.update({
      where: { userId },
      data: { availableUSDC: dec("100"), lockedUSDC: current.lockedUSDC },
    });
  }
}

async function createMaker() {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `mobile_fill_maker_${suffix}`,
      email: `mobile_fill_maker_${suffix}@local.test`,
    },
  });
  await prisma.userBalance.create({
    data: { userId: user.id, availableUSDC: dec("100"), lockedUSDC: dec("0") },
  });
  return user;
}

async function createWorldCupProofMarket() {
  const suffix = randomUUID().slice(0, 8);
  const conditionId = `0x${Buffer.from(`mobile-filled-provider-${suffix}`).toString("hex").padEnd(64, "0").slice(0, 64)}`;
  const yesTokenId = `pm-mobile-filled-yes-${suffix}`;
  const noTokenId = `pm-mobile-filled-no-${suffix}`;
  const market = await prisma.market.create({
    data: {
      slug: `mobile-provider-filled-trade-world-cup-${suffix}`,
      title: `World Cup Provider Filled Trade Proof ${suffix}`,
      description: "Dev-only provider-shaped World Cup proof market for Holiwyn mobile filled-trade history.",
      status: "LIVE",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      kind: "ORDERBOOK",
      type: "BINARY",
      marketType: "winner",
      marketGroupKey: "live-game-lines",
      marketGroupTitle: "Game Lines",
      propCategory: "match-winner",
      period: "regulation",
      isListed: true,
      isCanceled: false,
      referenceSource: "polymarket",
      externalSlug: `fifwc-mobile-provider-filled-${suffix}`,
      externalMarketId: `gamma-mobile-provider-filled-${suffix}`,
      conditionId,
      outcomes: {
        create: [
          {
            name: "YES",
            label: "Provider YES",
            side: "home",
            slug: `mobile-provider-proof-yes-${suffix}`,
            displayOrder: 0,
            isActive: true,
            referenceTokenId: yesTokenId,
            referenceOutcomeLabel: "Yes",
          },
          {
            name: "NO",
            label: "Provider NO",
            side: "away",
            slug: `mobile-provider-proof-no-${suffix}`,
            displayOrder: 1,
            isActive: true,
            referenceTokenId: noTokenId,
            referenceOutcomeLabel: "No",
          },
        ],
      },
    },
    include: { outcomes: { orderBy: { displayOrder: "asc" } } },
  });
  const outcome = market.outcomes.find((item) => item.name.toUpperCase() === "YES") ?? market.outcomes[0];
  assert(Boolean(outcome), "Selected market has no active outcome.");
  return { market, outcome };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run mobile filled-trade proof in production.");
  }

  const buyer = await prisma.user.findUnique({ where: { username: MOBILE_USERNAME } });
  if (!buyer) {
    throw new Error(`Missing ${MOBILE_USERNAME}; run npm run mobile:dev-credential first.`);
  }
  await ensureBuyerBalance(buyer.id);

  const credential = await prisma.apiCredential.findFirst({
    where: { userId: buyer.id, status: "ACTIVE", isDisabled: false, readOnly: false },
    orderBy: { createdAt: "desc" },
    select: { id: true, keyId: true },
  });

  const { market, outcome } = await createWorldCupProofMarket();
  const maker = await createMaker();
  await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: maker.id, quantity: "2" });

  const makerOrder = await placeOrderAndMatch({
    marketId: market.id,
    userId: maker.id,
    outcomeId: outcome.id,
    side: "SELL",
    price: "0.50",
    size: "2",
    type: "LIMIT",
  });

  const selection = buildTicketSelectionMetadata({
    market,
    outcome,
    requestBody: {
      selection: {
        marketId: market.id,
        outcomeId: outcome.id,
        marketGroupId: market.marketGroupKey,
        marketType: market.marketType,
        period: market.period,
        side: outcome.side,
        displayLabel: `${outcome.label ?? outcome.name} ${market.period}`,
        contractSide: "yes",
        referenceSource: market.referenceSource,
        externalSlug: market.externalSlug,
        externalMarketId: market.externalMarketId,
        conditionId: market.conditionId,
        referenceTokenId: outcome.referenceTokenId,
        referenceOutcomeLabel: outcome.referenceOutcomeLabel,
      },
      contractSide: "YES",
    },
  });

  const takerOrder = await submitCanonicalOrder({
    userId: buyer.id,
    apiCredentialId: credential?.id ?? null,
    apiKeyId: credential?.keyId ?? null,
    idempotencyKeyHeader: `mobile-provider-filled-${randomUUID()}`,
    body: {
      marketId: market.id,
      outcomeId: outcome.id,
      side: "BUY",
      type: "LIMIT",
      price: "0.50",
      size: "2",
      contractSide: "YES",
      selection,
    },
  });

  assert(takerOrder.status === 200, `expected canonical order status 200, got ${takerOrder.status}`);
  assert("order" in takerOrder.body, "expected canonical order response with order");
  const takerOrderBody = takerOrder.body;
  assert(takerOrderBody.order.status === "FILLED", `expected filled taker order, got ${takerOrderBody.order.status}`);
  assert(takerOrderBody.fills.length >= 1, "expected at least one fill");

  const recentTrades = await prisma.trade.findMany({
    where: { userId: buyer.id },
    include: { market: true, outcome: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  assert(recentTrades.some((trade) => trade.marketId === market.id && trade.outcomeId === outcome.id), "filled trade missing from buyer history");

  const position = await prisma.position.findUnique({
    where: { userId_marketId_outcomeId: { userId: buyer.id, marketId: market.id, outcomeId: outcome.id } },
    include: { market: true, outcome: true },
  });
  assert(Boolean(position), "filled trade missing from buyer position");

  const request = await prisma.apiOrderRequest.findFirst({
    where: { userId: buyer.id, orderId: takerOrderBody.order.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, requestBody: true, orderId: true },
  });
  assert(Boolean(request), "canonical API order request missing for filled provider order");

  const portfolioSelection = position
    ? buildTicketSelectionMetadata({ market: position.market, outcome: position.outcome })
    : null;
  const historySelection = recentTrades[0]
    ? buildTicketSelectionMetadata({ market: recentTrades[0].market, outcome: recentTrades[0].outcome })
    : null;
  const requestSelection =
    request?.requestBody && typeof request.requestBody === "object" && !Array.isArray(request.requestBody)
      ? (request.requestBody as Record<string, unknown>).selection
      : null;

  const requiredProviderFields = {
    referenceSource: "polymarket",
    externalSlug: market.externalSlug,
    externalMarketId: market.externalMarketId,
    conditionId: market.conditionId,
    referenceTokenId: outcome.referenceTokenId,
    referenceOutcomeLabel: outcome.referenceOutcomeLabel,
  };
  for (const [field, expected] of Object.entries(requiredProviderFields)) {
    assert((requestSelection as Record<string, unknown> | null)?.[field] === expected, `request selection missing ${field}`);
    assert((portfolioSelection as Record<string, unknown> | null)?.[field] === expected, `portfolio selection missing ${field}`);
    assert((historySelection as Record<string, unknown> | null)?.[field] === expected, `history selection missing ${field}`);
  }

  const summary = {
    ready: true,
    buyerUsername: buyer.username,
    providerLifecycle: {
      requestSelectionHasProviderIdentity: true,
      portfolioPositionHasProviderIdentity: true,
      recentTradeHasProviderIdentity: true,
    },
    market: {
      id: market.id,
      title: market.title,
      referenceSource: market.referenceSource,
      externalSlug: market.externalSlug,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
    },
    outcome: {
      id: outcome.id,
      name: outcome.name,
      referenceTokenId: outcome.referenceTokenId,
      referenceOutcomeLabel: outcome.referenceOutcomeLabel,
    },
    makerOrder: { id: makerOrder.order.id, status: makerOrder.order.status },
    takerOrder: { id: takerOrderBody.order.id, status: takerOrderBody.order.status },
    fillCount: takerOrderBody.fills.length,
    position: position
      ? {
          marketId: position.marketId,
          outcomeId: position.outcomeId,
          shares: Number(position.shares),
          selection: portfolioSelection,
        }
      : null,
    recentTradeCount: recentTrades.length,
    latestTrade: recentTrades[0]
      ? {
          id: recentTrades[0].id,
          side: recentTrades[0].side,
          shares: Number(recentTrades[0].shares),
          cost: Number(recentTrades[0].cost),
          marketTitle: recentTrades[0].market.title,
          outcomeName: recentTrades[0].outcome.name,
          selection: historySelection,
        }
      : null,
    requestSelection,
    usedApiCredential: Boolean(credential),
  };

  const resolved = path.resolve(summaryPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
