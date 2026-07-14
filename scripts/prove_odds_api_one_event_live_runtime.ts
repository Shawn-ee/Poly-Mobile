import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { loadLocalEnvForScript } from "./local_env";
import type {
  type OddsApiCallRecord,
  type OddsApiEvent,
  type OddsApiEventOddsResponse,
  type OddsApiMarketsResponse,
  type OddsApiSport,
} from "@/server/services/theOddsApiSingleEventProvider";

const DEFAULT_BASE_URL = "http://127.0.0.1:3002";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json";
const DEFAULT_REGION = "us";
const DEFAULT_ODDS_FORMAT = "decimal";
const DEFAULT_MAX_CREDITS = 16;
const DEFAULT_MIN_REMAINING = 2;
const DEFAULT_REFRESH_ITERATIONS = 2;
const DEFAULT_REFRESH_INTERVAL_MS = 15_000;
const DEFAULT_QUOTE_OFFSET_TICKS = 2;
const TICK_SIZE = 0.01;

type SelectedMarket = Awaited<ReturnType<typeof loadSelectedMarket>>;

let prisma: typeof import("@/lib/db")["prisma"];
let API_KEY_SCOPES: typeof import("@/lib/canonicalAuth")["API_KEY_SCOPES"];
let createApiCredential: typeof import("@/lib/canonicalAuth")["createApiCredential"];
let mintCompleteSetForPublicOrderbook: typeof import("@/server/services/orderbookCollateral")["mintCompleteSetForPublicOrderbook"];
let cancelOrderAndUnlock: typeof import("@/server/services/matching")["cancelOrderAndUnlock"];
let placeOrderAndMatch: typeof import("@/server/services/matching")["placeOrderAndMatch"];
let assertQuotaBudget: typeof import("@/server/services/theOddsApiSingleEventProvider")["assertQuotaBudget"];
let availableMarketKeysFromResponse: typeof import("@/server/services/theOddsApiSingleEventProvider")["availableMarketKeysFromResponse"];
let normalizeOddsApiEvent: typeof import("@/server/services/theOddsApiSingleEventProvider")["normalizeOddsApiEvent"];
let oddsApiGetJson: typeof import("@/server/services/theOddsApiSingleEventProvider")["oddsApiGetJson"];
let quotaCost: typeof import("@/server/services/theOddsApiSingleEventProvider")["quotaCost"];
let seedOddsApiSingleEvent: typeof import("@/server/services/theOddsApiSingleEventProvider")["seedOddsApiSingleEvent"];
let selectCandidateSoccerSports: typeof import("@/server/services/theOddsApiSingleEventProvider")["selectCandidateSoccerSports"];
let selectOddsMarkets: typeof import("@/server/services/theOddsApiSingleEventProvider")["selectOddsMarkets"];
let selectPreferredEvent: typeof import("@/server/services/theOddsApiSingleEventProvider")["selectPreferredEvent"];
let writeProviderRefreshRun: typeof import("@/server/services/providerRefreshRun")["writeProviderRefreshRun"];

const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const intArg = (name: string, fallback: number) => {
  const value = Number(argValue(name));
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
};

const boolFlag = (name: string) => process.argv.includes(`--${name}`);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function loadRuntimeDependencies() {
  loadLocalEnvForScript(["DATABASE_URL"]);
  ({ prisma } = await import("@/lib/db"));
  ({ API_KEY_SCOPES, createApiCredential } = await import("@/lib/canonicalAuth"));
  ({ mintCompleteSetForPublicOrderbook } = await import("@/server/services/orderbookCollateral"));
  ({ cancelOrderAndUnlock, placeOrderAndMatch } = await import("@/server/services/matching"));
  ({
    assertQuotaBudget,
    availableMarketKeysFromResponse,
    normalizeOddsApiEvent,
    oddsApiGetJson,
    quotaCost,
    seedOddsApiSingleEvent,
    selectCandidateSoccerSports,
    selectOddsMarkets,
    selectPreferredEvent,
  } = await import("@/server/services/theOddsApiSingleEventProvider"));
  ({ writeProviderRefreshRun } = await import("@/server/services/providerRefreshRun"));
}

async function writeJson(outputPath: string, value: unknown) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function fetchRaw(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, body };
}

async function fetchJson(url: string, init?: RequestInit) {
  const result = await fetchRaw(url, init);
  assert(result.ok, `Expected ${url} ${result.status}: ${JSON.stringify(result.body)}`);
  return result.body;
}

function utcWindow(daysAhead: number) {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysAhead, 0, 0, 0));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysAhead + 1, 0, 0, 0));
  return {
    from: from.toISOString().replace(".000Z", "Z"),
    to: to.toISOString().replace(".000Z", "Z"),
  };
}

