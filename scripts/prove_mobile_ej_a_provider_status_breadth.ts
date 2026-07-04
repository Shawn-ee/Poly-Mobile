import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { GET as getMobileLiveDetail } from "@/app/api/mobile/events/[slug]/live-detail/route";
import { upsertReferenceOrderbookDepthSnapshots } from "@/server/services/referenceOrderbookDepthSnapshots";
import { upsertReferenceQuoteSnapshots } from "@/server/services/referenceQuoteSnapshots";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-EJ-A-provider-status-breadth.json";
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

type ProofEvent = Awaited<ReturnType<typeof createProofEvent>>;
type ProofMarket = ProofEvent["markets"][number];

async function createProofEvent() {
  const suffix = randomUUID().slice(0, 8);
  const now = new Date();

  return prisma.event.create({
    data: {
      slug: `mobile-ej-a-provider-status-breadth-${suffix}`,
      title: "EJ-A Provider Status Breadth",
      description: "Disposable backend event for route-backed provider lifecycle breadth.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "Breadth Home",
      awayTeamName: "Breadth Away",
      status: "live",
      liveStatus: "LIVE",
      period: "Live",
      clock: "78:00",
      homeScore: 2,
      awayScore: 1,
      metadata: {
        providerFixture: {
          providerSource: "polymarket-gamma",
          providerEventSlug: `ej-a-provider-event-${suffix}`,
          providerEventId: `gamma-event-ej-a-${suffix}`,
          sport: "soccer",
          live: true,
          opticOddsFixtureId: `optic-fixture-ej-a-${suffix}`,
          opticOddsApiKeyRequired: false,
        },
        mobileLiveDetail: {
          liveDataStatus: {
            source: "polymarket-gamma",
            status: "ready",
            lastUpdated: now.toISOString(),
            reason: "EJ-A route-backed live-detail provider status breadth event.",
          },
        },
      },
      markets: {
        create: [
          {
            slug: `mobile-ej-a-ready-moneyline-${suffix}`,
            title: "Breadth Home vs Breadth Away - Match Winner",
            description: "EJ-A route-backed ready provider lifecycle target.",
            status: "LIVE",
            mechanism: "ORDERBOOK",
            visibility: "PUBLIC",
            kind: "ORDERBOOK",
            type: "BINARY",
            marketType: "moneyline",
            marketGroupKey: "main",
            marketGroupTitle: "Match Winner",
            displayOrder: 0,
            period: "full-game",
            referenceSource: "polymarket",
            externalSlug: `ej-a-ready-market-${suffix}`,
            externalMarketId: `gamma-ej-a-ready-market-${suffix}`,
            conditionId: `condition-ej-a-ready-${suffix}`,
            sourceUpdatedAt: now,
            isListed: true,
            outcomes: {
              create: binaryOutcomes({
                suffix,
                prefix: "ready",
                homeLabel: "Breadth Home",
                awayLabel: "Breadth Away",
              }),
            },
          },
          {
            slug: `mobile-ej-a-stale-spread-${suffix}`,
            title: "Breadth Home vs Breadth Away - Spread 1.5",
            description: "EJ-A route-backed refresh-due and stale provider lifecycle target.",
            status: "LIVE",
            mechanism: "ORDERBOOK",
            visibility: "PUBLIC",
            kind: "ORDERBOOK",
            type: "BINARY",
            marketType: "spread",
            marketGroupKey: "spread",
            marketGroupTitle: "Spread",
            displayOrder: 1,
            period: "full-game",
            line: dec("1.5"),
            unit: "goals",
            referenceSource: "polymarket",
            externalSlug: `ej-a-stale-market-${suffix}`,
            externalMarketId: `gamma-ej-a-stale-market-${suffix}`,
            conditionId: `condition-ej-a-stale-${suffix}`,
            sourceUpdatedAt: now,
            isListed: true,
            outcomes: {
              create: binaryOutcomes({
                suffix,
                prefix: "stale",
                homeLabel: "Breadth Home +1.5",
                awayLabel: "Breadth Away -1.5",
              }),
            },
          },
          {
            slug: `mobile-ej-a-unavailable-total-${suffix}`,
            title: "Breadth Home vs Breadth Away - Total Goals 2.5",
            description: "EJ-A route-backed unavailable provider lifecycle target.",
            status: "LIVE",
            mechanism: "ORDERBOOK",
            visibility: "PUBLIC",
            kind: "ORDERBOOK",
            type: "BINARY",
            marketType: "total_goals",
            marketGroupKey: "totals",
            marketGroupTitle: "Totals",
            displayOrder: 2,
            period: "full-game",
            line: dec("2.5"),
            unit: "goals",
            referenceSource: "polymarket",
            externalSlug: `ej-a-unavailable-market-${suffix}`,
            externalMarketId: `gamma-ej-a-unavailable-market-${suffix}`,
            conditionId: `condition-ej-a-unavailable-${suffix}`,
            sourceUpdatedAt: now,
            isListed: true,
            outcomes: {
              create: [
                {
                  name: "Over",
                  label: "Over 2.5",
                  side: "over",
                  code: "OVER",
                  slug: `mobile-ej-a-unavailable-over-${suffix}`,
                  displayOrder: 0,
                  isActive: true,
                  isTradable: true,
                  referenceTokenId: `token-ej-a-unavailable-over-${suffix}`,
                  referenceOutcomeLabel: "Over 2.5",
                },
                {
                  name: "Under",
                  label: "Under 2.5",
                  side: "under",
                  code: "UNDER",
                  slug: `mobile-ej-a-unavailable-under-${suffix}`,
                  displayOrder: 1,
                  isActive: true,
                  isTradable: true,
                  referenceTokenId: `token-ej-a-unavailable-under-${suffix}`,
                  referenceOutcomeLabel: "Under 2.5",
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      markets: {
        orderBy: { displayOrder: "asc" },
        include: { outcomes: { orderBy: { displayOrder: "asc" } } },
      },
    },
  });
}

function binaryOutcomes(params: {
  suffix: string;
  prefix: string;
  homeLabel: string;
  awayLabel: string;
}) {
  return [
    {
      name: "Home",
      label: params.homeLabel,
      side: "home",
      code: "HOME",
      slug: `mobile-ej-a-${params.prefix}-home-${params.suffix}`,
      displayOrder: 0,
      isActive: true,
      isTradable: true,
      referenceTokenId: `token-ej-a-${params.prefix}-home-${params.suffix}`,
      referenceOutcomeLabel: params.homeLabel,
    },
    {
      name: "Away",
      label: params.awayLabel,
      side: "away",
      code: "AWAY",
      slug: `mobile-ej-a-${params.prefix}-away-${params.suffix}`,
      displayOrder: 1,
      isActive: true,
      isTradable: true,
      referenceTokenId: `token-ej-a-${params.prefix}-away-${params.suffix}`,
      referenceOutcomeLabel: params.awayLabel,
    },
  ];
}

async function seedReadyMarket(market: ProofMarket) {
  await seedMarketSnapshots({
    market,
    quoteFetchedAt: new Date(Date.now() - 15 * 1000),
    depthFetchedAt: new Date(Date.now() - 15 * 1000),
    chartFetchedAt: new Date(Date.now() - 15 * 1000),
    qualityStatus: "ej_a_ready",
    reason: "ej_a_ready_seed",
    prices: [0.58, 0.42],
    bids: [0.56, 0.4],
    asks: [0.6, 0.44],
  });
}

async function seedRefreshDueAndStaleMarket(market: ProofMarket) {
  await seedMarketSnapshots({
    market,
    quoteFetchedAt: new Date(Date.now() - 65 * 1000),
    depthFetchedAt: new Date(Date.now() - 5 * 60 * 1000),
    chartFetchedAt: new Date(Date.now() - 5 * 60 * 1000),
    qualityStatus: "ej_a_refresh_due",
    reason: "ej_a_refresh_due_seed",
    prices: [0.49, 0.51],
    bids: [0.46, 0.48],
    asks: [0.52, 0.54],
  });
}

async function seedMarketSnapshots(params: {
  market: ProofMarket;
  quoteFetchedAt: Date;
  depthFetchedAt: Date;
  chartFetchedAt: Date;
  qualityStatus: string;
  reason: string;
  prices: [number, number];
  bids: [number, number];
  asks: [number, number];
}) {
  await upsertReferenceQuoteSnapshots(params.market.outcomes.map((outcome, index) => ({
    marketId: params.market.id,
    outcomeId: outcome.id,
    source: "polymarket",
    externalSlug: params.market.externalSlug,
    externalMarketId: params.market.externalMarketId,
    conditionId: params.market.conditionId,
    tokenId: outcome.referenceTokenId,
    outcomeLabel: outcome.referenceOutcomeLabel ?? outcome.name,
    outcomePrice: params.prices[index] ?? 0.5,
    bestBid: params.bids[index] ?? 0.48,
    bestAsk: params.asks[index] ?? 0.52,
    spread: Number(((params.asks[index] ?? 0.52) - (params.bids[index] ?? 0.48)).toFixed(4)),
    lastTradePrice: params.prices[index] ?? 0.5,
    volume: 1800,
    volume24hr: 320,
    liquidity: 1100,
    liquidityClob: 1500,
    acceptingOrders: true,
    qualityStatus: params.qualityStatus,
    mmEligible: false,
    reason: params.reason,
    fetchedAt: params.quoteFetchedAt,
  })));

  await upsertReferenceOrderbookDepthSnapshots(params.market.outcomes.flatMap((outcome, index) => [
    {
      marketId: params.market.id,
      outcomeId: outcome.id,
      source: "polymarket-clob",
      externalSlug: params.market.externalSlug,
      externalMarketId: params.market.externalMarketId,
      conditionId: params.market.conditionId,
      tokenId: outcome.referenceTokenId,
      side: "bid" as const,
      price: params.bids[index] ?? 0.48,
      size: 220 + index,
      levelIndex: 0,
      fetchedAt: params.depthFetchedAt,
    },
    {
      marketId: params.market.id,
      outcomeId: outcome.id,
      source: "polymarket-clob",
      externalSlug: params.market.externalSlug,
      externalMarketId: params.market.externalMarketId,
      conditionId: params.market.conditionId,
      tokenId: outcome.referenceTokenId,
      side: "ask" as const,
      price: params.asks[index] ?? 0.52,
      size: 205 + index,
      levelIndex: 0,
      fetchedAt: params.depthFetchedAt,
    },
  ]));

  await prisma.marketOutcomeSnapshot.createMany({
    data: params.market.outcomes.map((outcome, index) => ({
      marketId: params.market.id,
      outcomeId: outcome.id,
      ts: params.chartFetchedAt,
      price: dec(String(params.prices[index] ?? 0.5)),
    })),
  });
}

async function readLiveDetailRoute(eventSlug: string) {
  const response = await getMobileLiveDetail(
    new Request(`http://localhost/api/mobile/events/${encodeURIComponent(eventSlug)}/live-detail`),
    { params: Promise.resolve({ slug: eventSlug }) },
  );
  assert(response.status === 200, `Expected live-detail route status 200, received ${response.status}.`);
  return response.json();
}

function marketStatus(payload: any, market: ProofMarket) {
  const item = payload.markets.find((candidate: any) => candidate.id === market.id);
  assert(item, `Route response did not include market ${market.id}.`);
  return {
    id: item.id,
    title: item.title,
    selection: item.selection,
    orderbookIdentity: item.orderbookIdentity,
    availability: item.availability,
    chartHistoryStatus: item.chartHistoryStatus,
    orderbookDepthSource: item.orderbookDepthSource,
    orderbookDepthStatus: item.orderbookDepthStatus,
    providerOrderbookDepth: item.providerOrderbookDepth,
    providerQuoteSnapshot: item.providerQuoteSnapshot,
    providerLifecycle: item.providerLifecycle,
  };
}

function containsForbiddenMarker(value: unknown): boolean {
  const text = JSON.stringify(value).toLowerCase();
  return text.includes("mock-ready") ||
    text.includes("fixture-ready") ||
    text.includes("frontend-fixture") ||
    text.includes("default-ready");
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to create EJ-A provider status breadth proof state in production.");
  }

  const opticOddsCredential = process.env.OPTIC_ODDS_API_KEY ? "configured" : "missing_non_blocking";
  const event = await createProofEvent();
  const readyMarket = event.markets.find((market) => market.marketGroupKey === "main");
  const staleMarket = event.markets.find((market) => market.marketGroupKey === "spread");
  const unavailableMarket = event.markets.find((market) => market.marketGroupKey === "totals");
  assert(readyMarket, "Proof event did not create the ready market.");
  assert(staleMarket, "Proof event did not create the stale market.");
  assert(unavailableMarket, "Proof event did not create the unavailable market.");

  await seedReadyMarket(readyMarket);
  await seedRefreshDueAndStaleMarket(staleMarket);

  const payload = await readLiveDetailRoute(event.slug!);
  const ready = marketStatus(payload, readyMarket);
  const refreshDueStale = marketStatus(payload, staleMarket);
  const unavailable = marketStatus(payload, unavailableMarket);

  const assertions = {
    routeBackedContract:
      payload.contract.route === "mobile-live-detail" &&
      payload.event.slug === event.slug &&
      payload.contract.batchedOrderbookDepthRequestedMarketIds.includes(readyMarket.id) &&
      payload.contract.batchedOrderbookDepthRequestedMarketIds.includes(staleMarket.id) &&
      payload.contract.batchedOrderbookDepthRequestedMarketIds.includes(unavailableMarket.id),
    readyShape:
      ready.providerLifecycle.status === "ready" &&
      ready.providerLifecycle.ready === true &&
      ready.providerLifecycle.notReady === false &&
      ready.providerLifecycle.quote.status === "ready" &&
      ready.providerLifecycle.orderbookDepth.status === "ready" &&
      ready.providerLifecycle.chartHistory.status === "ready" &&
      ready.orderbookDepthSource === "provider-orderbook-depth" &&
      ready.orderbookDepthStatus === "ready" &&
      ready.orderbookIdentity.ready === true,
    refreshDueAndStaleShape:
      refreshDueStale.providerLifecycle.status === "stale" &&
      refreshDueStale.providerLifecycle.ready === false &&
      refreshDueStale.providerLifecycle.stale === true &&
      refreshDueStale.providerLifecycle.notReady === true &&
      refreshDueStale.providerLifecycle.quote.status === "refresh_due" &&
      refreshDueStale.providerLifecycle.quote.refreshDue === true &&
      refreshDueStale.providerLifecycle.orderbookDepth.status === "stale" &&
      refreshDueStale.providerLifecycle.orderbookDepth.stale === true &&
      refreshDueStale.providerLifecycle.chartHistory.status === "stale" &&
      refreshDueStale.providerOrderbookDepth.status === "stale" &&
      refreshDueStale.orderbookIdentity.isStale === true,
    unavailableNotReadyShape:
      unavailable.providerLifecycle.status === "unavailable" &&
      unavailable.providerLifecycle.ready === false &&
      unavailable.providerLifecycle.unavailable === true &&
      unavailable.providerLifecycle.empty === true &&
      unavailable.providerLifecycle.notReady === true &&
      unavailable.providerLifecycle.quote.status === "unavailable" &&
      unavailable.providerLifecycle.orderbookDepth.status === "unavailable" &&
      unavailable.providerLifecycle.chartHistory.status === "unavailable" &&
      unavailable.providerOrderbookDepth.status === "unavailable" &&
      unavailable.chartHistoryStatus.status === "unavailable" &&
      unavailable.orderbookIdentity.ready === false,
    polymarketFirstClobShaped:
      ready.providerLifecycle.quote.source === "polymarket" &&
      ready.providerLifecycle.orderbookDepth.source === "polymarket-clob" &&
      ready.providerLifecycle.chartHistory.source === "polymarket-clob-prices-history" &&
      refreshDueStale.providerLifecycle.quote.source === "polymarket" &&
      refreshDueStale.providerLifecycle.orderbookDepth.source === "polymarket-clob" &&
      refreshDueStale.providerLifecycle.chartHistory.source === "polymarket-clob-prices-history",
    aggregateContractCapturesBreadth:
      payload.contract.providerLifecycle.status === "stale" &&
      payload.contract.providerLifecycle.stale === true &&
      payload.contract.providerLifecycle.unavailable === true &&
      payload.contract.batchedProviderOrderbookDepthReadyCount >= 1 &&
      payload.contract.batchedProviderOrderbookDepthStaleCount >= 1 &&
      payload.contract.batchedProviderOrderbookDepthRefreshDueCount >= 1 &&
      payload.contract.batchedChartHistoryReadyCount >= 1 &&
      payload.contract.batchedChartHistoryStaleCount >= 1 &&
      payload.contract.batchedChartHistoryRefreshDueCount >= 1,
    noFixtureMockOrDefaultReadyLabels: !containsForbiddenMarker({
      contract: payload.contract,
      ready,
      refreshDueStale,
      unavailable,
    }),
    missingOpticOddsApiKeyIsNonBlocking:
      opticOddsCredential === "configured" || ready.providerLifecycle.ready === true,
  };

  const summary = {
    pass: Object.values(assertions).every(Boolean),
    generatedAt: new Date().toISOString(),
    proof: "EJ-A live-detail route returns route-backed provider status breadth for disposable backend rows: ready, refresh_due plus stale, and unavailable/not-ready.",
    opticOddsCredential,
    eventSlug: event.slug,
    route: "/api/mobile/events/:slug/live-detail",
    markets: {
      readyMarketId: readyMarket.id,
      refreshDueStaleMarketId: staleMarket.id,
      unavailableMarketId: unavailableMarket.id,
    },
    routeStatus: {
      contract: payload.contract,
      eventLiveDataStatus: payload.event.liveDataStatus,
      eventProviderLifecycle: payload.event.providerLifecycle,
      ready,
      refreshDueStale,
      unavailable,
    },
    assertions,
    remainingGap: "This is backend route proof only; visible tablet rendering and broader production mapped-market coverage remain outside Agent A ownership.",
  };

  const resolved = path.resolve(outputPath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

  if (!summary.pass) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
