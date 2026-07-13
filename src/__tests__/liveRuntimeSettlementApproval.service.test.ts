const officialResultReviewFindUnique = jest.fn();
const officialResultReviewUpdate = jest.fn();
const marketFindUnique = jest.fn();
const canonicalEventFindUnique = jest.fn();
const canonicalEventCreate = jest.fn();
const operatorAuditEventCreate = jest.fn();

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

import { approveLocalLiveRuntimeSettlementReview } from "@/server/services/liveRuntimeSettlementApproval";

const review = {
  id: "review-1",
  reviewKey: "odds-api-single-soccer-test:market-1:result-digest",
  eventSlug: "odds-api-single-soccer-test",
  marketId: "market-1",
  outcomeId: "outcome-1",
  trustedResultDigest: "trusted-digest",
  resultDigest: "result-digest",
  settlementPreflightCanonicalId: 10n,
  settlementApprovalCanonicalId: null,
  settlementExecutedCanonicalId: null,
  approvalStatus: "missing",
  executionDecision: "wait_for_operator_approval",
  executionEligibleNow: false,
  confirmationRequiredKnown: true,
  exactConfirmationStored: false,
  activeMarketExecutionAttempted: false,
  providerQuotaUsed: false,
  reviewSnapshot: { status: "ready" },
};

const market = {
  id: "market-1",
  title: "Spain vs. France: Total Goals 2.5",
  status: "LIVE",
  settlementStatus: null,
  resolvedOutcomeId: null,
  event: {
    id: "event-1",
    slug: "odds-api-single-soccer-test",
    title: "Spain vs. France",
    status: "ACTIVE",
  },
};

const approvalEvent = {
  id: 21n,
  eventType: "settlement.trusted_result.approved",
  userId: "admin-user-1",
  payload: {
    resultDigest: "result-digest",
    currentMarketStatus: "LIVE",
    exactConfirmationStored: false,
    exactConfirmationExposed: false,
    providerQuotaUsed: false,
    activeTesterSettlementExecution: false,
  },
};

describe("live runtime settlement approval service", () => {
  beforeEach(() => {
    officialResultReviewFindUnique.mockReset();
    officialResultReviewUpdate.mockReset();
    marketFindUnique.mockReset();
    canonicalEventFindUnique.mockReset();
    canonicalEventCreate.mockReset();
    operatorAuditEventCreate.mockReset();

    officialResultReviewFindUnique.mockResolvedValue(review);
    marketFindUnique.mockResolvedValue(market);
    canonicalEventCreate.mockResolvedValue(approvalEvent);
    operatorAuditEventCreate.mockResolvedValue({ id: "operator-audit-1" });
    officialResultReviewUpdate.mockImplementation(({ data }) =>
      Promise.resolve({
        ...review,
        ...data,
        settlementApprovalCanonicalId: 21n,
      }),
    );
  });

  test("records authenticated approval without exposing confirmation or executing settlement", async () => {
    const result = await approveLocalLiveRuntimeSettlementReview({
      reviewId: "review-1",
      operator: {
        id: "admin-user-1",
        email: "admin@example.test",
        username: "admin",
        roles: ["admin", "settlement_operator"],
      },
    });

    expect(result.status).toBe("ready");
    expect(result.providerQuotaUsed).toBe(false);
    expect(result.exactConfirmationExposed).toBe(false);
    expect(result.exactConfirmationStored).toBe(false);
    expect(result.activeMarketExecutionAttempted).toBe(false);
    expect(result.review).toMatchObject({
      approvalStatus: "approved",
      executionDecision: "wait_for_or_apply_market_close_before_execution",
      executionEligibleNow: false,
      settlementApprovalCanonicalId: "21",
    });
    expect(result.operator).toMatchObject({
      id: "admin-user-1",
      durableIdentityRecorded: true,
      durableAuditEventRecorded: true,
    });
    expect(canonicalEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: "settlement.trusted_result.approved",
          marketId: "market-1",
          outcomeId: "outcome-1",
          userId: "admin-user-1",
          payload: expect.objectContaining({
            approvedByUserId: "admin-user-1",
            roleSnapshot: ["admin", "settlement_operator"],
            exactConfirmationStored: false,
            exactConfirmationExposed: false,
            providerQuotaUsed: false,
            activeTesterSettlementExecution: false,
          }),
        }),
      }),
    );
    expect(operatorAuditEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        operatorUserId: "admin-user-1",
        reviewId: "review-1",
        action: "settlement_approval_recorded",
        roleSnapshot: ["admin", "settlement_operator"],
        canonicalEventId: 21n,
        metadata: expect.objectContaining({
          mutatesSettlement: false,
          exactConfirmationStored: false,
          exactConfirmationExposed: false,
          providerQuotaUsed: false,
          activeMarketExecutionAttempted: false,
        }),
      }),
    });
    expect(officialResultReviewUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "review-1" },
        data: expect.objectContaining({
          approvalStatus: "approved",
          settlementApprovalCanonicalId: 21n,
          executionEligibleNow: false,
          exactConfirmationStored: false,
          activeMarketExecutionAttempted: false,
          providerQuotaUsed: false,
        }),
      }),
    );
    expect(JSON.stringify(result)).not.toContain("SETTLE_FROM_RESULT:");
  });

  test("is idempotent when approval evidence already exists", async () => {
    officialResultReviewFindUnique.mockResolvedValue({
      ...review,
      settlementApprovalCanonicalId: 21n,
      approvalStatus: "approved",
    });
    canonicalEventFindUnique.mockResolvedValue(approvalEvent);

    const result = await approveLocalLiveRuntimeSettlementReview({
      reviewId: "review-1",
      operator: {
        id: "admin-user-1",
        email: "admin@example.test",
        username: "admin",
        roles: ["admin", "settlement_operator"],
      },
    });

    expect(result.status).toBe("ready");
    expect(result.idempotent).toBe(true);
    expect(canonicalEventCreate).not.toHaveBeenCalled();
    expect(operatorAuditEventCreate).not.toHaveBeenCalled();
    expect(canonicalEventFindUnique).toHaveBeenCalledWith({ where: { id: 21n } });
  });

  test("rejects already executed reviews", async () => {
    officialResultReviewFindUnique.mockResolvedValue({
      ...review,
      settlementExecutedCanonicalId: 33n,
    });

    const result = await approveLocalLiveRuntimeSettlementReview({
      reviewId: "review-1",
      operator: {
        id: "admin-user-1",
        email: "admin@example.test",
        username: "admin",
        roles: ["admin"],
      },
    });

    expect(result.status).toBe("conflict");
    expect(result.httpStatus).toBe(409);
    expect(canonicalEventCreate).not.toHaveBeenCalled();
    expect(operatorAuditEventCreate).not.toHaveBeenCalled();
  });
});
