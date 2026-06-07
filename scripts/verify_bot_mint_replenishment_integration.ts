import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { createApiCredential } from "@/lib/canonicalAuth";
import { mintCompleteSetForPublicOrderbook } from "@/server/services/orderbookCollateral";
import { placeOrderAndMatch } from "@/server/services/matching";
import { BotRunner } from "../../poly-bot/src/runner/botRunner.js";
import type { BotConfig } from "../../poly-bot/src/config/loadConfig.js";

const BASE_URL = process.env.BOT_E2E_BASE_URL ?? "http://127.0.0.1:3001";
const LOGS_DIR = path.resolve(process.cwd(), "test-logs", "bot-mint-integration");

type MintRouteProof = {
  marketId: string;
  userId: string;
  payload: { quantity: string };
  response: unknown;
  before: Snapshot;
  after: Snapshot;
};

type ScenarioProof = {
  name: string;
  marketId: string;
  userId: string;
  before: Snapshot;
  after: Snapshot;
  yesAskPrices: string[];
  logs: string[];
};

type Snapshot = {
  availableUSDC: string;
  lockedUSDC: string;
  marketCollateralUSDC: string;
  yesShares: string;
  noShares: string;
  yesReservedShares: string;
  noReservedShares: string;
};

async function main() {
  await fs.mkdir(LOGS_DIR, { recursive: true });
  await waitForApp();

  const mintRouteProof = await verifyMintRouteWithApiKey();
  const scenarioA = await runBotScenario({
    name: "scenario_a_yes_mid_080",
    yesBid: "0.79",
    yesAsk: "0.81",
    initialMint: "40.000000",
    availableUsdc: "500.000000",
  });
  const scenarioB = await runBotScenario({
    name: "scenario_b_yes_mid_092",
    yesBid: "0.91",
    yesAsk: "0.93",
    initialMint: "20.000000",
    availableUsdc: "500.000000",
  });
  const mintCapProof = await verifyMintCapBehavior();
  const insufficientUsdcProof = await verifyInsufficientUsdcSkip();

  const report = {
    baseUrl: BASE_URL,
    mintRouteProof,
    scenarioA,
    scenarioB,
    mintCapProof,
    insufficientUsdcProof,
  };

  console.log(JSON.stringify(report, null, 2));
}

async function verifyMintRouteWithApiKey(): Promise<MintRouteProof> {
  const suffix = randomUUID();
  const user = await createUser(`mint_auth_${suffix}`, "1000.000000");
  const market = await createBinaryMarket(`mint-auth-${suffix}`);
  const key = await createApiCredential({
    userId: user.id,
    name: `mint-auth-${suffix}`,
    scopes: ["orders:write"],
  });
  const before = await snapshotMarketUserState(market.id, user.id, market.outcomes[0].id, market.outcomes[1].id);

  const payload = { quantity: "260" };
  const response = await fetch(`${BASE_URL}/api/orderbook/${market.id}/mint`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => null);
  assert.equal(response.status, 200, `mint route should succeed, got ${response.status} ${JSON.stringify(body)}`);

  const after = await snapshotMarketUserState(market.id, user.id, market.outcomes[0].id, market.outcomes[1].id);
  assert.equal(Number(after.availableUSDC), 740);
  assert.equal(Number(after.yesShares), 260);
  assert.equal(Number(after.noShares), 260);
  assert.equal(Number(after.marketCollateralUSDC), 260);

  return {
    marketId: market.id,
    userId: user.id,
    payload,
    response: body,
    before,
    after,
  };
}

