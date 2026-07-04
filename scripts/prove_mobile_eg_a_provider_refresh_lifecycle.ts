import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { refreshMobileLiveProviderQuoteSnapshots } from "@/server/services/mobileLiveProviderRefresh";
import { serializeMobileLiveEventDetail } from "@/server/services/mobileLiveEventDetail";
import { upsertReferenceOrderbookDepthSnapshots } from "@/server/services/referenceOrderbookDepthSnapshots";
import { upsertReferenceQuoteSnapshots } from "@/server/services/referenceQuoteSnapshots";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-EG-A-provider-refresh-lifecycle.json";
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
      slug: `mobile-eg-a-provider-refresh-${suffix}`,
      title: "EG-A Provider Refresh Lifecycle",
      description: "Disposable backend proof event for provider refresh lifecycle state.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "Provider Home",
      awayTeamName: "Provider Away",
      status: "live",
      liveStatus: "LIVE",
      period: "Live",
      clock: "64:00",
      homeScore: 1,
      awayScore: 1,
      metadata: {
        mobileLiveDetail: {
          liveDataStatus: {
            source: "polymarket-proof-fixture",
            status: "ready",
            lastUpdated: new Date().toISOString(),
            reason: "EG-A deterministic provider refresh proof event.",
          },
        },
      },
      markets: {
        create: [
          {
            slug: `mobile-eg-a-provider-moneyline-${suffix}`,
            title: "Provider Home vs Provider Away - Match Winner",
            description: "EG-A provider refresh proof market.",
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
            externalSlug: `eg-a-provider-refresh-${suffix}`,
            externalMarketId: `gamma-eg-a-provider-refresh-${suffix}`,
            conditionId: `condition-eg-a-provider-refresh-${suffix}`,
            sourceUpdatedAt: new Date(),
            isListed: true,
            outcomes: {
              create: [
                {
                  name: "Home",
                  label: "Provider Home",
                  side: "home",
                  code: "HOME",
                  slug: `mobile-eg-a-provider-home-${suffix}`,
                  displayOrder: 0,
                  isActive: true,
                  isTradable: true,
                  referenceTokenId: `token-eg-a-home-${suffix}`,
                  referenceOutcomeLabel: "Provider Home",
                },
                {
                  name: "Away",
                  label: "Provider Away",
                  side: "away",
                  code: "AWAY",
                  slug: `mobile-eg-a-provider-away-${suffix}`,
                  displayOrder: 1,
                  isActive: true,
                  isTradable: true,
                  referenceTokenId: `token-eg-a-away-${suffix}`,
                  referenceOutcomeLabel: "Provider Away",
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      markets: {
        include: { outcomes: { orderBy: { displayOrder: "asc" } } },
      },
    },
  });
}

async function seedStaleState(market: Awaited<ReturnType<typeof createProofEvent>>["markets"][number]) {
  const staleAt = new Date(Date.now() - 5 * 60 * 1000);
  await upsertReferenceQuoteSnapshots(market.outcomes.map((outcome, index) => ({
    marketId: market.id,
    outcomeId: outcome.id,
    source: "polymarket-eg-a-stale-fixture",
    externalSlug: market.externalSlug,
    externalMarketId: market.externalMarketId,
    conditionId: market.conditionId,
    tokenId: outcome.referenceTokenId,
    outcomeLabel: outcome.referenceOutcomeLabel ?? outcome.name,
    outcomePrice: index === 0 ? 0.51 : 0.49,
    bestBid: index === 0 ? 0.48 : 0.46,
    bestAsk: index === 0 ? 0.54 : 0.52,
    spread: 0.06,
    lastTradePrice: index === 0 ? 0.5 : 0.48,
    volume: 1000,
    volume24hr: 200,
    liquidity: 500,
    liquidityClob: 800,
    acceptingOrders: true,
    qualityStatus: "proof_stale",
    mmEligible: false,
    reason: "eg_a_stale_seed",
    fetchedAt: staleAt,
  })));
  await upsertReferenceOrderbookDepthSnapshots(market.outcomes.flatMap((outcome, index) => [
    {
      marketId: market.id,
      outcomeId: outcome.id,
      source: "polymarket-clob-eg-a-stale-fixture",
      externalSlug: market.externalSlug,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
      tokenId: outcome.referenceTokenId,
      side: "bid" as const,
      price: index === 0 ? 0.47 : 0.45,
      size: 100 + index,
      levelIndex: 0,
      fetchedAt: staleAt,
    },
    {
      marketId: market.id,
      outcomeId: outcome.id,
      source: "polymarket-clob-eg-a-stale-fixture",
      externalSlug: market.externalSlug,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
      tokenId: outcome.referenceTokenId,
      side: "ask" as const,
      price: index === 0 ? 0.55 : 0.53,
      size: 90 + index,
      levelIndex: 0,
      fetchedAt: staleAt,
    },
  ]));
  await prisma.marketOutcomeSnapshot.createMany({
    data: market.outcomes.map((outcome, index) => ({
      marketId: market.id,
      outcomeId: outcome.id,
      ts: staleAt,
      price: dec(index === 0 ? "0.51" : "0.49"),
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
    throw new Error("Refusing to create EG-A provider refresh proof state in production.");
  }

  const event = await createProofEvent();
  const market = event.markets[0];
  assert(market, "Proof event did not create a market.");
  await seedStaleState(market);

  const before = await readLiveDetail(event.slug!);
  const beforeMarket = before.markets.find((item) => item.id === market.id);
  assert(beforeMarket, "Before live-detail did not include proof market.");

  const refresh = await refreshMobileLiveProviderQuoteSnapshots({
    eventSlug: event.slug!,
    allowContractProofFallback: true,
    lineProviderFetchImpl: async () => new Response(JSON.stringify({ data: [] }), { status: 200 }),
    providerDepthFetchImpl: clobFetch,
    providerHistoryFetchImpl: clobFetch,
  });

  const after = await readLiveDetail(event.slug!);
  const afterMarket = after.markets.find((item) => item.id === market.id);
  assert(afterMarket, "After live-detail did not include proof market.");

  const assertions = {
    missingOpticKeyDidNotBlock: refresh.lineProvider.attempted === false || refresh.lineProvider.snapshotsUpdated === 0,
    staleBeforeRefresh:
      beforeMarket.providerOrderbookDepth.status === "stale" &&
      beforeMarket.chartHistoryStatus.status === "stale",
    refreshReportsLifecycleReady:
      refresh.providerLifecycle.orderbookDepth.status === "ready" &&
      refresh.providerLifecycle.chartHistory.status === "ready",
    depthRefreshedFromPolymarketClob:
      refresh.providerDepth.source === "polymarket-clob" &&
      refresh.providerDepth.depthRowsUpdated > 0,
    chartRefreshedFromPolymarketClob:
      refresh.providerHistory.source === "polymarket-clob-prices-history" &&
      refresh.providerHistory.snapshotsCreated > 0,
    liveDetailReadyAfterRefresh:
      afterMarket.providerOrderbookDepth.status === "ready" &&
      afterMarket.chartHistoryStatus.status === "ready" &&
      afterMarket.orderbookIdentity.nextRefreshAt != null &&
      afterMarket.chartHistoryStatus.nextRefreshAt != null,
    deterministicFallbackExplicit:
      refresh.contractProofFallback?.applied === true &&
      refresh.contractProofFallback.reason === "local_event_has_no_real_polymarket_market_mapping",
  };

  const summary = {
    pass: Object.values(assertions).every(Boolean),
    generatedAt: new Date().toISOString(),
    proof: "EG-A provider refresh lifecycle distinguishes stale, refresh-due, and ready state for live-detail depth/chart data; deterministic CLOB-shaped fixture responses refresh provider depth and chart history without an Optic Odds key.",
    eventSlug: event.slug,
    marketId: market.id,
    providerSource: "polymarket-first-with-deterministic-clob-fixture",
    fixtureStatus: "explicit_contract_proof_fallback_for_gamma_quote_only",
    before: {
      contract: before.contract,
      orderbookDepthStatus: beforeMarket.providerOrderbookDepth.status,
      orderbookDepthNextRefreshAt: beforeMarket.providerOrderbookDepth.nextRefreshAt,
      chartHistoryStatus: beforeMarket.chartHistoryStatus,
    },
    refresh: {
      providerLifecycle: refresh.providerLifecycle,
      provider: refresh.provider,
      providerDepth: refresh.providerDepth,
      providerHistory: refresh.providerHistory,
      lineProvider: refresh.lineProvider,
      contractProofFallback: refresh.contractProofFallback,
      postRefreshDepth: refresh.postRefreshDepth,
      postRefreshHistory: refresh.postRefreshHistory,
    },
    after: {
      contract: after.contract,
      orderbookIdentity: afterMarket.orderbookIdentity,
      providerOrderbookDepth: afterMarket.providerOrderbookDepth,
      chartHistoryStatus: afterMarket.chartHistoryStatus,
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
