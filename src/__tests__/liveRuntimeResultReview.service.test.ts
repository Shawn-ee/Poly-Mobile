const readFile = jest.fn();
const marketFindUnique = jest.fn();
const canonicalEventFindFirst = jest.fn();
const officialResultReviewUpsert = jest.fn();

jest.mock("node:fs/promises", () => ({
  readFile,
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    market: {
      findUnique: (...args: unknown[]) => marketFindUnique(...args),
    },
    canonicalEvent: {
      findFirst: (...args: unknown[]) => canonicalEventFindFirst(...args),
    },
    officialResultReview: {
      upsert: (...args: unknown[]) => officialResultReviewUpsert(...args),
    },
  },
}));

import { getLocalLiveRuntimeResultReview } from "@/server/services/liveRuntimeResultReview";

const canonicalEvent = (eventType: string, payload: Record<string, unknown>, id = 1n) => ({
  id,
  stream: "MARKET",
  topicKey: eventType === "provider.result.ingested" ? "market:provider-result:odds-api-single-soccer-test" : "market:settlement",
  eventType,
  marketId: eventType === "provider.result.ingested" ? null : "market-1",
  outcomeId: eventType === "provider.result.ingested" ? null : "outcome-1",
  createdAt: new Date("2026-07-12T12:00:00Z"),
  payload,
});

