const readFile = jest.fn();
const referenceQuoteSnapshotFindMany = jest.fn();

jest.mock("node:fs/promises", () => ({
  readFile,
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    referenceQuoteSnapshot: {
      findMany: (...args: unknown[]) => referenceQuoteSnapshotFindMany(...args),
    },
  },
}));

import { getLocalLiveRuntimeStatus } from "@/server/services/liveRuntimeStatus";

const nowIso = () => new Date().toISOString();
const staleIso = () => new Date(Date.now() - 25 * 3_600_000).toISOString();
const freshSnapshot = () => [
  {
    source: "sportsbook-odds",
    fetchedAt: new Date(),
    acceptingOrders: true,
    mmEligible: true,
    qualityStatus: "available",
    reason: null,
  },
];
const refreshDueSnapshot = () => [
  {
    source: "sportsbook-odds",
    fetchedAt: new Date(Date.now() - 65_000),
    acceptingOrders: true,
    mmEligible: true,
    qualityStatus: "available",
    reason: null,
  },
];

const makeCompletionAudit = (
  generatedAt = nowIso(),
  freshness: { liveProofAgeHours?: number; maxLiveProofAgeHours?: number } = {},
) => ({
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
    freshness: {
      liveProofAgeHours: freshness.liveProofAgeHours ?? 1,
      maxLiveProofAgeHours: freshness.maxLiveProofAgeHours ?? 24,
      watchdogAgeHours: 1,
      maxWatchdogAgeHours: 24,
    },
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
    id: "phase-market",
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

const makeSupervisorState = () => ({
  pid: 12345,
  startedAt: nowIso(),
  continuous: true,
  maxIterations: 0,
  intervalSeconds: 2,
  runProviderProof: false,
  runStaleGuard: true,
  enforceStaleGuard: false,
  runLiveResultIngestion: false,
  runApprovedResultSettlement: true,
});

const makeResultPollerState = () => ({
  pid: 23456,
  startedAt: nowIso(),
  continuous: true,
  maxIterations: 0,
  intervalSeconds: 1,
  runLiveResultIngestion: false,
  runApprovedResultSettlement: false,
});

describe("live runtime status service", () => {
  let killSpy: jest.SpyInstance;

  beforeEach(() => {
    readFile.mockReset();
    referenceQuoteSnapshotFindMany.mockReset();
    referenceQuoteSnapshotFindMany.mockResolvedValue(freshSnapshot());
    killSpy = jest.spyOn(process, "kill").mockImplementation(() => {
      const error = new Error("missing process") as NodeJS.ErrnoException;
      error.code = "ESRCH";
      throw error;
    });
  });

  afterEach(() => {
    killSpy.mockRestore();
  });

  test("returns ready only when audits pass and proof artifacts are fresh", async () => {
    readFile.mockImplementation(async (filePath: string) => {
      if (filePath.includes("completion-audit")) return JSON.stringify(makeCompletionAudit());
      if (filePath.includes("phase-audit")) return JSON.stringify(makePhaseAudit());
      if (filePath.includes("watchdog")) return JSON.stringify(makeWatchdog());
      if (filePath.includes("supervisor-process-state")) return JSON.stringify(makeSupervisorState());
      if (filePath.includes("result-poller-process-state")) return JSON.stringify(makeResultPollerState());
      throw new Error(`unexpected path ${filePath}`);
    });

    const status = await getLocalLiveRuntimeStatus();

    expect(status.status).toBe("ready");
    expect(status.freshness).toMatchObject({
      maxCompletionAuditAgeHours: 24,
      maxPhaseAuditAgeHours: 24,
      maxWatchdogAgeHours: 24,
      maxLiveProofAgeHours: 24,
      completionAuditFresh: true,
      phaseAuditFresh: true,
      watchdogFresh: true,
      liveProofFresh: true,
    });
    expect(status.freshness.liveProofCurrentAgeHours).toBeGreaterThanOrEqual(1);
    expect(status.providerSnapshots).toMatchObject({
      checked: true,
      fresh: true,
      freshnessBasis: "local_proof_window",
      marketId: "phase-market",
      snapshotCount: 1,
      sources: ["sportsbook-odds"],
      acceptingOrderSnapshotCount: 1,
      mmEligibleSnapshotCount: 1,
      mobileRouteFresh: true,
      mobileRouteRefreshDue: false,
      mobileRouteStale: false,
      mobileLifecycleStatus: "ready",
      mobileRefreshDueSeconds: 60,
      mobileStaleAfterSeconds: 90,
      nextProviderAction: "none",
    });
    expect(referenceQuoteSnapshotFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { marketId: "phase-market" },
      }),
    );
    expect(status.gaps.p0).toEqual([]);
    expect(status.runtimeTruth.providerQuotaUsedByStatus).toBe(false);
    expect(status.managedProcesses).toMatchObject({
      anyLoopRunning: false,
      quotaSpendingLoopRunning: false,
      supervisor: {
        known: true,
        pid: 12345,
        running: false,
        usesProviderQuota: false,
        modes: {
          staleGuard: true,
          approvedResultSettlement: true,
        },
      },
      resultPoller: {
        known: true,
        pid: 23456,
        running: false,
        usesProviderQuota: false,
      },
    });
  });

  test("returns needs_attention when a required proof artifact is stale", async () => {
    readFile.mockImplementation(async (filePath: string) => {
      if (filePath.includes("completion-audit")) return JSON.stringify(makeCompletionAudit(staleIso()));
      if (filePath.includes("phase-audit")) return JSON.stringify(makePhaseAudit());
      if (filePath.includes("watchdog")) return JSON.stringify(makeWatchdog());
      if (filePath.includes("supervisor-process-state")) return JSON.stringify(makeSupervisorState());
      if (filePath.includes("result-poller-process-state")) return JSON.stringify(makeResultPollerState());
      throw new Error(`unexpected path ${filePath}`);
    });

    const status = await getLocalLiveRuntimeStatus();

    expect(status.status).toBe("needs_attention");
    expect(status.freshness.completionAuditFresh).toBe(false);
    expect(status.freshness.phaseAuditFresh).toBe(true);
    expect(status.freshness.watchdogFresh).toBe(true);
  });

  test("returns needs_attention when the embedded live provider proof ages past its limit", async () => {
    readFile.mockImplementation(async (filePath: string) => {
      if (filePath.includes("completion-audit")) {
        return JSON.stringify(
          makeCompletionAudit(new Date(Date.now() - 2 * 3_600_000).toISOString(), {
            liveProofAgeHours: 23,
            maxLiveProofAgeHours: 24,
          }),
        );
      }
      if (filePath.includes("phase-audit")) return JSON.stringify(makePhaseAudit());
      if (filePath.includes("watchdog")) return JSON.stringify(makeWatchdog());
      if (filePath.includes("supervisor-process-state")) return JSON.stringify(makeSupervisorState());
      if (filePath.includes("result-poller-process-state")) return JSON.stringify(makeResultPollerState());
      throw new Error(`unexpected path ${filePath}`);
    });

    const status = await getLocalLiveRuntimeStatus();

    expect(status.status).toBe("needs_attention");
    expect(status.freshness.completionAuditFresh).toBe(true);
    expect(status.freshness.liveProofCurrentAgeHours).toBeGreaterThan(24);
    expect(status.freshness.liveProofFresh).toBe(false);
  });

  test("returns needs_attention when selected market provider snapshots are stale in the database", async () => {
    referenceQuoteSnapshotFindMany.mockResolvedValue([
      {
        source: "sportsbook-odds",
        fetchedAt: new Date(Date.now() - 25 * 3_600_000),
        acceptingOrders: true,
        mmEligible: true,
        qualityStatus: "available",
        reason: null,
      },
    ]);
    readFile.mockImplementation(async (filePath: string) => {
      if (filePath.includes("completion-audit")) return JSON.stringify(makeCompletionAudit());
      if (filePath.includes("phase-audit")) return JSON.stringify(makePhaseAudit());
      if (filePath.includes("watchdog")) return JSON.stringify(makeWatchdog());
      if (filePath.includes("supervisor-process-state")) return JSON.stringify(makeSupervisorState());
      if (filePath.includes("result-poller-process-state")) return JSON.stringify(makeResultPollerState());
      throw new Error(`unexpected path ${filePath}`);
    });

    const status = await getLocalLiveRuntimeStatus();

    expect(status.status).toBe("needs_attention");
    expect(status.providerSnapshots).toMatchObject({
      checked: true,
      fresh: false,
      marketId: "phase-market",
      reason: "provider_snapshots_stale",
      snapshotCount: 1,
    });
  });

  test("reports mobile route freshness separately from local proof freshness", async () => {
    referenceQuoteSnapshotFindMany.mockResolvedValue(refreshDueSnapshot());
    readFile.mockImplementation(async (filePath: string) => {
      if (filePath.includes("completion-audit")) return JSON.stringify(makeCompletionAudit());
      if (filePath.includes("phase-audit")) return JSON.stringify(makePhaseAudit());
      if (filePath.includes("watchdog")) return JSON.stringify(makeWatchdog());
      if (filePath.includes("supervisor-process-state")) return JSON.stringify(makeSupervisorState());
      if (filePath.includes("result-poller-process-state")) return JSON.stringify(makeResultPollerState());
      throw new Error(`unexpected path ${filePath}`);
    });

    const status = await getLocalLiveRuntimeStatus();

    expect(status.status).toBe("ready");
    expect(status.providerSnapshots).toMatchObject({
      fresh: true,
      mobileRouteFresh: false,
      mobileRouteRefreshDue: true,
      mobileRouteStale: false,
      mobileLifecycleStatus: "refresh_due",
      mobileRefreshDueSeconds: 60,
      mobileStaleAfterSeconds: 90,
      nextProviderAction: "refresh_provider_snapshots",
    });
  });

  test("reports current managed loop process state without spending provider quota", async () => {
    killSpy.mockImplementation((pid: number | string) => {
      if (pid === 12345) return true;
      const error = new Error("missing process") as NodeJS.ErrnoException;
      error.code = "ESRCH";
      throw error;
    });
    readFile.mockImplementation(async (filePath: string) => {
      if (filePath.includes("completion-audit")) return JSON.stringify(makeCompletionAudit());
      if (filePath.includes("phase-audit")) return JSON.stringify(makePhaseAudit());
      if (filePath.includes("watchdog")) return JSON.stringify(makeWatchdog());
      if (filePath.includes("supervisor-process-state")) {
        return JSON.stringify({
          ...makeSupervisorState(),
          runProviderProof: true,
        });
      }
      if (filePath.includes("result-poller-process-state")) return JSON.stringify(makeResultPollerState());
      throw new Error(`unexpected path ${filePath}`);
    });

    const status = await getLocalLiveRuntimeStatus();

    expect(status.status).toBe("ready");
    expect(status.runtimeTruth.providerQuotaUsedByStatus).toBe(false);
    expect(status.managedProcesses).toMatchObject({
      anyLoopRunning: true,
      quotaSpendingLoopRunning: true,
      supervisor: {
        running: true,
        usesProviderQuota: true,
        modes: {
          providerProof: true,
          liveResultIngestion: false,
        },
      },
      resultPoller: {
        running: false,
        usesProviderQuota: false,
      },
    });
  });
});
