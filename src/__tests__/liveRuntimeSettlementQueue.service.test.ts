const officialResultReviewFindMany = jest.fn();
const marketFindMany = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    officialResultReview: {
      findMany: (...args: unknown[]) => officialResultReviewFindMany(...args),
    },
    market: {
      findMany: (...args: unknown[]) => marketFindMany(...args),
    },
  },
}));

import { getLocalLiveRuntimeSettlementQueue } from "@/server/services/liveRuntimeSettlementQueue";

describe("live runtime settlement queue service", () => {
  beforeEach(() => {
    officialResultReviewFindMany.mockReset();
    marketFindMany.mockReset();
    officialResultReviewFindMany.mockResolvedValue([
      {
        id: "review-1",
        reviewKey: "odds-api-single-soccer-test:market-1:result-digest",
        eventSlug: "odds-api-single-soccer-test",
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
        executionDecision: "wait_for_or_apply_market_close_before_execution",
        executionEligibleNow: false,
        confirmationRequiredKnown: true,
        exactConfirmationStored: false,
        activeMarketExecutionAttempted: false,
        providerQuotaUsed: false,
        updatedAt: new Date("2026-07-12T12:05:00Z"),
      },
    ]);
    marketFindMany.mockResolvedValue([
      {
        id: "market-1",
        slug: "spain-france-total-25",
        title: "Spain vs. France: Total Goals 2.5",
        status: "LIVE",
        settlementStatus: null,
        resolvedOutcomeId: null,
        event: {
          id: "event-1",
          slug: "odds-api-single-soccer-test",
          title: "Spain vs. France",
          status: "ACTIVE",
          liveStatus: "pre_match",
          startTime: new Date("2026-07-14T19:00:00Z"),
        },
      },
    ]);
  });

  test("returns redacted pending settlement queue from durable review rows", async () => {
    const result = await getLocalLiveRuntimeSettlementQueue();

    expect(result.status).toBe("ready");
    expect(result.providerQuotaUsed).toBe(false);
    expect(result.queue).toMatchObject({
      itemCount: 1,
      pendingCount: 1,
      executableNowCount: 0,
      approvedWaitingForCloseCount: 1,
    });
    expect(result.queue.items[0]).toMatchObject({
      reviewKey: "odds-api-single-soccer-test:market-1:result-digest",
      approvalStatus: "approved",
      exactConfirmationStored: false,
      exactConfirmationRedacted: true,
      activeMarketExecutionAttempted: false,
      providerQuotaUsed: false,
      hasPreflightAudit: true,
      hasApprovalAudit: true,
      hasExecutionAudit: false,
      nextSafeAction: "wait_for_or_apply_market_close_before_execution",
      operatorAction: {
        label: "wait_for_market_close",
        blockingReason: "market_status_LIVE",
        nextCommand: "npm run mobile:one-event-settlement-preflight",
        exactConfirmationExposed: false,
        providerQuotaRequired: false,
        activeExecutionRequiresClosedMarket: true,
      },
      market: {
        status: "LIVE",
        event: { slug: "odds-api-single-soccer-test" },
      },
    });
    expect(result.runtimeTruth).toMatchObject({
      readOnlyRoute: true,
      devOnlyRoute: true,
      providerQuotaUsed: false,
      exactConfirmationStringsExposed: false,
      exactConfirmationStored: false,
      activeMarketExecutionAttempted: false,
      operatorQueueAvailable: true,
      redactedOperatorExecutionPlanAvailable: true,
    });
    expect(JSON.stringify(result)).not.toContain("SETTLE_FROM_RESULT:");
    expect(officialResultReviewFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),
    );
    expect(marketFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ["market-1"] } },
      }),
    );
  });

  test("returns needs_attention when no durable review row exists", async () => {
    officialResultReviewFindMany.mockResolvedValue([]);
    marketFindMany.mockResolvedValue([]);

    const result = await getLocalLiveRuntimeSettlementQueue();

    expect(result.status).toBe("needs_attention");
    expect(result.gaps.p0).toContain("durableReviewRowsFound");
    expect(result.queue.itemCount).toBe(0);
  });

  test("returns approved execution command only after market is closed and eligible", async () => {
    officialResultReviewFindMany.mockResolvedValue([
      {
        id: "review-2",
        reviewKey: "odds-api-single-soccer-test:market-1:result-digest",
        eventSlug: "odds-api-single-soccer-test",
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
        updatedAt: new Date("2026-07-12T12:10:00Z"),
      },
    ]);
    marketFindMany.mockResolvedValue([
      {
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
          startTime: new Date("2026-07-14T19:00:00Z"),
        },
      },
    ]);

    const result = await getLocalLiveRuntimeSettlementQueue();

    expect(result.queue.executableNowCount).toBe(1);
    expect(result.queue.items[0].operatorAction).toMatchObject({
      label: "ready_for_operator_approved_execution",
      blockingReason: null,
      providerQuotaRequired: false,
      exactConfirmationExposed: false,
    });
    expect(result.queue.items[0].operatorAction.nextCommand).toContain("--autoExecuteApproved");
    expect(JSON.stringify(result)).not.toContain("SETTLE_FROM_RESULT:");
  });
});
