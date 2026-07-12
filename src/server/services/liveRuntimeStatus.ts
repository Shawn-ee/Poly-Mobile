import fs from "node:fs/promises";
import { prisma } from "@/lib/db";

const COMPLETION_AUDIT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json";
const PHASE_AUDIT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json";
const WATCHDOG_PATH =
  "docs/mobile/harness/odds-api-live-runtime/internal-tester-watchdog-summary.redacted.json";
const SUPERVISOR_STATE_PATH = ".runtime/one-event-live-supervisor/supervisor-process-state.json";
const RESULT_POLLER_STATE_PATH = ".runtime/one-event-result-poller/result-poller-process-state.json";

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
  const fresh =
    snapshots.length > 0 &&
    typeof latestAgeHours === "number" &&
    typeof params.maxAgeHours === "number" &&
    latestAgeHours <= params.maxAgeHours;
  const sources = Array.from(new Set(snapshots.map((snapshot) => snapshot.source))).sort();

  return {
    checked: true,
    fresh,
    marketId: params.marketId,
    reason: snapshots.length === 0 ? "missing_provider_snapshots" : fresh ? null : "provider_snapshots_stale",
    snapshotCount: snapshots.length,
    latestFetchedAt: latest?.fetchedAt.toISOString() ?? null,
    latestAgeHours,
    maxAgeHours: params.maxAgeHours,
    sources,
    acceptingOrderSnapshotCount: snapshots.filter((snapshot) => snapshot.acceptingOrders).length,
    mmEligibleSnapshotCount: snapshots.filter((snapshot) => snapshot.mmEligible).length,
    latestQualityStatus: latest?.qualityStatus ?? null,
    latestReason: latest?.reason ?? null,
  };
}

export async function getLocalLiveRuntimeStatus() {
  const [completionAudit, phaseAudit, watchdog, supervisorProcess, resultPollerProcess] = await Promise.all([
    readJson(COMPLETION_AUDIT_PATH),
    readJson(PHASE_AUDIT_PATH),
    readJson(WATCHDOG_PATH),
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
  const ready =
    pass(completionAudit) &&
    pass(phaseAudit) &&
    pass(watchdog) &&
    p0Gaps.length === 0 &&
    artifactFreshness.completionAuditFresh &&
    artifactFreshness.phaseAuditFresh &&
    artifactFreshness.watchdogFresh &&
    artifactFreshness.liveProofFresh &&
    providerSnapshots.fresh;

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
    managedProcesses: {
      supervisor: supervisorProcess,
      resultPoller: resultPollerProcess,
      anyLoopRunning: supervisorProcess.running || resultPollerProcess.running,
      quotaSpendingLoopRunning: supervisorProcess.usesProviderQuota || resultPollerProcess.usesProviderQuota,
      note:
        "Read-only live process check from local .runtime state and OS pid existence. Ready status is based on proven local capability and fresh data, not on requiring background loops to be running right now.",
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
      watchdog: {
        path: WATCHDOG_PATH,
        pass: pass(watchdog),
        generatedAt: watchdog?.generatedAt ?? null,
        cleanupPassed:
          getPath(watchdog, ["cleanup", "supervisor", "pass"]) === true &&
          getPath(watchdog, ["cleanup", "resultPoller", "pass"]) === true,
      },
    },
  };
}
