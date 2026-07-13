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

const operatorActionFor = (params: {
  nextSafeAction: string;
  marketStatus: string | null;
  approvalStatus: string;
  confirmationRequiredKnown: boolean;
}) => {
  const base = {
    exactConfirmationExposed: false,
    providerQuotaRequired: false,
    activeExecutionRequiresClosedMarket: true,
    activeExecutionRequiresApproval: true,
    activeExecutionRequiresExactConfirmation: true,
  };

  if (params.nextSafeAction === "already_executed") {
    return {
      ...base,
      label: "settlement_already_executed",
      blockingReason: null,
      nextCommand: "GET /api/internal/live-runtime/settlement-queue",
      notes: ["Review the execution audit trail; no repeat execution should be attempted."],
    };
  }

  if (params.nextSafeAction === "ready_for_exact_confirmation_execution") {
    return {
      ...base,
      label: "ready_for_operator_approved_execution",
      blockingReason: null,
      nextCommand:
        "npm run mobile:one-event-result-settlement-run -- --result=docs/mobile/harness/odds-api-live-runtime/trusted-result-provider.redacted.json --approval=docs/mobile/harness/odds-api-live-runtime/trusted-result-audit-approved.redacted.json --autoExecuteApproved --writeAuditEvent --allowTrustedLocalFixture",
      notes: [
        "Runs the approved local scheduler path; it still matches event, market, outcome, digest, and exact confirmation internally.",
        "The exact confirmation phrase remains redacted from this API.",
      ],
    };
  }

  if (params.nextSafeAction === "wait_for_or_apply_market_close_before_execution") {
    return {
      ...base,
      label: "wait_for_market_close",
      blockingReason: `market_status_${params.marketStatus ?? "unknown"}`,
      nextCommand: "npm run mobile:one-event-settlement-preflight",
      notes: [
        "Do not execute while the market is not CLOSED.",
        "After lifecycle close, rerun preflight and settlement queue before using the approved execution command.",
      ],
    };
  }

  if (params.nextSafeAction === "wait_for_operator_approval") {
    return {
      ...base,
      label: "wait_for_operator_approval",
      blockingReason: `approval_status_${params.approvalStatus}`,
      nextCommand: "npm run mobile:one-event-settlement-approval-audit-event-proof",
      notes: ["Approval evidence must match event, market, outcome, result digest, and confirmation phrase."],
    };
  }

  if (params.nextSafeAction === "rerun_settlement_preflight_for_exact_confirmation") {
    return {
      ...base,
      label: "rerun_preflight_for_confirmation",
      blockingReason: params.confirmationRequiredKnown ? null : "exact_confirmation_unknown",
      nextCommand: "npm run mobile:one-event-settlement-preflight",
      notes: ["Preflight regenerates the result digest and exact-confirmation requirement without executing settlement."],
    };
  }

  return {
    ...base,
    label: "operator_review_required",
    blockingReason: params.nextSafeAction,
    nextCommand: "npm run mobile:one-event-active-settlement-readiness",
    notes: ["Use the active settlement readiness report before attempting any execution path."],
  };
};

