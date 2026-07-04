import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { selectCompactLiveMarkets } from "@/server/services/mobileLiveEventDetail";

export type LineProviderOutcomeReviewInput = {
  outcomeId: string;
  providerOddId: string;
  selection: string;
  selectionLine?: string | null;
  teamId?: string | null;
};

export type LineProviderMarketReviewInput = {
  marketId: string;
  providerSource?: "optic_odds";
  fixtureId: string;
  gameId?: string | null;
  sportsbook: string;
  providerMarketId: string;
  providerMarketName?: string | null;
  points?: number | null;
  period?: string | null;
  outcomes: LineProviderOutcomeReviewInput[];
};

export type ReviewMobileLiveLineProviderIdentitiesOptions = {
  eventSlug: string;
  dryRun: boolean;
  confirmApply?: boolean;
  reviews: LineProviderMarketReviewInput[];
};

type CompactMarketForLineReview = {
  id: string;
  title: string;
  marketType: string;
  line: Prisma.Decimal | null;
  period: string | null;
  referenceMetadata: unknown;
  outcomes: Array<{
    id: string;
    name: string;
    side: string | null;
    referenceMetadata: unknown;
  }>;
};

export async function reviewMobileLiveLineProviderIdentities(
  options: ReviewMobileLiveLineProviderIdentitiesOptions,
) {
  if (!options.dryRun && !options.confirmApply) {
    throw new Error("confirmApply=true is required to apply line provider identities.");
  }
  const compactMarkets = await loadCompactLiveMarkets(options.eventSlug);
  const validation = validateLineProviderIdentityReviews({
    compactMarkets,
    reviews: options.reviews,
  });
  const projected = projectLineProviderIdentities(compactMarkets, options.reviews);

  if (!validation.valid || options.dryRun) {
    return {
      eventSlug: options.eventSlug,
      mode: "line-provider-identity-review",
      dryRun: options.dryRun,
      applied: false,
      blocked: !validation.valid,
      blockReason: validation.valid ? null : "line_provider_review_has_failed_items",
      validation,
      before: summarizeLineProviderIdentityReadiness(compactMarkets),
      after: validation.valid ? summarizeLineProviderIdentityReadiness(projected) : null,
      nextRequiredAction: validation.valid
        ? "confirm_apply_line_provider_identity_reviews"
        : "fix_failed_line_provider_identity_reviews",
    };
  }

  await prisma.$transaction(async (tx) => {
    for (const review of options.reviews) {
      const market = compactMarkets.find((item) => item.id === review.marketId);
      if (!market) continue;
      await tx.market.update({
        where: { id: review.marketId },
        data: {
          referenceMetadata: mergeJsonObject(market.referenceMetadata, {
            lineProviderIdentity: buildMarketLineProviderIdentity(review),
          }),
        },
      });
      for (const outcomeReview of review.outcomes) {
        const outcome = market.outcomes.find((item) => item.id === outcomeReview.outcomeId);
        if (!outcome) continue;
        await tx.outcome.update({
          where: { id: outcomeReview.outcomeId },
          data: {
            referenceMetadata: mergeJsonObject(outcome.referenceMetadata, {
              lineProviderIdentity: buildOutcomeLineProviderIdentity(outcomeReview),
            }),
          },
        });
      }
    }
  });

  const reloaded = await loadCompactLiveMarkets(options.eventSlug);
  return {
    eventSlug: options.eventSlug,
    mode: "line-provider-identity-review",
    dryRun: false,
    applied: true,
    blocked: false,
    blockReason: null,
    validation,
    before: summarizeLineProviderIdentityReadiness(compactMarkets),
    after: summarizeLineProviderIdentityReadiness(reloaded),
    nextRequiredAction: "optional_optic_odds_enrichment_ready",
  };
}

