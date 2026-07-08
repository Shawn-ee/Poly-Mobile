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
import { upsertReferenceQuoteSnapshots } from "@/server/services/referenceQuoteSnapshots";

const DEFAULT_PROVIDER_EVENT_SLUG = "fifwc-arg-egy-2026-07-07";
const DEFAULT_LOCAL_EVENT_SLUG = "argentina-vs-egypt";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-NL-current-match-provider-refresh/current-match-restore.json";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const providerEventSlug = args.providerEventSlug ?? DEFAULT_PROVIDER_EVENT_SLUG;
  const eventSlug = args.eventSlug ?? DEFAULT_LOCAL_EVENT_SLUG;
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;
  const providerEvent = await fetchPolymarketEventBySlug(providerEventSlug);
  const providerMarkets = providerEvent.markets
    .filter((market) => !market.archived)
    .filter((market) => market.outcomes.length === 2 && market.clobTokenIds.length >= 2)
    .sort((a, b) => Number(a.marketId) - Number(b.marketId));

  if (providerMarkets.length === 0) {
    throw new Error(`Provider event ${providerEventSlug} exposed no restorable two-outcome markets.`);
  }

  const now = new Date();
  const normalizedEvent = normalizePolymarketSoccerEvent({
    externalSlug: providerEvent.externalSlug,
    title: providerEvent.title,
    description: providerEvent.description,
    category: providerEvent.category,
  });
  const localEvent = await prisma.event.upsert({
    where: { slug: eventSlug },
    create: {
      slug: eventSlug,
      title: providerEvent.title.trim(),
      description: providerEvent.description,
      category: providerEvent.category ?? "Sports / Soccer",
      sportKey: normalizedEvent.sportKey,
      leagueKey: normalizedEvent.leagueKey,
      eventType: normalizedEvent.eventType,
      homeTeamName: normalizedEvent.homeTeamName,
      awayTeamName: normalizedEvent.awayTeamName,
      status: "active",
      liveStatus: "LIVE",
      period: normalizedEvent.period,
      clock: normalizedEvent.clock,
      homeScore: 0,
      awayScore: 0,
      source: "polymarket",
      externalEventId: providerEvent.externalEventId,
      externalSlug: providerEvent.externalSlug,
      image: providerEvent.image,
      icon: providerEvent.icon,
      sourceUpdatedAt: now,
      metadata: eventMetadata(providerEventSlug, now, normalizedEvent),
    },
    update: {
      title: providerEvent.title.trim(),
      description: providerEvent.description,
      category: providerEvent.category ?? "Sports / Soccer",
      sportKey: normalizedEvent.sportKey,
      leagueKey: normalizedEvent.leagueKey,
      eventType: normalizedEvent.eventType,
      homeTeamName: normalizedEvent.homeTeamName,
      awayTeamName: normalizedEvent.awayTeamName,
      status: "active",
      liveStatus: "LIVE",
      period: normalizedEvent.period,
      clock: normalizedEvent.clock,
      homeScore: 0,
      awayScore: 0,
      source: "polymarket",
      externalEventId: providerEvent.externalEventId,
      externalSlug: providerEvent.externalSlug,
      image: providerEvent.image,
      icon: providerEvent.icon,
      sourceUpdatedAt: now,
      metadata: eventMetadata(providerEventSlug, now, normalizedEvent),
    },
  });

  const restored = [];
  for (const [index, providerMarket] of providerMarkets.entries()) {
    const participantName = providerMarket.groupItemTitle ?? extractTeamLabel(providerMarket.question);
    const normalizedMarket = normalizePolymarketSoccerMarket(normalizedEvent, providerMarket, participantName);
    const marketSlug = `${eventSlug}-${providerMarket.slug}`;
    const market = await prisma.market.upsert({
      where: { slug: marketSlug },
      create: {
        slug: marketSlug,
        title: providerMarket.question,
        description: providerEvent.description ?? providerMarket.question,
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
        eventId: localEvent.id,
        visibility: "PUBLIC",
        mechanism: "ORDERBOOK",
        kind: "ORDERBOOK",
        isListed: true,
        referenceSource: "polymarket",
        externalSlug: providerMarket.slug,
        externalMarketId: providerMarket.marketId,
        conditionId: providerMarket.conditionId,
        rules: normalizedMarket.rules,
        rulesText: normalizedMarket.rulesText,
        sourceUpdatedAt: now,
        referenceMetadata: marketMetadata(providerEventSlug, providerMarket, normalizedEvent, normalizedMarket),
      },
      update: {
        title: providerMarket.question,
        description: providerEvent.description ?? providerMarket.question,
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
        eventId: localEvent.id,
        visibility: "PUBLIC",
        mechanism: "ORDERBOOK",
        kind: "ORDERBOOK",
        isListed: true,
        referenceSource: "polymarket",
        externalSlug: providerMarket.slug,
        externalMarketId: providerMarket.marketId,
        conditionId: providerMarket.conditionId,
        rules: normalizedMarket.rules,
        rulesText: normalizedMarket.rulesText,
        sourceUpdatedAt: now,
        referenceMetadata: marketMetadata(providerEventSlug, providerMarket, normalizedEvent, normalizedMarket),
      },
    });

    const outcomes = await upsertYesNoOutcomes({
      marketId: market.id,
      marketSlug,
      yesLabel: participantName,
      yesTokenId: providerMarket.clobTokenIds[0] ?? null,
      noTokenId: providerMarket.clobTokenIds[1] ?? null,
      yesPrice: providerMarket.outcomePrices[0] ?? null,
      noPrice: providerMarket.outcomePrices[1] ?? null,
    });
    await upsertReferenceQuoteSnapshots([
      snapshotInput({
        market,
        outcome: outcomes.yes,
        providerMarket,
        outcomePrice: providerMarket.outcomePrices[0] ?? null,
        tokenId: providerMarket.clobTokenIds[0] ?? null,
        outcomeLabel: "Yes",
        fetchedAt: now,
      }),
      snapshotInput({
        market,
        outcome: outcomes.no,
        providerMarket,
        outcomePrice: providerMarket.outcomePrices[1] ?? null,
        tokenId: providerMarket.clobTokenIds[1] ?? null,
        outcomeLabel: "No",
        fetchedAt: now,
      }),
    ]);
    restored.push({
      id: market.id,
      slug: market.slug,
      externalSlug: market.externalSlug,
      externalMarketId: market.externalMarketId,
      participantName,
      yesOutcomeId: outcomes.yes.id,
      noOutcomeId: outcomes.no.id,
    });
  }

  const summary = {
    pass: restored.length >= 3,
    generatedAt: now.toISOString(),
    eventSlug,
    providerEventSlug,
    eventId: localEvent.id,
    eventTitle: localEvent.title,
    restoredProviderMarketCount: restored.length,
    restoredMarkets: restored,
    note: "Restores the current Local MVP World Cup match after integration tests reset local markets. Line markets are seeded by seed_mobile_mvp_match_line_markets.ts.",
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.pass) process.exitCode = 1;
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
  const inputs = [
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
  for (const input of inputs) {
    const existing = await prisma.outcome.findFirst({
      where: { marketId: params.marketId, code: input.code },
    });
    const data = {
      name: input.name,
      label: input.label,
      side: input.side,
      displayOrder: input.displayOrder,
      isActive: true,
      isTradable: true,
      status: "active",
      referenceTokenId: input.referenceTokenId,
      referenceOutcomeLabel: input.referenceOutcomeLabel,
      referenceMetadata: {
        importedFrom: "polymarket",
        providerOutcomeLabel: input.referenceOutcomeLabel,
        outcomePrice: input.outcomePrice,
      },
    };
    const outcome = existing
      ? await prisma.outcome.update({ where: { id: existing.id }, data })
      : await prisma.outcome.create({
          data: {
            marketId: params.marketId,
            code: input.code,
            slug: `${params.marketSlug}-${input.code.toLowerCase()}`,
            ...data,
          },
        });
    saved.push(outcome);
  }
  await prisma.outcome.updateMany({
    where: { marketId: params.marketId, id: { notIn: saved.map((outcome) => outcome.id) } },
    data: { isActive: false, status: "archived" },
  });
  return { yes: saved[0]!, no: saved[1]! };
}