async function runBotScenario(params: {
  name: string;
  yesBid: string;
  yesAsk: string;
  initialMint: string;
  availableUsdc: string;
}): Promise<ScenarioProof> {
  const suffix = randomUUID();
  const market = await createBinaryMarket(`${params.name}-${suffix}`);
  const botUser = await createUser(`${params.name}_bot_${suffix}`, params.availableUsdc);
  const askMaker = await createUser(`${params.name}_ask_${suffix}`, "1000.000000");
  const bidMaker = await createUser(`${params.name}_bid_${suffix}`, "1000.000000");

  await mintCompleteSetForPublicOrderbook({
    marketId: market.id,
    userId: botUser.id,
    quantity: params.initialMint,
  });
  await mintCompleteSetForPublicOrderbook({
    marketId: market.id,
    userId: askMaker.id,
    quantity: "500.000000",
  });

  await placeOrderAndMatch({
    marketId: market.id,
    userId: askMaker.id,
    outcomeId: market.outcomes[0].id,
    side: "SELL",
    price: params.yesAsk,
    size: "50.000000",
  });
  await placeOrderAndMatch({
    marketId: market.id,
    userId: bidMaker.id,
    outcomeId: market.outcomes[0].id,
    side: "BUY",
    price: params.yesBid,
    size: "50.000000",
  });

  const apiKey = await createApiCredential({
    userId: botUser.id,
    name: `${params.name}-bot-key`,
    scopes: ["orders:read", "orders:write", "fills:read", "account:read"],
  });

  const config = createBotConfig({
    name: `${params.name}_${suffix}`,
    apiKey: apiKey.token,
    marketIds: [market.id],
  });

  const before = await snapshotMarketUserState(market.id, botUser.id, market.outcomes[0].id, market.outcomes[1].id);
  const logs = await runOneBotCycle(config);
  const after = await snapshotMarketUserState(market.id, botUser.id, market.outcomes[0].id, market.outcomes[1].id);

  assertLogContains(logs, "mint_replenishment_considered");
  assertLogContains(logs, "mint_replenishment_success");
  assertLogNotContains(logs, "dynamic_market_maker_mint_unavailable_skip");

  const yesSellOrders = await prisma.order.findMany({
    where: {
      marketId: market.id,
      userId: botUser.id,
      outcomeId: market.outcomes[0].id,
      side: "SELL",
      status: { in: ["OPEN", "PARTIAL"] },
    },
    orderBy: [{ createdAt: "asc" }],
    select: { price: true },
  });
  const yesAskPrices = yesSellOrders.map((order) => order.price.toString());

  assert.ok(compareNumeric(after.yesShares, before.yesShares) > 0, "YES shares should increase after mint");
  assert.ok(compareNumeric(after.noShares, before.noShares) > 0, "NO shares should increase after mint");
  assert.ok(compareNumeric(after.marketCollateralUSDC, before.marketCollateralUSDC) > 0);
  assert.ok(yesAskPrices.every((price) => Number(price) > 0.7), `YES asks should stay anchored high: ${yesAskPrices.join(",")}`);

  return {
    name: params.name,
    marketId: market.id,
    userId: botUser.id,
    before,
    after,
    yesAskPrices,
    logs,
  };
}

async function verifyMintCapBehavior() {
  const suffix = randomUUID();
  const market = await createBinaryMarket(`mint-cap-${suffix}`);
  const botUser = await createUser(`mint_cap_bot_${suffix}`, "1000.000000");
  const askMaker = await createUser(`mint_cap_ask_${suffix}`, "1000.000000");
  const bidMaker = await createUser(`mint_cap_bid_${suffix}`, "1000.000000");

  await mintCompleteSetForPublicOrderbook({
    marketId: market.id,
    userId: askMaker.id,
    quantity: "500.000000",
  });
  await placeOrderAndMatch({
    marketId: market.id,
    userId: askMaker.id,
    outcomeId: market.outcomes[0].id,
    side: "SELL",
    price: "0.81",
    size: "50.000000",
  });
  await placeOrderAndMatch({
    marketId: market.id,
    userId: bidMaker.id,
    outcomeId: market.outcomes[0].id,
    side: "BUY",
    price: "0.79",
    size: "50.000000",
  });

  const apiKey = await createApiCredential({
    userId: botUser.id,
    name: `mint-cap-bot-key-${suffix}`,
    scopes: ["orders:read", "orders:write", "fills:read", "account:read"],
  });

  const config = createBotConfig({
    name: `mint_cap_bot_${suffix}`,
    apiKey: apiKey.token,
    marketIds: [market.id],
    dynamicMarketMaker: {
      targetInventoryShares: "600.000000",
      maxMintAmountPerCycle: "100.000000",
      maxMintPerMarketPerHour: "100.000000",
    },
  });

  const before = await snapshotMarketUserState(market.id, botUser.id, market.outcomes[0].id, market.outcomes[1].id);
  const runner = createRunnerHarness(config);
  const firstLogs = await runner.runCycle();
  const afterFirst = await snapshotMarketUserState(market.id, botUser.id, market.outcomes[0].id, market.outcomes[1].id);
  assertLogContains(firstLogs, "mint_replenishment_success");
  assert.equal(Number(delta(before.yesShares, afterFirst.yesShares)), 100);

  await reserveAllAvailableShares(market.id, botUser.id, market.outcomes[0].id);
  await reserveAllAvailableShares(market.id, botUser.id, market.outcomes[1].id);

  const secondLogs = await runner.runCycle();
  runner.close();
  assertLogContains(secondLogs, "mint_replenishment_skipped");
  assertLogContains(secondLogs, "hourly_mint_cap_reached");

  return {
    marketId: market.id,
    before,
    afterFirst,
    firstLogs,
    secondLogs,
  };
}

