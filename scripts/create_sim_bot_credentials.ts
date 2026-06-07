import fs from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { API_KEY_SCOPES, createApiCredential, updateApiCredential } from "@/lib/canonicalAuth";
import { applyDeposit } from "@/server/services/ledger";
import { mintCompleteSetForPublicOrderbook } from "@/server/services/orderbookCollateral";

const BOT_COUNT = 20;
const DEFAULT_BASE_URL = "http://127.0.0.1:3001";
const DEFAULT_AVAILABLE_USDC = "150.000000";
const DEFAULT_MAX_ORDER_SIZE = "1.000000";
const DEFAULT_MAX_TAKER_SIZE = "0.350000";
const DEFAULT_MAX_OPEN_ORDERS = 6;
const DEFAULT_DAILY_NOTIONAL = "20000.000000";
const DEFAULT_STALE_ORDER_MS = 8000;
const DEFAULT_MIN_QUOTE_LIFETIME_MS = 5000;
const DEFAULT_TICK_SIZE = "0.01";
const DEFAULT_MAX_POSITION_SHARES = "5.000000";
const DEFAULT_INVENTORY_TARGET_SHARES = "1.500000";
const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_LOOP_INTERVAL_MIN_MS = 1200;
const DEFAULT_LOOP_INTERVAL_MAX_MS = 2800;
const DEFAULT_TARGET_SPREAD_TICKS = 2;
const DEFAULT_QUOTE_OFFSET_MIN_TICKS = 0;
const DEFAULT_QUOTE_OFFSET_MAX_TICKS = 2;
const DEFAULT_STALE_DISTANCE_TICKS = 4;
const DEFAULT_REPLACE_THRESHOLD_TICKS = 2;
const DEFAULT_REPLACE_HYSTERESIS_TICKS = 1;
const DEFAULT_MAX_ORDERS_PER_SIDE = 1;
const DEFAULT_TAKER_PROBABILITY = 0.08;
const DEFAULT_TAKER_THRESHOLD_TICKS = 1;
const DEFAULT_INVENTORY_SKEW_STRENGTH = 3;
const DEFAULT_FALLBACK_FAIR_PRICE = "0.50";
const DEFAULT_DECISION_COOLDOWN_MS = 1200;
const DEFAULT_CAP_BACKOFF_MS = 8000;
const DEFAULT_DAILY_NOTIONAL_PAUSE_MODE = "pause_for_run";
const DEFAULT_DAILY_NOTIONAL_COOLDOWN_MS = 86_400_000;
const DEFAULT_PAUSED_POLL_INTERVAL_MS = 45_000;
const DEFAULT_PAUSE_LOG_INTERVAL_MS = 60_000;
const DEFAULT_SEED_SHARES_PER_OUTCOME = "2.000000";
const PLACEHOLDER_MARKET_ID = "replace-with-live-market-id";
const DEFAULT_CHAIN_ID = 8453;

type GeneratedBot = {
  name: string;
  baseUrl: string;
  apiKey: string;
  strategy: "tightMarketMaker" | "noiseTrader" | "inventoryAwareMaker";
  marketIds: string[];
  pollIntervalMs: number;
  loopIntervalMinMs: number;
  loopIntervalMaxMs: number;
  maxOrderSize: string;
  maxTakerSize: string;
  maxOpenOrders: number;
  staleOrderMs: number;
  minQuoteLifetimeMs: number;
  decisionCooldownMs: number;
  capBackoffMs: number;
  tickSize: string;
  maxPositionShares: string;
  inventoryTargetShares: string;
  targetSpreadTicks: number;
  quoteOffsetMinTicks: number;
  quoteOffsetMaxTicks: number;
  staleDistanceTicks: number;
  replaceThresholdTicks: number;
  replaceHysteresisTicks: number;
  maxOrdersPerSide: number;
  takerProbability: number;
  takerThresholdTicks: number;
  inventorySkewStrength: number;
  fallbackFairPrice: string;
  dailyNotionalPauseMode: "pause_for_run";
  dailyNotionalCooldownMs: number;
  pausedPollIntervalMs: number;
  pauseLogIntervalMs: number;
};