async function selectOneUpcomingSoccerEvent(params: {
  apiKey: string;
  calls: OddsApiCallRecord[];
  selectedSportKey?: string;
  selectedEventId?: string;
  maxCredits: number;
  minRemaining: number;
}) {
  const sports = await oddsApiGetJson<OddsApiSport[]>({
    name: "sports",
    path: "/sports",
    apiKey: params.apiKey,
    calls: params.calls,
  });
  assertQuotaBudget({ calls: params.calls, maxCredits: params.maxCredits, minRemaining: params.minRemaining });
  const candidateSports = params.selectedSportKey
    ? sports.filter((sport) => sport.key === params.selectedSportKey)
    : selectCandidateSoccerSports(sports, 10);
  assert(candidateSports.length > 0, "No active soccer sports were available.");

  for (let day = 0; day < 7; day += 1) {
    const window = utcWindow(day);
    for (const sport of candidateSports) {
      const events = await oddsApiGetJson<OddsApiEvent[]>({
        name: `events:${sport.key}`,
        path: `/sports/${encodeURIComponent(sport.key)}/events`,
        apiKey: params.apiKey,
        calls: params.calls,
        searchParams: {
          dateFormat: "iso",
          commenceTimeFrom: window.from,
          commenceTimeTo: window.to,
          eventIds: params.selectedEventId,
        },
      });
      assertQuotaBudget({ calls: params.calls, maxCredits: params.maxCredits, minRemaining: params.minRemaining });
      const futureEvents = events.filter((event) => Date.parse(event.commence_time) > Date.now());
      const event = params.selectedEventId
        ? futureEvents.find((item) => item.id === params.selectedEventId) ?? null
        : selectPreferredEvent(futureEvents);
      if (event) return { sport, event, window };
    }
  }

  return null;
}

async function fetchAndSeedLiveEvent(params: {
  apiKey: string;
  calls: OddsApiCallRecord[];
  sportKey: string;
  eventId: string;
  selectedMarketKeys?: string[];
  maxCredits: number;
  minRemaining: number;
}) {
  let selectedMarketKeys = params.selectedMarketKeys;
  if (!selectedMarketKeys || selectedMarketKeys.length === 0) {
    const marketsResponse = await oddsApiGetJson<OddsApiMarketsResponse>({
      name: "event-markets",
      path: `/sports/${encodeURIComponent(params.sportKey)}/events/${encodeURIComponent(params.eventId)}/markets`,
      apiKey: params.apiKey,
      calls: params.calls,
      searchParams: {
        regions: DEFAULT_REGION,
        dateFormat: "iso",
      },
    });
    assertQuotaBudget({ calls: params.calls, maxCredits: params.maxCredits, minRemaining: params.minRemaining });
    selectedMarketKeys = selectOddsMarkets(availableMarketKeysFromResponse(marketsResponse), 3);
  }
  assert(selectedMarketKeys.length > 0, "Selected event has no supported MVP odds markets.");

  const oddsResponse = await oddsApiGetJson<OddsApiEventOddsResponse>({
    name: "event-odds",
    path: `/sports/${encodeURIComponent(params.sportKey)}/events/${encodeURIComponent(params.eventId)}/odds`,
    apiKey: params.apiKey,
    calls: params.calls,
    searchParams: {
      regions: DEFAULT_REGION,
      markets: selectedMarketKeys.join(","),
      oddsFormat: DEFAULT_ODDS_FORMAT,
      dateFormat: "iso",
    },
  });
  assertQuotaBudget({ calls: params.calls, maxCredits: params.maxCredits, minRemaining: params.minRemaining });
  const normalizedMarkets = normalizeOddsApiEvent(oddsResponse);
  assert(normalizedMarkets.length > 0, "Provider returned no mobile-visible normalized markets.");
  const seed = await seedOddsApiSingleEvent({
    oddsEvent: oddsResponse,
    markets: normalizedMarkets,
    region: DEFAULT_REGION,
    oddsFormat: DEFAULT_ODDS_FORMAT,
  });
  return {
    oddsResponse,
    selectedMarketKeys,
    normalizedMarkets,
    seed,
  };
}

async function forceSelectedMarketSnapshotsStale(marketId: string) {
  const staleAt = new Date(Date.now() - 5 * 60 * 1000);
  await prisma.referenceQuoteSnapshot.updateMany({
    where: { marketId, source: "sportsbook-odds" },
    data: { fetchedAt: staleAt },
  });
  await prisma.marketOutcomeSnapshot.updateMany({
    where: { marketId },
    data: { ts: staleAt },
  });
  return staleAt.toISOString();
}

