import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

type Operator = {
  id: string;
  email?: string | null;
  username?: string | null;
  roles: string[];
};

type JsonObject = Record<string, unknown>;

const asSnapshotObject = (value: unknown): JsonObject =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};

const blocked = (params: {
  reviewId: string;
  status: string;
  httpStatus: number;
  blockerKeys: string[];
  error: string;
}) => ({
  status: params.status,
  httpStatus: params.httpStatus,
  reviewId: params.reviewId,
  error: params.error,
  blockerKeys: params.blockerKeys,
  providerQuotaUsed: false,
  mutatesSettlement: false,
  exactConfirmationExposed: false,
  exactConfirmationStored: false,
  activeMarketExecutionAttempted: false,
});

export async function requestLocalLiveRuntimeSettlementExecutionDryRun(params: {
  reviewId: string;
  operator: Operator;
}) {
  const review = await prisma.officialResultReview.findUnique({
    where: { id: params.reviewId },
  });
  if (!review) {
    return blocked({
      reviewId: params.reviewId,
      status: "missing_review",
      httpStatus: 404,
      blockerKeys: ["review_missing"],
      error: "Settlement review was not found.",
    });
  }

  if (review.settlementExecutedCanonicalId != null) {
    return blocked({
      reviewId: review.id,
      status: "already_executed",
      httpStatus: 409,
      blockerKeys: ["already_executed"],
      error: "Settlement already has durable execution evidence.",
    });
  }

  const market = review.marketId
    ? await prisma.market.findUnique({
        where: { id: review.marketId },
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
            },
          },
        },
      })
    : null;

  const blockerKeys = Object.entries({
    market_missing: review.marketId != null && market == null,
    market_not_closed: market?.status !== "CLOSED",
    approval_not_recorded: review.approvalStatus !== "approved",
    approval_audit_missing: review.settlementApprovalCanonicalId == null,
    preflight_audit_missing: review.settlementPreflightCanonicalId == null,
    exact_confirmation_unknown: !review.confirmationRequiredKnown,
    execution_not_eligible: !review.executionEligibleNow,
    exact_confirmation_stored: review.exactConfirmationStored,
    provider_quota_used: review.providerQuotaUsed,
  })
    .filter(([, value]) => value === true)
    .map(([key]) => key);

  if (blockerKeys.length > 0) {
    return blocked({
      reviewId: review.id,
      status: "execution_blocked",
      httpStatus: 409,
      blockerKeys,
      error: "Settlement execution dry-run is blocked by required safety guards.",
    });
  }

  const requestedAt = new Date();
  const executionRequestEvent = await prisma.canonicalEvent.create({
    data: {
      stream: "MARKET",
      topicKey: `market:${review.marketId}`,
      eventType: "settlement.trusted_result.execution.dry_run_requested",
      marketId: review.marketId,
      outcomeId: review.outcomeId,
      userId: params.operator.id,
      payload: {
        reviewId: review.id,
        reviewKey: review.reviewKey,
        eventSlug: review.eventSlug,
        marketId: review.marketId,
        outcomeId: review.outcomeId,
        resultDigest: review.resultDigest,
        trustedResultDigest: review.trustedResultDigest,
        approvalCanonicalEventId: review.settlementApprovalCanonicalId?.toString() ?? null,
        preflightCanonicalEventId: review.settlementPreflightCanonicalId?.toString() ?? null,
        operator: {
          id: params.operator.id,
          email: params.operator.email ?? null,
          username: params.operator.username ?? null,
          roles: params.operator.roles,
        },
        requestedAt: requestedAt.toISOString(),
        dryRunOnly: true,
        source: "internal-operator-session",
        executionRequiresMarketStatus: "CLOSED",
        currentMarketStatus: market?.status ?? null,
        mutatesSettlement: false,
        exactConfirmationExposed: false,
        exactConfirmationStored: false,
        providerQuotaUsed: false,
        activeMarketExecutionAttempted: false,
      },
    },
  });

  const operatorAuditEvent = await prisma.operatorAuditEvent.create({
    data: {
      operatorUserId: params.operator.id,
      reviewId: review.id,
      action: "settlement_execution_dry_run_requested",
      roleSnapshot: params.operator.roles,
      requestId: randomUUID(),
      canonicalEventId: executionRequestEvent.id,
      metadata: {
        eventSlug: review.eventSlug,
        marketId: review.marketId,
        outcomeId: review.outcomeId,
        resultDigest: review.resultDigest,
        trustedResultDigest: review.trustedResultDigest,
        approvalCanonicalEventId: review.settlementApprovalCanonicalId?.toString() ?? null,
        preflightCanonicalEventId: review.settlementPreflightCanonicalId?.toString() ?? null,
        requestedAt: requestedAt.toISOString(),
        source: "internal-operator-session",
        dryRunOnly: true,
        mutatesSettlement: false,
        exactConfirmationExposed: false,
        exactConfirmationStored: false,
        providerQuotaUsed: false,
        activeMarketExecutionAttempted: false,
      },
    },
  });

  await prisma.officialResultReview.update({
    where: { id: review.id },
    data: {
      reviewSnapshot: {
        ...asSnapshotObject(review.reviewSnapshot),
        operatorExecutionDryRun: {
          requestedAt: requestedAt.toISOString(),
          requestedByUserId: params.operator.id,
          roleSnapshot: params.operator.roles,
          canonicalExecutionRequestEventId: executionRequestEvent.id.toString(),
          operatorAuditEventId: operatorAuditEvent.id,
          mutatesSettlement: false,
          exactConfirmationExposed: false,
          exactConfirmationStored: false,
          providerQuotaUsed: false,
          activeMarketExecutionAttempted: false,
        },
      },
    },
  });

  return {
    status: "dry_run_ready",
    httpStatus: 200,
    reviewId: review.id,
    providerQuotaUsed: false,
    mutatesSettlement: false,
    exactConfirmationExposed: false,
    exactConfirmationStored: false,
    activeMarketExecutionAttempted: false,
    executionWouldRequireExactConfirmation: true,
    executionWouldRequireClosedMarket: true,
    executionRequestEvidence: {
      canonicalExecutionRequestEventId: executionRequestEvent.id.toString(),
      operatorAuditEventId: operatorAuditEvent.id,
      eventType: "settlement.trusted_result.execution.dry_run_requested",
      dryRunOnly: true,
      operatorUserId: params.operator.id,
      durableIdentityRecorded: true,
    },
    review: {
      id: review.id,
      eventSlug: review.eventSlug,
      marketId: review.marketId,
      outcomeId: review.outcomeId,
      approvalStatus: review.approvalStatus,
      executionDecision: review.executionDecision,
      executionEligibleNow: review.executionEligibleNow,
      confirmationRequiredKnown: review.confirmationRequiredKnown,
      settlementPreflightCanonicalId: review.settlementPreflightCanonicalId?.toString() ?? null,
      settlementApprovalCanonicalId: review.settlementApprovalCanonicalId?.toString() ?? null,
      settlementExecutedCanonicalId: null,
    },
    market: market
      ? {
          id: market.id,
          slug: market.slug,
          title: market.title,
          status: market.status,
          settlementStatus: market.settlementStatus,
          resolvedOutcomeId: market.resolvedOutcomeId,
          event: market.event,
        }
      : null,
    operator: {
      id: params.operator.id,
      roles: params.operator.roles,
      durableIdentityRecorded: true,
      durableAuditEventRecorded: true,
    },
  };
}
