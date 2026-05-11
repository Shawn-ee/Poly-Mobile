import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { API_KEY_SCOPES, createApiCredential, updateApiCredential } from "@/lib/canonicalAuth";
import { applyDeposit } from "@/server/services/ledger";
import { BotRunner } from "../../poly-bot/src/runner/botRunner.js";
import type { BotConfig } from "../../poly-bot/src/config/loadConfig.js";

// Soak-only harness:
// - reuses the poly-bot runtime client and BotRunner
// - also owns reference-book shaping, warmup actors, and manual pressure generation
// - these helpers are intentionally not part of the production bot strategy runtime
// TODO(bot-architecture): extract soak-only helpers into dedicated modules after soak behavior is frozen.

const BASE_URL = process.env.SOAK_BASE_URL ?? "http://127.0.0.1:3000";
const RUN_ID = new Date().toISOString().replace(/[:.]/g, "-");
const LOGS_DIR = path.resolve(process.cwd(), "test-logs");
const LOG_PATH = path.join(LOGS_DIR, `soak-${RUN_ID}.jsonl`);
const SUMMARY_PATH = path.join(LOGS_DIR, `soak-${RUN_ID}.summary.json`);
const BOT_LOGS_DIR = path.join(LOGS_DIR, `soak-${RUN_ID}-bot-logs`);
const TICK = 0.01;

const CFG = {
  durationSeconds: numEnv("SOAK_DURATION_SECONDS", 300),
  numberOfUserBots: numEnv("SOAK_NUMBER_OF_USER_BOTS", 5),
  ordersPerSecond: numEnv("SOAK_ORDERS_PER_SECOND", 2),
  marketMakerCycleMs: numEnv("SOAK_MARKET_MAKER_CYCLE_MS", 2000),
  noiseTraderCycleMs: numEnv("SOAK_NOISE_TRADER_CYCLE_MS", 1000),
  cancelProbability: numEnv("SOAK_CANCEL_PROBABILITY", 0.2),
  aggressiveOrderProbability: numEnv("SOAK_AGGRESSIVE_ORDER_PROBABILITY", 0.35),
  maxOrderSize: decEnv("SOAK_MAX_ORDER_SIZE", "2.000000"),
  randomSeed: process.env.SOAK_RANDOM_SEED ?? `soak-${RUN_ID}`,
  resolveAtEnd: boolEnv("SOAK_RESOLVE_AT_END", true),
  fairValueMode: fairValueModeEnv("SOAK_FAIR_VALUE_MODE", "static"),
  initialYesFair: boundedNumEnv("SOAK_INITIAL_YES_FAIR", 0.8, 0.01, 0.99),
  fairValueVolatility: boundedNumEnv("SOAK_FAIR_VALUE_VOLATILITY", 0.015, 0, 0.2),
  fairValueDrift: boundedNumEnv("SOAK_FAIR_VALUE_DRIFT", 0, -0.1, 0.1),
  fairValueMin: boundedNumEnv("SOAK_FAIR_VALUE_MIN", 0.1, 0.01, 0.99),
  fairValueMax: boundedNumEnv("SOAK_FAIR_VALUE_MAX", 0.95, 0.01, 0.99),
  forceExtremeMint: boolEnv("SOAK_FORCE_EXTREME_MINT", false),
  mmTuningProfile: mmTuningProfileEnv("SOAK_MM_TUNING_PROFILE", "baseline"),
  soakMode: soakModeEnv("SOAK_MODE", "full_synthetic"),
  referenceBookMode: referenceBookModeEnv("SOAK_REFERENCE_BOOK_MODE", "normal"),
};

const RELIABILITY_CFG = {
  healthCheckIntervalMs: numEnv("SOAK_HEALTH_CHECK_INTERVAL_MS", 5000),
  healthTimeoutMs: numEnv("SOAK_HEALTH_TIMEOUT_MS", 3000),
  outageThresholdMs: numEnv("SOAK_APP_OUTAGE_THRESHOLD_MS", 90000),
  retryBaseMs: numEnv("SOAK_RETRY_BASE_MS", 1000),
  retryMaxMs: numEnv("SOAK_RETRY_MAX_MS", 10000),
};

type Actor = {
  userId: string;
  username: string;
  token: string;
  apiKeyId: string;
  kind: "dynamic-mm" | "noise-bot" | "manual" | "seed";
};

type MarketCtx = {
  marketId: string;
  yesOutcomeId: string;
  noOutcomeId: string;
};

type FreshActorState = {
  availableUSDC: number;
  availableShares: number;
};

type FairValueMode = "static" | "random_walk" | "scripted";
type MmTuningProfile = "baseline" | "balanced" | "aggressive_safe" | "selective_competitive" | "safe_competitive";
type SoakMode = "isolated_mm" | "light_reference" | "full_synthetic" | "user_flow";
type ReferenceBookMode = "normal" | "light" | "off";
type SoakModeSettings = {
  mode: SoakMode;
  enableReferenceShaping: boolean;
  referenceBookMode: ReferenceBookMode;
  enableWarmup: boolean;
  enableManualPressure: boolean;
  enableNoiseBots: boolean;
};

type FairValueController = {
  currentYesFair: number;
  currentNoFair: number;
  mode: FairValueMode;
  startedAt: number;
  lastUpdatedAt: number;
  updateIntervalMs: number;
  update(now: number, rng: () => number): { yesFair: number; noFair: number; changed: boolean };
};

type BotLine = {
  ts: string | null;
  level: string | null;
  botName: string | null;
  eventName: string;
  payload: unknown;
  raw: string;
};

type Harness = {
  runCycle(): Promise<BotLine[]>;
  close(): void;
};

type AppHealthState = {
  healthy: boolean;
  lastHealthCheckAt: string | null;
  lastHealthyAt: string | null;
  outageStartedAt: string | null;
  lastError: string | null;
  consecutiveFailures: number;
  retryAttempts: number;
};

type FatalDiagnostics = {
  appHealth: AppHealthState;
  lastSuccessfulApiCallAt: string | null;
  lastSuccessfulApiEndpoint: string | null;
  lastSuccessfulBotEventAt: string | null;
  lastSuccessfulMarketEventAt: string | null;
  lastSuccessfulAccountEventAt: string | null;
  lastSuccessfulPollingSyncAt: string | null;
  transportRetryCount: number;
  botStates: Record<string, unknown>;
  postmortem: Record<string, unknown> | null;
};

const SOAK_MODE = resolveSoakModeSettings();
const APP_HEALTH: {
  healthy: boolean;
  lastHealthCheckAt: number | null;
  lastHealthyAt: number | null;
  outageStartedAt: number | null;
  lastError: string | null;
  consecutiveFailures: number;
  retryAttempts: number;
  lastTransitionLoggedHealthy: boolean | null;
} = {
  healthy: true,
  lastHealthCheckAt: null,
  lastHealthyAt: null,
  outageStartedAt: null,
  lastError: null,
  consecutiveFailures: 0,
  retryAttempts: 0,
  lastTransitionLoggedHealthy: null,
};
const RUN_MONITOR: {
  lastSuccessfulApiCallAt: number | null;
  lastSuccessfulApiEndpoint: string | null;
  lastSuccessfulBotEventAt: number | null;
  lastSuccessfulMarketEventAt: number | null;
  lastSuccessfulAccountEventAt: number | null;
  lastSuccessfulPollingSyncAt: number | null;
  transportRetryCount: number;
  botStates: Map<string, Record<string, unknown>>;
} = {
  lastSuccessfulApiCallAt: null,
  lastSuccessfulApiEndpoint: null,
  lastSuccessfulBotEventAt: null,
  lastSuccessfulMarketEventAt: null,
  lastSuccessfulAccountEventAt: null,
  lastSuccessfulPollingSyncAt: null,
  transportRetryCount: 0,
  botStates: new Map(),
};
const ACTIVE_RUN: {
  market: MarketCtx | null;
  actors: Actor[];
  apiErrors: Map<string, number> | null;
} = {
  market: null,
  actors: [],
  apiErrors: null,
};

