import { Prisma } from "@prisma/client";
import { getOutcomeQuotes } from "@/lib/orderbookPricing";
import { parseReferenceReview } from "@/server/services/polymarketReferenceImport";
import { getReferenceSummaryForMarket } from "@/server/services/referenceQuoteSnapshots";

export const marketReadInclude = Prisma.validator<Prisma.MarketInclude>()({
  outcomes: {
    where: { isActive: true },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  },
  outcomeSnapshots: {
    orderBy: { ts: "desc" },
    take: 240,
  },
  referenceQuoteSnapshots: {
    orderBy: [{ fetchedAt: "desc" }, { updatedAt: "desc" }],
  },
  event: true,
  category: true,
  tags: { include: { tag: true } },
});

type MarketWithRelations = Prisma.MarketGetPayload<{
  include: typeof marketReadInclude;
}>;

const buildLegacyBinaryPrices = (
  outcomes: Array<{ id: string; name: string }>,
  pricesByOutcome: Record<string, number>,
) => {
  if (
    outcomes.length !== 2 ||
    !outcomes.some((outcome) => outcome.name.trim().toUpperCase() === "YES") ||
    !outcomes.some((outcome) => outcome.name.trim().toUpperCase() === "NO")
  ) {
    return null;
  }

  const yesOutcome = outcomes.find((outcome) => outcome.name.trim().toUpperCase() === "YES");
  const noOutcome = outcomes.find((outcome) => outcome.name.trim().toUpperCase() === "NO");
  return {
    YES: yesOutcome ? pricesByOutcome[yesOutcome.id] ?? 0.5 : 0.5,
    NO: noOutcome ? pricesByOutcome[noOutcome.id] ?? 0.5 : 0.5,
  };
};