export function validateLineProviderIdentityReviews(params: {
  compactMarkets: CompactMarketForLineReview[];
  reviews: LineProviderMarketReviewInput[];
}) {
  const compactById = new Map(params.compactMarkets.map((market) => [market.id, market]));
  const errors: Array<{ marketId?: string; outcomeId?: string; field?: string; reason: string }> = [];
  const seenMarkets = new Set<string>();
  const seenOddIds = new Set<string>();

  for (const review of params.reviews) {
    const marketId = review.marketId?.trim();
    const market = marketId ? compactById.get(marketId) : null;
    if (!market) {
      errors.push({ marketId, reason: "market_not_in_compact_live_event" });
      continue;
    }
    if (seenMarkets.has(market.id)) errors.push({ marketId: market.id, reason: "duplicate_market_review" });
    seenMarkets.add(market.id);

    if ((review.providerSource ?? "optic_odds") !== "optic_odds") {
      errors.push({ marketId: market.id, field: "providerSource", reason: "unsupported_line_provider_source" });
    }
    requireNonEmpty(review.fixtureId, "fixtureId", market.id, errors);
    requireNonEmpty(review.sportsbook, "sportsbook", market.id, errors);
    requireNonEmpty(review.providerMarketId, "providerMarketId", market.id, errors);
    if (!providerMarketMatchesLocalType(review.providerMarketId, market.marketType)) {
      errors.push({ marketId: market.id, field: "providerMarketId", reason: "provider_market_type_mismatch" });
    }
    if (!lineMatches(review.points, market.line)) {
      errors.push({ marketId: market.id, field: "points", reason: "provider_line_value_mismatch" });
    }
    if (!periodMatches(review.period, market.period)) {
      errors.push({ marketId: market.id, field: "period", reason: "provider_period_mismatch" });
    }

    const allowedOutcomeIds = new Set(market.outcomes.map((outcome) => outcome.id));
    const seenOutcomes = new Set<string>();
    for (const outcome of review.outcomes ?? []) {
      const outcomeId = outcome.outcomeId?.trim();
      if (!outcomeId || !allowedOutcomeIds.has(outcomeId)) {
        errors.push({ marketId: market.id, outcomeId, reason: "outcome_not_in_compact_market" });
        continue;
      }
      if (seenOutcomes.has(outcomeId)) errors.push({ marketId: market.id, outcomeId, reason: "duplicate_outcome_review" });
      seenOutcomes.add(outcomeId);
      requireNonEmpty(outcome.providerOddId, "providerOddId", market.id, errors, outcomeId);
      requireNonEmpty(outcome.selection, "selection", market.id, errors, outcomeId);
      trackUnique(outcome.providerOddId, seenOddIds, "providerOddId", market.id, errors, outcomeId);
    }
    if (seenOutcomes.size !== allowedOutcomeIds.size) {
      errors.push({ marketId: market.id, reason: "review_must_include_every_compact_market_outcome" });
    }
  }

  return {
    valid: errors.length === 0,
    compactMarketCount: params.compactMarkets.length,
    reviewedMarketCount: params.reviews.length,
    reviewedOutcomeCount: params.reviews.reduce((total, review) => total + (review.outcomes?.length ?? 0), 0),
    errors,
  };
}

export function summarizeLineProviderIdentityReadiness(compactMarkets: CompactMarketForLineReview[]) {
  const lineMarkets = compactMarkets.filter((market) => isLineMarketType(market.marketType));
  const readyMarkets = lineMarkets.filter((market) => {
    const identity = parseLineProviderIdentity(market.referenceMetadata);
    return identity?.providerSource === "optic_odds" &&
      market.outcomes.every((outcome) => parseLineProviderIdentity(outcome.referenceMetadata)?.providerSource === "optic_odds");
  });
  return {
    compactMarketCount: compactMarkets.length,
    lineMarketCount: lineMarkets.length,
    lineProviderReadyMarketCount: readyMarkets.length,
    lineProviderMissingMarketCount: Math.max(0, lineMarkets.length - readyMarkets.length),
    readyMarketIds: readyMarkets.map((market) => market.id),
    nextRequiredAction: readyMarkets.length === lineMarkets.length && lineMarkets.length > 0
      ? "optional_optic_odds_enrichment_ready"
      : "review_and_apply_line_provider_identity",
  };
}

async function loadCompactLiveMarkets(eventSlug: string): Promise<CompactMarketForLineReview[]> {
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
  if (!event) throw new Error(`No live event found for ${eventSlug}.`);
  return selectCompactLiveMarkets(event.markets) as unknown as CompactMarketForLineReview[];
}

