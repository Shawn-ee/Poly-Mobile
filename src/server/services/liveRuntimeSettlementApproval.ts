import { CanonicalEventStream } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

type Operator = {
  id: string;
  email: string | null;
  username: string | null;
  roles: string[];
};

const toSerializable = (value: unknown): unknown => {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toSerializable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, toSerializable(item)]),
    );
  }
  return value;
};

const decideAfterApproval = (marketStatus: string | null) =>
  marketStatus === "CLOSED"
    ? "rerun_settlement_preflight_for_exact_confirmation"
    : "wait_for_or_apply_market_close_before_execution";

export async function approveLocalLiveRuntimeSettlementReview(params: {
  reviewId: string;
  operator: Operator;
}) {
  const review = await prisma.officialResultReview.findUnique({
    where: { id: params.reviewId },
  });

  if (!review) {
    return {
      status: "not_found" as const,
      httpStatus: 404,
      error: "Settlement review not found.",
    };
  }

  if (review.settlementExecutedCanonicalId != null) {
    return {
      status: "conflict" as const,
      httpStatus: 409,
      error: "Settlement review is already executed.",
      reviewId: review.id,
    };
  }

  if (!review.marketId || !review.outcomeId || !review.resultDigest || !review.settlementPreflightCanonicalId) {
    return {
      status: "needs_attention" as const,
      httpStatus: 409,
      error: "Settlement review is missing preflight, market, outcome, or result digest evidence.",
      reviewId: review.id,
    };
  }

  const market = await prisma.market.findUnique({
    where: { id: review.marketId },
    select: {
      id: true,
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
        },
      },
    },
  });

  if (!market) {
    return {
      status: "needs_attention" as const,
      httpStatus: 409,
      error: "Settlement review market is missing.",
      reviewId: review.id,
    };
  }

  const existingApprovalId = review.settlementApprovalCanonicalId;
  let approvalEvent = existingApprovalId
    ? await prisma.canonicalEvent.findUnique({ where: { id: existingApprovalId } })
    : null;
  if (!approvalEvent) {
    approvalEvent = await prisma.canonicalEvent.create({
      data: {
        stream: CanonicalEventStream.MARKET,
        topicKey: `market:${review.marketId}`,
        eventType: "settlement.trusted_result.approved",
        marketId: review.marketId,
        outcomeId: review.outcomeId,
        userId: params.operator.id,
        payload: {
          eventSlug: review.eventSlug,
          eventTitle: market.event?.title ?? null,
          reviewId: review.id,
          reviewKey: review.reviewKey,
          marketId: review.marketId,
          marketTitle: market.title,
          outcomeId: review.outcomeId,
          resultDigest: review.resultDigest,
          trustedResultDigest: review.trustedResultDigest,
          approvedByUserId: params.operator.id,
          approvedByEmail: params.operator.email,
          approvedByUsername: params.operator.username,
          roleSnapshot: params.operator.roles,
          approvedAt: new Date().toISOString(),
          source: "internal-operator-session",
          executionRequiresMarketStatus: "CLOSED",
          currentMarketStatus: market.status,
          exactConfirmationStored: false,
          exactConfirmationExposed: false,
          providerQuotaUsed: false,
          activeTesterSettlementExecution: false,
        },
      },
    });
  }

  const operatorAuditEvent = existingApprovalId
    ? null
    : await prisma.operatorAuditEvent.create({
        data: {
          operatorUserId: params.operator.id,
          reviewId: review.id,
          action: "settlement_approval_recorded",
          roleSnapshot: params.operator.roles,
          requestId: randomUUID(),
          canonicalEventId: approvalEvent.id,
          metadata: {
            eventSlug: review.eventSlug,
            marketId: review.marketId,
            outcomeId: review.outcomeId,
            resultDigest: review.resultDigest,
            trustedResultDigest: review.trustedResultDigest,
            approvalStatusBefore: review.approvalStatus,
            approvalStatusAfter: "approved",
            source: "internal-operator-session",
            mutatesSettlement: false,
            exactConfirmationStored: false,
            exactConfirmationExposed: false,
            providerQuotaUsed: false,
            activeMarketExecutionAttempted: false,
          },
        },
      });

  const updated = await prisma.officialResultReview.update({
    where: { id: review.id },
    data: {
      approvalStatus: "approved",
      settlementApprovalCanonicalId: approvalEvent.id,
      executionDecision: decideAfterApproval(market.status),
      executionEligibleNow: false,
      exactConfirmationStored: false,
      activeMarketExecutionAttempted: false,
      providerQuotaUsed: false,
      reviewSnapshot: {
        ...(typeof review.reviewSnapshot === "object" && review.reviewSnapshot ? review.reviewSnapshot : {}),
        operatorApproval: {
          status: existingApprovalId && approvalEvent.id === existingApprovalId ? "already_approved" : "approved",
          canonicalApprovalEventId: approvalEvent.id.toString(),
          operatorAuditEventId: operatorAuditEvent?.id ?? null,
          approvedByUserId: params.operator.id,
          roleSnapshot: params.operator.roles,
          approvedAt:
            typeof (approvalEvent.payload as Record<string, unknown>)?.approvedAt === "string"
              ? (approvalEvent.payload as Record<string, string>).approvedAt
              : new Date().toISOString(),
          exactConfirmationStored: false,
          providerQuotaUsed: false,
        },
      },
    },
  });

  return {
    status: "ready" as const,
    httpStatus: 200,
    providerQuotaUsed: false,
    mutatesSettlement: false,
    exactConfirmationExposed: false,
    exactConfirmationStored: false,
    activeMarketExecutionAttempted: false,
    idempotent: existingApprovalId != null && approvalEvent.id === existingApprovalId,
    review: {
      id: updated.id,
      reviewKey: updated.reviewKey,
      eventSlug: updated.eventSlug,
      marketId: updated.marketId,
      outcomeId: updated.outcomeId,
      approvalStatus: updated.approvalStatus,
      executionDecision: updated.executionDecision,
      executionEligibleNow: updated.executionEligibleNow,
      confirmationRequiredKnown: updated.confirmationRequiredKnown,
      settlementApprovalCanonicalId: updated.settlementApprovalCanonicalId?.toString() ?? null,
      exactConfirmationStored: updated.exactConfirmationStored,
      activeMarketExecutionAttempted: updated.activeMarketExecutionAttempted,
      providerQuotaUsed: updated.providerQuotaUsed,
    },
    approvalEvidence: {
      canonicalApprovalEventAvailable: true,
      canonicalApprovalEventId: approvalEvent.id.toString(),
      operatorAuditEventId: operatorAuditEvent?.id ?? null,
      eventType: approvalEvent.eventType,
      userId: approvalEvent.userId,
      payload: toSerializable({
        resultDigest: (approvalEvent.payload as Record<string, unknown>)?.resultDigest,
        currentMarketStatus: (approvalEvent.payload as Record<string, unknown>)?.currentMarketStatus,
        exactConfirmationStored: (approvalEvent.payload as Record<string, unknown>)?.exactConfirmationStored,
        exactConfirmationExposed: (approvalEvent.payload as Record<string, unknown>)?.exactConfirmationExposed,
        providerQuotaUsed: (approvalEvent.payload as Record<string, unknown>)?.providerQuotaUsed,
        activeTesterSettlementExecution: (approvalEvent.payload as Record<string, unknown>)?.activeTesterSettlementExecution,
      }),
    },
    operator: {
      id: params.operator.id,
      roles: params.operator.roles,
      durableIdentityRecorded: true,
      durableAuditEventRecorded: operatorAuditEvent != null,
    },
  };
}
