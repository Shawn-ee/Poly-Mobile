import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { GET as getMobileLiveDetail } from "@/app/api/mobile/events/[slug]/live-detail/route";
import { upsertReferenceOrderbookDepthSnapshots } from "@/server/services/referenceOrderbookDepthSnapshots";
import { upsertReferenceQuoteSnapshots } from "@/server/services/referenceQuoteSnapshots";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-EI-A-route-backed-status.json";
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function createProofEvent() {
  const suffix = randomUUID().slice(0, 8);
  const now = new Date();

  return prisma.event.create({
    data: {
      slug: `mobile-ei-a-route-backed-status-${suffix}`,
      title: "EI-A Route Backed Status",
      description: "Disposable backend proof event for tablet route-backed lifecycle/status fields.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "Route Home",
      awayTeamName: "Route Away",
      status: "live",
      liveStatus: "LIVE",
      period: "Live",
      clock: "74:00",
      homeScore: 1,
      awayScore: 1,
      metadata: {
        providerFixture: {
          providerSource: "polymarket-gamma",
          providerEventSlug: `ei-a-provider-event-${suffix}`,
          providerEventId: `gamma-event-ei-a-${suffix}`,
          sport: "soccer",
          live: true,
          opticOddsFixtureId: `optic-fixture-ei-a-${suffix}`,
          opticOddsApiKeyRequired: false,
        },
        mobileLiveDetail: {
          liveDataStatus: {
            source: "polymarket-gamma",
            status: "ready",
            lastUpdated: now.toISOString(),
            reason: "EI-A route-backed live-detail status proof event.",
          },
        },
      },
      markets: {
        create: [{
          slug: `mobile-ei-a-route-moneyline-${suffix}`,
          title: "Route Home vs Route Away - Match Winner",
          description: "EI-A route-backed provider lifecycle target market.",
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
          externalSlug: `ei-a-provider-market-${suffix}`,
          externalMarketId: `gamma-ei-a-market-${suffix}`,
          conditionId: `condition-ei-a-route-${suffix}`,
          sourceUpdatedAt: now,
          isListed: true,
          outcomes: {
            create: [
              {
                name: "Home",
                label: "Route Home",
                side: "home",
                code: "HOME",
                slug: `mobile-ei-a-route-home-${suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-ei-a-home-${suffix}`,
                referenceOutcomeLabel: "Route Home",
              },
              {
                name: "Away",
                label: "Route Away",
                side: "away",
                code: "AWAY",
                slug: `mobile-ei-a-route-away-${suffix}`,
                displayOrder: 1,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-ei-a-away-${suffix}`,
                referenceOutcomeLabel: "Route Away",
              },
            ],
          },
        }],
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

async function seedRouteBackedStatus(market: Awaited<ReturnType<typeof createProofEvent>>["markets"][number]) {
  const fetchedAt = new Date(Date.now() - 15 * 1000);

  await upsertReferenceQuoteSnapshots(market.outcomes.map((outcome, index) => ({
    marketId: market.id,
    outcomeId: outcome.id,
    source: "polymarket",
    externalSlug: market.externalSlug,
    externalMarketId: market.externalMarketId,
    conditionId: market.conditionId,
    tokenId: outcome.referenceTokenId,
    outcomeLabel: outcome.referenceOutcomeLabel ?? outcome.name,
    outcomePrice: index === 0 ? 0.54 : 0.46,
    bestBid: index === 0 ? 0.52 : 0.44,
    bestAsk: index === 0 ? 0.56 : 0.48,
    spread: 0.04,
    lastTradePrice: index === 0 ? 0.54 : 0.46,
    volume: 1500,
    volume24hr: 240,
    liquidity: 900,
    liquidityClob: 1200,
    acceptingOrders: true,
    qualityStatus: "route_backed_ready",
    mmEligible: false,
    reason: "ei_a_route_backed_status_seed",
    fetchedAt,
  })));

  await upsertReferenceOrderbookDepthSnapshots(market.outcomes.flatMap((outcome, index) => [
    {
      marketId: market.id,
      outcomeId: outcome.id,
      source: "polymarket-clob",
      externalSlug: market.externalSlug,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
      tokenId: outcome.referenceTokenId,
      side: "bid" as const,
      price: index === 0 ? 0.52 : 0.44,
      size: 180 + index,
      levelIndex: 0,
      fetchedAt,
    },
    {
      marketId: market.id,
      outcomeId: outcome.id,
      source: "polymarket-clob",
      externalSlug: market.externalSlug,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
      tokenId: outcome.referenceTokenId,
      side: "ask" as const,
      price: index === 0 ? 0.56 : 0.48,
      size: 160 + index,
      levelIndex: 0,
      fetchedAt,
    },
  ]));

  await prisma.marketOutcomeSnapshot.createMany({
    data: market.outcomes.map((outcome, index) => ({
      marketId: market.id,
      outcomeId: outcome.id,
      ts: fetchedAt,
      price: dec(index === 0 ? "0.54" : "0.46"),
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

function compactRouteStatus(payload: any, selectedMarketId: string) {
  const selectedMarket = payload.markets.find((market: any) => market.id === selectedMarketId);
  assert(selectedMarket, "Route response did not include the selected proof market.");

  return {
    route: payload.contract.route,
    eventSlug: payload.event.slug,
    liveDataStatus: payload.event.liveDataStatus,
    contractProviderLifecycle: payload.contract.providerLifecycle,
    topLevelProviderLifecycle: payload.providerLifecycle,
    selectedMarket: {
      id: selectedMarket.id,
      title: selectedMarket.title,
      selectedMarketIdentity: selectedMarket.selection,
      orderbookIdentity: selectedMarket.orderbookIdentity,
      availabilityStatus: selectedMarket.availability,
      chartHistoryStatus: selectedMarket.chartHistoryStatus,
      orderbookDepthSource: selectedMarket.orderbookDepthSource,
      orderbookDepthStatus: selectedMarket.orderbookDepthStatus,
      providerOrderbookDepth: selectedMarket.providerOrderbookDepth,
      providerQuoteSnapshot: selectedMarket.providerQuoteSnapshot,
      providerLifecycle: selectedMarket.providerLifecycle,
    },
  };
}

function containsForbiddenMarker(value: unknown): boolean {
  const text = JSON.stringify(value).toLowerCase();
  return text.includes("mock-ready") || text.includes("fixture-ready") || text.includes("frontend-fixture");
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to create EI-A route-backed status proof state in production.");
  }

  const opticOddsCredential = process.env.OPTIC_ODDS_API_KEY ? "configured" : "missing_non_blocking";
  const event = await createProofEvent();
  const selectedMarket = event.markets[0];
  assert(selectedMarket, "Proof event did not create a selected market.");
  await seedRouteBackedStatus(selectedMarket);

  const payload = await readLiveDetailRoute(event.slug!);
  const routeStatus = compactRouteStatus(payload, selectedMarket.id);
  const selectedLifecycle = routeStatus.selectedMarket.providerLifecycle;
  const selectedIdentity = routeStatus.selectedMarket.selectedMarketIdentity;
  const orderbookIdentity = routeStatus.selectedMarket.orderbookIdentity;

  const assertions = {
    liveDetailRouteReturnedRouteBackedContract: routeStatus.route === "mobile-live-detail",
    liveDataStatusIsProviderReady:
      routeStatus.liveDataStatus.status === "ready" &&
      routeStatus.liveDataStatus.source === "polymarket-gamma" &&
      routeStatus.liveDataStatus.lastUpdated != null &&
      typeof routeStatus.liveDataStatus.reason === "string",
    chartStatusIsReadyWithFreshness:
      routeStatus.selectedMarket.chartHistoryStatus.status === "ready" &&
      routeStatus.selectedMarket.chartHistoryStatus.source === "polymarket-clob-prices-history" &&
      routeStatus.selectedMarket.chartHistoryStatus.nextRefreshAt != null &&
      routeStatus.selectedMarket.chartHistoryStatus.lastUpdated != null,
    orderbookAvailabilityStatusIsReady:
      routeStatus.selectedMarket.orderbookDepthSource === "provider-orderbook-depth" &&
      routeStatus.selectedMarket.orderbookDepthStatus === "ready" &&
      routeStatus.selectedMarket.providerOrderbookDepth.status === "ready" &&
      routeStatus.selectedMarket.orderbookIdentity.ready === true,
    selectedMarketIdentityIsRouteBacked:
      selectedIdentity.marketId === selectedMarket.id &&
      selectedIdentity.selectorKey === "main:full-game:default" &&
      selectedIdentity.marketFamily === "moneyline" &&
      orderbookIdentity.marketId === selectedMarket.id &&
      orderbookIdentity.selectorKey === selectedIdentity.selectorKey &&
      orderbookIdentity.providerSource === "polymarket",
    providerLifecycleHasTabletStatusFields:
      selectedLifecycle.status === "ready" &&
      selectedLifecycle.ready === true &&
      selectedLifecycle.notReady === false &&
      selectedLifecycle.source === "mobile-live-detail-market" &&
      typeof selectedLifecycle.reason === "string" &&
      selectedLifecycle.nextRefreshAt != null &&
      selectedLifecycle.lastFetchedAt != null,
    providerLifecycleSegmentsAreRouteBacked:
      selectedLifecycle.quote.source === "polymarket" &&
      selectedLifecycle.quote.status === "ready" &&
      selectedLifecycle.orderbookDepth.source === "polymarket-clob" &&
      selectedLifecycle.orderbookDepth.status === "ready" &&
      selectedLifecycle.chartHistory.source === "polymarket-clob-prices-history" &&
      selectedLifecycle.chartHistory.status === "ready",
    aggregateLifecycleMatchesSelectedReady:
      routeStatus.contractProviderLifecycle.status === "ready" &&
      routeStatus.topLevelProviderLifecycle.status === "ready" &&
      routeStatus.contractProviderLifecycle.nextRefreshAt != null &&
      routeStatus.contractProviderLifecycle.lastFetchedAt != null,
    noFixtureOrMockReadyMarkers: !containsForbiddenMarker(routeStatus),
    missingOpticOddsApiKeyIsNonBlocking:
      opticOddsCredential === "configured" || routeStatus.selectedMarket.providerLifecycle.ready === true,
  };

  const summary = {
    pass: Object.values(assertions).every(Boolean),
    generatedAt: new Date().toISOString(),
    proof: "EI-A live-detail route returns exact route-backed provider lifecycle/status fields the tablet needs for PM-GAP-084.",
    opticOddsCredential,
    eventSlug: event.slug,
    selectedMarketId: selectedMarket.id,
    routeStatus,
    assertions,
    remainingGap: "Visible tablet rendering remains Agent B scope; production line-family coverage still depends on mapped provider markets and scheduled refresh coverage.",
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
