const officialResultReviewFindUnique = jest.fn();
const officialResultReviewUpdate = jest.fn();
const marketFindUnique = jest.fn();
const canonicalEventFindUnique = jest.fn();
const canonicalEventCreate = jest.fn();
const operatorAuditEventCreate = jest.fn();
const resolveOrderbookMarket = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    officialResultReview: {
      findUnique: (...args: unknown[]) => officialResultReviewFindUnique(...args),
      update: (...args: unknown[]) => officialResultReviewUpdate(...args),
    },
    market: {
      findUnique: (...args: unknown[]) => marketFindUnique(...args),
    },
    canonicalEvent: {
      findUnique: (...args: unknown[]) => canonicalEventFindUnique(...args),
      create: (...args: unknown[]) => canonicalEventCreate(...args),
    },
    operatorAuditEvent: {
      create: (...args: unknown[]) => operatorAuditEventCreate(...args),
    },
  },
}));

jest.mock("@/server/services/settlement", () => ({
  resolveOrderbookMarket: (...args: unknown[]) => resolveOrderbookMarket(...args),
}));

import {
  executeLocalLiveRuntimeSettlementReview,
  requestLocalLiveRuntimeSettlementExecutionDryRun,
} from "@/server/services/liveRuntimeSettlementExecution";

const baseReview = {
  id: "review-1",
  reviewKey: "odds-api-single-soccer-test:market-1:result-digest",
  eventSlug: "odds-api-single-soccer-test",
  eventId: "event-1",
  marketId: "market-1",
  outcomeId: "outcome-1",
  providerSource: "the-odds-api",
  providerEventId: "provider-event-1",
  resultStatus: "final",
  homeScore: 2,
  awayScore: 1,
  advanceTeam: null,
  trustedResultDigest: "trusted-digest",
  resultDigest: "result-digest",
  settlementPreflightCanonicalId: 10n,
  settlementApprovalCanonicalId: 11n,
  settlementExecutedCanonicalId: null,
  approvalStatus: "approved",
  executionDecision: "ready_for_exact_confirmation_execution",
  executionEligibleNow: true,
  confirmationRequiredKnown: true,
  exactConfirmationStored: false,
  activeMarketExecutionAttempted: false,
  providerQuotaUsed: false,
  reviewSnapshot: { existing: true },
};

const closedMarket = {
  id: "market-1",
  slug: "spain-france-total-25",
  title: "Spain vs. France: Total Goals 2.5",
  status: "CLOSED",
  settlementStatus: "closed",
  resolvedOutcomeId: null,
  event: {
    id: "event-1",
    slug: "odds-api-single-soccer-test",
    title: "Spain vs. France",
    status: "ACTIVE",
    liveStatus: "final",
  },
};

const stringifyForSecretCheck = (value: unknown) =>
  JSON.stringify(value, (_key, item) => (typeof item === "bigint" ? item.toString() : item));

