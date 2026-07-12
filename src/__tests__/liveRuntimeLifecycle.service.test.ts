const readFile = jest.fn();
const eventFindUnique = jest.fn();

jest.mock("node:fs/promises", () => ({
  readFile,
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    event: {
      findUnique: (...args: unknown[]) => eventFindUnique(...args),
    },
  },
}));

import { getLocalLiveRuntimeLifecycle } from "@/server/services/liveRuntimeLifecycle";

const artifactFor = (filePath: string) => {
  if (filePath.includes("event-lifecycle-controls")) {
    return {
      pass: true,
      generatedAt: "2026-07-12T12:00:00Z",
      checks: {
        liveOrderAccepted: true,
        pausedOrderRejected: true,
        closedOrderRejected: true,
        settlementPreviewNonMutating: true,
      },
      lifecycle: {
        open: { marketStatus: "LIVE" },
        paused: { marketStatus: "PAUSED" },
        settlementPreview: { payoutConservationPass: true },
      },
    };
  }
  if (filePath.includes("event-lifecycle-scheduler")) {
    return {
      pass: true,
      generatedAt: "2026-07-12T12:00:00Z",
      checks: { closeAfterStart: true },
    };
  }
  if (filePath.includes("one-event-settlement-execution")) {
    return {
      pass: true,
      generatedAt: "2026-07-12T12:00:00Z",
      checks: {
        settlementExecuted: true,
        payoutConservationPass: true,
        positionsFinalizedPass: true,
      },
      targetTesterEventMutated: false,
    };
  }
  if (filePath.includes("one-event-result-settlement-scheduler-execution")) {
    return {
      pass: true,
      generatedAt: "2026-07-12T12:00:00Z",
      checks: {
        liveMarketExecutionBlocked: true,
        executeSchedulerPassed: true,
        disposableMarketResolved: true,
        targetTesterEventNotMutated: true,
      },
    };
  }
  if (filePath.includes("one-event-active-settlement-readiness")) {
    return {
      pass: true,
      generatedAt: "2026-07-12T12:00:00Z",
      executionDecision: {
        activeMarketStatus: "LIVE",
        executionEligibleNow: false,
        executionRequiresMarketStatus: "CLOSED",
      },
      runtimeTruth: {
        activeEventSettlementExecutionAttempted: false,
      },
    };
  }
  if (filePath.includes("one-event-result-review-trail")) {
    return {
      pass: true,
      generatedAt: "2026-07-12T12:00:00Z",
      checks: {
        providerResultAuditEventFound: true,
        settlementPreflightAuditEventFound: true,
      },
      runtimeTruth: {
        activeTesterSettlementExecution: false,
      },
    };
  }
  if (filePath.includes("one-event-lifecycle-matrix")) {
    return {
      pass: true,
      generatedAt: "2026-07-12T12:00:00Z",
      event: { slug: "odds-api-single-soccer-test" },
    };
  }
  return { pass: true, generatedAt: "2026-07-12T12:00:00Z" };
};

describe("live runtime lifecycle service", () => {
  beforeEach(() => {
    readFile.mockReset();
    eventFindUnique.mockReset();
    readFile.mockImplementation(async (filePath: string) => JSON.stringify(artifactFor(filePath)));
    eventFindUnique.mockResolvedValue({
      id: "event-1",
      slug: "odds-api-single-soccer-test",
      title: "Spain vs. France",
      status: "ACTIVE",
      liveStatus: "pre_match",
      startTime: new Date("2026-07-14T19:00:00Z"),
      source: "the-odds-api",
      externalEventId: "provider-event-1",
      markets: [
        {
          id: "market-1",
          title: "Total Goals 2.5",
          status: "LIVE",
          settlementStatus: null,
          resolvedOutcomeId: null,
          marketType: "total_goals",
          line: { toString: () => "2.5" },
        },
      ],
    });
  });

  test("returns ready lifecycle proof without provider quota or active settlement execution", async () => {
    const result = await getLocalLiveRuntimeLifecycle();

    expect(result.status).toBe("ready");
    expect(result.providerQuotaUsed).toBe(false);
    expect(result.lifecycle.open.proven).toBe(true);
    expect(result.lifecycle.suspended.proven).toBe(true);
    expect(result.lifecycle.closed.proven).toBe(true);
    expect(result.lifecycle.settledResolved.proven).toBe(true);
    expect(result.lifecycle.settledResolved.activeTesterEventSettlementExecuted).toBe(false);
    expect(result.lifecycle.settledResolved.executionRequiresMarketStatus).toBe("CLOSED");
    expect(result.runtimeTruth).toMatchObject({
      readOnlyRoute: true,
      providerQuotaUsed: false,
      activeTesterEventSettlementExecuted: false,
      automaticOfficialResultSettlementInstalled: false,
      installedOsService: false,
    });
    expect(result.gaps.p0).toEqual([]);
    expect(eventFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "odds-api-single-soccer-test" },
      }),
    );
    expect(JSON.stringify(result)).not.toContain("SETTLE_FROM_RESULT:");
    expect(JSON.stringify(result)).not.toContain("THE_ODDS_API_KEY");
  });

  test("returns needs_attention when the selected event is missing", async () => {
    eventFindUnique.mockResolvedValue(null);

    const result = await getLocalLiveRuntimeLifecycle();

    expect(result.status).toBe("needs_attention");
    expect(result.gaps.p0).toContain("eventFound");
  });
});
