import fs from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { fetchPolymarketEventBySlug } from "@/server/services/polymarketEventImport";
import {
  normalizePolymarketSoccerEvent,
  normalizePolymarketSoccerMarket,
  normalizedSoccerMetadata,
} from "@/server/services/soccerProviderNormalization";
import { executeMobileLiveProviderRefreshRoute } from "@/app/api/mobile/events/[slug]/provider-refresh/route";

const DEFAULT_PROVIDER_EVENT_SLUG = "world-cup-winner";
const DEFAULT_LOCAL_EVENT_SLUG = "mobile-fj-real-world-cup-winner";
const DEFAULT_MARKET_LIMIT = 8;
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-FJ-real-provider-home-ticket/cycle-FJ-real-provider-world-cup-winner.json";

const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const providerEventSlug = args.providerEventSlug ?? DEFAULT_PROVIDER_EVENT_SLUG;
  const eventSlug = args.eventSlug ?? DEFAULT_LOCAL_EVENT_SLUG;
  const marketLimit = parsePositiveInt(args.marketLimit, DEFAULT_MARKET_LIMIT);
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;
  const providerEvent = await fetchPolymarketEventBySlug(providerEventSlug);
  const markets = providerEvent.markets
    .filter((market) => market.active && !market.closed && !market.archived)
    .filter((market) => market.acceptingOrders)
    .filter((market) => market.outcomes.length === 2 && market.clobTokenIds.length === 2)
    .filter((market) => market.bestBid != null && market.bestAsk != null && market.bestBid <= market.bestAsk)
    .filter((market) => market.bestBid != null && market.bestAsk != null && market.bestBid >= 0.01 && market.bestAsk <= 0.99)
    .sort((a, b) => (b.liquidity ?? 0) - (a.liquidity ?? 0))
    .slice(0, marketLimit);

  if (markets.length < 3) {
    throw new Error(`Provider event ${providerEventSlug} exposed fewer than 3 usable World Cup winner markets.`);
  }

  const prepared = await prepareLocalEvent({
    eventSlug,
    providerEventSlug,
    title: providerEvent.title,
    description: providerEvent.description,
    image: providerEvent.image,
    markets,
  });

  const refresh = await executeMobileLiveProviderRefreshRoute(eventSlug, {
    allowContractProofFallback: false,
  });
  const quoteReadyMarkets = refresh.refresh.lineFamilyCoverage.markets.filter((market: any) =>
    market.providerRefreshable === true &&
    market.quote?.status === "ready",
  );
  const primary = prepared.markets[0];
  const summary = {
    generatedAt: new Date().toISOString(),
    cycle: "FJ",
    eventSlug,
    providerEventSlug,
    providerEventTitle: providerEvent.title,
    source: {
      discovery: "Polymarket Gamma /events?slug",
      refresh: "Polymarket Gamma market slugs plus CLOB public market data",
      opticOdds: process.env.OPTIC_ODDS_API_KEY ? "configured_optional" : "unconfigured_optional_non_blocking",
    },
    prepared,
    marketLimit,
    refresh: {
      ok: refresh.ok,
      providerLifecycle: refresh.providerLifecycle,
      provider: refresh.refresh.provider,
      providerDepth: refresh.refresh.providerDepth,
      providerHistory: refresh.refresh.providerHistory,
      lineFamilyCoverage: refresh.refresh.lineFamilyCoverage,
      contractProofFallback: refresh.refresh.contractProofFallback,
      note: "Cycle FJ treats CLOB chart history refresh_due as non-blocking when Gamma quotes are fresh, because public prices-history timestamps can lag the proof run by more than the route freshness window.",
    },
    androidTarget: {
      cardId: `event-card-${eventSlug}`,
      primaryOutcomeId: primary?.yesOutcomeId,
      primaryMarketId: primary?.marketId,
      primaryMarketType: "winner",
      primaryTokenId: primary?.yesTokenId,
    },
    pass:
      prepared.markets.length >= 3 &&
      refresh.ok === true &&
      refresh.refresh.contractProofFallback == null &&
      refresh.refresh.provider.refreshedCount >= 1 &&
      quoteReadyMarkets.length >= 1,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.pass) process.exitCode = 1;
}

