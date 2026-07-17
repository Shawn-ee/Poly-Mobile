const officialResultReviewFindMany = jest.fn();
const marketFindMany = jest.fn();
const eventFindUnique = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    officialResultReview: {
      findMany: (...args: unknown[]) => officialResultReviewFindMany(...args),
    },
    market: {
      findMany: (...args: unknown[]) => marketFindMany(...args),
    },
    event: {
      findUnique: (...args: unknown[]) => eventFindUnique(...args),
    },
  },
}));

import { getLocalLiveRuntimeSettlementQueue } from "@/server/services/liveRuntimeSettlementQueue";

describe("live runtime settlement queue service", () => {
  beforeEach(() => {
    officialResultReviewFindMany.mockReset();
    marketFindMany.mockReset();
    eventFindUnique.mockReset();
    eventFindUnique.mockResolvedValue({
      id: "event-1",
      slug: "odds-api-single-soccer-test",
      title: "Spain vs. France",
      status: "ACTIVE",
      liveStatus: "pre_match",
      startTime: new Date("2026-07-14T19:00:00Z"),
      externalEventId: "provider-event-1",
      markets: [{ id: "market-1", status: "LIVE", resolvedOutcomeId: null }],
    });
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
      approvalEvidence: {
        status: "approved",
        source: "OfficialResultReview+CanonicalEvent",
        durableReviewRowAvailable: true,
        canonicalApprovalEventAvailable: true,
        canonicalApprovalEventId: "11",
        resultDigestAvailable: true,
        exactConfirmationStored: false,
        exactConfirmationRedacted: true,
        providerQuotaUsed: false,
      },
      executionEvidence: {
        status: "not_executed",
        source: "OfficialResultReview+CanonicalEvent",
        durableReviewRowAvailable: true,
        canonicalExecutionEventAvailable: false,
        canonicalExecutionEventId: null,
        resultDigestAvailable: true,
        exactConfirmationStored: false,
        exactConfirmationRedacted: true,
        providerQuotaUsed: false,
        activeMarketExecutionAttempted: false,
      },
      nextSafeAction: "wait_for_or_apply_market_close_before_execution",
      operatorAction: {
        label: "wait_for_market_close",
        blockingReason: "market_status_LIVE",
        nextCommand: "npm run mobile:one-event-settlement-preflight",
        exactConfirmationExposed: false,
        providerQuotaRequired: false,
        activeExecutionRequiresClosedMarket: true,
      },
      operatorExecutionPlan: {
        version: 1,
        mode: "blocked_or_review_required",
        executableNow: false,
        providerQuotaRequired: false,
        exactConfirmationExposed: false,
        exactConfirmationStored: false,
        activeMarketExecutionAttempted: false,
        prerequisites: {
          marketClosed: false,
          approvedReview: true,
          preflightAuditPresent: true,
          approvalAuditPresent: true,
          executionAuditPresent: false,
          exactConfirmationKnownButRedacted: true,
        },
        blockerKeys: ["market_not_closed"],
        command: {
          npmScript: "mobile:one-event-result-settlement-run",
          args: ["--dry-run"],
          exactConfirmationArgumentRedacted: true,
        },
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
      structuredOperatorExecutionPlanAvailable: true,
      durableApprovalEvidenceAvailable: true,
      durableExecutionEvidenceAvailable: false,
    });
    expect(result.checks).toMatchObject({
      canonicalApprovalEvidenceForApprovedReviews: true,
      canonicalExecutionEvidenceForExecutedReviews: true,
    });
    expect(JSON.stringify(result)).not.toContain("SETTLE_FROM_RESULT:");
    expect(officialResultReviewFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { eventId: "event-1", providerEventId: "provider-event-1" },
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

  test("returns awaiting_result when the current unresolved event has no review rows", async () => {
    officialResultReviewFindMany.mockResolvedValue([]);
    marketFindMany.mockResolvedValue([]);

    const result = await getLocalLiveRuntimeSettlementQueue();

    expect(result.status).toBe("awaiting_result");
    expect(result.gaps.p0).toEqual([]);
    expect(result.queue.itemCount).toBe(0);
    expect(result.runtimeTruth).toMatchObject({
      settlementEvidenceRequired: false,
      awaitingFinalResult: true,
      operatorQueueAvailable: true,
    });
  });

  test("returns needs_attention when a closed current event has no review rows", async () => {
    eventFindUnique.mockResolvedValueOnce({
      id: "event-1",
      slug: "odds-api-single-soccer-test",
      title: "Spain vs. France",
      status: "ACTIVE",
      liveStatus: "final",
      startTime: new Date("2026-07-14T19:00:00Z"),
      externalEventId: "provider-event-1",
      markets: [{ id: "market-1", status: "CLOSED", resolvedOutcomeId: null }],
    });
    officialResultReviewFindMany.mockResolvedValue([]);
    marketFindMany.mockResolvedValue([]);

    const result = await getLocalLiveRuntimeSettlementQueue();

    expect(result.status).toBe("needs_attention");
    expect(result.gaps.p0).toContain("reviewStateKnown");
    expect(result.runtimeTruth).toMatchObject({
      settlementEvidenceRequired: true,
      awaitingFinalResult: false,
    });
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
    expect(result.queue.items[0].operatorExecutionPlan).toMatchObject({
      mode: "operator_approved_execution_ready",
      executableNow: true,
      providerQuotaRequired: false,
      exactConfirmationExposed: false,
      prerequisites: {
        marketClosed: true,
        approvedReview: true,
        preflightAuditPresent: true,
        approvalAuditPresent: true,
        executionAuditPresent: false,
        exactConfirmationKnownButRedacted: true,
      },
      blockerKeys: [],
      command: {
        npmScript: "mobile:one-event-result-settlement-run",
        args: expect.arrayContaining(["--autoExecuteApproved", "--writeAuditEvent"]),
        exactConfirmationArgumentRedacted: true,
      },
    });
    expect(JSON.stringify(result)).not.toContain("SETTLE_FROM_RESULT:");
  });

  test("returns needs_attention when an approved review lacks canonical approval evidence", async () => {
    officialResultReviewFindMany.mockResolvedValue([
      {
        id: "review-3",
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
        settlementApprovalCanonicalId: null,
        settlementExecutedCanonicalId: null,
        approvalStatus: "approved",
        executionDecision: "wait_for_or_apply_market_close_before_execution",
        executionEligibleNow: false,
        confirmationRequiredKnown: true,
        exactConfirmationStored: false,
        activeMarketExecutionAttempted: false,
        providerQuotaUsed: false,
        updatedAt: new Date("2026-07-12T12:20:00Z"),
      },
    ]);

    const result = await getLocalLiveRuntimeSettlementQueue();

    expect(result.status).toBe("needs_attention");
    expect(result.gaps.p0).toContain("canonicalApprovalEvidenceForApprovedReviews");
    expect(result.queue.items[0].approvalEvidence).toMatchObject({
      status: "approved",
      canonicalApprovalEventAvailable: false,
      exactConfirmationStored: false,
      exactConfirmationRedacted: true,
    });
  });

  test("returns durable execution evidence for executed reviews", async () => {
    officialResultReviewFindMany.mockResolvedValue([
      {
        id: "review-4",
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
        settlementExecutedCanonicalId: 12n,
        approvalStatus: "approved",
        executionDecision: "already_executed",
        executionEligibleNow: false,
        confirmationRequiredKnown: true,
        exactConfirmationStored: false,
        activeMarketExecutionAttempted: false,
        providerQuotaUsed: false,
        updatedAt: new Date("2026-07-12T12:30:00Z"),
      },
    ]);
    marketFindMany.mockResolvedValue([
      {
        id: "market-1",
        slug: "spain-france-total-25",
        title: "Spain vs. France: Total Goals 2.5",
        status: "RESOLVED",
        settlementStatus: "settled",
        resolvedOutcomeId: "outcome-1",
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

    expect(result.status).toBe("ready");
    expect(result.queue.items[0]).toMatchObject({
      nextSafeAction: "already_executed",
      hasExecutionAudit: true,
      executionEvidence: {
        status: "executed",
        source: "OfficialResultReview+CanonicalEvent",
        durableReviewRowAvailable: true,
        canonicalExecutionEventAvailable: true,
        canonicalExecutionEventId: "12",
        resultDigestAvailable: true,
        exactConfirmationStored: false,
        exactConfirmationRedacted: true,
        providerQuotaUsed: false,
        activeMarketExecutionAttempted: false,
      },
      operatorAction: {
        label: "settlement_already_executed",
        exactConfirmationExposed: false,
      },
      operatorExecutionPlan: {
        mode: "already_executed",
        executableNow: false,
        providerQuotaRequired: false,
        exactConfirmationExposed: false,
        prerequisites: {
          executionAuditPresent: true,
        },
      },
    });
    expect(result.runtimeTruth.durableExecutionEvidenceAvailable).toBe(true);
    expect(result.checks.canonicalExecutionEvidenceForExecutedReviews).toBe(true);
    expect(JSON.stringify(result)).not.toContain("SETTLE_FROM_RESULT:");
  });
});