async function loadSelectedMarket(eventSlug: string) {
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      markets: {
        where: {
          referenceSource: "sportsbook-odds",
          isListed: true,
          visibility: "PUBLIC",
          status: "LIVE",
          outcomes: { some: { isActive: true, isTradable: true, referenceTokenId: { not: null } } },
        },
        include: {
          outcomes: {
            where: { isActive: true, isTradable: true, referenceTokenId: { not: null } },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          },
          referenceQuoteSnapshots: {
            orderBy: [{ fetchedAt: "desc" }, { updatedAt: "desc" }],
            take: 10,
          },
        },
        orderBy: [{ marketGroupKey: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  assert(event, `Missing seeded event ${eventSlug}.`);
  const market =
    event.markets.find((item) => item.marketType === "total_goals" && item.line?.toString() === "2.5") ??
    event.markets.find((item) => item.marketType === "spread" && ["1.5", "2.5", "3.5"].includes(item.line?.toString() ?? "")) ??
    event.markets.find((item) => item.marketType === "match_winner_1x2" && item.outcomes.length === 2) ??
    event.markets.find((item) => item.marketType === "total_goals") ??
    event.markets.find((item) => item.marketType === "spread") ??
    event.markets[0];
  assert(market, `Seeded event ${eventSlug} has no tradable sportsbook markets.`);
  const outcome = market.outcomes[0];
  assert(outcome, `Selected market ${market.id} has no tradable outcome.`);
  const snapshot = market.referenceQuoteSnapshots.find((item) => item.outcomeId === outcome.id) ?? null;
  assert(snapshot, `Selected outcome ${outcome.id} has no provider quote snapshot.`);
  return { event, market, outcome, snapshot };
}

async function tryLoadSelectedMarket(eventSlug: string) {
  try {
    return await loadSelectedMarket(eventSlug);
  } catch {
    return null;
  }
}

function snapshotPricePlan(snapshot: SelectedMarket["snapshot"], offsetTicks: number) {
  const outcomePrice = decimalToNumber(snapshot.outcomePrice) ?? 0.5;
  const referenceBid = decimalToNumber(snapshot.bestBid) ?? Math.max(0.01, outcomePrice - TICK_SIZE);
  const referenceAsk = decimalToNumber(snapshot.bestAsk) ?? Math.min(0.99, outcomePrice + TICK_SIZE);
  let plannedBid = clampPrice(referenceBid - offsetTicks * TICK_SIZE);
  let plannedAsk = clampPrice(referenceAsk + offsetTicks * TICK_SIZE);
  if (plannedBid >= plannedAsk) {
    plannedBid = clampPrice(outcomePrice - offsetTicks * TICK_SIZE);
    plannedAsk = clampPrice(outcomePrice + offsetTicks * TICK_SIZE);
  }
  if (plannedBid >= plannedAsk) {
    plannedBid = clampPrice(outcomePrice - 0.03);
    plannedAsk = clampPrice(outcomePrice + 0.03);
  }
  return { outcomePrice, referenceBid, referenceAsk, plannedBid, plannedAsk };
}

async function currentOutcomeBook(marketId: string, outcomeId: string) {
  const orders = await prisma.order.findMany({
    where: {
      marketId,
      outcomeId,
      status: { in: ["OPEN", "PARTIAL"] },
    },
    select: { side: true, price: true, remaining: true, user: { select: { username: true } } },
  });
  const bids = orders
    .filter((order) => order.side === "BUY")
    .map((order) => decimalToNumber(order.price))
    .filter((value): value is number => value !== null);
  const asks = orders
    .filter((order) => order.side === "SELL")
    .map((order) => decimalToNumber(order.price))
    .filter((value): value is number => value !== null);
  return {
    bestBid: bids.length ? Math.max(...bids) : null,
    bestAsk: asks.length ? Math.min(...asks) : null,
    openOrderCount: orders.length,
    orders: orders.map((order) => ({
      side: order.side,
      price: order.price.toString(),
      remaining: order.remaining.toString(),
      username: order.user.username,
    })),
  };
}

async function reconcileLocalProofCollateral(marketId: string) {
  assert(process.env.NODE_ENV !== "production", "Refusing to reconcile proof collateral in production.");

  const market = await prisma.market.findUnique({
    where: { id: marketId },
    select: {
      id: true,
      mechanism: true,
      visibility: true,
      collateralUSDC: true,
      referenceSource: true,
    },
  });
  assert(market, `Missing market ${marketId}.`);
  assert(
    market.mechanism === "ORDERBOOK" && market.visibility === "PUBLIC" && market.referenceSource === "sportsbook-odds",
    "Proof collateral reconciliation only supports public sportsbook-odds orderbook markets.",
  );

  const outcomes = await prisma.outcome.findMany({
    where: { marketId, isActive: true },
    select: { id: true, code: true },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });
  assert(outcomes.length >= 2, "Proof collateral reconciliation requires at least two active outcomes.");

  const grouped = await prisma.position.groupBy({
    by: ["outcomeId"],
    where: {
      marketId,
      outcomeId: { in: outcomes.map((outcome) => outcome.id) },
      shares: { gt: dec(0) },
    },
    _sum: { shares: true },
  });
  const outstanding = new Map(grouped.map((row) => [row.outcomeId, row._sum.shares ?? dec(0)]));
  const byOutcome = outcomes.map((outcome) => ({
    outcomeId: outcome.id,
    code: outcome.code,
    shares: (outstanding.get(outcome.id) ?? dec(0)).toString(),
  }));
  const expectedCollateral = dec(byOutcome[0]?.shares ?? 0);
  const imbalanced = byOutcome.some((outcome) => !dec(outcome.shares).equals(expectedCollateral));
  assert(!imbalanced, `Cannot reconcile imbalanced proof market positions: ${JSON.stringify(byOutcome)}`);

  const before = dec(market.collateralUSDC);
  if (before.equals(expectedCollateral)) {
    return {
      repaired: false,
      before: before.toString(),
      after: before.toString(),
      byOutcome,
    };
  }

  await prisma.market.update({
    where: { id: marketId },
    data: { collateralUSDC: expectedCollateral },
  });

  return {
    repaired: true,
    before: before.toString(),
    after: expectedCollateral.toString(),
    byOutcome,
  };
}

function avoidCrossingOpenBook(
  plan: ReturnType<typeof snapshotPricePlan>,
  book: Awaited<ReturnType<typeof currentOutcomeBook>>,
) {
  let plannedBid = plan.plannedBid;
  let plannedAsk = plan.plannedAsk;
  const adjustments: string[] = [];

  if (book.bestAsk !== null && plannedBid >= book.bestAsk) {
    plannedBid = clampPrice(book.bestAsk - TICK_SIZE);
    adjustments.push(`plannedBid moved below existing best ask ${book.bestAsk.toFixed(2)}`);
  }
  if (book.bestBid !== null && plannedAsk <= book.bestBid) {
    plannedAsk = clampPrice(book.bestBid + TICK_SIZE);
    adjustments.push(`plannedAsk moved above existing best bid ${book.bestBid.toFixed(2)}`);
  }
  if (plannedBid >= plannedAsk) {
    plannedBid = clampPrice(plannedAsk - TICK_SIZE);
    adjustments.push("plannedBid moved below adjusted ask to keep a non-crossing spread");
  }

  return { ...plan, plannedBid, plannedAsk, adjustments };
}

async function createUser(prefix: string, balance = "10000") {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `${prefix}_${suffix}`,
      email: `${prefix}_${suffix}@local.test`,
      isAdmin: true,
    },
  });
  await prisma.userBalance.create({
    data: { userId: user.id, availableUSDC: dec(balance), lockedUSDC: dec("0") },
  });
  return user;
}

