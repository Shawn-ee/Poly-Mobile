import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  assessMobileLiveProviderMappingReadiness,
  getMobileLiveProviderMappingReadiness,
} from "@/server/services/mobileLiveProviderMapping";
import { selectCompactLiveMarkets } from "@/server/services/mobileLiveEventDetail";

export type ProviderOutcomeIdentityInput = {
  outcomeId: string;
  referenceTokenId: string;
  referenceOutcomeLabel: string;
};

export type ProviderMarketIdentityInput = {
  marketId: string;
  referenceSource?: string | null;
  externalSlug: string;
  externalMarketId: string;
  conditionId: string;
  outcomes: ProviderOutcomeIdentityInput[];
};

export type AttachMobileLiveProviderIdentitiesOptions = {
  eventSlug: string;
  dryRun: boolean;
  confirmApply?: boolean;
  mappings: ProviderMarketIdentityInput[];
};

type CompactMarketForAttach = {
  id: string;
  title: string;
  status: string;
  referenceSource?: string | null;
  externalSlug?: string | null;
  externalMarketId?: string | null;
  conditionId?: string | null;
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
  }>;
};

export async function attachMobileLiveProviderIdentities(options: AttachMobileLiveProviderIdentitiesOptions) {
  if (!options.dryRun && !options.confirmApply) {
    throw new Error("confirmApply=true is required to attach provider identities.");
  }
  if (options.mappings.length === 0) {
    throw new Error("At least one provider mapping is required.");
  }

  const compactMarkets = await loadCompactLiveMarkets(options.eventSlug);
  const validation = validateMobileLiveProviderIdentityMappings({
    compactMarkets,
    mappings: options.mappings,
  });

  if (!validation.valid) {
    return {
      eventSlug: options.eventSlug,
      dryRun: options.dryRun,
      applied: false,
      validation,
      before: assessMobileLiveProviderMappingReadiness({ eventSlug: options.eventSlug, compactMarkets }),
      after: null,
    };
  }

  if (options.dryRun) {
    return {
      eventSlug: options.eventSlug,
      dryRun: true,
      applied: false,
      validation,
      before: assessMobileLiveProviderMappingReadiness({ eventSlug: options.eventSlug, compactMarkets }),
      after: assessMobileLiveProviderMappingReadiness({
        eventSlug: options.eventSlug,
        compactMarkets: projectMappedCompactMarkets(compactMarkets, options.mappings),
      }),
    };
  }

  await prisma.$transaction(async (tx) => {
    for (const mapping of options.mappings) {
      await tx.market.update({
        where: { id: mapping.marketId },
        data: {
          referenceSource: mapping.referenceSource?.trim() || "polymarket",
          externalSlug: mapping.externalSlug.trim(),
          externalMarketId: mapping.externalMarketId.trim(),
          conditionId: mapping.conditionId.trim(),
        },
      });

      for (const outcome of mapping.outcomes) {
        await tx.outcome.update({
          where: { id: outcome.outcomeId },
          data: {
            referenceTokenId: outcome.referenceTokenId.trim(),
            referenceOutcomeLabel: outcome.referenceOutcomeLabel.trim(),
          },
        });
      }
    }
  });

  return {
    eventSlug: options.eventSlug,
    dryRun: false,
    applied: true,
    validation,
    before: assessMobileLiveProviderMappingReadiness({ eventSlug: options.eventSlug, compactMarkets }),
    after: await getMobileLiveProviderMappingReadiness(options.eventSlug),
  };
}

