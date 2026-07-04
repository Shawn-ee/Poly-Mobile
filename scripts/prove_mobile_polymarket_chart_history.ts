import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { fetchPolymarketEventBySlug } from "@/server/services/polymarketEventImport";
import { refreshPolymarketPriceHistorySnapshots } from "@/server/services/polymarketPriceHistorySnapshots";
import { selectCompactLiveMarkets, serializeMobileLiveEventDetail } from "@/server/services/mobileLiveEventDetail";

const DEFAULT_PROVIDER_EVENT_SLUG = "fifwc-col-gha-2026-07-03";
const DEFAULT_LOCAL_EVENT_SLUG = "world-cup-2026-colombia-vs-ghana-2026-07-03";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-current-mobile-polymarket-chart-history.json";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const providerEventSlug = args.providerEventSlug ?? DEFAULT_PROVIDER_EVENT_SLUG;
  const eventSlug = args.eventSlug ?? DEFAULT_LOCAL_EVENT_SLUG;
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;

  const providerEvent = await fetchPolymarketEventBySlug(providerEventSlug);
  const providerMarkets = providerEvent.markets
    .filter((market) => !market.archived)
    .filter((market) => market.outcomes.length === 2 && market.clobTokenIds.length === 2)
    .slice(0, 3);
  if (providerMarkets.length < 3) {
    throw new Error(`Provider event ${providerEventSlug} exposed fewer than 3 tokenized markets for chart history.`);
  }

  const prepared = await prepareLocalProviderMappedEvent({
    eventSlug,
    providerEventSlug,
    providerEventTitle: providerEvent.title,
    providerEventDescription: providerEvent.description,
    providerEventImage: providerEvent.image,
    providerEventClosed: providerEvent.closed,
    markets: providerMarkets,
  });

  const history = await refreshPolymarketPriceHistorySnapshots({
    marketIds: prepared.markets.map((market) => market.id),
    interval: "1d",
    fidelityMinutes: 5,
  });

  const primaryMarket = prepared.markets[0];
  const chartSnapshots = await prisma.marketOutcomeSnapshot.findMany({
    where: { marketId: primaryMarket.id },
    orderBy: { ts: "asc" },
    take: 240,
  });
  const chartRouteContract = {
    marketId: primaryMarket.id,
    source: chartSnapshots.length > 0 ? "polymarket-clob-prices-history" : "empty",
    range: "1D",
    emptyState: chartSnapshots.length === 0 ? "no-history" : null,
    historyPointCount: chartSnapshots.length,
    lastUpdated: chartSnapshots.at(-1)?.ts.toISOString() ?? null,
  };
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      markets: {
        where: {
          visibility: "PUBLIC",
          mechanism: "ORDERBOOK",
          status: "LIVE",
        },
        orderBy: [{ marketGroupKey: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
        include: {
          outcomes: {
            where: { isActive: true },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });
  if (!event) throw new Error(`Prepared event ${eventSlug} is missing.`);
  const compactMarkets = selectCompactLiveMarkets(event.markets);
  const compactPrimaryMarketId = compactMarkets[0]?.id ?? null;
  const liveDetailChartSnapshots = compactPrimaryMarketId
    ? await prisma.marketOutcomeSnapshot.findMany({
        where: { marketId: compactPrimaryMarketId },
        orderBy: { ts: "asc" },
        take: 240,
      })
    : [];
  const liveDetail = await serializeMobileLiveEventDetail({ event, chartSnapshots: liveDetailChartSnapshots });

  const summary = {
    generatedAt: new Date().toISOString(),
    eventSlug,
    providerEventSlug,
    providerEventTitle: providerEvent.title,
    providerEventClosed: providerEvent.closed,
    providerEventEnded: Boolean(providerEvent.closed),
    providerSource: "gamma-api.polymarket.com/events?slug plus clob.polymarket.com/prices-history",
    prepared,
    history: {
      source: history.source,
      interval: history.interval,
      fidelityMinutes: history.fidelityMinutes,
      requestedMarketCount: history.requestedMarketCount,
      refreshedCount: history.refreshedCount,
      snapshotsCreated: history.snapshotsCreated,
      skippedCount: history.skippedCount,
      skipped: history.skipped,
      refreshed: history.refreshed,
    },
    chartRoute: chartRouteContract,
    liveDetail: {
      chartHistoryPointCount: liveDetail.event.chartHistory.length,
      chartHistorySource: liveDetail.contract.chartHistorySource,
      liveDataSource: liveDetail.event.liveDataStatus.source,
      liveDataStatus: liveDetail.event.liveDataStatus.status,
    },
    pass:
      prepared.marketCount >= 3 &&
      history.source === "polymarket-clob-prices-history" &&
      history.snapshotsCreated > 0 &&
      chartRouteContract.source === "polymarket-clob-prices-history" &&
      chartRouteContract.historyPointCount > 0 &&
      liveDetail.contract.chartHistorySource === "market-outcome-snapshot" &&
      liveDetail.event.chartHistory.length > 0,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

async function prepareLocalProviderMappedEvent(params: {
  eventSlug: string;
  providerEventSlug: string;
  providerEventTitle: string;
  providerEventDescription: string | null;
  providerEventImage: string | null;
  providerEventClosed: boolean;
  markets: Awaited<ReturnType<typeof fetchPolymarketEventBySlug>>["markets"];
}) {
  const now = new Date();
  const event = await prisma.event.upsert({
    where: { slug: params.eventSlug },
    create: {
      slug: params.eventSlug,
      title: params.providerEventTitle,
      description: params.providerEventDescription,
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "Colombia",
      awayTeamName: "Ghana",
      status: "live",
      liveStatus: params.providerEventClosed ? "ENDED" : "LIVE",
      period: params.providerEventClosed ? "Final" : "Live",
      clock: params.providerEventClosed ? "FT" : "80:00",
      homeScore: 1,
      awayScore: 0,
      source: "polymarket",
      externalSlug: params.providerEventSlug,
      imageUrl: params.providerEventImage,
      sourceUpdatedAt: now,
      metadata: eventMetadata(params.providerEventSlug, now, params.providerEventClosed),
    },
    update: {
      title: params.providerEventTitle,
      description: params.providerEventDescription,
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "Colombia",
      awayTeamName: "Ghana",
      status: "live",
      liveStatus: params.providerEventClosed ? "ENDED" : "LIVE",
      period: params.providerEventClosed ? "Final" : "Live",
      clock: params.providerEventClosed ? "FT" : "80:00",
      homeScore: 1,
      awayScore: 0,
      source: "polymarket",
      externalSlug: params.providerEventSlug,
      imageUrl: params.providerEventImage,
      sourceUpdatedAt: now,
      metadata: eventMetadata(params.providerEventSlug, now, params.providerEventClosed),
    },
  });

  const localMarkets = [];
  for (const [index, providerMarket] of params.markets.entries()) {
    const marketSlug = `${params.eventSlug}-${providerMarket.slug}`;
    const market = await prisma.market.upsert({
      where: { slug: marketSlug },
      create: {
        slug: marketSlug,
        title: providerMarket.question,
        description: params.providerEventDescription ?? providerMarket.question,
        categoryLegacy: "sports",
        type: "BINARY",
        marketType: "moneyline",
        marketGroupKey: "main",
        marketGroupTitle: "Game Lines",
        displayOrder: index,
        status: "LIVE",
        eventId: event.id,
        visibility: "PUBLIC",
        mechanism: "ORDERBOOK",
        isListed: true,
        referenceSource: "polymarket",
        externalSlug: providerMarket.slug,
        externalMarketId: providerMarket.marketId,
        conditionId: providerMarket.conditionId,
        rulesText: "Provider-shaped World Cup market for Holiwyn mobile Polymarket chart-history proof.",
        sourceUpdatedAt: now,
      },
      update: {
        title: providerMarket.question,
        description: params.providerEventDescription ?? providerMarket.question,
        type: "BINARY",
        marketType: "moneyline",
        marketGroupKey: "main",
        marketGroupTitle: "Game Lines",
        displayOrder: index,
        status: "LIVE",
        eventId: event.id,
        visibility: "PUBLIC",
        mechanism: "ORDERBOOK",
        isListed: true,
        referenceSource: "polymarket",
        externalSlug: providerMarket.slug,
        externalMarketId: providerMarket.marketId,
        conditionId: providerMarket.conditionId,
        sourceUpdatedAt: now,
      },
    });
    const outcomes = await upsertProviderOutcomes({
      marketId: market.id,
      marketSlug,
      outcomes: providerMarket.outcomes,
      tokenIds: providerMarket.clobTokenIds,
    });
    localMarkets.push({
      id: market.id,
      slug: market.slug,
      title: market.title,
      providerSlug: providerMarket.slug,
      closed: providerMarket.closed,
      outcomes,
    });
  }
  return {
    eventId: event.id,
    eventSlug: event.slug,
    providerClosed: params.providerEventClosed,
    marketCount: localMarkets.length,
    markets: localMarkets,
  };
}

async function upsertProviderOutcomes(params: {
  marketId: string;
  marketSlug: string;
  outcomes: string[];
  tokenIds: string[];
}) {
  const activeOutcomeIds = [];
  const saved = [];
  for (const [index, name] of params.outcomes.entries()) {
    const code = name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || `OUTCOME_${index + 1}`;
    const existing = await prisma.outcome.findFirst({ where: { marketId: params.marketId, code } });
    const data = {
      name,
      label: name,
      side: name.toLowerCase() === "yes" ? "yes" : name.toLowerCase() === "no" ? "no" : null,
      displayOrder: index,
      isActive: true,
      isTradable: true,
      referenceTokenId: params.tokenIds[index] ?? null,
      referenceOutcomeLabel: name,
      referenceMetadata: {
        source: "polymarket-clob-prices-history",
        tokenId: params.tokenIds[index] ?? null,
      },
    };
    const outcome = existing
      ? await prisma.outcome.update({ where: { id: existing.id }, data })
      : await prisma.outcome.create({
          data: {
            marketId: params.marketId,
            code,
            slug: `${params.marketSlug}-${code.toLowerCase()}`,
            ...data,
          },
        });
    activeOutcomeIds.push(outcome.id);
    saved.push({ id: outcome.id, name: outcome.name, tokenId: outcome.referenceTokenId });
  }
  await prisma.outcome.updateMany({
    where: { marketId: params.marketId, id: { notIn: activeOutcomeIds } },
    data: { isActive: false },
  });
  return saved;
}

function eventMetadata(providerEventSlug: string, now: Date, providerClosed: boolean) {
  return {
    cycle: "DL",
    providerEventSlug,
    mobileLiveDetail: {
      liveDataStatus: {
        source: "polymarket-gamma",
        status: providerClosed ? "stale" : "ready",
        lastUpdated: now.toISOString(),
        reason: providerClosed
          ? "Provider event is closed/resolved, but CLOB price history remains valid for chart-history proof."
          : "Provider event is active and CLOB price history is available.",
      },
    },
  };
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (!part.startsWith("--")) continue;
    const key = part.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

main()
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
