import { prisma } from "@/lib/db";

type JsonObject = Record<string, unknown>;

const stringValue = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : null);

const decisionFor = (params: {
  marketStatus: string | null;
  approvalStatus: string;
  confirmationRequiredKnown: boolean;
  executionEligibleNow: boolean;
  alreadyExecuted: boolean;
}) => {
  if (params.alreadyExecuted) return "already_executed";
  if (params.executionEligibleNow) return "ready_for_exact_confirmation_execution";
  if (params.marketStatus !== "CLOSED") return "wait_for_or_apply_market_close_before_execution";
  if (params.approvalStatus !== "approved") return "wait_for_operator_approval";
  if (!params.confirmationRequiredKnown) return "rerun_settlement_preflight_for_exact_confirmation";
  return "operator_review_required_before_exact_confirmed_execution";
};

export async function getLocalLiveRuntimeSettlementQueue() {
  const reviews = await prisma.officialResultReview.findMany({
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
  const marketIds = Array.from(new Set(reviews.map((review) => review.marketId).filter((id): id is string => Boolean(id))));
  const markets = marketIds.length
    ? await prisma.market.findMany({
        where: { id: { in: marketIds } },
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          settlementStatus: true,
          resolvedOutcomeId: true,
          event: {
            select: {
              id: true,
              slug: true,
              title: true,
              status: true,
              liveStatus: true,
              startTime: true,
            },
          },
        },
      })
    : [];
  const marketById = new Map(markets.map((market) => [market.id, market]));

  const items = reviews.map((review) => {
    const market = review.marketId ? marketById.get(review.marketId) ?? null : null;
    const alreadyExecuted = review.settlementExecutedCanonicalId != null;
    const nextSafeAction = decisionFor({
      marketStatus: market?.status ?? null,
      approvalStatus: review.approvalStatus,
      confirmationRequiredKnown: review.confirmationRequiredKnown,
      executionEligibleNow: review.executionEligibleNow,
      alreadyExecuted,
    });
    return {
      id: review.id,
      reviewKey: review.reviewKey,
      eventSlug: review.eventSlug,
      marketId: review.marketId,
      outcomeId: review.outcomeId,
      providerSource: review.providerSource,
      providerEventId: review.providerEventId,
      resultStatus: review.resultStatus,
      homeScore: review.homeScore,
      awayScore: review.awayScore,
      advanceTeam: review.advanceTeam,
      resultDigest: review.resultDigest,
      trustedResultDigest: review.trustedResultDigest,
      approvalStatus: review.approvalStatus,
      executionDecision: review.executionDecision,
      executionEligibleNow: review.executionEligibleNow,
      confirmationRequiredKnown: review.confirmationRequiredKnown,
      exactConfirmationStored: review.exactConfirmationStored,
      exactConfirmationRedacted: true,
      activeMarketExecutionAttempted: review.activeMarketExecutionAttempted,
      providerQuotaUsed: review.providerQuotaUsed,
      hasPreflightAudit: review.settlementPreflightCanonicalId != null,
      hasApprovalAudit: review.settlementApprovalCanonicalId != null,
      hasExecutionAudit: review.settlementExecutedCanonicalId != null,
      market: market
        ? {
            id: market.id,
            slug: market.slug,
            title: market.title,
            status: market.status,
            settlementStatus: market.settlementStatus,
            resolvedOutcomeId: market.resolvedOutcomeId,
            event: {
              id: market.event?.id ?? null,
              slug: market.event?.slug ?? null,
              title: market.event?.title ?? null,
              status: market.event?.status ?? null,
              liveStatus: market.event?.liveStatus ?? null,
              startTime: market.event?.startTime?.toISOString() ?? null,
            },
          }
        : null,
      nextSafeAction,
      updatedAt: review.updatedAt.toISOString(),
    };
  });

  const checks = {
    durableReviewRowsFound: items.length > 0,
    marketRowsFoundForReviews: items.every((item) => item.market != null || item.marketId == null),
    exactConfirmationNotStored: items.every((item) => item.exactConfirmationStored === false),
    providerQuotaNotUsed: items.every((item) => item.providerQuotaUsed === false),
    activeMarketExecutionNotAttempted: items.every((item) => item.activeMarketExecutionAttempted === false),
    approvedOrExecutedReviewAvailable: items.some((item) => item.approvalStatus === "approved" || item.hasExecutionAudit),
  };
  const p0 = Object.entries(checks)
    .filter(([, value]) => value !== true)
    .map(([key]) => key);

  return {
    generatedAt: new Date().toISOString(),
    scope: "holiwyn-local-live-runtime-settlement-queue",
    status: p0.length === 0 ? "ready" : "needs_attention",
    providerQuotaUsed: false,
    queue: {
      itemCount: items.length,
      pendingCount: items.filter((item) => !item.hasExecutionAudit).length,
      executableNowCount: items.filter((item) => item.executionEligibleNow).length,
      approvedWaitingForCloseCount: items.filter(
        (item) => item.approvalStatus === "approved" && item.market?.status !== "CLOSED" && !item.hasExecutionAudit,
      ).length,
      items,
    },
    runtimeTruth: {
      readOnlyRoute: true,
      devOnlyRoute: true,
      providerQuotaUsed: false,
      exactConfirmationStringsExposed: false,
      exactConfirmationStored: items.some((item) => item.exactConfirmationStored),
      activeMarketExecutionAttempted: items.some((item) => item.activeMarketExecutionAttempted),
      usesDurableOfficialResultReviewRows: true,
      operatorQueueAvailable: p0.length === 0,
      multiEventCapableShape: true,
    },
    checks,
    gaps: {
      p0,
      p1: [
        "This local settlement queue is read-only and proof-backed; installed official-result polling remains future work.",
        "Execution still requires an authenticated operator path before production use.",
      ],
      p2: ["Operator UI and multi-event dashboard remain future work."],
    },
  };
}
