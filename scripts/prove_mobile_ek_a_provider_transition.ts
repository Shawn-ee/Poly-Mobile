import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { GET as getMobileLiveDetail } from "@/app/api/mobile/events/[slug]/live-detail/route";
import { executeMobileLiveProviderRefreshRoute } from "@/app/api/mobile/events/[slug]/provider-refresh/route";
import { upsertReferenceOrderbookDepthSnapshots } from "@/server/services/referenceOrderbookDepthSnapshots";
import { upsertReferenceQuoteSnapshots } from "@/server/services/referenceQuoteSnapshots";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-EK-A-provider-transition/cycle-EK-A-provider-transition.json";
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
      slug: `mobile-ek-a-provider-transition-${suffix}`,
      title: "EK-A Provider Transition",
      description: "Disposable backend event for route-backed provider lifecycle transition breadth.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "Transition Home",
      awayTeamName: "Transition Away",
      status: "live",
      liveStatus: "LIVE",
      period: "Live",
      clock: "82:00",
      homeScore: 2,
      awayScore: 2,
      metadata: {
        providerFixture: {
          providerSource: "polymarket-gamma",
          providerEventSlug: `ek-a-provider-event-${suffix}`,
          providerEventId: `gamma-event-ek-a-${suffix}`,
          sport: "soccer",
          live: true,
          opticOddsApiKeyRequired: false,
        },
        mobileLiveDetail: {
          liveDataStatus: {
            source: "polymarket-gamma",
            status: "ready",
            lastUpdated: now.toISOString(),
            reason: "EK-A route-backed live-detail/provider-refresh transition event.",
          },
        },
      },
      markets: {
        create: [
          {
            slug: `mobile-ek-a-ready-moneyline-${suffix}`,
            title: "Transition Home vs Transition Away - Match Winner",
            description: "EK-A route-backed ready provider lifecycle target.",
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
            externalSlug: `ek-a-ready-market-${suffix}`,
            externalMarketId: `gamma-ek-a-ready-market-${suffix}`,
            conditionId: `condition-ek-a-ready-${suffix}`,
            sourceUpdatedAt: now,
            isListed: true,
            outcomes: {
              create: binaryOutcomes({
                suffix,
                prefix: "ready",
                homeLabel: "Transition Home",
                awayLabel: "Transition Away",
              }),
            },
          },
          {
            slug: `mobile-ek-a-stale-spread-${suffix}`,
            title: "Transition Home vs Transition Away - Spread 1.5",
            description: "EK-A selected stale/refresh-due provider lifecycle transition target.",
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
            externalSlug: `ek-a-stale-market-${suffix}`,
            externalMarketId: `gamma-ek-a-stale-market-${suffix}`,
            conditionId: `condition-ek-a-stale-${suffix}`,
            sourceUpdatedAt: now,
            isListed: true,
            outcomes: {
              create: binaryOutcomes({
                suffix,
                prefix: "stale",
                homeLabel: "Transition Home +1.5",
                awayLabel: "Transition Away -1.5",
              }),
            },
          },
          {
            slug: `mobile-ek-a-unavailable-total-${suffix}`,
            title: "Transition Home vs Transition Away - Total Goals 2.5",
            description: "EK-A route-backed unavailable/not-ready provider lifecycle control.",
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
            externalSlug: null,
            externalMarketId: null,
            conditionId: null,
            sourceUpdatedAt: now,
            isListed: true,
            outcomes: {
              create: [
                {
                  name: "Over",
                  label: "Over 2.5",
                  side: "over",
                  code: "OVER",
                  slug: `mobile-ek-a-unavailable-over-${suffix}`,
                  displayOrder: 0,
                  isActive: true,
                  isTradable: true,
                  referenceTokenId: null,
                  referenceOutcomeLabel: "Over 2.5",
                },
                {
                  name: "Under",
                  label: "Under 2.5",
                  side: "under",
                  code: "UNDER",
                  slug: `mobile-ek-a-unavailable-under-${suffix}`,
                  displayOrder: 1,
                  isActive: true,
                  isTradable: true,
                  referenceTokenId: null,
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
      slug: `mobile-ek-a-${params.prefix}-home-${params.suffix}`,
      displayOrder: 0,
      isActive: true,
      isTradable: true,
      referenceTokenId: `token-ek-a-${params.prefix}-home-${params.suffix}`,
      referenceOutcomeLabel: params.homeLabel,
    },
    {
      name: "Away",
      label: params.awayLabel,
      side: "away",
      code: "AWAY",
      slug: `mobile-ek-a-${params.prefix}-away-${params.suffix}`,
      displayOrder: 1,
      isActive: true,
      isTradable: true,
      referenceTokenId: `token-ek-a-${params.prefix}-away-${params.suffix}`,
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
    qualityStatus: "ek_a_ready",
    reason: "ek_a_ready_seed",
    prices: [0.57, 0.43],
    bids: [0.55, 0.41],
    asks: [0.59, 0.45],
  });
}

async function seedRefreshDueAndStaleMarket(market: ProofMarket) {
  await seedMarketSnapshots({
    market,
    quoteFetchedAt: new Date(Date.now() - 65 * 1000),
    depthFetchedAt: new Date(Date.now() - 5 * 60 * 1000),
    chartFetchedAt: new Date(Date.now() - 5 * 60 * 1000),
    qualityStatus: "ek_a_refresh_due",
    reason: "ek_a_refresh_due_seed",
    prices: [0.48, 0.52],
    bids: [0.45, 0.49],
    asks: [0.51, 0.55],
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

function installProviderFetchStub(markets: ProofMarket[]) {
  const originalFetch = globalThis.fetch;
  const bySlug = new Map(markets.flatMap((market) => market.externalSlug ? [[market.externalSlug, market]] : []));

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.hostname === "gamma-api.polymarket.com" && url.pathname === "/markets") {
      const slug = url.searchParams.get("slug");
      const market = slug ? bySlug.get(slug) : null;
      if (!market) return jsonResponse([]);
      return jsonResponse([{
        slug,
        bestBid: market.marketGroupKey === "spread" ? 0.5 : 0.56,
        bestAsk: market.marketGroupKey === "spread" ? 0.54 : 0.6,
        spread: 0.04,
        lastTradePrice: market.marketGroupKey === "spread" ? 0.52 : 0.58,
        volume: 2400,
        volume24hr: 410,
        liquidity: 1500,
        liquidityClob: 1900,
        acceptingOrders: true,
        outcomes: JSON.stringify(market.outcomes.map((outcome) => outcome.referenceOutcomeLabel ?? outcome.name)),
        clobTokenIds: JSON.stringify(market.outcomes.map((outcome) => outcome.referenceTokenId)),
        outcomePrices: JSON.stringify(market.outcomes.map((_, index) => index === 0 ? 0.52 : 0.48)),
      }]);
    }

    if (url.hostname === "clob.polymarket.com" && url.pathname === "/book") {
      const tokenId = url.searchParams.get("token_id") ?? "unknown";
      const away = tokenId.includes("away");
      return jsonResponse({
        asset_id: tokenId,
        timestamp: String(Math.floor(Date.now() / 1000)),
        bids: [
          { price: away ? "0.46" : "0.50", size: "180" },
          { price: away ? "0.45" : "0.49", size: "160" },
        ],
        asks: [
          { price: away ? "0.50" : "0.54", size: "170" },
          { price: away ? "0.51" : "0.55", size: "150" },
        ],
      });
    }

    if (url.hostname === "clob.polymarket.com" && url.pathname === "/prices-history") {
      const tokenId = url.searchParams.get("market") ?? "unknown";
      const nowSeconds = Math.floor(Date.now() / 1000);
      return jsonResponse({
        history: [
          { t: nowSeconds - 120, p: tokenId.includes("away") ? 0.47 : 0.53 },
          { t: nowSeconds - 60, p: tokenId.includes("away") ? 0.48 : 0.52 },
          { t: nowSeconds, p: tokenId.includes("away") ? 0.49 : 0.51 },
        ],
      });
    }

    if (url.hostname.includes("api.opticodds.com")) {
      return jsonResponse({ data: [] });
    }

    return originalFetch(input, init);
  }) as typeof fetch;

  return () => {
    globalThis.fetch = originalFetch;
  };
}

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function sameSelectedIdentity(before: any, refresh: any, after: any) {
  const refreshMarket = refresh.mappingReadiness.markets.find((market: any) => market.marketId === before.id);
  return refreshMarket?.marketId === before.id &&
    after.id === before.id &&
    after.selection.selectorKey === before.selection.selectorKey &&
    after.selection.marketFamily === before.selection.marketFamily &&
    after.selection.period === before.selection.period &&
    after.selection.line === before.selection.line &&
    JSON.stringify(after.orderbookIdentity.tokenIds) === JSON.stringify(before.orderbookIdentity.tokenIds);
}

function containsForbiddenMarker(value: unknown): boolean {
  const text = JSON.stringify(value).toLowerCase();
  return text.includes("mock-ready") ||
    text.includes("fixture-ready") ||
    text.includes("frontend-fixture") ||
    text.includes("default-ready") ||
    text.includes("fallback depth") ||
    text.includes("first-row fallback");
}

function cacheInvalidationPaths(cacheInvalidation: {
  invalidated: string[];
  errors: Array<{ path: string }>;
}) {
  return [
    ...cacheInvalidation.invalidated,
    ...cacheInvalidation.errors.map((error) => error.path),
  ];
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to create EK-A provider transition proof state in production.");
  }

  const opticOddsCredential = process.env.OPTIC_ODDS_API_KEY ? "configured" : "missing_non_blocking";
  const event = await createProofEvent();
  const readyMarket = event.markets.find((market) => market.marketGroupKey === "main");
  const staleMarket = event.markets.find((market) => market.marketGroupKey === "spread");
  const unavailableMarket = event.markets.find((market) => market.marketGroupKey === "totals");
  assert(readyMarket, "Proof event did not create the ready market.");
  assert(staleMarket, "Proof event did not create the stale transition market.");
  assert(unavailableMarket, "Proof event did not create the unavailable market.");

  await seedReadyMarket(readyMarket);
  await seedRefreshDueAndStaleMarket(staleMarket);

  const beforePayload = await readLiveDetailRoute(event.slug!);
  const beforeReady = marketStatus(beforePayload, readyMarket);
  const beforeTransition = marketStatus(beforePayload, staleMarket);
  const beforeUnavailable = marketStatus(beforePayload, unavailableMarket);

  const restoreFetch = installProviderFetchStub([readyMarket, staleMarket]);
  let refreshPayload: Awaited<ReturnType<typeof executeMobileLiveProviderRefreshRoute>>;
  try {
    refreshPayload = await executeMobileLiveProviderRefreshRoute(event.slug!, {
      allowContractProofFallback: false,
    });
  } finally {
    restoreFetch();
  }

  const afterPayload = await readLiveDetailRoute(event.slug!);
  const afterReady = marketStatus(afterPayload, readyMarket);
  const afterTransition = marketStatus(afterPayload, staleMarket);
  const afterUnavailable = marketStatus(afterPayload, unavailableMarket);

  const assertions = {
    routeBackedContract:
      beforePayload.contract.route === "mobile-live-detail" &&
      afterPayload.contract.route === "mobile-live-detail" &&
      beforePayload.contract.batchedOrderbookDepthRequestedMarketIds.includes(staleMarket.id) &&
      afterPayload.contract.batchedOrderbookDepthRequestedMarketIds.includes(staleMarket.id),
    readyMarketReadyBeforeAndAfter:
      beforeReady.providerLifecycle.status === "ready" &&
      beforeReady.orderbookIdentity.ready === true &&
      afterReady.providerLifecycle.status === "ready" &&
      afterReady.orderbookIdentity.ready === true,
    selectedMarketStartsRefreshDueAndStale:
      beforeTransition.providerLifecycle.status === "stale" &&
      beforeTransition.providerLifecycle.quote.status === "refresh_due" &&
      beforeTransition.providerLifecycle.quote.refreshDue === true &&
      beforeTransition.providerLifecycle.orderbookDepth.status === "stale" &&
      beforeTransition.providerLifecycle.chartHistory.status === "stale" &&
      beforeTransition.orderbookIdentity.isStale === true &&
      beforeTransition.orderbookIdentity.shouldRefresh === true,
    unavailableNotReadyRemainsExplicit:
      beforeUnavailable.providerLifecycle.status === "unavailable" &&
      beforeUnavailable.providerLifecycle.unavailable === true &&
      beforeUnavailable.providerLifecycle.empty === true &&
      beforeUnavailable.providerLifecycle.notReady === true &&
      afterUnavailable.providerLifecycle.status === "unavailable" &&
      afterUnavailable.providerLifecycle.notReady === true &&
      afterUnavailable.orderbookIdentity.ready === false,
    refreshRouteShowsTransitionExecution:
      refreshPayload.ok === true &&
      refreshPayload.providerLifecycle.source === "mobile-live-provider-refresh" &&
      refreshPayload.providerLifecycle.refreshStarted === true &&
      refreshPayload.providerLifecycle.refreshStatus === "completed" &&
      refreshPayload.providerLifecycle.refreshStartedAt != null &&
      refreshPayload.providerLifecycle.refreshCompletedAt != null &&
      refreshPayload.providerLifecycle.ready === true,
    refreshRouteNoFallback:
      refreshPayload.refresh.contractProofFallback == null &&
      refreshPayload.providerLifecycle.fallbackApplied === false &&
      refreshPayload.refresh.provider.attempted === true &&
      refreshPayload.refresh.provider.snapshotsUpdated > 0,
    selectedMarketReadyAfterRefresh:
      afterTransition.providerLifecycle.status === "ready" &&
      afterTransition.providerLifecycle.ready === true &&
      afterTransition.providerLifecycle.notReady === false &&
      afterTransition.providerLifecycle.quote.status === "ready" &&
      afterTransition.providerLifecycle.orderbookDepth.status === "ready" &&
      afterTransition.providerLifecycle.chartHistory.status === "ready" &&
      afterTransition.orderbookIdentity.ready === true &&
      afterTransition.orderbookIdentity.shouldRefresh === false,
    selectedIdentityPreserved:
      sameSelectedIdentity(beforeTransition, refreshPayload.refresh, afterTransition),
    cacheInvalidationIncludesSelectedRoutes: (() => {
      const paths = cacheInvalidationPaths(refreshPayload.cacheInvalidation);
      return paths.includes(`/api/mobile/events/${encodeURIComponent(event.slug!)}/live-detail`) &&
        paths.includes(`/api/orderbook/${staleMarket.id}/book`) &&
        paths.includes(`/api/markets/${staleMarket.id}/chart`);
    })(),
    polymarketFirstClobShaped:
      afterTransition.providerLifecycle.quote.source === "polymarket" &&
      afterTransition.providerLifecycle.orderbookDepth.source === "polymarket-clob" &&
      afterTransition.providerLifecycle.chartHistory.source === "polymarket-clob-prices-history",
    noFixtureMockOrDefaultReadyLabels: !containsForbiddenMarker({
      before: beforePayload.contract,
      refresh: refreshPayload,
      after: afterPayload.contract,
      beforeTransition,
      afterTransition,
      beforeUnavailable,
      afterUnavailable,
    }),
    missingOpticOddsApiKeyIsNonBlocking:
      opticOddsCredential === "configured" ||
      refreshPayload.providerLifecycle.lineProvider.status === "unconfigured" ||
      refreshPayload.providerLifecycle.ready === true,
  };

  const summary = {
    pass: Object.values(assertions).every(Boolean),
    generatedAt: new Date().toISOString(),
    proof: "EK-A proves route-backed live-detail unavailable/not-ready plus stale/refresh-due -> provider-refresh -> ready breadth without contract fallback.",
    opticOddsCredential,
    eventSlug: event.slug,
    routes: {
      liveDetail: "/api/mobile/events/:slug/live-detail",
      providerRefresh: "/api/mobile/events/:slug/provider-refresh",
    },
    markets: {
      readyMarketId: readyMarket.id,
      transitionMarketId: staleMarket.id,
      unavailableMarketId: unavailableMarket.id,
    },
    before: {
      contract: beforePayload.contract,
      eventProviderLifecycle: beforePayload.event.providerLifecycle,
      ready: beforeReady,
      transition: beforeTransition,
      unavailable: beforeUnavailable,
    },
    transition: {
      selectedMarketId: staleMarket.id,
      selectedSelectorKey: beforeTransition.selection.selectorKey,
      providerLifecycle: refreshPayload.providerLifecycle,
      provider: refreshPayload.refresh.provider,
      providerDepth: refreshPayload.refresh.providerDepth,
      providerHistory: refreshPayload.refresh.providerHistory,
      lineProvider: refreshPayload.refresh.lineProvider,
      contractProofFallback: refreshPayload.refresh.contractProofFallback,
      mappingReadiness: refreshPayload.refresh.mappingReadiness,
      postRefresh: refreshPayload.refresh.postRefresh,
      postRefreshDepth: refreshPayload.refresh.postRefreshDepth,
      postRefreshHistory: refreshPayload.refresh.postRefreshHistory,
      cacheInvalidation: refreshPayload.cacheInvalidation,
    },
    after: {
      contract: afterPayload.contract,
      eventProviderLifecycle: afterPayload.event.providerLifecycle,
      ready: afterReady,
      transition: afterTransition,
      unavailable: afterUnavailable,
    },
    assertions,
    remainingGaps: [
      "This is backend/provider route proof only; Android-visible pairing remains Agent B/Lead scope.",
      "Production breadth still depends on currently available real Polymarket line-family mappings beyond disposable proof rows.",
      "OPTIC_ODDS_API_KEY remains optional enrichment and is not required for this Polymarket Gamma/CLOB transition proof.",
    ],
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