async function createMobileCredential(prefix: string, balance = "10000") {
  const user = await createUser(prefix, balance);
  const credential = await createApiCredential({
    userId: user.id,
    name: `${prefix} live runtime proof`,
    scopes: API_KEY_SCOPES,
  });
  return { user, credential };
}

async function seedShiftedMakerQuotes(params: {
  market: SelectedMarket["market"];
  outcome: SelectedMarket["outcome"];
  plannedBid: number;
  plannedAsk: number;
}) {
  const maker = await createUser("odds_live_runtime_maker", "1000");
  await mintCompleteSetForPublicOrderbook({ marketId: params.market.id, userId: maker.id, quantity: "200" });
  const bid = await placeOrderAndMatch({
    marketId: params.market.id,
    userId: maker.id,
    outcomeId: params.outcome.id,
    side: "BUY",
    price: params.plannedBid.toFixed(2),
    size: "200",
    type: "LIMIT",
  });
  const ask = await placeOrderAndMatch({
    marketId: params.market.id,
    userId: maker.id,
    outcomeId: params.outcome.id,
    side: "SELL",
    price: params.plannedAsk.toFixed(2),
    size: "200",
    type: "LIMIT",
  });
  assert(["OPEN", "PARTIAL"].includes(bid.order.status), "Expected shifted maker bid to rest.");
  assert(["OPEN", "PARTIAL"].includes(ask.order.status), "Expected shifted maker ask to rest.");
  return { maker, bidOrderId: bid.order.id, askOrderId: ask.order.id };
}