async function prepareLocalEvent(params: {
  eventSlug: string;
  providerEventSlug: string;
  title: string;
  description: string | null;
  image: string | null;
  markets: Awaited<ReturnType<typeof fetchPolymarketEventBySlug>>["markets"];
}) {
  const now = new Date();
  const normalizedEvent = normalizePolymarketSoccerEvent({
    externalSlug: params.providerEventSlug,
    title: params.title,
    description: params.description,
    category: "Sports / Soccer",
  });
  const event = await prisma.event.upsert({
    where: { slug: params.eventSlug },
    create: {
      slug: params.eventSlug,
      title: params.title || "World Cup Winner",
      description: params.description,
      category: "Sports / Soccer",
      sportKey: normalizedEvent.sportKey,
      leagueKey: normalizedEvent.leagueKey,
      eventType: normalizedEvent.eventType,
      homeTeamName: normalizedEvent.homeTeamName,
      awayTeamName: normalizedEvent.awayTeamName,
      status: "live",
      liveStatus: "LIVE",
      period: normalizedEvent.period,
      clock: normalizedEvent.clock,
      homeScore: 0,
      awayScore: 0,
      source: "polymarket",
      externalSlug: params.providerEventSlug,
      imageUrl: params.image,
      sourceUpdatedAt: now,
      metadata: eventMetadata(params.providerEventSlug, now, normalizedEvent),
    },
    update: {
      title: params.title || "World Cup Winner",
      description: params.description,
      category: "Sports / Soccer",
      sportKey: normalizedEvent.sportKey,
      leagueKey: normalizedEvent.leagueKey,
      eventType: normalizedEvent.eventType,
      homeTeamName: normalizedEvent.homeTeamName,
      awayTeamName: normalizedEvent.awayTeamName,
      status: "live",
      liveStatus: "LIVE",
      period: normalizedEvent.period,
      clock: normalizedEvent.clock,
      homeScore: 0,
      awayScore: 0,
      source: "polymarket",
      externalSlug: params.providerEventSlug,
      imageUrl: params.image,
      sourceUpdatedAt: now,
      metadata: eventMetadata(params.providerEventSlug, now, normalizedEvent),
    },
  });

  const saved = [];
  for (const [index, providerMarket] of params.markets.entries()) {
    const teamLabel = extractTeamLabel(providerMarket.question);
    const normalizedMarket = normalizePolymarketSoccerMarket(normalizedEvent, providerMarket, teamLabel);
    const marketSlug = `${params.eventSlug}-${providerMarket.slug}`;
    const existingMarket = await prisma.market.findUnique({
      where: { slug: marketSlug },
      select: { referenceMetadata: true },
    });
    const referenceMetadata = marketMetadata(
      params.providerEventSlug,
      providerMarket,
      teamLabel,
      normalizedEvent,
      normalizedMarket,
      existingMarket?.referenceMetadata ?? null,
    );
    const market = await prisma.market.upsert({
      where: { slug: marketSlug },
      create: {
        slug: marketSlug,
        title: providerMarket.question,
        description: params.description ?? providerMarket.question,
        categoryLegacy: "sports",
        type: "BINARY",
        marketType: normalizedMarket.marketType,
        marketGroupKey: normalizedMarket.marketGroupKey,
        marketGroupTitle: normalizedMarket.marketGroupTitle,
        displayOrder: index,
        line: normalizedMarket.line,
        unit: normalizedMarket.unit,
        period: normalizedMarket.period,
        participantType: normalizedMarket.participantType,
        participantName: normalizedMarket.participantName,
        participantId: normalizedMarket.participantId,
        propCategory: normalizedMarket.propCategory,
        status: "LIVE",
        eventId: event.id,
        visibility: "PUBLIC",
        mechanism: "ORDERBOOK",
        isListed: true,
        referenceSource: "polymarket",
        externalSlug: providerMarket.slug,
        externalMarketId: providerMarket.marketId,
        conditionId: providerMarket.conditionId,
        rules: normalizedMarket.rules,
        rulesText: normalizedMarket.rulesText,
        sourceUpdatedAt: now,
        referenceMetadata,
      },
      update: {
        title: providerMarket.question,
        description: params.description ?? providerMarket.question,
        categoryLegacy: "sports",
        type: "BINARY",
        marketType: normalizedMarket.marketType,
        marketGroupKey: normalizedMarket.marketGroupKey,
        marketGroupTitle: normalizedMarket.marketGroupTitle,
        displayOrder: index,
        line: normalizedMarket.line,
        unit: normalizedMarket.unit,
        period: normalizedMarket.period,
        participantType: normalizedMarket.participantType,
        participantName: normalizedMarket.participantName,
        participantId: normalizedMarket.participantId,
        propCategory: normalizedMarket.propCategory,
        status: "LIVE",
        eventId: event.id,
        visibility: "PUBLIC",
        mechanism: "ORDERBOOK",
        isListed: true,
        referenceSource: "polymarket",
        externalSlug: providerMarket.slug,
        externalMarketId: providerMarket.marketId,
        conditionId: providerMarket.conditionId,
        rules: normalizedMarket.rules,
        rulesText: normalizedMarket.rulesText,
        sourceUpdatedAt: now,
        referenceMetadata,
      },
    });

    const outcomes = await upsertYesNoOutcomes({
      marketId: market.id,
      marketSlug,
      yesLabel: teamLabel,
      yesTokenId: providerMarket.clobTokenIds[0] ?? null,
      noTokenId: providerMarket.clobTokenIds[1] ?? null,
      yesPrice: providerMarket.outcomePrices[0] ?? null,
      noPrice: providerMarket.outcomePrices[1] ?? null,
    });
    saved.push({
      marketId: market.id,
      slug: market.slug,
      title: market.title,
      externalSlug: market.externalSlug,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
      yesOutcomeId: outcomes.yes.id,
      noOutcomeId: outcomes.no.id,
      yesTokenId: outcomes.yes.referenceTokenId,
      noTokenId: outcomes.no.referenceTokenId,
      bestBid: providerMarket.bestBid,
      bestAsk: providerMarket.bestAsk,
      liquidity: providerMarket.liquidity,
    });
  }
  await prisma.market.updateMany({
    where: {
      eventId: event.id,
      id: { notIn: saved.map((market) => market.marketId) },
    },
    data: {
      isListed: false,
      status: "CLOSED",
    },
  });

  return {
    eventId: event.id,
    eventSlug: event.slug,
    marketCount: saved.length,
    markets: saved,
  };
}

