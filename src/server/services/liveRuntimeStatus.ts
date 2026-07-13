import fs from "node:fs/promises";
import { prisma } from "@/lib/db";
import { writeRuntimeServiceHeartbeat } from "@/server/services/runtimeServiceHeartbeat";

const COMPLETION_AUDIT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json";
const RUNTIME_STATUS_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json";
const PHASE_AUDIT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json";
const WATCHDOG_PATH =
  "docs/mobile/harness/odds-api-live-runtime/internal-tester-watchdog-summary.redacted.json";
const LOCAL_RUNTIME_LAUNCH_PROFILE_PATH =
  "docs/mobile/harness/odds-api-live-runtime/local-runtime-launch-profile-summary.redacted.json";
const ACTIVE_SETTLEMENT_READINESS_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-readiness-summary.redacted.json";
const ACTIVE_SETTLEMENT_CLOSED_ELIGIBILITY_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-closed-eligibility-summary.redacted.json";
const SUPERVISOR_STATE_PATH = ".runtime/one-event-live-supervisor/supervisor-process-state.json";
const RESULT_POLLER_STATE_PATH = ".runtime/one-event-result-poller/result-poller-process-state.json";
const MOBILE_REFRESH_DUE_SECONDS = 60;
const MOBILE_STALE_AFTER_SECONDS = 90;

type JsonObject = Record<string, unknown>;

const readJson = async (filePath: string): Promise<JsonObject | null> => {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as JsonObject;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
};

const getPath = (source: unknown, keys: string[]) => {
  let cursor = source;
  for (const key of keys) {
    if (!cursor || typeof cursor !== "object" || !(key in cursor)) return null;
    cursor = (cursor as JsonObject)[key];
  }
  return cursor;
};

const asStringArray = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);

const pass = (value: JsonObject | null) => value?.pass === true || value?.result === "pass";

const ageHours = (generatedAt: unknown) => {
  if (typeof generatedAt !== "string") return null;
  const parsed = Date.parse(generatedAt);
  if (!Number.isFinite(parsed)) return null;
  return Number(((Date.now() - parsed) / 3_600_000).toFixed(2));
};

const numberValue = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);

const stringValue = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : null);

const booleanValue = (value: unknown) => (typeof value === "boolean" ? value : null);

const objectValue = (value: unknown): JsonObject =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};

const completionRequirementEntries = (completionAudit: JsonObject | null) =>
  Object.entries(objectValue(getPath(completionAudit, ["completionRequirements"]))).map(([key, value]) => ({
    key,
    ...(objectValue(value) as {
      pass?: unknown;
      answer?: unknown;
      evidence?: unknown;
    }),
  }));

const completionRequirementsPass = (completionAudit: JsonObject | null) => {
  const entries = completionRequirementEntries(completionAudit);
  return entries.length > 0 && entries.every((entry) => entry.pass === true);
};

const pidRunning = (pid: number | null) => {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
};

async function getManagedProcessStatus(params: {
  statePath: string;
  kind: "supervisor" | "result-poller";
}) {
  const state = await readJson(params.statePath);
  const pid = numberValue(state?.pid);
  const running = pidRunning(pid);
  const continuous = booleanValue(state?.continuous);
  const runProviderProof = booleanValue(state?.runProviderProof);
  const runLiveResultIngestion = booleanValue(state?.runLiveResultIngestion);
  const providerProofEveryIterations = numberValue(state?.providerProofEveryIterations);
  const maxProviderProofRuns = numberValue(state?.maxProviderProofRuns);
  const refreshIterations = numberValue(state?.refreshIterations);
  const maxCreditsPerProviderProof = numberValue(state?.maxCreditsPerProviderProof);
  const minRemaining = numberValue(state?.minRemaining);

  return {
    kind: params.kind,
    checked: true,
    statePath: params.statePath,
    known: state != null,
    pid,
    running,
    startedAt: stringValue(state?.startedAt),
    continuous,
    maxIterations: numberValue(state?.maxIterations),
    intervalSeconds: numberValue(state?.intervalSeconds),
    providerProofEveryIterations,
    maxProviderProofRuns,
    refreshIterations,
    maxCreditsPerProviderProof,
    minRemaining,
    usesProviderQuota:
      params.kind === "supervisor"
        ? runProviderProof === true || runLiveResultIngestion === true
        : runLiveResultIngestion === true,
    modes:
      params.kind === "supervisor"
        ? {
            providerProof: runProviderProof === true,
            staleGuard: booleanValue(state?.runStaleGuard) === true,
            staleGuardEnforced: booleanValue(state?.enforceStaleGuard) === true,
            liveResultIngestion: runLiveResultIngestion === true,
            approvedResultSettlement: booleanValue(state?.runApprovedResultSettlement) === true,
          }
        : {
            liveResultIngestion: runLiveResultIngestion === true,
            approvedResultSettlement: booleanValue(state?.runApprovedResultSettlement) === true,
          },
  };
}

async function upsertRuntimeHeartbeat(processStatus: Awaited<ReturnType<typeof getManagedProcessStatus>>) {
  const serviceName =
    processStatus.kind === "supervisor" ? "one-event-live-supervisor" : "one-event-result-poller";
  const status = processStatus.running ? "running" : processStatus.known ? "stopped" : "unknown";
  return writeRuntimeServiceHeartbeat({
    serviceName,
    serviceKind: processStatus.kind,
    status,
    pid: processStatus.pid,
    running: processStatus.running,
    continuous: processStatus.continuous,
    usesProviderQuota: processStatus.usesProviderQuota,
    installedOsService: false,
    statePath: processStatus.statePath,
    startedAt: processStatus.startedAt,
    source: "local-runtime-status-route",
    metadata: {
      checked: processStatus.checked,
      known: processStatus.known,
      maxIterations: processStatus.maxIterations,
      intervalSeconds: processStatus.intervalSeconds,
      providerProofEveryIterations: processStatus.providerProofEveryIterations,
      maxProviderProofRuns: processStatus.maxProviderProofRuns,
      refreshIterations: processStatus.refreshIterations,
      maxCreditsPerProviderProof: processStatus.maxCreditsPerProviderProof,
      minRemaining: processStatus.minRemaining,
      modes: processStatus.modes,
    },
  });
}

const compactRuntimeRunRow = (row: {
  runKey: string;
  serviceKey: string;
  serviceName: string;
  serviceKind: string;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  iterationCount: number;
  providerQuotaUsed: boolean;
  activeSettlementExecuted: boolean;
  installedOsService: boolean;
  eventSlug: string | null;
  selectedMarketId: string | null;
  resultAction: string | null;
  summaryPath: string | null;
  updatedAt: Date;
  metadata: unknown;
}) => ({
  runKey: row.runKey,
  serviceKey: row.serviceKey,
  serviceName: row.serviceName,
  serviceKind: row.serviceKind,
  status: row.status,
  startedAt: row.startedAt.toISOString(),
  finishedAt: row.finishedAt?.toISOString() ?? null,
  durationMs: row.durationMs,
  iterationCount: row.iterationCount,
  providerQuotaUsed: row.providerQuotaUsed,
  activeSettlementExecuted: row.activeSettlementExecuted,
  installedOsService: row.installedOsService,
  eventSlug: row.eventSlug,
  selectedMarketId: row.selectedMarketId,
  resultAction: row.resultAction,
  summaryPath: row.summaryPath,
  updatedAt: row.updatedAt.toISOString(),
  metadata: {
    source: stringValue(objectValue(row.metadata).source),
    workerOwned: objectValue(row.metadata).workerOwned === true,
    emittedBy: stringValue(objectValue(row.metadata).emittedBy),
  },
});

async function getLatestRuntimeRuns() {
  const rows = await prisma.runtimeServiceRun.findMany({
    where: {
      serviceKey: {
        in: ["local:one-event-live-supervisor", "local:one-event-result-poller"],
      },
    },
    orderBy: { startedAt: "desc" },
    take: 10,
  });
  const latestByService = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!latestByService.has(row.serviceKey)) latestByService.set(row.serviceKey, row);
  }
  return Array.from(latestByService.values()).map(compactRuntimeRunRow);
}

const compactProviderRefreshRunRow = (row: {
  runKey: string;
  providerSource: string;
  referenceSource: string;
  status: string;
  mode: string;
  startedAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  eventSlug: string | null;
  providerEventId: string | null;
  sportKey: string | null;
  selectedMarketId: string | null;
  selectedOutcomeId: string | null;
  refreshIterations: number;
  providerCallCount: number;
  quotaCost: number;
  requestsRemaining: string | null;
  maxCredits: number | null;
  minRemaining: number | null;
  marketCount: number;
  outcomeCount: number;
  snapshotCount: number;
  staleBeforeRefresh: boolean;
  readyAfterRefresh: boolean;
  updatedAt: Date;
  metadata: unknown;
}) => ({
  runKey: row.runKey,
  providerSource: row.providerSource,
  referenceSource: row.referenceSource,
  status: row.status,
  mode: row.mode,
  startedAt: row.startedAt.toISOString(),
  finishedAt: row.finishedAt?.toISOString() ?? null,
  durationMs: row.durationMs,
  eventSlug: row.eventSlug,
  providerEventId: row.providerEventId,
  sportKey: row.sportKey,
  selectedMarketId: row.selectedMarketId,
  selectedOutcomeId: row.selectedOutcomeId,
  refreshIterations: row.refreshIterations,
  providerCallCount: row.providerCallCount,
  quotaCost: row.quotaCost,
  requestsRemaining: row.requestsRemaining,
  maxCredits: row.maxCredits,
  minRemaining: row.minRemaining,
  marketCount: row.marketCount,
  outcomeCount: row.outcomeCount,
  snapshotCount: row.snapshotCount,
  staleBeforeRefresh: row.staleBeforeRefresh,
  readyAfterRefresh: row.readyAfterRefresh,
  updatedAt: row.updatedAt.toISOString(),
  metadata: {
    source: stringValue(objectValue(row.metadata).source),
    emittedBy: stringValue(objectValue(row.metadata).emittedBy),
    quotaProtected: objectValue(row.metadata).quotaProtected === true,
  },
});

async function getLatestProviderRefreshRun(eventSlug: string | null) {
  const rows = await prisma.providerRefreshRun.findMany({
    where: {
      providerSource: "the-odds-api",
      referenceSource: "sportsbook-odds",
      ...(eventSlug ? { eventSlug } : {}),
    },
    orderBy: { startedAt: "desc" },
    take: 1,
  });
  return rows[0] ? compactProviderRefreshRunRow(rows[0]) : null;
}

const compactMarketMakerQuoteRunRow = (row: {
  runKey: string;
  marketId: string;
  outcomeId: string;
  eventSlug: string | null;
  status: string;
  mode: string;
  startedAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  makerUserId: string | null;
  bidOrderId: string | null;
  askOrderId: string | null;
  providerSource: string;
  referenceBid: { toString(): string } | null;
  referenceAsk: { toString(): string } | null;
  outcomePrice: { toString(): string } | null;
  plannedBid: { toString(): string } | null;
  plannedAsk: { toString(): string } | null;
  quoteOffsetTicks: number;
  size: { toString(): string } | null;
  mintQuantity: { toString(): string } | null;
  canceledOrderCount: number;
  restingOrderCount: number;
  quoteRouteStatus: number | null;
  shiftedBidWorseThanProvider: boolean;
  shiftedAskWorseThanProvider: boolean;
  quoteRouteShowsBid: boolean;
  quoteRouteShowsAsk: boolean;
  snapshotFresh: boolean;
  installedOsService: boolean;
  updatedAt: Date;
  metadata: unknown;
}) => ({
  runKey: row.runKey,
  marketId: row.marketId,
  outcomeId: row.outcomeId,
  eventSlug: row.eventSlug,
  status: row.status,
  mode: row.mode,
  startedAt: row.startedAt.toISOString(),
  finishedAt: row.finishedAt?.toISOString() ?? null,
  durationMs: row.durationMs,
  makerUserId: row.makerUserId,
  bidOrderId: row.bidOrderId,
  askOrderId: row.askOrderId,
  providerSource: row.providerSource,
  referenceBid: row.referenceBid?.toString() ?? null,
  referenceAsk: row.referenceAsk?.toString() ?? null,
  outcomePrice: row.outcomePrice?.toString() ?? null,
  plannedBid: row.plannedBid?.toString() ?? null,
  plannedAsk: row.plannedAsk?.toString() ?? null,
  quoteOffsetTicks: row.quoteOffsetTicks,
  size: row.size?.toString() ?? null,
  mintQuantity: row.mintQuantity?.toString() ?? null,
  canceledOrderCount: row.canceledOrderCount,
  restingOrderCount: row.restingOrderCount,
  quoteRouteStatus: row.quoteRouteStatus,
  shiftedBidWorseThanProvider: row.shiftedBidWorseThanProvider,
  shiftedAskWorseThanProvider: row.shiftedAskWorseThanProvider,
  quoteRouteShowsBid: row.quoteRouteShowsBid,
  quoteRouteShowsAsk: row.quoteRouteShowsAsk,
  snapshotFresh: row.snapshotFresh,
  installedOsService: row.installedOsService,
  updatedAt: row.updatedAt.toISOString(),
  metadata: {
    source: stringValue(objectValue(row.metadata).source),
    emittedBy: stringValue(objectValue(row.metadata).emittedBy),
    localOnly: objectValue(row.metadata).localOnly === true,
  },
});

