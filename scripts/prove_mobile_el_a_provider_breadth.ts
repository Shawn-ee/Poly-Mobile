import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { GET as getMobileLiveDetail } from "@/app/api/mobile/events/[slug]/live-detail/route";
import { executeMobileLiveProviderRefreshRoute } from "@/app/api/mobile/events/[slug]/provider-refresh/route";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-EL-A-provider-breadth/cycle-EL-A-provider-breadth.json";
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
      slug: `mobile-el-a-provider-breadth-${suffix}`,
      title: "EL-A Provider Breadth World Cup Live",
      description: "Disposable backend event proving multiple Polymarket-mapped compact market families.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "Breadth Home",
      awayTeamName: "Breadth Away",
      status: "live",
      liveStatus: "LIVE",
      period: "Live",
      clock: "67:00",
      homeScore: 1,
      awayScore: 1,
      metadata: {
        providerFixture: {
          providerSource: "polymarket-gamma",
          providerEventSlug: `el-a-provider-event-${suffix}`,
          providerEventId: `gamma-event-el-a-${suffix}`,
          sport: "soccer",
          live: true,
          opticOddsFixtureId: `optic-fixture-el-a-${suffix}`,
          lineMarketSourceContract: {
            intendedProvider: "optic_odds",
            fixtureKey: `optic-fixture-el-a-${suffix}`,
            missingFields: [],
            requiredForFamilies: ["spread", "total_goals", "team_total_goals"],
          },
          opticOddsApiKeyRequired: false,
        },
        mobileLiveDetail: {
          liveDataStatus: {
            source: "polymarket-gamma",
            status: "ready",
            lastUpdated: now.toISOString(),
            reason: "EL-A route-backed provider breadth proof event.",
          },
        },
      },
      markets: {
        create: [
          marketInput({
            suffix,
            slugPart: "advance",
            title: "Breadth Home vs Breadth Away - To Advance",
            marketType: "to_advance",
            marketGroupKey: "to-advance",
            marketGroupTitle: "To Advance",
            displayOrder: 0,
            period: "full-game",
            externalSlug: `el-a-advance-${suffix}`,
            externalMarketId: `gamma-el-a-advance-${suffix}`,
            conditionId: `condition-el-a-advance-${suffix}`,
            outcomes: [
              ["Home", "Breadth Home", "home"],
              ["Away", "Breadth Away", "away"],
            ],
          }),
          marketInput({
            suffix,
            slugPart: "regulation-winner",
            title: "Breadth Home vs Breadth Away - 90 Minute Winner",
            marketType: "moneyline",
            marketGroupKey: "regulation-winner",
            marketGroupTitle: "Regulation Time Winner",
            displayOrder: 1,
            period: "regulation",
            externalSlug: `el-a-regulation-winner-${suffix}`,
            externalMarketId: `gamma-el-a-regulation-winner-${suffix}`,
            conditionId: `condition-el-a-regulation-winner-${suffix}`,
            outcomes: [
              ["Home", "Breadth Home", "home"],
              ["Tie", "Tie", "draw"],
              ["Away", "Breadth Away", "away"],
            ],
          }),
          marketInput({
            suffix,
            slugPart: "spread-reg-05",
            title: "Breadth Home vs Breadth Away - Spread 0.5",
            marketType: "spread",
            marketGroupKey: "spread",
            marketGroupTitle: "Spread",
            displayOrder: 4,
            period: "regulation",
            line: "0.5",
            unit: "goals",
            externalSlug: `el-a-spread-reg-05-${suffix}`,
            externalMarketId: `gamma-el-a-spread-reg-05-${suffix}`,
            conditionId: `condition-el-a-spread-reg-05-${suffix}`,
            outcomes: [
              ["Home", "Breadth Home +0.5", "home"],
              ["Away", "Breadth Away -0.5", "away"],
            ],
          }),
          marketInput({
            suffix,
            slugPart: "spread-reg-15",
            title: "Breadth Home vs Breadth Away - Spread 1.5",
            marketType: "spread",
            marketGroupKey: "spread",
            marketGroupTitle: "Spread",
            displayOrder: 5,
            period: "regulation",
            line: "1.5",
            unit: "goals",
            externalSlug: `el-a-spread-reg-15-${suffix}`,
            externalMarketId: `gamma-el-a-spread-reg-15-${suffix}`,
            conditionId: `condition-el-a-spread-reg-15-${suffix}`,
            outcomes: [
              ["Home", "Breadth Home +1.5", "home"],
              ["Away", "Breadth Away -1.5", "away"],
            ],
          }),
          marketInput({
            suffix,
            slugPart: "spread-1h-05",
            title: "Breadth Home vs Breadth Away - 1st Half Spread 0.5",
            marketType: "spread",
            marketGroupKey: "spread",
            marketGroupTitle: "Spread",
            displayOrder: 6,
            period: "first-half",
            line: "0.5",
            unit: "goals",
            externalSlug: `el-a-spread-1h-05-${suffix}`,
            externalMarketId: `gamma-el-a-spread-1h-05-${suffix}`,
            conditionId: `condition-el-a-spread-1h-05-${suffix}`,
            outcomes: [
              ["Home", "Breadth Home 1H +0.5", "home"],
              ["Away", "Breadth Away 1H -0.5", "away"],
            ],
          }),
          marketInput({
            suffix,
            slugPart: "spread-1h-15",
            title: "Breadth Home vs Breadth Away - 1st Half Spread 1.5",
            marketType: "spread",
            marketGroupKey: "spread",
            marketGroupTitle: "Spread",
            displayOrder: 7,
            period: "first-half",
            line: "1.5",
            unit: "goals",
            externalSlug: `el-a-spread-1h-15-${suffix}`,
            externalMarketId: `gamma-el-a-spread-1h-15-${suffix}`,
            conditionId: `condition-el-a-spread-1h-15-${suffix}`,
            outcomes: [
              ["Home", "Breadth Home 1H +1.5", "home"],
              ["Away", "Breadth Away 1H -1.5", "away"],
            ],
          }),
          marketInput({
            suffix,
            slugPart: "spread-2h-05",
            title: "Breadth Home vs Breadth Away - 2nd Half Spread 0.5",
            marketType: "spread",
            marketGroupKey: "spread",
            marketGroupTitle: "Spread",
            displayOrder: 8,
            period: "second-half",
            line: "0.5",
            unit: "goals",
            externalSlug: `el-a-spread-2h-05-${suffix}`,
            externalMarketId: `gamma-el-a-spread-2h-05-${suffix}`,
            conditionId: `condition-el-a-spread-2h-05-${suffix}`,
            outcomes: [
              ["Home", "Breadth Home 2H +0.5", "home"],
              ["Away", "Breadth Away 2H -0.5", "away"],
            ],
          }),
          marketInput({
            suffix,
            slugPart: "totals",
            title: "Breadth Home vs Breadth Away - Total Goals 2.5",
            marketType: "total_goals",
            marketGroupKey: "totals",
            marketGroupTitle: "Totals",
            displayOrder: 9,
            period: "regulation",
            line: "2.5",
            unit: "goals",
            externalSlug: `el-a-totals-${suffix}`,
            externalMarketId: `gamma-el-a-totals-${suffix}`,
            conditionId: `condition-el-a-totals-${suffix}`,
            outcomes: [
              ["Over", "Over 2.5", "over"],
              ["Under", "Under 2.5", "under"],
            ],
          }),
          marketInput({
            suffix,
            slugPart: "team-total",
            title: "Breadth Home - Team Total Goals 1.5",
            marketType: "team_total_goals",
            marketGroupKey: "team-totals",
            marketGroupTitle: "Team Total Goals",
            displayOrder: 10,
            period: "regulation",
            line: "1.5",
            unit: "goals",
            externalSlug: `el-a-team-total-${suffix}`,
            externalMarketId: `gamma-el-a-team-total-${suffix}`,
            conditionId: `condition-el-a-team-total-${suffix}`,
            outcomes: [
              ["Over", "Breadth Home Over 1.5", "over"],
              ["Under", "Breadth Home Under 1.5", "under"],
            ],
          }),
          marketInput({
            suffix,
            slugPart: "first-half-winner",
            title: "Breadth Home vs Breadth Away - 1st Half Winner",
            marketType: "match_winner_1x2",
            marketGroupKey: "first-half-winner",
            marketGroupTitle: "1st Half Winner",
            displayOrder: 2,
            period: "first-half",
            externalSlug: `el-a-first-half-winner-${suffix}`,
            externalMarketId: `gamma-el-a-first-half-winner-${suffix}`,
            conditionId: `condition-el-a-first-half-winner-${suffix}`,
            outcomes: [
              ["Home", "Breadth Home", "home"],
              ["Tie", "Tie", "draw"],
              ["Away", "Breadth Away", "away"],
            ],
          }),
          marketInput({
            suffix,
            slugPart: "second-half-winner",
            title: "Breadth Home vs Breadth Away - 2nd Half Winner",
            marketType: "match_winner_1x2",
            marketGroupKey: "second-half-winner",
            marketGroupTitle: "2nd Half Winner",
            displayOrder: 3,
            period: "second-half",
            externalSlug: `el-a-second-half-winner-${suffix}`,
            externalMarketId: `gamma-el-a-second-half-winner-${suffix}`,
            conditionId: `condition-el-a-second-half-winner-${suffix}`,
            outcomes: [
              ["Home", "Breadth Home", "home"],
              ["Tie", "Tie", "draw"],
              ["Away", "Breadth Away", "away"],
            ],
          }),
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

function marketInput(params: {
  suffix: string;
  slugPart: string;
  title: string;
  marketType: string;
  marketGroupKey: string;
  marketGroupTitle: string;
  displayOrder: number;
  period?: string;
  line?: string;
  unit?: string;
  externalSlug: string;
  externalMarketId: string;
  conditionId: string;
  outcomes: Array<[name: string, label: string, side: string]>;
}) {
  const now = new Date();
  return {
    slug: `mobile-el-a-${params.slugPart}-${params.suffix}`,
    title: params.title,
    description: "EL-A provider breadth compact market.",
    status: "LIVE",
    mechanism: "ORDERBOOK",
    visibility: "PUBLIC",
    kind: "ORDERBOOK",
    type: "BINARY",
    marketType: params.marketType,
    marketGroupKey: params.marketGroupKey,
    marketGroupTitle: params.marketGroupTitle,
    displayOrder: params.displayOrder,
    period: params.period ?? "full-game",
    line: params.line ? dec(params.line) : undefined,
    unit: params.unit,
    referenceSource: "polymarket",
    externalSlug: params.externalSlug,
    externalMarketId: params.externalMarketId,
    conditionId: params.conditionId,
    sourceUpdatedAt: now,
    isListed: true,
    outcomes: {
      create: params.outcomes.map(([name, label, side], index) => ({
        name,
        label,
        side,
        code: side.toUpperCase(),
        slug: `mobile-el-a-${params.slugPart}-${side}-${params.suffix}`,
        displayOrder: index,
        isActive: true,
        isTradable: true,
        referenceTokenId: `token-el-a-${params.slugPart}-${side}-${params.suffix}`,
        referenceOutcomeLabel: label,
      })),
    },
  };
}

async function readLiveDetailRoute(eventSlug: string) {
  const response = await getMobileLiveDetail(
    new Request(`http://localhost/api/mobile/events/${encodeURIComponent(eventSlug)}/live-detail`),
    { params: Promise.resolve({ slug: eventSlug }) },
  );
  assert(response.status === 200, `Expected live-detail status 200, received ${response.status}.`);
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
    chartHistoryStatus: item.chartHistoryStatus,
    orderbookDepthSource: item.orderbookDepthSource,
    orderbookDepthStatus: item.orderbookDepthStatus,
    providerLifecycle: item.providerLifecycle,
    providerOrderbookDepth: item.providerOrderbookDepth,
    providerQuoteSnapshot: item.providerQuoteSnapshot,
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
        bestBid: market.marketGroupKey === "totals" ? 0.44 : market.marketGroupKey === "spread" ? 0.5 : 0.56,
        bestAsk: market.marketGroupKey === "totals" ? 0.48 : market.marketGroupKey === "spread" ? 0.54 : 0.6,
        spread: 0.04,
        lastTradePrice: market.marketGroupKey === "totals" ? 0.46 : market.marketGroupKey === "spread" ? 0.52 : 0.58,
        volume: 2600,
        volume24hr: 430,
        liquidity: 1550,
        liquidityClob: 1950,
        acceptingOrders: true,
        outcomes: JSON.stringify(market.outcomes.map((outcome) => outcome.referenceOutcomeLabel ?? outcome.name)),
        clobTokenIds: JSON.stringify(market.outcomes.map((outcome) => outcome.referenceTokenId)),
        outcomePrices: JSON.stringify(market.outcomes.map((_, index) => index === 0 ? 0.52 : 0.48)),
      }]);
    }

    if (url.hostname === "clob.polymarket.com" && url.pathname === "/book") {
      const tokenId = url.searchParams.get("token_id") ?? "unknown";
      const second = tokenId.includes("away") || tokenId.includes("under");
      return jsonResponse({
        asset_id: tokenId,
        timestamp: String(Math.floor(Date.now() / 1000)),
        bids: [
          { price: second ? "0.46" : "0.50", size: "180" },
          { price: second ? "0.45" : "0.49", size: "160" },
        ],
        asks: [
          { price: second ? "0.50" : "0.54", size: "170" },
          { price: second ? "0.51" : "0.55", size: "150" },
        ],
      });
    }

    if (url.hostname === "clob.polymarket.com" && url.pathname === "/prices-history") {
      const tokenId = url.searchParams.get("market") ?? "unknown";
      const second = tokenId.includes("away") || tokenId.includes("under");
      const nowSeconds = Math.floor(Date.now() / 1000);
      return jsonResponse({
        history: [
          { t: nowSeconds - 120, p: second ? 0.47 : 0.53 },
          { t: nowSeconds - 60, p: second ? 0.48 : 0.52 },
          { t: nowSeconds, p: second ? 0.49 : 0.51 },
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
    throw new Error("Refusing to create EL-A provider breadth proof state in production.");
  }

  const opticOddsCredential = process.env.OPTIC_ODDS_API_KEY ? "configured" : "missing_non_blocking";
  const event = await createProofEvent();
  const markets = event.markets;
  const expectedMarketCount = markets.length;
  assert(expectedMarketCount >= 11, "Proof event did not create the expanded compact market breadth fixture.");

  const beforePayload = await readLiveDetailRoute(event.slug!);
  const restoreFetch = installProviderFetchStub(markets);
  let refreshPayload: Awaited<ReturnType<typeof executeMobileLiveProviderRefreshRoute>>;
  try {
    refreshPayload = await executeMobileLiveProviderRefreshRoute(event.slug!, {
      allowContractProofFallback: false,
    });
  } finally {
    restoreFetch();
  }
  const afterPayload = await readLiveDetailRoute(event.slug!);
  const afterMarkets = Object.fromEntries(markets.map((market) => [market.marketGroupKey ?? market.id, marketStatus(afterPayload, market)]));
  const coverage = refreshPayload.refresh.lineFamilyCoverage;
  const paths = cacheInvalidationPaths(refreshPayload.cacheInvalidation);

  const assertions = {
    routeBackedContract:
      beforePayload.contract.route === "mobile-live-detail" &&
      afterPayload.contract.route === "mobile-live-detail" &&
      refreshPayload.ok === true,
    noContractProofFallback:
      refreshPayload.refresh.contractProofFallback == null &&
      refreshPayload.providerLifecycle.fallbackApplied === false,
    gammaAndClobAttemptedAllMappedCompactMarkets:
      refreshPayload.refresh.provider.attempted === true &&
      refreshPayload.refresh.provider.refreshedCount === expectedMarketCount &&
      refreshPayload.refresh.providerDepth.refreshedCount === expectedMarketCount &&
      refreshPayload.refresh.providerHistory.refreshedCount === expectedMarketCount,
    lineFamilyCoverageProvesBreadth:
      coverage.providerRefreshableFamilyCount >= 4 &&
      coverage.providerRefreshableMarketCount === expectedMarketCount &&
      coverage.readyProviderRefreshableMarketCount === expectedMarketCount &&
      coverage.hasProviderMappedBreadth === true &&
      coverage.hasReadyProviderMappedBreadth === true,
    moneylineSpreadTotalsTeamTotalReady:
      ["moneyline", "spread", "total", "team_total"].every((family) =>
        coverage.markets.some((market: any) =>
          market.marketFamily === family &&
          market.ready === true &&
          market.quote.status === "ready" &&
          market.orderbookDepth.status === "ready" &&
          market.chartHistory.status === "ready",
        ),
      ),
    liveDetailPreservesProviderStatuses:
      Object.values(afterMarkets).every((market: any) =>
        market.providerLifecycle.status === "ready" &&
        market.providerLifecycle.quote.source === "polymarket" &&
        market.providerLifecycle.orderbookDepth.source === "polymarket-clob" &&
        market.providerLifecycle.chartHistory.source === "polymarket-clob-prices-history" &&
        market.orderbookIdentity.ready === true &&
        market.orderbookDepthStatus === "ready" &&
        market.chartHistoryStatus.status === "ready",
      ),
    cacheInvalidatesAllFamilyRoutes:
      paths.includes(`/api/mobile/events/${encodeURIComponent(event.slug!)}/live-detail`) &&
      markets.every((market) =>
        paths.includes(`/api/orderbook/${market.id}/book`) &&
        paths.includes(`/api/markets/${market.id}/chart`),
      ),
    opticOddsMissingIsNonBlocking:
      opticOddsCredential === "configured" ||
      (
        refreshPayload.providerLifecycle.ready === true &&
        refreshPayload.providerLifecycle.lineProvider.optional === true &&
        refreshPayload.providerLifecycle.lineProvider.blocking === false
      ),
  };

  const summary = {
    pass: Object.values(assertions).every(Boolean),
    generatedAt: new Date().toISOString(),
    proof: "EL-A proves provider-backed compact market breadth across advance, regulation winner, first-half winner, second-half winner, multi-period spread, totals, and team totals using Polymarket Gamma/CLOB-shaped route refresh.",
    opticOddsCredential,
    eventSlug: event.slug,
    routes: {
      liveDetail: "/api/mobile/events/:slug/live-detail",
      providerRefresh: "/api/mobile/events/:slug/provider-refresh",
    },
    marketIds: Object.fromEntries(markets.map((market) => [`${market.marketGroupKey ?? market.id}:${market.period ?? "none"}:${market.line?.toString() ?? "default"}`, market.id])),
    before: {
      contract: beforePayload.contract,
      eventProviderLifecycle: beforePayload.event.providerLifecycle,
    },
    refresh: {
      providerLifecycle: refreshPayload.providerLifecycle,
      provider: refreshPayload.refresh.provider,
      providerDepth: refreshPayload.refresh.providerDepth,
      providerHistory: refreshPayload.refresh.providerHistory,
      lineProvider: refreshPayload.refresh.lineProvider,
      lineFamilyCoverage: coverage,
      contractProofFallback: refreshPayload.refresh.contractProofFallback,
      cacheInvalidation: refreshPayload.cacheInvalidation,
    },
    after: {
      contract: afterPayload.contract,
      eventProviderLifecycle: afterPayload.event.providerLifecycle,
      markets: afterMarkets,
    },
    assertions,
    remainingGaps: [
      "This proof uses disposable Polymarket-shaped provider responses; production breadth still depends on live Gamma event mappings.",
      "Visible Android parity and screenshots are outside Agent A ownership for this cycle.",
      "OPTIC_ODDS_API_KEY remains optional enrichment and is not required for this Polymarket Gamma/CLOB route proof.",
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
