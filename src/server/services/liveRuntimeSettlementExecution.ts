import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { MarketGuardError } from "@/lib/marketGuards";
import { resolveOrderbookMarket } from "@/server/services/settlement";

type Operator = {
  id: string;
  email?: string | null;
  username?: string | null;
  roles: string[];
};

type JsonObject = Record<string, unknown>;

const asSnapshotObject = (value: unknown): JsonObject =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};

const hasAdminOverride = (operator: Operator) => operator.roles.includes("admin");

const errorPayload = (error: unknown) => {
  if (error instanceof MarketGuardError) {
    return { status: error.status, message: error.message };
  }
  return { status: 500, message: error instanceof Error ? error.message : String(error) };
};

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

  const approvalEvent = review.settlementApprovalCanonicalId
    ? await prisma.canonicalEvent.findUnique({
        where: { id: review.settlementApprovalCanonicalId },
        select: {
          id: true,
          userId: true,
          eventType: true,
          payload: true,
        },
      })
    : null;

  const approvedByUserId =
    approvalEvent?.userId ??
    (approvalEvent?.payload && typeof approvalEvent.payload === "object"
      ? (approvalEvent.payload as JsonObject).approvedByUserId
      : null);
  const twoPersonOrAdminPolicy = {
    checked: true,
    mode: "admin_override_or_different_operator",
    adminOverride: hasAdminOverride(params.operator),
    approvedByUserId: typeof approvedByUserId === "string" ? approvedByUserId : null,
    requestedByUserId: params.operator.id,
    differentOperator:
      typeof approvedByUserId === "string" ? approvedByUserId !== params.operator.id : false,
  };

  const blockerKeys = Object.entries({
    market_missing: review.marketId != null && market == null,
    market_not_closed: market?.status !== "CLOSED",
    approval_not_recorded: review.approvalStatus !== "approved",
    approval_audit_missing: review.settlementApprovalCanonicalId == null || approvalEvent == null,
    preflight_audit_missing: review.settlementPreflightCanonicalId == null,
    exact_confirmation_unknown: !review.confirmationRequiredKnown,
    execution_not_eligible: !review.executionEligibleNow,
    exact_confirmation_stored: review.exactConfirmationStored,
    provider_quota_used: review.providerQuotaUsed,
    two_person_or_admin_policy_not_satisfied:
      approvalEvent != null &&
      !twoPersonOrAdminPolicy.adminOverride &&
      !twoPersonOrAdminPolicy.differentOperator,
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
        twoPersonOrAdminPolicy,
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
        twoPersonOrAdminPolicy,
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
          twoPersonOrAdminPolicy,
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
      twoPersonOrAdminPolicy,
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
      twoPersonOrAdminPolicy,
    },
  };
}