async function getRecentMarketMakerQuoteRuns(marketId: string | null) {
  const rows = await prisma.marketMakerQuoteRun.findMany({
    where: {
      ...(marketId ? { marketId } : {}),
      providerSource: "sportsbook-odds",
    },
    orderBy: { startedAt: "desc" },
    take: 5,
  });
  return rows.map(compactMarketMakerQuoteRunRow);
}

async function getProviderSnapshotFreshness(params: {
  marketId: string | null;
  maxAgeHours: number | null;
}) {
  if (!params.marketId) {
    return {
      checked: false,
      fresh: false,
      marketId: null,
      reason: "missing_selected_market_id",
      snapshotCount: 0,
      latestFetchedAt: null,
      latestAgeHours: null,
      maxAgeHours: params.maxAgeHours,
      sources: [],
      acceptingOrderSnapshotCount: 0,
      mmEligibleSnapshotCount: 0,
    };
  }

  const snapshots = await prisma.referenceQuoteSnapshot.findMany({
    where: { marketId: params.marketId },
    select: {
      source: true,
      fetchedAt: true,
      acceptingOrders: true,
      mmEligible: true,
      qualityStatus: true,
      reason: true,
    },
    orderBy: { fetchedAt: "desc" },
  });
  const latest = snapshots[0] ?? null;
  const latestAgeHours = latest ? Number(((Date.now() - latest.fetchedAt.getTime()) / 3_600_000).toFixed(2)) : null;
  const latestAgeSeconds = latest ? Math.max(0, Math.round((Date.now() - latest.fetchedAt.getTime()) / 1000)) : null;
  const fresh =
    snapshots.length > 0 &&
    typeof latestAgeHours === "number" &&
    typeof params.maxAgeHours === "number" &&
    latestAgeHours <= params.maxAgeHours;
  const mobileLifecycleStatus =
    latestAgeSeconds == null
      ? "unavailable"
      : latestAgeSeconds > MOBILE_STALE_AFTER_SECONDS
        ? "stale"
        : latestAgeSeconds >= MOBILE_REFRESH_DUE_SECONDS
          ? "refresh_due"
          : "ready";
  const mobileRouteFresh = mobileLifecycleStatus === "ready";
  const mobileRouteRefreshDue = mobileLifecycleStatus === "refresh_due";
  const mobileRouteStale = mobileLifecycleStatus === "stale";
  const sources = Array.from(new Set(snapshots.map((snapshot) => snapshot.source))).sort();

  return {
    checked: true,
    fresh,
    freshnessBasis: "local_proof_window",
    marketId: params.marketId,
    reason: snapshots.length === 0 ? "missing_provider_snapshots" : fresh ? null : "provider_snapshots_stale",
    snapshotCount: snapshots.length,
    latestFetchedAt: latest?.fetchedAt.toISOString() ?? null,
    latestAgeHours,
    latestAgeSeconds,
    maxAgeHours: params.maxAgeHours,
    sources,
    acceptingOrderSnapshotCount: snapshots.filter((snapshot) => snapshot.acceptingOrders).length,
    mmEligibleSnapshotCount: snapshots.filter((snapshot) => snapshot.mmEligible).length,
    latestQualityStatus: latest?.qualityStatus ?? null,
    latestReason: latest?.reason ?? null,
    mobileRouteFresh,
    mobileRouteRefreshDue,
    mobileRouteStale,
    mobileLifecycleStatus,
    mobileRefreshDueSeconds: MOBILE_REFRESH_DUE_SECONDS,
    mobileStaleAfterSeconds: MOBILE_STALE_AFTER_SECONDS,
    mobileRefreshDueAt: latest
      ? new Date(latest.fetchedAt.getTime() + MOBILE_REFRESH_DUE_SECONDS * 1000).toISOString()
      : null,
    mobileStaleAt: latest
      ? new Date(latest.fetchedAt.getTime() + MOBILE_STALE_AFTER_SECONDS * 1000).toISOString()
      : null,
    nextProviderAction:
      mobileLifecycleStatus === "ready"
        ? "none"
        : mobileLifecycleStatus === "refresh_due"
          ? "refresh_provider_snapshots"
          : mobileLifecycleStatus === "stale"
            ? "refresh_provider_snapshots_or_keep_cached_test_mode"
            : "import_or_refresh_provider_snapshots",
  };
}

function buildOperatorNextActions(params: {
  providerSnapshots: JsonObject;
  settlementDecision: JsonObject;
  supervisorRunning: boolean;
  resultPollerRunning: boolean;
}) {
  const mobileLifecycleStatus = stringValue(params.providerSnapshots.mobileLifecycleStatus) ?? "unknown";
  const nextProviderAction = stringValue(params.providerSnapshots.nextProviderAction) ?? "inspect_status";
  const settlementOperatorDecision = stringValue(params.settlementDecision.operatorDecision);
  const settlementEligible = booleanValue(params.settlementDecision.executionEligibleNow);
  const actions = [
    {
      id: "cached_internal_testing",
      priority: "P0",
      label: "Keep cached local internal testing mode",
      command: "npm run mobile:one-event-onboarding",
      requiresProviderKey: false,
      spendsProviderQuota: false,
      reason: "Replays/restores the selected one-event runtime and verifies readiness without provider quota.",
    },
  ];

  actions.push({
    id: "start_full_internal_tester_runtime",
    priority: params.supervisorRunning && params.resultPollerRunning ? "P2" : "P1",
    label: "Start full local internal tester runtime",
    command:
      "npm run mobile:internal-tester-runtime -- -Action start -StartSupervisor -StartResultPoller -RunResultIngestion -RunResultSettlement -RunApprovedResultSettlement -WaitForReady",
    requiresProviderKey: false,
    spendsProviderQuota: false,
    reason:
      params.supervisorRunning && params.resultPollerRunning
        ? "The cached supervisor and result-poller are already running; this remains the no-quota restart/recover command."
        : "Starts or reuses local backend/Expo, then starts the cached supervisor and result-poller with result ingestion and approved-settlement wait mode.",
  });
  actions.push({
    id: "prove_one_command_runtime_loops",
    priority: "P0",
    label: "Prove one-command local runtime loops",
    command:
      "npm run mobile:one-event-onboarding -- -AllowDisconnectedS23 -StartRuntimeLoops -StopRuntimeLoopsAfterProof",
    requiresProviderKey: false,
    spendsProviderQuota: false,
    reason:
      params.supervisorRunning && params.resultPollerRunning
        ? "Re-proves the local supervisor/result-poller loop lifecycle without provider quota; use when refreshing proof artifacts."
        : "Starts the local supervisor/result-poller through onboarding, proves both are running, then stops them without provider quota.",
  });

  if (mobileLifecycleStatus !== "ready") {
    actions.push({
      id: "refresh_mobile_live_odds",
      priority: "P0",
      label: "Refresh mobile-visible live odds",
      command: "npm run mobile:one-event-live-runtime:provider",
      requiresProviderKey: true,
      spendsProviderQuota: true,
      reason:
        mobileLifecycleStatus === "stale"
          ? "Selected market provider snapshots are stale under the mobile 90-second live-display window."
          : mobileLifecycleStatus === "refresh_due"
            ? "Selected market provider snapshots are past the mobile 60-second refresh-due threshold."
            : "Selected market needs provider snapshots before live mobile display can be fresh.",
    });
  }

  if (!params.supervisorRunning) {
    actions.push({
      id: "start_cached_supervisor",
      priority: "P1",
      label: "Start local cached supervisor loop",
      command: "npm run mobile:one-event-live-supervisor:process -- -Action start -Continuous -MaxIterations 0",
      requiresProviderKey: false,
      spendsProviderQuota: false,
      reason: "Keeps local maker/lifecycle/result dry-run checks warm in cached no-quota mode while the process is running.",
    });
  }

  if (!params.resultPollerRunning) {
    actions.push({
      id: "start_cached_result_poller",
      priority: "P1",
      label: "Start local cached result poller",
      command: "npm run mobile:one-event-result-poller:process -- -Action start -Continuous -MaxIterations 0",
      requiresProviderKey: false,
      spendsProviderQuota: false,
      reason: "Repeats provider-shaped result ingestion and settlement scheduling dry-runs without provider quota.",
    });
  }

  if (settlementOperatorDecision === "wait_for_or_apply_market_close_before_execution" || settlementEligible === false) {
    actions.push({
      id: "settlement_wait_for_closed_market",
      priority: "P1",
      label: "Wait for closed market before settlement",
      command: "npm run mobile:one-event-active-settlement-readiness",
      requiresProviderKey: false,
      spendsProviderQuota: false,
      reason:
        "Active-event trusted-result settlement is intentionally blocked while the selected market is not CLOSED.",
    });
  }

  return {
    recommendedFirstAction:
      nextProviderAction === "none"
        ? "cached_internal_testing"
        : nextProviderAction === "refresh_provider_snapshots_or_keep_cached_test_mode"
          ? "cached_internal_testing"
          : nextProviderAction === "refresh_provider_snapshots" || nextProviderAction === "import_or_refresh_provider_snapshots"
          ? "refresh_mobile_live_odds"
          : "cached_internal_testing",
    defaultNoQuotaAction: "cached_internal_testing",
    liveOddsAction: mobileLifecycleStatus === "ready" ? "none" : "refresh_mobile_live_odds",
    nextProviderAction,
    actions,
    safety:
      "Commands are local-only. Provider-refresh commands require THE_ODDS_API_KEY in the environment and remain quota-capped by the underlying proof scripts; the status route never returns or reads the key.",
  };
}

function buildCurrentRuntimeState(params: {
  localCapabilityReady: boolean;
  supervisorRunning: boolean;
  resultPollerRunning: boolean;
  quotaSpendingLoopRunning: boolean;
  backendProofFresh: boolean;
  providerSnapshotFresh: boolean;
}) {
  const allLoopsRunning = params.supervisorRunning && params.resultPollerRunning;
  const anyLoopRunning = params.supervisorRunning || params.resultPollerRunning;
  const noQuotaWarmRuntime =
    params.localCapabilityReady &&
    allLoopsRunning &&
    !params.quotaSpendingLoopRunning &&
    params.backendProofFresh;

  const mode = noQuotaWarmRuntime
    ? "warm_no_quota_runtime"
    : params.localCapabilityReady && !anyLoopRunning
      ? "proven_capability_loops_stopped"
      : params.localCapabilityReady && anyLoopRunning
        ? "partial_runtime_running"
        : "not_ready";

  const p0 = params.localCapabilityReady ? [] : ["local_capability_not_ready"];
  const p1 = [];
  if (params.localCapabilityReady && !params.supervisorRunning) p1.push("supervisor_loop_not_running_now");
  if (params.localCapabilityReady && !params.resultPollerRunning) p1.push("result_poller_loop_not_running_now");
  if (params.quotaSpendingLoopRunning) p1.push("quota_spending_loop_running");
  if (!params.providerSnapshotFresh) p1.push("mobile_provider_snapshot_not_fresh");

  return {
    checked: true,
    mode,
    localCapabilityReady: params.localCapabilityReady,
    warmNoQuotaRuntime: noQuotaWarmRuntime,
    allLoopsRunning,
    anyLoopRunning,
    supervisorRunning: params.supervisorRunning,
    resultPollerRunning: params.resultPollerRunning,
    quotaSpendingLoopRunning: params.quotaSpendingLoopRunning,
    backendProofFresh: params.backendProofFresh,
    providerSnapshotFresh: params.providerSnapshotFresh,
    testerReadyRightNow: noQuotaWarmRuntime && params.providerSnapshotFresh,
    p0,
    p1,
    nextAction:
      mode === "warm_no_quota_runtime"
        ? params.providerSnapshotFresh
          ? "manual_s23_testing"
          : "keep_cached_testing_or_refresh_live_odds"
        : mode === "proven_capability_loops_stopped"
          ? "start_internal_tester_runtime_with_supervisor_and_result_poller"
          : mode === "partial_runtime_running"
            ? "start_missing_local_loop_or_run_watchdog"
            : "rerun_batch_readiness_and_phase_audit",
    note:
      "This separates proven local capability from current process warmth. Ready status can be true while loops are stopped; testerReadyRightNow requires both local loops running without provider quota and fresh mobile-visible provider snapshots.",
  };
}