function snapshotInput(params: {
  market: {
    id: string;
    externalSlug: string | null;
    externalMarketId: string | null;
    conditionId: string | null;
  };
  outcome: { id: string };
  providerMarket: Awaited<ReturnType<typeof fetchPolymarketEventBySlug>>["markets"][number];
  tokenId: string | null;
  outcomeLabel: string;
  outcomePrice: number | null;
  fetchedAt: Date;
}) {
  return {
    marketId: params.market.id,
    outcomeId: params.outcome.id,
    source: "polymarket",
    externalSlug: params.market.externalSlug,
    externalMarketId: params.market.externalMarketId,
    conditionId: params.market.conditionId,
    tokenId: params.tokenId,
    outcomeLabel: params.outcomeLabel,
    outcomePrice: params.outcomePrice,
    bestBid: params.providerMarket.bestBid,
    bestAsk: params.providerMarket.bestAsk,
    spread: params.providerMarket.spread ?? computeSpread(params.providerMarket.bestBid, params.providerMarket.bestAsk),
    lastTradePrice: params.providerMarket.lastTradePrice,
    volume: params.providerMarket.volume,
    volume24hr: params.providerMarket.volume24hr,
    liquidity: params.providerMarket.liquidity,
    liquidityClob: params.providerMarket.liquidityClob,
    acceptingOrders: params.providerMarket.acceptingOrders,
    qualityStatus: params.providerMarket.bestBid == null || params.providerMarket.bestAsk == null ? "missing_book" : "restored",
    mmEligible: false,
    reason: "current_mvp_match_restore",
    fetchedAt: params.fetchedAt,
  };
}

