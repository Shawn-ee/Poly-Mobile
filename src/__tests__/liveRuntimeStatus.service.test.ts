const readFile = jest.fn();

jest.mock("node:fs/promises", () => ({
  readFile,
}));

import { getLocalLiveRuntimeStatus } from "@/server/services/liveRuntimeStatus";

const nowIso = () => new Date().toISOString();
const staleIso = () => new Date(Date.now() - 25 * 3_600_000).toISOString();

const makeCompletionAudit = (generatedAt = nowIso()) => ({
  generatedAt,
  pass: true,
  event: {
    title: "Spain vs France",
    providerEventId: "odds-api-event-1",
  },
  selectedMarket: {
    marketId: "market-1",
  },
  runtimeTruth: {
    phaseCompleteForLocalInternalRuntime: true,
    fullProductionRuntimeComplete: false,
    installedUnattendedService: false,
    internalTesterWatchdogPass: true,
    activeTesterSettlementExecutionAttempted: false,
  },
  answers: {
    marketMakerContinuous: "foreground supervisor only",
    oddsRefreshLiveOrReplay: "cached by default",
    oddsRefreshCadence: "explicit live proof",
    quotaProtection: "no quota by default",
    staleHandling: "stale markets reject orders",
    lifecycle: "open paused closed proven",
    activeSettlement: "wait for closed market",
    localWatchdog: "watchdog proof passed",
  },
  checks: {
    internalTesterWatchdogKnown: true,
  },
  gaps: {
    p0: [],
    p1: ["installed service remains open"],
    p2: [],
  },
});

const makePhaseAudit = (generatedAt = nowIso()) => ({
  generatedAt,
  pass: true,
  selectedMarket: {
    marketId: "phase-market",
  },
});

const makeWatchdog = (generatedAt = nowIso()) => ({
  generatedAt,
  pass: true,
  cleanup: {
    supervisor: { pass: true },
    resultPoller: { pass: true },
  },
});

describe("live runtime status service", () => {
  beforeEach(() => {
    readFile.mockReset();
  });

  test("returns ready only when audits pass and proof artifacts are fresh", async () => {
    readFile.mockImplementation(async (filePath: string) => {
      if (filePath.includes("completion-audit")) return JSON.stringify(makeCompletionAudit());
      if (filePath.includes("phase-audit")) return JSON.stringify(makePhaseAudit());
      if (filePath.includes("watchdog")) return JSON.stringify(makeWatchdog());
      throw new Error(`unexpected path ${filePath}`);
    });

    const status = await getLocalLiveRuntimeStatus();

    expect(status.status).toBe("ready");
    expect(status.freshness).toMatchObject({
      maxCompletionAuditAgeHours: 24,
      maxPhaseAuditAgeHours: 24,
      maxWatchdogAgeHours: 24,
      completionAuditFresh: true,
      phaseAuditFresh: true,
      watchdogFresh: true,
    });
    expect(status.gaps.p0).toEqual([]);
    expect(status.runtimeTruth.providerQuotaUsedByStatus).toBe(false);
  });

  test("returns needs_attention when a required proof artifact is stale", async () => {
    readFile.mockImplementation(async (filePath: string) => {
      if (filePath.includes("completion-audit")) return JSON.stringify(makeCompletionAudit(staleIso()));
      if (filePath.includes("phase-audit")) return JSON.stringify(makePhaseAudit());
      if (filePath.includes("watchdog")) return JSON.stringify(makeWatchdog());
      throw new Error(`unexpected path ${filePath}`);
    });

    const status = await getLocalLiveRuntimeStatus();

    expect(status.status).toBe("needs_attention");
    expect(status.freshness.completionAuditFresh).toBe(false);
    expect(status.freshness.phaseAuditFresh).toBe(true);
    expect(status.freshness.watchdogFresh).toBe(true);
  });
});