async function reserveAllAvailableShares(marketId: string, userId: string, outcomeId: string) {
  const position = await prisma.position.findUnique({
    where: {
      userId_marketId_outcomeId: {
        userId,
        marketId,
        outcomeId,
      },
    },
  });
  if (!position) {
    return;
  }
  const available = Number(position.shares) - Number(position.reservedShares);
  if (available <= 0.000001) {
    return;
  }
  await placeOrderAndMatch({
    marketId,
    userId,
    outcomeId,
    side: "SELL",
    price: "0.99",
    size: available.toFixed(6),
  });
}

async function verifyInsufficientUsdcSkip() {
  const suffix = randomUUID();
  const market = await createBinaryMarket(`mint-low-usdc-${suffix}`);
  const botUser = await createUser(`mint_low_usdc_bot_${suffix}`, "60.000000");
  const askMaker = await createUser(`mint_low_usdc_ask_${suffix}`, "1000.000000");
  const bidMaker = await createUser(`mint_low_usdc_bid_${suffix}`, "1000.000000");

  await mintCompleteSetForPublicOrderbook({
    marketId: market.id,
    userId: botUser.id,
    quantity: "40.000000",
  });
  await mintCompleteSetForPublicOrderbook({
    marketId: market.id,
    userId: askMaker.id,
    quantity: "500.000000",
  });
  await placeOrderAndMatch({
    marketId: market.id,
    userId: askMaker.id,
    outcomeId: market.outcomes[0].id,
    side: "SELL",
    price: "0.81",
    size: "50.000000",
  });
  await placeOrderAndMatch({
    marketId: market.id,
    userId: bidMaker.id,
    outcomeId: market.outcomes[0].id,
    side: "BUY",
    price: "0.79",
    size: "50.000000",
  });

  const apiKey = await createApiCredential({
    userId: botUser.id,
    name: `mint-low-usdc-key-${suffix}`,
    scopes: ["orders:read", "orders:write", "fills:read", "account:read"],
  });

  const config = createBotConfig({
    name: `mint_low_usdc_${suffix}`,
    apiKey: apiKey.token,
    marketIds: [market.id],
  });

  const logs = await runOneBotCycle(config);
  assertLogContains(logs, "mint_replenishment_skipped");
  assertLogContains(logs, "insufficient_usdc");
  return { marketId: market.id, logs };
}

async function runOneBotCycle(config: BotConfig) {
  const harness = createRunnerHarness(config);
  try {
    return await harness.runCycle();
  } finally {
    harness.close();
  }
}

function createRunnerHarness(config: BotConfig) {
  const logPath = path.join(LOGS_DIR, `${config.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.log`);
  const runner = new BotRunner(config, LOGS_DIR);
  const runnerInternal = runner as unknown as {
    runCycle(signal: AbortSignal): Promise<void>;
    logger: { close(): void };
  };
  let lastOffset = 0;

  return {
    async runCycle() {
      await fs.mkdir(LOGS_DIR, { recursive: true });
      const existing = await fs.readFile(logPath, "utf8").catch(() => "");
      lastOffset = existing.length;

      const controller = new AbortController();
      await runnerInternal.runCycle(controller.signal);
      await sleep(250);

      const contents = await fs.readFile(logPath, "utf8");
      const nextChunk = contents.slice(lastOffset);
      return nextChunk.split(/\r?\n/).filter(Boolean);
    },
    close() {
      runnerInternal.logger.close();
    },
  };
}