function orderBody(params: {
  market: SelectedMarket["market"];
  outcome: SelectedMarket["outcome"];
  side: "BUY" | "SELL";
  price: number;
  size: string | number;
}) {
  return {
    marketId: params.market.id,
    outcomeId: params.outcome.id,
    side: params.side,
    type: "LIMIT",
    price: params.price.toFixed(2),
    size: String(params.size),
    contractSide: "YES",
    selection: {
      marketType: params.market.marketType === "total_goals" ? "totals" : params.market.marketType,
      marketId: params.market.id,
      outcomeId: params.outcome.id,
      marketGroupId: params.market.marketGroupKey,
      line: params.market.line?.toString() ?? undefined,
      period: params.market.period ?? undefined,
      side: params.outcome.side ?? undefined,
      displayLabel: params.outcome.label ?? params.outcome.name,
      contractSide: "yes",
      referenceSource: params.market.referenceSource ?? undefined,
      externalSlug: params.market.externalSlug ?? undefined,
      externalMarketId: params.market.externalMarketId ?? undefined,
      conditionId: params.market.conditionId ?? undefined,
      referenceTokenId: params.outcome.referenceTokenId ?? undefined,
      referenceOutcomeLabel: params.outcome.referenceOutcomeLabel ?? params.outcome.name,
      limitPrice: params.price,
      limitSide: params.side === "BUY" ? "ask" : "bid",
    },
  };
}