function projectLineProviderIdentities(
  compactMarkets: CompactMarketForLineReview[],
  reviews: LineProviderMarketReviewInput[],
) {
  const byMarketId = new Map(reviews.map((review) => [review.marketId, review]));
  return compactMarkets.map((market) => {
    const review = byMarketId.get(market.id);
    if (!review) return market;
    const byOutcomeId = new Map(review.outcomes.map((outcome) => [outcome.outcomeId, outcome]));
    return {
      ...market,
      referenceMetadata: mergeJsonObject(market.referenceMetadata, {
        lineProviderIdentity: buildMarketLineProviderIdentity(review),
      }),
      outcomes: market.outcomes.map((outcome) => {
        const outcomeReview = byOutcomeId.get(outcome.id);
        if (!outcomeReview) return outcome;
        return {
          ...outcome,
          referenceMetadata: mergeJsonObject(outcome.referenceMetadata, {
            lineProviderIdentity: buildOutcomeLineProviderIdentity(outcomeReview),
          }),
        };
      }),
    };
  });
}

function buildMarketLineProviderIdentity(review: LineProviderMarketReviewInput) {
  return {
    providerSource: "optic_odds",
    fixtureId: review.fixtureId.trim(),
    gameId: review.gameId?.trim() || null,
    sportsbook: review.sportsbook.trim(),
    providerMarketId: review.providerMarketId.trim(),
    providerMarketName: review.providerMarketName?.trim() || null,
    points: review.points ?? null,
    period: review.period?.trim() || null,
    reviewedAt: new Date().toISOString(),
  };
}

function buildOutcomeLineProviderIdentity(review: LineProviderOutcomeReviewInput) {
  return {
    providerSource: "optic_odds",
    providerOddId: review.providerOddId.trim(),
    selection: review.selection.trim(),
    selectionLine: review.selectionLine?.trim() || null,
    teamId: review.teamId?.trim() || null,
    reviewedAt: new Date().toISOString(),
  };
}

function mergeJsonObject(current: unknown, patch: Record<string, unknown>): Prisma.InputJsonValue {
  const root = current && typeof current === "object" && !Array.isArray(current)
    ? current as Record<string, unknown>
    : {};
  return { ...root, ...patch } as Prisma.InputJsonValue;
}

function parseLineProviderIdentity(value: unknown) {
  const root = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
  const identity = root?.lineProviderIdentity;
  return identity && typeof identity === "object" && !Array.isArray(identity)
    ? identity as Record<string, unknown>
    : null;
}

function providerMarketMatchesLocalType(providerMarketId: string | null | undefined, marketType: string) {
  const provider = normalize(providerMarketId);
  const local = normalize(marketType);
  if (local.includes("spread")) return provider.includes("spread") || provider.includes("handicap");
  if (local.includes("teamtotal") || local.includes("team_total")) return provider.includes("teamtotal") || provider.includes("team_total");
  if (local.includes("total")) return (provider.includes("total") || provider.includes("overunder")) && !provider.includes("team");
  if (local.includes("moneyline") || local.includes("winner")) return provider.includes("moneyline");
  return provider.length > 0;
}

function lineMatches(points: number | null | undefined, line: Prisma.Decimal | null) {
  if (line == null) return true;
  return typeof points === "number" && Number.isFinite(points) && Math.abs(Math.abs(points) - Math.abs(Number(line))) < 0.001;
}

function periodMatches(providerPeriod: string | null | undefined, localPeriod: string | null) {
  if (!localPeriod) return true;
  return normalize(providerPeriod) === normalize(localPeriod);
}

function isLineMarketType(marketType: string) {
  return ["spread", "total_goals", "totals", "team_total_goals"].includes(marketType);
}

function requireNonEmpty(
  value: string | null | undefined,
  field: string,
  marketId: string,
  errors: Array<{ marketId?: string; outcomeId?: string; field?: string; reason: string }>,
  outcomeId?: string,
) {
  if (!value?.trim()) errors.push({ marketId, outcomeId, field, reason: "required_field_missing" });
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
  if (seen.has(normalized)) errors.push({ marketId, outcomeId, field, reason: "duplicate_provider_identity" });
  seen.add(normalized);
}

function normalize(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