function createBotConfig(overrides: Partial<BotConfig>): BotConfig {
  const base: BotConfig = {
    name: `mint-integration-${randomUUID()}`,
    baseUrl: BASE_URL,
    apiKey: "",
    strategy: "dynamicMarketMaker",
    marketIds: [],
    pollIntervalMs: 2000,
    loopIntervalMinMs: 1000,
    loopIntervalMaxMs: 2000,
    maxOrderSize: "1.000000",
    maxTakerSize: "0.250000",
    maxOpenOrders: 12,
    staleOrderMs: 8000,
    minQuoteLifetimeMs: 5000,
    decisionCooldownMs: 1200,
    capBackoffMs: 8000,
    tickSize: "0.01",
    maxPositionShares: "500.000000",
    inventoryTargetShares: "1.000000",
    targetSpreadTicks: 2,
    quoteOffsetMinTicks: 0,
    quoteOffsetMaxTicks: 1,
    staleDistanceTicks: 4,
    replaceThresholdTicks: 1,
    replaceHysteresisTicks: 1,
    maxOrdersPerSide: 3,
    takerProbability: 0,
    takerThresholdTicks: 1,
    inventorySkewStrength: 3,
    fallbackFairPrice: "0.50",
    dailyNotionalPauseMode: "pause_for_run",
    dailyNotionalCooldownMs: 86_400_000,
    pausedPollIntervalMs: 45_000,
    pauseLogIntervalMs: 60_000,
    dynamicMarketMaker: {
      minLevelsPerSide: 1,
      maxLevelsPerSide: 3,
      levelSpacingTicks: 1,
      minSpreadTicks: 2,
      maxSpreadTicks: 8,
      baseSpreadTicks: 2,
      extremeSpreadTicks: 3,
      inventorySpreadTicks: 2,
      inventoryLeanTicks: 3,
      inventoryReduceThreshold: 0.65,
      inventoryEmergencyThreshold: 0.92,
      levelSizeMultipliers: [1, 0.7, 0.45],
      extremeSizeReduction: 0.55,
      minLevelSize: "0.100000",
      replenishmentTargetShares: "1.000000",
      enableMintReplenishment: true,
      targetAskDepthShares: "100.000000",
      safetyMultiplier: 1.2,
      targetInventoryShares: "300.000000",
      minMintAmount: "50.000000",
      maxMintAmountPerCycle: "300.000000",
      maxMintPerMarketPerHour: "1000.000000",
      extremeMintReductionThresholdHigh: 0.85,
      extremeMintReductionThresholdLow: 0.15,
      extremeMintReductionFactor: 0.35,
      quoteKeepBandTicks: 0,
      quoteKeepSizeToleranceRatio: 0,
      normalMarketTightenTicks: 0,
      selectiveCompetitiveTicks: 0,
      selectiveCompetitiveSizeBumpRatio: 0,
      selectiveCompetitiveMaxInventoryImbalance: 0,
      selectiveCompetitiveMinAvailableUSDC: "0",
      selectiveCompetitiveRecentLagLimit: 0,
      safeCompetitiveJoinTouchBothSides: false,
      safeCompetitiveMinimumObservedSpreadTicks: 2,
    },
    risk: {
      botUserId: null,
      enabled: true,
      maxTotalCapitalCents: 500000,
      maxCapitalPerMarketCents: 100000,
      maxOpenOrderNotionalCents: 5000,
      maxOrderSizeCents: 100,
      maxDailyLossCents: 100000,
      maxDailySubmittedNotionalCents: 1000000,
      maxYesSharesPerMarket: "300.000000",
      maxNoSharesPerMarket: "300.000000",
      maxOrdersPerMarket: 12,
      maxQuoteLevelsPerSide: 3,
      staleDataMaxAgeMs: 15000,
      pauseNearResolutionMinutes: 0,
      repeatedErrorPauseMs: 30000,
      inventoryReduceOnlyThreshold: 0.85,
      inventoryStopThreshold: 0.98,
      emergencyStopOnInvariantViolation: true,
      emergencyStopOnRepeatedApiErrors: true,
      emergencyStopOnBalanceMismatch: true,
      repeatedApiErrorThreshold: 5,
      repeatedApiErrorWindowMs: 60000,
      repeatedCancelConflictThreshold: 5,
      repeatedStaleStateThreshold: 10,
      cancelOpenOrdersOnPause: false,
      cancelOpenOrdersOnEmergencyStop: true,
    },
  };

  return {
    ...base,
    ...overrides,
    dynamicMarketMaker: {
      ...base.dynamicMarketMaker,
      ...(overrides.dynamicMarketMaker ?? {}),
    },
    risk: {
      ...base.risk,
      ...(overrides.risk ?? {}),
    },
  };
}