async function upsertYesNoOutcomes(params: {
  marketId: string;
  marketSlug: string;
  yesLabel: string;
  yesTokenId: string | null;
  noTokenId: string | null;
  yesPrice: number | null;
  noPrice: number | null;
}) {
  const input = [
    {
      code: "YES",
      name: params.yesLabel,
      label: params.yesLabel,
      side: "yes",
      displayOrder: 0,
      referenceTokenId: params.yesTokenId,
      referenceOutcomeLabel: "Yes",
      outcomePrice: params.yesPrice,
    },
    {
      code: "NO",
      name: "No",
      label: "No",
      side: "no",
      displayOrder: 1,
      referenceTokenId: params.noTokenId,
      referenceOutcomeLabel: "No",
      outcomePrice: params.noPrice,
    },
  ];
  const saved = [];
  for (const outcomeInput of input) {
    const existing = await prisma.outcome.findFirst({
      where: { marketId: params.marketId, code: outcomeInput.code },
    });
    const data = {
      name: outcomeInput.name,
      label: outcomeInput.label,
      side: outcomeInput.side,
      displayOrder: outcomeInput.displayOrder,
      isActive: true,
      isTradable: true,
      referenceTokenId: outcomeInput.referenceTokenId,
      referenceOutcomeLabel: outcomeInput.referenceOutcomeLabel,
      referenceMetadata: {
        importedFrom: "polymarket",
        providerOutcomeLabel: outcomeInput.referenceOutcomeLabel,
        outcomePrice: outcomeInput.outcomePrice,
      },
    };
    const outcome = existing
      ? await prisma.outcome.update({ where: { id: existing.id }, data })
      : await prisma.outcome.create({
          data: {
            marketId: params.marketId,
            code: outcomeInput.code,
            slug: `${params.marketSlug}-${outcomeInput.code.toLowerCase()}`,
            ...data,
          },
        });
    saved.push(outcome);
  }
  await prisma.outcome.updateMany({
    where: { marketId: params.marketId, id: { notIn: saved.map((outcome) => outcome.id) } },
    data: { isActive: false },
  });
  return { yes: saved[0], no: saved[1] };
}

function eventMetadata(
  providerEventSlug: string,
  now: Date,
  normalizedEvent: ReturnType<typeof normalizePolymarketSoccerEvent>,
): Prisma.InputJsonValue {
  return {
    ...(normalizedSoccerMetadata({ event: normalizedEvent }) as Record<string, unknown>),
    cycle: "FJ",
    providerSource: "polymarket-gamma",
    providerEventSlug,
    mobileLiveDetail: {
      liveDataStatus: {
        source: "polymarket-gamma",
        status: "ready",
        lastUpdated: now.toISOString(),
        reason: "Cycle FJ real provider World Cup winner event.",
      },
    },
  };
}

function marketMetadata(
  providerEventSlug: string,
  market: Awaited<ReturnType<typeof fetchPolymarketEventBySlug>>["markets"][number],
  teamLabel: string,
  normalizedEvent: ReturnType<typeof normalizePolymarketSoccerEvent>,
  normalizedMarket: ReturnType<typeof normalizePolymarketSoccerMarket>,
  existing: Prisma.JsonValue | null,
): Prisma.InputJsonValue {
  const current =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {};
  return {
    ...current,
    ...(normalizedSoccerMetadata({ event: normalizedEvent, market: normalizedMarket }) as Record<string, unknown>),
    importedFrom: "polymarket",
    importStatus: "approved",
    referenceOnly: false,
    tradable: true,
    mmEnabled: true,
    importCycle: "FJ",
    providerEventSlug,
    teamLabel,
    sourceMarket: {
      slug: market.slug,
      marketId: market.marketId,
      conditionId: market.conditionId,
      bestBid: market.bestBid,
      bestAsk: market.bestAsk,
      spread: market.spread,
      lastTradePrice: market.lastTradePrice,
      volume24hr: market.volume24hr,
      liquidity: market.liquidity,
      acceptingOrders: market.acceptingOrders,
    },
  };
}

function extractTeamLabel(question: string) {
  const match = question.match(/^Will\s+(.+?)\s+win\b/i);
  return match?.[1]?.trim() || question.trim();
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [key, ...parts] = arg.slice(2).split("=");
    args[key] = parts.join("=");
  }
  return args;
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

main()
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
