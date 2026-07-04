import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { selectCompactLiveMarkets } from "@/server/services/mobileLiveEventDetail";
import { extractProviderFixtureMetadataFromEventMetadata } from "@/server/services/mobileLiveProviderFixtureMetadata";
import { summarizeLineProviderIdentityReadiness } from "@/server/services/mobileLiveLineProviderIdentityReview";

type MappingMarketInput = {
  id: string;
  title: string;
  status: string;
  referenceSource?: string | null;
  externalSlug?: string | null;
  externalMarketId?: string | null;
  conditionId?: string | null;
  referenceMetadata?: Prisma.JsonValue | null;
  marketGroupKey: string | null;
  marketGroupTitle: string | null;
  displayOrder: number;
  line: Prisma.Decimal | null;
  unit: string | null;
  period: string | null;
  marketType: string;
  propCategory: string | null;
  outcomes: Array<{
    id: string;
    name: string;
    side: string | null;
    displayOrder: number;
    isTradable: boolean;
    referenceTokenId?: string | null;
    referenceOutcomeLabel?: string | null;
    referenceMetadata?: Prisma.JsonValue | null;
  }>;
};

export type MobileLiveProviderMappingReadiness = ReturnType<typeof assessMobileLiveProviderMappingReadiness>;

export async function getMobileLiveProviderMappingReadiness(eventSlug: string) {
  const event = await prisma.event.findFirst({
    where: { slug: eventSlug },
    include: {
      markets: {
        where: { status: "LIVE", visibility: "PUBLIC", mechanism: "ORDERBOOK" },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        include: {
          outcomes: {
            where: { isActive: true },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });

  if (!event) {
    throw new Error(`No live event found for ${eventSlug}.`);
  }

  return assessMobileLiveProviderMappingReadiness({
    eventSlug,
    providerFixture: extractProviderFixtureMetadataFromEventMetadata(event.metadata),
    compactMarkets: selectCompactLiveMarkets(event.markets),
  });
}

export function assessMobileLiveProviderMappingReadiness(params: {
  eventSlug: string;
  providerFixture?: ReturnType<typeof extractProviderFixtureMetadataFromEventMetadata>;
  compactMarkets: MappingMarketInput[];
}) {
  const markets = params.compactMarkets.map((market) => {
    const missingFields = missingMarketFields(market);
    const outcomes = market.outcomes.map((outcome) => {
      const missingOutcomeFields = missingOutcomeMappingFields(outcome);
      return {
        outcomeId: outcome.id,
        name: outcome.name,
        side: outcome.side,
        displayOrder: outcome.displayOrder,
        isTradable: outcome.isTradable,
        referenceTokenId: outcome.referenceTokenId ?? null,
        referenceOutcomeLabel: outcome.referenceOutcomeLabel ?? null,
        providerRefreshable: missingOutcomeFields.length === 0,
        missingFields: missingOutcomeFields,
        recommendedAction: missingOutcomeFields.length
          ? "map_outcome_to_provider_token"
          : "ready_for_provider_refresh",
      };
    });
    const providerRefreshable = missingFields.length === 0 && outcomes.every((outcome) => outcome.providerRefreshable);

    return {
      marketId: market.id,
      title: market.title,
      status: market.status,
      marketGroupKey: market.marketGroupKey,
      marketGroupTitle: market.marketGroupTitle,
      marketType: market.marketType,
      period: market.period,
      line: market.line?.toString() ?? null,
      unit: market.unit,
      propCategory: market.propCategory,
      referenceSource: market.referenceSource ?? null,
      externalSlug: market.externalSlug ?? null,
      externalMarketId: market.externalMarketId ?? null,
      conditionId: market.conditionId ?? null,
      providerRefreshable,
      missingFields,
      recommendedAction: providerRefreshable
        ? "ready_for_provider_refresh"
        : recommendedMarketAction(market, missingFields),
      outcomes,
    };
  });

  const refreshableMarkets = markets.filter((market) => market.providerRefreshable);
  const unsupportedMarkets = markets.filter((market) => market.referenceSource !== "polymarket");
  const missingSlugMarkets = markets.filter((market) => market.missingFields.includes("externalSlug"));
  const missingExternalMarketIdMarkets = markets.filter((market) => market.missingFields.includes("externalMarketId"));
  const missingConditionIdMarkets = markets.filter((market) => market.missingFields.includes("conditionId"));
  const missingOutcomeTokenMarkets = markets.filter((market) =>
    market.outcomes.some((outcome) => outcome.missingFields.includes("referenceTokenId")),
  );
  const refreshableOutcomes = markets.flatMap((market) => market.outcomes).filter((outcome) => outcome.providerRefreshable);
  const totalOutcomeCount = markets.reduce((sum, market) => sum + market.outcomes.length, 0);

  return {
    eventSlug: params.eventSlug,
    generatedAt: new Date().toISOString(),
    providerFixture: params.providerFixture ?? null,
    lineProviderIdentityReadiness: summarizeLineProviderIdentityReadiness(
      params.compactMarkets.map((market) => ({
        ...market,
        referenceMetadata: market.referenceMetadata ?? null,
        outcomes: market.outcomes.map((outcome) => ({
          ...outcome,
          referenceMetadata: outcome.referenceMetadata ?? null,
        })),
      })),
    ),
    compactMarketCount: markets.length,
    providerRefreshableMarketCount: refreshableMarkets.length,
    providerRefreshableOutcomeCount: refreshableOutcomes.length,
    totalOutcomeCount,
    unsupportedSourceMarketCount: unsupportedMarkets.length,
    missingExternalSlugMarketCount: missingSlugMarkets.length,
    missingExternalMarketIdMarketCount: missingExternalMarketIdMarkets.length,
    missingConditionIdMarketCount: missingConditionIdMarkets.length,
    missingOutcomeTokenMarketCount: missingOutcomeTokenMarkets.length,
    isProviderRefreshReady: markets.length > 0 && refreshableMarkets.length === markets.length,
    nextRequiredAction:
      markets.length === 0
        ? "seed_compact_live_markets"
        : refreshableMarkets.length === markets.length
          ? "run_provider_refresh_without_contract_fallback"
          : "map_compact_markets_to_polymarket_provider_identity",
    markets,
  };
}

function missingMarketFields(market: MappingMarketInput) {
  const missing: string[] = [];
  if (market.referenceSource !== "polymarket") missing.push("referenceSource");
  if (!market.externalSlug) missing.push("externalSlug");
  if (!market.externalMarketId) missing.push("externalMarketId");
  if (!market.conditionId) missing.push("conditionId");
  return missing;
}

function missingOutcomeMappingFields(outcome: MappingMarketInput["outcomes"][number]) {
  const missing: string[] = [];
  if (!outcome.referenceTokenId) missing.push("referenceTokenId");
  if (!outcome.referenceOutcomeLabel) missing.push("referenceOutcomeLabel");
  return missing;
}

function recommendedMarketAction(market: MappingMarketInput, missingFields: string[]) {
  if (market.referenceSource !== "polymarket") return "map_market_to_polymarket_provider_source";
  if (missingFields.includes("externalSlug")) return "add_polymarket_external_slug";
  if (missingFields.includes("externalMarketId")) return "add_polymarket_external_market_id";
  if (missingFields.includes("conditionId")) return "add_polymarket_condition_id";
  return "map_outcomes_to_provider_tokens";
}