async function postOrder(params: {
  baseUrl: string;
  token: string;
  body: Record<string, unknown>;
  idempotencyPrefix: string;
}) {
  return fetchRaw(`${params.baseUrl}/api/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `${params.idempotencyPrefix}-${randomUUID()}`,
    },
    body: JSON.stringify({
      ...params.body,
      clientOrderId: `${params.idempotencyPrefix}-${randomUUID()}`,
    }),
  });
}

async function lifecycleForMarket(baseUrl: string, eventSlug: string, marketId: string) {
  const detail = await fetchJson(`${baseUrl}/api/mobile/events/${encodeURIComponent(eventSlug)}/live-detail`);
  const market = Array.isArray(detail.markets)
    ? detail.markets.find((item: { id?: string }) => item.id === marketId)
    : null;
  return market?.providerLifecycle ?? market?.provider ?? null;
}

async function cancelIfResting(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });
  if (!order || !["OPEN", "PARTIAL"].includes(order.status)) return false;
  await cancelOrderAndUnlock({ orderId, userId });
  return true;
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      key.toLowerCase().includes("apikey") || key.toLowerCase().includes("token") ? "[redacted]" : redact(entry),
    ]),
  );
}

function decimalToNumber(value: Prisma.Decimal | null | undefined) {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clampPrice(value: number) {
  return Number(Math.max(0.01, Math.min(0.99, value)).toFixed(2));
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run one-event live runtime proof in production.");
  }
  await loadRuntimeDependencies();
  const apiKey = process.env.THE_ODDS_API_KEY?.trim();
  assert(apiKey, "THE_ODDS_API_KEY must be set in the local environment. It is never read from files or printed.");

  const baseUrl = argValue("baseUrl") ?? DEFAULT_BASE_URL;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const maxCredits = intArg("maxCredits", DEFAULT_MAX_CREDITS);
  const minRemaining = intArg("minRemaining", DEFAULT_MIN_REMAINING);
  const refreshIterations = Math.max(1, intArg("refreshIterations", DEFAULT_REFRESH_ITERATIONS));
  const refreshIntervalMs = intArg("refreshIntervalMs", DEFAULT_REFRESH_INTERVAL_MS);
  const quoteOffsetTicks = intArg("quoteOffsetTicks", DEFAULT_QUOTE_OFFSET_TICKS);
  const skipSleep = boolFlag("skipSleep");
  const calls: OddsApiCallRecord[] = [];
  const startedAt = new Date();

  const health = await fetchRaw(`${baseUrl}/api/health`);
  assert(health.ok && health.body?.status === "ok", `Backend health failed: ${JSON.stringify(health.body)}`);

  const selected = await selectOneUpcomingSoccerEvent({
    apiKey,
    calls,
    selectedSportKey: argValue("sportKey"),
    selectedEventId: argValue("eventId"),
    maxCredits,
    minRemaining,
  });
  assert(selected, "No upcoming soccer event found inside the quota-safe search window.");

  const defaultEventSlug = "odds-api-single-soccer-test";
  const refreshes = [];
  let selectedMarket = await tryLoadSelectedMarket(defaultEventSlug);
  let selectedMarketKeys: string[] | undefined;
  let seededEventSlug = defaultEventSlug;

  if (!selectedMarket) {
    const firstRefresh = await fetchAndSeedLiveEvent({
      apiKey,
      calls,
      sportKey: selected.sport.key,
      eventId: selected.event.id,
      maxCredits,
      minRemaining,
    });
    refreshes.push(firstRefresh);
    selectedMarketKeys = firstRefresh.selectedMarketKeys;
    seededEventSlug = firstRefresh.seed.event.slug ?? defaultEventSlug;
    selectedMarket = await loadSelectedMarket(seededEventSlug);
  }

  const forcedStaleAt = await forceSelectedMarketSnapshotsStale(selectedMarket.market.id);
  const lifecycleBeforeRefresh = await lifecycleForMarket(baseUrl, selectedMarket.event.slug ?? "", selectedMarket.market.id);
  const recoveryRefreshesNeeded = selectedMarketKeys ? Math.max(1, refreshIterations - refreshes.length) : refreshIterations;

  for (let index = 0; index < recoveryRefreshesNeeded; index += 1) {
    if (!skipSleep && refreshIntervalMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, refreshIntervalMs));
    }
    refreshes.push(await fetchAndSeedLiveEvent({
      apiKey,
      calls,
      sportKey: selected.sport.key,
      eventId: selected.event.id,
      selectedMarketKeys,
      maxCredits,
      minRemaining,
    }));
    selectedMarketKeys = refreshes.at(-1)?.selectedMarketKeys ?? selectedMarketKeys;
  }
  selectedMarketKeys = refreshes.at(-1)?.selectedMarketKeys ?? selectedMarketKeys;
  seededEventSlug = refreshes.at(-1)?.seed.event.slug ?? seededEventSlug;
  selectedMarket = await loadSelectedMarket(seededEventSlug);
  const lifecycleAfterRefresh = await lifecycleForMarket(baseUrl, selectedMarket.event.slug ?? "", selectedMarket.market.id);
  const initialPricePlan = snapshotPricePlan(selectedMarket.snapshot, quoteOffsetTicks);
  const preSeedBook = await currentOutcomeBook(selectedMarket.market.id, selectedMarket.outcome.id);
  const pricePlan = avoidCrossingOpenBook(initialPricePlan, preSeedBook);
  const collateralRepair = await reconcileLocalProofCollateral(selectedMarket.market.id);
  const maker = await seedShiftedMakerQuotes({
    market: selectedMarket.market,
    outcome: selectedMarket.outcome,
    plannedBid: pricePlan.plannedBid,
    plannedAsk: pricePlan.plannedAsk,
  });

  const buyer = await createMobileCredential("odds_live_runtime_buyer");
  const buyResult = await postOrder({
    baseUrl,
    token: buyer.credential.token,
    idempotencyPrefix: "odds-live-runtime-buy",
    body: orderBody({
      market: selectedMarket.market,
      outcome: selectedMarket.outcome,
      side: "BUY",
      price: pricePlan.plannedAsk,
      size: "1",
    }),
  });
  assert(buyResult.ok, `Expected buy to pass: ${JSON.stringify(buyResult.body)}`);
  assert(buyResult.body?.order?.status === "FILLED", `Expected buy FILLED, got ${buyResult.body?.order?.status}`);

  const portfolioAfterBuy = await fetchJson(`${baseUrl}/api/portfolio`, {
    headers: { Authorization: `Bearer ${buyer.credential.token}` },
  });
  const position = (portfolioAfterBuy.positions ?? []).find(
    (item: { marketId?: string; market?: { id?: string }; outcomeId?: string }) =>
      (item.marketId ?? item.market?.id) === selectedMarket.market.id && item.outcomeId === selectedMarket.outcome.id,
  );
  assert(position, "Portfolio did not show the live-runtime position.");

  const noPosition = await createMobileCredential("odds_live_runtime_no_position");
  const noPositionSell = await postOrder({
    baseUrl,
    token: noPosition.credential.token,
    idempotencyPrefix: "odds-live-runtime-no-position-sell",
    body: orderBody({
      market: selectedMarket.market,
      outcome: selectedMarket.outcome,
      side: "SELL",
      price: pricePlan.plannedBid,
      size: "1",
    }),
  });

  const originalStatus = selectedMarket.market.status;
  let closedMarketOrder: Awaited<ReturnType<typeof postOrder>>;
  try {
    await prisma.market.update({ where: { id: selectedMarket.market.id }, data: { status: "CLOSED" } });
    closedMarketOrder = await postOrder({
      baseUrl,
      token: buyer.credential.token,
      idempotencyPrefix: "odds-live-runtime-closed-market",
      body: orderBody({
        market: selectedMarket.market,
        outcome: selectedMarket.outcome,
        side: "BUY",
        price: pricePlan.plannedAsk,
        size: "1",
      }),
    });
  } finally {
    await prisma.market.update({ where: { id: selectedMarket.market.id }, data: { status: originalStatus } });
  }

  const sellResult = await postOrder({
    baseUrl,
    token: buyer.credential.token,
    idempotencyPrefix: "odds-live-runtime-cashout-sell",
    body: orderBody({
      market: selectedMarket.market,
      outcome: selectedMarket.outcome,
      side: "SELL",
      price: pricePlan.plannedBid,
      size: position.shares,
    }),
  });
  assert(sellResult.ok, `Expected cashout sell to pass: ${JSON.stringify(sellResult.body)}`);
  assert(sellResult.body?.order?.status === "FILLED", `Expected sell FILLED, got ${sellResult.body?.order?.status}`);

  const [homePayload, detailPayload, portfolioAfterSell, historyPayload] = await Promise.all([
    fetchJson(`${baseUrl}/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10`),
    fetchJson(`${baseUrl}/api/mobile/events/${encodeURIComponent(selectedMarket.event.slug ?? "")}/live-detail`),
    fetchJson(`${baseUrl}/api/portfolio`, { headers: { Authorization: `Bearer ${buyer.credential.token}` } }),
    fetchJson(`${baseUrl}/api/portfolio/history`, { headers: { Authorization: `Bearer ${buyer.credential.token}` } }),
  ]);
  const homeVisible = Array.isArray(homePayload.events) &&
    homePayload.events.some((item: { slug?: string }) => item.slug === selectedMarket.event.slug);
  const detailVisible = Array.isArray(detailPayload.markets) &&
    detailPayload.markets.some((item: { id?: string }) => item.id === selectedMarket.market.id);
  const matchingTrades = (Array.isArray(historyPayload.recentTrades) ? historyPayload.recentTrades : []).filter(
    (item: { market?: { id?: string }; outcome?: { id?: string } }) =>
      item.market?.id === selectedMarket.market.id && item.outcome?.id === selectedMarket.outcome.id,
  );

  await cancelIfResting(maker.bidOrderId, maker.maker.id);
  await cancelIfResting(maker.askOrderId, maker.maker.id);

  const checks = {
    backendHealth: health.ok && health.body?.status === "ok",
    oneUpcomingProviderEventSelected: Boolean(selected.event.id),
    providerLiveRefreshRan: refreshes.length >= refreshIterations,
    quotaProtected: calls.reduce((total, call) => total + quotaCost(call.quota), 0) <= maxCredits,
    staleDetectedBeforeRefresh: lifecycleBeforeRefresh?.status === "stale" || lifecycleBeforeRefresh?.quote?.stale === true,
    readyAfterRefresh: lifecycleAfterRefresh?.status === "ready" || lifecycleAfterRefresh?.quote?.ready === true,
    shiftedMakerBidWorseThanProvider: pricePlan.plannedBid < pricePlan.referenceBid,
    shiftedMakerAskWorseThanProvider: pricePlan.plannedAsk > pricePlan.referenceAsk,
    homeVisible,
    detailVisible,
    buyFilled: buyResult.body?.order?.status === "FILLED",
    portfolioPositionVisible: Boolean(position),
    noCashoutWithoutPositionRejected: noPositionSell.status === 409 && JSON.stringify(noPositionSell.body).includes("Insufficient"),
    closedMarketRejectsTrading: closedMarketOrder.status === 409 && JSON.stringify(closedMarketOrder.body).includes("Market is not open"),
    cashoutSellFilled: sellResult.body?.order?.status === "FILLED",
    historyHasBuyAndSell: matchingTrades.some((item: { side?: string }) => item.side === "BUY") &&
      matchingTrades.some((item: { side?: string }) => item.side === "SELL"),
  };

  const summary = {
    pass: Object.values(checks).every(Boolean),
    generatedAt: new Date().toISOString(),
    startedAt: startedAt.toISOString(),
    scope: "odds-api-one-event-live-runtime",
    policy: {
      fakeTokenOnly: true,
      oneEventOnly: true,
      providerSource: "the-odds-api",
      referenceSource: "sportsbook-odds",
      maxCredits,
      minRemaining,
      refreshIterations,
      refreshIntervalMs: skipSleep ? 0 : refreshIntervalMs,
      quoteOffsetTicks,
    },
    event: {
      providerEventId: selected.event.id,
      sportKey: selected.sport.key,
      title: `${selected.event.away_team} vs. ${selected.event.home_team}`,
      commenceTime: selected.event.commence_time,
      localSlug: selectedMarket.event.slug,
    },
    provider: {
      calls,
      quota: {
        totalLastCost: calls.reduce((total, call) => total + quotaCost(call.quota), 0),
        latest: calls.at(-1)?.quota ?? null,
      },
      selectedMarketKeys,
      importedMarketKeys: Array.from(new Set(refreshes.flatMap((item) => item.normalizedMarkets.map((market) => market.marketKey)))),
      normalizedMarketCount: refreshes.at(-1)?.normalizedMarkets.length ?? 0,
      seed: refreshes.at(-1)?.seed ?? null,
    },
    selectedMarket: {
      id: selectedMarket.market.id,
      slug: selectedMarket.market.slug,
      title: selectedMarket.market.title,
      marketType: selectedMarket.market.marketType,
      marketGroupKey: selectedMarket.market.marketGroupKey,
      line: selectedMarket.market.line?.toString() ?? null,
      outcomeId: selectedMarket.outcome.id,
      outcomeName: selectedMarket.outcome.name,
      referenceTokenId: selectedMarket.outcome.referenceTokenId,
    },
    lifecycle: {
      forcedStaleAt,
      beforeRefresh: lifecycleBeforeRefresh,
      afterRefresh: lifecycleAfterRefresh,
      open: { marketStatus: originalStatus },
      suspended: { supportedByManualPauseRoute: true, route: "POST /api/admin/markets/:id/pause" },
      closed: { proofRejectedOrder: closedMarketOrder.status, route: "POST /api/admin/markets/:id/close" },
      settlementReadiness: {
        automaticSettlement: false,
        manualResolveRoute: "POST /api/admin/markets/:id/resolve",
        reason: "Official soccer result provider and automatic settlement scheduler are not wired for Odds API Local MVP.",
      },
    },
    marketMaker: {
      continuous: false,
      mode: "bounded-proof-local-shifted-maker",
      makerUserId: maker.maker.id,
      bidOrderId: maker.bidOrderId,
      askOrderId: maker.askOrderId,
      referenceBid: pricePlan.referenceBid,
      referenceAsk: pricePlan.referenceAsk,
      preSeedBook,
      collateralRepair,
      adjustments: pricePlan.adjustments,
      plannedBid: pricePlan.plannedBid,
      plannedAsk: pricePlan.plannedAsk,
    },
    flow: {
      buyOrder: redact(buyResult.body?.order ?? null),
      sellOrder: redact(sellResult.body?.order ?? null),
      positionAfterBuy: redact(position),
      portfolioAfterSellPositionCount: Array.isArray(portfolioAfterSell.positions) ? portfolioAfterSell.positions.length : null,
      matchingTradeCount: matchingTrades.length,
      noPositionSell: { status: noPositionSell.status, body: noPositionSell.body },
      closedMarketOrder: { status: closedMarketOrder.status, body: closedMarketOrder.body },
    },
    routes: {
      health: "GET /api/health",
      home: "GET /api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1",
      detail: "GET /api/mobile/events/:slug/live-detail",
      quote: "GET /api/markets/:marketId/quote",
      order: "POST /api/orders",
      portfolio: "GET /api/portfolio",
      history: "GET /api/portfolio/history",
    },
    checks,
    gaps: {
      p0: Object.entries(checks).filter(([, value]) => !value).map(([key]) => key),
      p1: [
        "installed unattended market-maker service ownership is not complete; this proof is bounded",
        "event close/suspend scheduler runs under the local foreground supervisor but is not installed as an unattended service",
        "production official-result auto-settlement is not complete; local settlement remains CLOSED-market and exact-confirmation guarded",
      ],
      p2: ["multi-event polling remains out of scope to protect quota"],
    },
  };

  await writeJson(outputPath, summary);
  await writeProviderRefreshRun({
    providerSource: summary.policy.providerSource,
    referenceSource: summary.policy.referenceSource,
    status: summary.pass ? "passed" : "failed",
    mode: "bounded-live-provider-proof",
    startedAt,
    finishedAt: summary.generatedAt,
    eventSlug: summary.event.localSlug,
    providerEventId: summary.event.providerEventId,
    sportKey: summary.event.sportKey,
    selectedMarketId: summary.selectedMarket.id,
    selectedOutcomeId: summary.selectedMarket.outcomeId,
    refreshIterations: summary.policy.refreshIterations,
    providerCallCount: summary.provider.calls.length,
    quotaCost: summary.provider.quota.totalLastCost,
    requestsRemaining: summary.provider.quota.latest?.requestsRemaining ?? null,
    maxCredits: summary.policy.maxCredits,
    minRemaining: summary.policy.minRemaining,
    marketCount: summary.provider.normalizedMarketCount,
    outcomeCount: summary.provider.seed?.outcomeCount ?? 0,
    snapshotCount: summary.provider.seed?.outcomeCount ?? 0,
    staleBeforeRefresh: checks.staleDetectedBeforeRefresh,
    readyAfterRefresh: checks.readyAfterRefresh,
    metadata: {
      source: "local-provider-refresh-proof",
      emittedBy: "scripts/prove_odds_api_one_event_live_runtime.ts",
      quotaProtected: checks.quotaProtected,
      summaryPath: outputPath,
      selectedMarketKeys: summary.provider.selectedMarketKeys,
      importedMarketKeys: summary.provider.importedMarketKeys,
      checks,
      gaps: summary.gaps,
    },
  });
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.pass) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (prisma) await prisma.$disconnect();
  });