export async function executeLocalLiveRuntimeSettlementReview(params: {
  reviewId: string;
  operator: Operator;
  exactConfirmation: string | null;
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

  const approvalEvent = review.settlementApprovalCanonicalId
    ? await prisma.canonicalEvent.findUnique({
        where: { id: review.settlementApprovalCanonicalId },
        select: {
          id: true,
          userId: true,
          eventType: true,
          payload: true,
        },
      })
    : null;
  const approvalPayload = asSnapshotObject(approvalEvent?.payload);
  const approvedByUserId =
    approvalEvent?.userId ??
    (typeof approvalPayload.approvedByUserId === "string" ? approvalPayload.approvedByUserId : null);
  const approvalConfirm =
    typeof approvalPayload.confirm === "string" && approvalPayload.confirm.length > 0
      ? approvalPayload.confirm
      : null;
  const twoPersonOrAdminPolicy = {
    checked: true,
    mode: "admin_override_or_different_operator",
    adminOverride: hasAdminOverride(params.operator),
    approvedByUserId: typeof approvedByUserId === "string" ? approvedByUserId : null,
    requestedByUserId: params.operator.id,
    differentOperator:
      typeof approvedByUserId === "string" ? approvedByUserId !== params.operator.id : false,
  };

  const blockerKeys = Object.entries({
    market_id_missing: review.marketId == null,
    outcome_id_missing: review.outcomeId == null,
    market_missing: review.marketId != null && market == null,
    market_not_closed: market?.status !== "CLOSED",
    approval_not_recorded: review.approvalStatus !== "approved",
    approval_audit_missing: review.settlementApprovalCanonicalId == null || approvalEvent == null,
    preflight_audit_missing: review.settlementPreflightCanonicalId == null,
    exact_confirmation_unknown: !review.confirmationRequiredKnown,
    exact_confirmation_not_available_for_route: approvalConfirm == null,
    exact_confirmation_missing: !params.exactConfirmation,
    exact_confirmation_mismatch:
      Boolean(params.exactConfirmation) &&
      approvalConfirm != null &&
      params.exactConfirmation !== approvalConfirm,
    execution_not_eligible: !review.executionEligibleNow,
    exact_confirmation_stored: review.exactConfirmationStored,
    provider_quota_used: review.providerQuotaUsed,
    two_person_or_admin_policy_not_satisfied:
      approvalEvent != null &&
      !twoPersonOrAdminPolicy.adminOverride &&
      !twoPersonOrAdminPolicy.differentOperator,
  })
    .filter(([, value]) => value === true)
    .map(([key]) => key);

  if (blockerKeys.length > 0) {
    return blocked({
      reviewId: review.id,
      status: "execution_blocked",
      httpStatus: 409,
      blockerKeys,
      error: "Settlement execution is blocked by required safety guards.",
    });
  }

  try {
    const executedAt = new Date();
    const settlementResult = await resolveOrderbookMarket({
      marketId: review.marketId!,
      winningOutcomeId: review.outcomeId!,
      actorUserId: params.operator.id,
    });
    const executionEvent = await prisma.canonicalEvent.create({
      data: {
        stream: "MARKET",
        topicKey: `market:${review.marketId}`,
        eventType: "settlement.trusted_result.executed",
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
          twoPersonOrAdminPolicy,
          operator: {
            id: params.operator.id,
            email: params.operator.email ?? null,
            username: params.operator.username ?? null,
            roles: params.operator.roles,
          },
          executedAt: executedAt.toISOString(),
          source: "internal-operator-session",
          mutatesSettlement: true,
          exactConfirmationMatched: true,
          exactConfirmationExposed: false,
          exactConfirmationStored: false,
          providerQuotaUsed: false,
          activeMarketExecutionAttempted: true,
          settlementResult,
        },
      },
    });
    const operatorAuditEvent = await prisma.operatorAuditEvent.create({
      data: {
        operatorUserId: params.operator.id,
        reviewId: review.id,
        action: "settlement_execution_completed",
        roleSnapshot: params.operator.roles,
        requestId: randomUUID(),
        canonicalEventId: executionEvent.id,
        metadata: {
          eventSlug: review.eventSlug,
          marketId: review.marketId,
          outcomeId: review.outcomeId,
          resultDigest: review.resultDigest,
          trustedResultDigest: review.trustedResultDigest,
          approvalCanonicalEventId: review.settlementApprovalCanonicalId?.toString() ?? null,
          preflightCanonicalEventId: review.settlementPreflightCanonicalId?.toString() ?? null,
          twoPersonOrAdminPolicy,
          executedAt: executedAt.toISOString(),
          source: "internal-operator-session",
          mutatesSettlement: true,
          exactConfirmationMatched: true,
          exactConfirmationExposed: false,
          exactConfirmationStored: false,
          providerQuotaUsed: false,
          activeMarketExecutionAttempted: true,
          settlementResult,
        },
      },
    });

    await prisma.officialResultReview.update({
      where: { id: review.id },
      data: {
        settlementExecutedCanonicalId: executionEvent.id,
        executionDecision: "already_executed",
        executionEligibleNow: false,
        exactConfirmationStored: false,
        activeMarketExecutionAttempted: true,
        providerQuotaUsed: false,
        reviewSnapshot: {
          ...asSnapshotObject(review.reviewSnapshot),
          operatorExecution: {
            executedAt: executedAt.toISOString(),
            requestedByUserId: params.operator.id,
            roleSnapshot: params.operator.roles,
            canonicalExecutionEventId: executionEvent.id.toString(),
            operatorAuditEventId: operatorAuditEvent.id,
            twoPersonOrAdminPolicy,
            mutatesSettlement: true,
            exactConfirmationMatched: true,
            exactConfirmationExposed: false,
            exactConfirmationStored: false,
            providerQuotaUsed: false,
            activeMarketExecutionAttempted: true,
          },
        },
      },
    });

    return {
      status: "executed",
      httpStatus: 200,
      reviewId: review.id,
      providerQuotaUsed: false,
      mutatesSettlement: true,
      exactConfirmationExposed: false,
      exactConfirmationStored: false,
      activeMarketExecutionAttempted: true,
      executionEvidence: {
        canonicalExecutionEventId: executionEvent.id.toString(),
        operatorAuditEventId: operatorAuditEvent.id,
        eventType: "settlement.trusted_result.executed",
        operatorUserId: params.operator.id,
        durableIdentityRecorded: true,
        twoPersonOrAdminPolicy,
      },
      settlement: {
        marketId: settlementResult.marketId,
        winningOutcomeId: settlementResult.winningOutcomeId,
        totalPoolPayout: settlementResult.totalPoolPayout,
        totalWinningShares: settlementResult.totalWinningShares,
        payoutCount: settlementResult.payouts.length,
        collateralDebitedUSDC: settlementResult.collateralDebitedUSDC,
      },
    };
  } catch (error) {
    const payload = errorPayload(error);
    return blocked({
      reviewId: review.id,
      status: "execution_failed",
      httpStatus: payload.status >= 400 && payload.status < 600 ? payload.status : 500,
      blockerKeys: ["settlement_execution_failed"],
      error: payload.message,
    });
  }
}
