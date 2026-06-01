import { Prisma } from "@prisma/client";
import { getOutcomeQuotes } from "@/lib/orderbookPricing";
import { parseReferenceReview } from "@/server/services/polymarketReferenceImport";
import { getReferenceSummaryForMarket } from "@/server/services/referenceQuoteSnapshots";

export const marketReadInclude = Prisma.validator<Prisma.MarketInclude>()({
  outcomes: {
    where: { isActive: true },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
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

export const serializeMarketReadModel = async (market: MarketWithRelations) => {
  const referenceReview = parseReferenceReview(market.referenceMetadata);
  const outcomeQuotes =
    market.mechanism === "ORDERBOOK"
      ? await getOutcomeQuotes(
          market.id,
          market.outcomes.map((outcome) => outcome.id),
        )
      : new Map(
          market.outcomes.map((outcome) => [
            outcome.id,
            { bestBid: null, bestAsk: null, mid: 0.5, spread: null },
          ]),
        );

  const pricesByOutcome = Object.fromEntries(
    market.outcomes.map((outcome) => [outcome.id, outcomeQuotes.get(outcome.id)?.mid ?? 0.5]),
  );
  const legacyPrices = buildLegacyBinaryPrices(market.outcomes, pricesByOutcome);
  const referenceSummary = await getReferenceSummaryForMarket(market.id);

  return {
    id: market.id,
    title: market.title,
    description: market.description,
    status: market.status,
    resolveTime: market.resolveTime,
    createdAt: market.createdAt,
    outcomes: market.outcomes.map((outcome) => {
      const quote = outcomeQuotes.get(outcome.id) ?? {
        bestBid: null,
        bestAsk: null,
        mid: 0.5,
        spread: null,
      };
      return {
        id: outcome.id,
        name: outcome.name,
        displayOrder: outcome.displayOrder,
        isTradable: outcome.isTradable,
        referenceTokenId: outcome.referenceTokenId,
        referenceOutcomeLabel: outcome.referenceOutcomeLabel,
        price: quote.mid,
        bestBid: quote.bestBid,
        bestAsk: quote.bestAsk,
        spread: quote.spread,
      };
    }),
    event: market.event
      ? {
          id: market.event.id,
          slug: market.event.slug,
          title: market.event.title,
          category: market.event.category,
          source: market.event.source,
          externalEventId: market.event.externalEventId,
          externalSlug: market.event.externalSlug,
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