export function validateMobileLiveProviderIdentityMappings(params: {
  compactMarkets: CompactMarketForAttach[];
  mappings: ProviderMarketIdentityInput[];
}) {
  const compactMarketIds = new Set(params.compactMarkets.map((market) => market.id));
  const compactOutcomeIds = new Map<string, Set<string>>();
  for (const market of params.compactMarkets) {
    compactOutcomeIds.set(market.id, new Set(market.outcomes.map((outcome) => outcome.id)));
  }

  const errors: Array<{
    marketId?: string;
    outcomeId?: string;
    field?: string;
    reason: string;
  }> = [];
  const seenMarkets = new Set<string>();
  const seenExternalSlugs = new Set<string>();
  const seenConditionIds = new Set<string>();
  const seenTokens = new Set<string>();

  for (const mapping of params.mappings) {
    const marketId = mapping.marketId?.trim();
    if (!marketId || !compactMarketIds.has(marketId)) {
      errors.push({ marketId, reason: "market_not_in_compact_live_event" });
      continue;
    }
    if (seenMarkets.has(marketId)) {
      errors.push({ marketId, reason: "duplicate_market_mapping" });
    }
    seenMarkets.add(marketId);

    const referenceSource = mapping.referenceSource?.trim() || "polymarket";
    if (referenceSource !== "polymarket") {
      errors.push({ marketId, field: "referenceSource", reason: "unsupported_provider_source" });
    }
    requireNonEmpty(mapping.externalSlug, "externalSlug", marketId, errors);
    requireNonEmpty(mapping.externalMarketId, "externalMarketId", marketId, errors);
    requireNonEmpty(mapping.conditionId, "conditionId", marketId, errors);
    trackUnique(mapping.externalSlug, seenExternalSlugs, "externalSlug", marketId, errors);
    trackUnique(mapping.conditionId, seenConditionIds, "conditionId", marketId, errors);

    const allowedOutcomeIds = compactOutcomeIds.get(marketId) ?? new Set<string>();
    const seenOutcomeIds = new Set<string>();
    for (const outcome of mapping.outcomes ?? []) {
      const outcomeId = outcome.outcomeId?.trim();
      if (!outcomeId || !allowedOutcomeIds.has(outcomeId)) {
        errors.push({ marketId, outcomeId, reason: "outcome_not_in_compact_market" });
        continue;
      }
      if (seenOutcomeIds.has(outcomeId)) {
        errors.push({ marketId, outcomeId, reason: "duplicate_outcome_mapping" });
      }
      seenOutcomeIds.add(outcomeId);
      requireNonEmpty(outcome.referenceTokenId, "referenceTokenId", marketId, errors, outcomeId);
      requireNonEmpty(outcome.referenceOutcomeLabel, "referenceOutcomeLabel", marketId, errors, outcomeId);
      trackUnique(outcome.referenceTokenId, seenTokens, "referenceTokenId", marketId, errors, outcomeId);
    }
    if (allowedOutcomeIds.size !== seenOutcomeIds.size) {
      errors.push({ marketId, reason: "mapping_must_include_every_compact_market_outcome" });
    }
  }

  return {
    valid: errors.length === 0,
    compactMarketCount: params.compactMarkets.length,
    requestedMarketCount: params.mappings.length,
    errors,
  };
}

async function loadCompactLiveMarkets(eventSlug: string) {
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

  return selectCompactLiveMarkets(event.markets);
}

function projectMappedCompactMarkets(
  compactMarkets: CompactMarketForAttach[],
  mappings: ProviderMarketIdentityInput[],
) {
  const byMarketId = new Map(mappings.map((mapping) => [mapping.marketId, mapping]));
  return compactMarkets.map((market) => {
    const mapping = byMarketId.get(market.id);
    if (!mapping) return market;
    const byOutcomeId = new Map(mapping.outcomes.map((outcome) => [outcome.outcomeId, outcome]));
    return {
      ...market,
      referenceSource: mapping.referenceSource?.trim() || "polymarket",
      externalSlug: mapping.externalSlug.trim(),
      externalMarketId: mapping.externalMarketId.trim(),
      conditionId: mapping.conditionId.trim(),
      outcomes: market.outcomes.map((outcome) => {
        const mappedOutcome = byOutcomeId.get(outcome.id);
        if (!mappedOutcome) return outcome;
        return {
          ...outcome,
          referenceTokenId: mappedOutcome.referenceTokenId.trim(),
          referenceOutcomeLabel: mappedOutcome.referenceOutcomeLabel.trim(),
        };
      }),
    };
  });
}

function requireNonEmpty(
  value: string | null | undefined,
  field: string,
  marketId: string,
  errors: Array<{ marketId?: string; outcomeId?: string; field?: string; reason: string }>,
  outcomeId?: string,
) {
  if (!value?.trim()) {
    errors.push({ marketId, outcomeId, field, reason: "required_field_missing" });
  }
}

function trackUnique(
  value: string | null | undefined,
  seen: Set<string>,
  field: string,
  marketId: string,
  errors: Array<{ marketId?: string; outcomeId?: string; field?: string; reason: string }>,
  outcomeId?: string,
) {
  const normalized = value?.trim();
  if (!normalized) return;
  if (seen.has(normalized)) {
    errors.push({ marketId, outcomeId, field, reason: "duplicate_provider_identity" });
  }
  seen.add(normalized);
}
