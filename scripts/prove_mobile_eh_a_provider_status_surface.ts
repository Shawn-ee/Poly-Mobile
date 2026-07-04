import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { refreshMobileLiveProviderQuoteSnapshots } from "@/server/services/mobileLiveProviderRefresh";
import { serializeMobileLiveEventDetail } from "@/server/services/mobileLiveEventDetail";
import { upsertReferenceOrderbookDepthSnapshots } from "@/server/services/referenceOrderbookDepthSnapshots";
import { upsertReferenceQuoteSnapshots } from "@/server/services/referenceQuoteSnapshots";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-EH-A-provider-status-surface.json";
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
  return prisma.event.create({
    data: {
      slug: `mobile-eh-a-provider-status-${suffix}`,
      title: "EH-A Provider Status Surface",
      description: "Disposable backend proof event for route-backed provider lifecycle status.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "Status Home",
      awayTeamName: "Status Away",
      status: "live",
      liveStatus: "LIVE",
      period: "Live",
      clock: "71:00",
      homeScore: 2,
      awayScore: 2,
      metadata: {
        providerFixture: {
          providerSource: "polymarket-gamma",
          providerEventSlug: `eh-a-provider-event-${suffix}`,
          providerEventId: `gamma-event-eh-a-${suffix}`,
          seriesSlug: "world-cup",
          sport: "soccer",
          live: true,
          score: "2-2",
          elapsed: "71",
          period: "2H",
          opticOddsFixtureId: `optic-fixture-eh-a-${suffix}`,
          opticOddsGameId: `optic-game-eh-a-${suffix}`,
          opticOddsNumericalId: 10101,
          sportradarGameId: null,
          teams: [
            { name: "Status Home", abbreviation: "HOM", ordering: "home", providerId: 1 },
            { name: "Status Away", abbreviation: "AWY", ordering: "away", providerId: 2 },
          ],
          moneylineMarkets: [],
          lineMarketSourceContract: {
            intendedProvider: "optic_odds",
            fixtureKey: `optic-fixture-eh-a-${suffix}`,
            missingFields: [],
            requiredForFamilies: ["spread", "total_goals", "team_total_goals"],
          },
        },
        mobileLiveDetail: {
          liveDataStatus: {
            source: "polymarket-proof-fixture",
            status: "ready",
            lastUpdated: new Date().toISOString(),
            reason: "EH-A deterministic provider status proof event.",
          },
        },
      },
      markets: {
        create: [
          {
            slug: `mobile-eh-a-provider-moneyline-${suffix}`,
            title: "Status Home vs Status Away - Match Winner",
            description: "EH-A provider status ready target market.",
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
            externalSlug: `eh-a-provider-refresh-${suffix}`,
            externalMarketId: `gamma-eh-a-provider-refresh-${suffix}`,
            conditionId: `condition-eh-a-provider-refresh-${suffix}`,
            sourceUpdatedAt: new Date(),
            isListed: true,
            outcomes: {
              create: [
                {
                  name: "Home",
                  label: "Status Home",
                  side: "home",
                  code: "HOME",
                  slug: `mobile-eh-a-provider-home-${suffix}`,
                  displayOrder: 0,
                  isActive: true,
                  isTradable: true,
                  referenceTokenId: `token-eh-a-home-${suffix}`,
                  referenceOutcomeLabel: "Status Home",
                },
                {
                  name: "Away",
                  label: "Status Away",
                  side: "away",
                  code: "AWAY",
                  slug: `mobile-eh-a-provider-away-${suffix}`,
                  displayOrder: 1,
                  isActive: true,
                  isTradable: true,
                  referenceTokenId: `token-eh-a-away-${suffix}`,
                  referenceOutcomeLabel: "Status Away",
                },
              ],
            },
          },
          {
            slug: `mobile-eh-a-provider-empty-total-${suffix}`,
            title: "Status Home vs Status Away - Total Goals 2.5",
            description: "EH-A provider status unavailable control market.",
            status: "LIVE",
            mechanism: "ORDERBOOK",
            visibility: "PUBLIC",
            kind: "ORDERBOOK",
            type: "BINARY",
            marketType: "total_goals",
            marketGroupKey: "totals",
            marketGroupTitle: "Totals",
            displayOrder: 1,
            period: "full-game",
            line: dec("2.5"),
            unit: "goals",
            sourceUpdatedAt: new Date(),
            isListed: true,
            outcomes: {
              create: [
                {
                  name: "Over",
                  label: "Over 2.5",
                  side: "over",
                  code: "OVER",
                  slug: `mobile-eh-a-empty-over-${suffix}`,
                  displayOrder: 0,
                  isActive: true,
                  isTradable: true,
                },
                {
                  name: "Under",
                  label: "Under 2.5",
                  side: "under",
                  code: "UNDER",
                  slug: `mobile-eh-a-empty-under-${suffix}`,
                  displayOrder: 1,
                  isActive: true,
                  isTradable: true,
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

async function seedNonReadyState(market: Awaited<ReturnType<typeof createProofEvent>>["markets"][number]) {
  const refreshDueAt = new Date(Date.now() - 65 * 1000);
  const staleAt = new Date(Date.now() - 5 * 60 * 1000);
  await upsertReferenceQuoteSnapshots(market.outcomes.map((outcome, index) => ({
    marketId: market.id,
    outcomeId: outcome.id,
    source: "polymarket-eh-a-refresh-due-fixture",
    externalSlug: market.externalSlug,
    externalMarketId: market.externalMarketId,
    conditionId: market.conditionId,
    tokenId: outcome.referenceTokenId,
    outcomeLabel: outcome.referenceOutcomeLabel ?? outcome.name,
    outcomePrice: index === 0 ? 0.52 : 0.48,
    bestBid: index === 0 ? 0.49 : 0.45,
    bestAsk: index === 0 ? 0.55 : 0.51,
    spread: 0.06,
    lastTradePrice: index === 0 ? 0.51 : 0.47,
    volume: 1000,
    volume24hr: 200,
    liquidity: 500,
    liquidityClob: 800,
    acceptingOrders: true,
    qualityStatus: "proof_refresh_due",
    mmEligible: false,
    reason: "eh_a_refresh_due_seed",
    fetchedAt: refreshDueAt,
  })));
  await upsertReferenceOrderbookDepthSnapshots(market.outcomes.flatMap((outcome, index) => [
    {
      marketId: market.id,
      outcomeId: outcome.id,
      source: "polymarket-clob-eh-a-stale-fixture",
      externalSlug: market.externalSlug,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
      tokenId: outcome.referenceTokenId,
      side: "bid" as const,
      price: index === 0 ? 0.48 : 0.44,
      size: 100 + index,
      levelIndex: 0,
      fetchedAt: staleAt,
    },
    {
      marketId: market.id,
      outcomeId: outcome.id,
      source: "polymarket-clob-eh-a-stale-fixture",
      externalSlug: market.externalSlug,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
      tokenId: outcome.referenceTokenId,
      side: "ask" as const,
      price: index === 0 ? 0.56 : 0.52,
      size: 90 + index,
      levelIndex: 0,
      fetchedAt: staleAt,
    },
  ]));
  await prisma.marketOutcomeSnapshot.createMany({
    data: market.outcomes.map((outcome, index) => ({
      marketId: market.id,
      outcomeId: outcome.id,
      ts: refreshDueAt,
      price: dec(index === 0 ? "0.52" : "0.48"),
    })),
  });
}

async function readLiveDetail(eventSlug: string) {
  const event = await prisma.event.findUniqueOrThrow({
    where: { slug: eventSlug },
    include: {
      markets: {
        where: { visibility: "PUBLIC", mechanism: "ORDERBOOK", status: "LIVE" },
        orderBy: [{ marketGroupKey: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
        include: { outcomes: { where: { isActive: true }, orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] } },
      },
    },
  });
  const marketIds = event.markets.map((market) => market.id);
  const chartSnapshots = await prisma.marketOutcomeSnapshot.findMany({
    where: { marketId: { in: marketIds } },
    orderBy: [{ marketId: "asc" }, { ts: "asc" }],
  });
  return serializeMobileLiveEventDetail({ event, chartSnapshots });
}

const clobFetch: typeof fetch = async (url) => {
  const parsed = new URL(String(url));
  const tokenId = parsed.searchParams.get("token_id") ?? parsed.searchParams.get("market") ?? "unknown";
  if (parsed.pathname === "/book") {
    return new Response(JSON.stringify({
      asset_id: tokenId,
      timestamp: String(Math.floor(Date.now() / 1000)),
      bids: [
        { price: "0.49", size: "140" },
        { price: "0.48", size: "120" },
      ],
      asks: [
        { price: "0.53", size: "130" },
        { price: "0.54", size: "110" },
      ],
    }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (parsed.pathname === "/prices-history") {
    const nowSeconds = Math.floor(Date.now() / 1000);
    return new Response(JSON.stringify({
      history: [
        { t: nowSeconds - 120, p: 0.49 },
        { t: nowSeconds - 60, p: 0.5 },
        { t: nowSeconds, p: tokenId.includes("away") ? 0.47 : 0.53 },
      ],
    }), { status: 200, headers: { "content-type": "application/json" } });
  }
  return new Response(JSON.stringify({ error: "Unexpected proof URL" }), { status: 404 });
};

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to create EH-A provider status proof state in production.");
  }

  delete process.env.OPTIC_ODDS_API_KEY;
  const event = await createProofEvent();
  const readyTarget = event.markets.find((market) => market.marketGroupKey === "main");
  const unavailableTarget = event.markets.find((market) => market.marketGroupKey === "totals");
  assert(readyTarget, "Proof event did not create ready target market.");
  assert(unavailableTarget, "Proof event did not create unavailable target market.");

  await seedNonReadyState(readyTarget);

  const before = await readLiveDetail(event.slug!);
  const beforeReadyMarket = before.markets.find((item) => item.id === readyTarget.id);
  const beforeUnavailableMarket = before.markets.find((item) => item.id === unavailableTarget.id);
  assert(beforeReadyMarket, "Before live-detail did not include ready target market.");
  assert(beforeUnavailableMarket, "Before live-detail did not include unavailable target market.");

  const refresh = await refreshMobileLiveProviderQuoteSnapshots({
    eventSlug: event.slug!,
    allowContractProofFallback: true,
    providerDepthFetchImpl: clobFetch,
    providerHistoryFetchImpl: clobFetch,
  });

  const after = await readLiveDetail(event.slug!);
  const afterReadyMarket = after.markets.find((item) => item.id === readyTarget.id);
  const afterUnavailableMarket = after.markets.find((item) => item.id === unavailableTarget.id);
  assert(afterReadyMarket, "After live-detail did not include ready target market.");
  assert(afterUnavailableMarket, "After live-detail did not include unavailable target market.");

  const assertions = {
    beforeExposesStaleAndRefreshDue:
      beforeReadyMarket.providerLifecycle.status === "stale" &&
      beforeReadyMarket.providerLifecycle.quote.status === "refresh_due" &&
      beforeReadyMarket.providerLifecycle.orderbookDepth.status === "stale",
    refreshReportsStartedAndReady:
      refresh.providerLifecycle.refreshStarted === true &&
      refresh.providerLifecycle.refreshing === false &&
      refresh.providerLifecycle.status === "ready" &&
      refresh.providerLifecycle.ready === true &&
      refresh.providerLifecycle.lastFetchedAt != null,
    missingOpticOddsIsOptionalUnconfigured:
      refresh.providerLifecycle.lineProvider.status === "unconfigured" &&
      refresh.providerLifecycle.lineProvider.optional === true &&
      refresh.providerLifecycle.lineProvider.blocking === false,
    afterReadyMarketIsReady:
      afterReadyMarket.providerLifecycle.status === "ready" &&
      afterReadyMarket.providerLifecycle.ready === true &&
      afterReadyMarket.providerLifecycle.notReady === false &&
      afterReadyMarket.providerLifecycle.nextRefreshAt != null &&
      afterReadyMarket.providerLifecycle.lastFetchedAt != null,
    unavailableMarketRemainsExplicit:
      beforeUnavailableMarket.providerLifecycle.status === "unavailable" &&
      beforeUnavailableMarket.providerLifecycle.empty === true &&
      beforeUnavailableMarket.providerLifecycle.notReady === true &&
      afterUnavailableMarket.providerLifecycle.status === "unavailable" &&
      afterUnavailableMarket.providerLifecycle.notReady === true &&
      afterUnavailableMarket.providerLifecycle.orderbookDepth.empty === true &&
      afterUnavailableMarket.providerLifecycle.chartHistory.empty === true,
    fallbackFlagIsExplicit:
      refresh.providerLifecycle.fallbackApplied === true &&
      refresh.providerLifecycle.fallbackReason === "local_event_has_no_real_polymarket_market_mapping",
  };

  const summary = {
    pass: Object.values(assertions).every(Boolean),
    generatedAt: new Date().toISOString(),
    proof: "EH-A provider status surface exposes route-backed ready, stale, refresh_due, refresh-started, unavailable/empty, freshness timestamps, fallback, and optional/unconfigured line-provider flags.",
    eventSlug: event.slug,
    readyMarketId: readyTarget.id,
    unavailableMarketId: unavailableTarget.id,
    before: {
      contractProviderLifecycle: before.contract.providerLifecycle,
      readyMarketProviderLifecycle: beforeReadyMarket.providerLifecycle,
      unavailableMarketProviderLifecycle: beforeUnavailableMarket.providerLifecycle,
    },
    refresh: {
      providerLifecycle: refresh.providerLifecycle,
      lineProvider: refresh.lineProvider,
      contractProofFallback: refresh.contractProofFallback,
      postRefresh: refresh.postRefresh,
      postRefreshDepth: refresh.postRefreshDepth,
      postRefreshHistory: refresh.postRefreshHistory,
    },
    after: {
      contractProviderLifecycle: after.contract.providerLifecycle,
      readyMarketProviderLifecycle: afterReadyMarket.providerLifecycle,
      unavailableMarketProviderLifecycle: afterUnavailableMarket.providerLifecycle,
    },
    assertions,
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