function buildServiceOwnership(params: {
  localCapabilityReady: boolean;
  runtimeStatus: JsonObject | null;
  localRuntimeLaunchProfile: JsonObject | null;
  supervisorProcess: Awaited<ReturnType<typeof getManagedProcessStatus>>;
  resultPollerProcess: Awaited<ReturnType<typeof getManagedProcessStatus>>;
  runtimeHeartbeats: Awaited<ReturnType<typeof upsertRuntimeHeartbeat>>[];
  runtimeRuns: Awaited<ReturnType<typeof getLatestRuntimeRuns>>;
  providerRefreshRun: Awaited<ReturnType<typeof getLatestProviderRefreshRun>>;
  marketMakerQuoteRun: Awaited<ReturnType<typeof getRecentMarketMakerQuoteRuns>>[number] | null;
  currentRuntimeState: ReturnType<typeof buildCurrentRuntimeState>;
}) {
  const provenCapabilities = objectValue(getPath(params.runtimeStatus, ["provenCapabilities"]));
  const foregroundSupervisorProven =
    provenCapabilities.repeatedSupervisorCycles === true &&
    provenCapabilities.makerReseedWhileSupervisorRuns === true &&
    provenCapabilities.lifecycleSchedulerWhileSupervisorRuns === true;
  const foregroundResultPollerProven =
    provenCapabilities.resultPollingBackgroundProof === true &&
    provenCapabilities.resultPollingContinuousWhileRunnerRuns === true;
  const installedOsService =
    provenCapabilities.installedOsService === true ||
    params.runtimeHeartbeats.some((row) => row.installedOsService) ||
    params.runtimeRuns.some((row) => row.installedOsService) ||
    params.marketMakerQuoteRun?.installedOsService === true;
  const quotaSpendingLoopRunning = params.supervisorProcess.usesProviderQuota || params.resultPollerProcess.usesProviderQuota;
  const recommendedProfile = objectValue(
    getPath(params.localRuntimeLaunchProfile, ["launchProfiles", "recommendedInternalTesterProfile"]),
  );
  const manualForegroundProfile = objectValue(
    getPath(params.localRuntimeLaunchProfile, ["launchProfiles", "manualForegroundProfile"]),
  );
  const scheduledTaskProfile = objectValue(
    getPath(params.localRuntimeLaunchProfile, ["launchProfiles", "scheduledTaskProfile"]),
  );
  const liveProviderProfile = objectValue(
    getPath(params.localRuntimeLaunchProfile, ["launchProfiles", "liveProviderProfile"]),
  );

  return {
    checked: true,
    serviceModel: installedOsService ? "installed_os_service" : "local_foreground_worker_processes",
    productionServiceInstalled: installedOsService,
    installedOsService,
    foregroundSupervisorProven,
    foregroundResultPollerProven,
    foregroundLoopsProven: foregroundSupervisorProven && foregroundResultPollerProven,
    marketMakerContinuity: "continuous_while_one_event_supervisor_process_runs",
    providerRefreshContinuity:
      provenCapabilities.supervisorProviderRefreshQuotaProtected === true
        ? "explicit_quota_capped_live_refresh_or_cached_replay"
        : "cached_or_one_shot_only",
    resultPollingContinuity: "continuous_while_one_event_result_poller_process_runs",
    current: {
      mode: params.currentRuntimeState.mode,
      supervisorRunning: params.supervisorProcess.running,
      resultPollerRunning: params.resultPollerProcess.running,
      allLoopsRunning: params.currentRuntimeState.allLoopsRunning,
      quotaSpendingLoopRunning,
      testerReadyRightNow: params.currentRuntimeState.testerReadyRightNow,
    },
    liveProviderMode: {
      statusRouteSpendsProviderQuota: false,
      defaultInternalTesterModeSpendsProviderQuota: false,
      requiresExplicitProviderFlag: true,
      requiresTheOddsApiKeyForLiveProviderCalls: true,
    },
    localLaunch: {
      recommendedProfileLabel: stringValue(recommendedProfile.label),
      recommendedProfileCommand: stringValue(recommendedProfile.command),
      recommendedProfileInstallCommand: stringValue(recommendedProfile.installCommand),
      recommendedProfileUninstallCommand: stringValue(recommendedProfile.uninstallCommand),
      recommendedProfileQuotaMode: stringValue(recommendedProfile.quotaMode),
      recommendedProfileProductionBoundary: stringValue(recommendedProfile.productionBoundary),
      manualForegroundCommands: Array.isArray(manualForegroundProfile.commands)
        ? manualForegroundProfile.commands
            .map((command) => objectValue(command).command)
            .filter((command): command is string => typeof command === "string" && command.length > 0)
        : [],
      scheduledTaskPlanCommand: stringValue(scheduledTaskProfile.planCommand),
      scheduledTaskInstallCommand: stringValue(scheduledTaskProfile.installCommand),
      scheduledTaskUsableInCurrentContext:
        booleanValue(scheduledTaskProfile.usableInCurrentContext) === true,
      scheduledTaskContextNote: stringValue(scheduledTaskProfile.currentContextNote),
      liveProviderCommand: stringValue(liveProviderProfile.command),
      liveProviderInternalTesterCommand: stringValue(liveProviderProfile.internalTesterCommand),
      liveProviderDefaultForInternalTesting: booleanValue(liveProviderProfile.defaultForInternalTesting) === true,
      liveProviderQuotaMode: stringValue(liveProviderProfile.quotaMode),
      ownershipProof: getPath(params.localRuntimeLaunchProfile, ["ownershipProof"]) ?? null,
    },
    durableEvidence: {
      providerRefreshRunRecorded: params.providerRefreshRun != null,
      providerRefreshQuotaProtected: params.providerRefreshRun?.metadata.quotaProtected === true,
      marketMakerQuoteRunRecorded: params.marketMakerQuoteRun != null,
      marketMakerQuoteRunLocalOnly: params.marketMakerQuoteRun?.metadata.localOnly === true,
      runtimeHeartbeatsRecorded:
        params.runtimeHeartbeats.length === 2 &&
        params.runtimeHeartbeats.every(
          (row) =>
            row.serviceKey === "local:one-event-live-supervisor" ||
            row.serviceKey === "local:one-event-result-poller",
        ),
      runtimeRunsRecorded:
        params.runtimeRuns.length === 2 &&
        params.runtimeRuns.every(
          (row) =>
            row.serviceKey === "local:one-event-live-supervisor" ||
            row.serviceKey === "local:one-event-result-poller",
        ),
      runtimeRunsPassed:
        params.runtimeRuns.length === 2 && params.runtimeRuns.every((row) => row.status === "passed"),
    },
    p0: params.localCapabilityReady ? [] : ["local_runtime_capability_not_ready"],
    p1: [
      ...(installedOsService ? [] : ["installed_unattended_service_not_present"]),
      ...(params.supervisorProcess.running ? [] : ["supervisor_loop_not_running_now"]),
      ...(params.resultPollerProcess.running ? [] : ["result_poller_loop_not_running_now"]),
    ],
    nextAction: params.currentRuntimeState.nextAction,
    note:
      "This is the single operator-facing ownership summary. Holiwyn local MVP runtime is proven through foreground local worker loops and durable run/heartbeat rows; it is not an installed production daemon unless installedOsService becomes true.",
  };
}

function buildProviderRefreshLoop(params: {
  supervisorProcess: Awaited<ReturnType<typeof getManagedProcessStatus>>;
  providerRefreshRun: Awaited<ReturnType<typeof getLatestProviderRefreshRun>>;
  providerSnapshots: Awaited<ReturnType<typeof getProviderSnapshotFreshness>>;
}) {
  const enabledNow = params.supervisorProcess.running && params.supervisorProcess.modes.providerProof === true;
  const configuredInLastState = params.supervisorProcess.modes.providerProof === true;
  const everyIterations = params.supervisorProcess.providerProofEveryIterations ?? 0;
  const maxRuns = params.supervisorProcess.maxProviderProofRuns ?? 0;
  const refreshIterations = params.supervisorProcess.refreshIterations ?? 0;
  const maxCreditsPerRun = params.supervisorProcess.maxCreditsPerProviderProof ?? 0;
  const minRemaining = params.supervisorProcess.minRemaining ?? 0;

  return {
    checked: true,
    providerSource: params.providerRefreshRun?.providerSource ?? "the-odds-api",
    mode: enabledNow
      ? "quota_capped_live_refresh_loop_running"
      : configuredInLastState
        ? "quota_capped_live_refresh_configured_but_stopped"
        : "cached_no_quota_by_default",
    enabledNow,
    configuredInLastSupervisorState: configuredInLastState,
    statusRouteSpendsProviderQuota: false,
    requiresExplicitRunProviderProofFlag: true,
    requiresTheOddsApiKey: true,
    cadence: {
      everyIterations,
      maxRuns,
      refreshIterationsPerRun: refreshIterations,
      supervisorIntervalSeconds: params.supervisorProcess.intervalSeconds,
      continuous: params.supervisorProcess.continuous === true,
    },
    quotaCaps: {
      maxCreditsPerRun,
      maxCreditsAcrossConfiguredRuns: maxCreditsPerRun > 0 && maxRuns > 0 ? maxCreditsPerRun * maxRuns : 0,
      minRemaining,
      latestRunQuotaCost: params.providerRefreshRun?.quotaCost ?? null,
      latestRunRequestsRemaining: params.providerRefreshRun?.requestsRemaining ?? null,
      latestRunWithinBudget:
        params.providerRefreshRun != null &&
        typeof params.providerRefreshRun.maxCredits === "number" &&
        params.providerRefreshRun.quotaCost <= params.providerRefreshRun.maxCredits,
    },
    latestRun: {
      recorded: params.providerRefreshRun != null,
      status: params.providerRefreshRun?.status ?? null,
      mode: params.providerRefreshRun?.mode ?? null,
      startedAt: params.providerRefreshRun?.startedAt ?? null,
      finishedAt: params.providerRefreshRun?.finishedAt ?? null,
      eventSlug: params.providerRefreshRun?.eventSlug ?? null,
      selectedMarketId: params.providerRefreshRun?.selectedMarketId ?? null,
      staleBeforeRefresh: params.providerRefreshRun?.staleBeforeRefresh === true,
      readyAfterRefresh: params.providerRefreshRun?.readyAfterRefresh === true,
      quotaProtected: params.providerRefreshRun?.metadata.quotaProtected === true,
      providerCallCount: params.providerRefreshRun?.providerCallCount ?? null,
    },
    mobileFreshness: {
      status: params.providerSnapshots.mobileLifecycleStatus,
      mobileRouteFresh: params.providerSnapshots.mobileRouteFresh,
      latestSnapshotAgeSeconds: params.providerSnapshots.latestAgeSeconds,
      refreshDueSeconds: MOBILE_REFRESH_DUE_SECONDS,
      staleAfterSeconds: MOBILE_STALE_AFTER_SECONDS,
      nextProviderAction: params.providerSnapshots.nextProviderAction,
    },
    p0: params.providerRefreshRun == null ? ["provider_refresh_run_missing"] : [],
    p1: [
      ...(enabledNow ? [] : ["live_provider_refresh_loop_not_running_now"]),
      ...(params.providerSnapshots.mobileRouteFresh ? [] : ["mobile_visible_provider_snapshots_not_fresh"]),
    ],
    note:
      "This summarizes the local live-provider refresh loop contract. Cached internal testing spends no quota by default; live refresh runs only when the supervisor is started with RunProviderProof and THE_ODDS_API_KEY in the process environment.",
  };
}