describe("live runtime settlement execution dry-run service", () => {
  beforeEach(() => {
    officialResultReviewFindUnique.mockReset();
    officialResultReviewUpdate.mockReset();
    marketFindUnique.mockReset();
    canonicalEventFindUnique.mockReset();
    canonicalEventCreate.mockReset();
    operatorAuditEventCreate.mockReset();
    resolveOrderbookMarket.mockReset();
    officialResultReviewFindUnique.mockResolvedValue(baseReview);
    marketFindUnique.mockResolvedValue(closedMarket);
    canonicalEventFindUnique.mockResolvedValue({
      id: 11n,
      eventType: "settlement.trusted_result.approved",
      userId: "approver-1",
      payload: {
        approvedByUserId: "approver-1",
        confirm: "SETTLE_FROM_RESULT:market-1:outcome-1:result-digest",
      },
    });
    canonicalEventCreate.mockResolvedValue({ id: 12n });
    operatorAuditEventCreate.mockResolvedValue({ id: "operator-audit-2" });
    officialResultReviewUpdate.mockResolvedValue({});
    resolveOrderbookMarket.mockResolvedValue({
      marketId: "market-1",
      winningOutcomeId: "outcome-1",
      totalPoolPayout: "10",
      totalWinningShares: "10",
      payouts: [{ userId: "user-1", amountPaid: "10" }],
      collateralDebitedUSDC: "10",
    });
  });

  test("records a durable dry-run execution request without settlement mutation", async () => {
    const result = await requestLocalLiveRuntimeSettlementExecutionDryRun({
      reviewId: "review-1",
      operator: {
        id: "admin-1",
        email: "admin@holiwyn.local",
        username: "admin",
        roles: ["admin", "settlement_operator"],
      },
    });

    expect(result).toMatchObject({
      status: "dry_run_ready",
      httpStatus: 200,
      providerQuotaUsed: false,
      mutatesSettlement: false,
      exactConfirmationExposed: false,
      exactConfirmationStored: false,
      activeMarketExecutionAttempted: false,
      executionRequestEvidence: {
        canonicalExecutionRequestEventId: "12",
        operatorAuditEventId: "operator-audit-2",
        eventType: "settlement.trusted_result.execution.dry_run_requested",
        dryRunOnly: true,
        operatorUserId: "admin-1",
        durableIdentityRecorded: true,
        twoPersonOrAdminPolicy: {
          checked: true,
          mode: "admin_override_or_different_operator",
          adminOverride: true,
          approvedByUserId: "approver-1",
          requestedByUserId: "admin-1",
          differentOperator: true,
        },
      },
    });
    expect(canonicalEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        stream: "MARKET",
        topicKey: "market:market-1",
        eventType: "settlement.trusted_result.execution.dry_run_requested",
        marketId: "market-1",
        outcomeId: "outcome-1",
        userId: "admin-1",
        payload: expect.objectContaining({
          dryRunOnly: true,
          mutatesSettlement: false,
          exactConfirmationExposed: false,
          exactConfirmationStored: false,
          providerQuotaUsed: false,
          activeMarketExecutionAttempted: false,
          twoPersonOrAdminPolicy: expect.objectContaining({
            checked: true,
            adminOverride: true,
            approvedByUserId: "approver-1",
          }),
        }),
      }),
    });
    expect(operatorAuditEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        operatorUserId: "admin-1",
        reviewId: "review-1",
        action: "settlement_execution_dry_run_requested",
        roleSnapshot: ["admin", "settlement_operator"],
        canonicalEventId: 12n,
        metadata: expect.objectContaining({
          dryRunOnly: true,
          mutatesSettlement: false,
          exactConfirmationExposed: false,
          exactConfirmationStored: false,
          providerQuotaUsed: false,
          activeMarketExecutionAttempted: false,
        }),
      }),
    });
    expect(officialResultReviewUpdate).toHaveBeenCalledWith({
      where: { id: "review-1" },
      data: {
        reviewSnapshot: expect.objectContaining({
          existing: true,
          operatorExecutionDryRun: expect.objectContaining({
            requestedByUserId: "admin-1",
            canonicalExecutionRequestEventId: "12",
            operatorAuditEventId: "operator-audit-2",
            twoPersonOrAdminPolicy: expect.objectContaining({
              checked: true,
              adminOverride: true,
            }),
            mutatesSettlement: false,
            exactConfirmationExposed: false,
            exactConfirmationStored: false,
            providerQuotaUsed: false,
            activeMarketExecutionAttempted: false,
          }),
        }),
      },
    });
    expect(JSON.stringify(result)).not.toContain("SETTLE_FROM_RESULT:");
    expect(JSON.stringify(result)).not.toContain("THE_ODDS_API_KEY");
  });

  test("blocks non-admin dry-run when the same operator approved and requests execution", async () => {
    canonicalEventFindUnique.mockResolvedValue({
      id: 11n,
      eventType: "settlement.trusted_result.approved",
      userId: "operator-1",
      payload: {
        approvedByUserId: "operator-1",
      },
    });

    const result = await requestLocalLiveRuntimeSettlementExecutionDryRun({
      reviewId: "review-1",
      operator: {
        id: "operator-1",
        roles: ["settlement_operator"],
      },
    });

    expect(result).toMatchObject({
      status: "execution_blocked",
      httpStatus: 409,
      blockerKeys: ["two_person_or_admin_policy_not_satisfied"],
      mutatesSettlement: false,
      activeMarketExecutionAttempted: false,
    });
    expect(canonicalEventCreate).not.toHaveBeenCalled();
    expect(operatorAuditEventCreate).not.toHaveBeenCalled();
    expect(officialResultReviewUpdate).not.toHaveBeenCalled();
  });

  test("blocks dry-run when the market is not closed", async () => {
    marketFindUnique.mockResolvedValue({ ...closedMarket, status: "LIVE" });

    const result = await requestLocalLiveRuntimeSettlementExecutionDryRun({
      reviewId: "review-1",
      operator: { id: "admin-1", roles: ["admin"] },
    });

    expect(result).toMatchObject({
      status: "execution_blocked",
      httpStatus: 409,
      blockerKeys: ["market_not_closed"],
      mutatesSettlement: false,
      activeMarketExecutionAttempted: false,
    });
    expect(canonicalEventCreate).not.toHaveBeenCalled();
    expect(operatorAuditEventCreate).not.toHaveBeenCalled();
    expect(officialResultReviewUpdate).not.toHaveBeenCalled();
  });

  test("blocks dry-run when approval evidence is missing", async () => {
    officialResultReviewFindUnique.mockResolvedValue({
      ...baseReview,
      settlementApprovalCanonicalId: null,
    });

    const result = await requestLocalLiveRuntimeSettlementExecutionDryRun({
      reviewId: "review-1",
      operator: { id: "admin-1", roles: ["admin"] },
    });

    expect(result).toMatchObject({
      status: "execution_blocked",
      blockerKeys: ["approval_audit_missing"],
      providerQuotaUsed: false,
      mutatesSettlement: false,
    });
    expect(canonicalEventCreate).not.toHaveBeenCalled();
    expect(operatorAuditEventCreate).not.toHaveBeenCalled();
  });

  test("rejects already executed reviews", async () => {
    officialResultReviewFindUnique.mockResolvedValue({
      ...baseReview,
      settlementExecutedCanonicalId: 44n,
    });

    const result = await requestLocalLiveRuntimeSettlementExecutionDryRun({
      reviewId: "review-1",
      operator: { id: "admin-1", roles: ["admin"] },
    });

    expect(result).toMatchObject({
      status: "already_executed",
      httpStatus: 409,
      blockerKeys: ["already_executed"],
    });
    expect(marketFindUnique).not.toHaveBeenCalled();
    expect(canonicalEventCreate).not.toHaveBeenCalled();
    expect(operatorAuditEventCreate).not.toHaveBeenCalled();
  });

  test("executes a closed approved review with exact confirmation without exposing the phrase", async () => {
    canonicalEventCreate.mockResolvedValue({ id: 44n });
    operatorAuditEventCreate.mockResolvedValue({ id: "operator-audit-exec" });

    const result = await executeLocalLiveRuntimeSettlementReview({
      reviewId: "review-1",
      operator: {
        id: "admin-1",
        email: "admin@holiwyn.local",
        username: "admin",
        roles: ["admin", "settlement_operator"],
      },
      exactConfirmation: "SETTLE_FROM_RESULT:market-1:outcome-1:result-digest",
    });

    expect(resolveOrderbookMarket).toHaveBeenCalledWith({
      marketId: "market-1",
      winningOutcomeId: "outcome-1",
      actorUserId: "admin-1",
    });
    expect(result).toMatchObject({
      status: "executed",
      httpStatus: 200,
      providerQuotaUsed: false,
      mutatesSettlement: true,
      exactConfirmationExposed: false,
      exactConfirmationStored: false,
      activeMarketExecutionAttempted: true,
      executionEvidence: {
        canonicalExecutionEventId: "44",
        operatorAuditEventId: "operator-audit-exec",
        eventType: "settlement.trusted_result.executed",
        operatorUserId: "admin-1",
        durableIdentityRecorded: true,
      },
      settlement: {
        marketId: "market-1",
        winningOutcomeId: "outcome-1",
        payoutCount: 1,
      },
    });
    expect(canonicalEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventType: "settlement.trusted_result.executed",
        marketId: "market-1",
        outcomeId: "outcome-1",
        userId: "admin-1",
        payload: expect.objectContaining({
          mutatesSettlement: true,
          exactConfirmationMatched: true,
          exactConfirmationExposed: false,
          exactConfirmationStored: false,
          activeMarketExecutionAttempted: true,
        }),
      }),
    });
    expect(operatorAuditEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "settlement_execution_completed",
        canonicalEventId: 44n,
        metadata: expect.objectContaining({
          mutatesSettlement: true,
          exactConfirmationMatched: true,
          exactConfirmationExposed: false,
          exactConfirmationStored: false,
        }),
      }),
    });
    expect(officialResultReviewUpdate).toHaveBeenCalledWith({
      where: { id: "review-1" },
      data: expect.objectContaining({
        settlementExecutedCanonicalId: 44n,
        executionDecision: "already_executed",
        executionEligibleNow: false,
        exactConfirmationStored: false,
        activeMarketExecutionAttempted: true,
      }),
    });
    expect(JSON.stringify(result)).not.toContain("SETTLE_FROM_RESULT:");
    expect(stringifyForSecretCheck(canonicalEventCreate.mock.calls)).not.toContain("SETTLE_FROM_RESULT:");
    expect(stringifyForSecretCheck(operatorAuditEventCreate.mock.calls)).not.toContain("SETTLE_FROM_RESULT:");
  });

  test("blocks execution when exact confirmation is missing or mismatched", async () => {
    const missing = await executeLocalLiveRuntimeSettlementReview({
      reviewId: "review-1",
      operator: { id: "admin-1", roles: ["admin"] },
      exactConfirmation: null,
    });
    expect(missing).toMatchObject({
      status: "execution_blocked",
      blockerKeys: ["exact_confirmation_missing"],
      mutatesSettlement: false,
      activeMarketExecutionAttempted: false,
    });

    const mismatched = await executeLocalLiveRuntimeSettlementReview({
      reviewId: "review-1",
      operator: { id: "admin-1", roles: ["admin"] },
      exactConfirmation: "wrong-confirmation",
    });
    expect(mismatched).toMatchObject({
      status: "execution_blocked",
      blockerKeys: ["exact_confirmation_mismatch"],
      mutatesSettlement: false,
      activeMarketExecutionAttempted: false,
    });
    expect(resolveOrderbookMarket).not.toHaveBeenCalled();
    expect(canonicalEventCreate).not.toHaveBeenCalled();
    expect(operatorAuditEventCreate).not.toHaveBeenCalled();
  });

  test("blocks execution when approval does not carry exact confirmation evidence", async () => {
    canonicalEventFindUnique.mockResolvedValue({
      id: 11n,
      eventType: "settlement.trusted_result.approved",
      userId: "approver-1",
      payload: {
        approvedByUserId: "approver-1",
      },
    });

    const result = await executeLocalLiveRuntimeSettlementReview({
      reviewId: "review-1",
      operator: { id: "admin-1", roles: ["admin"] },
      exactConfirmation: "SETTLE_FROM_RESULT:market-1:outcome-1:result-digest",
    });

    expect(result).toMatchObject({
      status: "execution_blocked",
      blockerKeys: ["exact_confirmation_not_available_for_route"],
      mutatesSettlement: false,
    });
    expect(resolveOrderbookMarket).not.toHaveBeenCalled();
    expect(canonicalEventCreate).not.toHaveBeenCalled();
  });
});