async function main() {
  await fs.mkdir(LOGS_DIR, { recursive: true });
  await fs.mkdir(BOT_LOGS_DIR, { recursive: true });
  await waitForApp();
  const rng = makeRng(CFG.randomSeed);
  const apiErrors = new Map<string, number>();
  const invariantViolations: Array<Record<string, unknown>> = [];
  const suspicious = new Set<string>();

  await log({
    kind: "run_start",
    runId: RUN_ID,
    baseUrl: BASE_URL,
    config: buildConfigSummary(),
    soakMode: SOAK_MODE,
  });

  const admin = await createAdmin();
  const market = await createSoakMarket(admin.id, apiErrors);
  const fairValue = createFairValueController();
  const seedSeller = await createActor("soak_seed_seller", "seed", "2000");
  const seedBuyer = await createActor("soak_seed_buyer", "seed", "2000");
  const dynamicMm = await createActor("soak_dynamic_mm", "dynamic-mm", "2000");
  const manualActors = await Promise.all(
    Array.from({ length: 2 }, (_, i) => createActor(`soak_manual_${i + 1}`, "manual", "1500")),
  );
  const noiseActors = await Promise.all(
    Array.from({ length: CFG.numberOfUserBots }, (_, i) => createActor(`soak_noise_${i + 1}`, "noise-bot", "1500")),
  );
  const actorKindByUserId = buildActorKindByUserId([seedSeller, seedBuyer, dynamicMm, ...manualActors, ...noiseActors]);
  ACTIVE_RUN.market = market;
  ACTIVE_RUN.actors = [dynamicMm, ...manualActors, ...noiseActors];
  ACTIVE_RUN.apiErrors = apiErrors;

  await seedInitialState({ market, fairValue, seedSeller, seedBuyer, dynamicMm, manualActors, noiseActors, apiErrors });
  for (const actor of [dynamicMm, ...manualActors, ...noiseActors]) {
    await log({ kind: "initial_account_snapshot", state: await actorSnapshot(actor, market, apiErrors) });
  }
  if (SOAK_MODE.enableWarmup && !CFG.forceExtremeMint) {
    await forceWarmup({ market, seller: manualActors[0], buyerA: manualActors[1], buyerB: seedBuyer, apiErrors });
  } else {
    await log({
      kind: "warmup_skipped",
      reason: CFG.forceExtremeMint ? "force_extreme_mint_mode" : "soak_mode_disabled",
      marketId: market.marketId,
      targetMid: fairValue.currentYesFair,
    });
  }

  const mmHarness = createHarness(dynamicMmConfig(dynamicMm, market));
  const noiseHarnesses = SOAK_MODE.enableNoiseBots
    ? noiseActors.map((actor, i) => createHarness(noiseConfig(actor, market, i)))
    : [];

  let nextMmAt = Date.now();
  let nextNoiseAt = Date.now();
  let nextManualAt = Date.now();
  let nextSnapshotAt = Date.now();
  let nextInvariantAt = Date.now();
  let nextFairValueAt = Date.now();
  let nextHealthCheckAt = Date.now();
  const endAt = Date.now() + CFG.durationSeconds * 1000;
  let finalPreResolveOrderbookState: Awaited<ReturnType<typeof marketSnapshot>> | null = null;
  let finalPreResolveActorStates: Array<Awaited<ReturnType<typeof actorSnapshot>>> = [];

  try {
    while (Date.now() < endAt) {
      const now = Date.now();
      if (now >= nextHealthCheckAt) {
        await checkAppHealth("periodic");
        nextHealthCheckAt = now + RELIABILITY_CFG.healthCheckIntervalMs;
      }
      if (!APP_HEALTH.healthy) {
        await log({
          kind: "submissions_paused_for_unhealthy_app",
          appHealth: serializeAppHealthState(),
        });
        await waitForHealthyApp("main_loop");
        continue;
      }
      if (now >= nextMmAt) {
        await logBotLines(await mmHarness.runCycle(), suspicious);
        nextMmAt = now + CFG.marketMakerCycleMs;
      }
      if (SOAK_MODE.enableNoiseBots && now >= nextNoiseAt) {
        for (const harness of noiseHarnesses) {
          await logBotLines(await harness.runCycle(), suspicious);
        }
        nextNoiseAt = now + CFG.noiseTraderCycleMs;
      }
      if (SOAK_MODE.enableManualPressure && now >= nextManualAt) {
        await manualAction({ rng, fairValue, market, actors: manualActors, apiErrors });
        nextManualAt = now + Math.max(100, Math.floor(1000 / CFG.ordersPerSecond));
      }
      if (now >= nextFairValueAt) {
        const updated = fairValue.update(now, rng);
        if (SOAK_MODE.enableReferenceShaping) {
          await syncReferenceBook({
            market,
            fairValue,
            seedSeller,
            seedBuyer,
            apiErrors,
          });
        }
        await log({
          kind: "fair_value_update",
          mode: fairValue.mode,
          changed: updated.changed,
          yesFair: updated.yesFair,
          noFair: updated.noFair,
        });
        nextFairValueAt = now + fairValue.updateIntervalMs;
      }
      if (now >= nextSnapshotAt) {
        const snapshot = await marketSnapshot(market, apiErrors, actorKindByUserId);
        await log({ kind: "market_snapshot", snapshot });
        if (snapshot.crossedBook) {
          const violation = { code: "CROSSED_BOOK", message: "Observed crossed book after API snapshot.", details: snapshot };
          invariantViolations.push(violation);
          await log({ kind: "invariant_violation", violation });
        }
        for (const actor of [dynamicMm, ...manualActors, ...noiseActors]) {
          await log({ kind: "account_snapshot", state: await actorSnapshot(actor, market, apiErrors) });
        }
        nextSnapshotAt = now + 1000;
      }
      if (now >= nextInvariantAt) {
        for (const violation of await checkInvariants(market)) {
          invariantViolations.push(violation);
          await log({ kind: "invariant_violation", violation });
        }
        const duplicateTape = await detectDuplicateTradeTape(market.marketId, apiErrors);
        if (duplicateTape) {
          suspicious.add(duplicateTape);
          await log({ kind: "suspicious_behavior", message: duplicateTape });
        }
        nextInvariantAt = now + 1000;
      }
      await sleep(100);
    }
  } finally {
    mmHarness.close();
    for (const harness of noiseHarnesses) harness.close();
  }

  finalPreResolveOrderbookState = await marketSnapshot(market, apiErrors, actorKindByUserId);
  finalPreResolveActorStates = await Promise.all(
    [dynamicMm, ...manualActors, ...noiseActors].map((actor) => actorSnapshot(actor, market, apiErrors)),
  );

  const resolveResult = CFG.resolveAtEnd
    ? await resolveMarket(admin.id, market.marketId, market.yesOutcomeId, apiErrors)
    : null;
  if (resolveResult) await log({ kind: "resolve_result", status: resolveResult.status, body: resolveResult.body });

  const summary = await analyze({
    market,
    actors: [dynamicMm, ...manualActors, ...noiseActors],
    apiErrors,
    invariantViolations,
    suspicious,
    resolveResult,
    finalPreResolveOrderbookState,
    finalPreResolveActorStates,
    actorKindByUserId,
  });
  await fs.writeFile(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await log({ kind: "run_complete", summaryPath: SUMMARY_PATH, summary });
  console.log(JSON.stringify(summary, null, 2));
}

async function createAdmin() {
  const username = `soak_admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return prisma.user.create({
    data: { username, email: `${username}@test.local`, isAdmin: true },
    select: { id: true, username: true },
  });
}

async function createActor(prefix: string, kind: Actor["kind"], usdc: string): Promise<Actor> {
  const username = `${prefix}_${Math.random().toString(36).slice(2, 8)}`.slice(0, 30);
  const user = await prisma.user.create({
    data: { username, email: `${username}@test.local`, displayName: username },
    select: { id: true, username: true },
  });
  await applyDeposit({
    eventKey: `soak-fund:${user.id}`,
    userId: user.id,
    amount: usdc,
    chainId: 8453,
    txHash: `0x${crypto.randomBytes(32).toString("hex")}`,
    logIndex: Math.floor(Math.random() * 1000000),
    token: "USDC",
    referenceType: "SOAK",
    referenceId: user.id,
  });
  const created = await createApiCredential({ userId: user.id, name: username, scopes: [...API_KEY_SCOPES] });
  await updateApiCredential({
    userId: user.id,
    id: created.apiKey.id,
    body: {
      isDisabled: false,
      readOnly: false,
      maxOrderSize:
        kind === "seed" ? "1000.000000" :
        kind === "dynamic-mm" ? "500.000000" :
        kind === "manual" ? "10.000000" :
        "5.000000",
      maxOpenOrders: 50,
      maxDailySubmittedNotional: null,
      allowedMarketIds: [],
    },
  });
  return { userId: user.id, username: user.username, token: created.token, apiKeyId: created.apiKey.keyId, kind };
}

async function createSoakMarket(adminUserId: string, apiErrors: Map<string, number>): Promise<MarketCtx> {
  const created = await httpJson(`${BASE_URL}/api/admin/markets/create`, {
    endpoint: "POST /api/admin/markets/create",
    init: {
      method: "POST",
      headers: { Cookie: sessionCookie(adminUserId), "content-type": "application/json" },
      body: JSON.stringify({
        title: `SOAK BOT MARKET ${RUN_ID}`,
        description: `Dev soak market ${RUN_ID}`,
        resolveTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        visibility: "PUBLIC",
        mechanism: "ORDERBOOK",
        type: "BINARY",
        tags: ["soak", "bot", "dev"],
      }),
    },
    apiErrors,
  });
  if (created.status !== 200 || typeof (created.body as { marketId?: string } | null)?.marketId !== "string") {
    throw new Error(`market create failed ${created.status} ${JSON.stringify(created.body)}`);
  }
  const marketId = (created.body as { marketId: string }).marketId;
  const live = await httpJson(`${BASE_URL}/api/admin/markets/pause`, {
    endpoint: "POST /api/admin/markets/pause",
    init: {
      method: "POST",
      headers: { Cookie: sessionCookie(adminUserId), "content-type": "application/json" },
      body: JSON.stringify({ marketId, status: "LIVE" }),
    },
    apiErrors,
  });
  if (live.status !== 200) {
    throw new Error(`market live failed ${live.status} ${JSON.stringify(live.body)}`);
  }
  const market = await prisma.market.findUniqueOrThrow({
    where: { id: marketId },
    include: { outcomes: { orderBy: [{ displayOrder: "asc" }] } },
  });
  return { marketId, yesOutcomeId: market.outcomes[0].id, noOutcomeId: market.outcomes[1].id };
}

async function seedInitialState(input: {
  market: MarketCtx;
  fairValue: FairValueController;
  seedSeller: Actor;
  seedBuyer: Actor;
  dynamicMm: Actor;
  manualActors: Actor[];
  noiseActors: Actor[];
  apiErrors: Map<string, number>;
}) {
  // Soak-only reference inventory bootstrap. Not used by the production bot runtime.
  const { market, fairValue, seedSeller, seedBuyer, dynamicMm, manualActors, noiseActors, apiErrors } = input;
  const referenceSeedQuantity = SOAK_MODE.enableReferenceShaping ? "600" : "100";
  await mintCompleteSets(seedSeller, market.marketId, referenceSeedQuantity, apiErrors);
  await mintCompleteSets(dynamicMm, market.marketId, "40", apiErrors);
  for (const actor of [...manualActors, ...noiseActors]) {
    await mintCompleteSets(actor, market.marketId, "2", apiErrors);
  }
  if (SOAK_MODE.enableReferenceShaping) {
    await syncReferenceBook({
      market,
      fairValue,
      seedSeller,
      seedBuyer,
      apiErrors,
    });
  }
  await log({
    kind: "initial_market_shape_seeded",
    marketId: market.marketId,
    targetMid: fairValue.currentYesFair,
    fairValueMode: fairValue.mode,
    soakMode: SOAK_MODE.mode,
    referenceShapingEnabled: SOAK_MODE.enableReferenceShaping,
  });
}

async function forceWarmup(input: {
  market: MarketCtx;
  seller: Actor;
  buyerA: Actor;
  buyerB: Actor;
  apiErrors: Map<string, number>;
}) {
  // Soak-only warmup flow to guarantee early fills, partials, and cancels in the harness.
  const { market, seller, buyerA, buyerB, apiErrors } = input;
  await mintCompleteSets(seller, market.marketId, "5", apiErrors);
  const restingSell = await submitSoakLimitOrder(seller, { marketId: market.marketId, outcomeId: market.yesOutcomeId, side: "SELL", price: "0.81", size: "1.500000" }, apiErrors, { actorSource: "warmup", allowInventoryMint: false });
  await log({ kind: "warmup_order", scenario: "resting_sell", ...restingSell });
  await log({ kind: "warmup_order", scenario: "partial_fill_buy", ...(await submitSoakLimitOrder(buyerA, { marketId: market.marketId, outcomeId: market.yesOutcomeId, side: "BUY", price: "0.83", size: "0.500000" }, apiErrors, { actorSource: "warmup", allowInventoryMint: false })) });
  const restingSellOrderId = (restingSell.body as { order?: { id?: string } } | null)?.order?.id;
  if (restingSell.status === 200 && restingSellOrderId) {
    const makerAfterPartial = await prisma.order.findUnique({
      where: { id: restingSellOrderId },
      select: {
        id: true,
        marketId: true,
        outcomeId: true,
        side: true,
        price: true,
        amount: true,
        remaining: true,
        reservedNotional: true,
        status: true,
      },
    });
    if (makerAfterPartial) {
      await log({
        kind: "warmup_order_state",
        scenario: "maker_after_partial",
        order: {
          id: makerAfterPartial.id,
          marketId: makerAfterPartial.marketId,
          outcomeId: makerAfterPartial.outcomeId,
          side: makerAfterPartial.side,
          price: makerAfterPartial.price.toString(),
          size: makerAfterPartial.amount.toString(),
          remaining: makerAfterPartial.remaining.toString(),
          reservedNotional: makerAfterPartial.reservedNotional.toString(),
          status: makerAfterPartial.status,
        },
      });
    }
  }
  await log({ kind: "warmup_order", scenario: "full_fill_buy", ...(await submitSoakLimitOrder(buyerB, { marketId: market.marketId, outcomeId: market.yesOutcomeId, side: "BUY", price: "0.83", size: "1.000000" }, apiErrors, { actorSource: "warmup", allowInventoryMint: false })) });
  const cancelMe = await submitSoakLimitOrder(buyerA, { marketId: market.marketId, outcomeId: market.noOutcomeId, side: "BUY", price: "0.10", size: "0.800000" }, apiErrors, { actorSource: "warmup", allowInventoryMint: false });
  const orderId = (cancelMe.body as { order?: { id?: string } } | null)?.order?.id;
  if (cancelMe.status === 200 && orderId) {
    await log({ kind: "warmup_cancel", ...(await cancelExistingOrder(buyerA, orderId, apiErrors)) });
  }
}

async function manualAction(input: {
  rng: () => number;
  fairValue: FairValueController;
  market: MarketCtx;
  actors: Actor[];
  apiErrors: Map<string, number>;
}) {
  // Soak-only manual pressure actor. Kept inline to preserve current harness behavior.
  const actor = pick(input.actors, input.rng);
  const dbState = await actorDbState(actor.userId, input.market);
  const outcomeId = input.rng() < 0.5 ? input.market.yesOutcomeId : input.market.noOutcomeId;
  let side: "BUY" | "SELL" = input.rng() < 0.5 ? "BUY" : "SELL";
  const availableShares = outcomeId === input.market.yesOutcomeId
    ? Math.max(0, Number(dbState.yesShares) - Number(dbState.yesReservedShares))
    : Math.max(0, Number(dbState.noShares) - Number(dbState.noReservedShares));
  if (side === "SELL" && availableShares < 0.05) {
    if (Number(dbState.availableUSDC) >= 1) {
      const quantity = clamp(1 + input.rng() * 2, 1, 3).toFixed(6);
      await log({ kind: "manual_inventory_mint", actor: actor.username, quantity, ...(await mintCompleteSets(actor, input.market.marketId, quantity, input.apiErrors)) });
    }
    side = "BUY";
  }
  const snap = await marketSnapshot(input.market, input.apiErrors);
  const bestBid = outcomeId === input.market.yesOutcomeId ? snap.yesBestBid : snap.noBestBid;
  const bestAsk = outcomeId === input.market.yesOutcomeId ? snap.yesBestAsk : snap.noBestAsk;
  const mid = outcomeId === input.market.yesOutcomeId ? snap.yesMid : snap.noMid;
  const aggressive = input.rng() < CFG.aggressiveOrderProbability;
  const siblingBestBid = outcomeId === input.market.yesOutcomeId ? snap.noBestBid : snap.yesBestBid;
  const siblingBestAsk = outcomeId === input.market.yesOutcomeId ? snap.noBestAsk : snap.yesBestAsk;
  const fairAnchor = outcomeId === input.market.yesOutcomeId
    ? input.fairValue.currentYesFair
    : input.fairValue.currentNoFair;
  const price = adjustManualPriceForBinaryInvariant(
    manualPrice(side, bestBid, bestAsk, mid, fairAnchor, aggressive),
    side,
    siblingBestBid,
    siblingBestAsk,
  );
  const size = (
    side === "SELL"
      ? clamp(0.1 + input.rng() * Math.max(0.1, Math.min(Number(CFG.maxOrderSize), availableShares || Number(CFG.maxOrderSize))), 0.1, Math.max(0.1, Math.min(Number(CFG.maxOrderSize), availableShares || Number(CFG.maxOrderSize))))
      : clamp(0.1 + input.rng() * Number(CFG.maxOrderSize), 0.1, Number(CFG.maxOrderSize))
  ).toFixed(6);
  const result = await submitSoakLimitOrder(actor, { marketId: input.market.marketId, outcomeId, side, price, size }, input.apiErrors, { actorSource: "manual", allowInventoryMint: false });
  const order = (result.body as { order?: { id?: string; status?: string; remaining?: string }; fills?: unknown[] } | null)?.order;
  await log({
    kind: "manual_order_result",
    actor: actor.username,
    actorId: actor.userId,
    endpoint: "POST /api/orders",
    accepted: result.status === 200,
    rejected: result.status > 0 && result.status !== 200,
    side,
    outcomeId,
    price,
    size,
    requestedSize: result.requestedSize,
    finalCappedSize: result.finalSize,
    availableUSDC: result.availableUSDC,
    availableShares: result.availableShares,
    preSubmitSkipped: result.skipped ?? false,
    preSubmitSkipReason: result.skipReason ?? null,
    aggressive,
    status: result.status,
    orderStatus: order?.status ?? null,
    remainingQuantity: order?.remaining ?? null,
    fillsCreated: Array.isArray((result.body as { fills?: unknown[] } | null)?.fills) ? ((result.body as { fills?: unknown[] }).fills?.length ?? 0) : 0,
    body: result.body,
  });
  if (result.status === 200 && order?.id && (order.status === "OPEN" || order.status === "PARTIAL") && input.rng() < CFG.cancelProbability) {
    await log({ kind: "manual_cancel_result", actor: actor.username, endpoint: "DELETE /api/orders/:id", orderId: order.id, ...(await cancelExistingOrder(actor, order.id, input.apiErrors)) });
  }
}

async function mintCompleteSets(actor: Actor, marketId: string, quantity: string, apiErrors?: Map<string, number>) {
  return httpJson(`${BASE_URL}/api/orderbook/${marketId}/mint`, {
    endpoint: "POST /api/orderbook/:marketId/mint",
    init: { method: "POST", headers: { Authorization: `Bearer ${actor.token}`, "content-type": "application/json" }, body: JSON.stringify({ quantity }) },
    apiErrors,
  });
}

async function placeLimitOrder(actor: Actor, body: { marketId: string; outcomeId: string; side: "BUY" | "SELL"; price: string; size: string }, apiErrors?: Map<string, number>) {
  return httpJson(`${BASE_URL}/api/orders`, {
    endpoint: "POST /api/orders",
    init: {
      method: "POST",
      headers: { Authorization: `Bearer ${actor.token}`, "content-type": "application/json", "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify({ ...body, type: "LIMIT" }),
    },
    apiErrors,
  });
}

async function cancelExistingOrder(actor: Actor, orderId: string, apiErrors?: Map<string, number>) {
  return httpJson(`${BASE_URL}/api/orders/${orderId}`, {
    endpoint: "DELETE /api/orders/:id",
    init: { method: "DELETE", headers: { Authorization: `Bearer ${actor.token}` } },
    apiErrors,
  });
}

async function resolveMarket(adminUserId: string, marketId: string, winningOutcomeId: string, apiErrors?: Map<string, number>) {
  return httpJson(`${BASE_URL}/api/admin/markets/resolve`, {
    endpoint: "POST /api/admin/markets/resolve",
    init: {
      method: "POST",
      headers: { Cookie: sessionCookie(adminUserId), "content-type": "application/json" },
      body: JSON.stringify({ marketId, winningOutcomeId }),
    },
    apiErrors,
  });
}

async function syncReferenceBook(input: {
  market: MarketCtx;
  fairValue: FairValueController;
  seedSeller: Actor;
  seedBuyer: Actor;
  apiErrors: Map<string, number>;
}) {
  // Soak-only reference book reshaper. This scaffolds the market and is not a runtime strategy.
  const { market, fairValue, seedSeller, seedBuyer, apiErrors } = input;
  await clearActorOrdersForMarket(seedSeller, market.marketId, apiErrors);
  await clearActorOrdersForMarket(seedBuyer, market.marketId, apiErrors);
  const referenceSize = SOAK_MODE.referenceBookMode === "light" ? "12.000000" : "40.000000";

  const yesBid = toTick(fairValue.currentYesFair - 0.01);
  const yesAsk = toTick(fairValue.currentYesFair + 0.01);
  const noBid = toTick(fairValue.currentNoFair - 0.01);
  const noAsk = toTick(fairValue.currentNoFair + 0.01);

  await submitSoakLimitOrder(seedSeller, { marketId: market.marketId, outcomeId: market.yesOutcomeId, side: "SELL", price: yesAsk, size: referenceSize }, apiErrors, { actorSource: "reference_book", allowInventoryMint: false });
  await submitSoakLimitOrder(seedSeller, { marketId: market.marketId, outcomeId: market.noOutcomeId, side: "SELL", price: noAsk, size: referenceSize }, apiErrors, { actorSource: "reference_book", allowInventoryMint: false });
  await submitSoakLimitOrder(seedBuyer, { marketId: market.marketId, outcomeId: market.yesOutcomeId, side: "BUY", price: yesBid, size: referenceSize }, apiErrors, { actorSource: "reference_book", allowInventoryMint: false });
  await submitSoakLimitOrder(seedBuyer, { marketId: market.marketId, outcomeId: market.noOutcomeId, side: "BUY", price: noBid, size: referenceSize }, apiErrors, { actorSource: "reference_book", allowInventoryMint: false });
}

async function clearActorOrdersForMarket(actor: Actor, marketId: string, apiErrors: Map<string, number>) {
  const response = await httpJson(
    `${BASE_URL}/api/orders?marketId=${encodeURIComponent(marketId)}&status=OPEN&status=PARTIAL&limit=100`,
    {
      endpoint: "GET /api/orders",
      init: { headers: { Authorization: `Bearer ${actor.token}` } },
      apiErrors,
    },
  );

  if (response.status !== 200) {
    return;
  }

  const orders = ((((response.body ?? {}) as { items?: Array<{ id: string }> }).items) ?? []);
  for (const order of orders) {
    await cancelExistingOrder(actor, order.id, apiErrors);
  }
}

async function actorSnapshot(actor: Actor, market: MarketCtx, apiErrors: Map<string, number>) {
  const headers = { Authorization: `Bearer ${actor.token}` };
  const [balance, positions, orders, fills] = await Promise.all([
    httpJson(`${BASE_URL}/api/account/balance`, { endpoint: "GET /api/account/balance", init: { headers }, apiErrors }),
    httpJson(`${BASE_URL}/api/account/positions?marketId=${encodeURIComponent(market.marketId)}`, { endpoint: "GET /api/account/positions", init: { headers }, apiErrors }),
    httpJson(`${BASE_URL}/api/orders?marketId=${encodeURIComponent(market.marketId)}&status=OPEN&status=PARTIAL&limit=100`, { endpoint: "GET /api/orders", init: { headers }, apiErrors }),
    httpJson(`${BASE_URL}/api/fills?marketId=${encodeURIComponent(market.marketId)}&limit=100`, { endpoint: "GET /api/fills", init: { headers }, apiErrors }),
  ]);
  const balanceBody = (balance.body ?? {}) as { availableUSDC?: string; lockedUSDC?: string };
  const items = (((positions.body ?? {}) as { items?: Array<{ outcomeId: string; shares?: string; reservedShares?: string }> }).items ?? []);
  const yes = items.find((item) => item.outcomeId === market.yesOutcomeId);
  const no = items.find((item) => item.outcomeId === market.noOutcomeId);
  const orderItems = (((orders.body ?? {}) as { items?: unknown[]; orders?: unknown[] }).items ?? ((orders.body ?? {}) as { orders?: unknown[] }).orders ?? []);
  const fillItems = (((fills.body ?? {}) as { items?: unknown[]; fills?: unknown[] }).items ?? ((fills.body ?? {}) as { fills?: unknown[] }).fills ?? []);
  return {
    actor: { userId: actor.userId, username: actor.username, kind: actor.kind },
    availableUSDC: balanceBody.availableUSDC ?? null,
    lockedUSDC: balanceBody.lockedUSDC ?? null,
    yesShares: yes?.shares ?? "0",
    yesReservedShares: yes?.reservedShares ?? "0",
    noShares: no?.shares ?? "0",
    noReservedShares: no?.reservedShares ?? "0",
    openOrderCount: orderItems.length,
    fillCount: fillItems.length,
  };
}

async function marketSnapshot(market: MarketCtx, apiErrors: Map<string, number>, actorKindByUserId: Map<string, Actor["kind"]> = new Map()) {
  const [book, trades, activeOrderCount, recentFillsCount] = await Promise.all([
    httpJson(`${BASE_URL}/api/orderbook/${market.marketId}/book`, { endpoint: "GET /api/orderbook/:marketId/book", apiErrors }),
    httpJson(`${BASE_URL}/api/markets/${market.marketId}/trades`, { endpoint: "GET /api/markets/:id/trades", apiErrors }),
    prisma.order.count({ where: { marketId: market.marketId, status: { in: ["OPEN", "PARTIAL"] } } }),
    prisma.fill.count({ where: { marketId: market.marketId } }),
  ]);
  const bids = (((book.body ?? {}) as { bids?: Array<{ outcomeId: string; price: number }> }).bids ?? []);
  const asks = (((book.body ?? {}) as { asks?: Array<{ outcomeId: string; price: number }> }).asks ?? []);
  const yesBestBid = maxPrice(bids.filter((row) => row.outcomeId === market.yesOutcomeId));
  const yesBestAsk = minPrice(asks.filter((row) => row.outcomeId === market.yesOutcomeId));
  const noBestBid = maxPrice(bids.filter((row) => row.outcomeId === market.noOutcomeId));
  const noBestAsk = minPrice(asks.filter((row) => row.outcomeId === market.noOutcomeId));
  const crossedBook =
    (yesBestBid !== null && yesBestAsk !== null && yesBestBid > yesBestAsk) ||
    (noBestBid !== null && noBestAsk !== null && noBestBid > noBestAsk);
  const [yesBidOwner, yesAskOwner, noBidOwner, noAskOwner] = await Promise.all([
    topOrder(market.marketId, market.yesOutcomeId, "BUY", "desc", actorKindByUserId),
    topOrder(market.marketId, market.yesOutcomeId, "SELL", "asc", actorKindByUserId),
    topOrder(market.marketId, market.noOutcomeId, "BUY", "desc", actorKindByUserId),
    topOrder(market.marketId, market.noOutcomeId, "SELL", "asc", actorKindByUserId),
  ]);
  const crossedDiagnostics = crossedBook ? await loadCrossedBookDiagnostics(market, actorKindByUserId) : null;
  return {
    marketId: market.marketId,
    yesBestBid,
    yesBestAsk,
    noBestBid,
    noBestAsk,
    yesSpread: yesBestBid !== null && yesBestAsk !== null ? yesBestAsk - yesBestBid : null,
    noSpread: noBestBid !== null && noBestAsk !== null ? noBestAsk - noBestBid : null,
    yesMid: yesBestBid !== null && yesBestAsk !== null ? round2((yesBestBid + yesBestAsk) / 2) : null,
    noMid: noBestBid !== null && noBestAsk !== null ? round2((noBestBid + noBestAsk) / 2) : null,
    activeOrderCount,
    recentTradesCount: ((((trades.body ?? {}) as { trades?: unknown[] }).trades) ?? []).length,
    recentFillsCount,
    crossedBook,
    crossedDiagnostics,
    topOfBookActors: {
      yesBid: yesBidOwner?.actorKind ?? null,
      yesAsk: yesAskOwner?.actorKind ?? null,
      noBid: noBidOwner?.actorKind ?? null,
      noAsk: noAskOwner?.actorKind ?? null,
    },
  };
}

async function loadCrossedBookDiagnostics(market: MarketCtx, actorKindByUserId: Map<string, Actor["kind"]> = new Map()) {
  const [yesBid, yesAsk, noBid, noAsk] = await Promise.all([
    topOrder(market.marketId, market.yesOutcomeId, "BUY", "desc", actorKindByUserId),
    topOrder(market.marketId, market.yesOutcomeId, "SELL", "asc", actorKindByUserId),
    topOrder(market.marketId, market.noOutcomeId, "BUY", "desc", actorKindByUserId),
    topOrder(market.marketId, market.noOutcomeId, "SELL", "asc", actorKindByUserId),
  ]);

  return {
    yes: { bestBid: yesBid, bestAsk: yesAsk },
    no: { bestBid: noBid, bestAsk: noAsk },
  };
}

async function checkInvariants(market: MarketCtx) {
  const violations: Array<Record<string, unknown>> = [];
  const [balances, positions, orders, marketRow, sums] = await Promise.all([
    prisma.userBalance.findMany({ where: { user: { username: { startsWith: "soak_" } } }, include: { user: { select: { username: true } } } }),
    prisma.position.findMany({ where: { marketId: market.marketId }, include: { user: { select: { username: true } } } }),
    prisma.order.findMany({ where: { marketId: market.marketId } }),
    prisma.market.findUniqueOrThrow({ where: { id: market.marketId }, select: { collateralUSDC: true } }),
    prisma.position.groupBy({ by: ["outcomeId"], where: { marketId: market.marketId }, _sum: { shares: true } }),
  ]);
  for (const balance of balances) {
    if (new Prisma.Decimal(balance.availableUSDC).lt(0)) violations.push({ code: "NEGATIVE_AVAILABLE_USDC", message: `Negative availableUSDC for ${balance.user.username}` });
    if (new Prisma.Decimal(balance.lockedUSDC).lt(0)) violations.push({ code: "NEGATIVE_LOCKED_USDC", message: `Negative lockedUSDC for ${balance.user.username}` });
  }
  for (const position of positions) {
    const shares = new Prisma.Decimal(position.shares);
    const reserved = new Prisma.Decimal(position.reservedShares);
    if (shares.lt(0)) violations.push({ code: "NEGATIVE_SHARES", message: `Negative shares for ${position.user.username}` });
    if (reserved.lt(0)) violations.push({ code: "NEGATIVE_RESERVED_SHARES", message: `Negative reservedShares for ${position.user.username}` });
    if (reserved.gt(shares)) violations.push({ code: "RESERVED_GT_SHARES", message: `reservedShares exceeds shares for ${position.user.username}` });
  }
  for (const order of orders) {
    const remaining = new Prisma.Decimal(order.remaining);
    if (remaining.lt(0)) violations.push({ code: "NEGATIVE_ORDER_REMAINING", message: `Negative remaining for ${order.id}` });
    if (order.status === "FILLED" && remaining.gt(0)) violations.push({ code: "FILLED_WITH_REMAINING", message: `FILLED has remaining for ${order.id}` });
    if ((order.status === "OPEN" || order.status === "PARTIAL") && remaining.lte(0)) violations.push({ code: "OPEN_WITHOUT_REMAINING", message: `OPEN/PARTIAL without remaining for ${order.id}` });
  }
  const maxClaim = sums.reduce((max, row) => Math.max(max, Number(row._sum.shares ?? 0)), 0);
  if (Number(marketRow.collateralUSDC) + 1e-9 < maxClaim) {
    violations.push({ code: "COLLATERAL_LT_MAX_CLAIM", message: "Market collateral is below outstanding winning-side claim.", details: { collateralUSDC: marketRow.collateralUSDC.toString(), maxOutstandingOutcomeShares: maxClaim.toFixed(6) } });
  }
  return violations;
}

async function detectDuplicateTradeTape(marketId: string, apiErrors: Map<string, number>) {
  const response = await httpJson(`${BASE_URL}/api/markets/${marketId}/trades`, { endpoint: "GET /api/markets/:id/trades", apiErrors });
  if (response.status !== 200) return null;
  const trades = ((((response.body ?? {}) as { trades?: Array<{ outcome?: string; createdAt?: string; shares?: number; cost?: number }> }).trades) ?? []);
  const seen = new Set<string>();
  for (const trade of trades) {
    const key = `${trade.outcome}:${trade.createdAt}:${trade.shares}:${trade.cost}`;
    if (seen.has(key)) return "Public recent trades appears to expose duplicate rows for a single execution signature.";
    seen.add(key);
  }
  return null;
}

async function analyze(input: { market: MarketCtx; actors: Actor[]; actorKindByUserId: Map<string, Actor["kind"]>; apiErrors: Map<string, number>; invariantViolations: Array<Record<string, unknown>>; suspicious: Set<string>; resolveResult: { status: number; body: unknown } | null; finalPreResolveOrderbookState: Awaited<ReturnType<typeof marketSnapshot>> | null; finalPreResolveActorStates: Array<Awaited<ReturnType<typeof actorSnapshot>>>; }) {
  const events = (await fs.readFile(LOG_PATH, "utf8")).split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as Record<string, unknown>);
  const finalOrderbookState = input.finalPreResolveOrderbookState ?? await marketSnapshot(input.market, new Map(), input.actorKindByUserId);
  const finalBalancesSummary = input.finalPreResolveActorStates.length > 0 ? input.finalPreResolveActorStates : await Promise.all(input.actors.map((actor) => actorSnapshot(actor, input.market, new Map())));
  const apiErrorEvents = events.filter((event) => event.kind === "api_error");
  const marketSnapshots = events
    .filter((event) => event.kind === "market_snapshot" && isRecord(event.snapshot))
    .map((event) => event.snapshot as Record<string, unknown>);
  const yesMids = marketSnapshots
    .map((snapshot) => (typeof snapshot.yesMid === "number" ? snapshot.yesMid : null))
    .filter((value): value is number => value !== null);
  const yesSpreads = marketSnapshots
    .map((snapshot) => (typeof snapshot.yesSpread === "number" ? snapshot.yesSpread : null))
    .filter((value): value is number => value !== null);
  const activeOrderCounts = marketSnapshots
    .map((snapshot) => (typeof snapshot.activeOrderCount === "number" ? snapshot.activeOrderCount : null))
    .filter((value): value is number => value !== null);
  const topOfBookActorSnapshots = marketSnapshots
    .map((snapshot) => (isRecord(snapshot.topOfBookActors) ? snapshot.topOfBookActors : null))
    .filter((value): value is Record<string, unknown> => value !== null);
  const crossedSnapshotCount = marketSnapshots.filter((snapshot) => snapshot.crossedBook === true).length;
  const mmActor = input.actors.find((actor) => actor.kind === "dynamic-mm") ?? null;
  const mmBotName = mmActor ? `${mmActor.username}-dynamic-mm` : null;
  const mmEvents = events.filter((event) => event.kind === "bot_cycle_log" && event.botName === mmBotName);
  const initialSnapshots = events
    .filter((event) => event.kind === "initial_account_snapshot" && isRecord(event.state))
    .map((event) => event.state as Record<string, unknown>);
  const mmInitialSnapshot = initialSnapshots.find((state) => isRecord(state.actor) && state.actor.username === mmActor?.username) ?? null;
  const mmFinalSnapshot = finalBalancesSummary.find((state) => state.actor.username === mmActor?.username) ?? null;
  const totalOrdersSubmitted = events.filter((e) => e.kind === "manual_order_result" && e.preSubmitSkipped !== true).length + events.filter((e) => e.kind === "bot_cycle_log" && e.eventName === "order_submission").length;
  const totalAccepted = events.filter((e) => e.kind === "manual_order_result" && e.accepted === true).length + events.filter((e) => e.kind === "bot_cycle_log" && e.eventName === "order_submitted").length;
  const totalRejected = events.filter((e) => e.kind === "manual_order_result" && e.rejected === true).length + events.filter((e) => e.kind === "bot_cycle_log" && e.eventName === "error" && e.stage === "place_order").length;
  const cancellations = events.filter((e) => e.kind === "manual_cancel_result" && e.status === 200).length + events.filter((e) => e.kind === "warmup_cancel" && e.status === 200).length + events.filter((e) => e.kind === "bot_cycle_log" && e.eventName === "order_canceled").length;
  const mintReplenishments = events.filter((e) => e.kind === "bot_cycle_log" && e.eventName === "mint_replenishment_success").length;
  const partialFillsCount = events.filter((event) => extractOrderStatus(event) === "PARTIAL").length;
  const fullFillsCount = events.filter((event) => extractOrderStatus(event) === "FILLED").length;
  const mmOrdersPlaced = mmEvents.filter((event) => event.eventName === "order_submitted").length;
  const mmOrdersCanceled = mmEvents.filter((event) => event.eventName === "order_canceled").length;
  const mmFills = mmEvents.filter((event) => event.eventName === "fill_seen").length;
  const mmMintEvents = mmEvents.filter((event) => event.eventName === "mint_replenishment_success");
  const mmExtremeMintCount = mmMintEvents.filter((event) => isRecord(event.payload) && event.payload.isExtremeMarket === true).length;
  const mmMintedTotal = mmMintEvents.reduce((sum, event) => sum + numericString(isRecord(event.payload) ? event.payload.finalMintAmount : null), 0);
  const mmQuoteSeenEvents = mmEvents.filter((event) => event.eventName === "quote_seen");
  const mmDecisionEvents = mmEvents.filter((event) => event.eventName === "decision_made");
  const mmSkippedEvents = mmEvents.filter((event) => event.eventName === "order_submit_skipped");
  const mmSubmittedLifecycle = buildMmSubmittedOrderLifecycle(mmEvents, lastLoggedTimestamp(events));
  const mmQuoteDiagnostics = analyzeMmQuoteDiagnostics(mmEvents);
  const fillAttribution = await analyzeFillAttribution(input.market.marketId, input.actorKindByUserId);
  const bookOwnershipMetrics = analyzeBookOwnership(topOfBookActorSnapshots, mmQuoteDiagnostics);
  const mmTouchMetrics = analyzeMmTouchMetrics(input.market, marketSnapshots, mmEvents);
  const mmAverageSpread = average(
    mmQuoteSeenEvents
      .map((event) => {
        const bestBid = numOrNull(isRecord(event.payload) ? event.payload.bestBid : null);
        const bestAsk = numOrNull(isRecord(event.payload) ? event.payload.bestAsk : null);
        return bestBid !== null && bestAsk !== null ? round4(bestAsk - bestBid) : null;
      })
      .filter((value): value is number => value !== null),
  );
  const mmAverageDistanceFromMidTicks = average(
    mmDecisionEvents
      .map((event) => {
        const price = numOrNull(event.price);
        const midpoint = numOrNull(event.midpoint ?? (isRecord(event.payload) ? event.payload.midpoint : null));
        return price !== null && midpoint !== null ? Math.abs(price - midpoint) / TICK : null;
      })
      .filter((value): value is number => value !== null),
  );
  const mmAverageQuotedSize = average(
    mmEvents
      .filter((event) => event.eventName === "order_submitted")
      .map((event) => numOrNull(isRecord(event.order) ? event.order.remaining ?? event.order.size : event.size))
      .filter((value): value is number => value !== null),
  );
  const mmQuoteLagEvents = mmEvents.filter(
    (event) =>
      event.eventName === "order_canceled" &&
      (event.reason === "stale_order_cleanup" || event.reason === "side_order_limit_cleanup"),
  ).length;
  const mmUnsafeQuoteSkips = mmSkippedEvents.filter((event) => {
    const reason = typeof event.reason === "string" ? event.reason : "";
    return reason.includes("inventory") || reason.includes("capacity") || reason.includes("afford") || reason.includes("paused");
  }).length;
  const mmInvariantSkips = mmSkippedEvents.filter((event) => {
    const reason = typeof event.reason === "string" ? event.reason : "";
    return reason.includes("invariant");
  }).length;
  const apiErrorsByEndpoint = Object.fromEntries(input.apiErrors.entries());
  const actorSkipCounts = countByReason(
    events.filter((event) => event.kind === "actor_pre_submit_skip"),
    (event) => (typeof event.reason === "string" ? event.reason : "unknown_skip"),
  );
  const orderErrorReasons = countByReason(
    apiErrorEvents.filter((event) => event.endpoint === "POST /api/orders"),
    (event) => classifyOrderApiErrorReason(event.body),
  );
  const postResolutionState = await loadPostResolutionState(input.market, input.actors);
  const topIssues = [
    ...input.invariantViolations.slice(0, 4).map((v) => `${String(v.code)}: ${String(v.message)}`),
    ...Array.from(input.suspicious).slice(0, 3),
    ...Array.from(input.apiErrors.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([endpoint, count]) => `API errors on ${endpoint}: ${count}`),
  ].slice(0, 10);
  return {
    runId: RUN_ID,
    config: buildConfigSummary(),
    soakMode: SOAK_MODE,
    market: input.market,
    totalOrdersSubmitted,
    totalAccepted,
    totalRejected,
    totalFills: await prisma.fill.count({ where: { marketId: input.market.marketId } }),
    partialFillsCount,
    fullFillsCount,
    cancellations,
    mintReplenishments,
    fillRatio: ratio(await prisma.fill.count({ where: { marketId: input.market.marketId } }), totalOrdersSubmitted),
    cancelRatio: ratio(cancellations, totalOrdersSubmitted),
    finalBalancesSummary,
    finalPositionsSummary: finalBalancesSummary,
    finalOrderbookState,
    priceMovement: {
      minYesMid: yesMids.length > 0 ? round2(Math.min(...yesMids)) : null,
      maxYesMid: yesMids.length > 0 ? round2(Math.max(...yesMids)) : null,
      averageYesMid: yesMids.length > 0 ? round2(yesMids.reduce((sum, value) => sum + value, 0) / yesMids.length) : null,
      finalYesMid: finalOrderbookState.yesMid,
    },
    marketMakerSummary: {
      botName: mmBotName,
      ordersPlaced: mmOrdersPlaced,
      ordersCanceled: mmOrdersCanceled,
      fillsSeen: mmFills,
      cancelRatio: ratio(mmOrdersCanceled, mmOrdersPlaced),
      fillRatio: ratio(mmFills, mmOrdersPlaced),
      restingOrderAverageAgeMs: round2OrNull(average(mmSubmittedLifecycle.openAgesMs)),
      canceledOrderAverageAgeMs: round2OrNull(average(mmSubmittedLifecycle.canceledAgesMs)),
      averageSpread: round4OrNull(mmAverageSpread),
      averageDistanceFromMidTicks: round4OrNull(mmAverageDistanceFromMidTicks),
      averageQuotedSize: round4OrNull(mmAverageQuotedSize),
      quoteLagEvents: mmQuoteLagEvents,
      unsafeQuoteSkips: mmUnsafeQuoteSkips,
      invariantSkips: mmInvariantSkips,
      fillsAgainstReferenceActors: fillAttribution.mmAgainstReferenceActors,
      fillsAgainstNoiseTraders: fillAttribution.mmAgainstNoiseActors,
      fillsAgainstManualActors: fillAttribution.mmAgainstManualActors,
      fillsAgainstRealMm: fillAttribution.fillsAgainstRealMm,
      fillsAgainstNoise: fillAttribution.mmAgainstNoiseActors,
      fillsAgainstManual: fillAttribution.mmAgainstManualActors,
      fillsAgainstReference: fillAttribution.mmAgainstReferenceActors,
      touchOwnershipRatio: round4OrNull(mmTouchMetrics.mmTouchOwnershipRatio),
      bestBidCount: mmTouchMetrics.mmBestBidCount,
      bestAskCount: mmTouchMetrics.mmBestAskCount,
      joinedTouchCount: mmTouchMetrics.mmJoinedTouchCount,
      improvedTouchCount: mmTouchMetrics.mmImprovedTouchCount,
      behindReferenceCount: mmTouchMetrics.mmBehindReferenceCount,
      distanceFromTouchTicks: round4OrNull(mmTouchMetrics.mmDistanceFromTouchTicks),
      wasBestBidCount: mmQuoteDiagnostics.wasBestBidCount,
      wasBestAskCount: mmQuoteDiagnostics.wasBestAskCount,
      atTouchRatio: ratio(mmQuoteDiagnostics.atTouchCount, mmOrdersPlaced),
      insideSpreadCount: mmQuoteDiagnostics.insideSpreadCount,
      behindOtherOrdersCount: mmQuoteDiagnostics.behindOtherOrdersCount,
      queuePriorityEstimate: round4OrNull(bookOwnershipMetrics.mmQueuePriorityEstimate),
      orderAgeBeforeFillMs: round2OrNull(average(mmSubmittedLifecycle.fillAgesMs)),
      orderAgeBeforeCancelMs: round2OrNull(average(mmSubmittedLifecycle.canceledAgesMs)),
      inventoryStart: mmInitialSnapshot,
      inventoryEnd: mmFinalSnapshot,
      mintCount: mmMintEvents.length,
      extremeMintCount: mmExtremeMintCount,
      mintedTotal: mmMintedTotal.toFixed(6),
    },
    bookQuality: {
      averageYesSpread: yesSpreads.length > 0 ? round2(yesSpreads.reduce((sum, value) => sum + value, 0) / yesSpreads.length) : null,
      minYesSpread: yesSpreads.length > 0 ? round2(Math.min(...yesSpreads)) : null,
      maxYesSpread: yesSpreads.length > 0 ? round2(Math.max(...yesSpreads)) : null,
      averageActiveOrderCount: activeOrderCounts.length > 0 ? round2(activeOrderCounts.reduce((sum, value) => sum + value, 0) / activeOrderCounts.length) : null,
      maxActiveOrderCount: activeOrderCounts.length > 0 ? Math.max(...activeOrderCounts) : null,
      crossedSnapshotCount,
      invariantViolationCount: input.invariantViolations.length,
      touchTimeWithoutReference: round4OrNull(bookOwnershipMetrics.touchTimeWithoutReference),
      referenceBookCrowdingRatio: round4OrNull(bookOwnershipMetrics.referenceBookCrowdingRatio),
    },
    realismAttribution: {
      fillsAgainstReferenceActors: fillAttribution.fillsAgainstReferenceActors,
      fillsAgainstNoiseTraders: fillAttribution.fillsAgainstNoiseActors,
      fillsAgainstManualActors: fillAttribution.fillsAgainstManualActors,
      fillsAgainstRealMm: fillAttribution.fillsAgainstRealMm,
      mmTouchOwnershipRatio: round4OrNull(mmTouchMetrics.mmTouchOwnershipRatio),
      mmBestBidCount: mmTouchMetrics.mmBestBidCount,
      mmBestAskCount: mmTouchMetrics.mmBestAskCount,
      mmJoinedTouchCount: mmTouchMetrics.mmJoinedTouchCount,
      mmImprovedTouchCount: mmTouchMetrics.mmImprovedTouchCount,
      mmBehindReferenceCount: mmTouchMetrics.mmBehindReferenceCount,
      mmDistanceFromTouchTicks: round4OrNull(mmTouchMetrics.mmDistanceFromTouchTicks),
      referenceBookCrowdingRatio: round4OrNull(bookOwnershipMetrics.referenceBookCrowdingRatio),
      touchTimeWithoutReference: round4OrNull(bookOwnershipMetrics.touchTimeWithoutReference),
      mmQueuePriorityEstimate: round4OrNull(bookOwnershipMetrics.mmQueuePriorityEstimate),
    },
    lifecycleSummary: postResolutionState,
    actorPreSubmitSkipsByReason: actorSkipCounts,
    orderSubmitErrorsByReason: orderErrorReasons,
    invariantViolations: input.invariantViolations,
    apiErrorsByEndpoint,
    suspiciousBehavior: Array.from(input.suspicious),
    topIssues: topIssues.length > 0 ? topIssues : ["No invariant-breaking issue was detected in this run."],
    resolveResult: input.resolveResult,
  };
}

function dynamicMmConfig(actor: Actor, market: MarketCtx): BotConfig {
  // System-liquidity bot config used by the soak harness.
  const profile = mmTuningProfileSettings(CFG.mmTuningProfile);
  return {
    name: `${actor.username}-dynamic-mm`,
    baseUrl: BASE_URL,
    apiKey: actor.token,
    strategy: "dynamicMarketMaker",
    marketIds: [market.marketId],
    pollIntervalMs: 2000,
    loopIntervalMinMs: 1000,
    loopIntervalMaxMs: 1500,
    maxOrderSize: "1.250000",
    maxTakerSize: "0.250000",
    maxOpenOrders: 10,
    staleOrderMs: profile.staleOrderMs,
    minQuoteLifetimeMs: profile.minQuoteLifetimeMs,
    decisionCooldownMs: 1200,
    capBackoffMs: 8000,
    tickSize: "0.01",
    maxPositionShares: "500.000000",
    inventoryTargetShares: "1.000000",
    targetSpreadTicks: 2,
    quoteOffsetMinTicks: 0,
    quoteOffsetMaxTicks: 1,
    staleDistanceTicks: profile.staleDistanceTicks,
    replaceThresholdTicks: profile.replaceThresholdTicks,
    replaceHysteresisTicks: profile.replaceHysteresisTicks,
    maxOrdersPerSide: 3,
    takerProbability: 0.02,
    takerThresholdTicks: 1,
    inventorySkewStrength: 3,
    fallbackFairPrice: "0.50",
    dailyNotionalPauseMode: "pause_for_run",
    dailyNotionalCooldownMs: 86400000,
    pausedPollIntervalMs: 45000,
    pauseLogIntervalMs: 60000,
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
      quoteKeepBandTicks: profile.quoteKeepBandTicks,
      quoteKeepSizeToleranceRatio: profile.quoteKeepSizeToleranceRatio,
      normalMarketTightenTicks: profile.normalMarketTightenTicks,
      selectiveCompetitiveTicks: profile.selectiveCompetitiveTicks,
      selectiveCompetitiveSizeBumpRatio: profile.selectiveCompetitiveSizeBumpRatio,
      selectiveCompetitiveMaxInventoryImbalance: profile.selectiveCompetitiveMaxInventoryImbalance,
      selectiveCompetitiveMinAvailableUSDC: profile.selectiveCompetitiveMinAvailableUSDC,
      selectiveCompetitiveRecentLagLimit: profile.selectiveCompetitiveRecentLagLimit,
      safeCompetitiveJoinTouchBothSides: profile.safeCompetitiveJoinTouchBothSides,
      safeCompetitiveMinimumObservedSpreadTicks: profile.safeCompetitiveMinimumObservedSpreadTicks,
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
    },
    risk: defaultRiskConfig("systemLiquidity"),
  };
}

// User-simulation bot config used by the soak harness.
function noiseConfig(actor: Actor, market: MarketCtx, index: number): BotConfig { return { name: `${actor.username}-noise-${index + 1}`, baseUrl: BASE_URL, apiKey: actor.token, strategy: "noiseTrader", marketIds: [market.marketId], pollIntervalMs: 1500, loopIntervalMinMs: 800, loopIntervalMaxMs: 1400, maxOrderSize: "0.800000", maxTakerSize: "0.500000", maxOpenOrders: 8, staleOrderMs: 12000, minQuoteLifetimeMs: 6000, decisionCooldownMs: 800, capBackoffMs: 8000, tickSize: "0.01", maxPositionShares: "40.000000", inventoryTargetShares: "1.000000", targetSpreadTicks: 4, quoteOffsetMinTicks: 0, quoteOffsetMaxTicks: 3, staleDistanceTicks: 5, replaceThresholdTicks: 3, replaceHysteresisTicks: 2, maxOrdersPerSide: 2, takerProbability: 0.2, takerThresholdTicks: 1, inventorySkewStrength: 2, fallbackFairPrice: "0.50", dailyNotionalPauseMode: "pause_for_run", dailyNotionalCooldownMs: 86400000, pausedPollIntervalMs: 45000, pauseLogIntervalMs: 60000, dynamicMarketMaker: { minLevelsPerSide: 1, maxLevelsPerSide: 3, levelSpacingTicks: 1, minSpreadTicks: 2, maxSpreadTicks: 8, baseSpreadTicks: 2, extremeSpreadTicks: 3, inventorySpreadTicks: 2, inventoryLeanTicks: 3, inventoryReduceThreshold: 0.65, inventoryEmergencyThreshold: 0.92, levelSizeMultipliers: [1, 0.7, 0.45], extremeSizeReduction: 0.55, minLevelSize: "0.100000", replenishmentTargetShares: "1.000000", enableMintReplenishment: true, targetAskDepthShares: "100.000000", safetyMultiplier: 1.2, targetInventoryShares: "300.000000", minMintAmount: "50.000000", maxMintAmountPerCycle: "300.000000", maxMintPerMarketPerHour: "1000.000000", extremeMintReductionThresholdHigh: 0.85, extremeMintReductionThresholdLow: 0.15, extremeMintReductionFactor: 0.35 }, risk: defaultRiskConfig("userSimulation") }; }

function defaultRiskConfig(kind: "systemLiquidity" | "userSimulation"): BotConfig["risk"] {
  return {
    botUserId: null,
    enabled: kind === "systemLiquidity",
    maxTotalCapitalCents: kind === "systemLiquidity" ? 500_000 : 100_000,
    maxCapitalPerMarketCents: kind === "systemLiquidity" ? 100_000 : 25_000,
    maxOpenOrderNotionalCents: kind === "systemLiquidity" ? 10_000 : 5_000,
    maxOrderSizeCents: kind === "systemLiquidity" ? 200 : 100,
    maxDailyLossCents: kind === "systemLiquidity" ? 100_000 : 25_000,
    maxDailySubmittedNotionalCents: kind === "systemLiquidity" ? 1_000_000 : 250_000,
    maxYesSharesPerMarket: kind === "systemLiquidity" ? "500.000000" : "40.000000",
    maxNoSharesPerMarket: kind === "systemLiquidity" ? "500.000000" : "40.000000",
    maxOrdersPerMarket: kind === "systemLiquidity" ? 20 : 8,
    maxQuoteLevelsPerSide: kind === "systemLiquidity" ? 3 : 2,
    staleDataMaxAgeMs: 15_000,
    pauseNearResolutionMinutes: 0,
    repeatedErrorPauseMs: 30_000,
    inventoryReduceOnlyThreshold: 0.85,
    inventoryStopThreshold: 0.98,
    emergencyStopOnInvariantViolation: true,
    emergencyStopOnRepeatedApiErrors: true,
    emergencyStopOnBalanceMismatch: true,
    repeatedApiErrorThreshold: 5,
    repeatedApiErrorWindowMs: 60_000,
    repeatedCancelConflictThreshold: 5,
    repeatedStaleStateThreshold: 10,
    cancelOpenOrdersOnPause: false,
    cancelOpenOrdersOnEmergencyStop: true,
  };
}

function createHarness(config: BotConfig): Harness {
  const runner = new BotRunner(config, BOT_LOGS_DIR);
  const logPath = path.join(BOT_LOGS_DIR, `${sanitize(config.name)}.log`);
  let lastOffset = 0;
  return {
    async runCycle() {
      const collected: BotLine[] = [];
      let attempt = 0;
      while (true) {
        const existing = await fs.readFile(logPath, "utf8").catch(() => "");
        lastOffset = existing.length;
        try {
          await runner.runOnce(new AbortController().signal);
          await sleep(200);
          const next = (await fs.readFile(logPath, "utf8").catch(() => "")).slice(lastOffset);
          return [...collected, ...next.split(/\r?\n/).filter(Boolean).map(parseBotLine)];
        } catch (error) {
          const next = (await fs.readFile(logPath, "utf8").catch(() => "")).slice(lastOffset);
          collected.push(...next.split(/\r?\n/).filter(Boolean).map(parseBotLine));
          if (!isRetryableTransportError(error)) {
            throw error;
          }
          attempt += 1;
          RUN_MONITOR.transportRetryCount += 1;
          APP_HEALTH.retryAttempts += 1;
          await log({
            kind: "bot_cycle_transport_retry",
            botName: config.name,
            attempt,
            error: summarizeError(error),
            appHealth: serializeAppHealthState(),
          });
          await waitForHealthyApp(`bot_cycle:${config.name}`);
        }
      }
    },
    close() {
      runner.shutdown();
    },
  };
}

async function logBotLines(lines: BotLine[], suspicious: Set<string>) {
  for (const line of lines) {
    if (line.ts) {
      const parsedTs = Date.parse(line.ts);
      if (Number.isFinite(parsedTs)) {
        RUN_MONITOR.lastSuccessfulBotEventAt = Math.max(RUN_MONITOR.lastSuccessfulBotEventAt ?? 0, parsedTs);
      }
    }
    if (line.eventName === "decision_made" && isRecord(line.payload)) {
      const price = str(line.payload.price);
      const midpoint = str(line.payload.midpoint);
      const fairPrice = str(line.payload.fairPrice);
      if ((midpoint === "0.8" || midpoint === "0.92" || fairPrice === "0.8" || fairPrice === "0.92") && price === "0.5") {
        suspicious.add("Bot quote reset to 0.5 in a non-0.5 market.");
      }
    }
    if (line.eventName === "mint_replenishment_failed") suspicious.add("Mint replenishment failed at least once during soak.");
    if (line.eventName === "risk_metrics" && isRecord(line.payload) && line.botName) {
      RUN_MONITOR.botStates.set(line.botName, line.payload);
    }
    const freshness = isRecord(line.payload) && isRecord(line.payload.freshness) ? line.payload.freshness : null;
    if (freshness) {
      updateFreshnessMonitor(freshness);
    }
    if ((line.eventName === "stale_state_detected" || line.eventName === "polling_reconciliation") && isRecord(line.payload)) {
      updateFreshnessMonitor(line.payload);
    }
    await log({ kind: "bot_cycle_log", eventName: line.eventName, level: line.level, botName: line.botName, payload: line.payload, ...flatten(line.payload), raw: line.raw });
  }
}

function parseBotLine(raw: string): BotLine { const match = raw.match(/^(\S+)\s+\[(\w+)\]\s+\[([^\]]+)\]\s+([^\s]+)(?:\s+(.*))?$/); if (!match) return { ts: null, level: null, botName: null, eventName: "unknown", payload: null, raw }; const [, ts, level, botName, eventName, payloadRaw] = match; let payload: unknown = payloadRaw ?? null; if (payloadRaw) { try { payload = JSON.parse(payloadRaw); } catch { payload = payloadRaw; } } return { ts, level, botName, eventName, payload, raw }; }
function extractOrderStatus(event: Record<string, unknown>) {
  if (isRecord(event.body) && isRecord(event.body.order) && typeof event.body.order.status === "string") {
    return event.body.order.status;
  }
  if (isRecord(event.order) && typeof event.order.status === "string") {
    return event.order.status;
  }
  if (isRecord(event.payload) && isRecord(event.payload.order) && typeof event.payload.order.status === "string") {
    return event.payload.order.status;
  }
  return null;
}

async function actorDbState(userId: string, market: MarketCtx) { const [balance, yes, no] = await Promise.all([prisma.userBalance.findUniqueOrThrow({ where: { userId } }), prisma.position.findUnique({ where: { userId_marketId_outcomeId: { userId, marketId: market.marketId, outcomeId: market.yesOutcomeId } } }), prisma.position.findUnique({ where: { userId_marketId_outcomeId: { userId, marketId: market.marketId, outcomeId: market.noOutcomeId } } })]); return { availableUSDC: balance.availableUSDC.toString(), yesShares: yes?.shares.toString() ?? "0", yesReservedShares: yes?.reservedShares.toString() ?? "0", noShares: no?.shares.toString() ?? "0", noReservedShares: no?.reservedShares.toString() ?? "0" }; }

async function httpJson(url: string, options: { endpoint: string; init?: RequestInit; apiErrors?: Map<string, number> }) {
  let attempt = 0;
  while (true) {
    try {
      const response = await fetch(url, options.init);
      RUN_MONITOR.lastSuccessfulApiCallAt = Date.now();
      RUN_MONITOR.lastSuccessfulApiEndpoint = options.endpoint;
      markAppHealthy();
      const text = await response.text();
      let body: unknown = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }
      if (response.status >= 400) {
        options.apiErrors?.set(options.endpoint, (options.apiErrors?.get(options.endpoint) ?? 0) + 1);
        await log({ kind: "api_error", endpoint: options.endpoint, status: response.status, url, body });
      }
      return { status: response.status, body };
    } catch (error) {
      if (!isRetryableTransportError(error)) {
        throw error;
      }
      attempt += 1;
      RUN_MONITOR.transportRetryCount += 1;
      APP_HEALTH.retryAttempts += 1;
      markAppUnhealthy(error);
      await log({
        kind: "transport_retry",
        endpoint: options.endpoint,
        url,
        attempt,
        error: summarizeError(error),
        appHealth: serializeAppHealthState(),
      });
      await waitForHealthyApp(`http:${options.endpoint}`);
      await sleep(backoffDelayMs(attempt));
    }
  }
}

async function waitForApp() {
  await waitForHealthyApp("startup", 60000);
}

async function waitForHealthyApp(reason: string, thresholdMs = RELIABILITY_CFG.outageThresholdMs) {
  const start = Date.now();
  while (true) {
    const health = await checkAppHealth(reason);
    if (health.ok) {
      return;
    }
    const outageStartedAt = APP_HEALTH.outageStartedAt ?? Date.now();
    if (Date.now() - Math.min(outageStartedAt, start) > thresholdMs) {
      throw new Error(`App remained unhealthy for more than ${thresholdMs}ms during ${reason}: ${APP_HEALTH.lastError ?? "unknown_error"}`);
    }
    await sleep(backoffDelayMs(APP_HEALTH.consecutiveFailures + 1));
  }
}

async function checkAppHealth(reason: string) {
  APP_HEALTH.lastHealthCheckAt = Date.now();
  try {
    const response = await fetch(`${BASE_URL}/api/health`, {
      signal: AbortSignal.timeout(RELIABILITY_CFG.healthTimeoutMs),
    });
    if (response.ok) {
      markAppHealthy();
      if (APP_HEALTH.lastTransitionLoggedHealthy !== true) {
        APP_HEALTH.lastTransitionLoggedHealthy = true;
        await log({ kind: "app_health_healthy", reason, appHealth: serializeAppHealthState() });
      }
      return { ok: true };
    }
    markAppUnhealthy(new Error(`health_status_${response.status}`));
  } catch (error) {
    markAppUnhealthy(error);
  }
  if (APP_HEALTH.lastTransitionLoggedHealthy !== false) {
    APP_HEALTH.lastTransitionLoggedHealthy = false;
    await log({ kind: "app_health_unhealthy", reason, appHealth: serializeAppHealthState() });
  }
  return { ok: false };
}

function markAppHealthy() {
  APP_HEALTH.healthy = true;
  APP_HEALTH.lastHealthyAt = Date.now();
  APP_HEALTH.outageStartedAt = null;
  APP_HEALTH.lastError = null;
  APP_HEALTH.consecutiveFailures = 0;
}

function markAppUnhealthy(error: unknown) {
  APP_HEALTH.healthy = false;
  APP_HEALTH.outageStartedAt ??= Date.now();
  APP_HEALTH.lastError = summarizeError(error);
  APP_HEALTH.consecutiveFailures += 1;
}

function serializeAppHealthState(): AppHealthState {
  return {
    healthy: APP_HEALTH.healthy,
    lastHealthCheckAt: toIso(APP_HEALTH.lastHealthCheckAt),
    lastHealthyAt: toIso(APP_HEALTH.lastHealthyAt),
    outageStartedAt: toIso(APP_HEALTH.outageStartedAt),
    lastError: APP_HEALTH.lastError,
    consecutiveFailures: APP_HEALTH.consecutiveFailures,
    retryAttempts: APP_HEALTH.retryAttempts,
  };
}

function updateFreshnessMonitor(payload: Record<string, unknown>) {
  const lastMarketEventAt = str(payload.lastMarketEventAt);
  const lastAccountEventAt = str(payload.lastAccountEventAt);
  const lastPollingSyncAt = str(payload.lastPollingSyncAt);
  if (lastMarketEventAt) {
    const ts = Date.parse(lastMarketEventAt);
    if (Number.isFinite(ts)) RUN_MONITOR.lastSuccessfulMarketEventAt = Math.max(RUN_MONITOR.lastSuccessfulMarketEventAt ?? 0, ts);
  }
  if (lastAccountEventAt) {
    const ts = Date.parse(lastAccountEventAt);
    if (Number.isFinite(ts)) RUN_MONITOR.lastSuccessfulAccountEventAt = Math.max(RUN_MONITOR.lastSuccessfulAccountEventAt ?? 0, ts);
  }
  if (lastPollingSyncAt) {
    const ts = Date.parse(lastPollingSyncAt);
    if (Number.isFinite(ts)) RUN_MONITOR.lastSuccessfulPollingSyncAt = Math.max(RUN_MONITOR.lastSuccessfulPollingSyncAt ?? 0, ts);
  }
}

function isRetryableTransportError(error: unknown) {
  const message = summarizeError(error).toUpperCase();
  return (
    message.includes("ECONNRESET") ||
    message.includes("FETCH FAILED") ||
    message.includes("SOCKET HANG UP") ||
    message.includes("ETIMEDOUT") ||
    message.includes("ECONNREFUSED")
  );
}

function summarizeError(error: unknown) {
  if (error instanceof Error) {
    const cause = typeof error.cause === "object" && error.cause && "message" in error.cause
      ? String((error.cause as { message?: unknown }).message ?? "")
      : "";
    const code = typeof error.cause === "object" && error.cause && "code" in error.cause
      ? String((error.cause as { code?: unknown }).code ?? "")
      : "";
    return [error.name, error.message, code, cause].filter(Boolean).join(": ");
  }
  return String(error);
}

function backoffDelayMs(attempt: number) {
  return Math.min(RELIABILITY_CFG.retryMaxMs, RELIABILITY_CFG.retryBaseMs * 2 ** Math.min(Math.max(0, attempt - 1), 5));
}

function toIso(ts: number | null) {
  return ts ? new Date(ts).toISOString() : null;
}

async function log(payload: Record<string, unknown>) { await fs.appendFile(LOG_PATH, `${JSON.stringify({ ts: new Date().toISOString(), ...payload })}\n`, "utf8"); }

function sessionCookie(userId: string) { return `poly_user_id=${userId}`; }
function manualPrice(side: "BUY" | "SELL", bestBid: number | null, bestAsk: number | null, mid: number | null, fairAnchor: number, aggressive: boolean) { const anchor = mid ?? fairAnchor; if (side === "BUY") return toTick(aggressive ? (bestAsk !== null ? Math.max(bestAsk + TICK, fairAnchor + 0.01) : fairAnchor + 0.02) : (bestBid !== null ? Math.max(bestBid + TICK, fairAnchor - 0.02) : fairAnchor - 0.01)); return toTick(aggressive ? (bestBid !== null ? Math.min(bestBid - TICK, fairAnchor - 0.01) : fairAnchor - 0.02) : (bestAsk !== null ? Math.min(bestAsk - TICK, fairAnchor + 0.02) : fairAnchor + 0.01)); }
function adjustManualPriceForBinaryInvariant(price: string, side: "BUY" | "SELL", siblingBestBid: number | null, siblingBestAsk: number | null) {
  let adjusted = Number(price);
  if (side === "BUY" && siblingBestBid !== null) {
    adjusted = Math.min(adjusted, 1 - siblingBestBid);
  }
  if (side === "SELL" && siblingBestAsk !== null) {
    adjusted = Math.max(adjusted, 1 - siblingBestAsk);
  }
  return toTick(adjusted);
}
async function topOrder(
  marketId: string,
  outcomeId: string,
  side: "BUY" | "SELL",
  direction: "asc" | "desc",
  actorKindByUserId: Map<string, Actor["kind"]> = new Map(),
) {
  const order = await prisma.order.findFirst({
    where: {
      marketId,
      outcomeId,
      side,
      status: { in: ["OPEN", "PARTIAL"] },
      remaining: { gt: new Prisma.Decimal(0) },
    },
    orderBy: [{ price: direction }, { createdAt: "asc" }],
    select: { id: true, userId: true, price: true, remaining: true, status: true, updatedAt: true },
  });
  if (!order) {
    return null;
  }
  return {
    id: order.id,
    userId: order.userId,
    actorKind: actorKindByUserId.get(order.userId) ?? null,
    price: order.price.toString(),
    remaining: order.remaining.toString(),
    status: order.status,
    updatedAt: order.updatedAt.toISOString(),
  };
}
function numEnv(name: string, fallback: number) { const raw = process.env[name]; const parsed = raw ? Number(raw) : fallback; return Number.isFinite(parsed) ? parsed : fallback; }
function boundedNumEnv(name: string, fallback: number, min: number, max: number) { return clamp(numEnv(name, fallback), min, max); }
function decEnv(name: string, fallback: string) { try { return new Prisma.Decimal(process.env[name] ?? fallback).toFixed(6); } catch { return fallback; } }
function boolEnv(name: string, fallback: boolean) { const raw = process.env[name]; return raw ? /^(1|true|yes)$/i.test(raw) : fallback; }
function fairValueModeEnv(name: string, fallback: FairValueMode): FairValueMode { const raw = (process.env[name] ?? fallback).trim().toLowerCase(); return raw === "random_walk" || raw === "scripted" || raw === "static" ? raw : fallback; }
function mmTuningProfileEnv(name: string, fallback: MmTuningProfile): MmTuningProfile {
  const raw = (process.env[name] ?? fallback).trim().toLowerCase();
  return raw === "balanced" || raw === "aggressive_safe" || raw === "selective_competitive" || raw === "safe_competitive" || raw === "baseline" ? raw : fallback;
}
function soakModeEnv(name: string, fallback: SoakMode): SoakMode {
  const raw = (process.env[name] ?? fallback).trim().toLowerCase();
  return raw === "isolated_mm" || raw === "light_reference" || raw === "user_flow" || raw === "full_synthetic"
    ? raw
    : fallback;
}
function referenceBookModeEnv(name: string, fallback: ReferenceBookMode): ReferenceBookMode {
  const raw = (process.env[name] ?? fallback).trim().toLowerCase();
  return raw === "light" || raw === "off" || raw === "normal" ? raw : fallback;
}
function resolveSoakModeSettings(): SoakModeSettings {
  if (CFG.soakMode === "isolated_mm") {
    return {
      mode: CFG.soakMode,
      enableReferenceShaping: false,
      referenceBookMode: "off",
      enableWarmup: false,
      enableManualPressure: false,
      enableNoiseBots: false,
    };
  }
  if (CFG.soakMode === "light_reference") {
    return {
      mode: CFG.soakMode,
      enableReferenceShaping: true,
      referenceBookMode: CFG.referenceBookMode === "off" ? "light" : "light",
      enableWarmup: false,
      enableManualPressure: true,
      enableNoiseBots: true,
    };
  }
  if (CFG.soakMode === "user_flow") {
    return {
      mode: CFG.soakMode,
      enableReferenceShaping: false,
      referenceBookMode: "off",
      enableWarmup: false,
      enableManualPressure: true,
      enableNoiseBots: true,
    };
  }
  return {
    mode: CFG.soakMode,
    enableReferenceShaping: CFG.referenceBookMode !== "off",
    referenceBookMode: CFG.referenceBookMode,
    enableWarmup: true,
    enableManualPressure: true,
    enableNoiseBots: true,
  };
}
function buildConfigSummary() {
  return {
    durationSeconds: CFG.durationSeconds,
    resolveAtEnd: CFG.resolveAtEnd,
    runtimeFreshness: {
      marketMakerCycleMs: CFG.marketMakerCycleMs,
      noiseTraderCycleMs: CFG.noiseTraderCycleMs,
      ordersPerSecond: CFG.ordersPerSecond,
    },
    reliability: {
      healthCheckIntervalMs: RELIABILITY_CFG.healthCheckIntervalMs,
      healthTimeoutMs: RELIABILITY_CFG.healthTimeoutMs,
      outageThresholdMs: RELIABILITY_CFG.outageThresholdMs,
      retryBaseMs: RELIABILITY_CFG.retryBaseMs,
      retryMaxMs: RELIABILITY_CFG.retryMaxMs,
    },
    fairValueControl: {
      mode: CFG.fairValueMode,
      initialYesFair: CFG.initialYesFair,
      volatility: CFG.fairValueVolatility,
      drift: CFG.fairValueDrift,
      min: CFG.fairValueMin,
      max: CFG.fairValueMax,
      forceExtremeMint: CFG.forceExtremeMint,
    },
    actorTypes: {
      numberOfUserBots: CFG.numberOfUserBots,
      manualPressureEnabled: SOAK_MODE.enableManualPressure,
      noiseBotsEnabled: SOAK_MODE.enableNoiseBots,
      systemMarketMaker: "dynamicMarketMaker",
    },
    referenceShaping: {
      soakMode: SOAK_MODE.mode,
      enabled: SOAK_MODE.enableReferenceShaping,
      mode: SOAK_MODE.referenceBookMode,
      warmupEnabled: SOAK_MODE.enableWarmup,
    },
    marketMakerTuning: {
      profile: CFG.mmTuningProfile,
    },
    legacyCompatibility: {
      referenceBookModeEnv: CFG.referenceBookMode,
    },
  };
}
function buildActorKindByUserId(actors: Actor[]) {
  return new Map(actors.map((actor) => [actor.userId, actor.kind] as const));
}
function makeRng(seed: string) { let state = hashSeed(seed); return () => ((state = (state * 1664525 + 1013904223) >>> 0) / 0xffffffff); }
function hashSeed(seed: string) { let hash = 2166136261; for (let i = 0; i < seed.length; i += 1) { hash ^= seed.charCodeAt(i); hash = Math.imul(hash, 16777619); } return hash >>> 0; }
function sleep(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function pick<T>(items: T[], rng: () => number) { return items[Math.floor(rng() * items.length)]; }
function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }
function toTick(value: number) { return round2(Math.max(0.01, Math.min(0.99, value))).toFixed(2); }
function round2(value: number) { return Math.round(value * 100) / 100; }
function maxPrice(rows: Array<{ price: number }>) { return rows.length ? Math.max(...rows.map((row) => row.price)) : null; }
function minPrice(rows: Array<{ price: number }>) { return rows.length ? Math.min(...rows.map((row) => row.price)) : null; }
function createFairValueController(): FairValueController {
  const forcedExtremeInitial = Math.max(CFG.initialYesFair, 0.91);
  const initial = clamp(CFG.forceExtremeMint ? forcedExtremeInitial : CFG.initialYesFair, CFG.fairValueMin, CFG.fairValueMax);
  const startedAt = Date.now();
  return {
    currentYesFair: initial,
    currentNoFair: round2(1 - initial),
    mode: CFG.fairValueMode,
    startedAt,
    lastUpdatedAt: startedAt,
    updateIntervalMs: 5000,
    update(now, rng) {
      if (now - this.lastUpdatedAt < this.updateIntervalMs) {
        return { yesFair: this.currentYesFair, noFair: this.currentNoFair, changed: false };
      }
      let nextYesFair = this.currentYesFair;
      if (this.mode === "random_walk") {
        const shock = (rng() * 2 - 1) * CFG.fairValueVolatility;
        nextYesFair = clamp(nextYesFair + shock + CFG.fairValueDrift, CFG.fairValueMin, CFG.fairValueMax);
      } else if (this.mode === "scripted") {
        const progress = clamp((now - this.startedAt) / (CFG.durationSeconds * 1000), 0, 1);
        const phaseTarget = CFG.forceExtremeMint
          ? 0.91 + progress * 0.02
          : progress < 0.5 ? 0.8 + progress * 0.16 : 0.88 + (progress - 0.5) * 0.08;
        nextYesFair = clamp(phaseTarget, CFG.fairValueMin, CFG.fairValueMax);
      }
      this.currentYesFair = round2(nextYesFair);
      this.currentNoFair = round2(1 - this.currentYesFair);
      this.lastUpdatedAt = now;
      return { yesFair: this.currentYesFair, noFair: this.currentNoFair, changed: true };
    },
  };
}
function sanitize(input: string) { return input.replace(/[^a-zA-Z0-9_-]/g, "_"); }
function isRecord(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
function flatten(value: unknown) { return isRecord(value) ? value : {}; }
function str(value: unknown) { return typeof value === "string" ? value : null; }
function numericString(value: unknown) { return typeof value === "string" ? Number(value) || 0 : typeof value === "number" ? value : 0; }
function numOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
function ratio(numerator: number, denominator: number) { return denominator > 0 ? round4(numerator / denominator) : null; }
function round4(value: number) { return Math.round(value * 10000) / 10000; }
function round2OrNull(value: number | null) { return value === null ? null : round2(value); }
function round4OrNull(value: number | null) { return value === null ? null : round4(value); }
function average(values: number[]) { return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null; }
function countByReason(events: Array<Record<string, unknown>>, getReason: (event: Record<string, unknown>) => string) {
  const counts: Record<string, number> = {};
  for (const event of events) {
    const reason = getReason(event);
    counts[reason] = (counts[reason] ?? 0) + 1;
  }
  return counts;
}
function classifyOrderApiErrorReason(body: unknown) {
  const message = isRecord(body) && isRecord(body.error) && typeof body.error.message === "string"
    ? body.error.message.toLowerCase()
    : "";
  if (message.includes("insufficient available shares")) return "insufficient_available_shares";
  if (message.includes("insufficient available usdc")) return "insufficient_available_usdc";
  if (message.includes("binary invariant violation")) return "binary_invariant_violation";
  if (message.includes("market is not live") || message.includes("market_not_live")) return "market_not_live";
  return "unknown";
}

function mmTuningProfileSettings(profile: MmTuningProfile) {
  if (profile === "selective_competitive") {
    return {
      staleOrderMs: 20000,
      minQuoteLifetimeMs: 12000,
      staleDistanceTicks: 6,
      replaceThresholdTicks: 3,
      replaceHysteresisTicks: 3,
      quoteKeepBandTicks: 0,
      quoteKeepSizeToleranceRatio: 0,
      normalMarketTightenTicks: 0,
      selectiveCompetitiveTicks: 1,
      selectiveCompetitiveSizeBumpRatio: 0.15,
      selectiveCompetitiveMaxInventoryImbalance: 0.12,
      selectiveCompetitiveMinAvailableUSDC: "75.000000",
      selectiveCompetitiveRecentLagLimit: 6,
      safeCompetitiveJoinTouchBothSides: false,
      safeCompetitiveMinimumObservedSpreadTicks: 2,
    };
  }
  if (profile === "safe_competitive") {
    return {
      staleOrderMs: 20000,
      minQuoteLifetimeMs: 12000,
      staleDistanceTicks: 6,
      replaceThresholdTicks: 3,
      replaceHysteresisTicks: 3,
      quoteKeepBandTicks: 0,
      quoteKeepSizeToleranceRatio: 0,
      normalMarketTightenTicks: 0,
      selectiveCompetitiveTicks: 1,
      selectiveCompetitiveSizeBumpRatio: 0.1,
      selectiveCompetitiveMaxInventoryImbalance: 0.08,
      selectiveCompetitiveMinAvailableUSDC: "150.000000",
      selectiveCompetitiveRecentLagLimit: 4,
      safeCompetitiveJoinTouchBothSides: true,
      safeCompetitiveMinimumObservedSpreadTicks: 2,
    };
  }
  if (profile === "balanced") {
    return {
      staleOrderMs: 22000,
      minQuoteLifetimeMs: 14000,
      staleDistanceTicks: 6,
      replaceThresholdTicks: 3,
      replaceHysteresisTicks: 4,
      quoteKeepBandTicks: 2,
      quoteKeepSizeToleranceRatio: 0.2,
      normalMarketTightenTicks: 1,
      selectiveCompetitiveTicks: 0,
      selectiveCompetitiveSizeBumpRatio: 0,
      selectiveCompetitiveMaxInventoryImbalance: 0,
      selectiveCompetitiveMinAvailableUSDC: "0",
      selectiveCompetitiveRecentLagLimit: 0,
      safeCompetitiveJoinTouchBothSides: false,
      safeCompetitiveMinimumObservedSpreadTicks: 2,
    };
  }
  if (profile === "aggressive_safe") {
    return {
      staleOrderMs: 24000,
      minQuoteLifetimeMs: 16000,
      staleDistanceTicks: 7,
      replaceThresholdTicks: 4,
      replaceHysteresisTicks: 4,
      quoteKeepBandTicks: 3,
      quoteKeepSizeToleranceRatio: 0.3,
      normalMarketTightenTicks: 1,
      selectiveCompetitiveTicks: 0,
      selectiveCompetitiveSizeBumpRatio: 0,
      selectiveCompetitiveMaxInventoryImbalance: 0,
      selectiveCompetitiveMinAvailableUSDC: "0",
      selectiveCompetitiveRecentLagLimit: 0,
      safeCompetitiveJoinTouchBothSides: false,
      safeCompetitiveMinimumObservedSpreadTicks: 2,
    };
  }
  return {
    staleOrderMs: 20000,
    minQuoteLifetimeMs: 12000,
    staleDistanceTicks: 6,
    replaceThresholdTicks: 3,
    replaceHysteresisTicks: 3,
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
  };
}

function buildMmSubmittedOrderLifecycle(events: Array<Record<string, unknown>>, finalTimestamp: string | null) {
  const submittedAtByOrderId = new Map<string, number>();
  const canceledAgesMs: number[] = [];
  const fillAgesMs: number[] = [];
  const endMs = finalTimestamp ? new Date(finalTimestamp).getTime() : Date.now();

  for (const event of events) {
    const eventTs = typeof event.ts === "string" ? Date.parse(event.ts) : Number.NaN;
    if (!Number.isFinite(eventTs)) {
      continue;
    }
    if (event.eventName === "order_submitted") {
      const orderId = orderIdFromEvent(event);
      if (orderId) {
        submittedAtByOrderId.set(orderId, eventTs);
      }
      continue;
    }
    if (event.eventName === "order_canceled") {
      const orderId = orderIdFromEvent(event);
      if (orderId && submittedAtByOrderId.has(orderId)) {
        canceledAgesMs.push(eventTs - submittedAtByOrderId.get(orderId)!);
        submittedAtByOrderId.delete(orderId);
      }
      continue;
    }
    if (event.eventName === "fill_seen") {
      const makerOrderId = typeof event.makerOrderId === "string" ? event.makerOrderId : null;
      if (makerOrderId && submittedAtByOrderId.has(makerOrderId)) {
        fillAgesMs.push(eventTs - submittedAtByOrderId.get(makerOrderId)!);
      }
    }
  }

  return {
    canceledAgesMs,
    fillAgesMs,
    openAgesMs: Array.from(submittedAtByOrderId.values()).map((submittedAt) => endMs - submittedAt),
  };
}

function orderIdFromEvent(event: Record<string, unknown>) {
  if (typeof event.orderId === "string") {
    return event.orderId;
  }
  if (isRecord(event.order) && typeof event.order.id === "string") {
    return event.order.id;
  }
  if (isRecord(event.payload) && isRecord(event.payload.order) && typeof event.payload.order.id === "string") {
    return event.payload.order.id;
  }
  return null;
}

function lastLoggedTimestamp(events: Array<Record<string, unknown>>) {
  const lastTs = [...events]
    .reverse()
    .map((event) => (typeof event.ts === "string" ? event.ts : null))
    .find((value): value is string => value !== null);
  return lastTs ?? null;
}

function analyzeMmQuoteDiagnostics(events: Array<Record<string, unknown>>) {
  const lastQuoteByOutcome = new Map<string, { bestBid: number | null; bestAsk: number | null }>();
  let wasBestBidCount = 0;
  let wasBestAskCount = 0;
  let insideSpreadCount = 0;
  let behindOtherOrdersCount = 0;

  for (const event of events) {
    if (event.eventName === "quote_seen") {
      const outcomeId = typeof event.outcomeId === "string" ? event.outcomeId : null;
      if (!outcomeId) continue;
      lastQuoteByOutcome.set(outcomeId, {
        bestBid: numOrNull(event.bestBid ?? (isRecord(event.payload) ? event.payload.bestBid : null)),
        bestAsk: numOrNull(event.bestAsk ?? (isRecord(event.payload) ? event.payload.bestAsk : null)),
      });
      continue;
    }
    if (event.eventName !== "order_submitted" || !isRecord(event.order) || typeof event.order.side !== "string") {
      continue;
    }
    const outcomeId = typeof event.order.outcomeId === "string" ? event.order.outcomeId : null;
    const price = numOrNull(event.order.price);
    if (!outcomeId || price === null) continue;
    const quote = lastQuoteByOutcome.get(outcomeId);
    if (!quote) continue;
    if (event.order.side === "BUY") {
      if (quote.bestBid !== null && Math.abs(price - quote.bestBid) < 0.000001) wasBestBidCount += 1;
      if (quote.bestBid !== null && quote.bestAsk !== null && price > quote.bestBid && price < quote.bestAsk) insideSpreadCount += 1;
      if (quote.bestBid !== null && price < quote.bestBid) behindOtherOrdersCount += 1;
    }
    if (event.order.side === "SELL") {
      if (quote.bestAsk !== null && Math.abs(price - quote.bestAsk) < 0.000001) wasBestAskCount += 1;
      if (quote.bestBid !== null && quote.bestAsk !== null && price < quote.bestAsk && price > quote.bestBid) insideSpreadCount += 1;
      if (quote.bestAsk !== null && price > quote.bestAsk) behindOtherOrdersCount += 1;
    }
  }

  return {
    wasBestBidCount,
    wasBestAskCount,
    atTouchCount: wasBestBidCount + wasBestAskCount,
    insideSpreadCount,
    behindOtherOrdersCount,
  };
}

async function analyzeFillAttribution(marketId: string, actorKindByUserId: Map<string, Actor["kind"]>) {
  const fills = await prisma.fill.findMany({
    where: { marketId },
    select: {
      id: true,
      makerUserId: true,
      takerUserId: true,
    },
  });

  const metrics = {
    fillsAgainstReferenceActors: 0,
    fillsAgainstNoiseActors: 0,
    fillsAgainstManualActors: 0,
    fillsAgainstRealMm: 0,
    mmAgainstReferenceActors: 0,
    mmAgainstNoiseActors: 0,
    mmAgainstManualActors: 0,
  };

  for (const fill of fills) {
    const makerKind = actorKindByUserId.get(fill.makerUserId) ?? null;
    const takerKind = actorKindByUserId.get(fill.takerUserId) ?? null;
    if (makerKind === "seed" || takerKind === "seed") metrics.fillsAgainstReferenceActors += 1;
    if (makerKind === "noise-bot" || takerKind === "noise-bot") metrics.fillsAgainstNoiseActors += 1;
    if (makerKind === "manual" || takerKind === "manual") metrics.fillsAgainstManualActors += 1;
    if (makerKind === "dynamic-mm" || takerKind === "dynamic-mm") metrics.fillsAgainstRealMm += 1;

    if (makerKind === "dynamic-mm" && takerKind === "seed") metrics.mmAgainstReferenceActors += 1;
    if (takerKind === "dynamic-mm" && makerKind === "seed") metrics.mmAgainstReferenceActors += 1;
    if (makerKind === "dynamic-mm" && takerKind === "noise-bot") metrics.mmAgainstNoiseActors += 1;
    if (takerKind === "dynamic-mm" && makerKind === "noise-bot") metrics.mmAgainstNoiseActors += 1;
    if (makerKind === "dynamic-mm" && takerKind === "manual") metrics.mmAgainstManualActors += 1;
    if (takerKind === "dynamic-mm" && makerKind === "manual") metrics.mmAgainstManualActors += 1;
  }

  return metrics;
}

function analyzeBookOwnership(
  topOfBookActorSnapshots: Array<Record<string, unknown>>,
  mmQuoteDiagnostics: ReturnType<typeof analyzeMmQuoteDiagnostics>,
) {
  const actorKinds = topOfBookActorSnapshots.flatMap((snapshot) => [
    str(snapshot.yesBid),
    str(snapshot.yesAsk),
    str(snapshot.noBid),
    str(snapshot.noAsk),
  ]).filter((value): value is string => value !== null);
  const referenceTouches = actorKinds.filter((kind) => kind === "seed").length;
  const nonReferenceTouches = actorKinds.filter((kind) => kind !== "seed").length;
  const totalTouches = actorKinds.length;
  return {
    touchTimeWithoutReference: totalTouches > 0 ? nonReferenceTouches / totalTouches : null,
    referenceBookCrowdingRatio: totalTouches > 0 ? referenceTouches / totalTouches : null,
    mmQueuePriorityEstimate:
      mmQuoteDiagnostics.atTouchCount + mmQuoteDiagnostics.behindOtherOrdersCount > 0
        ? mmQuoteDiagnostics.atTouchCount / (mmQuoteDiagnostics.atTouchCount + mmQuoteDiagnostics.behindOtherOrdersCount)
        : null,
  };
}

function analyzeMmTouchMetrics(
  market: MarketCtx,
  marketSnapshots: Array<Record<string, unknown>>,
  mmEvents: Array<Record<string, unknown>>,
) {
  const mmBestBidCount = marketSnapshots.reduce((count, snapshot) => {
    const top = isRecord(snapshot.topOfBookActors) ? snapshot.topOfBookActors : null;
    return count
      + (str(top?.yesBid) === "dynamic-mm" ? 1 : 0)
      + (str(top?.noBid) === "dynamic-mm" ? 1 : 0);
  }, 0);
  const mmBestAskCount = marketSnapshots.reduce((count, snapshot) => {
    const top = isRecord(snapshot.topOfBookActors) ? snapshot.topOfBookActors : null;
    return count
      + (str(top?.yesAsk) === "dynamic-mm" ? 1 : 0)
      + (str(top?.noAsk) === "dynamic-mm" ? 1 : 0);
  }, 0);
  const totalTouchObservations = marketSnapshots.length * 4;
  const mmTouchOwnershipRatio =
    totalTouchObservations > 0 ? (mmBestBidCount + mmBestAskCount) / totalTouchObservations : null;

  const snapshotsByTs = marketSnapshots
    .map((snapshot) => ({
      ts: typeof snapshot.ts === "string" ? Date.parse(snapshot.ts) : Number.NaN,
      snapshot,
    }))
    .filter((item) => Number.isFinite(item.ts))
    .sort((a, b) => a.ts - b.ts);

  let mmJoinedTouchCount = 0;
  let mmImprovedTouchCount = 0;
  let mmBehindReferenceCount = 0;
  const distancesFromTouchTicks: number[] = [];

  for (const event of mmEvents) {
    if (event.eventName !== "order_submitted" || !isRecord(event.order) || typeof event.ts !== "string") {
      continue;
    }
    const eventTs = Date.parse(event.ts);
    if (!Number.isFinite(eventTs)) {
      continue;
    }
    const snapshot = latestSnapshotBefore(snapshotsByTs, eventTs);
    if (!snapshot) {
      continue;
    }
    const price = numOrNull(event.order.price);
    const side = str(event.order.side);
    const outcomeId = str(event.order.outcomeId);
    if (price === null || !side || !outcomeId) {
      continue;
    }
    const top = topForOutcomeSnapshot(snapshot, market, outcomeId, side === "BUY" ? "bid" : "ask");
    if (!top || top.price === null) {
      continue;
    }
    const distanceTicks = Math.abs(price - top.price) / TICK;
    distancesFromTouchTicks.push(distanceTicks);
    if (distanceTicks < 0.000001) {
      mmJoinedTouchCount += 1;
    }
    if ((side === "BUY" && price > top.price) || (side === "SELL" && price < top.price)) {
      mmImprovedTouchCount += 1;
    }
    if (top.actorKind === "seed" && ((side === "BUY" && price < top.price) || (side === "SELL" && price > top.price))) {
      mmBehindReferenceCount += 1;
    }
  }

  return {
    mmTouchOwnershipRatio,
    mmBestBidCount,
    mmBestAskCount,
    mmJoinedTouchCount,
    mmImprovedTouchCount,
    mmBehindReferenceCount,
    mmDistanceFromTouchTicks: average(distancesFromTouchTicks),
  };
}

function latestSnapshotBefore(
  snapshots: Array<{ ts: number; snapshot: Record<string, unknown> }>,
  eventTs: number,
) {
  let latest: Record<string, unknown> | null = null;
  for (const item of snapshots) {
    if (item.ts <= eventTs) {
      latest = item.snapshot;
      continue;
    }
    break;
  }
  return latest;
}

function topForOutcomeSnapshot(
  snapshot: Record<string, unknown>,
  market: MarketCtx,
  outcomeId: string,
  side: "bid" | "ask",
) {
  const top = isRecord(snapshot.topOfBookActors) ? snapshot.topOfBookActors : null;
  const isYes = outcomeId === market.yesOutcomeId;
  if (isYes) {
    return side === "bid"
      ? { price: numOrNull(snapshot.yesBestBid), actorKind: str(top?.yesBid) }
      : { price: numOrNull(snapshot.yesBestAsk), actorKind: str(top?.yesAsk) };
  }
  return side === "bid"
    ? { price: numOrNull(snapshot.noBestBid), actorKind: str(top?.noBid) }
    : { price: numOrNull(snapshot.noBestAsk), actorKind: str(top?.noAsk) };
}

async function loadPostResolutionState(market: MarketCtx, actors: Actor[]) {
  const [openOrdersAfterResolution, reservedSharesRows, marketRow, balances] = await Promise.all([
    prisma.order.count({ where: { marketId: market.marketId, status: { in: ["OPEN", "PARTIAL"] } } }),
    prisma.position.aggregate({ where: { marketId: market.marketId }, _sum: { reservedShares: true } }),
    prisma.market.findUniqueOrThrow({ where: { id: market.marketId }, select: { collateralUSDC: true, status: true } }),
    prisma.userBalance.findMany({ where: { userId: { in: actors.map((actor) => actor.userId) } }, select: { lockedUSDC: true } }),
  ]);
  const lockedUSDCAfterResolution = balances.reduce((sum, row) => sum + Number(row.lockedUSDC), 0);
  return {
    marketStatus: marketRow.status,
    openOrdersAfterResolution,
    lockedUSDCAfterResolution: lockedUSDCAfterResolution.toFixed(6),
    reservedSharesAfterResolution: (reservedSharesRows._sum.reservedShares ?? new Prisma.Decimal(0)).toString(),
    collateralUSDCAfterResolution: marketRow.collateralUSDC.toString(),
  };
}

async function submitSoakLimitOrder(
  actor: Actor,
  body: { marketId: string; outcomeId: string; side: "BUY" | "SELL"; price: string; size: string },
  apiErrors?: Map<string, number>,
  options?: { actorSource?: string; allowInventoryMint?: boolean },
) {
  const freshState = await loadFreshActorState(actor, body.marketId, body.outcomeId, apiErrors);
  let side = body.side;
  if (side === "SELL" && freshState.availableShares < 0.05 && options?.allowInventoryMint !== false) {
    if (freshState.availableUSDC >= 1) {
      const quantity = clamp(1 + Math.random() * 2, 1, 3).toFixed(6);
      await log({ kind: "manual_inventory_mint", actor: actor.username, quantity, ...(await mintCompleteSets(actor, body.marketId, quantity, apiErrors)) });
    }
    side = "BUY";
  }
  const normalizedPrice = Number(body.price);
  let finalSize = body.size;
  let skipReason: string | null = null;
  if (side === "SELL") {
    finalSize = Math.min(Number(body.size), freshState.availableShares).toFixed(6);
    if (Number(finalSize) <= 0.000001) {
      skipReason = "insufficient_fresh_shares_skip";
    }
  } else {
    const maxAffordableSize = normalizedPrice > 0 ? freshState.availableUSDC / normalizedPrice : 0;
    finalSize = Math.min(Number(body.size), maxAffordableSize).toFixed(6);
    if (Number(finalSize) <= 0.000001) {
      skipReason = "insufficient_fresh_usdc_skip";
    }
  }
  if (!skipReason) {
    const precheck = await precheckActorBinaryInvariant({
      marketId: body.marketId,
      outcomeId: body.outcomeId,
      side,
      price: body.price,
      apiErrors,
    });
    if (!precheck.allowed) {
      skipReason = "actor_binary_invariant_precheck_skip";
      await log({
        kind: "actor_pre_submit_skip",
        actor: actor.username,
        actorSource: options?.actorSource ?? actor.kind,
        reason: skipReason,
        side,
        outcomeId: body.outcomeId,
        price: body.price,
        requestedSize: body.size,
        finalCappedSize: finalSize,
        availableUSDC: freshState.availableUSDC.toFixed(6),
        availableShares: freshState.availableShares.toFixed(6),
        ...precheck.details,
      });
    }
  }
  if (skipReason && skipReason !== "actor_binary_invariant_precheck_skip") {
    await log({
      kind: "actor_pre_submit_skip",
      actor: actor.username,
      actorSource: options?.actorSource ?? actor.kind,
      reason: skipReason,
      side,
      outcomeId: body.outcomeId,
      price: body.price,
      requestedSize: body.size,
      finalCappedSize: finalSize,
      availableUSDC: freshState.availableUSDC.toFixed(6),
      availableShares: freshState.availableShares.toFixed(6),
    });
  }
  if (skipReason) {
    return {
      status: 0,
      body: { skipped: true, reason: skipReason },
      skipped: true,
      skipReason,
      requestedSize: body.size,
      finalSize,
      availableUSDC: freshState.availableUSDC.toFixed(6),
      availableShares: freshState.availableShares.toFixed(6),
    };
  }
  const result = await placeLimitOrder(actor, { ...body, side, size: finalSize }, apiErrors);
  return {
    ...result,
    skipped: false,
    skipReason: null,
    requestedSize: body.size,
    finalSize,
    availableUSDC: freshState.availableUSDC.toFixed(6),
    availableShares: freshState.availableShares.toFixed(6),
  };
}

async function loadFreshActorState(actor: Actor, marketId: string, outcomeId: string, apiErrors?: Map<string, number>): Promise<FreshActorState> {
  const headers = { Authorization: `Bearer ${actor.token}` };
  const [balance, positions] = await Promise.all([
    httpJson(`${BASE_URL}/api/account/balance`, { endpoint: "GET /api/account/balance", init: { headers }, apiErrors }),
    httpJson(`${BASE_URL}/api/account/positions?marketId=${encodeURIComponent(marketId)}`, { endpoint: "GET /api/account/positions", init: { headers }, apiErrors }),
  ]);
  const balanceBody = (balance.body ?? {}) as { availableUSDC?: string };
  const items = (((positions.body ?? {}) as { items?: Array<{ outcomeId: string; shares?: string; reservedShares?: string }> }).items ?? []);
  const yes = items.find((item) => item.outcomeId === outcomeId);
  const target = items.find((item) => item.outcomeId === outcomeId);
  const shares = Number(target?.shares ?? "0");
  const reservedShares = Number(target?.reservedShares ?? "0");
  return {
    availableUSDC: Number(balanceBody.availableUSDC ?? "0"),
    availableShares: Math.max(0, shares - reservedShares),
  };
}

async function precheckActorBinaryInvariant(params: {
  marketId: string;
  outcomeId: string;
  side: "BUY" | "SELL";
  price: string;
  apiErrors?: Map<string, number>;
}) {
  const tolerance = 0.000001;
  const response = await httpJson(`${BASE_URL}/api/orderbook/${params.marketId}/book`, { endpoint: "GET /api/orderbook/:marketId/book", apiErrors: params.apiErrors });
  if (response.status !== 200) {
    return { allowed: true, details: {} };
  }
  const book = (response.body ?? {}) as { bids?: Array<{ outcomeId: string; price: number }>; asks?: Array<{ outcomeId: string; price: number }> };
  const bids = book.bids ?? [];
  const asks = book.asks ?? [];
  const ownBestBid = maxPrice(bids.filter((row) => row.outcomeId === params.outcomeId));
  const ownBestAsk = minPrice(asks.filter((row) => row.outcomeId === params.outcomeId));
  const siblingBidRows = bids.filter((row) => row.outcomeId !== params.outcomeId);
  const siblingAskRows = asks.filter((row) => row.outcomeId !== params.outcomeId);
  const siblingBestBid = maxPrice(siblingBidRows);
  const siblingBestAsk = minPrice(siblingAskRows);
  const price = Number(params.price);
  if (params.side === "SELL") {
    const wouldRest = ownBestBid === null || price > ownBestBid + tolerance;
    if (wouldRest && siblingBestAsk !== null) {
      const sum = price + siblingBestAsk;
      if (sum < 1 - tolerance) {
        return { allowed: false, details: { computedSum: round4(sum), siblingBestAsk, ownBestBid, ownBestAsk } };
      }
    }
  } else {
    const wouldRest = ownBestAsk === null || price < ownBestAsk - tolerance;
    if (wouldRest && siblingBestBid !== null) {
      const sum = price + siblingBestBid;
      if (sum > 1 + tolerance) {
        return { allowed: false, details: { computedSum: round4(sum), siblingBestBid, ownBestBid, ownBestAsk } };
      }
    }
  }
  return { allowed: true, details: {} };
}

async function buildFatalDiagnostics(): Promise<FatalDiagnostics> {
  let postmortem: Record<string, unknown> | null = null;
  if (ACTIVE_RUN.market && ACTIVE_RUN.actors.length > 0 && APP_HEALTH.healthy) {
    try {
      const snapshots = await Promise.all(ACTIVE_RUN.actors.map((actor) => actorSnapshot(actor, ACTIVE_RUN.market!, new Map())));
      postmortem = {
        marketSnapshot: await marketSnapshot(ACTIVE_RUN.market, new Map()),
        actorSnapshots: snapshots,
      };
    } catch (error) {
      postmortem = { collectionFailed: summarizeError(error) };
    }
  }
  return {
    appHealth: serializeAppHealthState(),
    lastSuccessfulApiCallAt: toIso(RUN_MONITOR.lastSuccessfulApiCallAt),
    lastSuccessfulApiEndpoint: RUN_MONITOR.lastSuccessfulApiEndpoint,
    lastSuccessfulBotEventAt: toIso(RUN_MONITOR.lastSuccessfulBotEventAt),
    lastSuccessfulMarketEventAt: toIso(RUN_MONITOR.lastSuccessfulMarketEventAt),
    lastSuccessfulAccountEventAt: toIso(RUN_MONITOR.lastSuccessfulAccountEventAt),
    lastSuccessfulPollingSyncAt: toIso(RUN_MONITOR.lastSuccessfulPollingSyncAt),
    transportRetryCount: RUN_MONITOR.transportRetryCount,
    botStates: Object.fromEntries(RUN_MONITOR.botStates.entries()),
    postmortem,
  };
}

main().catch(async (error) => {
  await log({
    kind: "fatal",
    error: error instanceof Error ? error.stack ?? error.message : String(error),
    diagnostics: await buildFatalDiagnostics(),
  }).catch(() => undefined);
  console.error(error);
  process.exitCode = 1;
}).finally(async () => { await prisma.$disconnect(); });