function buildProductionReadinessBoundary(params: {
  localCapabilityReady: boolean;
  serviceOwnership: ReturnType<typeof buildServiceOwnership>;
  providerRefreshLoop: ReturnType<typeof buildProviderRefreshLoop>;
  settlementAutomation: JsonObject;
  currentRuntimeState: ReturnType<typeof buildCurrentRuntimeState>;
}) {
  const installedService = params.serviceOwnership.installedOsService === true;
  const liveProviderLoopRunning = params.providerRefreshLoop.enabledNow === true;
  const settlementP0 = asStringArray(getPath(params.settlementAutomation, ["p0"]));
  const productionBlockers = [
    ...(installedService ? [] : ["installed_unattended_runtime_service_missing"]),
    ...(liveProviderLoopRunning ? [] : ["live_provider_refresh_loop_not_running_by_default"]),
    "authenticated_operator_controls_missing",
    "installed_official_result_polling_missing",
    "production_auto_settlement_execution_not_enabled",
  ];

  return {
    checked: true,
    localInternalRuntimeReady: params.localCapabilityReady,
    localTesterReadyRightNow: params.currentRuntimeState.testerReadyRightNow,
    productionReady: false,
    fullProductionRuntimeComplete: false,
    fakeTokenOnly: true,
    noRealMoneyDeployment: true,
    defaultModeSpendsProviderQuota: false,
    providerRefreshStatusRouteSpendsQuota: false,
    currentServiceModel: params.serviceOwnership.serviceModel,
    installedUnattendedService: installedService,
    liveProviderRefreshLoopRunning: liveProviderLoopRunning,
    officialResultAutomation: {
      replayIngestionAvailable: getPath(params.settlementAutomation, ["resultPolling", "replayIngestionAvailable"]) === true,
      liveResultIngestionRequiresExplicitFlag:
        getPath(params.settlementAutomation, ["resultPolling", "liveResultIngestionRequiresExplicitFlag"]) === true,
      approvedSchedulerProofAvailable:
        getPath(params.settlementAutomation, ["approvedScheduler", "supervisorWaitModeProven"]) === true,
      activeEventExecutionGuard:
        getPath(params.settlementAutomation, ["safety", "requiresClosedMarket"]) === true
          ? "requires_closed_market_approval_and_exact_confirmation"
          : "not_safe_for_execution",
      activeEventExecutionAttempted:
        getPath(params.settlementAutomation, ["approvedScheduler", "activeEventExecutionAttempted"]) === true,
      activeEventSettlementExecuted:
        getPath(params.settlementAutomation, ["approvedScheduler", "activeEventSettlementExecuted"]) === true,
      p0: settlementP0,
    },
    productionBlockers,
    requiredBeforeProduction: [
      "install_or_host_provider_maker_lifecycle_workers_as_owned_services",
      "add_authenticated_operator_controls_for_result_review_and_settlement",
      "enable_quota_capped_live_official_result_polling_under_service_ownership",
      "keep exact-confirmation and closed-market guards for any active-event settlement execution",
      "add production monitoring, retry, alerting, and multi-event scheduling before public use",
    ],
    p0:
      params.localCapabilityReady &&
      settlementP0.length === 0 &&
      getPath(params.settlementAutomation, ["safety", "exactConfirmationExposed"]) === false &&
      getPath(params.settlementAutomation, ["approvedScheduler", "activeEventExecutionAttempted"]) === false
        ? []
        : ["production_boundary_local_readiness_or_settlement_safety_incomplete"],
    p1: productionBlockers,
    note:
      "This boundary prevents local internal tester readiness from being mistaken for production automation. Holiwyn can be locally ready while productionReady remains false.",
  };
}

function buildOperatorControlBoundary(params: {
  settlementDecision: JsonObject;
  resultReview: JsonObject;
  settlementQueue: JsonObject;
  settlementAutomation: JsonObject;
  productionReadinessBoundary: ReturnType<typeof buildProductionReadinessBoundary>;
}) {
  const firstQueueItem = getPath(params.settlementQueue, ["firstItem"]);
  const exactConfirmationExposed =
    getPath(params.resultReview, ["exactConfirmationRedacted"]) !== true ||
    getPath(params.settlementQueue, ["exactConfirmationStringsExposed"]) === true ||
    getPath(firstQueueItem, ["operatorAction", "exactConfirmationExposed"]) === true ||
    getPath(firstQueueItem, ["operatorExecutionPlan", "exactConfirmationExposed"]) === true;
  const exactConfirmationStored =
    getPath(params.resultReview, ["officialResultReview", "exactConfirmationStored"]) === true ||
    getPath(params.settlementQueue, ["exactConfirmationStored"]) === true ||
    getPath(firstQueueItem, ["operatorExecutionPlan", "exactConfirmationStored"]) === true;
  const activeExecutionAttempted =
    getPath(params.resultReview, ["activeMarketExecutionAttemptedByRoute"]) === true ||
    getPath(params.settlementQueue, ["activeMarketExecutionAttempted"]) === true ||
    getPath(params.settlementAutomation, ["approvedScheduler", "activeEventExecutionAttempted"]) === true ||
    getPath(params.settlementAutomation, ["approvedScheduler", "activeEventSettlementExecuted"]) === true;
  const p0 =
    getPath(params.resultReview, ["pass"]) === true &&
    getPath(params.settlementQueue, ["pass"]) === true &&
    getPath(params.settlementAutomation, ["safety", "providerQuotaUsedByStatus"]) === false &&
    getPath(params.settlementAutomation, ["safety", "providerQuotaRequiredForExecutionPlan"]) === false &&
    exactConfirmationExposed === false &&
    exactConfirmationStored === false &&
    activeExecutionAttempted === false
      ? []
      : ["operator_control_boundary_missing_or_unsafe"];

  return {
    checked: true,
    mode: "local_dev_read_only_operator_controls",
    devOnly: true,
    readOnly: true,
    noProviderQuota: true,
    publicMobileRoute: false,
    productionOperatorWorkflowReady: false,
    authenticatedControls: {
      requiredForProduction: true,
      available: false,
      sessionRouteAvailable: true,
      roleChecksAvailable: true,
      durableOperatorIdentityAvailable: true,
      twoPersonApprovalAvailable: false,
      reason:
        "Authenticated operator session, approval evidence, and guarded execution dry-run routes exist; direct settlement execution remains disabled.",
    },
    productionAuthRequirements: {
      version: 1,
      status: "session_route_implemented",
      p1Gap: "authenticated_operator_controls_missing",
      mustRemainServerOwned: true,
      publicMobileRouteAllowed: false,
      providerQuotaRequired: false,
      requiredRoutes: [
        {
          id: "operator_session",
          method: "GET",
          path: "/api/internal/operator/session",
          purpose: "Return the authenticated internal operator identity and roles before showing settlement controls.",
          requiredRoles: ["admin", "settlement_operator"],
          mutatesState: false,
          implementationStatus: "implemented_read_only",
        },
        {
          id: "settlement_queue_review",
          method: "GET",
          path: "/api/internal/live-runtime/settlement-queue",
          purpose: "List pending trusted-result reviews with redacted execution plans.",
          requiredRoles: ["admin", "settlement_operator"],
          mutatesState: false,
          implementationStatus: "implemented_read_only_with_operator_auth_gate",
        },
        {
          id: "settlement_approval",
          method: "POST",
          path: "/api/internal/live-runtime/settlement-queue/:reviewId/approve",
          purpose: "Attach an authenticated operator approval to a durable OfficialResultReview row.",
          requiredRoles: ["admin", "settlement_operator"],
          mutatesState: true,
          requiresTwoPersonApproval: true,
          implementationStatus: "implemented_guarded_no_execution",
          exactConfirmationStored: false,
          activeSettlementExecution: false,
        },
        {
          id: "settlement_execution",
          method: "POST",
          path: "/api/internal/live-runtime/settlement-queue/:reviewId/execute",
          purpose: "Execute only after CLOSED market status, matching approval, exact confirmation, and role checks.",
          requiredRoles: ["admin"],
          mutatesState: true,
          requiresClosedMarket: true,
          requiresExactConfirmation: true,
          implementationStatus: "implemented_guarded_dry_run_no_settlement_mutation",
          dryRunOnly: true,
          exactConfirmationStored: false,
          activeSettlementExecution: false,
        },
      ],
      requiredSchema: [
        {
          model: "OfficialResultReview",
          fields: [
            "approvedByUserId",
            "approvedAt",
            "executedByUserId",
            "executedAt",
            "approvalAuditEventId",
            "executionAuditEventId",
          ],
        },
        {
          model: "OperatorAuditEvent",
          fields: [
            "operatorUserId",
            "reviewId",
            "action",
            "roleSnapshot",
            "requestId",
            "createdAt",
          ],
          status: "required_new_model_or_equivalent_audit_table",
        },
      ],
      requiredGuards: [
        "server_authentication_required",
        "admin_or_settlement_operator_role_required",
        "durable_operator_identity_on_approval",
        "durable_operator_identity_on_execution",
        "two_person_or_admin_approval_for_execution",
        "market_status_closed_required_before_execution",
        "exact_confirmation_required_but_never_returned_by_status_routes",
        "public_mobile_routes_must_not_expose_operator_controls",
      ],
    },
    localControls: {
      operatorSessionRoute: {
        route: "GET /api/internal/operator/session",
        available: true,
        mutatesState: false,
        providerQuotaRequired: false,
        publicMobileRoute: false,
        exactConfirmationExposed: false,
      },
      settlementApprovalRoute: {
        route: "POST /api/internal/live-runtime/settlement-queue/:reviewId/approve",
        available: true,
        mutatesState: true,
        mutationScope: "approval_evidence_only",
        providerQuotaRequired: false,
        publicMobileRoute: false,
        exactConfirmationExposed: false,
        exactConfirmationStored: false,
        activeSettlementExecution: false,
      },
      settlementExecutionRoute: {
        route: "POST /api/internal/live-runtime/settlement-queue/:reviewId/execute",
        available: true,
        mutatesState: true,
        mutationScope: "execution_dry_run_request_audit_only",
        dryRunOnly: true,
        providerQuotaRequired: false,
        publicMobileRoute: false,
        exactConfirmationExposed: false,
        exactConfirmationStored: false,
        activeSettlementExecution: false,
      },
      resultReviewRoute: {
        route: "GET /api/internal/live-runtime/result-review",
        available: getPath(params.resultReview, ["pass"]) === true,
        mutatesState: false,
        authRequired: true,
        providerQuotaRequired: false,
      },
      settlementQueueRoute: {
        route: "GET /api/internal/live-runtime/settlement-queue",
        available: getPath(params.settlementQueue, ["pass"]) === true,
        mutatesState: false,
        authRequired: true,
        providerQuotaRequired: false,
      },
      approvedSchedulerCommand: {
        available: typeof getPath(firstQueueItem, ["operatorExecutionPlan", "command", "npmScript"]) === "string",
        npmScript: getPath(firstQueueItem, ["operatorExecutionPlan", "command", "npmScript"]) ?? null,
        commandRedacted: getPath(firstQueueItem, ["operatorExecutionPlan", "command", "commandRedacted"]) ?? null,
        dryRunFirst: getPath(firstQueueItem, ["operatorExecutionPlan", "dryRunFirst"]) === true,
        exactConfirmationArgumentRedacted:
          getPath(firstQueueItem, ["operatorExecutionPlan", "command", "exactConfirmationArgumentRedacted"]) === true,
      },
    },
    executionSafety: {
      activeMarketStatus: getPath(params.settlementDecision, ["activeMarketStatus"]) ?? null,
      executionEligibleNow: getPath(params.settlementDecision, ["executionEligibleNow"]) === true,
      localExecutionReadyWhenClosed:
        getPath(firstQueueItem, ["operatorExecutionPlan", "executableNow"]) === true &&
        getPath(firstQueueItem, ["operatorExecutionPlan", "providerQuotaRequired"]) === false,
      activeExecutionAttempted,
      activeSettlementExecuted:
        getPath(params.settlementAutomation, ["approvedScheduler", "activeEventSettlementExecuted"]) === true,
      requiresClosedMarket: getPath(params.settlementAutomation, ["safety", "requiresClosedMarket"]) === true,
      requiresApproval: getPath(params.settlementAutomation, ["safety", "requiresApproval"]) === true,
      requiresExactConfirmation: getPath(params.settlementAutomation, ["safety", "requiresExactConfirmation"]) === true,
      exactConfirmationExposed,
      exactConfirmationStored,
      exactConfirmationRedacted: getPath(params.settlementAutomation, ["safety", "exactConfirmationRedacted"]) === true,
      repeatExecutionBlocked: getPath(params.settlementAutomation, ["safety", "repeatExecutionBlocked"]) === true,
      providerQuotaRequired: getPath(params.settlementAutomation, ["safety", "providerQuotaRequiredForExecutionPlan"]) === true,
    },
    productionBlockers: [
      "authenticated_operator_controls_missing",
      "production_operator_ui_not_present",
      "two_person_or_admin_approval_workflow_missing",
      "installed_official_result_polling_missing",
    ],
    requiredBeforeProduction: [
      "store durable operator identity on approval and execution records",
      "provide an audited operator UI or admin workflow for queue review",
      "keep exact-confirmation redaction and CLOSED-market guards",
      "connect installed official-result polling only after service ownership exists",
    ],
    p0,
    p1: [
      "authenticated_operator_controls_missing",
      "production_operator_ui_not_present",
      ...asStringArray(getPath(params.productionReadinessBoundary, ["productionBlockers"])).filter(
        (gap) => gap.includes("official_result") || gap.includes("auto_settlement"),
      ),
    ],
    note:
      "This boundary is intentionally read-only. It exposes the local operator control contract and production blockers without adding a public route, spending provider quota, or executing settlement.",
  };
}