const decimalToNumber = (value: Prisma.Decimal | null | undefined) => {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isOutrightEventType = (value: string | null | undefined) => {
  const normalized = `${value ?? ""}`.trim().toLowerCase();
  return ["future", "futures", "outright", "outrights"].includes(normalized);
};

const mobileMarketContractForMarket = (market: MarketWithRelations) => {
  const isOutright = isOutrightEventType(market.event?.eventType);
  return {
    marketGroupKey: isOutright ? "outrights" : market.marketGroupKey,
    marketGroupTitle: isOutright ? "Outrights" : market.marketGroupTitle,
    marketType: isOutright ? "outright" : market.marketType,
  };
};

const latestReferenceQuoteByOutcome = (
  snapshots: MarketWithRelations["referenceQuoteSnapshots"] | undefined,
) => {
  const latestByOutcome = new Map<string, MarketWithRelations["referenceQuoteSnapshots"][number]>();
  for (const snapshot of snapshots ?? []) {
    const existing = latestByOutcome.get(snapshot.outcomeId);
    if (
      !existing ||
      snapshot.fetchedAt > existing.fetchedAt ||
      (snapshot.fetchedAt.getTime() === existing.fetchedAt.getTime() && snapshot.updatedAt > existing.updatedAt)
    ) {
      latestByOutcome.set(snapshot.outcomeId, snapshot);
    }
  }
  return latestByOutcome;
};

const displayQuoteFromReferenceSnapshot = (
  snapshot: MarketWithRelations["referenceQuoteSnapshots"][number] | null,
) => {
  if (!snapshot) return null;
  const outcomePrice = decimalToNumber(snapshot.outcomePrice);
  const { bestBid, bestAsk } = normalizeReferenceBidAsk({
    outcomePrice,
    bestBid: decimalToNumber(snapshot.bestBid),
    bestAsk: decimalToNumber(snapshot.bestAsk),
  });
  const price = outcomePrice ?? (bestBid != null && bestAsk != null ? (bestBid + bestAsk) / 2 : bestAsk ?? bestBid);
  if (price == null) return null;
  return {
    bestBid,
    bestAsk,
    bestBidSize: null,
    bestAskSize: null,
    mid: price,
    spread: decimalToNumber(snapshot.spread) ?? (bestBid != null && bestAsk != null ? bestAsk - bestBid : null),
  };
};

const normalizeReferenceBidAsk = (quote: {
  outcomePrice: number | null;
  bestBid: number | null;
  bestAsk: number | null;
}) => {
  const { outcomePrice, bestBid, bestAsk } = quote;
  if (outcomePrice == null || bestBid == null || bestAsk == null) {
    return { bestBid, bestAsk };
  }
  const midpoint = (bestBid + bestAsk) / 2;
  const complementBid = 1 - bestAsk;
  const complementAsk = 1 - bestBid;
  const complementMidpoint = (complementBid + complementAsk) / 2;
  const midpointDistance = Math.abs(outcomePrice - midpoint);
  const complementDistance = Math.abs(outcomePrice - complementMidpoint);
  if (complementDistance + 0.000001 < midpointDistance && midpointDistance > 0.1) {
    return {
      bestBid: Number(complementBid.toFixed(8)),
      bestAsk: Number(complementAsk.toFixed(8)),
    };
  }
  return { bestBid, bestAsk };
};

export const serializeMarketReadModel = async (market: MarketWithRelations) => {
  const referenceReview = parseReferenceReview(market.referenceMetadata);
  const mobileContract = mobileMarketContractForMarket(market);
  const outcomeQuotes =
    market.mechanism === "ORDERBOOK"
      ? await getOutcomeQuotes(
          market.id,
          market.outcomes.map((outcome) => outcome.id),
        )
      : new Map(
          market.outcomes.map((outcome) => [
            outcome.id,
            { bestBid: null, bestAsk: null, bestBidSize: null, bestAskSize: null, mid: 0.5, spread: null },
          ]),
        );

  const referenceQuoteByOutcome = latestReferenceQuoteByOutcome(market.referenceQuoteSnapshots);
  const displayQuoteByOutcome = new Map(
    market.outcomes.map((outcome) => [
      outcome.id,
      displayQuoteFromReferenceSnapshot(referenceQuoteByOutcome.get(outcome.id) ?? null) ??
        outcomeQuotes.get(outcome.id) ?? {
          bestBid: null,
          bestAsk: null,
          bestBidSize: null,
          bestAskSize: null,
          mid: 0.5,
          spread: null,
        },
    ]),
  );

  const pricesByOutcome = Object.fromEntries(
    market.outcomes.map((outcome) => [outcome.id, displayQuoteByOutcome.get(outcome.id)?.mid ?? 0.5]),
  );
  const legacyPrices = buildLegacyBinaryPrices(market.outcomes, pricesByOutcome);
  const referenceSummary = await getReferenceSummaryForMarket(market.id);
  const orderbookDepth = market.outcomes.flatMap((outcome) => {
    const quote = outcomeQuotes.get(outcome.id);
    const levels: Array<{
      outcomeId: string;
      side: "bid" | "ask";
      price: number;
      shares: number;
      total: number;
    }> = [];
    if (quote?.bestBid != null && quote.bestBidSize != null && quote.bestBidSize > 0) {
      levels.push({
        outcomeId: outcome.id,
        side: "bid",
        price: quote.bestBid,
        shares: quote.bestBidSize,
        total: quote.bestBid * quote.bestBidSize,
      });
    }
    if (quote?.bestAsk != null && quote.bestAskSize != null && quote.bestAskSize > 0) {
      levels.push({
        outcomeId: outcome.id,
        side: "ask",
        price: quote.bestAsk,
        shares: quote.bestAskSize,
        total: quote.bestAsk * quote.bestAskSize,
      });
    }
    return levels;
  });
  const liquidity =
    orderbookDepth.length > 0
      ? orderbookDepth.reduce((sum, level) => sum + level.total, 0)
      : null;

  return {
    id: market.id,
    title: market.title,
    description: market.description,
    status: market.status,
    marketGroupKey: mobileContract.marketGroupKey,
    marketGroupId: mobileContract.marketGroupKey,
    marketGroupTitle: mobileContract.marketGroupTitle,
    displayOrder: market.displayOrder,
    line: market.line?.toString() ?? null,
    unit: market.unit,
    period: market.period,
    participantType: market.participantType,
    participantName: market.participantName,
    participantId: market.participantId,
    propCategory: market.propCategory,
    liquidity,
    orderbookDepth,
    rulesText: market.rulesText,
    sourceUpdatedAt: market.sourceUpdatedAt,
    resolveTime: market.resolveTime,
    createdAt: market.createdAt,
    outcomes: market.outcomes.map((outcome) => {
      const quote = displayQuoteByOutcome.get(outcome.id) ?? {
        bestBid: null,
        bestAsk: null,
        bestBidSize: null,
        bestAskSize: null,
        mid: 0.5,
        spread: null,
      };
      return {
        id: outcome.id,
        name: outcome.name,
        label: outcome.label ?? outcome.name,
        code: outcome.code,
        side: outcome.side,
        displayOrder: outcome.displayOrder,
        status: outcome.status,
        isTradable: outcome.isTradable,
        resolvedResult: outcome.resolvedResult,
        metadata: outcome.metadata,
        referenceTokenId: outcome.referenceTokenId,
        referenceOutcomeLabel: outcome.referenceOutcomeLabel,
        price: quote.mid,
        bestBid: quote.bestBid,
        bestAsk: quote.bestAsk,
        bestBidSize: quote.bestBidSize,
        bestAskSize: quote.bestAskSize,
        spread: quote.spread,
      };
    }),
    event: market.event
      ? {
          id: market.event.id,
          slug: market.event.slug,
          title: market.event.title,
          category: market.event.category,
          sportKey: market.event.sportKey,
          leagueKey: market.event.leagueKey,
          eventType: market.event.eventType,
          homeTeamName: market.event.homeTeamName,
          awayTeamName: market.event.awayTeamName,
          startTime: market.event.startTime,
          status: market.event.status,
          liveStatus: market.event.liveStatus,
          period: market.event.period,
          clock: market.event.clock,
          homeScore: market.event.homeScore,
          awayScore: market.event.awayScore,
          source: market.event.source,
          externalEventId: market.event.externalEventId,
          externalSlug: market.event.externalSlug,
          venue: market.event.venue,
          image: market.event.image,
          icon: market.event.icon,
        }
      : null,
    externalMarketId: market.externalMarketId,
    conditionId: market.conditionId,
    referenceSource: market.referenceSource,
    externalSlug: market.externalSlug,
    importStatus: referenceReview.importStatus ?? null,
    referenceOnly: referenceReview.referenceOnly ?? null,
    tradable: referenceReview.tradable ?? null,
    mmEnabled: referenceReview.mmEnabled ?? null,
    referenceSummary,
    type: market.type,
    marketType: mobileContract.marketType,
    kind: market.kind,
    visibility: market.visibility,
    mechanism: market.mechanism,
    category: market.category
      ? { id: market.category.id, name: market.category.name, slug: market.category.slug }
      : null,
    tags: market.tags.map((marketTag) => ({
      id: marketTag.tag.id,
      name: marketTag.tag.name,
      slug: marketTag.tag.slug,
      group: marketTag.tag.group,
    })),
    prices: legacyPrices,
    pricesByOutcome,
  };
};