function eventMetadata(
  providerEventSlug: string,
  now: Date,
  normalizedEvent: ReturnType<typeof normalizePolymarketSoccerEvent>,
): Prisma.InputJsonValue {
  return {
    ...(normalizedSoccerMetadata({ event: normalizedEvent }) as Record<string, unknown>),
    providerSource: "polymarket-gamma",
    providerEventSlug,
    mobileLiveDetail: {
      liveDataStatus: {
        source: "polymarket-gamma",
        status: "ready",
        lastUpdated: now.toISOString(),
        reason: "Current Local MVP World Cup match restored for Android proof.",
      },
    },
  };
}

function marketMetadata(
  providerEventSlug: string,
  market: Awaited<ReturnType<typeof fetchPolymarketEventBySlug>>["markets"][number],
  normalizedEvent: ReturnType<typeof normalizePolymarketSoccerEvent>,
  normalizedMarket: ReturnType<typeof normalizePolymarketSoccerMarket>,
): Prisma.InputJsonValue {
  return {
    ...(normalizedSoccerMetadata({ event: normalizedEvent, market: normalizedMarket }) as Record<string, unknown>),
    importedFrom: "polymarket",
    importStatus: "approved",
    referenceOnly: false,
    tradable: true,
    mmEnabled: true,
    providerEventSlug,
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
      active: market.active,
      closed: market.closed,
      archived: market.archived,
    },
  };
}

function extractTeamLabel(question: string) {
  const match = question.match(/^Will\s+(.+?)\s+win\b/i);
  return match?.[1]?.trim() || question.trim();
}

function computeSpread(bestBid: number | null, bestAsk: number | null) {
  if (bestBid == null || bestAsk == null) return null;
  return Number((bestAsk - bestBid).toFixed(6));
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

main()
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