export async function getLocalLiveRuntimeStatus(options: { phaseAuditInProgress?: boolean } = {}) {
  const [
    completionAudit,
    runtimeStatus,
    phaseAudit,
    watchdog,
    localRuntimeLaunchProfile,
    activeSettlementReadiness,
    activeSettlementClosedEligibility,
    supervisorProcess,
    resultPollerProcess,
  ] = await Promise.all([
    readJson(COMPLETION_AUDIT_PATH),
    readJson(RUNTIME_STATUS_PATH),
    readJson(PHASE_AUDIT_PATH),
    readJson(WATCHDOG_PATH),
    readJson(LOCAL_RUNTIME_LAUNCH_PROFILE_PATH),
    readJson(ACTIVE_SETTLEMENT_READINESS_PATH),
    readJson(ACTIVE_SETTLEMENT_CLOSED_ELIGIBILITY_PATH),
    getManagedProcessStatus({ kind: "supervisor", statePath: SUPERVISOR_STATE_PATH }),
    getManagedProcessStatus({ kind: "result-poller", statePath: RESULT_POLLER_STATE_PATH }),
  ]);

  const completionAgeHours = ageHours(completionAudit?.generatedAt);
  const phaseAgeHours = ageHours(phaseAudit?.generatedAt);
  const watchdogAgeHours = ageHours(watchdog?.generatedAt);
  const liveProofAgeAtCompletionHours = numberValue(getPath(completionAudit, ["answers", "freshness", "liveProofAgeHours"]));
  const maxLiveProofAgeHours = numberValue(getPath(completionAudit, ["answers", "freshness", "maxLiveProofAgeHours"]));
  const liveProofCurrentAgeHours =
    typeof liveProofAgeAtCompletionHours === "number" && typeof completionAgeHours === "number"
      ? Number((liveProofAgeAtCompletionHours + completionAgeHours).toFixed(2))
      : null;
  const selectedMarketId =
    stringValue(getPath(phaseAudit, ["selectedMarket", "id"])) ??
    stringValue(getPath(phaseAudit, ["selectedMarket", "marketId"])) ??
    stringValue(getPath(completionAudit, ["selectedMarket", "id"])) ??
    stringValue(getPath(completionAudit, ["selectedMarket", "marketId"]));
  const providerSnapshots = await getProviderSnapshotFreshness({
    marketId: selectedMarketId,
    maxAgeHours: maxLiveProofAgeHours,
  });
  const runtimeHeartbeats = await Promise.all([
    upsertRuntimeHeartbeat(supervisorProcess),
    upsertRuntimeHeartbeat(resultPollerProcess),
  ]);
  const runtimeRuns = await getLatestRuntimeRuns();
  const providerRefreshRun = await getLatestProviderRefreshRun(
    stringValue(getPath(completionAudit, ["event", "localSlug"])) ?? stringValue(getPath(phaseAudit, ["event", "localSlug"])),
  );
  const marketMakerQuoteRuns = await getRecentMarketMakerQuoteRuns(selectedMarketId);
  const marketMakerQuoteRun = marketMakerQuoteRuns[0] ?? null;
  const repeatedLocalMakerQuoteRunCount = marketMakerQuoteRuns.filter(
    (run) =>
      run.status === "passed" &&
      run.metadata.localOnly === true &&
      run.metadata.emittedBy === "scripts/seed_odds_api_live_shifted_maker.ts" &&
      run.shiftedBidWorseThanProvider === true &&
      run.shiftedAskWorseThanProvider === true &&
      run.quoteRouteShowsBid === true &&
      run.quoteRouteShowsAsk === true &&
      run.quoteRouteStatus === 200,
  ).length;
  const p0Gaps =
    options.phaseAuditInProgress === true ? [] : asStringArray(getPath(completionAudit, ["gaps", "p0"]));
  const completionRequirements = completionRequirementEntries(completionAudit);
  const completionRequirementsReady = completionRequirementsPass(completionAudit);
  const completionAuditReadyForStatus = options.phaseAuditInProgress === true ? completionAudit != null : pass(completionAudit);
  const completionRequirementsReadyForStatus =
    options.phaseAuditInProgress === true ? completionRequirements.length > 0 : completionRequirementsReady;
  const activeSettlementClosedEligibilityReady =
    pass(activeSettlementClosedEligibility) &&
    getPath(activeSettlementClosedEligibility, ["runtimeTruth", "provesActiveEventClosedStateEligibility"]) === true &&
    getPath(activeSettlementClosedEligibility, ["runtimeTruth", "activeEventSettlementExecuted"]) === false &&
    getPath(activeSettlementClosedEligibility, ["runtimeTruth", "activeMarketRestored"]) === true &&
    getPath(activeSettlementClosedEligibility, ["runtimeTruth", "providerQuotaUsed"]) === false;
  const statusP0Gaps = [...p0Gaps];
  if (!completionRequirementsReadyForStatus) {
    statusP0Gaps.push("completion_requirements_missing_or_failed");
  }
  if (!activeSettlementClosedEligibilityReady) {
    statusP0Gaps.push("active_settlement_closed_eligibility_missing_or_failed");
  }
  const artifactFreshness = {
    maxCompletionAuditAgeHours: 24,
    maxPhaseAuditAgeHours: 24,
    maxWatchdogAgeHours: 24,
    maxLiveProofAgeHours,
    completionAuditAgeHours: completionAgeHours,
    phaseAuditAgeHours: phaseAgeHours,
    watchdogAgeHours,
    liveProofAgeAtCompletionHours,
    liveProofCurrentAgeHours,
    completionAuditFresh: typeof completionAgeHours === "number" && completionAgeHours <= 24,
    phaseAuditFresh: typeof phaseAgeHours === "number" && phaseAgeHours <= 24,
    watchdogFresh: typeof watchdogAgeHours === "number" && watchdogAgeHours <= 24,
    liveProofFresh:
      typeof liveProofCurrentAgeHours === "number" &&
      typeof maxLiveProofAgeHours === "number" &&
      liveProofCurrentAgeHours <= maxLiveProofAgeHours,
  };
  const resultReviewReady =
    getPath(phaseAudit, ["localResultReview", "ok"]) === true &&
    getPath(phaseAudit, ["localResultReview", "body", "status"]) === "ready" &&
    getPath(phaseAudit, ["localResultReview", "body", "providerQuotaUsed"]) === false &&
    getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "readOnlyRoute"]) === true &&
    getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "devOnlyRoute"]) === true &&
    getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "canonicalProviderResultAuditAvailable"]) === true &&
    getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "canonicalSettlementPreflightAuditAvailable"]) === true &&
    getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "canonicalSettlementApprovalAuditAvailable"]) === true &&
    (options.phaseAuditInProgress === true ||
      typeof getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "canonicalSettlementBlockedAuditAvailable"]) ===
        "boolean") &&
    getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "durableOfficialResultReviewRecordAvailable"]) === true &&
    getPath(phaseAudit, ["localResultReview", "body", "officialResultReview", "exactConfirmationStored"]) === false &&
    getPath(phaseAudit, ["localResultReview", "body", "officialResultReview", "providerQuotaUsed"]) === false &&
    getPath(phaseAudit, ["localResultReview", "body", "officialResultReview", "activeMarketExecutionAttempted"]) === false &&
    getPath(phaseAudit, ["localResultReview", "body", "executionDecision", "exactConfirmationRequiredKnown"]) === true &&
    getPath(phaseAudit, ["localResultReview", "body", "executionDecision", "exactConfirmationRedacted"]) === true &&
    typeof getPath(phaseAudit, ["localResultReview", "body", "executionDecision", "settlementAlreadyExecuted"]) ===
      "boolean" &&
    typeof getPath(phaseAudit, ["localResultReview", "body", "executionDecision", "repeatExecutionBlocked"]) ===
      "boolean" &&
    getPath(phaseAudit, ["localResultReview", "body", "executionDecision", "activeMarketExecutionAttemptedByThisRoute"]) === false &&
    Array.isArray(getPath(phaseAudit, ["localResultReview", "body", "gaps", "p0"])) &&
    (getPath(phaseAudit, ["localResultReview", "body", "gaps", "p0"]) as unknown[]).length === 0;
  const settlementQueueReady =
    getPath(phaseAudit, ["localSettlementQueue", "ok"]) === true &&
    getPath(phaseAudit, ["localSettlementQueue", "body", "status"]) === "ready" &&
    getPath(phaseAudit, ["localSettlementQueue", "body", "providerQuotaUsed"]) === false &&
    getPath(phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "readOnlyRoute"]) === true &&
    getPath(phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "devOnlyRoute"]) === true &&
    getPath(phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "operatorQueueAvailable"]) === true &&
    getPath(phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "redactedOperatorExecutionPlanAvailable"]) === true &&
    getPath(phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "structuredOperatorExecutionPlanAvailable"]) === true &&
    getPath(phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "exactConfirmationStringsExposed"]) === false &&
    getPath(phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "exactConfirmationStored"]) === false &&
    getPath(phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "activeMarketExecutionAttempted"]) === false &&
    typeof getPath(phaseAudit, ["localSettlementQueue", "body", "queue", "itemCount"]) === "number" &&
    (getPath(phaseAudit, ["localSettlementQueue", "body", "queue", "itemCount"]) as number) > 0 &&
    typeof getPath(phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "operatorAction", "label"]) === "string" &&
    typeof getPath(phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "operatorAction", "nextCommand"]) === "string" &&
    getPath(phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "operatorAction", "exactConfirmationExposed"]) === false &&
    getPath(phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "operatorAction", "providerQuotaRequired"]) === false &&
    getPath(phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "operatorExecutionPlan", "version"]) === 1 &&
    getPath(phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "operatorExecutionPlan", "providerQuotaRequired"]) === false &&
    getPath(phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "operatorExecutionPlan", "exactConfirmationExposed"]) === false &&
    getPath(phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "operatorExecutionPlan", "exactConfirmationStored"]) === false &&
    getPath(phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "approvalEvidence", "durableReviewRowAvailable"]) === true &&
    getPath(phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "approvalEvidence", "canonicalApprovalEventAvailable"]) === true &&
    getPath(phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "approvalEvidence", "exactConfirmationStored"]) === false &&
    getPath(phaseAudit, ["localSettlementQueue", "body", "checks", "canonicalApprovalEvidenceForApprovedReviews"]) === true &&
    Array.isArray(getPath(phaseAudit, ["localSettlementQueue", "body", "gaps", "p0"])) &&
    (getPath(phaseAudit, ["localSettlementQueue", "body", "gaps", "p0"]) as unknown[]).length === 0;
  const ready =
    completionAuditReadyForStatus &&
    (options.phaseAuditInProgress === true || pass(phaseAudit)) &&
    pass(watchdog) &&
    statusP0Gaps.length === 0 &&
    artifactFreshness.completionAuditFresh &&
    artifactFreshness.phaseAuditFresh &&
    artifactFreshness.watchdogFresh &&
    artifactFreshness.liveProofFresh &&
    providerSnapshots.fresh &&
    resultReviewReady &&
    settlementQueueReady;
  const quotaSpendingLoopRunning = supervisorProcess.usesProviderQuota || resultPollerProcess.usesProviderQuota;
  const currentRuntimeState = buildCurrentRuntimeState({
    localCapabilityReady: ready,
    supervisorRunning: supervisorProcess.running,
    resultPollerRunning: resultPollerProcess.running,
    quotaSpendingLoopRunning,
    backendProofFresh:
      artifactFreshness.completionAuditFresh &&
      artifactFreshness.phaseAuditFresh &&
      artifactFreshness.watchdogFresh &&
      artifactFreshness.liveProofFresh,
    providerSnapshotFresh: providerSnapshots.mobileRouteFresh === true,
  });
  const operatorNextActions = buildOperatorNextActions({
    providerSnapshots,
    settlementDecision: {
      executionEligibleNow: getPath(activeSettlementReadiness, ["executionDecision", "executionEligibleNow"]),
      operatorDecision: getPath(activeSettlementReadiness, ["executionDecision", "operatorDecision"]),
    },
    supervisorRunning: supervisorProcess.running,
    resultPollerRunning: resultPollerProcess.running,
  });
  const settlementDecision = {
    checked: activeSettlementReadiness != null,
    path: ACTIVE_SETTLEMENT_READINESS_PATH,
    pass: pass(activeSettlementReadiness),
    generatedAt: activeSettlementReadiness?.generatedAt ?? null,
    providerQuotaUsed: getPath(activeSettlementReadiness, ["providerQuotaUsed"]) === true,
    activeMarketStatus: getPath(activeSettlementReadiness, ["activeMarket", "status"]),
    activeEventStatus: getPath(activeSettlementReadiness, ["activeMarket", "event", "status"]),
    executionEligibleNow: getPath(activeSettlementReadiness, ["executionDecision", "executionEligibleNow"]) === true,
    operatorDecision: getPath(activeSettlementReadiness, ["executionDecision", "operatorDecision"]),
    blockers: asStringArray(getPath(activeSettlementReadiness, ["executionDecision", "blockers"])),
    marketMustBeClosed: getPath(activeSettlementReadiness, ["executionDecision", "marketMustBeClosed"]) === true,
    exactConfirmationRequiredKnown:
      typeof getPath(activeSettlementReadiness, ["executionDecision", "exactConfirmationRequired"]) === "string",
    activeMarketExecutionAttempted:
      getPath(activeSettlementReadiness, ["executionDecision", "activeMarketExecutionAttempted"]) === true,
    closedStateEligibility: {
      checked: activeSettlementClosedEligibility != null,
      path: ACTIVE_SETTLEMENT_CLOSED_ELIGIBILITY_PATH,
      pass: pass(activeSettlementClosedEligibility),
      generatedAt: activeSettlementClosedEligibility?.generatedAt ?? null,
      providerQuotaUsed: getPath(activeSettlementClosedEligibility, ["runtimeTruth", "providerQuotaUsed"]) === true,
      provesEligibilityAfterClose:
        getPath(activeSettlementClosedEligibility, ["runtimeTruth", "provesActiveEventClosedStateEligibility"]) === true,
      operatorDecisionWhenClosed:
        getPath(activeSettlementClosedEligibility, ["closedStateDecision", "operatorDecisionWhenClosed"]) ?? null,
      activeEventSettlementExecuted:
        getPath(activeSettlementClosedEligibility, ["runtimeTruth", "activeEventSettlementExecuted"]) === true,
      activeMarketRestored: getPath(activeSettlementClosedEligibility, ["runtimeTruth", "activeMarketRestored"]) === true,
      exactApprovalStillRequiredForExecution:
        getPath(activeSettlementClosedEligibility, ["runtimeTruth", "exactApprovalStillRequiredForExecution"]) === true,
    },
    closedStateEligibilityProven: activeSettlementClosedEligibilityReady,
    disposableCloneSettlementProven:
      getPath(activeSettlementReadiness, ["runtimeTruth", "disposableCloneSettlementProven"]) === true,
    supervisorApprovedSettlementWaitProven:
      getPath(activeSettlementReadiness, ["runtimeTruth", "supervisorApprovedSettlementWaitProven"]) === true,
    nextSafeAction:
      getPath(activeSettlementReadiness, ["executionDecision", "executionEligibleNow"]) === true
        ? "execute_only_with_exact_confirmation_after_operator_review"
        : "wait_for_or_apply_market_close_before_execution",
  };
  const resultReview = {
    checked: getPath(phaseAudit, ["localResultReview"]) != null,
    path: "/api/internal/live-runtime/result-review",
    pass: resultReviewReady,
    providerQuotaUsed: getPath(phaseAudit, ["localResultReview", "body", "providerQuotaUsed"]) === true,
    readOnlyRoute: getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "readOnlyRoute"]) === true,
    devOnlyRoute: getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "devOnlyRoute"]) === true,
    canonicalProviderResultAuditAvailable:
      getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "canonicalProviderResultAuditAvailable"]) === true,
    canonicalSettlementPreflightAuditAvailable:
      getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "canonicalSettlementPreflightAuditAvailable"]) === true,
    canonicalSettlementApprovalAuditAvailable:
      getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "canonicalSettlementApprovalAuditAvailable"]) === true,
    canonicalSettlementBlockedAuditAvailable:
      getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "canonicalSettlementBlockedAuditAvailable"]) === true,
    durableOfficialResultReviewRecordAvailable:
      getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "durableOfficialResultReviewRecordAvailable"]) === true,
    officialResultReview: {
      reviewKey: getPath(phaseAudit, ["localResultReview", "body", "officialResultReview", "reviewKey"]) ?? null,
      exactConfirmationStored:
        getPath(phaseAudit, ["localResultReview", "body", "officialResultReview", "exactConfirmationStored"]) === true,
      providerQuotaUsed:
        getPath(phaseAudit, ["localResultReview", "body", "officialResultReview", "providerQuotaUsed"]) === true,
      activeMarketExecutionAttempted:
        getPath(phaseAudit, ["localResultReview", "body", "officialResultReview", "activeMarketExecutionAttempted"]) === true,
    },
    exactConfirmationRequiredKnown:
      getPath(phaseAudit, ["localResultReview", "body", "executionDecision", "exactConfirmationRequiredKnown"]) === true,
    exactConfirmationRedacted:
      getPath(phaseAudit, ["localResultReview", "body", "executionDecision", "exactConfirmationRedacted"]) === true,
    settlementAlreadyExecuted:
      getPath(phaseAudit, ["localResultReview", "body", "executionDecision", "settlementAlreadyExecuted"]) === true,
    repeatExecutionBlocked:
      getPath(phaseAudit, ["localResultReview", "body", "executionDecision", "repeatExecutionBlocked"]) === true,
    repeatSettlementExecutionBlocked:
      getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "repeatSettlementExecutionBlocked"]) === true,
    activeMarketExecutionAttemptedByRoute:
      getPath(phaseAudit, ["localResultReview", "body", "executionDecision", "activeMarketExecutionAttemptedByThisRoute"]) === true,
    p0: asStringArray(getPath(phaseAudit, ["localResultReview", "body", "gaps", "p0"])),
    nextSafeAction:
      getPath(phaseAudit, ["localResultReview", "body", "executionDecision", "executionEligibleNow"]) === true
        ? "operator_review_required_before_exact_confirmed_execution"
        : "wait_for_or_apply_market_close_before_execution",
  };
  const settlementQueueItem = getPath(phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0"]);
  const settlementQueue = {
    checked: getPath(phaseAudit, ["localSettlementQueue"]) != null,
    path: "/api/internal/live-runtime/settlement-queue",
    pass: settlementQueueReady,
    providerQuotaUsed: getPath(phaseAudit, ["localSettlementQueue", "body", "providerQuotaUsed"]) === true,
    readOnlyRoute: getPath(phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "readOnlyRoute"]) === true,
    devOnlyRoute: getPath(phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "devOnlyRoute"]) === true,
    operatorQueueAvailable:
      getPath(phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "operatorQueueAvailable"]) === true,
    redactedOperatorExecutionPlanAvailable:
      getPath(phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "redactedOperatorExecutionPlanAvailable"]) === true,
    structuredOperatorExecutionPlanAvailable:
      getPath(phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "structuredOperatorExecutionPlanAvailable"]) === true,
    durableApprovalEvidenceAvailable:
      getPath(phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "durableApprovalEvidenceAvailable"]) === true,
    durableExecutionEvidenceAvailable:
      getPath(phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "durableExecutionEvidenceAvailable"]) === true,
    exactConfirmationStringsExposed:
      getPath(phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "exactConfirmationStringsExposed"]) === true,
    exactConfirmationStored:
      getPath(phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "exactConfirmationStored"]) === true,
    activeMarketExecutionAttempted:
      getPath(phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "activeMarketExecutionAttempted"]) === true,
    queue: {
      itemCount: numberValue(getPath(phaseAudit, ["localSettlementQueue", "body", "queue", "itemCount"])) ?? 0,
      pendingCount: numberValue(getPath(phaseAudit, ["localSettlementQueue", "body", "queue", "pendingCount"])) ?? 0,
      executableNowCount:
        numberValue(getPath(phaseAudit, ["localSettlementQueue", "body", "queue", "executableNowCount"])) ?? 0,
      approvedWaitingForCloseCount:
        numberValue(getPath(phaseAudit, ["localSettlementQueue", "body", "queue", "approvedWaitingForCloseCount"])) ?? 0,
    },
    firstItem:
      settlementQueueItem && typeof settlementQueueItem === "object"
        ? {
            reviewKey: getPath(settlementQueueItem, ["reviewKey"]) ?? null,
            eventSlug: getPath(settlementQueueItem, ["eventSlug"]) ?? null,
            marketId: getPath(settlementQueueItem, ["marketId"]) ?? null,
            approvalStatus: getPath(settlementQueueItem, ["approvalStatus"]) ?? null,
            nextSafeAction: getPath(settlementQueueItem, ["nextSafeAction"]) ?? null,
            marketStatus: getPath(settlementQueueItem, ["market", "status"]) ?? null,
            approvalEvidence: {
              status: getPath(settlementQueueItem, ["approvalEvidence", "status"]) ?? null,
              source: getPath(settlementQueueItem, ["approvalEvidence", "source"]) ?? null,
              durableReviewRowAvailable:
                getPath(settlementQueueItem, ["approvalEvidence", "durableReviewRowAvailable"]) === true,
              canonicalApprovalEventAvailable:
                getPath(settlementQueueItem, ["approvalEvidence", "canonicalApprovalEventAvailable"]) === true,
              canonicalApprovalEventId:
                getPath(settlementQueueItem, ["approvalEvidence", "canonicalApprovalEventId"]) ?? null,
              resultDigestAvailable:
                getPath(settlementQueueItem, ["approvalEvidence", "resultDigestAvailable"]) === true,
              exactConfirmationStored:
                getPath(settlementQueueItem, ["approvalEvidence", "exactConfirmationStored"]) === true,
              exactConfirmationRedacted:
                getPath(settlementQueueItem, ["approvalEvidence", "exactConfirmationRedacted"]) === true,
              providerQuotaUsed:
                getPath(settlementQueueItem, ["approvalEvidence", "providerQuotaUsed"]) === true,
            },
            executionEvidence: {
              status: getPath(settlementQueueItem, ["executionEvidence", "status"]) ?? null,
              source: getPath(settlementQueueItem, ["executionEvidence", "source"]) ?? null,
              durableReviewRowAvailable:
                getPath(settlementQueueItem, ["executionEvidence", "durableReviewRowAvailable"]) === true,
              canonicalExecutionEventAvailable:
                getPath(settlementQueueItem, ["executionEvidence", "canonicalExecutionEventAvailable"]) === true,
              canonicalExecutionEventId:
                getPath(settlementQueueItem, ["executionEvidence", "canonicalExecutionEventId"]) ?? null,
              resultDigestAvailable:
                getPath(settlementQueueItem, ["executionEvidence", "resultDigestAvailable"]) === true,
              exactConfirmationStored:
                getPath(settlementQueueItem, ["executionEvidence", "exactConfirmationStored"]) === true,
              exactConfirmationRedacted:
                getPath(settlementQueueItem, ["executionEvidence", "exactConfirmationRedacted"]) === true,
              providerQuotaUsed:
                getPath(settlementQueueItem, ["executionEvidence", "providerQuotaUsed"]) === true,
              activeMarketExecutionAttempted:
                getPath(settlementQueueItem, ["executionEvidence", "activeMarketExecutionAttempted"]) === true,
            },
            operatorAction: {
              label: getPath(settlementQueueItem, ["operatorAction", "label"]) ?? null,
              blockingReason: getPath(settlementQueueItem, ["operatorAction", "blockingReason"]) ?? null,
              nextCommand: getPath(settlementQueueItem, ["operatorAction", "nextCommand"]) ?? null,
              exactConfirmationExposed:
                getPath(settlementQueueItem, ["operatorAction", "exactConfirmationExposed"]) === true,
              providerQuotaRequired:
                getPath(settlementQueueItem, ["operatorAction", "providerQuotaRequired"]) === true,
              activeExecutionRequiresClosedMarket:
                getPath(settlementQueueItem, ["operatorAction", "activeExecutionRequiresClosedMarket"]) === true,
              activeExecutionRequiresApproval:
                getPath(settlementQueueItem, ["operatorAction", "activeExecutionRequiresApproval"]) === true,
              activeExecutionRequiresExactConfirmation:
                getPath(settlementQueueItem, ["operatorAction", "activeExecutionRequiresExactConfirmation"]) === true,
            },
            operatorExecutionPlan: {
              version: getPath(settlementQueueItem, ["operatorExecutionPlan", "version"]) ?? null,
              mode: getPath(settlementQueueItem, ["operatorExecutionPlan", "mode"]) ?? null,
              executableNow: getPath(settlementQueueItem, ["operatorExecutionPlan", "executableNow"]) === true,
              dryRunFirst: getPath(settlementQueueItem, ["operatorExecutionPlan", "dryRunFirst"]) === true,
              providerQuotaRequired:
                getPath(settlementQueueItem, ["operatorExecutionPlan", "providerQuotaRequired"]) === true,
              exactConfirmationExposed:
                getPath(settlementQueueItem, ["operatorExecutionPlan", "exactConfirmationExposed"]) === true,
              exactConfirmationStored:
                getPath(settlementQueueItem, ["operatorExecutionPlan", "exactConfirmationStored"]) === true,
              activeMarketExecutionAttempted:
                getPath(settlementQueueItem, ["operatorExecutionPlan", "activeMarketExecutionAttempted"]) === true,
              prerequisites: getPath(settlementQueueItem, ["operatorExecutionPlan", "prerequisites"]) ?? null,
              blockerKeys: asStringArray(getPath(settlementQueueItem, ["operatorExecutionPlan", "blockerKeys"])),
              command: {
                npmScript: getPath(settlementQueueItem, ["operatorExecutionPlan", "command", "npmScript"]) ?? null,
                args: asStringArray(getPath(settlementQueueItem, ["operatorExecutionPlan", "command", "args"])),
                commandRedacted:
                  getPath(settlementQueueItem, ["operatorExecutionPlan", "command", "commandRedacted"]) ?? null,
                exactConfirmationArgumentRedacted:
                  getPath(settlementQueueItem, [
                    "operatorExecutionPlan",
                    "command",
                    "exactConfirmationArgumentRedacted",
                  ]) === true,
              },
            },
          }
        : null,
    p0: asStringArray(getPath(phaseAudit, ["localSettlementQueue", "body", "gaps", "p0"])),
  };
  const settlementAutomation = {
    checked: true,
    mode: settlementDecision.executionEligibleNow
      ? "closed_market_exact_confirmation_required"
      : resultReview.settlementAlreadyExecuted
        ? "already_executed_repeat_blocked"
        : "approved_waiting_for_closed_market",
    resultPolling: {
      replayIngestionAvailable: true,
      liveResultIngestionRequiresExplicitFlag: true,
      liveResultIngestionRequiresProviderKey: true,
      defaultModeSpendsProviderQuota: false,
      currentPollerRunning: resultPollerProcess.running,
      currentPollerUsesProviderQuota: resultPollerProcess.usesProviderQuota,
      provenBackgroundPolling:
        getPath(runtimeStatus, ["provenCapabilities", "resultPollingBackgroundProof"]) === true &&
        getPath(runtimeStatus, ["provenCapabilities", "resultPollingContinuousWhileRunnerRuns"]) === true,
      settlementSchedulerWhilePollerRuns:
        getPath(runtimeStatus, ["provenCapabilities", "resultSettlementSchedulerWhilePollerRuns"]) === true,
    },
    approvedScheduler: {
      supervisorWaitModeProven: settlementDecision.supervisorApprovedSettlementWaitProven,
      schedulerWhileSupervisorRuns:
        getPath(runtimeStatus, ["provenCapabilities", "resultSettlementSchedulerWhileSupervisorRuns"]) === true,
      approvedAutoExecutionSupportedOnClosedReviewedMarkets: true,
      activeEventExecutionAttempted: settlementDecision.activeMarketExecutionAttempted,
      activeEventSettlementExecuted:
        settlementDecision.closedStateEligibility.activeEventSettlementExecuted ||
        settlementQueue.activeMarketExecutionAttempted ||
        resultReview.activeMarketExecutionAttemptedByRoute,
    },
    activeEvent: {
      eventStatus: settlementDecision.activeEventStatus ?? null,
      marketStatus: settlementDecision.activeMarketStatus ?? settlementQueue.firstItem?.marketStatus ?? null,
      approvalStatus: settlementQueue.firstItem?.approvalStatus ?? null,
      approvedReview: settlementQueue.firstItem?.approvalEvidence.status === "approved",
      executionAllowedNow: settlementDecision.executionEligibleNow,
      blockedWaitingForClose:
        settlementDecision.marketMustBeClosed &&
        settlementDecision.executionEligibleNow === false &&
        settlementQueue.firstItem?.marketStatus !== "CLOSED",
      blockers: settlementDecision.blockers,
      queueBlockerKeys: settlementQueue.firstItem?.operatorExecutionPlan.blockerKeys ?? [],
      closedStateEligibilityProven: settlementDecision.closedStateEligibilityProven,
      operatorDecisionWhenClosed: settlementDecision.closedStateEligibility.operatorDecisionWhenClosed,
      nextSafeAction: settlementDecision.nextSafeAction,
    },
    safety: {
      providerQuotaUsedByStatus: false,
      providerQuotaRequiredForExecutionPlan:
        settlementQueue.firstItem?.operatorExecutionPlan.providerQuotaRequired === true,
      exactConfirmationRequiredKnown: settlementDecision.exactConfirmationRequiredKnown,
      exactConfirmationStored:
        resultReview.officialResultReview.exactConfirmationStored ||
        settlementQueue.exactConfirmationStored ||
        settlementQueue.firstItem?.operatorExecutionPlan.exactConfirmationStored === true,
      exactConfirmationRedacted:
        resultReview.exactConfirmationRedacted &&
        settlementQueue.firstItem?.approvalEvidence.exactConfirmationRedacted === true &&
        settlementQueue.firstItem?.executionEvidence.exactConfirmationRedacted === true,
      exactConfirmationExposed:
        settlementQueue.exactConfirmationStringsExposed ||
        settlementQueue.firstItem?.operatorAction.exactConfirmationExposed === true ||
        settlementQueue.firstItem?.operatorExecutionPlan.exactConfirmationExposed === true,
      requiresClosedMarket:
        settlementDecision.marketMustBeClosed &&
        settlementQueue.firstItem?.operatorAction.activeExecutionRequiresClosedMarket === true,
      requiresApproval: settlementQueue.firstItem?.operatorAction.activeExecutionRequiresApproval === true,
      requiresExactConfirmation:
        settlementQueue.firstItem?.operatorAction.activeExecutionRequiresExactConfirmation === true,
      repeatExecutionBlocked: resultReview.repeatExecutionBlocked || resultReview.repeatSettlementExecutionBlocked,
    },
    p0:
      settlementQueue.pass &&
      resultReview.pass &&
      settlementDecision.closedStateEligibilityProven &&
      settlementQueue.firstItem?.approvalEvidence.status === "approved" &&
      settlementQueue.firstItem?.operatorExecutionPlan.providerQuotaRequired === false &&
      settlementQueue.firstItem?.operatorExecutionPlan.exactConfirmationExposed === false &&
      settlementQueue.firstItem?.operatorExecutionPlan.exactConfirmationStored === false &&
      settlementDecision.closedStateEligibility.activeEventSettlementExecuted === false &&
      settlementQueue.activeMarketExecutionAttempted === false &&
      resultReview.activeMarketExecutionAttemptedByRoute === false
        ? []
        : ["settlement_automation_status_incomplete_or_unsafe"],
    p1: [
      ...(resultPollerProcess.running ? [] : ["result_poller_not_running_now"]),
      ...(supervisorProcess.running ? [] : ["supervisor_not_running_now"]),
      "installed_official_result_polling_not_present",
      "production_operator_ui_not_present",
    ],
    note:
      "This block summarizes local official-result automation truth. It is read-only status: replay result ingestion and approved settlement scheduling are proven locally, live result ingestion is explicit/key-gated, and active-event execution remains guarded by CLOSED market status plus exact approval.",
  };
  const serviceOwnership = buildServiceOwnership({
    localCapabilityReady: ready,
    runtimeStatus,
    localRuntimeLaunchProfile,
    supervisorProcess,
    resultPollerProcess,
    runtimeHeartbeats,
    runtimeRuns,
    providerRefreshRun,
    marketMakerQuoteRun,
    currentRuntimeState,
  });
  const providerRefreshLoop = buildProviderRefreshLoop({
    supervisorProcess,
    providerRefreshRun,
    providerSnapshots,
  });
  const productionReadinessBoundary = buildProductionReadinessBoundary({
    localCapabilityReady: ready,
    serviceOwnership,
    providerRefreshLoop,
    settlementAutomation,
    currentRuntimeState,
  });
  const operatorControlBoundary = buildOperatorControlBoundary({
    settlementDecision,
    resultReview,
    settlementQueue,
    settlementAutomation,
    productionReadinessBoundary,
  });

  return {
    generatedAt: new Date().toISOString(),
    scope: "holiwyn-local-live-runtime-status",
    status: ready ? "ready" : "needs_attention",
    event: completionAudit?.event ?? phaseAudit?.event ?? null,
    selectedMarket: phaseAudit?.selectedMarket ?? null,
    runtimeTruth: {
      localInternalRuntimeReady: ready,
      fullProductionRuntimeComplete: getPath(completionAudit, ["runtimeTruth", "fullProductionRuntimeComplete"]) === true,
      installedUnattendedService: getPath(completionAudit, ["runtimeTruth", "installedUnattendedService"]) === true,
      internalTesterWatchdogPass: getPath(completionAudit, ["runtimeTruth", "internalTesterWatchdogPass"]) === true,
      providerQuotaUsedByStatus: false,
      activeTesterSettlementExecutionAttempted:
        getPath(completionAudit, ["runtimeTruth", "activeTesterSettlementExecutionAttempted"]) === true,
      activeEventClosedStateEligibilityProven: activeSettlementClosedEligibilityReady,
    },
    answers: {
      marketMakerContinuous: getPath(completionAudit, ["answers", "marketMakerContinuous"]),
      oddsRefreshLiveOrReplay: getPath(completionAudit, ["answers", "oddsRefreshLiveOrReplay"]),
      oddsRefreshCadence: getPath(completionAudit, ["answers", "oddsRefreshCadence"]),
      quotaProtection: getPath(completionAudit, ["answers", "quotaProtection"]),
      staleHandling: getPath(completionAudit, ["answers", "staleHandling"]),
      lifecycle: getPath(completionAudit, ["answers", "lifecycle"]),
      activeSettlement: getPath(completionAudit, ["answers", "activeSettlement"]),
      activeSettlementClosedEligibility: getPath(completionAudit, ["answers", "activeSettlementClosedEligibility"]),
      localWatchdog: getPath(completionAudit, ["answers", "localWatchdog"]),
    },
    phaseCompletion: {
      checked: completionAudit != null,
      path: COMPLETION_AUDIT_PATH,
      pass: pass(completionAudit),
      generatedAt: completionAudit?.generatedAt ?? null,
      providerQuotaUsedByStatus: false,
      phaseCompleteForLocalInternalRuntime:
        getPath(completionAudit, ["runtimeTruth", "phaseCompleteForLocalInternalRuntime"]) === true,
      fullProductionRuntimeComplete:
        getPath(completionAudit, ["runtimeTruth", "fullProductionRuntimeComplete"]) === true,
      installedUnattendedService:
        getPath(completionAudit, ["runtimeTruth", "installedUnattendedService"]) === true,
      activeTesterSettlementExecutionAttempted:
        getPath(completionAudit, ["runtimeTruth", "activeTesterSettlementExecutionAttempted"]) === true,
      event: completionAudit?.event ?? null,
      answers: completionAudit?.answers ?? {},
      checks: completionAudit?.checks ?? {},
      sourceEvidence: completionAudit?.sourceEvidence ?? {},
      completionRequirements,
      completionRequirementsPass: completionRequirementsReady,
      p0: asStringArray(getPath(completionAudit, ["gaps", "p0"])),
      p1: asStringArray(getPath(completionAudit, ["gaps", "p1"])),
      p2: asStringArray(getPath(completionAudit, ["gaps", "p2"])),
      note:
        "Read-only projection of the live-runtime completion audit. It answers the phase completion questions without starting loops, calling the provider, spending quota, or executing settlement.",
    },
    launchProfile: {
      checked: localRuntimeLaunchProfile != null,
      path: LOCAL_RUNTIME_LAUNCH_PROFILE_PATH,
      pass: pass(localRuntimeLaunchProfile),
      generatedAt: localRuntimeLaunchProfile?.generatedAt ?? null,
      recommendedInternalTesterProfile:
        getPath(localRuntimeLaunchProfile, ["launchProfiles", "recommendedInternalTesterProfile"]) ?? null,
      manualForegroundProfile:
        getPath(localRuntimeLaunchProfile, ["launchProfiles", "manualForegroundProfile"]) ?? null,
      scheduledTaskProfile:
        getPath(localRuntimeLaunchProfile, ["launchProfiles", "scheduledTaskProfile"]) ?? null,
      liveProviderProfile:
        getPath(localRuntimeLaunchProfile, ["launchProfiles", "liveProviderProfile"]) ?? null,
      runtimeTruth: localRuntimeLaunchProfile?.runtimeTruth ?? {},
      p0: asStringArray(getPath(localRuntimeLaunchProfile, ["gaps", "p0"])),
      p1: asStringArray(getPath(localRuntimeLaunchProfile, ["gaps", "p1"])),
      p2: asStringArray(getPath(localRuntimeLaunchProfile, ["gaps", "p2"])),
      note:
        "Read-only projection of the local runtime launch profile. It reports local operator launch options and does not start processes, install Startup entries, install scheduled tasks, call providers, or execute settlement.",
    },
    checks: completionAudit?.checks ?? null,
    serviceOwnership,
    providerRefreshLoop,
    settlementAutomation,
    productionReadinessBoundary,
    operatorControlBoundary,
    gaps: {
      p0: statusP0Gaps,
      p1: asStringArray(getPath(completionAudit, ["gaps", "p1"])),
      p2: asStringArray(getPath(completionAudit, ["gaps", "p2"])),
    },
    freshness: artifactFreshness,
    providerSnapshots,
    providerRefreshRuns: {
      checked: true,
      durable: true,
      source: "ProviderRefreshRun",
      latest: providerRefreshRun,
      latestRunPassed: providerRefreshRun?.status === "passed",
      latestRunQuotaProtected: providerRefreshRun?.metadata.quotaProtected === true,
      latestRunWithinBudget:
        providerRefreshRun != null &&
        typeof providerRefreshRun.maxCredits === "number" &&
        providerRefreshRun.quotaCost <= providerRefreshRun.maxCredits,
      latestRunReadyAfterRefresh: providerRefreshRun?.readyAfterRefresh === true,
      latestRunStaleBeforeRefresh: providerRefreshRun?.staleBeforeRefresh === true,
      providerQuotaUsedByStatus: false,
      note:
        "This durable row records the latest bounded live provider refresh proof for the selected one-event runtime. The status route reads it but does not call the provider or spend quota.",
    },
    marketMakerQuoteRuns: {
      checked: true,
      durable: true,
      source: "MarketMakerQuoteRun",
      latest: marketMakerQuoteRun,
      recent: marketMakerQuoteRuns,
      recentRunCount: marketMakerQuoteRuns.length,
      repeatedLocalRunCount: repeatedLocalMakerQuoteRunCount,
      repeatedLocalRunsProven: repeatedLocalMakerQuoteRunCount >= 2,
      latestRunPassed: marketMakerQuoteRun?.status === "passed",
      latestRunLocalOnly: marketMakerQuoteRun?.metadata.localOnly === true,
      latestRunShiftedWorseThanProvider:
        marketMakerQuoteRun?.shiftedBidWorseThanProvider === true &&
        marketMakerQuoteRun?.shiftedAskWorseThanProvider === true,
      latestRunQuoteRouteReady:
        marketMakerQuoteRun?.quoteRouteShowsBid === true &&
        marketMakerQuoteRun?.quoteRouteShowsAsk === true &&
        marketMakerQuoteRun?.quoteRouteStatus === 200,
      latestRunSnapshotFresh: marketMakerQuoteRun?.snapshotFresh === true,
      installedOsService: marketMakerQuoteRun?.installedOsService === true,
      note:
        "This durable row records the latest local shifted-maker quote cycle for the selected market. It proves local quote placement and quote-route visibility, not installed production daemon ownership.",
    },
    settlementDecision,
    resultReview,
    settlementQueue,
    runtimeCapabilities: {
      latestRunProfileOnly: getPath(runtimeStatus, ["modeTruth", "latestSupervisorRunProfileOnly"]) === true,
      latestSupervisorProfile: getPath(runtimeStatus, ["supervisor", "latestRunProfile"]) ?? null,
      provenCapabilities: {
        repeatedSupervisorCycles:
          getPath(runtimeStatus, ["provenCapabilities", "repeatedSupervisorCycles"]) === true,
        makerReseedWhileSupervisorRuns:
          getPath(runtimeStatus, ["provenCapabilities", "makerReseedWhileSupervisorRuns"]) === true,
        lifecycleSchedulerWhileSupervisorRuns:
          getPath(runtimeStatus, ["provenCapabilities", "lifecycleSchedulerWhileSupervisorRuns"]) === true,
        resultIngestionWhileSupervisorRuns:
          getPath(runtimeStatus, ["provenCapabilities", "resultIngestionWhileSupervisorRuns"]) === true,
        resultSettlementSchedulerWhileSupervisorRuns:
          getPath(runtimeStatus, ["provenCapabilities", "resultSettlementSchedulerWhileSupervisorRuns"]) === true,
        supervisorProviderRefreshQuotaProtected:
          getPath(runtimeStatus, ["provenCapabilities", "supervisorProviderRefreshQuotaProtected"]) === true,
        resultPollingBackgroundProof:
          getPath(runtimeStatus, ["provenCapabilities", "resultPollingBackgroundProof"]) === true,
        resultPollingContinuousWhileRunnerRuns:
          getPath(runtimeStatus, ["provenCapabilities", "resultPollingContinuousWhileRunnerRuns"]) === true,
        resultSettlementSchedulerWhilePollerRuns:
          getPath(runtimeStatus, ["provenCapabilities", "resultSettlementSchedulerWhilePollerRuns"]) === true,
        installedOsService: getPath(runtimeStatus, ["provenCapabilities", "installedOsService"]) === true,
      },
      currentProcessState: {
        anyLoopRunning: supervisorProcess.running || resultPollerProcess.running,
        quotaSpendingLoopRunning,
      },
      note:
        "latestSupervisorProfile describes only the latest supervisor artifact; provenCapabilities describes prior passing repeated supervisor/result-poller proofs.",
    },
    currentRuntimeState,
    operatorNextActions,
    managedProcesses: {
      supervisor: supervisorProcess,
      resultPoller: resultPollerProcess,
      anyLoopRunning: supervisorProcess.running || resultPollerProcess.running,
      quotaSpendingLoopRunning: supervisorProcess.usesProviderQuota || resultPollerProcess.usesProviderQuota,
      note:
        "Read-only live process check from local .runtime state and OS pid existence. Ready status is based on proven local capability and fresh data, not on requiring background loops to be running right now.",
    },
    runtimeHeartbeats: {
      checked: true,
      durable: true,
      source: "RuntimeServiceHeartbeat",
      records: runtimeHeartbeats,
      allExpectedServicesRecorded:
        runtimeHeartbeats.length === 2 &&
        runtimeHeartbeats.every((row) => row.serviceKey === "local:one-event-live-supervisor" || row.serviceKey === "local:one-event-result-poller"),
      quotaSpendingHeartbeatRunning: runtimeHeartbeats.some((row) => row.running && row.usesProviderQuota),
      installedOsService: runtimeHeartbeats.some((row) => row.installedOsService),
      note:
        "These durable rows include worker-emitted heartbeat metadata when the local loops run, then the status route mirrors current process-state checks. They do not mean a production OS service is installed.",
    },
    runtimeRuns: {
      checked: true,
      durable: true,
      source: "RuntimeServiceRun",
      records: runtimeRuns,
      allExpectedServicesRecorded:
        runtimeRuns.length === 2 &&
        runtimeRuns.every((row) => row.serviceKey === "local:one-event-live-supervisor" || row.serviceKey === "local:one-event-result-poller"),
      allExpectedServicesPassed:
        runtimeRuns.length === 2 && runtimeRuns.every((row) => row.status === "passed"),
      quotaSpendingRunRecorded: runtimeRuns.some((row) => row.providerQuotaUsed),
      activeSettlementExecuted: runtimeRuns.some((row) => row.activeSettlementExecuted),
      installedOsService: runtimeRuns.some((row) => row.installedOsService),
      workerOwnedRunCount: runtimeRuns.filter((row) => row.metadata.workerOwned).length,
      note:
        "These durable rows are emitted by the local runtime workers when a supervisor/result-poller run finishes. They prove latest run outcome, not installed production service ownership.",
    },
    artifacts: {
      completionAudit: {
        path: COMPLETION_AUDIT_PATH,
        pass: pass(completionAudit),
        generatedAt: completionAudit?.generatedAt ?? null,
      },
      phaseAudit: {
        path: PHASE_AUDIT_PATH,
        pass: pass(phaseAudit),
        generatedAt: phaseAudit?.generatedAt ?? null,
      },
      runtimeStatus: {
        path: RUNTIME_STATUS_PATH,
        pass: pass(runtimeStatus),
        generatedAt: runtimeStatus?.generatedAt ?? null,
      },
      watchdog: {
        path: WATCHDOG_PATH,
        pass: pass(watchdog),
        generatedAt: watchdog?.generatedAt ?? null,
        cleanupPassed:
          getPath(watchdog, ["cleanup", "supervisor", "pass"]) === true &&
          getPath(watchdog, ["cleanup", "resultPoller", "pass"]) === true,
      },
      activeSettlementReadiness: {
        path: ACTIVE_SETTLEMENT_READINESS_PATH,
        pass: pass(activeSettlementReadiness),
        generatedAt: activeSettlementReadiness?.generatedAt ?? null,
      },
    },
  };
}