const operatorExecutionPlanFor = (params: {
  nextSafeAction: string;
  marketStatus: string | null;
  approvalStatus: string;
  hasPreflightAudit: boolean;
  hasApprovalAudit: boolean;
  hasExecutionAudit: boolean;
  confirmationRequiredKnown: boolean;
}) => {
  const prerequisites = {
    marketClosed: params.marketStatus === "CLOSED",
    approvedReview: params.approvalStatus === "approved",
    preflightAuditPresent: params.hasPreflightAudit,
    approvalAuditPresent: params.hasApprovalAudit,
    executionAuditPresent: params.hasExecutionAudit,
    exactConfirmationKnownButRedacted: params.confirmationRequiredKnown,
  };
  const blockerKeys = Object.entries({
    market_not_closed: !prerequisites.marketClosed && !params.hasExecutionAudit,
    approval_not_recorded: !prerequisites.approvedReview && !params.hasExecutionAudit,
    preflight_audit_missing: !prerequisites.preflightAuditPresent && !params.hasExecutionAudit,
    approval_audit_missing: !prerequisites.approvalAuditPresent && !params.hasExecutionAudit,
    exact_confirmation_unknown: !prerequisites.exactConfirmationKnownButRedacted && !params.hasExecutionAudit,
  })
    .filter(([, blocked]) => blocked)
    .map(([key]) => key);

  return {
    version: 1,
    mode: params.hasExecutionAudit
      ? "already_executed"
      : params.nextSafeAction === "ready_for_exact_confirmation_execution"
        ? "operator_approved_execution_ready"
        : "blocked_or_review_required",
    executableNow: params.nextSafeAction === "ready_for_exact_confirmation_execution",
    dryRunFirst: true,
    providerQuotaRequired: false,
    exactConfirmationExposed: false,
    exactConfirmationStored: false,
    activeMarketExecutionAttempted: false,
    prerequisites,
    blockerKeys,
    command: {
      npmScript: "mobile:one-event-result-settlement-run",
      args:
        params.nextSafeAction === "ready_for_exact_confirmation_execution"
          ? [
              "--result=docs/mobile/harness/odds-api-live-runtime/trusted-result-provider.redacted.json",
              "--approval=docs/mobile/harness/odds-api-live-runtime/trusted-result-audit-approved.redacted.json",
              "--autoExecuteApproved",
              "--writeAuditEvent",
              "--allowTrustedLocalFixture",
            ]
          : ["--dry-run"],
      commandRedacted:
        params.nextSafeAction === "ready_for_exact_confirmation_execution"
          ? "npm run mobile:one-event-result-settlement-run -- --result=<trusted-result-redacted-json> --approval=<approval-redacted-json> --autoExecuteApproved --writeAuditEvent --allowTrustedLocalFixture"
          : "npm run mobile:one-event-settlement-preflight",
      exactConfirmationArgumentRedacted: true,
    },
  };
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
    const operatorAction = operatorActionFor({
      nextSafeAction,
      marketStatus: market?.status ?? null,
      approvalStatus: review.approvalStatus,
      confirmationRequiredKnown: review.confirmationRequiredKnown,
    });
    const hasPreflightAudit = review.settlementPreflightCanonicalId != null;
    const hasApprovalAudit = review.settlementApprovalCanonicalId != null;
    const hasExecutionAudit = review.settlementExecutedCanonicalId != null;
    const operatorExecutionPlan = operatorExecutionPlanFor({
      nextSafeAction,
      marketStatus: market?.status ?? null,
      approvalStatus: review.approvalStatus,
      hasPreflightAudit,
      hasApprovalAudit,
      hasExecutionAudit,
      confirmationRequiredKnown: review.confirmationRequiredKnown,
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
      hasPreflightAudit,
      hasApprovalAudit,
      hasExecutionAudit,
      approvalEvidence: {
        status: review.approvalStatus,
        source: "OfficialResultReview+CanonicalEvent",
        durableReviewRowAvailable: true,
        canonicalApprovalEventAvailable: review.settlementApprovalCanonicalId != null,
        canonicalApprovalEventId: review.settlementApprovalCanonicalId?.toString() ?? null,
        resultDigestAvailable: typeof review.resultDigest === "string" && review.resultDigest.length > 0,
        exactConfirmationStored: review.exactConfirmationStored,
        exactConfirmationRedacted: true,
        providerQuotaUsed: review.providerQuotaUsed,
      },
      executionEvidence: {
        status: alreadyExecuted ? "executed" : "not_executed",
        source: "OfficialResultReview+CanonicalEvent",
        durableReviewRowAvailable: true,
        canonicalExecutionEventAvailable: review.settlementExecutedCanonicalId != null,
        canonicalExecutionEventId: review.settlementExecutedCanonicalId?.toString() ?? null,
        resultDigestAvailable: typeof review.resultDigest === "string" && review.resultDigest.length > 0,
        exactConfirmationStored: review.exactConfirmationStored,
        exactConfirmationRedacted: true,
        providerQuotaUsed: review.providerQuotaUsed,
        activeMarketExecutionAttempted: review.activeMarketExecutionAttempted,
      },
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
      operatorAction,
      operatorExecutionPlan,
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
    canonicalApprovalEvidenceForApprovedReviews: items
      .filter((item) => item.approvalStatus === "approved")
      .every((item) => item.approvalEvidence.canonicalApprovalEventAvailable === true),
    canonicalExecutionEvidenceForExecutedReviews: items
      .filter((item) => item.nextSafeAction === "already_executed" || item.hasExecutionAudit)
      .every((item) => item.executionEvidence.canonicalExecutionEventAvailable === true),
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
      redactedOperatorExecutionPlanAvailable: items.every(
        (item) => item.operatorAction.exactConfirmationExposed === false && item.operatorAction.providerQuotaRequired === false,
      ),
      structuredOperatorExecutionPlanAvailable: items.every(
        (item) =>
          item.operatorExecutionPlan.version === 1 &&
          item.operatorExecutionPlan.exactConfirmationExposed === false &&
          item.operatorExecutionPlan.exactConfirmationStored === false &&
          item.operatorExecutionPlan.providerQuotaRequired === false,
      ),
      durableApprovalEvidenceAvailable: items.some(
        (item) => item.approvalEvidence.status === "approved" && item.approvalEvidence.canonicalApprovalEventAvailable,
      ),
      durableExecutionEvidenceAvailable: items.some(
        (item) => item.executionEvidence.status === "executed" && item.executionEvidence.canonicalExecutionEventAvailable,
      ),
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