describe("live runtime result review service", () => {
  beforeEach(() => {
    readFile.mockReset();
    marketFindUnique.mockReset();
    canonicalEventFindFirst.mockReset();
    officialResultReviewUpsert.mockReset();
    readFile.mockResolvedValue(
      JSON.stringify({
        pass: true,
        generatedAt: "2026-07-12T12:00:00Z",
        event: { localSlug: "odds-api-single-soccer-test" },
        selectedMarket: { id: "market-1", outcomeId: "outcome-1" },
      }),
    );
    marketFindUnique.mockResolvedValue({
      id: "market-1",
      slug: "spain-france-total-25",
      title: "Spain vs. France: Total Goals 2.5",
      status: "LIVE",
      settlementStatus: null,
      resolvedOutcomeId: null,
      marketType: "total_goals",
      marketGroupKey: "totals",
      line: { toString: () => "2.5" },
      event: {
        id: "event-1",
        slug: "odds-api-single-soccer-test",
        title: "Spain vs. France",
        status: "ACTIVE",
        liveStatus: "pre_match",
        startTime: new Date("2026-07-14T19:00:00Z"),
        source: "the-odds-api",
        externalEventId: "provider-event-1",
      },
    });
    officialResultReviewUpsert.mockResolvedValue({
      id: "review-1",
      reviewKey: "odds-api-single-soccer-test:market-1:result-digest",
      eventSlug: "odds-api-single-soccer-test",
      marketId: "market-1",
      outcomeId: "outcome-1",
      resultDigest: "result-digest",
      trustedResultDigest: "trusted-digest",
      approvalStatus: "approved",
      executionDecision: "wait_for_or_apply_market_close_before_execution",
      executionEligibleNow: false,
      confirmationRequiredKnown: true,
      exactConfirmationStored: false,
      activeMarketExecutionAttempted: false,
      providerQuotaUsed: false,
      updatedAt: new Date("2026-07-12T12:05:00Z"),
    });
    canonicalEventFindFirst
      .mockResolvedValueOnce(
        canonicalEvent("provider.result.ingested", {
          trustedResultDigest: "trusted-digest",
          settlementExecutionAttempted: false,
        }),
      )
      .mockResolvedValueOnce(
        canonicalEvent("settlement.trusted_result.preflight", {
          resultDigest: "result-digest",
          executionMode: "dry-run",
          executionAttempted: false,
          previewPayoutConservationPass: true,
          confirm: "SETTLE_FROM_RESULT:market-1:outcome-1:result-digest",
        }),
      )
      .mockResolvedValueOnce(
        canonicalEvent("settlement.trusted_result.approved", {
          resultDigest: "result-digest",
          approvedBy: "local-audit",
          activeTesterSettlementExecution: false,
          confirm: "SETTLE_FROM_RESULT:market-1:outcome-1:result-digest",
        }),
      )
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
  });

  test("returns ready canonical review and redacts exact confirmation text", async () => {
    const result = await getLocalLiveRuntimeResultReview();

    expect(result.status).toBe("ready");
    expect(result.providerQuotaUsed).toBe(false);
    expect(result.selectedMarket).toMatchObject({
      id: "market-1",
      line: "2.5",
      event: { slug: "odds-api-single-soccer-test" },
    });
    expect(result.checks).toMatchObject({
      providerResultAuditEventFound: true,
      settlementPreflightAuditEventFound: true,
      settlementApprovalAuditEventFound: true,
      approvalDigestMatchesPreflight: true,
      exactConfirmationRedacted: true,
    });
    expect(result.executionDecision).toMatchObject({
      executionEligibleNow: false,
      operatorDecision: "wait_for_or_apply_market_close_before_execution",
      exactConfirmationRequiredKnown: true,
      exactConfirmationRedacted: true,
      activeMarketExecutionAttemptedByThisRoute: false,
    });
    expect(result.officialResultReview).toMatchObject({
      id: "review-1",
      reviewKey: "odds-api-single-soccer-test:market-1:result-digest",
      exactConfirmationStored: false,
      activeMarketExecutionAttempted: false,
      providerQuotaUsed: false,
    });
    expect(JSON.stringify(result)).not.toContain("SETTLE_FROM_RESULT:");
    expect(canonicalEventFindFirst).toHaveBeenCalledTimes(5);
    expect(officialResultReviewUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { reviewKey: "odds-api-single-soccer-test:market-1:result-digest" },
        create: expect.objectContaining({
          eventId: "event-1",
          providerSource: "the-odds-api",
          providerEventId: "provider-event-1",
          approvalStatus: "approved",
          exactConfirmationStored: false,
          activeMarketExecutionAttempted: false,
          providerQuotaUsed: false,
        }),
        update: expect.objectContaining({
          approvalStatus: "approved",
          exactConfirmationStored: false,
          activeMarketExecutionAttempted: false,
          providerQuotaUsed: false,
        }),
      }),
    );
    expect(
      JSON.stringify(officialResultReviewUpsert.mock.calls[0], (_key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    ).not.toContain("SETTLE_FROM_RESULT:");
  });

  test("marks executed settlement reviews terminal and blocks repeat execution eligibility", async () => {
    marketFindUnique.mockResolvedValueOnce({
      id: "market-1",
      slug: "spain-france-total-25",
      title: "Spain vs. France: Total Goals 2.5",
      status: "CLOSED",
      settlementStatus: "settled",
      resolvedOutcomeId: "outcome-1",
      marketType: "total_goals",
      marketGroupKey: "totals",
      line: { toString: () => "2.5" },
      event: {
        id: "event-1",
        slug: "odds-api-single-soccer-test",
        title: "Spain vs. France",
        status: "ACTIVE",
        liveStatus: "final",
        startTime: new Date("2026-07-14T19:00:00Z"),
        source: "the-odds-api",
        externalEventId: "provider-event-1",
      },
    });
    canonicalEventFindFirst.mockReset();
    canonicalEventFindFirst
      .mockResolvedValueOnce(
        canonicalEvent("provider.result.ingested", {
          trustedResultDigest: "trusted-digest",
          settlementExecutionAttempted: false,
        }),
      )
      .mockResolvedValueOnce(
        canonicalEvent("settlement.trusted_result.preflight", {
          resultDigest: "result-digest",
          executionMode: "dry-run",
          executionAttempted: false,
          previewPayoutConservationPass: true,
          confirm: "SETTLE_FROM_RESULT:market-1:outcome-1:result-digest",
        }),
      )
      .mockResolvedValueOnce(
        canonicalEvent("settlement.trusted_result.approved", {
          resultDigest: "result-digest",
          approvedBy: "local-audit",
          activeTesterSettlementExecution: false,
          confirm: "SETTLE_FROM_RESULT:market-1:outcome-1:result-digest",
        }),
      )
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(
        canonicalEvent(
          "settlement.trusted_result.executed",
          {
            resultDigest: "result-digest",
            executionMode: "execute",
            executionAttempted: true,
            activeTesterSettlementExecution: true,
          },
          44n,
        ),
      );
    officialResultReviewUpsert.mockResolvedValueOnce({
      id: "review-1",
      reviewKey: "odds-api-single-soccer-test:market-1:result-digest",
      eventSlug: "odds-api-single-soccer-test",
      marketId: "market-1",
      outcomeId: "outcome-1",
      resultDigest: "result-digest",
      trustedResultDigest: "trusted-digest",
      approvalStatus: "approved",
      executionDecision: "already_executed",
      executionEligibleNow: false,
      confirmationRequiredKnown: true,
      exactConfirmationStored: false,
      activeMarketExecutionAttempted: false,
      providerQuotaUsed: false,
      updatedAt: new Date("2026-07-12T12:06:00Z"),
    });

    const result = await getLocalLiveRuntimeResultReview();

    expect(result.executionDecision).toMatchObject({
      activeMarketStatus: "CLOSED",
      executionEligibleNow: false,
      operatorDecision: "already_executed",
      settlementAlreadyExecuted: true,
      repeatExecutionBlocked: true,
      exactConfirmationRedacted: true,
    });
    expect(result.runtimeTruth).toMatchObject({
      canonicalSettlementExecutionAuditAvailable: true,
      repeatSettlementExecutionBlocked: true,
      providerQuotaUsed: false,
    });
    expect(officialResultReviewUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          settlementExecutedCanonicalId: 44n,
          executionDecision: "already_executed",
          executionEligibleNow: false,
        }),
        update: expect.objectContaining({
          settlementExecutedCanonicalId: 44n,
          executionDecision: "already_executed",
          executionEligibleNow: false,
        }),
      }),
    );
    expect(JSON.stringify(result)).not.toContain("SETTLE_FROM_RESULT:");
  });

  test("surfaces redacted blocked settlement execution audit evidence", async () => {
    canonicalEventFindFirst.mockReset();
    canonicalEventFindFirst
      .mockResolvedValueOnce(canonicalEvent("provider.result.ingested", { trustedResultDigest: "trusted-digest" }))
      .mockResolvedValueOnce(canonicalEvent("settlement.trusted_result.preflight", { resultDigest: "result-digest" }))
      .mockResolvedValueOnce(canonicalEvent("settlement.trusted_result.approved", { resultDigest: "result-digest" }))
      .mockResolvedValueOnce(
        canonicalEvent(
          "settlement.trusted_result.blocked",
          {
            resultDigest: "result-digest",
            executionMode: "execute",
            executionAttempted: false,
            executionReason: "market_must_be_closed_before_result_settlement:LIVE",
            currentMarketStatus: "LIVE",
            confirm: "SETTLE_FROM_RESULT:market-1:outcome-1:result-digest",
          },
          33n,
        ),
      )
      .mockResolvedValueOnce(null);

    const result = await getLocalLiveRuntimeResultReview();

    expect(result.status).toBe("ready");
    expect(result.reviewTrail.settlementBlockedEvent).toMatchObject({
      id: "33",
      eventType: "settlement.trusted_result.blocked",
      payload: {
        executionAttempted: false,
        executionReason: "market_must_be_closed_before_result_settlement:LIVE",
        currentMarketStatus: "LIVE",
      },
    });
    expect(result.runtimeTruth).toMatchObject({
      canonicalSettlementBlockedAuditAvailable: true,
      canonicalSettlementExecutionAuditAvailable: false,
      activeTesterSettlementExecutionAttempted: false,
      providerQuotaUsed: false,
    });
    expect(JSON.stringify(result)).not.toContain("SETTLE_FROM_RESULT:");
  });

  test("returns needs_attention when approval digest does not match preflight", async () => {
    canonicalEventFindFirst.mockReset();
    canonicalEventFindFirst
      .mockResolvedValueOnce(canonicalEvent("provider.result.ingested", { trustedResultDigest: "trusted-digest" }))
      .mockResolvedValueOnce(canonicalEvent("settlement.trusted_result.preflight", { resultDigest: "result-digest" }))
      .mockResolvedValueOnce(canonicalEvent("settlement.trusted_result.approved", { resultDigest: "different" }))
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const result = await getLocalLiveRuntimeResultReview();

    expect(result.status).toBe("needs_attention");
    expect(result.gaps.p0).toContain("approvalDigestMatchesPreflight");
  });
});
