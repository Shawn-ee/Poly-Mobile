import fs from "node:fs/promises";
import { prisma } from "@/lib/db";

const COMPLETION_AUDIT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json";
const RUNTIME_STATUS_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json";
const PHASE_AUDIT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json";
const WATCHDOG_PATH =
  "docs/mobile/harness/odds-api-live-runtime/internal-tester-watchdog-summary.redacted.json";
const ACTIVE_SETTLEMENT_READINESS_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-readiness-summary.redacted.json";
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

const pidRunning = (pid: number | null) => {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
};

const dateValue = (value: unknown) => {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed) : null;
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
  const row = await prisma.runtimeServiceHeartbeat.upsert({
    where: { serviceKey: `local:${serviceName}` },
    create: {
      serviceKey: `local:${serviceName}`,
      serviceName,
      serviceKind: processStatus.kind,
      status,
      pid: processStatus.pid,
      running: processStatus.running,
      continuous: processStatus.continuous,
      usesProviderQuota: processStatus.usesProviderQuota,
      installedOsService: false,
      statePath: processStatus.statePath,
      startedAt: dateValue(processStatus.startedAt),
      heartbeatAt: new Date(),
      metadata: {
        source: "local-runtime-status-route",
        checked: processStatus.checked,
        known: processStatus.known,
        maxIterations: processStatus.maxIterations,
        intervalSeconds: processStatus.intervalSeconds,
        modes: processStatus.modes,
      },
    },
    update: {
      status,
      pid: processStatus.pid,
      running: processStatus.running,
      continuous: processStatus.continuous,
      usesProviderQuota: processStatus.usesProviderQuota,
      installedOsService: false,
      statePath: processStatus.statePath,
      startedAt: dateValue(processStatus.startedAt),
      heartbeatAt: new Date(),
      metadata: {
        source: "local-runtime-status-route",
        checked: processStatus.checked,
        known: processStatus.known,
        maxIterations: processStatus.maxIterations,
        intervalSeconds: processStatus.intervalSeconds,
        modes: processStatus.modes,
      },
    },
  });

  return {
    serviceKey: row.serviceKey,
    serviceName: row.serviceName,
    serviceKind: row.serviceKind,
    status: row.status,
    pid: row.pid,
    running: row.running,
    continuous: row.continuous,
    usesProviderQuota: row.usesProviderQuota,
    installedOsService: row.installedOsService,
    statePath: row.statePath,
    startedAt: row.startedAt?.toISOString() ?? null,
    heartbeatAt: row.heartbeatAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
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

export async function getLocalLiveRuntimeStatus() {
  const [
    completionAudit,
    runtimeStatus,
    phaseAudit,
    watchdog,
    activeSettlementReadiness,
    supervisorProcess,
    resultPollerProcess,
  ] = await Promise.all([
    readJson(COMPLETION_AUDIT_PATH),
    readJson(RUNTIME_STATUS_PATH),
    readJson(PHASE_AUDIT_PATH),
    readJson(WATCHDOG_PATH),
    readJson(ACTIVE_SETTLEMENT_READINESS_PATH),
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
  const p0Gaps = asStringArray(getPath(completionAudit, ["gaps", "p0"]));
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
    getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "durableOfficialResultReviewRecordAvailable"]) === true &&
    getPath(phaseAudit, ["localResultReview", "body", "officialResultReview", "exactConfirmationStored"]) === false &&
    getPath(phaseAudit, ["localResultReview", "body", "officialResultReview", "providerQuotaUsed"]) === false &&
    getPath(phaseAudit, ["localResultReview", "body", "officialResultReview", "activeMarketExecutionAttempted"]) === false &&
    getPath(phaseAudit, ["localResultReview", "body", "executionDecision", "exactConfirmationRequiredKnown"]) === true &&
    getPath(phaseAudit, ["localResultReview", "body", "executionDecision", "exactConfirmationRedacted"]) === true &&
    getPath(phaseAudit, ["localResultReview", "body", "executionDecision", "activeMarketExecutionAttemptedByThisRoute"]) === false &&
    Array.isArray(getPath(phaseAudit, ["localResultReview", "body", "gaps", "p0"])) &&
    (getPath(phaseAudit, ["localResultReview", "body", "gaps", "p0"]) as unknown[]).length === 0;
  const ready =
    pass(completionAudit) &&
    pass(phaseAudit) &&
    pass(watchdog) &&
    p0Gaps.length === 0 &&
    artifactFreshness.completionAuditFresh &&
    artifactFreshness.phaseAuditFresh &&
    artifactFreshness.watchdogFresh &&
    artifactFreshness.liveProofFresh &&
    providerSnapshots.fresh &&
    resultReviewReady;
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
    activeMarketExecutionAttemptedByRoute:
      getPath(phaseAudit, ["localResultReview", "body", "executionDecision", "activeMarketExecutionAttemptedByThisRoute"]) === true,
    p0: asStringArray(getPath(phaseAudit, ["localResultReview", "body", "gaps", "p0"])),
    nextSafeAction:
      getPath(phaseAudit, ["localResultReview", "body", "executionDecision", "executionEligibleNow"]) === true
        ? "operator_review_required_before_exact_confirmed_execution"
        : "wait_for_or_apply_market_close_before_execution",
  };

  return {
    generatedAt: new Date().toISOString(),
    scope: "holiwyn-local-live-runtime-status",
    status: ready ? "ready" : "needs_attention",
    event: completionAudit?.event ?? phaseAudit?.event ?? null,
    selectedMarket: phaseAudit?.selectedMarket ?? null,
    runtimeTruth: {
      localInternalRuntimeReady: getPath(completionAudit, ["runtimeTruth", "phaseCompleteForLocalInternalRuntime"]) === true,
      fullProductionRuntimeComplete: getPath(completionAudit, ["runtimeTruth", "fullProductionRuntimeComplete"]) === true,
      installedUnattendedService: getPath(completionAudit, ["runtimeTruth", "installedUnattendedService"]) === true,
      internalTesterWatchdogPass: getPath(completionAudit, ["runtimeTruth", "internalTesterWatchdogPass"]) === true,
      providerQuotaUsedByStatus: false,
      activeTesterSettlementExecutionAttempted:
        getPath(completionAudit, ["runtimeTruth", "activeTesterSettlementExecutionAttempted"]) === true,
    },
    answers: {
      marketMakerContinuous: getPath(completionAudit, ["answers", "marketMakerContinuous"]),
      oddsRefreshLiveOrReplay: getPath(completionAudit, ["answers", "oddsRefreshLiveOrReplay"]),
      oddsRefreshCadence: getPath(completionAudit, ["answers", "oddsRefreshCadence"]),
      quotaProtection: getPath(completionAudit, ["answers", "quotaProtection"]),
      staleHandling: getPath(completionAudit, ["answers", "staleHandling"]),
      lifecycle: getPath(completionAudit, ["answers", "lifecycle"]),
      activeSettlement: getPath(completionAudit, ["answers", "activeSettlement"]),
      localWatchdog: getPath(completionAudit, ["answers", "localWatchdog"]),
    },
    checks: completionAudit?.checks ?? null,
    gaps: {
      p0: p0Gaps,
      p1: asStringArray(getPath(completionAudit, ["gaps", "p1"])),
      p2: asStringArray(getPath(completionAudit, ["gaps", "p2"])),
    },
    freshness: artifactFreshness,
    providerSnapshots,
    settlementDecision,
    resultReview,
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
        quotaSpendingLoopRunning: supervisorProcess.usesProviderQuota || resultPollerProcess.usesProviderQuota,
      },
      note:
        "latestSupervisorProfile describes only the latest supervisor artifact; provenCapabilities describes prior passing repeated supervisor/result-poller proofs.",
    },
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
        "These durable rows mirror local process-state checks for internal testing. They do not mean a production OS service is installed.",
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
