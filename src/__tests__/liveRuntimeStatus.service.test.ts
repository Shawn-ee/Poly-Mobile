const readFile = jest.fn();
const referenceQuoteSnapshotFindMany = jest.fn();
const runtimeServiceHeartbeatFindUnique = jest.fn();
const runtimeServiceHeartbeatUpsert = jest.fn();
const runtimeServiceRunFindMany = jest.fn();
const providerRefreshRunFindMany = jest.fn();
const marketMakerQuoteRunFindMany = jest.fn();

jest.mock("node:fs/promises", () => ({
  readFile,
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    referenceQuoteSnapshot: {
      findMany: (...args: unknown[]) => referenceQuoteSnapshotFindMany(...args),
    },
    runtimeServiceHeartbeat: {
      findUnique: (...args: unknown[]) => runtimeServiceHeartbeatFindUnique(...args),
      upsert: (...args: unknown[]) => runtimeServiceHeartbeatUpsert(...args),
    },
    runtimeServiceRun: {
      findMany: (...args: unknown[]) => runtimeServiceRunFindMany(...args),
    },
    providerRefreshRun: {
      findMany: (...args: unknown[]) => providerRefreshRunFindMany(...args),
    },
    marketMakerQuoteRun: {
      findMany: (...args: unknown[]) => marketMakerQuoteRunFindMany(...args),
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
const runtimeRunRows = () => [
  {
    runKey: `local:one-event-live-supervisor:${nowIso()}`,
    serviceKey: "local:one-event-live-supervisor",
    serviceName: "one-event-live-supervisor",
    serviceKind: "supervisor",
    status: "passed",
    startedAt: new Date(),
    finishedAt: new Date(),
    durationMs: 1000,
    iterationCount: 1,
    providerQuotaUsed: false,
    activeSettlementExecuted: false,
    installedOsService: false,
    eventSlug: "spain-vs-france",
    selectedMarketId: "phase-market",
    resultAction: "trusted result scheduler dry-run while poller runs",
    summaryPath: "docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-summary.redacted.json",
    updatedAt: new Date(),
    metadata: {
      source: "local-runtime-worker",
      emittedBy: "scripts/write_runtime_service_run.ts",
      workerOwned: true,
    },
  },
  {
    runKey: `local:one-event-result-poller:${nowIso()}`,
    serviceKey: "local:one-event-result-poller",
    serviceName: "one-event-result-poller",
    serviceKind: "result-poller",
    status: "passed",
    startedAt: new Date(),
    finishedAt: new Date(),
    durationMs: 1000,
    iterationCount: 1,
    providerQuotaUsed: false,
    activeSettlementExecuted: false,
    installedOsService: false,
    eventSlug: "spain-vs-france",
    selectedMarketId: "phase-market",
    resultAction: "trusted result scheduler dry-run while poller runs",
    summaryPath: "docs/mobile/harness/odds-api-live-runtime/one-event-result-poller-summary.redacted.json",
    updatedAt: new Date(),
    metadata: {
      source: "local-runtime-worker",
      emittedBy: "scripts/write_runtime_service_run.ts",
      workerOwned: true,
    },
  },
];
const providerRefreshRunRows = () => [
  {
    runKey: `the-odds-api:sportsbook-odds:odds-api-single-soccer-test:${nowIso()}`,
    providerSource: "the-odds-api",
    referenceSource: "sportsbook-odds",
    status: "passed",
    mode: "bounded-live-provider-proof",
    startedAt: new Date(),
    finishedAt: new Date(),
    durationMs: 2000,
    eventSlug: "odds-api-single-soccer-test",
    providerEventId: "provider-event-1",
    sportKey: "soccer_fifa_world_cup",
    selectedMarketId: "phase-market",
    selectedOutcomeId: "phase-outcome",
    refreshIterations: 2,
    providerCallCount: 4,
    quotaCost: 13,
    requestsRemaining: "459",
    maxCredits: 16,
    minRemaining: 2,
    marketCount: 12,
    outcomeCount: 24,
    snapshotCount: 24,
    staleBeforeRefresh: true,
    readyAfterRefresh: true,
    updatedAt: new Date(),
    metadata: {
      source: "local-provider-refresh-proof",
      emittedBy: "scripts/write_provider_refresh_run.ts",
      quotaProtected: true,
    },
  },
];
const marketMakerQuoteRunRows = () => [
  {
    runKey: `sportsbook-odds:phase-market:phase-outcome:${nowIso()}`,
    marketId: "phase-market",
    outcomeId: "phase-outcome",
    eventSlug: "odds-api-single-soccer-test",
    status: "passed",
    mode: "seed-resting-shifted-maker-quotes",
    startedAt: new Date(),
    finishedAt: new Date(),
    durationMs: 1000,
    makerUserId: "maker-user",
    bidOrderId: "maker-bid",
    askOrderId: "maker-ask",
    providerSource: "sportsbook-odds",
    referenceBid: { toString: () => "0.4891" },
    referenceAsk: { toString: () => "0.5291" },
    outcomePrice: { toString: () => "0.5091" },
    plannedBid: { toString: () => "0.47" },
    plannedAsk: { toString: () => "0.55" },
    quoteOffsetTicks: 2,
    size: { toString: () => "200" },
    mintQuantity: { toString: () => "200" },
    canceledOrderCount: 2,
    restingOrderCount: 2,
    quoteRouteStatus: 200,
    shiftedBidWorseThanProvider: true,
    shiftedAskWorseThanProvider: true,
    quoteRouteShowsBid: true,
    quoteRouteShowsAsk: true,
    snapshotFresh: true,
    installedOsService: false,
    updatedAt: new Date(),
    metadata: {
      source: "local-shifted-maker-proof",
      emittedBy: "scripts/seed_odds_api_live_shifted_maker.ts",
      localOnly: true,
    },
  },
  {
    runKey: `sportsbook-odds:phase-market:phase-outcome:${new Date(Date.now() - 60_000).toISOString()}`,
    marketId: "phase-market",
    outcomeId: "phase-outcome",
    eventSlug: "odds-api-single-soccer-test",
    status: "passed",
    mode: "seed-resting-shifted-maker-quotes",
    startedAt: new Date(Date.now() - 60_000),
    finishedAt: new Date(Date.now() - 59_000),
    durationMs: 1000,
    makerUserId: "maker-user",
    bidOrderId: "maker-bid-previous",
    askOrderId: "maker-ask-previous",
    providerSource: "sportsbook-odds",
    referenceBid: { toString: () => "0.4891" },
    referenceAsk: { toString: () => "0.5291" },
    outcomePrice: { toString: () => "0.5091" },
    plannedBid: { toString: () => "0.47" },
    plannedAsk: { toString: () => "0.55" },
    quoteOffsetTicks: 2,
    size: { toString: () => "200" },
    mintQuantity: { toString: () => "200" },
    canceledOrderCount: 2,
    restingOrderCount: 2,
    quoteRouteStatus: 200,
    shiftedBidWorseThanProvider: true,
    shiftedAskWorseThanProvider: true,
    quoteRouteShowsBid: true,
    quoteRouteShowsAsk: true,
    snapshotFresh: true,
    installedOsService: false,
    updatedAt: new Date(Date.now() - 59_000),
    metadata: {
      source: "local-shifted-maker-proof",
      emittedBy: "scripts/seed_odds_api_live_shifted_maker.ts",
      localOnly: true,
    },
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
const mobileStaleButLocallyFreshSnapshot = () => [
  {
    source: "sportsbook-odds",
    fetchedAt: new Date(Date.now() - 5 * 60_000),
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
    localSlug: "odds-api-single-soccer-test",
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
    activeSettlementClosedEligibility: "eligible after close",
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
  completionRequirements: {
    marketMakerContinuity: {
      pass: true,
      answer: "foreground supervisor only",
      evidence: ["one-event-runtime-status-summary.redacted.json"],
    },
    oddsRefreshMode: {
      pass: true,
      answer: "cached by default, live explicit",
      evidence: ["one-event-live-runtime-summary.redacted.json"],
    },
    quotaProtection: {
      pass: true,
      answer: "quota capped",
      evidence: ["ODDS_PROVIDER_REFRESH_POLICY.md"],
    },
    staleOddsHandling: {
      pass: true,
      answer: "stale markets reject orders",
      evidence: ["one-event-stale-guard-summary.redacted.json"],
    },
    eventLifecycle: {
      pass: true,
      answer: "open paused closed settlement known",
      evidence: ["one-event-lifecycle-matrix-summary.redacted.json"],
    },
    oneEventMobileTrading: {
      pass: true,
      answer: "S23 proof passed",
      evidence: ["cycle-LIVEODDSS23-odds-api-s23-visible-flow.json"],
    },
    runtimeLaunch: {
      pass: true,
      answer: "runtime launch proof passed",
      evidence: ["current-runtime-state-proof-summary.redacted.json"],
    },
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
  localResultReview: {
    ok: true,
    status: 200,
    body: {
      status: "ready",
      providerQuotaUsed: false,
      runtimeTruth: {
        readOnlyRoute: true,
        devOnlyRoute: true,
        canonicalProviderResultAuditAvailable: true,
        canonicalSettlementPreflightAuditAvailable: true,
        canonicalSettlementApprovalAuditAvailable: true,
        durableOfficialResultReviewRecordAvailable: true,
      },
      officialResultReview: {
        reviewKey: "odds-api-single-soccer-test:phase-market:result-digest",
        exactConfirmationStored: false,
        providerQuotaUsed: false,
        activeMarketExecutionAttempted: false,
      },
      executionDecision: {
        exactConfirmationRequiredKnown: true,
        exactConfirmationRedacted: true,
        activeMarketExecutionAttemptedByThisRoute: false,
        executionEligibleNow: false,
      },
      gaps: {
        p0: [],
      },
    },
  },
  localSettlementQueue: {
    ok: true,
    status: 200,
    body: {
      status: "ready",
      providerQuotaUsed: false,
      runtimeTruth: {
        readOnlyRoute: true,
        devOnlyRoute: true,
        usesDurableOfficialResultReviewRows: true,
        operatorQueueAvailable: true,
        redactedOperatorExecutionPlanAvailable: true,
        durableApprovalEvidenceAvailable: true,
        durableExecutionEvidenceAvailable: false,
        exactConfirmationStringsExposed: false,
        exactConfirmationStored: false,
        activeMarketExecutionAttempted: false,
      },
      queue: {
        itemCount: 1,
        pendingCount: 1,
        executableNowCount: 0,
        approvedWaitingForCloseCount: 1,
        items: [
          {
            reviewKey: "odds-api-single-soccer-test:phase-market:result-digest",
            eventSlug: "odds-api-single-soccer-test",
            marketId: "phase-market",
            approvalStatus: "approved",
            nextSafeAction: "wait_for_or_apply_market_close_before_execution",
            market: { status: "LIVE" },
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
            operatorAction: {
              label: "wait_for_market_close",
              blockingReason: "market_status_LIVE",
              nextCommand: "npm run mobile:one-event-settlement-preflight",
              exactConfirmationExposed: false,
              providerQuotaRequired: false,
              activeExecutionRequiresClosedMarket: true,
              activeExecutionRequiresApproval: true,
              activeExecutionRequiresExactConfirmation: true,
            },
          },
        ],
      },
      checks: {
        canonicalApprovalEvidenceForApprovedReviews: true,
        canonicalExecutionEvidenceForExecutedReviews: true,
      },
      gaps: {
        p0: [],
      },
    },
  },
});

const makeRuntimeStatus = (generatedAt = nowIso()) => ({
  generatedAt,
  pass: true,
  modeTruth: {
    latestSupervisorRunProfileOnly: true,
  },
  provenCapabilities: {
    repeatedSupervisorCycles: true,
    makerReseedWhileSupervisorRuns: true,
    lifecycleSchedulerWhileSupervisorRuns: true,
    resultIngestionWhileSupervisorRuns: true,
    resultSettlementSchedulerWhileSupervisorRuns: true,
    supervisorProviderRefreshQuotaProtected: true,
    resultPollingBackgroundProof: true,
    resultPollingContinuousWhileRunnerRuns: true,
    resultSettlementSchedulerWhilePollerRuns: true,
    installedOsService: false,
  },
  supervisor: {
    latestRunProfile: {
      makerSeedEnabled: false,
      lifecycleSchedulerEnabled: false,
      resultIngestionEnabled: false,
      resultSettlementEnabled: true,
      approvedResultSettlementEnabled: true,
      runProviderProof: false,
    },
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

const makeLaunchProfile = (generatedAt = nowIso()) => ({
  generatedAt,
  pass: true,
  launchProfiles: {
    recommendedInternalTesterProfile: {
      label: "User Startup fallback with backend, Expo, supervisor, result poller, result ingestion, settlement scheduling, and approved-settlement wait mode",
      command:
        "npm run mobile:local-runtime-startup -- -Action plan -StartSupervisor -StartResultPoller -RunResultIngestion -RunResultSettlement -RunApprovedResultSettlement",
      installCommand:
        "npm run mobile:local-runtime-startup -- -Action install -Apply -StartSupervisor -StartResultPoller -RunResultIngestion -RunResultSettlement -RunApprovedResultSettlement",
      quotaMode: "no provider quota unless provider/live-result flags are explicitly added",
      productionBoundary: "local Windows user-logon fallback, not a production service",
    },
    manualForegroundProfile: {
      commands: [
        {
          label: "start backend/expo plus supervisor and result poller",
          command:
            "npm run mobile:internal-tester-runtime -- -Action start -StartSupervisor -StartResultPoller -RunResultIngestion -RunResultSettlement -RunApprovedResultSettlement -WaitForReady",
          quotaMode: "no provider quota by default",
        },
      ],
    },
    scheduledTaskProfile: {
      usableInCurrentContext: false,
      currentContextNote: "Windows scheduled-task registration was denied in the current process context.",
    },
    liveProviderProfile: {
      defaultForInternalTesting: false,
      quotaMode: "requires THE_ODDS_API_KEY and is capped",
    },
  },
  runtimeTruth: {
    localOperatorLaunchProfileDocumented: true,
    startupFallbackRecommendedForCurrentWindowsContext: true,
    proofLeavesNoPersistentStartupLauncher: true,
    proofLeavesNoPersistentScheduledTask: true,
    noProviderQuotaSpentByDefaultProfile: true,
    activeTesterSettlementExecution: false,
    installedProductionService: false,
    fakeTokenOnly: true,
  },
  gaps: {
    p0: [],
    p1: ["not a production service"],
    p2: ["multi-event launch profile future work"],
  },
});

const makeActiveSettlementReadiness = (generatedAt = nowIso()) => ({
  generatedAt,
  pass: true,
  providerQuotaUsed: false,
  activeMarket: {
    status: "LIVE",
    event: { status: "ACTIVE" },
  },
  executionDecision: {
    executionEligibleNow: false,
    operatorDecision: "wait_for_or_apply_market_close_before_execution",
    blockers: ["market_not_closed_for_execution:LIVE"],
    exactConfirmationRequired: "SETTLE_FROM_RESULT:market-1:outcome-1:digest",
    marketMustBeClosed: true,
    activeMarketExecutionAttempted: false,
  },
  runtimeTruth: {
    disposableCloneSettlementProven: true,
    supervisorApprovedSettlementWaitProven: true,
  },
});

const makeActiveSettlementClosedEligibility = (generatedAt = nowIso()) => ({
  generatedAt,
  pass: true,
  providerQuotaUsed: false,
  closedStateDecision: {
    operatorDecisionWhenClosed: "eligible_for_exact_confirmation_execution_after_market_close",
  },
  runtimeTruth: {
    provesActiveEventClosedStateEligibility: true,
    activeEventSettlementExecuted: false,
    activeMarketRestored: true,
    providerQuotaUsed: false,
    exactApprovalStillRequiredForExecution: true,
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
    runtimeServiceHeartbeatFindUnique.mockReset();
    runtimeServiceHeartbeatUpsert.mockReset();
    runtimeServiceRunFindMany.mockReset();
    providerRefreshRunFindMany.mockReset();
    marketMakerQuoteRunFindMany.mockReset();
    referenceQuoteSnapshotFindMany.mockResolvedValue(freshSnapshot());
    runtimeServiceRunFindMany.mockResolvedValue(runtimeRunRows());
    providerRefreshRunFindMany.mockResolvedValue(providerRefreshRunRows());
    marketMakerQuoteRunFindMany.mockResolvedValue(marketMakerQuoteRunRows());
    runtimeServiceHeartbeatFindUnique.mockResolvedValue(null);
    runtimeServiceHeartbeatUpsert.mockImplementation(async (args) => ({
      id: "heartbeat-id",
      serviceKey: args.where.serviceKey,
      serviceName: args.create.serviceName,
      serviceKind: args.create.serviceKind,
      status: args.create.status,
      pid: args.create.pid,
      running: args.create.running,
      continuous: args.create.continuous,
      usesProviderQuota: args.create.usesProviderQuota,
      installedOsService: args.create.installedOsService,
      statePath: args.create.statePath,
      startedAt: args.create.startedAt,
      heartbeatAt: new Date("2026-07-12T18:00:00Z"),
      updatedAt: new Date("2026-07-12T18:00:01Z"),
      metadata: args.create.metadata,
    }));
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
      if (filePath.includes("runtime-status")) return JSON.stringify(makeRuntimeStatus());
      if (filePath.includes("phase-audit")) return JSON.stringify(makePhaseAudit());
      if (filePath.includes("watchdog")) return JSON.stringify(makeWatchdog());
      if (filePath.includes("local-runtime-launch-profile")) return JSON.stringify(makeLaunchProfile());
      if (filePath.includes("active-settlement-closed-eligibility")) return JSON.stringify(makeActiveSettlementClosedEligibility());
      if (filePath.includes("active-settlement-readiness")) return JSON.stringify(makeActiveSettlementReadiness());
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
    expect(status.providerRefreshRuns).toMatchObject({
      checked: true,
      durable: true,
      source: "ProviderRefreshRun",
      latestRunPassed: true,
      latestRunQuotaProtected: true,
      latestRunWithinBudget: true,
      latestRunReadyAfterRefresh: true,
      latestRunStaleBeforeRefresh: true,
      providerQuotaUsedByStatus: false,
      latest: expect.objectContaining({
        providerSource: "the-odds-api",
        referenceSource: "sportsbook-odds",
        status: "passed",
        mode: "bounded-live-provider-proof",
        eventSlug: "odds-api-single-soccer-test",
        selectedMarketId: "phase-market",
        quotaCost: 13,
        maxCredits: 16,
      }),
    });
    expect(providerRefreshRunFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          providerSource: "the-odds-api",
          referenceSource: "sportsbook-odds",
          eventSlug: "odds-api-single-soccer-test",
        },
      }),
    );
    expect(status.marketMakerQuoteRuns).toMatchObject({
      checked: true,
      durable: true,
      source: "MarketMakerQuoteRun",
      latestRunPassed: true,
      latestRunLocalOnly: true,
      latestRunShiftedWorseThanProvider: true,
      latestRunQuoteRouteReady: true,
      latestRunSnapshotFresh: true,
      recentRunCount: 2,
      repeatedLocalRunCount: 2,
      repeatedLocalRunsProven: true,
      installedOsService: false,
      latest: expect.objectContaining({
        marketId: "phase-market",
        outcomeId: "phase-outcome",
        status: "passed",
        mode: "seed-resting-shifted-maker-quotes",
        plannedBid: "0.47",
        plannedAsk: "0.55",
      }),
      recent: expect.arrayContaining([
        expect.objectContaining({
          metadata: expect.objectContaining({
            emittedBy: "scripts/seed_odds_api_live_shifted_maker.ts",
            localOnly: true,
          }),
        }),
      ]),
    });
    expect(marketMakerQuoteRunFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          marketId: "phase-market",
          providerSource: "sportsbook-odds",
        },
      }),
    );
    expect(referenceQuoteSnapshotFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { marketId: "phase-market" },
      }),
    );
    expect(status.gaps.p0).toEqual([]);
    expect(status.runtimeTruth.providerQuotaUsedByStatus).toBe(false);
    expect(status.runtimeTruth.activeEventClosedStateEligibilityProven).toBe(true);
    expect(status.phaseCompletion).toMatchObject({
      checked: true,
      pass: true,
      providerQuotaUsedByStatus: false,
      phaseCompleteForLocalInternalRuntime: true,
      fullProductionRuntimeComplete: false,
      installedUnattendedService: false,
      activeTesterSettlementExecutionAttempted: false,
      event: {
        title: "Spain vs France",
        providerEventId: "odds-api-event-1",
        localSlug: "odds-api-single-soccer-test",
      },
      answers: expect.objectContaining({
        marketMakerContinuous: "foreground supervisor only",
        oddsRefreshLiveOrReplay: "cached by default",
        staleHandling: "stale markets reject orders",
        lifecycle: "open paused closed proven",
        activeSettlement: "wait for closed market",
      }),
      checks: {
        internalTesterWatchdogKnown: true,
      },
      p0: [],
      p1: ["installed service remains open"],
      p2: [],
      note: expect.stringContaining("Read-only projection"),
    });
    expect(status.phaseCompletion.completionRequirementsPass).toBe(true);
    expect(status.phaseCompletion.completionRequirements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "marketMakerContinuity",
          pass: true,
          answer: "foreground supervisor only",
        }),
        expect.objectContaining({
          key: "oddsRefreshMode",
          pass: true,
          answer: "cached by default, live explicit",
        }),
        expect.objectContaining({
          key: "eventLifecycle",
          pass: true,
          answer: "open paused closed settlement known",
        }),
        expect.objectContaining({
          key: "runtimeLaunch",
          pass: true,
          answer: "runtime launch proof passed",
        }),
      ]),
    );
    expect(status.launchProfile).toMatchObject({
      checked: true,
      pass: true,
      recommendedInternalTesterProfile: expect.objectContaining({
        command:
          "npm run mobile:local-runtime-startup -- -Action plan -StartSupervisor -StartResultPoller -RunResultIngestion -RunResultSettlement -RunApprovedResultSettlement",
        quotaMode: "no provider quota unless provider/live-result flags are explicitly added",
        productionBoundary: "local Windows user-logon fallback, not a production service",
      }),
      manualForegroundProfile: {
        commands: expect.arrayContaining([
          expect.objectContaining({
            command:
              "npm run mobile:internal-tester-runtime -- -Action start -StartSupervisor -StartResultPoller -RunResultIngestion -RunResultSettlement -RunApprovedResultSettlement -WaitForReady",
          }),
        ]),
      },
      scheduledTaskProfile: expect.objectContaining({
        usableInCurrentContext: false,
      }),
      liveProviderProfile: expect.objectContaining({
        defaultForInternalTesting: false,
      }),
      runtimeTruth: expect.objectContaining({
        localOperatorLaunchProfileDocumented: true,
        noProviderQuotaSpentByDefaultProfile: true,
        activeTesterSettlementExecution: false,
        installedProductionService: false,
        fakeTokenOnly: true,
      }),
      p0: [],
      p1: ["not a production service"],
      p2: ["multi-event launch profile future work"],
      note: expect.stringContaining("Read-only projection"),
    });
    expect(status.operatorNextActions).toMatchObject({
      recommendedFirstAction: "cached_internal_testing",
      defaultNoQuotaAction: "cached_internal_testing",
      liveOddsAction: "none",
      nextProviderAction: "none",
      safety: expect.stringContaining("THE_ODDS_API_KEY"),
    });
    expect(status.operatorNextActions.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "cached_internal_testing",
          command: "npm run mobile:one-event-onboarding",
          requiresProviderKey: false,
          spendsProviderQuota: false,
        }),
        expect.objectContaining({
          id: "start_full_internal_tester_runtime",
          command:
            "npm run mobile:internal-tester-runtime -- -Action start -StartSupervisor -StartResultPoller -RunResultIngestion -RunResultSettlement -RunApprovedResultSettlement -WaitForReady",
          requiresProviderKey: false,
          spendsProviderQuota: false,
        }),
        expect.objectContaining({
          id: "prove_one_command_runtime_loops",
          command:
            "npm run mobile:one-event-onboarding -- -AllowDisconnectedS23 -StartRuntimeLoops -StopRuntimeLoopsAfterProof",
          requiresProviderKey: false,
          spendsProviderQuota: false,
        }),
        expect.objectContaining({
          id: "settlement_wait_for_closed_market",
          command: "npm run mobile:one-event-active-settlement-readiness",
          requiresProviderKey: false,
          spendsProviderQuota: false,
        }),
      ]),
    );
    expect(status.settlementDecision).toMatchObject({
      checked: true,
      pass: true,
      providerQuotaUsed: false,
      activeMarketStatus: "LIVE",
      activeEventStatus: "ACTIVE",
      executionEligibleNow: false,
      operatorDecision: "wait_for_or_apply_market_close_before_execution",
      blockers: ["market_not_closed_for_execution:LIVE"],
      marketMustBeClosed: true,
      exactConfirmationRequiredKnown: true,
      activeMarketExecutionAttempted: false,
      closedStateEligibilityProven: true,
      closedStateEligibility: {
        checked: true,
        pass: true,
        providerQuotaUsed: false,
        provesEligibilityAfterClose: true,
        operatorDecisionWhenClosed: "eligible_for_exact_confirmation_execution_after_market_close",
        activeEventSettlementExecuted: false,
        activeMarketRestored: true,
        exactApprovalStillRequiredForExecution: true,
      },
      disposableCloneSettlementProven: true,
      supervisorApprovedSettlementWaitProven: true,
      nextSafeAction: "wait_for_or_apply_market_close_before_execution",
    });
    expect(status.resultReview).toMatchObject({
      checked: true,
      pass: true,
      providerQuotaUsed: false,
      readOnlyRoute: true,
      devOnlyRoute: true,
      canonicalProviderResultAuditAvailable: true,
      canonicalSettlementPreflightAuditAvailable: true,
      canonicalSettlementApprovalAuditAvailable: true,
      durableOfficialResultReviewRecordAvailable: true,
      officialResultReview: {
        reviewKey: "odds-api-single-soccer-test:phase-market:result-digest",
        exactConfirmationStored: false,
        providerQuotaUsed: false,
        activeMarketExecutionAttempted: false,
      },
      exactConfirmationRequiredKnown: true,
      exactConfirmationRedacted: true,
      activeMarketExecutionAttemptedByRoute: false,
      p0: [],
      nextSafeAction: "wait_for_or_apply_market_close_before_execution",
    });
    expect(status.settlementQueue).toMatchObject({
      checked: true,
      pass: true,
      providerQuotaUsed: false,
      readOnlyRoute: true,
      devOnlyRoute: true,
      operatorQueueAvailable: true,
      redactedOperatorExecutionPlanAvailable: true,
      durableApprovalEvidenceAvailable: true,
      durableExecutionEvidenceAvailable: false,
      exactConfirmationStringsExposed: false,
      exactConfirmationStored: false,
      activeMarketExecutionAttempted: false,
      queue: {
        itemCount: 1,
        pendingCount: 1,
        executableNowCount: 0,
        approvedWaitingForCloseCount: 1,
      },
      firstItem: {
        reviewKey: "odds-api-single-soccer-test:phase-market:result-digest",
        eventSlug: "odds-api-single-soccer-test",
        marketId: "phase-market",
        approvalStatus: "approved",
        nextSafeAction: "wait_for_or_apply_market_close_before_execution",
        marketStatus: "LIVE",
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
        operatorAction: {
          label: "wait_for_market_close",
          blockingReason: "market_status_LIVE",
          nextCommand: "npm run mobile:one-event-settlement-preflight",
          exactConfirmationExposed: false,
          providerQuotaRequired: false,
          activeExecutionRequiresClosedMarket: true,
          activeExecutionRequiresApproval: true,
          activeExecutionRequiresExactConfirmation: true,
        },
      },
      p0: [],
    });
    expect(JSON.stringify(status.settlementQueue)).not.toContain("SETTLE_FROM_RESULT:");
    expect(status.runtimeCapabilities).toMatchObject({
      latestRunProfileOnly: true,
      latestSupervisorProfile: {
        makerSeedEnabled: false,
        lifecycleSchedulerEnabled: false,
        resultIngestionEnabled: false,
        resultSettlementEnabled: true,
        approvedResultSettlementEnabled: true,
        runProviderProof: false,
      },
      provenCapabilities: {
        repeatedSupervisorCycles: true,
        makerReseedWhileSupervisorRuns: true,
        lifecycleSchedulerWhileSupervisorRuns: true,
        resultIngestionWhileSupervisorRuns: true,
        resultSettlementSchedulerWhileSupervisorRuns: true,
        supervisorProviderRefreshQuotaProtected: true,
        resultPollingBackgroundProof: true,
        resultPollingContinuousWhileRunnerRuns: true,
        resultSettlementSchedulerWhilePollerRuns: true,
        installedOsService: false,
      },
      currentProcessState: {
        anyLoopRunning: false,
        quotaSpendingLoopRunning: false,
      },
      note: expect.stringContaining("latestSupervisorProfile"),
    });
    expect(status.currentRuntimeState).toMatchObject({
      checked: true,
      mode: "proven_capability_loops_stopped",
      localCapabilityReady: true,
      warmNoQuotaRuntime: false,
      allLoopsRunning: false,
      anyLoopRunning: false,
      supervisorRunning: false,
      resultPollerRunning: false,
      quotaSpendingLoopRunning: false,
      backendProofFresh: true,
      providerSnapshotFresh: true,
      testerReadyRightNow: false,
      p0: [],
      p1: expect.arrayContaining(["supervisor_loop_not_running_now", "result_poller_loop_not_running_now"]),
      nextAction: "start_internal_tester_runtime_with_supervisor_and_result_poller",
    });
    expect(status.serviceOwnership).toMatchObject({
      checked: true,
      serviceModel: "local_foreground_worker_processes",
      productionServiceInstalled: false,
      installedOsService: false,
      foregroundSupervisorProven: true,
      foregroundResultPollerProven: true,
      foregroundLoopsProven: true,
      marketMakerContinuity: "continuous_while_one_event_supervisor_process_runs",
      providerRefreshContinuity: "explicit_quota_capped_live_refresh_or_cached_replay",
      resultPollingContinuity: "continuous_while_one_event_result_poller_process_runs",
      current: {
        mode: "proven_capability_loops_stopped",
        supervisorRunning: false,
        resultPollerRunning: false,
        allLoopsRunning: false,
        quotaSpendingLoopRunning: false,
        testerReadyRightNow: false,
      },
      liveProviderMode: {
        statusRouteSpendsProviderQuota: false,
        defaultInternalTesterModeSpendsProviderQuota: false,
        requiresExplicitProviderFlag: true,
        requiresTheOddsApiKeyForLiveProviderCalls: true,
      },
      localLaunch: {
        recommendedProfileLabel:
          "User Startup fallback with backend, Expo, supervisor, result poller, result ingestion, settlement scheduling, and approved-settlement wait mode",
        scheduledTaskUsableInCurrentContext: false,
        scheduledTaskContextNote: "Windows scheduled-task registration was denied in the current process context.",
      },
      durableEvidence: {
        providerRefreshRunRecorded: true,
        providerRefreshQuotaProtected: true,
        marketMakerQuoteRunRecorded: true,
        marketMakerQuoteRunLocalOnly: true,
        runtimeHeartbeatsRecorded: true,
        runtimeRunsRecorded: true,
        runtimeRunsPassed: true,
      },
      p0: [],
      p1: expect.arrayContaining([
        "installed_unattended_service_not_present",
        "supervisor_loop_not_running_now",
        "result_poller_loop_not_running_now",
      ]),
      nextAction: "start_internal_tester_runtime_with_supervisor_and_result_poller",
    });
    expect(status.serviceOwnership.localLaunch.manualForegroundCommands).toContain(
      "npm run mobile:internal-tester-runtime -- -Action start -StartSupervisor -StartResultPoller -RunResultIngestion -RunResultSettlement -RunApprovedResultSettlement -WaitForReady",
    );
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
    expect(status.runtimeHeartbeats).toMatchObject({
      checked: true,
      durable: true,
      source: "RuntimeServiceHeartbeat",
      allExpectedServicesRecorded: true,
      quotaSpendingHeartbeatRunning: false,
      installedOsService: false,
      records: expect.arrayContaining([
        expect.objectContaining({
          serviceKey: "local:one-event-live-supervisor",
          serviceName: "one-event-live-supervisor",
          serviceKind: "supervisor",
          status: "stopped",
          running: false,
          usesProviderQuota: false,
          installedOsService: false,
        }),
        expect.objectContaining({
          serviceKey: "local:one-event-result-poller",
          serviceName: "one-event-result-poller",
          serviceKind: "result-poller",
          status: "stopped",
          running: false,
          usesProviderQuota: false,
          installedOsService: false,
        }),
      ]),
    });
    expect(status.runtimeRuns).toMatchObject({
      checked: true,
      durable: true,
      source: "RuntimeServiceRun",
      allExpectedServicesRecorded: true,
      allExpectedServicesPassed: true,
      quotaSpendingRunRecorded: false,
      activeSettlementExecuted: false,
      installedOsService: false,
      workerOwnedRunCount: 2,
      records: expect.arrayContaining([
        expect.objectContaining({
          serviceKey: "local:one-event-live-supervisor",
          serviceName: "one-event-live-supervisor",
          serviceKind: "supervisor",
          status: "passed",
          providerQuotaUsed: false,
          activeSettlementExecuted: false,
          installedOsService: false,
        }),
        expect.objectContaining({
          serviceKey: "local:one-event-result-poller",
          serviceName: "one-event-result-poller",
          serviceKind: "result-poller",
          status: "passed",
          providerQuotaUsed: false,
          activeSettlementExecuted: false,
          installedOsService: false,
        }),
      ]),
    });
    expect(runtimeServiceHeartbeatUpsert).toHaveBeenCalledTimes(2);
    expect(runtimeServiceRunFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          serviceKey: {
            in: ["local:one-event-live-supervisor", "local:one-event-result-poller"],
          },
        },
      }),
    );
  });

  test("returns needs_attention when the settlement queue redacted operator plan is missing", async () => {
    readFile.mockImplementation(async (filePath: string) => {
      if (filePath.includes("completion-audit")) return JSON.stringify(makeCompletionAudit());
      if (filePath.includes("runtime-status")) return JSON.stringify(makeRuntimeStatus());
      if (filePath.includes("phase-audit")) {
        const phaseAudit = makePhaseAudit();
        phaseAudit.localSettlementQueue.body.runtimeTruth.redactedOperatorExecutionPlanAvailable = false;
        phaseAudit.localSettlementQueue.body.queue.items[0].operatorAction.nextCommand = undefined as unknown as string;
        return JSON.stringify(phaseAudit);
      }
      if (filePath.includes("watchdog")) return JSON.stringify(makeWatchdog());
      if (filePath.includes("local-runtime-launch-profile")) return JSON.stringify(makeLaunchProfile());
      if (filePath.includes("active-settlement-closed-eligibility")) return JSON.stringify(makeActiveSettlementClosedEligibility());
      if (filePath.includes("active-settlement-readiness")) return JSON.stringify(makeActiveSettlementReadiness());
      if (filePath.includes("supervisor-process-state")) return JSON.stringify(makeSupervisorState());
      if (filePath.includes("result-poller-process-state")) return JSON.stringify(makeResultPollerState());
      throw new Error(`unexpected path ${filePath}`);
    });

    const status = await getLocalLiveRuntimeStatus();

    expect(status.status).toBe("needs_attention");
    expect(status.settlementQueue).toMatchObject({
      checked: true,
      pass: false,
      redactedOperatorExecutionPlanAvailable: false,
      firstItem: {
        operatorAction: {
          label: "wait_for_market_close",
          nextCommand: null,
          exactConfirmationExposed: false,
          providerQuotaRequired: false,
        },
      },
    });
  });

  test("returns needs_attention when a runtime completion requirement fails", async () => {
    readFile.mockImplementation(async (filePath: string) => {
      if (filePath.includes("completion-audit")) {
        const completionAudit = makeCompletionAudit();
        completionAudit.completionRequirements.oddsRefreshMode.pass = false;
        completionAudit.completionRequirements.oddsRefreshMode.answer = "live refresh evidence missing";
        return JSON.stringify(completionAudit);
      }
      if (filePath.includes("runtime-status")) return JSON.stringify(makeRuntimeStatus());
      if (filePath.includes("phase-audit")) return JSON.stringify(makePhaseAudit());
      if (filePath.includes("watchdog")) return JSON.stringify(makeWatchdog());
      if (filePath.includes("local-runtime-launch-profile")) return JSON.stringify(makeLaunchProfile());
      if (filePath.includes("active-settlement-closed-eligibility")) return JSON.stringify(makeActiveSettlementClosedEligibility());
      if (filePath.includes("active-settlement-readiness")) return JSON.stringify(makeActiveSettlementReadiness());
      if (filePath.includes("supervisor-process-state")) return JSON.stringify(makeSupervisorState());
      if (filePath.includes("result-poller-process-state")) return JSON.stringify(makeResultPollerState());
      throw new Error(`unexpected path ${filePath}`);
    });

    const status = await getLocalLiveRuntimeStatus();

    expect(status.status).toBe("needs_attention");
    expect(status.gaps.p0).toContain("completion_requirements_missing_or_failed");
    expect(status.phaseCompletion.completionRequirementsPass).toBe(false);
    expect(status.phaseCompletion.completionRequirements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "oddsRefreshMode",
          pass: false,
          answer: "live refresh evidence missing",
        }),
      ]),
    );
  });

  test("returns needs_attention when a required proof artifact is stale", async () => {
    readFile.mockImplementation(async (filePath: string) => {
      if (filePath.includes("completion-audit")) return JSON.stringify(makeCompletionAudit(staleIso()));
      if (filePath.includes("runtime-status")) return JSON.stringify(makeRuntimeStatus());
      if (filePath.includes("phase-audit")) return JSON.stringify(makePhaseAudit());
      if (filePath.includes("watchdog")) return JSON.stringify(makeWatchdog());
      if (filePath.includes("local-runtime-launch-profile")) return JSON.stringify(makeLaunchProfile());
      if (filePath.includes("active-settlement-closed-eligibility")) return JSON.stringify(makeActiveSettlementClosedEligibility());
      if (filePath.includes("active-settlement-readiness")) return JSON.stringify(makeActiveSettlementReadiness());
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
      if (filePath.includes("runtime-status")) return JSON.stringify(makeRuntimeStatus());
      if (filePath.includes("phase-audit")) return JSON.stringify(makePhaseAudit());
      if (filePath.includes("watchdog")) return JSON.stringify(makeWatchdog());
      if (filePath.includes("local-runtime-launch-profile")) return JSON.stringify(makeLaunchProfile());
      if (filePath.includes("active-settlement-closed-eligibility")) return JSON.stringify(makeActiveSettlementClosedEligibility());
      if (filePath.includes("active-settlement-readiness")) return JSON.stringify(makeActiveSettlementReadiness());
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
      if (filePath.includes("runtime-status")) return JSON.stringify(makeRuntimeStatus());
      if (filePath.includes("phase-audit")) return JSON.stringify(makePhaseAudit());
      if (filePath.includes("watchdog")) return JSON.stringify(makeWatchdog());
      if (filePath.includes("local-runtime-launch-profile")) return JSON.stringify(makeLaunchProfile());
      if (filePath.includes("active-settlement-closed-eligibility")) return JSON.stringify(makeActiveSettlementClosedEligibility());
      if (filePath.includes("active-settlement-readiness")) return JSON.stringify(makeActiveSettlementReadiness());
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
      if (filePath.includes("runtime-status")) return JSON.stringify(makeRuntimeStatus());
      if (filePath.includes("phase-audit")) return JSON.stringify(makePhaseAudit());
      if (filePath.includes("watchdog")) return JSON.stringify(makeWatchdog());
      if (filePath.includes("local-runtime-launch-profile")) return JSON.stringify(makeLaunchProfile());
      if (filePath.includes("active-settlement-closed-eligibility")) return JSON.stringify(makeActiveSettlementClosedEligibility());
      if (filePath.includes("active-settlement-readiness")) return JSON.stringify(makeActiveSettlementReadiness());
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
    expect(status.operatorNextActions).toMatchObject({
      recommendedFirstAction: "refresh_mobile_live_odds",
      defaultNoQuotaAction: "cached_internal_testing",
      liveOddsAction: "refresh_mobile_live_odds",
      nextProviderAction: "refresh_provider_snapshots",
    });
    expect(status.operatorNextActions.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "refresh_mobile_live_odds",
          command: "npm run mobile:one-event-live-runtime:provider",
          requiresProviderKey: true,
          spendsProviderQuota: true,
        }),
      ]),
    );
  });

  test("keeps cached internal testing as default when mobile odds are stale but local proof window is fresh", async () => {
    referenceQuoteSnapshotFindMany.mockResolvedValue(mobileStaleButLocallyFreshSnapshot());
    readFile.mockImplementation(async (filePath: string) => {
      if (filePath.includes("completion-audit")) return JSON.stringify(makeCompletionAudit());
      if (filePath.includes("runtime-status")) return JSON.stringify(makeRuntimeStatus());
      if (filePath.includes("phase-audit")) return JSON.stringify(makePhaseAudit());
      if (filePath.includes("watchdog")) return JSON.stringify(makeWatchdog());
      if (filePath.includes("local-runtime-launch-profile")) return JSON.stringify(makeLaunchProfile());
      if (filePath.includes("active-settlement-closed-eligibility")) return JSON.stringify(makeActiveSettlementClosedEligibility());
      if (filePath.includes("active-settlement-readiness")) return JSON.stringify(makeActiveSettlementReadiness());
      if (filePath.includes("supervisor-process-state")) return JSON.stringify(makeSupervisorState());
      if (filePath.includes("result-poller-process-state")) return JSON.stringify(makeResultPollerState());
      throw new Error(`unexpected path ${filePath}`);
    });

    const status = await getLocalLiveRuntimeStatus();

    expect(status.status).toBe("ready");
    expect(status.providerSnapshots).toMatchObject({
      fresh: true,
      mobileRouteFresh: false,
      mobileRouteRefreshDue: false,
      mobileRouteStale: true,
      mobileLifecycleStatus: "stale",
      nextProviderAction: "refresh_provider_snapshots_or_keep_cached_test_mode",
    });
    expect(status.operatorNextActions).toMatchObject({
      recommendedFirstAction: "cached_internal_testing",
      defaultNoQuotaAction: "cached_internal_testing",
      liveOddsAction: "refresh_mobile_live_odds",
      nextProviderAction: "refresh_provider_snapshots_or_keep_cached_test_mode",
    });
    expect(status.operatorNextActions.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "cached_internal_testing",
          spendsProviderQuota: false,
        }),
        expect.objectContaining({
          id: "refresh_mobile_live_odds",
          spendsProviderQuota: true,
        }),
      ]),
    );
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
      if (filePath.includes("runtime-status")) return JSON.stringify(makeRuntimeStatus());
      if (filePath.includes("phase-audit")) return JSON.stringify(makePhaseAudit());
      if (filePath.includes("watchdog")) return JSON.stringify(makeWatchdog());
      if (filePath.includes("local-runtime-launch-profile")) return JSON.stringify(makeLaunchProfile());
      if (filePath.includes("active-settlement-closed-eligibility")) return JSON.stringify(makeActiveSettlementClosedEligibility());
      if (filePath.includes("active-settlement-readiness")) return JSON.stringify(makeActiveSettlementReadiness());
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
    expect(status.runtimeHeartbeats).toMatchObject({
      quotaSpendingHeartbeatRunning: true,
      records: expect.arrayContaining([
        expect.objectContaining({
          serviceKey: "local:one-event-live-supervisor",
          status: "running",
          running: true,
          usesProviderQuota: true,
          installedOsService: false,
        }),
      ]),
    });
  });
});