async function main() {
  const preferredMarkets = await prisma.market.findMany({
    where: {
      status: "LIVE",
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      isCanceled: false,
      isListed: true,
      referenceSource: null,
      outcomes: {
        some: { isTradable: true },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      outcomes: {
        where: { isTradable: true },
        select: { id: true, name: true },
        orderBy: { createdAt: "asc" },
      },
    },
    take: 5,
  });

  const fallbackMarkets =
    preferredMarkets.length > 0
      ? preferredMarkets
      : await prisma.market.findMany({
          where: {
            status: "LIVE",
            visibility: "PUBLIC",
            mechanism: "ORDERBOOK",
            isCanceled: false,
            isListed: true,
            outcomes: {
              some: { isTradable: true },
            },
          },
          orderBy: [{ createdAt: "desc" }],
          select: {
            id: true,
            title: true,
            outcomes: {
              where: { isTradable: true },
              select: { id: true, name: true },
              orderBy: { createdAt: "asc" },
            },
          },
          take: 5,
        });

  const markets = fallbackMarkets;
  const chosenMarket = markets[0] ?? null;
  const detectedMarketIds = markets.map((market) => market.id);
  const configMarketIds = chosenMarket ? [chosenMarket.id] : [PLACEHOLDER_MARKET_ID];
  const allowedMarketIds = chosenMarket ? [chosenMarket.id] : [];
  const seedOutcomeIds = chosenMarket?.outcomes.map((outcome) => outcome.id) ?? [];
  const seedQuantity = new Prisma.Decimal(DEFAULT_SEED_SHARES_PER_OUTCOME);

  const bots: GeneratedBot[] = [];
  const createdSummary: Array<{ name: string; userId: string; keyId: string; strategy: GeneratedBot["strategy"] }> = [];

  for (let index = 1; index <= BOT_COUNT; index += 1) {
    const botName = `sim-bot-${String(index).padStart(2, "0")}`;
    const strategy = chooseStrategy(index);

    const user = await prisma.user.upsert({
      where: { username: botName },
      update: {
        email: `${botName}@local.test`,
        displayName: botName,
      },
      create: {
        username: botName,
        email: `${botName}@local.test`,
        displayName: botName,
      },
    });

    await applyDeposit({
      eventKey: `sim-bot-deposit:${user.id}`,
      userId: user.id,
      amount: DEFAULT_AVAILABLE_USDC,
      chainId: DEFAULT_CHAIN_ID,
      txHash: `0xsimbot${String(index).padStart(4, "0")}`,
      logIndex: index,
      token: "USDC",
      referenceType: "SIM_BOT_FUNDING",
      referenceId: user.id,
    });

    if (chosenMarket && seedOutcomeIds.length > 0) {
      const existingSeededPositions = await prisma.position.findMany({
        where: {
          userId: user.id,
          marketId: chosenMarket.id,
          outcomeId: { in: seedOutcomeIds },
        },
        select: { outcomeId: true, shares: true },
      });

      const alreadySeeded =
        existingSeededPositions.length === seedOutcomeIds.length &&
        existingSeededPositions.every((position) => new Prisma.Decimal(position.shares).gte(seedQuantity));

      if (!alreadySeeded) {
        await mintCompleteSetForPublicOrderbook({
          marketId: chosenMarket.id,
          userId: user.id,
          quantity: DEFAULT_SEED_SHARES_PER_OUTCOME,
        });
      }
    }

    const created = await createApiCredential({
      userId: user.id,
      name: botName,
      scopes: [...API_KEY_SCOPES],
    });

    await updateApiCredential({
      userId: user.id,
      id: created.apiKey.id,
      body: {
        isDisabled: false,
        readOnly: false,
        maxOrderSize: DEFAULT_MAX_ORDER_SIZE,
        maxOpenOrders: DEFAULT_MAX_OPEN_ORDERS,
        maxDailySubmittedNotional: DEFAULT_DAILY_NOTIONAL,
        allowedMarketIds,
      },
    });

    bots.push({
      name: botName,
      baseUrl: DEFAULT_BASE_URL,
      apiKey: created.token,
      strategy,
      marketIds: configMarketIds,
      pollIntervalMs: DEFAULT_POLL_INTERVAL_MS,
      loopIntervalMinMs: DEFAULT_LOOP_INTERVAL_MIN_MS,
      loopIntervalMaxMs: DEFAULT_LOOP_INTERVAL_MAX_MS,
      maxOrderSize: strategy === "noiseTrader" ? "0.600000" : DEFAULT_MAX_ORDER_SIZE,
      maxTakerSize: strategy === "tightMarketMaker" ? "0.200000" : DEFAULT_MAX_TAKER_SIZE,
      maxOpenOrders: DEFAULT_MAX_OPEN_ORDERS,
      staleOrderMs: strategy === "noiseTrader" ? 9000 : DEFAULT_STALE_ORDER_MS,
      minQuoteLifetimeMs: DEFAULT_MIN_QUOTE_LIFETIME_MS,
      decisionCooldownMs: DEFAULT_DECISION_COOLDOWN_MS,
      capBackoffMs: DEFAULT_CAP_BACKOFF_MS,
      tickSize: DEFAULT_TICK_SIZE,
      maxPositionShares: DEFAULT_MAX_POSITION_SHARES,
      inventoryTargetShares: strategy === "inventoryAwareMaker" ? "2.000000" : DEFAULT_INVENTORY_TARGET_SHARES,
      targetSpreadTicks: strategy === "tightMarketMaker" ? 2 : strategy === "inventoryAwareMaker" ? 3 : 4,
      quoteOffsetMinTicks: DEFAULT_QUOTE_OFFSET_MIN_TICKS,
      quoteOffsetMaxTicks: strategy === "noiseTrader" ? 3 : DEFAULT_QUOTE_OFFSET_MAX_TICKS,
      staleDistanceTicks: DEFAULT_STALE_DISTANCE_TICKS,
      replaceThresholdTicks: DEFAULT_REPLACE_THRESHOLD_TICKS,
      replaceHysteresisTicks: DEFAULT_REPLACE_HYSTERESIS_TICKS,
      maxOrdersPerSide: DEFAULT_MAX_ORDERS_PER_SIDE,
      takerProbability: strategy === "noiseTrader" ? 0.16 : strategy === "tightMarketMaker" ? 0.03 : DEFAULT_TAKER_PROBABILITY,
      takerThresholdTicks: DEFAULT_TAKER_THRESHOLD_TICKS,
      inventorySkewStrength: strategy === "inventoryAwareMaker" ? 5 : DEFAULT_INVENTORY_SKEW_STRENGTH,
      fallbackFairPrice: DEFAULT_FALLBACK_FAIR_PRICE,
      dailyNotionalPauseMode: DEFAULT_DAILY_NOTIONAL_PAUSE_MODE,
      dailyNotionalCooldownMs: DEFAULT_DAILY_NOTIONAL_COOLDOWN_MS,
      pausedPollIntervalMs: DEFAULT_PAUSED_POLL_INTERVAL_MS,
      pauseLogIntervalMs: DEFAULT_PAUSE_LOG_INTERVAL_MS,
    });

    createdSummary.push({
      name: botName,
      userId: user.id,
      keyId: created.apiKey.keyId,
      strategy,
    });
  }

  const outputPath = path.resolve(process.cwd(), "..", "poly-bot", "generated.bots.json");
  await fs.writeFile(outputPath, `${JSON.stringify(bots, null, 2)}\n`, "utf8");

  console.info("[sim-bots] generated credentials", {
    outputPath,
    botCount: bots.length,
    detectedMarketIds,
    usingMarketIds: configMarketIds,
    seededOutcomeIds: seedOutcomeIds,
    credentials: createdSummary,
  });
}

function chooseStrategy(index: number): GeneratedBot["strategy"] {
  const mod = index % 3;
  if (mod === 1) {
    return "tightMarketMaker";
  }
  if (mod === 2) {
    return "inventoryAwareMaker";
  }
  return "noiseTrader";
}

main()
  .catch((error) => {
    console.error("[sim-bots] fatal", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