async function createUser(usernamePrefix: string, availableUSDC: string) {
  const username = `${usernamePrefix}`.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 24);
  const email = `${username}_${Date.now()}@test.local`;
  const user = await prisma.user.create({
    data: {
      username: `${username}_${Math.random().toString(36).slice(2, 7)}`.slice(0, 30),
      email,
    },
  });
  await prisma.userBalance.create({
    data: {
      userId: user.id,
      availableUSDC,
      lockedUSDC: "0",
    },
  });
  return user;
}

async function createBinaryMarket(slugPrefix: string) {
  return prisma.market.create({
    data: {
      slug: `${slugPrefix}`.slice(0, 100),
      title: slugPrefix,
      description: slugPrefix,
      status: "LIVE",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      kind: "ORDERBOOK",
      type: "BINARY",
      isCanceled: false,
      isListed: true,
      outcomes: {
        create: [
          { name: "YES", slug: `${slugPrefix}-yes`, displayOrder: 0, isActive: true },
          { name: "NO", slug: `${slugPrefix}-no`, displayOrder: 1, isActive: true },
        ],
      },
    },
    include: {
      outcomes: {
        orderBy: [{ displayOrder: "asc" }],
      },
    },
  });
}

async function snapshotMarketUserState(marketId: string, userId: string, yesOutcomeId: string, noOutcomeId: string): Promise<Snapshot> {
  const [balance, market, yesPos, noPos] = await Promise.all([
    prisma.userBalance.findUniqueOrThrow({ where: { userId } }),
    prisma.market.findUniqueOrThrow({ where: { id: marketId } }),
    prisma.position.findUnique({
      where: {
        userId_marketId_outcomeId: {
          userId,
          marketId,
          outcomeId: yesOutcomeId,
        },
      },
    }),
    prisma.position.findUnique({
      where: {
        userId_marketId_outcomeId: {
          userId,
          marketId,
          outcomeId: noOutcomeId,
        },
      },
    }),
  ]);

  return {
    availableUSDC: balance.availableUSDC.toString(),
    lockedUSDC: balance.lockedUSDC.toString(),
    marketCollateralUSDC: market.collateralUSDC.toString(),
    yesShares: yesPos?.shares.toString() ?? "0",
    noShares: noPos?.shares.toString() ?? "0",
    yesReservedShares: yesPos?.reservedShares.toString() ?? "0",
    noReservedShares: noPos?.reservedShares.toString() ?? "0",
  };
}

async function waitForApp() {
  const started = Date.now();
  while (Date.now() - started < 60_000) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // ignore
    }
    await sleep(1_000);
  }
  throw new Error(`App did not become ready at ${BASE_URL}`);
}

function assertLogContains(lines: string[], text: string) {
  assert.ok(lines.some((line) => line.includes(text)), `Missing log text: ${text}`);
}

function assertLogNotContains(lines: string[], text: string) {
  assert.ok(lines.every((line) => !line.includes(text)), `Unexpected log text: ${text}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function compareNumeric(a: string, b: string) {
  return Number(a) - Number(b);
}

function delta(before: string, after: string) {
  return (Number(after) - Number(before)).toFixed(6);
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
