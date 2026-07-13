import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const DEFAULT_BASE_URL = "http://127.0.0.1:3002";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json";

const PATHS = {
  liveProof: "docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json",
  onboarding: "docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-summary.redacted.json",
  onboardingRuntimeStart:
    "docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-runtime-start-summary.redacted.json",
  onboardingRuntimeStatus:
    "docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-runtime-status-summary.redacted.json",
  onboardingRuntimeStop:
    "docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-runtime-stop-summary.redacted.json",
  readiness: "docs/mobile/harness/odds-api-live-runtime/one-event-live-readiness-summary.redacted.json",
  runtimeStatus: "docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json",
  runtimeLaunch: "docs/mobile/harness/odds-api-live-runtime/one-event-runtime-launch-summary.redacted.json",
  supervisor: "docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-summary.redacted.json",
  supervisorProcess: "docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-process-summary.redacted.json",
  internalTesterRuntime:
    "docs/mobile/harness/odds-api-live-runtime/internal-tester-runtime-manager-summary.redacted.json",
  internalTesterResultPoller:
    "docs/mobile/harness/odds-api-live-runtime/internal-tester-result-poller-control-summary.redacted.json",
  internalTesterWatchdog:
    "docs/mobile/harness/odds-api-live-runtime/internal-tester-watchdog-summary.redacted.json",
  currentRuntimeStateProof:
    "docs/mobile/harness/odds-api-live-runtime/current-runtime-state-proof-summary.redacted.json",
  localRuntimeTask: "docs/mobile/harness/odds-api-live-runtime/local-runtime-task-summary.redacted.json",
  localRuntimeTaskInstall:
    "docs/mobile/harness/odds-api-live-runtime/local-runtime-task-install-uninstall-summary.redacted.json",
  localRuntimeStartup:
    "docs/mobile/harness/odds-api-live-runtime/local-runtime-startup-summary.redacted.json",
  localRuntimeStartupInstall:
    "docs/mobile/harness/odds-api-live-runtime/local-runtime-startup-install-uninstall-summary.redacted.json",
  localRuntimeLaunchProfile:
    "docs/mobile/harness/odds-api-live-runtime/local-runtime-launch-profile-summary.redacted.json",
  liveRuntimeCompletionAudit:
    "docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json",
  continuousSupervisor: "docs/mobile/harness/odds-api-live-runtime/one-event-continuous-supervisor-proof-summary.redacted.json",
  staleGuardProof: "docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-summary.redacted.json",
  staleGuardRun: "docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-run-summary.redacted.json",
  lifecycleControls: "docs/mobile/harness/odds-api-live-runtime/event-lifecycle-controls-summary.redacted.json",
  lifecycleScheduler: "docs/mobile/harness/odds-api-live-runtime/event-lifecycle-scheduler-summary.redacted.json",
  lifecycleSchedulerRun: "docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-scheduler-run-summary.redacted.json",
  lifecycleMatrix: "docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-matrix-summary.redacted.json",
  settlementReadiness: "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-readiness-summary.redacted.json",
  settlementExecution: "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-execution-summary.redacted.json",
  resultSettlementExecution:
    "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-scheduler-execution-summary.redacted.json",
  resultSettlementLiveBlocked:
    "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-scheduler-execution-live-blocked.redacted.json",
  manualSettlement: "docs/mobile/harness/odds-api-live-runtime/one-event-manual-settlement-summary.redacted.json",
  resultIngestion: "docs/mobile/harness/odds-api-live-runtime/one-event-result-ingestion-summary.redacted.json",
  resultIngestionAuditEvent:
    "docs/mobile/harness/odds-api-live-runtime/one-event-result-ingestion-audit-event-summary.redacted.json",
  resultPoller: "docs/mobile/harness/odds-api-live-runtime/one-event-result-poller-summary.redacted.json",
  resultPollerProcess:
    "docs/mobile/harness/odds-api-live-runtime/one-event-result-poller-process-summary.redacted.json",
  continuousResultPoller:
    "docs/mobile/harness/odds-api-live-runtime/one-event-continuous-result-poller-proof-summary.redacted.json",
  resultSettlement: "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-summary.redacted.json",
  resultSettlementRun: "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-run-summary.redacted.json",
  settlementPreflight:
    "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-preflight-summary.redacted.json",
  settlementAuditEvent:
    "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-audit-event-summary.redacted.json",
  settlementApprovalAuditEvent:
    "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-approval-audit-event-summary.redacted.json",
  resultReviewTrail:
    "docs/mobile/harness/odds-api-live-runtime/one-event-result-review-trail-summary.redacted.json",
  activeSettlementReadiness:
    "docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-readiness-summary.redacted.json",
  activeSettlementClosedEligibility:
    "docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-closed-eligibility-summary.redacted.json",
  approvedAutoSettlement:
    "docs/mobile/harness/odds-api-live-runtime/one-event-approved-auto-settlement-summary.redacted.json",
  activeSettlementClone:
    "docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-clone-summary.redacted.json",
  supervisorApprovedSettlement:
    "docs/mobile/harness/odds-api-live-runtime/one-event-supervisor-approved-settlement-wait-summary.redacted.json",
  makerSeed: "docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json",
  providerMakerHandoff:
    "docs/mobile/harness/odds-api-live-runtime/provider-maker-handoff-summary.redacted.json",
  s23Visible: "docs/mobile/harness/cycle-LIVEODDSS23-odds-api-live-runtime-s23/cycle-LIVEODDSS23-odds-api-s23-visible-flow.json",
};

type JsonObject = Record<string, unknown>;

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

async function readJson(filePath: string): Promise<JsonObject | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as JsonObject;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function writeJson(outputPath: string, value: unknown) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function getPath(source: unknown, keys: string[]) {
  let cursor = source;
  for (const key of keys) {
    if (!cursor || typeof cursor !== "object" || !(key in cursor)) return null;
    cursor = (cursor as JsonObject)[key];
  }
  return cursor;
}

function bool(value: unknown) {
  return value === true;
}

function text(value: unknown) {
  return typeof value === "string" ? value : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function pass(summary: JsonObject | null) {
  return bool(summary?.pass) || summary?.result === "pass";
}

function ageHours(generatedAt: unknown) {
  const value = text(generatedAt);
  if (!value) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  return Number(((Date.now() - parsed) / 3_600_000).toFixed(2));
}

async function fetchJson(url: string, init?: RequestInit) {
  try {
    const response = await fetch(url, init);
    const body = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, body, error: null };
  } catch (error) {
    return {
      ok: false,
      status: null,
      body: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function resolveLocalAuditAdminUserId() {
  const explicit = argValue("adminUserId") ?? process.env.HOLIWYN_INTERNAL_OPERATOR_USER_ID ?? process.env.HOLIWYN_DEV_ADMIN_USER_ID;
  if (explicit) return explicit;

  const prisma = new PrismaClient();
  try {
    const admin = await prisma.user.findFirst({
      where: { isAdmin: true },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    return admin?.id ?? null;
  } finally {
    await prisma.$disconnect();
  }
}

function requirement(params: {
  id: string;
  priority: "P0" | "P1" | "P2";
  requirement: string;
  achieved: boolean;
  evidence: string[];
  notes?: string;
}) {
  return {
    id: params.id,
    priority: params.priority,
    requirement: params.requirement,
    status: params.achieved ? "complete" : "open",
    evidence: params.evidence,
    notes: params.notes ?? null,
  };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run live runtime phase audit in production.");
  }
  const baseUrl = argValue("baseUrl") ?? DEFAULT_BASE_URL;
  const auditAdminUserId = await resolveLocalAuditAdminUserId();
  const internalOperatorFetchInit = auditAdminUserId
    ? {
        headers: {
          "x-dev-admin-user-id": auditAdminUserId,
        },
      }
    : undefined;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const entries = Object.fromEntries(
    await Promise.all(Object.entries(PATHS).map(async ([key, filePath]) => [key, await readJson(filePath)])),
  ) as Record<keyof typeof PATHS, JsonObject | null>;
  const internalTesterRuntimeScript = await fs.readFile("scripts/manage_holiwyn_internal_tester_runtime.ps1", "utf8");
  const managedS23ServerModeStartupKnown =
    internalTesterRuntimeScript.includes("EXPO_PUBLIC_API_BASE_URL = '$BackendBaseUrl'") &&
    internalTesterRuntimeScript.includes("EXPO_PUBLIC_GOOGLE_AUTH_BASE_URL = '$BackendBaseUrl'") &&
    internalTesterRuntimeScript.includes("EXPO_PUBLIC_ORDER_MODE = 'server'") &&
    internalTesterRuntimeScript.includes("EXPO_PUBLIC_MARKET_DATA_MODE = 'server'") &&
    internalTesterRuntimeScript.includes("EXPO_PUBLIC_SHOW_ORDERBOOK = '0'") &&
    internalTesterRuntimeScript.includes("npm --prefix mobile run start -- --host localhost --port $ExpoPort") &&
    internalTesterRuntimeScript.includes('adb -s $Device.deviceId reverse "tcp:$port" "tcp:$port"') &&
    internalTesterRuntimeScript.includes("s23_adb_reverse_failed") &&
    internalTesterRuntimeScript.includes("managerStartedExpoUsesServerMode");
  const health = await fetchJson(`${baseUrl}/api/health`);
  const selectedMarketId = text(getPath(entries.liveProof, ["selectedMarket", "id"]));
  const quote = selectedMarketId
    ? await fetchJson(`${baseUrl}/api/markets/${encodeURIComponent(selectedMarketId)}/quote`)
    : null;
  const localRuntimeStatus = await fetchJson(`${baseUrl}/api/internal/live-runtime/status?phaseAuditInProgress=1`);
  const localRuntimeStatusBody =
    localRuntimeStatus.body && typeof localRuntimeStatus.body === "object"
      ? (localRuntimeStatus.body as JsonObject)
      : null;
  const localResultReview = await fetchJson(
    `${baseUrl}/api/internal/live-runtime/result-review`,
    internalOperatorFetchInit,
  );
  const localResultReviewBody =
    localResultReview.body && typeof localResultReview.body === "object"
      ? (localResultReview.body as JsonObject)
      : null;
  const localSettlementQueue = await fetchJson(
    `${baseUrl}/api/internal/live-runtime/settlement-queue`,
    internalOperatorFetchInit,
  );
  const localSettlementQueueBody =
    localSettlementQueue.body && typeof localSettlementQueue.body === "object"
      ? (localSettlementQueue.body as JsonObject)
      : null;
  const localLifecycle = await fetchJson(`${baseUrl}/api/internal/live-runtime/lifecycle`);
  const localLifecycleBody =
    localLifecycle.body && typeof localLifecycle.body === "object" ? (localLifecycle.body as JsonObject) : null;
  const liveEventStart = text(getPath(entries.liveProof, ["event", "commenceTime"]));
  const eventUpcoming = liveEventStart ? Date.parse(liveEventStart) > Date.now() : false;
  const quotaUsed = numberValue(getPath(entries.liveProof, ["provider", "quota", "totalLastCost"]));
  const quotaRemaining = text(getPath(entries.liveProof, ["provider", "quota", "latest", "requestsRemaining"]));
  const supervisorTruth = getPath(entries.supervisor, ["runtimeTruth"]);
  const internalTesterTruth = getPath(entries.internalTesterRuntime, ["runtimeTruth"]);
  const internalTesterResultPollerTruth = getPath(entries.internalTesterResultPoller, ["runtimeTruth"]);
  const internalTesterWatchdogTruth = getPath(entries.internalTesterWatchdog, ["runtimeTruth"]);
  const internalTesterWatchdogFirstIteration = getPath(entries.internalTesterWatchdog, ["iterations", "0"]);
  const continuousSupervisorTruth = getPath(entries.continuousSupervisor, ["runtimeTruth"]);
  const continuousResultPollerTruth = getPath(entries.continuousResultPoller, ["runtimeTruth"]);
  const runtimeStatusTruth = getPath(entries.runtimeStatus, ["modeTruth"]);
  const runtimeStatusCapabilities = getPath(entries.runtimeStatus, ["provenCapabilities"]);
  const staleRunResult = getPath(entries.staleGuardRun, ["result"]);
  const runtimeHeartbeatRecords = getPath(localRuntimeStatusBody, ["runtimeHeartbeats", "records"]);
  const workerOwnedHeartbeatCount = Array.isArray(runtimeHeartbeatRecords)
    ? runtimeHeartbeatRecords.filter((record) => getPath(record, ["metadata", "workerOwned"]) === true).length
    : 0;
  const runtimeRunRecords = getPath(localRuntimeStatusBody, ["runtimeRuns", "records"]);
  const workerOwnedRunCount = Array.isArray(runtimeRunRecords)
    ? runtimeRunRecords.filter((record) => getPath(record, ["metadata", "workerOwned"]) === true).length
    : 0;
  const requirements = [
    requirement({
      id: "survey-existing-runtime-services",
      priority: "P0",
      requirement: "Existing backend/provider/bot/runtime services are surveyed and classified.",
      achieved: true,
      evidence: ["docs/mobile/BACKEND_LIVE_RUNTIME_SURVEY.md", "docs/mobile/MARKET_MAKER_LIVE_RUNTIME_REPORT.md"],
    }),
    requirement({
      id: "provider-live-refresh",
      priority: "P0",
      requirement: "One upcoming soccer event can refresh from live provider odds with quota protection.",
      achieved: pass(entries.liveProof) && eventUpcoming && quotaUsed != null && quotaUsed <= 16 && quotaRemaining != null,
      evidence: [PATHS.liveProof],
      notes: `quotaUsed=${quotaUsed ?? "unknown"}, quotaRemaining=${quotaRemaining ?? "unknown"}, eventStart=${liveEventStart ?? "unknown"}`,
    }),
    requirement({
      id: "refresh-mode-truth",
      priority: "P0",
      requirement: "Runtime distinguishes live provider refresh from replay/cached checks.",
      achieved:
        pass(entries.runtimeStatus) &&
        getPath(runtimeStatusTruth, ["cachedRuntimeUsesQuota"]) === false &&
        getPath(entries.runtimeStatus, ["settlementSafety", "checks", "liveMarketExecutionBlocked"]) === true &&
        getPath(entries.runtimeStatus, ["settlementSafety", "checks", "liveBlockedArtifactShowsBlocked"]) === true &&
        getPath(entries.runtimeStatus, ["settlementSafety", "executionRequiresMarketStatus"]) === "CLOSED",
      evidence: [PATHS.runtimeStatus, PATHS.onboarding],
      notes:
        "Runtime status also surfaces the trusted-result settlement guard: execution requires CLOSED market status and live-market execution is blocked.",
    }),
    requirement({
      id: "runtime-status-capability-truth",
      priority: "P0",
      requirement:
        "Runtime status separates latest supervisor run profile from proven continuous supervisor/result-poller capabilities.",
      achieved:
        pass(entries.runtimeStatus) &&
        getPath(runtimeStatusTruth, ["latestSupervisorRunProfileOnly"]) === true &&
        getPath(runtimeStatusCapabilities, ["repeatedSupervisorCycles"]) === true &&
        getPath(runtimeStatusCapabilities, ["makerReseedWhileSupervisorRuns"]) === true &&
        getPath(runtimeStatusCapabilities, ["lifecycleSchedulerWhileSupervisorRuns"]) === true &&
        getPath(runtimeStatusCapabilities, ["resultIngestionWhileSupervisorRuns"]) === true &&
        getPath(runtimeStatusCapabilities, ["resultSettlementSchedulerWhileSupervisorRuns"]) === true &&
        getPath(runtimeStatusCapabilities, ["resultPollingBackgroundProof"]) === true &&
        getPath(runtimeStatusCapabilities, ["resultPollingContinuousWhileRunnerRuns"]) === true &&
        getPath(runtimeStatusCapabilities, ["resultSettlementSchedulerWhilePollerRuns"]) === true &&
        getPath(runtimeStatusCapabilities, ["installedOsService"]) === false,
      evidence: [PATHS.runtimeStatus, PATHS.continuousSupervisor, PATHS.continuousResultPoller],
      notes:
        "This prevents narrow latest supervisor proof runs from hiding previously proven repeated maker reseed, lifecycle scheduling, result ingestion, and result-poller behavior.",
    }),
    requirement({
      id: "one-command-runtime-loop-proof",
      priority: "P0",
      requirement:
        "One-command onboarding can explicitly start the local supervisor/result-poller loops, prove both are running, and clean them up afterward.",
      achieved:
        pass(entries.onboarding) &&
        pass(entries.onboardingRuntimeStart) &&
        pass(entries.onboardingRuntimeStatus) &&
        pass(entries.onboardingRuntimeStop) &&
        getPath(entries.onboarding, ["providerPolicy", "runtimeLoopStartRequiresExplicitFlag"]) === true &&
        getPath(entries.onboarding, ["providerPolicy", "runtimeLoopCleanupRequested"]) === true &&
        getPath(entries.onboarding, ["runtimeTruth", "runtimeLoopsStartedByOnboarding"]) === true &&
        getPath(entries.onboarding, ["runtimeTruth", "runtimeLoopsRunningDuringProof"]) === true &&
        getPath(entries.onboarding, ["runtimeTruth", "runtimeLoopsStoppedAfterProof"]) === true &&
        getPath(entries.onboardingRuntimeStatus, [
          "supervisor",
          "processSummary",
          "process",
          "after",
          "running",
        ]) === true &&
        getPath(entries.onboardingRuntimeStatus, [
          "resultPoller",
          "processSummary",
          "process",
          "after",
          "running",
        ]) === true &&
        getPath(entries.onboardingRuntimeStop, [
          "supervisor",
          "processSummary",
          "process",
          "after",
          "running",
        ]) === false &&
        getPath(entries.onboardingRuntimeStop, [
          "resultPoller",
          "processSummary",
          "process",
          "after",
          "running",
        ]) === false,
      evidence: [
        PATHS.onboarding,
        PATHS.onboardingRuntimeStart,
        PATHS.onboardingRuntimeStatus,
        PATHS.onboardingRuntimeStop,
      ],
      notes:
        "This proves the local one-event runtime can be brought up through the onboarding wrapper without treating those local processes as installed OS services.",
    }),
    requirement({
      id: "local-status-api-ready",
      priority: "P0",
      requirement:
        "Local live-runtime status API reports ready with fresh proof artifacts, fresh selected-market provider snapshots, and current managed process visibility.",
      achieved:
        !!localRuntimeStatusBody &&
        getPath(localRuntimeStatusBody, ["runtimeTruth", "localInternalRuntimeReady"]) === true &&
        getPath(localRuntimeStatusBody, ["runtimeTruth", "providerQuotaUsedByStatus"]) === false &&
        getPath(localRuntimeStatusBody, ["phaseCompletion", "checked"]) === true &&
        getPath(localRuntimeStatusBody, ["phaseCompletion", "providerQuotaUsedByStatus"]) === false &&
        getPath(localRuntimeStatusBody, ["phaseCompletion", "fullProductionRuntimeComplete"]) === false &&
        getPath(localRuntimeStatusBody, ["phaseCompletion", "installedUnattendedService"]) === false &&
        getPath(localRuntimeStatusBody, ["phaseCompletion", "activeTesterSettlementExecutionAttempted"]) === false &&
        typeof getPath(localRuntimeStatusBody, ["phaseCompletion", "answers", "marketMakerContinuous"]) === "string" &&
        typeof getPath(localRuntimeStatusBody, ["phaseCompletion", "answers", "oddsRefreshLiveOrReplay"]) === "string" &&
        getPath(localRuntimeStatusBody, ["phaseCompletion", "answers", "oddsRefreshCadence"]) != null &&
        typeof getPath(localRuntimeStatusBody, ["phaseCompletion", "answers", "oddsRefreshCadence"]) === "object" &&
        getPath(localRuntimeStatusBody, ["phaseCompletion", "answers", "quotaProtection"]) != null &&
        typeof getPath(localRuntimeStatusBody, ["phaseCompletion", "answers", "quotaProtection"]) === "object" &&
        typeof getPath(localRuntimeStatusBody, ["phaseCompletion", "answers", "staleHandling"]) === "string" &&
        typeof getPath(localRuntimeStatusBody, ["phaseCompletion", "answers", "lifecycle"]) === "string" &&
        typeof getPath(localRuntimeStatusBody, ["phaseCompletion", "answers", "activeSettlement"]) === "string" &&
        Array.isArray(getPath(localRuntimeStatusBody, ["phaseCompletion", "p0"])) &&
        Array.isArray(getPath(localRuntimeStatusBody, ["phaseCompletion", "p1"])) &&
        Array.isArray(getPath(localRuntimeStatusBody, ["phaseCompletion", "p2"])) &&
        Array.isArray(getPath(localRuntimeStatusBody, ["phaseCompletion", "completionRequirements"])) &&
        (getPath(localRuntimeStatusBody, ["phaseCompletion", "completionRequirements"]) as unknown[]).length >= 7 &&
        (getPath(localRuntimeStatusBody, ["phaseCompletion", "completionRequirements"]) as unknown[]).every(
          (requirement) =>
            requirement &&
            typeof requirement === "object" &&
            typeof getPath(requirement, ["key"]) === "string" &&
            typeof getPath(requirement, ["pass"]) === "boolean" &&
            typeof getPath(requirement, ["answer"]) === "string" &&
            Array.isArray(getPath(requirement, ["evidence"])),
        ) &&
        getPath(localRuntimeStatusBody, ["launchProfile", "checked"]) === true &&
        getPath(localRuntimeStatusBody, ["launchProfile", "pass"]) === true &&
        getPath(localRuntimeStatusBody, ["launchProfile", "runtimeTruth", "localOperatorLaunchProfileDocumented"]) === true &&
        getPath(localRuntimeStatusBody, ["launchProfile", "runtimeTruth", "noProviderQuotaSpentByDefaultProfile"]) === true &&
        getPath(localRuntimeStatusBody, ["launchProfile", "runtimeTruth", "activeTesterSettlementExecution"]) === false &&
        getPath(localRuntimeStatusBody, ["launchProfile", "runtimeTruth", "installedProductionService"]) === false &&
        typeof getPath(localRuntimeStatusBody, ["launchProfile", "recommendedInternalTesterProfile", "command"]) === "string" &&
        Array.isArray(getPath(localRuntimeStatusBody, ["launchProfile", "manualForegroundProfile", "commands"])) &&
        typeof getPath(localRuntimeStatusBody, ["launchProfile", "scheduledTaskProfile", "usableInCurrentContext"]) === "boolean" &&
        typeof getPath(localRuntimeStatusBody, ["launchProfile", "liveProviderProfile", "defaultForInternalTesting"]) === "boolean" &&
        Array.isArray(getPath(localRuntimeStatusBody, ["launchProfile", "p0"])) &&
        (getPath(localRuntimeStatusBody, ["launchProfile", "p0"]) as unknown[]).length === 0 &&
        getPath(localRuntimeStatusBody, ["freshness", "completionAuditFresh"]) === true &&
        getPath(localRuntimeStatusBody, ["freshness", "phaseAuditFresh"]) === true &&
        getPath(localRuntimeStatusBody, ["freshness", "watchdogFresh"]) === true &&
        getPath(localRuntimeStatusBody, ["freshness", "liveProofFresh"]) === true &&
        getPath(localRuntimeStatusBody, ["providerSnapshots", "fresh"]) === true &&
        getPath(localRuntimeStatusBody, ["providerSnapshots", "freshnessBasis"]) === "local_proof_window" &&
        typeof getPath(localRuntimeStatusBody, ["providerSnapshots", "mobileLifecycleStatus"]) === "string" &&
        typeof getPath(localRuntimeStatusBody, ["providerSnapshots", "mobileStaleAfterSeconds"]) === "number" &&
        typeof getPath(localRuntimeStatusBody, ["providerSnapshots", "nextProviderAction"]) === "string" &&
        Number(getPath(localRuntimeStatusBody, ["providerSnapshots", "snapshotCount"]) ?? 0) > 0 &&
        getPath(localRuntimeStatusBody, ["providerRefreshRuns", "checked"]) === true &&
        getPath(localRuntimeStatusBody, ["providerRefreshRuns", "durable"]) === true &&
        getPath(localRuntimeStatusBody, ["providerRefreshRuns", "latestRunPassed"]) === true &&
        getPath(localRuntimeStatusBody, ["providerRefreshRuns", "latestRunQuotaProtected"]) === true &&
        getPath(localRuntimeStatusBody, ["providerRefreshRuns", "latestRunWithinBudget"]) === true &&
        getPath(localRuntimeStatusBody, ["providerRefreshRuns", "latestRunReadyAfterRefresh"]) === true &&
        getPath(localRuntimeStatusBody, ["providerRefreshRuns", "latestRunStaleBeforeRefresh"]) === true &&
        getPath(localRuntimeStatusBody, ["providerRefreshRuns", "providerQuotaUsedByStatus"]) === false &&
        getPath(localRuntimeStatusBody, ["marketMakerQuoteRuns", "checked"]) === true &&
        getPath(localRuntimeStatusBody, ["marketMakerQuoteRuns", "durable"]) === true &&
        getPath(localRuntimeStatusBody, ["marketMakerQuoteRuns", "latestRunPassed"]) === true &&
        getPath(localRuntimeStatusBody, ["marketMakerQuoteRuns", "latestRunLocalOnly"]) === true &&
        getPath(localRuntimeStatusBody, ["marketMakerQuoteRuns", "latestRunShiftedWorseThanProvider"]) === true &&
        getPath(localRuntimeStatusBody, ["marketMakerQuoteRuns", "latestRunQuoteRouteReady"]) === true &&
        getPath(localRuntimeStatusBody, ["marketMakerQuoteRuns", "latestRunSnapshotFresh"]) === true &&
        getPath(localRuntimeStatusBody, ["marketMakerQuoteRuns", "repeatedLocalRunsProven"]) === true &&
        getPath(localRuntimeStatusBody, ["marketMakerQuoteRuns", "installedOsService"]) === false &&
        typeof getPath(localRuntimeStatusBody, ["operatorNextActions", "recommendedFirstAction"]) === "string" &&
        getPath(localRuntimeStatusBody, ["operatorNextActions", "defaultNoQuotaAction"]) === "cached_internal_testing" &&
        typeof getPath(localRuntimeStatusBody, ["operatorNextActions", "liveOddsAction"]) === "string" &&
        Array.isArray(getPath(localRuntimeStatusBody, ["operatorNextActions", "actions"])) &&
        (getPath(localRuntimeStatusBody, ["operatorNextActions", "actions"]) as unknown[]).some(
          (action) =>
            action &&
            typeof action === "object" &&
            getPath(action, ["id"]) === "cached_internal_testing" &&
            getPath(action, ["spendsProviderQuota"]) === false,
        ) &&
        (getPath(localRuntimeStatusBody, ["operatorNextActions", "actions"]) as unknown[]).some(
          (action) =>
            action &&
            typeof action === "object" &&
            getPath(action, ["id"]) === "start_full_internal_tester_runtime" &&
            getPath(action, ["requiresProviderKey"]) === false &&
            getPath(action, ["spendsProviderQuota"]) === false &&
            getPath(action, ["command"]) ===
              "npm run mobile:internal-tester-runtime -- -Action start -StartSupervisor -StartResultPoller -RunResultIngestion -RunResultSettlement -RunApprovedResultSettlement -WaitForReady",
        ) &&
        (getPath(localRuntimeStatusBody, ["operatorNextActions", "actions"]) as unknown[]).some(
          (action) =>
            action &&
            typeof action === "object" &&
            getPath(action, ["id"]) === "prove_one_command_runtime_loops" &&
            getPath(action, ["requiresProviderKey"]) === false &&
            getPath(action, ["spendsProviderQuota"]) === false &&
            getPath(action, ["command"]) ===
              "npm run mobile:one-event-onboarding -- -AllowDisconnectedS23 -StartRuntimeLoops -StopRuntimeLoopsAfterProof",
        ) &&
        getPath(localRuntimeStatusBody, ["settlementDecision", "checked"]) === true &&
        getPath(localRuntimeStatusBody, ["settlementDecision", "pass"]) === true &&
        getPath(localRuntimeStatusBody, ["settlementDecision", "providerQuotaUsed"]) === false &&
        getPath(localRuntimeStatusBody, ["settlementDecision", "marketMustBeClosed"]) === true &&
        getPath(localRuntimeStatusBody, ["settlementDecision", "activeMarketExecutionAttempted"]) === false &&
        getPath(localRuntimeStatusBody, ["settlementDecision", "closedStateEligibilityProven"]) === true &&
        getPath(localRuntimeStatusBody, ["settlementDecision", "closedStateEligibility", "checked"]) === true &&
        getPath(localRuntimeStatusBody, ["settlementDecision", "closedStateEligibility", "provesEligibilityAfterClose"]) === true &&
        getPath(localRuntimeStatusBody, ["settlementDecision", "closedStateEligibility", "activeEventSettlementExecuted"]) === false &&
        getPath(localRuntimeStatusBody, ["settlementDecision", "closedStateEligibility", "activeMarketRestored"]) === true &&
        getPath(localRuntimeStatusBody, ["settlementDecision", "nextSafeAction"]) ===
          "wait_for_or_apply_market_close_before_execution" &&
        getPath(localRuntimeStatusBody, ["settlementQueue", "checked"]) === true &&
        getPath(localRuntimeStatusBody, ["settlementQueue", "pass"]) === true &&
        getPath(localRuntimeStatusBody, ["settlementQueue", "providerQuotaUsed"]) === false &&
        getPath(localRuntimeStatusBody, ["settlementQueue", "readOnlyRoute"]) === true &&
        getPath(localRuntimeStatusBody, ["settlementQueue", "devOnlyRoute"]) === true &&
        getPath(localRuntimeStatusBody, ["settlementQueue", "operatorQueueAvailable"]) === true &&
        getPath(localRuntimeStatusBody, ["settlementQueue", "redactedOperatorExecutionPlanAvailable"]) === true &&
        getPath(localRuntimeStatusBody, ["settlementQueue", "structuredOperatorExecutionPlanAvailable"]) === true &&
        getPath(localRuntimeStatusBody, ["settlementQueue", "exactConfirmationStringsExposed"]) === false &&
        getPath(localRuntimeStatusBody, ["settlementQueue", "exactConfirmationStored"]) === false &&
        getPath(localRuntimeStatusBody, ["settlementQueue", "activeMarketExecutionAttempted"]) === false &&
        Number(getPath(localRuntimeStatusBody, ["settlementQueue", "queue", "itemCount"]) ?? 0) > 0 &&
        typeof getPath(localRuntimeStatusBody, ["settlementQueue", "firstItem", "operatorAction", "label"]) ===
          "string" &&
        typeof getPath(localRuntimeStatusBody, ["settlementQueue", "firstItem", "operatorAction", "nextCommand"]) ===
          "string" &&
        getPath(localRuntimeStatusBody, [
          "settlementQueue",
          "firstItem",
          "operatorAction",
          "exactConfirmationExposed",
        ]) === false &&
        getPath(localRuntimeStatusBody, [
          "settlementQueue",
          "firstItem",
          "operatorAction",
          "providerQuotaRequired",
        ]) === false &&
        getPath(localRuntimeStatusBody, [
          "settlementQueue",
          "firstItem",
          "operatorExecutionPlan",
          "version",
        ]) === 1 &&
        getPath(localRuntimeStatusBody, [
          "settlementQueue",
          "firstItem",
          "operatorExecutionPlan",
          "providerQuotaRequired",
        ]) === false &&
        getPath(localRuntimeStatusBody, [
          "settlementQueue",
          "firstItem",
          "operatorExecutionPlan",
          "exactConfirmationExposed",
        ]) === false &&
        getPath(localRuntimeStatusBody, [
          "settlementQueue",
          "firstItem",
          "operatorExecutionPlan",
          "exactConfirmationStored",
        ]) === false &&
        getPath(localRuntimeStatusBody, [
          "settlementQueue",
          "firstItem",
          "approvalEvidence",
          "durableReviewRowAvailable",
        ]) === true &&
        getPath(localRuntimeStatusBody, [
          "settlementQueue",
          "firstItem",
          "approvalEvidence",
          "canonicalApprovalEventAvailable",
        ]) === true &&
        getPath(localRuntimeStatusBody, [
          "settlementQueue",
          "firstItem",
          "approvalEvidence",
          "exactConfirmationStored",
        ]) === false &&
        getPath(localRuntimeStatusBody, [
          "settlementQueue",
          "firstItem",
          "approvalEvidence",
          "exactConfirmationRedacted",
        ]) === true &&
        getPath(localRuntimeStatusBody, [
          "settlementQueue",
          "firstItem",
          "executionEvidence",
          "durableReviewRowAvailable",
        ]) === true &&
        getPath(localRuntimeStatusBody, [
          "settlementQueue",
          "firstItem",
          "executionEvidence",
          "exactConfirmationStored",
        ]) === false &&
        getPath(localRuntimeStatusBody, [
          "settlementQueue",
          "firstItem",
          "executionEvidence",
          "exactConfirmationRedacted",
        ]) === true &&
        Array.isArray(getPath(localRuntimeStatusBody, ["settlementQueue", "p0"])) &&
        (getPath(localRuntimeStatusBody, ["settlementQueue", "p0"]) as unknown[]).length === 0 &&
        !JSON.stringify(getPath(localRuntimeStatusBody, ["settlementQueue"])).includes("SETTLE_FROM_RESULT:") &&
        getPath(localRuntimeStatusBody, ["runtimeCapabilities", "latestRunProfileOnly"]) === true &&
        getPath(localRuntimeStatusBody, ["runtimeCapabilities", "provenCapabilities", "repeatedSupervisorCycles"]) === true &&
        getPath(localRuntimeStatusBody, ["runtimeCapabilities", "provenCapabilities", "makerReseedWhileSupervisorRuns"]) === true &&
        getPath(localRuntimeStatusBody, ["runtimeCapabilities", "provenCapabilities", "resultPollingBackgroundProof"]) === true &&
        getPath(localRuntimeStatusBody, ["runtimeCapabilities", "provenCapabilities", "installedOsService"]) === false &&
        getPath(localRuntimeStatusBody, ["runtimeCapabilities", "currentProcessState", "quotaSpendingLoopRunning"]) === false &&
        getPath(localRuntimeStatusBody, ["currentRuntimeState", "checked"]) === true &&
        getPath(localRuntimeStatusBody, ["currentRuntimeState", "localCapabilityReady"]) === true &&
        typeof getPath(localRuntimeStatusBody, ["currentRuntimeState", "mode"]) === "string" &&
        typeof getPath(localRuntimeStatusBody, ["currentRuntimeState", "nextAction"]) === "string" &&
        getPath(localRuntimeStatusBody, ["currentRuntimeState", "quotaSpendingLoopRunning"]) === false &&
        Array.isArray(getPath(localRuntimeStatusBody, ["currentRuntimeState", "p0"])) &&
        (getPath(localRuntimeStatusBody, ["currentRuntimeState", "p0"]) as unknown[]).length === 0 &&
        getPath(localRuntimeStatusBody, ["serviceOwnership", "checked"]) === true &&
        getPath(localRuntimeStatusBody, ["serviceOwnership", "serviceModel"]) ===
          "local_foreground_worker_processes" &&
        getPath(localRuntimeStatusBody, ["serviceOwnership", "productionServiceInstalled"]) === false &&
        getPath(localRuntimeStatusBody, ["serviceOwnership", "installedOsService"]) === false &&
        getPath(localRuntimeStatusBody, ["serviceOwnership", "foregroundSupervisorProven"]) === true &&
        getPath(localRuntimeStatusBody, ["serviceOwnership", "foregroundResultPollerProven"]) === true &&
        getPath(localRuntimeStatusBody, ["serviceOwnership", "foregroundLoopsProven"]) === true &&
        getPath(localRuntimeStatusBody, ["serviceOwnership", "current", "quotaSpendingLoopRunning"]) === false &&
        typeof getPath(localRuntimeStatusBody, [
          "serviceOwnership",
          "localLaunch",
          "recommendedProfileCommand",
        ]) === "string" &&
        typeof getPath(localRuntimeStatusBody, [
          "serviceOwnership",
          "localLaunch",
          "recommendedProfileInstallCommand",
        ]) === "string" &&
        typeof getPath(localRuntimeStatusBody, [
          "serviceOwnership",
          "localLaunch",
          "recommendedProfileUninstallCommand",
        ]) === "string" &&
        typeof getPath(localRuntimeStatusBody, [
          "serviceOwnership",
          "localLaunch",
          "recommendedProfileQuotaMode",
        ]) === "string" &&
        typeof getPath(localRuntimeStatusBody, [
          "serviceOwnership",
          "localLaunch",
          "recommendedProfileProductionBoundary",
        ]) === "string" &&
        typeof getPath(localRuntimeStatusBody, [
          "serviceOwnership",
          "localLaunch",
          "scheduledTaskPlanCommand",
        ]) === "string" &&
        typeof getPath(localRuntimeStatusBody, [
          "serviceOwnership",
          "localLaunch",
          "scheduledTaskInstallCommand",
        ]) === "string" &&
        typeof getPath(localRuntimeStatusBody, ["serviceOwnership", "localLaunch", "liveProviderCommand"]) ===
          "string" &&
        typeof getPath(localRuntimeStatusBody, [
          "serviceOwnership",
          "localLaunch",
          "liveProviderInternalTesterCommand",
        ]) === "string" &&
        getPath(localRuntimeStatusBody, [
          "serviceOwnership",
          "localLaunch",
          "liveProviderDefaultForInternalTesting",
        ]) === false &&
        typeof getPath(localRuntimeStatusBody, ["serviceOwnership", "localLaunch", "liveProviderQuotaMode"]) ===
          "string" &&
        getPath(localRuntimeStatusBody, [
          "serviceOwnership",
          "localLaunch",
          "ownershipProof",
          "startup",
          "installProofPass",
        ]) === true &&
        typeof getPath(localRuntimeStatusBody, [
          "serviceOwnership",
          "localLaunch",
          "ownershipProof",
          "startup",
          "launcherInstalledNow",
        ]) === "boolean" &&
        getPath(localRuntimeStatusBody, [
          "serviceOwnership",
          "localLaunch",
          "ownershipProof",
          "startup",
          "proofLeavesNoLauncher",
        ]) === true &&
        getPath(localRuntimeStatusBody, [
          "serviceOwnership",
          "localLaunch",
          "ownershipProof",
          "scheduledTask",
          "installAuditPass",
        ]) === true &&
        typeof getPath(localRuntimeStatusBody, [
          "serviceOwnership",
          "localLaunch",
          "ownershipProof",
          "scheduledTask",
          "installBlockedByWindowsPermission",
        ]) === "boolean" &&
        typeof getPath(localRuntimeStatusBody, [
          "serviceOwnership",
          "localLaunch",
          "ownershipProof",
          "scheduledTask",
          "installedNow",
        ]) === "boolean" &&
        getPath(localRuntimeStatusBody, [
          "serviceOwnership",
          "localLaunch",
          "ownershipProof",
          "foregroundProcesses",
          "noProviderQuotaByDefault",
        ]) === true &&
        getPath(localRuntimeStatusBody, ["serviceOwnership", "liveProviderMode", "statusRouteSpendsProviderQuota"]) ===
          false &&
        getPath(localRuntimeStatusBody, [
          "serviceOwnership",
          "liveProviderMode",
          "defaultInternalTesterModeSpendsProviderQuota",
        ]) === false &&
        getPath(localRuntimeStatusBody, ["serviceOwnership", "liveProviderMode", "requiresExplicitProviderFlag"]) ===
          true &&
        getPath(localRuntimeStatusBody, [
          "serviceOwnership",
          "liveProviderMode",
          "requiresTheOddsApiKeyForLiveProviderCalls",
        ]) === true &&
        getPath(localRuntimeStatusBody, ["serviceOwnership", "durableEvidence", "providerRefreshRunRecorded"]) ===
          true &&
        getPath(localRuntimeStatusBody, ["serviceOwnership", "durableEvidence", "providerRefreshQuotaProtected"]) ===
          true &&
        getPath(localRuntimeStatusBody, ["serviceOwnership", "durableEvidence", "marketMakerQuoteRunRecorded"]) ===
          true &&
        getPath(localRuntimeStatusBody, ["serviceOwnership", "durableEvidence", "runtimeHeartbeatsRecorded"]) ===
          true &&
        getPath(localRuntimeStatusBody, ["serviceOwnership", "durableEvidence", "runtimeRunsRecorded"]) === true &&
        getPath(localRuntimeStatusBody, ["serviceOwnership", "durableEvidence", "runtimeRunsPassed"]) === true &&
        Array.isArray(getPath(localRuntimeStatusBody, ["serviceOwnership", "p0"])) &&
        (getPath(localRuntimeStatusBody, ["serviceOwnership", "p0"]) as unknown[]).length === 0 &&
        Array.isArray(getPath(localRuntimeStatusBody, ["serviceOwnership", "p1"])) &&
        (getPath(localRuntimeStatusBody, ["serviceOwnership", "p1"]) as unknown[]).includes(
          "installed_unattended_service_not_present",
        ) &&
        getPath(localRuntimeStatusBody, ["providerRefreshLoop", "checked"]) === true &&
        typeof getPath(localRuntimeStatusBody, ["providerRefreshLoop", "mode"]) === "string" &&
        getPath(localRuntimeStatusBody, ["providerRefreshLoop", "statusRouteSpendsProviderQuota"]) === false &&
        getPath(localRuntimeStatusBody, ["providerRefreshLoop", "requiresExplicitRunProviderProofFlag"]) === true &&
        getPath(localRuntimeStatusBody, ["providerRefreshLoop", "requiresTheOddsApiKey"]) === true &&
        typeof getPath(localRuntimeStatusBody, ["providerRefreshLoop", "cadence", "everyIterations"]) === "number" &&
        typeof getPath(localRuntimeStatusBody, ["providerRefreshLoop", "cadence", "maxRuns"]) === "number" &&
        typeof getPath(localRuntimeStatusBody, ["providerRefreshLoop", "cadence", "refreshIterationsPerRun"]) ===
          "number" &&
        getPath(localRuntimeStatusBody, ["providerRefreshLoop", "quotaCaps", "latestRunWithinBudget"]) === true &&
        getPath(localRuntimeStatusBody, ["providerRefreshLoop", "latestRun", "recorded"]) === true &&
        getPath(localRuntimeStatusBody, ["providerRefreshLoop", "latestRun", "status"]) === "passed" &&
        getPath(localRuntimeStatusBody, ["providerRefreshLoop", "latestRun", "staleBeforeRefresh"]) === true &&
        getPath(localRuntimeStatusBody, ["providerRefreshLoop", "latestRun", "readyAfterRefresh"]) === true &&
        getPath(localRuntimeStatusBody, ["providerRefreshLoop", "latestRun", "quotaProtected"]) === true &&
        typeof getPath(localRuntimeStatusBody, ["providerRefreshLoop", "mobileFreshness", "status"]) === "string" &&
        getPath(localRuntimeStatusBody, ["providerRefreshLoop", "mobileFreshness", "refreshDueSeconds"]) === 60 &&
        getPath(localRuntimeStatusBody, ["providerRefreshLoop", "mobileFreshness", "staleAfterSeconds"]) === 90 &&
        Array.isArray(getPath(localRuntimeStatusBody, ["providerRefreshLoop", "p0"])) &&
        (getPath(localRuntimeStatusBody, ["providerRefreshLoop", "p0"]) as unknown[]).length === 0 &&
        getPath(localRuntimeStatusBody, ["settlementAutomation", "checked"]) === true &&
        typeof getPath(localRuntimeStatusBody, ["settlementAutomation", "mode"]) === "string" &&
        getPath(localRuntimeStatusBody, ["settlementAutomation", "resultPolling", "defaultModeSpendsProviderQuota"]) ===
          false &&
        getPath(localRuntimeStatusBody, [
          "settlementAutomation",
          "resultPolling",
          "liveResultIngestionRequiresExplicitFlag",
        ]) === true &&
        getPath(localRuntimeStatusBody, [
          "settlementAutomation",
          "resultPolling",
          "liveResultIngestionRequiresProviderKey",
        ]) === true &&
        getPath(localRuntimeStatusBody, ["settlementAutomation", "resultPolling", "provenBackgroundPolling"]) ===
          true &&
        getPath(localRuntimeStatusBody, [
          "settlementAutomation",
          "resultPolling",
          "settlementSchedulerWhilePollerRuns",
        ]) === true &&
        getPath(localRuntimeStatusBody, [
          "settlementAutomation",
          "approvedScheduler",
          "supervisorWaitModeProven",
        ]) === true &&
        getPath(localRuntimeStatusBody, [
          "settlementAutomation",
          "approvedScheduler",
          "schedulerWhileSupervisorRuns",
        ]) === true &&
        getPath(localRuntimeStatusBody, [
          "settlementAutomation",
          "approvedScheduler",
          "activeEventExecutionAttempted",
        ]) === false &&
        getPath(localRuntimeStatusBody, [
          "settlementAutomation",
          "approvedScheduler",
          "activeEventSettlementExecuted",
        ]) === false &&
        typeof getPath(localRuntimeStatusBody, ["settlementAutomation", "activeEvent", "marketStatus"]) ===
          "string" &&
        getPath(localRuntimeStatusBody, ["settlementAutomation", "activeEvent", "approvedReview"]) === true &&
        typeof getPath(localRuntimeStatusBody, ["settlementAutomation", "activeEvent", "executionAllowedNow"]) ===
          "boolean" &&
        getPath(localRuntimeStatusBody, [
          "settlementAutomation",
          "activeEvent",
          "closedStateEligibilityProven",
        ]) === true &&
        getPath(localRuntimeStatusBody, ["settlementAutomation", "safety", "providerQuotaUsedByStatus"]) === false &&
        getPath(localRuntimeStatusBody, [
          "settlementAutomation",
          "safety",
          "providerQuotaRequiredForExecutionPlan",
        ]) === false &&
        getPath(localRuntimeStatusBody, ["settlementAutomation", "safety", "exactConfirmationRequiredKnown"]) ===
          true &&
        getPath(localRuntimeStatusBody, ["settlementAutomation", "safety", "exactConfirmationStored"]) === false &&
        getPath(localRuntimeStatusBody, ["settlementAutomation", "safety", "exactConfirmationRedacted"]) === true &&
        getPath(localRuntimeStatusBody, ["settlementAutomation", "safety", "exactConfirmationExposed"]) === false &&
        getPath(localRuntimeStatusBody, ["settlementAutomation", "safety", "requiresClosedMarket"]) === true &&
        getPath(localRuntimeStatusBody, ["settlementAutomation", "safety", "requiresApproval"]) === true &&
        getPath(localRuntimeStatusBody, ["settlementAutomation", "safety", "requiresExactConfirmation"]) === true &&
        Array.isArray(getPath(localRuntimeStatusBody, ["settlementAutomation", "p0"])) &&
        (getPath(localRuntimeStatusBody, ["settlementAutomation", "p0"]) as unknown[]).length === 0 &&
        getPath(localRuntimeStatusBody, ["productionReadinessBoundary", "checked"]) === true &&
        getPath(localRuntimeStatusBody, ["productionReadinessBoundary", "localInternalRuntimeReady"]) === true &&
        getPath(localRuntimeStatusBody, ["productionReadinessBoundary", "productionReady"]) === false &&
        getPath(localRuntimeStatusBody, ["productionReadinessBoundary", "fullProductionRuntimeComplete"]) === false &&
        getPath(localRuntimeStatusBody, ["productionReadinessBoundary", "fakeTokenOnly"]) === true &&
        getPath(localRuntimeStatusBody, ["productionReadinessBoundary", "noRealMoneyDeployment"]) === true &&
        getPath(localRuntimeStatusBody, ["productionReadinessBoundary", "defaultModeSpendsProviderQuota"]) === false &&
        getPath(localRuntimeStatusBody, ["productionReadinessBoundary", "providerRefreshStatusRouteSpendsQuota"]) ===
          false &&
        getPath(localRuntimeStatusBody, [
          "productionReadinessBoundary",
          "officialResultAutomation",
          "approvedSchedulerProofAvailable",
        ]) === true &&
        getPath(localRuntimeStatusBody, [
          "productionReadinessBoundary",
          "officialResultAutomation",
          "activeEventExecutionGuard",
        ]) === "requires_closed_market_approval_and_exact_confirmation" &&
        getPath(localRuntimeStatusBody, [
          "productionReadinessBoundary",
          "officialResultAutomation",
          "activeEventExecutionAttempted",
        ]) === false &&
        getPath(localRuntimeStatusBody, [
          "productionReadinessBoundary",
          "officialResultAutomation",
          "activeEventSettlementExecuted",
        ]) === false &&
        Array.isArray(getPath(localRuntimeStatusBody, ["productionReadinessBoundary", "productionBlockers"])) &&
        (getPath(localRuntimeStatusBody, ["productionReadinessBoundary", "productionBlockers"]) as unknown[]).includes(
          "installed_unattended_runtime_service_missing",
        ) &&
        (getPath(localRuntimeStatusBody, ["productionReadinessBoundary", "productionBlockers"]) as unknown[]).includes(
          "production_auto_settlement_execution_not_enabled",
        ) &&
        Array.isArray(getPath(localRuntimeStatusBody, ["productionReadinessBoundary", "requiredBeforeProduction"])) &&
        (getPath(localRuntimeStatusBody, ["productionReadinessBoundary", "requiredBeforeProduction"]) as unknown[])
          .length >= 4 &&
        Array.isArray(getPath(localRuntimeStatusBody, ["productionReadinessBoundary", "p0"])) &&
        (getPath(localRuntimeStatusBody, ["productionReadinessBoundary", "p0"]) as unknown[]).length === 0 &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "checked"]) === true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "mode"]) ===
          "local_dev_read_only_operator_controls" &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "devOnly"]) === true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "readOnly"]) === true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "noProviderQuota"]) === true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "publicMobileRoute"]) === false &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "productionOperatorWorkflowReady"]) === false &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "authenticatedControls", "requiredForProduction"]) ===
          true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "authenticatedControls", "available"]) === false &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "authenticatedControls", "sessionRouteAvailable"]) === true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "authenticatedControls", "roleChecksAvailable"]) === true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "authenticatedControls", "durableOperatorIdentityAvailable"]) === true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "productionAuthRequirements", "version"]) === 1 &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "productionAuthRequirements", "status"]) ===
          "session_route_implemented" &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "productionAuthRequirements", "p1Gap"]) ===
          "authenticated_operator_controls_missing" &&
        getPath(localRuntimeStatusBody, [
          "operatorControlBoundary",
          "productionAuthRequirements",
          "mustRemainServerOwned",
        ]) === true &&
        getPath(localRuntimeStatusBody, [
          "operatorControlBoundary",
          "productionAuthRequirements",
          "publicMobileRouteAllowed",
        ]) === false &&
        getPath(localRuntimeStatusBody, [
          "operatorControlBoundary",
          "productionAuthRequirements",
          "providerQuotaRequired",
        ]) === false &&
        Array.isArray(getPath(localRuntimeStatusBody, ["operatorControlBoundary", "productionAuthRequirements", "requiredRoutes"])) &&
        (getPath(localRuntimeStatusBody, [
          "operatorControlBoundary",
          "productionAuthRequirements",
          "requiredRoutes",
        ]) as unknown[]).some(
          (route) =>
            route &&
            typeof route === "object" &&
            getPath(route, ["id"]) === "operator_session" &&
            getPath(route, ["method"]) === "GET" &&
            getPath(route, ["mutatesState"]) === false &&
            getPath(route, ["implementationStatus"]) === "implemented_read_only",
        ) &&
        (getPath(localRuntimeStatusBody, [
          "operatorControlBoundary",
          "productionAuthRequirements",
          "requiredRoutes",
        ]) as unknown[]).some(
          (route) =>
            route &&
            typeof route === "object" &&
            getPath(route, ["id"]) === "settlement_approval" &&
            getPath(route, ["method"]) === "POST" &&
            getPath(route, ["mutatesState"]) === true &&
            getPath(route, ["implementationStatus"]) === "implemented_guarded_no_execution" &&
            getPath(route, ["exactConfirmationStored"]) === false &&
            getPath(route, ["activeSettlementExecution"]) === false,
        ) &&
        (getPath(localRuntimeStatusBody, [
          "operatorControlBoundary",
          "productionAuthRequirements",
          "requiredRoutes",
        ]) as unknown[]).some(
          (route) =>
            route &&
            typeof route === "object" &&
            getPath(route, ["id"]) === "settlement_execution" &&
            getPath(route, ["method"]) === "POST" &&
            getPath(route, ["mutatesState"]) === true &&
            getPath(route, ["requiresClosedMarket"]) === true &&
            getPath(route, ["requiresExactConfirmation"]) === true &&
            getPath(route, ["implementationStatus"]) === "implemented_guarded_exact_confirmation_local_execution" &&
            getPath(route, ["dryRunOnly"]) === false &&
            getPath(route, ["exactConfirmationExecutionSupported"]) === true &&
            getPath(route, ["executeRequiresApproval"]) === true &&
            getPath(route, ["executeRequiresTwoPersonOrAdminPolicy"]) === true &&
            getPath(route, ["exactConfirmationStored"]) === false &&
            getPath(route, ["activeSettlementExecution"]) === false,
        ) &&
        Array.isArray(getPath(localRuntimeStatusBody, ["operatorControlBoundary", "productionAuthRequirements", "requiredSchema"])) &&
        (getPath(localRuntimeStatusBody, [
          "operatorControlBoundary",
          "productionAuthRequirements",
          "requiredSchema",
        ]) as unknown[]).some(
          (model) =>
            model &&
            typeof model === "object" &&
            getPath(model, ["model"]) === "OperatorAuditEvent" &&
            getPath(model, ["status"]) === "implemented_dedicated_operator_audit_table",
        ) &&
        Array.isArray(getPath(localRuntimeStatusBody, ["operatorControlBoundary", "productionAuthRequirements", "requiredGuards"])) &&
        (getPath(localRuntimeStatusBody, [
          "operatorControlBoundary",
          "productionAuthRequirements",
          "requiredGuards",
        ]) as unknown[]).includes("public_mobile_routes_must_not_expose_operator_controls") &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "operatorSessionRoute", "available"]) ===
          true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "operatorSessionRoute", "mutatesState"]) ===
          false &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "operatorSessionRoute", "publicMobileRoute"]) ===
          false &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "settlementApprovalRoute", "available"]) ===
          true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "settlementApprovalRoute", "mutatesState"]) ===
          true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "settlementApprovalRoute", "mutationScope"]) ===
          "approval_evidence_only" &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "settlementApprovalRoute", "operatorAuditEventRecorded"]) ===
          true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "settlementApprovalRoute", "exactConfirmationStored"]) ===
          false &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "settlementApprovalRoute", "activeSettlementExecution"]) ===
          false &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "settlementExecutionRoute", "available"]) ===
          true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "settlementExecutionRoute", "dryRunOnly"]) ===
          false &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "settlementExecutionRoute", "mutationScope"]) ===
          "dry_run_request_or_exact_confirmed_closed_market_execution" &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "settlementExecutionRoute", "exactConfirmationExecutionSupported"]) ===
          true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "settlementExecutionRoute", "executeRequiresClosedMarket"]) ===
          true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "settlementExecutionRoute", "executeRequiresApproval"]) ===
          true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "settlementExecutionRoute", "executeRequiresExactConfirmation"]) ===
          true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "settlementExecutionRoute", "operatorAuditEventRecorded"]) ===
          true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "settlementExecutionRoute", "twoPersonOrAdminPolicyChecked"]) ===
          true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "settlementExecutionRoute", "providerQuotaRequired"]) ===
          false &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "settlementExecutionRoute", "exactConfirmationExposed"]) ===
          false &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "settlementExecutionRoute", "exactConfirmationStored"]) ===
          false &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "settlementExecutionRoute", "activeSettlementExecution"]) ===
          false &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "resultReviewRoute", "available"]) ===
          true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "resultReviewRoute", "mutatesState"]) ===
          false &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "localControls", "resultReviewRoute", "authRequired"]) ===
          true &&
        getPath(localRuntimeStatusBody, [
          "operatorControlBoundary",
          "localControls",
          "settlementQueueRoute",
          "available",
        ]) === true &&
        getPath(localRuntimeStatusBody, [
          "operatorControlBoundary",
          "localControls",
          "settlementQueueRoute",
          "authRequired",
        ]) === true &&
        getPath(localRuntimeStatusBody, [
          "operatorControlBoundary",
          "localControls",
          "settlementQueueRoute",
          "providerQuotaRequired",
        ]) === false &&
        getPath(localRuntimeStatusBody, [
          "operatorControlBoundary",
          "localControls",
          "approvedSchedulerCommand",
          "exactConfirmationArgumentRedacted",
        ]) === true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "executionSafety", "activeExecutionAttempted"]) ===
          false &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "executionSafety", "activeSettlementExecuted"]) ===
          false &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "executionSafety", "requiresClosedMarket"]) === true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "executionSafety", "requiresApproval"]) === true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "executionSafety", "requiresExactConfirmation"]) ===
          true &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "executionSafety", "exactConfirmationExposed"]) ===
          false &&
        getPath(localRuntimeStatusBody, ["operatorControlBoundary", "executionSafety", "exactConfirmationStored"]) ===
          false &&
        Array.isArray(getPath(localRuntimeStatusBody, ["operatorControlBoundary", "productionBlockers"])) &&
        (getPath(localRuntimeStatusBody, ["operatorControlBoundary", "productionBlockers"]) as unknown[]).includes(
          "authenticated_operator_controls_missing",
        ) &&
        Array.isArray(getPath(localRuntimeStatusBody, ["operatorControlBoundary", "p0"])) &&
        (getPath(localRuntimeStatusBody, ["operatorControlBoundary", "p0"]) as unknown[]).length === 0 &&
        getPath(localRuntimeStatusBody, ["managedProcesses", "supervisor", "checked"]) === true &&
        getPath(localRuntimeStatusBody, ["managedProcesses", "resultPoller", "checked"]) === true &&
        getPath(localRuntimeStatusBody, ["managedProcesses", "quotaSpendingLoopRunning"]) === false &&
        getPath(localRuntimeStatusBody, ["runtimeHeartbeats", "checked"]) === true &&
        getPath(localRuntimeStatusBody, ["runtimeHeartbeats", "durable"]) === true &&
        getPath(localRuntimeStatusBody, ["runtimeHeartbeats", "allExpectedServicesRecorded"]) === true &&
        getPath(localRuntimeStatusBody, ["runtimeHeartbeats", "quotaSpendingHeartbeatRunning"]) === false &&
        getPath(localRuntimeStatusBody, ["runtimeHeartbeats", "installedOsService"]) === false &&
        workerOwnedHeartbeatCount >= 2 &&
        getPath(localRuntimeStatusBody, ["runtimeRuns", "checked"]) === true &&
        getPath(localRuntimeStatusBody, ["runtimeRuns", "durable"]) === true &&
        getPath(localRuntimeStatusBody, ["runtimeRuns", "allExpectedServicesRecorded"]) === true &&
        getPath(localRuntimeStatusBody, ["runtimeRuns", "allExpectedServicesPassed"]) === true &&
        getPath(localRuntimeStatusBody, ["runtimeRuns", "quotaSpendingRunRecorded"]) === false &&
        getPath(localRuntimeStatusBody, ["runtimeRuns", "activeSettlementExecuted"]) === false &&
        getPath(localRuntimeStatusBody, ["runtimeRuns", "installedOsService"]) === false &&
        workerOwnedRunCount >= 2 &&
        Array.isArray(getPath(localRuntimeStatusBody, ["gaps", "p0"])) &&
        (getPath(localRuntimeStatusBody, ["gaps", "p0"]) as unknown[]).length === 0,
      evidence: [`${baseUrl}/api/internal/live-runtime/status?phaseAuditInProgress=1`],
      notes:
        "This gates the phase audit on the dev-only status API, including wall-clock proof freshness, DB-backed ReferenceQuoteSnapshot freshness for the selected market, durable ProviderRefreshRun evidence, machine-readable provider-refresh loop cadence/quota policy, durable MarketMakerQuoteRun evidence, mobile-route freshness/stale thresholds, operator next-action guidance, active settlement closed-market guard truth, settlement queue redacted operator-plan truth, operator control boundary truth, production operator-auth route/schema/guard requirements, active-event closed-state eligibility truth, latest-run-vs-proven-capability separation, current warm-runtime decisioning, explicit foreground-vs-installed service ownership, read-only supervisor/result-poller process state, durable RuntimeServiceHeartbeat rows, worker-owned RuntimeServiceRun rows, and preserved worker-owned metadata. It does not require loops to be running or mobile-route provider snapshots to be fresh to report local capability ready, but it must expose those truths plainly.",
    }),
    requirement({
      id: "local-result-review-api-ready",
      priority: "P0",
      requirement:
        "Local result-review API exposes redacted canonical provider-result, settlement-preflight, and settlement-approval evidence without spending quota or exposing exact settlement confirmation.",
      achieved:
        !!localResultReviewBody &&
        localResultReview.ok === true &&
        getPath(localResultReviewBody, ["status"]) === "ready" &&
        getPath(localResultReviewBody, ["providerQuotaUsed"]) === false &&
        getPath(localResultReviewBody, ["runtimeTruth", "readOnlyRoute"]) === true &&
        getPath(localResultReviewBody, ["runtimeTruth", "devOnlyRoute"]) === true &&
        getPath(localResultReviewBody, ["runtimeTruth", "canonicalProviderResultAuditAvailable"]) === true &&
        getPath(localResultReviewBody, ["runtimeTruth", "canonicalSettlementPreflightAuditAvailable"]) === true &&
        getPath(localResultReviewBody, ["runtimeTruth", "canonicalSettlementApprovalAuditAvailable"]) === true &&
        typeof getPath(localResultReviewBody, ["runtimeTruth", "canonicalSettlementBlockedAuditAvailable"]) === "boolean" &&
        getPath(localResultReviewBody, ["runtimeTruth", "durableOfficialResultReviewRecordAvailable"]) === true &&
        getPath(localResultReviewBody, ["officialResultReview", "exactConfirmationStored"]) === false &&
        getPath(localResultReviewBody, ["officialResultReview", "providerQuotaUsed"]) === false &&
        getPath(localResultReviewBody, ["officialResultReview", "activeMarketExecutionAttempted"]) === false &&
        getPath(localResultReviewBody, ["runtimeTruth", "activeTesterSettlementExecutionAttempted"]) === false &&
        getPath(localResultReviewBody, ["runtimeTruth", "providerQuotaUsed"]) === false &&
        getPath(localResultReviewBody, ["executionDecision", "exactConfirmationRequiredKnown"]) === true &&
        getPath(localResultReviewBody, ["executionDecision", "exactConfirmationRedacted"]) === true &&
        typeof getPath(localResultReviewBody, ["executionDecision", "settlementAlreadyExecuted"]) === "boolean" &&
        typeof getPath(localResultReviewBody, ["executionDecision", "repeatExecutionBlocked"]) === "boolean" &&
        getPath(localResultReviewBody, ["executionDecision", "activeMarketExecutionAttemptedByThisRoute"]) === false &&
        Array.isArray(getPath(localResultReviewBody, ["gaps", "p0"])) &&
        (getPath(localResultReviewBody, ["gaps", "p0"]) as unknown[]).length === 0 &&
        !JSON.stringify(localResultReviewBody).includes("SETTLE_FROM_RESULT:") &&
        !JSON.stringify(localResultReviewBody).includes("THE_ODDS_API_KEY"),
      evidence: [`${baseUrl}/api/internal/live-runtime/result-review`],
      notes:
        "This narrows the official-result operator-review gap by exposing the canonical result/preflight/approval/blocked trail through a dev-only backend route instead of only shell proof scripts. It is read-only, intentionally redacts exact execution confirmation strings, and exposes repeat-execution guard fields without settling the active event.",
    }),
    requirement({
      id: "local-settlement-queue-api-ready",
      priority: "P0",
      requirement:
        "Local settlement queue API exposes durable official-result review rows and safe next actions without spending quota or exposing exact settlement confirmation.",
      achieved:
        !!localSettlementQueueBody &&
        localSettlementQueue.ok === true &&
        getPath(localSettlementQueueBody, ["status"]) === "ready" &&
        getPath(localSettlementQueueBody, ["providerQuotaUsed"]) === false &&
        getPath(localSettlementQueueBody, ["runtimeTruth", "readOnlyRoute"]) === true &&
        getPath(localSettlementQueueBody, ["runtimeTruth", "devOnlyRoute"]) === true &&
        getPath(localSettlementQueueBody, ["runtimeTruth", "usesDurableOfficialResultReviewRows"]) === true &&
        getPath(localSettlementQueueBody, ["runtimeTruth", "operatorQueueAvailable"]) === true &&
        getPath(localSettlementQueueBody, ["runtimeTruth", "redactedOperatorExecutionPlanAvailable"]) === true &&
        getPath(localSettlementQueueBody, ["runtimeTruth", "structuredOperatorExecutionPlanAvailable"]) === true &&
        getPath(localSettlementQueueBody, ["runtimeTruth", "durableApprovalEvidenceAvailable"]) === true &&
        getPath(localSettlementQueueBody, ["runtimeTruth", "exactConfirmationStringsExposed"]) === false &&
        getPath(localSettlementQueueBody, ["runtimeTruth", "exactConfirmationStored"]) === false &&
        getPath(localSettlementQueueBody, ["runtimeTruth", "activeMarketExecutionAttempted"]) === false &&
        getPath(localSettlementQueueBody, ["queue", "itemCount"]) !== 0 &&
        typeof getPath(localSettlementQueueBody, ["queue", "items", "0", "operatorAction", "label"]) === "string" &&
        typeof getPath(localSettlementQueueBody, ["queue", "items", "0", "operatorAction", "nextCommand"]) === "string" &&
        getPath(localSettlementQueueBody, ["queue", "items", "0", "operatorAction", "exactConfirmationExposed"]) === false &&
        getPath(localSettlementQueueBody, ["queue", "items", "0", "operatorAction", "providerQuotaRequired"]) === false &&
        getPath(localSettlementQueueBody, ["queue", "items", "0", "operatorExecutionPlan", "version"]) === 1 &&
        getPath(localSettlementQueueBody, ["queue", "items", "0", "operatorExecutionPlan", "providerQuotaRequired"]) === false &&
        getPath(localSettlementQueueBody, ["queue", "items", "0", "operatorExecutionPlan", "exactConfirmationExposed"]) === false &&
        getPath(localSettlementQueueBody, ["queue", "items", "0", "operatorExecutionPlan", "exactConfirmationStored"]) === false &&
        getPath(localSettlementQueueBody, ["queue", "items", "0", "approvalEvidence", "durableReviewRowAvailable"]) === true &&
        getPath(localSettlementQueueBody, ["queue", "items", "0", "approvalEvidence", "canonicalApprovalEventAvailable"]) === true &&
        getPath(localSettlementQueueBody, ["queue", "items", "0", "approvalEvidence", "exactConfirmationStored"]) === false &&
        getPath(localSettlementQueueBody, ["queue", "items", "0", "approvalEvidence", "exactConfirmationRedacted"]) === true &&
        getPath(localSettlementQueueBody, ["queue", "items", "0", "executionEvidence", "durableReviewRowAvailable"]) === true &&
        getPath(localSettlementQueueBody, ["queue", "items", "0", "executionEvidence", "exactConfirmationStored"]) === false &&
        getPath(localSettlementQueueBody, ["queue", "items", "0", "executionEvidence", "exactConfirmationRedacted"]) === true &&
        getPath(localSettlementQueueBody, ["checks", "canonicalApprovalEvidenceForApprovedReviews"]) === true &&
        getPath(localSettlementQueueBody, ["checks", "canonicalExecutionEvidenceForExecutedReviews"]) === true &&
        Array.isArray(getPath(localSettlementQueueBody, ["gaps", "p0"])) &&
        (getPath(localSettlementQueueBody, ["gaps", "p0"]) as unknown[]).length === 0 &&
        !JSON.stringify(localSettlementQueueBody).includes("SETTLE_FROM_RESULT:") &&
        !JSON.stringify(localSettlementQueueBody).includes("THE_ODDS_API_KEY"),
      evidence: [`${baseUrl}/api/internal/live-runtime/settlement-queue`],
      notes:
        "This narrows the operator-review/multi-event queue gap by exposing durable pending settlement work plus a redacted safe operator plan through a dev-only read-only backend route. It does not execute settlement or reveal exact confirmation strings.",
    }),
    requirement({
      id: "local-lifecycle-api-ready",
      priority: "P0",
      requirement:
        "Local lifecycle API exposes open, suspended, closed, and settled/resolved proof status without spending quota or executing active-event settlement.",
      achieved:
        !!localLifecycleBody &&
        localLifecycle.ok === true &&
        getPath(localLifecycleBody, ["status"]) === "ready" &&
        getPath(localLifecycleBody, ["providerQuotaUsed"]) === false &&
        getPath(localLifecycleBody, ["runtimeTruth", "readOnlyRoute"]) === true &&
        getPath(localLifecycleBody, ["runtimeTruth", "devOnlyRoute"]) === true &&
        getPath(localLifecycleBody, ["runtimeTruth", "activeTesterEventSettlementExecuted"]) === false &&
        getPath(localLifecycleBody, ["runtimeTruth", "automaticOfficialResultSettlementInstalled"]) === false &&
        getPath(localLifecycleBody, ["runtimeTruth", "installedOsService"]) === false &&
        getPath(localLifecycleBody, ["lifecycle", "open", "proven"]) === true &&
        getPath(localLifecycleBody, ["lifecycle", "suspended", "proven"]) === true &&
        getPath(localLifecycleBody, ["lifecycle", "closed", "proven"]) === true &&
        getPath(localLifecycleBody, ["lifecycle", "settledResolved", "proven"]) === true &&
        getPath(localLifecycleBody, ["lifecycle", "settledResolved", "activeTesterEventSettlementExecuted"]) === false &&
        getPath(localLifecycleBody, ["lifecycle", "settledResolved", "executionRequiresMarketStatus"]) === "CLOSED" &&
        Array.isArray(getPath(localLifecycleBody, ["gaps", "p0"])) &&
        (getPath(localLifecycleBody, ["gaps", "p0"]) as unknown[]).length === 0 &&
        !JSON.stringify(localLifecycleBody).includes("SETTLE_FROM_RESULT:") &&
        !JSON.stringify(localLifecycleBody).includes("THE_ODDS_API_KEY"),
      evidence: [`${baseUrl}/api/internal/live-runtime/lifecycle`],
      notes:
        "This gives internal tools one backend route for lifecycle truth: open orders, paused rejection, closed rejection, disposable settlement mechanics, trusted-result scheduler execution on disposable evidence, and active-event no-execution truth.",
    }),
    requirement({
      id: "quota-policy",
      priority: "P0",
      requirement: "Provider quota is protected and API key is environment-only.",
      achieved:
        pass(entries.liveProof) &&
        quotaUsed != null &&
        quotaUsed <= 16 &&
        getPath(entries.onboarding, ["providerPolicy", "liveRefreshRequiresExplicitFlag"]) === true,
      evidence: [PATHS.liveProof, PATHS.onboarding, "docs/mobile/ODDS_PROVIDER_REFRESH_POLICY.md"],
    }),
    requirement({
      id: "market-maker-liquidity",
      priority: "P0",
      requirement: "Market maker liquidity is available and shifted worse than provider.",
      achieved:
        pass(entries.makerSeed) &&
        getPath(entries.makerSeed, ["checks", "shiftedBidWorseThanProvider"]) === true &&
        getPath(entries.makerSeed, ["checks", "shiftedAskWorseThanProvider"]) === true &&
        getPath(localRuntimeStatusBody, ["marketMakerQuoteRuns", "latestRunPassed"]) === true &&
        getPath(localRuntimeStatusBody, ["marketMakerQuoteRuns", "latestRunShiftedWorseThanProvider"]) === true &&
        getPath(localRuntimeStatusBody, ["marketMakerQuoteRuns", "latestRunQuoteRouteReady"]) === true &&
        getPath(localRuntimeStatusBody, ["marketMakerQuoteRuns", "repeatedLocalRunsProven"]) === true &&
        quote?.ok === true,
      evidence: [
        PATHS.makerSeed,
        quote ? `${baseUrl}/api/markets/${selectedMarketId}/quote` : "missing quote route",
        `${baseUrl}/api/internal/live-runtime/status`,
      ],
    }),
    requirement({
      id: "market-maker-continuity",
      priority: "P0",
      requirement: "Market maker continuity is explicitly known.",
      achieved:
        pass(entries.supervisor) &&
        pass(entries.continuousSupervisor) &&
        getPath(supervisorTruth, ["marketMakerMode"]) != null &&
        getPath(continuousSupervisorTruth, ["marketMakerReseedWhileRunning"]) === true &&
        getPath(continuousSupervisorTruth, ["lifecycleSchedulerWhileRunning"]) === true &&
        getPath(continuousSupervisorTruth, ["quotaProtected"]) === true &&
        getPath(supervisorTruth, ["unattendedServiceInstalled"]) === false,
      evidence: [PATHS.supervisor, PATHS.supervisorProcess, PATHS.continuousSupervisor],
      notes:
        "Known truth: maker reseeds and lifecycle checks run across repeated local supervisor cycles without provider quota. It is not an installed unattended service.",
    }),
    requirement({
      id: "provider-maker-handoff",
      priority: "P0",
      requirement: "Latest provider refresh evidence is followed by shifted maker quote evidence for the same event, market, and outcome.",
      achieved:
        pass(entries.providerMakerHandoff) &&
        getPath(entries.providerMakerHandoff, ["runtimeTruth", "providerRefreshToMakerQuoteHandoffProven"]) === true &&
        getPath(entries.providerMakerHandoff, ["runtimeTruth", "sameEventMarketOutcome"]) === true &&
        getPath(entries.providerMakerHandoff, ["runtimeTruth", "noProviderQuotaSpentByThisReport"]) === true &&
        getPath(entries.providerMakerHandoff, ["runtimeTruth", "localOnlyMakerQuote"]) === true &&
        getPath(entries.providerMakerHandoff, ["runtimeTruth", "installedOsService"]) === false &&
        getPath(entries.providerMakerHandoff, ["checks", "providerRunReadyAfterRefresh"]) === true &&
        getPath(entries.providerMakerHandoff, ["checks", "makerRunAfterProviderRefreshPassed"]) === true &&
        getPath(entries.providerMakerHandoff, ["checks", "makerRunShiftedWorseThanProvider"]) === true &&
        getPath(entries.providerMakerHandoff, ["checks", "makerRunQuoteRouteVisible"]) === true,
      evidence: [PATHS.providerMakerHandoff, PATHS.liveProof, PATHS.makerSeed],
      notes:
        "This narrows automatic quote replacement: the selected one-event provider refresh has durable handoff evidence to later local shifted maker quotes. It is still not an installed production daemon.",
    }),
    requirement({
      id: "supervisor-result-ingestion",
      priority: "P0",
      requirement: "Supervisor loop runs provider-shaped result ingestion before trusted-result settlement dry-run checks.",
      achieved:
        pass(entries.supervisor) &&
        pass(entries.continuousSupervisor) &&
        getPath(continuousSupervisorTruth, ["resultIngestionWhileRunning"]) === true &&
        getPath(continuousSupervisorTruth, ["resultSettlementSchedulerWhileRunning"]) === true &&
        getPath(continuousSupervisorTruth, ["quotaProtected"]) === true,
      evidence: [PATHS.supervisor, PATHS.continuousSupervisor, PATHS.resultIngestion, PATHS.resultSettlementRun],
      notes:
        "Replay-mode result ingestion is proven inside repeated supervisor cycles. Opt-in live score ingestion is available through quota-capped supervisor controls; installed unattended polling and settlement execution remain P1.",
    }),
    requirement({
      id: "result-poller-runner",
      priority: "P0",
      requirement:
        "A local result polling runner repeatedly ingests provider-shaped score evidence and runs trusted-result settlement scheduling safely.",
      achieved:
        pass(entries.resultPoller) &&
        getPath(entries.resultPoller, ["runtimeTruth", "resultPollingRunnerAvailable"]) === true &&
        (getPath(entries.resultPoller, ["runtimeTruth", "resultPollingContinuousWhileRunnerRuns"]) === true ||
          getPath(continuousResultPollerTruth, ["resultPollingWhileProcessRuns"]) === true) &&
        (getPath(entries.resultPoller, ["runtimeTruth", "settlementSchedulerContinuousWhileRunnerRuns"]) === true ||
          getPath(continuousResultPollerTruth, ["settlementSchedulerWhileProcessRuns"]) === true) &&
        getPath(entries.resultPoller, ["runtimeTruth", "activeTesterSettlementExecution"]) === false &&
        getPath(entries.resultPoller, ["settings", "defaultModeUsesQuota"]) === false,
      evidence: [PATHS.resultPoller, PATHS.resultIngestion, PATHS.resultSettlementRun],
      notes:
        "This proves a dedicated local result-polling loop in replay/no-quota mode. Live score polling remains explicit and quota-capped through the same runner; installed unattended official-result polling remains P1.",
    }),
    requirement({
      id: "result-ingestion-audit-event",
      priority: "P0",
      requirement:
        "Provider-shaped result ingestion can write durable canonical audit evidence before settlement is considered.",
      achieved:
        pass(entries.resultIngestionAuditEvent) &&
        getPath(entries.resultIngestionAuditEvent, ["checks", "canonicalEventTypeMatches"]) === true &&
        getPath(entries.resultIngestionAuditEvent, ["checks", "payloadDigestMatches"]) === true &&
        getPath(entries.resultIngestionAuditEvent, ["checks", "payloadSettlementExecutionFalse"]) === true &&
        getPath(entries.resultIngestionAuditEvent, ["checks", "providerQuotaNotUsed"]) === true,
      evidence: [PATHS.resultIngestionAuditEvent, PATHS.resultIngestion],
      notes:
        "This records provider result ingestion as canonical event-stream evidence in replay/no-quota mode. It is not yet a dedicated official-result table or unattended polling service.",
    }),
    requirement({
      id: "result-poller-background-process",
      priority: "P0",
      requirement:
        "The dedicated result polling runner can run as a local background process and stop cleanly without provider quota.",
      achieved:
        pass(entries.continuousResultPoller) &&
        pass(entries.resultPollerProcess) &&
        getPath(continuousResultPollerTruth, ["backgroundPollerRan"]) === true &&
        getPath(continuousResultPollerTruth, ["stoppedCleanly"]) === true &&
        getPath(continuousResultPollerTruth, ["resultPollingWhileProcessRuns"]) === true &&
        getPath(continuousResultPollerTruth, ["providerQuotaUsed"]) === false &&
        getPath(continuousResultPollerTruth, ["activeTesterSettlementExecution"]) === false,
      evidence: [PATHS.continuousResultPoller, PATHS.resultPollerProcess, PATHS.resultPoller],
      notes:
        "This closes the gap between a foreground poll command and a manageable local background process. It remains a local process manager, not an installed OS service.",
    }),
    requirement({
      id: "mobile-trading-flow",
      priority: "P0",
      requirement: "Mobile can trade the one upcoming event end-to-end and Portfolio/history reflect it.",
      achieved: pass(entries.liveProof) && entries.s23Visible?.result === "pass" && pass(entries.readiness),
      evidence: [PATHS.liveProof, PATHS.readiness, PATHS.s23Visible],
    }),
    requirement({
      id: "stale-handling",
      priority: "P0",
      requirement: "Stale odds handling is proven and available in supervisor workflow.",
      achieved:
        pass(entries.staleGuardProof) &&
        pass(entries.staleGuardRun) &&
        getPath(entries.staleGuardProof, ["guardResult", "action"]) === "pause" &&
        getPath(staleRunResult, ["wouldPauseCount"]) != null,
      evidence: [PATHS.staleGuardProof, PATHS.staleGuardRun, PATHS.supervisor],
    }),
    requirement({
      id: "event-open-suspend-close",
      priority: "P0",
      requirement: "Event lifecycle open, suspended, closed, and settled/resolved behavior is proven or explicitly bounded.",
      achieved:
        pass(entries.lifecycleControls) &&
        pass(entries.lifecycleScheduler) &&
        pass(entries.lifecycleMatrix) &&
        getPath(entries.lifecycleControls, ["checks", "pausedOrderRejected"]) === true &&
        getPath(entries.lifecycleControls, ["checks", "closedOrderRejected"]) === true &&
        getPath(entries.lifecycleMatrix, ["checks", "openStateProven"]) === true &&
        getPath(entries.lifecycleMatrix, ["checks", "pausedStateProven"]) === true &&
        getPath(entries.lifecycleMatrix, ["checks", "closedStateProven"]) === true &&
        getPath(entries.lifecycleMatrix, ["checks", "settlementMechanicsProvenOnDisposableMarket"]) === true &&
        getPath(entries.lifecycleMatrix, ["runtimeTruth", "activeTesterEventSettlementExecuted"]) === false,
      evidence: [PATHS.lifecycleControls, PATHS.lifecycleScheduler, PATHS.lifecycleSchedulerRun, PATHS.lifecycleMatrix],
    }),
    requirement({
      id: "settlement-readiness",
      priority: "P0",
      requirement: "Settlement readiness, trusted result mapping, guarded settlement, and local scheduler run are documented/proven.",
      achieved:
        pass(entries.settlementReadiness) &&
        pass(entries.manualSettlement) &&
        pass(entries.resultIngestion) &&
        pass(entries.resultSettlement) &&
        pass(entries.resultSettlementRun) &&
        pass(entries.settlementPreflight) &&
        pass(entries.settlementAuditEvent) &&
        pass(entries.settlementApprovalAuditEvent) &&
        pass(entries.resultReviewTrail) &&
        getPath(entries.settlementPreflight, ["executionPreflight", "dryRunPreviewPass"]) === true &&
        getPath(entries.settlementPreflight, ["executionPreflight", "executionRequiresMarketStatus"]) === "CLOSED" &&
        getPath(entries.settlementAuditEvent, ["checks", "canonicalEventTypeMatches"]) === true &&
        getPath(entries.settlementAuditEvent, ["checks", "marketNotMutatedByProof"]) === true &&
        getPath(entries.settlementApprovalAuditEvent, ["checks", "canonicalEventWritten"]) === true &&
        getPath(entries.settlementApprovalAuditEvent, ["checks", "payloadDigestMatches"]) === true &&
        getPath(entries.settlementApprovalAuditEvent, ["checks", "activeMarketNotMutated"]) === true &&
        getPath(entries.resultReviewTrail, ["checks", "providerResultAuditEventFound"]) === true &&
        getPath(entries.resultReviewTrail, ["checks", "settlementPreflightAuditEventFound"]) === true &&
        getPath(entries.resultReviewTrail, ["checks", "settlementApprovalAuditEventFound"]) === true &&
        getPath(entries.resultReviewTrail, ["checks", "approvalDigestMatchesPreflight"]) === true &&
        getPath(entries.resultReviewTrail, ["runtimeTruth", "approvalHasCanonicalEventEvidence"]) === true &&
        pass(entries.activeSettlementReadiness) &&
        getPath(entries.activeSettlementReadiness, ["runtimeTruth", "activeEventSettlementExecutionDecisionKnown"]) === true &&
        getPath(entries.activeSettlementReadiness, ["runtimeTruth", "activeEventSettlementExecutionAttempted"]) === false &&
        pass(entries.activeSettlementClosedEligibility) &&
        getPath(entries.activeSettlementClosedEligibility, ["runtimeTruth", "provesActiveEventClosedStateEligibility"]) === true &&
        getPath(entries.activeSettlementClosedEligibility, ["runtimeTruth", "activeEventSettlementExecuted"]) === false &&
        getPath(entries.activeSettlementClosedEligibility, ["runtimeTruth", "activeMarketRestored"]) === true &&
        getPath(entries.activeSettlementClosedEligibility, ["runtimeTruth", "providerQuotaUsed"]) === false &&
        getPath(entries.resultReviewTrail, ["runtimeTruth", "activeTesterSettlementExecution"]) === false,
      evidence: [
        PATHS.settlementReadiness,
        PATHS.manualSettlement,
        PATHS.resultIngestion,
        PATHS.resultIngestionAuditEvent,
        PATHS.resultPoller,
        PATHS.resultPollerProcess,
        PATHS.continuousResultPoller,
        PATHS.resultSettlement,
        PATHS.resultSettlementRun,
        PATHS.settlementPreflight,
        PATHS.settlementAuditEvent,
        PATHS.settlementApprovalAuditEvent,
        PATHS.resultReviewTrail,
        PATHS.activeSettlementReadiness,
        PATHS.activeSettlementClosedEligibility,
        "docs/mobile/EVENT_LIFECYCLE_RUNBOOK.md",
      ],
      notes:
        "Provider-shaped score ingestion can produce trusted result JSON in replay mode, write durable canonical result-ingestion audit evidence, and the local scheduler can dry-run that result. A dedicated local result poller now repeats ingestion plus settlement scheduling and has start/status/stop background process proof. Settlement preflight reports current execution eligibility and blockers. Trusted-result execution is blocked unless the market is CLOSED. Explicit operator/proof runs can write durable canonical settlement preflight and approval audit events, the result review trail report stitches provider result evidence, settlement preflight evidence, and approval evidence into one read-only operator view, the active settlement readiness report states the exact current execution decision without mutating the active event, and closed-state eligibility is proven by temporarily closing/restoring the active selected market without executing settlement. Live score ingestion is explicit and quota-guarded through the command, poller, or supervisor controls; installed unattended official result polling remains P1.",
    }),
    requirement({
      id: "settlement-execution-disposable",
      priority: "P0",
      requirement: "Settlement execution is proven on a disposable local market without mutating the active tester event.",
      achieved:
        pass(entries.settlementExecution) &&
        getPath(entries.settlementExecution, ["checks", "settlementExecuted"]) === true &&
        getPath(entries.settlementExecution, ["checks", "payoutConservationPass"]) === true &&
        getPath(entries.settlementExecution, ["checks", "collateralZeroAfterPass"]) === true &&
        getPath(entries.settlementExecution, ["checks", "positionsFinalizedPass"]) === true &&
        getPath(entries.settlementExecution, ["targetTesterEventMutated"]) === false,
      evidence: [PATHS.settlementExecution],
      notes:
        "Execution proof uses a fresh disposable local market. Active one-event tester settlement still requires trusted operator confirmation.",
    }),
    requirement({
      id: "trusted-result-scheduler-execution-disposable",
      priority: "P0",
      requirement: "Trusted-result settlement scheduler execution is proven on a disposable sportsbook-shaped event without mutating the active tester event.",
      achieved:
        pass(entries.resultSettlementExecution) &&
        getPath(entries.resultSettlementExecution, ["checks", "dryRunSchedulerPassed"]) === true &&
        getPath(entries.resultSettlementExecution, ["checks", "confirmationPhraseProduced"]) === true &&
        getPath(entries.resultSettlementExecution, ["checks", "liveMarketExecutionBlocked"]) === true &&
        getPath(entries.resultSettlementExecution, ["checks", "liveMarketNotResolvedByBlockedAttempt"]) === true &&
        getPath(entries.resultSettlementExecution, ["checks", "executeSchedulerPassed"]) === true &&
        getPath(entries.resultSettlementExecution, ["checks", "executeSettlementPassed"]) === true &&
        getPath(entries.resultSettlementExecution, ["checks", "disposableMarketResolved"]) === true &&
        getPath(entries.resultSettlementExecution, ["checks", "targetTesterEventNotMutated"]) === true,
      evidence: [PATHS.resultSettlementExecution, PATHS.resultSettlementLiveBlocked],
      notes:
        "This proves the scheduler execute path with reviewed trusted result JSON, an exact confirmation phrase, and a CLOSED-market execution guard. It still does not install unattended official-result polling.",
    }),
    requirement({
      id: "approved-auto-settlement-disposable",
      priority: "P0",
      requirement:
        "Operator-approved trusted-result auto-execution is proven on a disposable sportsbook-shaped event with closed-market guard.",
      achieved:
        pass(entries.approvedAutoSettlement) &&
        getPath(entries.approvedAutoSettlement, ["checks", "liveAutoWaitPassed"]) === true &&
        getPath(entries.approvedAutoSettlement, ["checks", "liveMarketNotResolvedByWait"]) === true &&
        getPath(entries.approvedAutoSettlement, ["checks", "executeSchedulerPassed"]) === true &&
        getPath(entries.approvedAutoSettlement, ["checks", "disposableMarketResolved"]) === true &&
        getPath(entries.approvedAutoSettlement, ["checks", "executedAuditEventWritten"]) === true,
      evidence: [PATHS.approvedAutoSettlement],
      notes:
        "This proves an approval-file driven scheduler path: exact result digest/confirmation must match, live markets wait, and execution occurs only after close. It still does not install unattended official-result polling.",
    }),
    requirement({
      id: "active-event-settlement-clone",
      priority: "P1",
      requirement:
        "Approved trusted-result settlement is proven against a disposable clone of the active tester event's selected market semantics.",
      achieved:
        pass(entries.activeSettlementClone) &&
        getPath(entries.activeSettlementClone, ["checks", "cloneUsesActiveMarketSemantics"]) === true &&
        getPath(entries.activeSettlementClone, ["checks", "executeSchedulerPassed"]) === true &&
        getPath(entries.activeSettlementClone, ["checks", "executeSettlementPassed"]) === true &&
        getPath(entries.activeSettlementClone, ["checks", "cloneResolved"]) === true &&
        getPath(entries.activeSettlementClone, ["checks", "activeTesterEventNotMutated"]) === true &&
        getPath(entries.activeSettlementClone, ["checks", "providerQuotaNotUsed"]) === true,
      evidence: [PATHS.activeSettlementClone],
      notes:
        "This closes the semantics gap between generic disposable settlement and the active tester event's current market shape while intentionally preserving the active event for internal trading.",
    }),
    requirement({
      id: "active-event-closed-settlement-eligibility",
      priority: "P1",
      requirement:
        "The active tester event's selected market is proven eligible for exact-confirmation execution after close without leaving the active market closed or resolved.",
      achieved:
        pass(entries.activeSettlementClosedEligibility) &&
        getPath(entries.activeSettlementClosedEligibility, ["runtimeTruth", "provesActiveEventClosedStateEligibility"]) === true &&
        getPath(entries.activeSettlementClosedEligibility, ["runtimeTruth", "activeEventSettlementExecuted"]) === false &&
        getPath(entries.activeSettlementClosedEligibility, ["runtimeTruth", "activeMarketRestored"]) === true &&
        getPath(entries.activeSettlementClosedEligibility, ["runtimeTruth", "providerQuotaUsed"]) === false &&
        getPath(entries.activeSettlementClosedEligibility, ["closedStateDecision", "operatorDecisionWhenClosed"]) ===
          "eligible_for_exact_confirmation_execution_after_market_close",
      evidence: [PATHS.activeSettlementClosedEligibility],
      notes:
        "This narrows the last active-event execution gap: once the selected active market is CLOSED and exact approval evidence matches, dry-run eligibility passes. The proof restores the market to its prior LIVE/unresolved state and does not execute settlement.",
    }),
    requirement({
      id: "supervisor-approved-settlement-wait",
      priority: "P0",
      requirement:
        "Local supervisor approved settlement mode is wired and waits safely while the active market remains live.",
      achieved:
        pass(entries.supervisorApprovedSettlement) &&
        getPath(entries.supervisorApprovedSettlement, ["runtimeTruth", "approvalFileMatched"]) === true &&
        getPath(entries.supervisorApprovedSettlement, ["runtimeTruth", "supervisorApprovalModeWired"]) === true &&
        getPath(entries.supervisorApprovedSettlement, ["runtimeTruth", "activeMarketStillLiveSoNoExecution"]) === true &&
        getPath(entries.supervisorApprovedSettlement, ["runtimeTruth", "activeTesterSettlementExecution"]) === false,
      evidence: [PATHS.supervisorApprovedSettlement, PATHS.supervisor, PATHS.resultSettlementRun],
      notes:
        "This proves the local supervisor can carry an exact approval file into trusted-result settlement scheduling and still wait instead of executing while the target market is LIVE.",
    }),
    requirement({
      id: "backend-runtime-health",
      priority: "P0",
      requirement: "Backend health and selected quote route are reachable locally.",
      achieved: health.ok && (health.body as JsonObject)?.status === "ok" && quote?.ok === true,
      evidence: [`${baseUrl}/api/health`, quote ? `${baseUrl}/api/markets/${selectedMarketId}/quote` : "missing quote route"],
    }),
    requirement({
      id: "internal-tester-runtime-manager",
      priority: "P0",
      requirement: "Local internal tester runtime manager can report backend, Expo, Postgres, S23 reachability snapshot, and supervisor status without spending provider quota.",
      achieved:
        pass(entries.internalTesterRuntime) &&
        getPath(entries.internalTesterRuntime, ["readiness", "backendReady"]) === true &&
        getPath(entries.internalTesterRuntime, ["readiness", "expoReady"]) === true &&
        getPath(entries.internalTesterRuntime, ["readiness", "postgresReady"]) === true &&
        getPath(entries.internalTesterRuntime, ["s23"]) !== undefined &&
        getPath(internalTesterTruth, ["localControlPlaneAvailable"]) === true &&
        getPath(internalTesterTruth, ["stopsOnlyOwnedBackendExpoProcesses"]) === true &&
        getPath(internalTesterTruth, ["installedOsService"]) === false,
      evidence: [PATHS.internalTesterRuntime],
      notes:
        "This proves local operator visibility/control for internal testing. It reuses external backend/Expo listeners when present and only stops manager-owned backend/Expo processes.",
    }),
    requirement({
      id: "managed-s23-server-mode-startup",
      priority: "P0",
      requirement:
        "Manager-owned Expo startup must use server-backed mobile settings and configure S23 ADB reverse so internal tester phones can reach backend events.",
      achieved: managedS23ServerModeStartupKnown,
      evidence: ["scripts/manage_holiwyn_internal_tester_runtime.ps1"],
      notes:
        "This gates the source contract without restarting the active S23 proof session: manager-owned Expo sets API/auth base URLs to the backend, enables server order/market data mode, hides order book, and fails readiness if S23 port forwarding fails.",
    }),
    requirement({
      id: "internal-tester-result-poller-control",
      priority: "P0",
      requirement:
        "Local internal tester runtime manager can start, report, and stop the dedicated result poller without provider quota.",
      achieved:
        pass(entries.internalTesterResultPoller) &&
        getPath(internalTesterResultPollerTruth, ["internalTesterRuntimeCanStartResultPoller"]) === true &&
        getPath(internalTesterResultPollerTruth, ["internalTesterRuntimeCanReportResultPoller"]) === true &&
        getPath(internalTesterResultPollerTruth, ["internalTesterRuntimeCanStopResultPoller"]) === true &&
        getPath(internalTesterResultPollerTruth, ["heartbeatAdvanced"]) === true &&
        getPath(internalTesterResultPollerTruth, ["providerQuotaUsed"]) === false &&
        getPath(internalTesterResultPollerTruth, ["activeTesterSettlementExecution"]) === false,
      evidence: [PATHS.internalTesterResultPoller, PATHS.internalTesterRuntime, PATHS.resultPollerProcess],
      notes:
        "This folds the dedicated result poller into the local tester control plane. It remains a local process manager, not an installed OS service.",
    }),
    requirement({
      id: "internal-tester-watchdog",
      priority: "P0",
      requirement:
        "Local internal tester watchdog verifies base runtime, supervisor proof, result-poller proof, no-quota mode, and loop cleanup.",
      achieved:
        pass(entries.internalTesterWatchdog) &&
        getPath(entries.internalTesterWatchdog, ["requireSupervisor"]) === true &&
        getPath(entries.internalTesterWatchdog, ["requireResultPoller"]) === true &&
        getPath(entries.internalTesterWatchdog, ["stopLoopProcessesAfterRun"]) === true &&
        getPath(internalTesterWatchdogFirstIteration, ["readyBeforeStart", "backend"]) === true &&
        getPath(internalTesterWatchdogFirstIteration, ["readyBeforeStart", "expo"]) === true &&
        getPath(internalTesterWatchdogFirstIteration, ["readyBeforeStart", "postgres"]) === true &&
        getPath(internalTesterWatchdogFirstIteration, ["supervisorProofExitCode"]) === 0 &&
        getPath(internalTesterWatchdogFirstIteration, ["resultPollerProofExitCode"]) === 0 &&
        getPath(internalTesterWatchdogFirstIteration, ["runtimePassAfterIteration"]) === true &&
        getPath(entries.internalTesterWatchdog, ["cleanup", "supervisor", "pass"]) === true &&
        getPath(entries.internalTesterWatchdog, ["cleanup", "resultPoller", "pass"]) === true &&
        getPath(internalTesterWatchdogTruth, ["watchdogCanVerifyBaseRuntime"]) === true &&
        getPath(internalTesterWatchdogTruth, ["noProviderQuotaByDefault"]) === true &&
        getPath(internalTesterWatchdogTruth, ["stopsLoopProcessesOnly"]) === true &&
        getPath(internalTesterWatchdogTruth, ["installedOsService"]) === false,
      evidence: [
        PATHS.internalTesterWatchdog,
        PATHS.internalTesterRuntime,
        PATHS.continuousSupervisor,
        PATHS.continuousResultPoller,
      ],
      notes:
        "This adds the local watchdog proof to the authoritative phase gate. S23 reachability is still verified by mobile proof artifacts; the watchdog itself gates backend/Expo/Postgres and runtime loop health.",
    }),
    requirement({
      id: "current-runtime-warm-state",
      priority: "P0",
      requirement:
        "Local runtime status is proven while supervisor and result-poller loops are actually running in no-quota warm mode, then cleaned up.",
      achieved:
        pass(entries.currentRuntimeStateProof) &&
        getPath(entries.currentRuntimeStateProof, ["runtimeTruth", "warmNoQuotaRuntimeObserved"]) === true &&
        getPath(entries.currentRuntimeStateProof, ["runtimeTruth", "allLoopsRunningObserved"]) === true &&
        getPath(entries.currentRuntimeStateProof, ["runtimeTruth", "localCapabilityReadyWhileRunning"]) === true &&
        getPath(entries.currentRuntimeStateProof, ["runtimeTruth", "quotaSpendingLoopRunning"]) === false &&
        getPath(entries.currentRuntimeStateProof, ["runtimeTruth", "providerQuotaUsed"]) === false &&
        getPath(entries.currentRuntimeStateProof, ["runtimeTruth", "activeTesterSettlementExecution"]) === false &&
        getPath(entries.currentRuntimeStateProof, ["runtimeTruth", "stopsLoopsAfterProof"]) === true &&
        getPath(entries.currentRuntimeStateProof, ["currentRuntimeState", "mode"]) === "warm_no_quota_runtime" &&
        getPath(entries.currentRuntimeStateProof, ["currentRuntimeState", "allLoopsRunning"]) === true &&
        Array.isArray(getPath(entries.currentRuntimeStateProof, ["gaps", "p0"])) &&
        (getPath(entries.currentRuntimeStateProof, ["gaps", "p0"]) as unknown[]).length === 0,
      evidence: [PATHS.currentRuntimeStateProof, `${baseUrl}/api/internal/live-runtime/status`],
      notes:
        "This proves the new currentRuntimeState field against a real warm local runtime, not only a stopped-loop status snapshot. Mobile-visible odds may still require explicit live provider refresh when snapshots are stale.",
    }),
    requirement({
      id: "scheduled-task-approved-settlement-profile",
      priority: "P0",
      requirement:
        "Scheduled-task plan/proof includes the dedicated result poller and approved-settlement wait profile without spending provider quota or leaving a task installed.",
      achieved:
        pass(entries.localRuntimeTaskInstall) &&
        getPath(entries.localRuntimeTaskInstall, ["runtimeTruth", "scheduledTaskIncludesResultPoller"]) === true &&
        getPath(entries.localRuntimeTaskInstall, ["runtimeTruth", "approvedSettlementModeInstallProof"]) === true &&
        getPath(entries.localRuntimeTaskInstall, ["runtimeTruth", "scheduledTaskUsesActiveApprovalPath"]) === true &&
        getPath(entries.localRuntimeTaskInstall, ["runtimeTruth", "providerQuotaUsed"]) === false &&
        getPath(entries.localRuntimeTaskInstall, ["runtimeTruth", "noPersistentTaskLeftInstalled"]) === true,
      evidence: [PATHS.localRuntimeTaskInstall, PATHS.localRuntimeTask],
      notes:
        "This narrows the unattended-runtime gap by proving the scheduled-task profile carries the same result-poller and approved-settlement wait controls as the Startup fallback. Current Windows permissions may still block actual task registration.",
    }),
    requirement({
      id: "startup-approved-settlement-profile",
      priority: "P0",
      requirement:
        "User Startup launcher proof includes the approved-settlement supervisor profile and dedicated result poller without spending provider quota or leaving a launcher installed.",
      achieved:
        pass(entries.localRuntimeStartupInstall) &&
        getPath(entries.localRuntimeStartupInstall, ["runtimeTruth", "startupLauncherInstallWorks"]) === true &&
        getPath(entries.localRuntimeStartupInstall, ["runtimeTruth", "startupLauncherUninstallWorks"]) === true &&
        getPath(entries.localRuntimeStartupInstall, ["runtimeTruth", "noPersistentLauncherLeftInstalled"]) === true &&
        getPath(entries.localRuntimeStartupInstall, ["runtimeTruth", "startupLauncherIncludesResultPoller"]) === true &&
        getPath(entries.localRuntimeStartupInstall, ["runtimeTruth", "providerQuotaUsed"]) === false &&
        getPath(entries.localRuntimeStartupInstall, ["runtimeTruth", "approvedSettlementModeInstallProof"]) === true,
      evidence: [PATHS.localRuntimeStartupInstall, PATHS.localRuntimeStartup],
      notes:
        "This narrows the unattended-runtime gap by proving the user-logon fallback can launch backend/Expo/supervisor plus the dedicated result poller with result ingestion, settlement scheduling, and approved-settlement wait mode. It is still a local user Startup launcher, not a production service.",
    }),
    requirement({
      id: "local-runtime-launch-profile",
      priority: "P0",
      requirement:
        "A read-only launch profile tells operators which local runtime mode to use and what is not installed.",
      achieved:
        pass(entries.localRuntimeLaunchProfile) &&
        getPath(entries.localRuntimeLaunchProfile, ["runtimeTruth", "localOperatorLaunchProfileDocumented"]) === true &&
        getPath(entries.localRuntimeLaunchProfile, [
          "runtimeTruth",
          "startupFallbackRecommendedForCurrentWindowsContext",
        ]) === true &&
        getPath(entries.localRuntimeLaunchProfile, ["runtimeTruth", "proofLeavesNoPersistentStartupLauncher"]) ===
          true &&
        getPath(entries.localRuntimeLaunchProfile, ["runtimeTruth", "proofLeavesNoPersistentScheduledTask"]) === true &&
        getPath(entries.localRuntimeLaunchProfile, ["runtimeTruth", "noProviderQuotaSpentByDefaultProfile"]) === true &&
        getPath(entries.localRuntimeLaunchProfile, ["runtimeTruth", "activeTesterSettlementExecution"]) === false &&
        getPath(entries.localRuntimeLaunchProfile, ["runtimeTruth", "installedProductionService"]) === false,
      evidence: [
        PATHS.localRuntimeLaunchProfile,
        PATHS.localRuntimeStartupInstall,
        PATHS.localRuntimeTaskInstall,
        PATHS.continuousSupervisor,
        PATHS.continuousResultPoller,
      ],
      notes:
        "This consolidates manual foreground, user Startup fallback, scheduled-task blocker, and live-provider opt-in commands into one no-quota operator profile.",
    }),
    requirement({
      id: "live-runtime-completion-truth",
      priority: "P1",
      requirement:
        "One read-only audit directly answers live-runtime completion questions: maker continuity, live/replay odds mode, refresh cadence, quota, stale handling, lifecycle, and S23 trade proof.",
      achieved:
        pass(entries.liveRuntimeCompletionAudit) &&
        getPath(entries.liveRuntimeCompletionAudit, ["runtimeTruth", "phaseCompleteForLocalInternalRuntime"]) === true &&
        getPath(entries.liveRuntimeCompletionAudit, ["runtimeTruth", "fullProductionRuntimeComplete"]) === false &&
        getPath(entries.liveRuntimeCompletionAudit, ["checks", "marketMakerContinuityKnown"]) === true &&
        getPath(entries.liveRuntimeCompletionAudit, ["checks", "oddsRefreshModeKnown"]) === true &&
        getPath(entries.liveRuntimeCompletionAudit, ["checks", "providerQuotaKnownAndProtected"]) === true &&
        getPath(entries.liveRuntimeCompletionAudit, ["checks", "staleHandlingKnown"]) === true &&
        getPath(entries.liveRuntimeCompletionAudit, ["checks", "mobileS23EndToEndTradeProofPass"]) === true,
      evidence: [PATHS.liveRuntimeCompletionAudit],
      notes:
        "This keeps the phase-completion answers in one artifact while preserving P1 truth: no installed production service and no unguarded official-result auto-settlement.",
    }),
    requirement({
      id: "unattended-service",
      priority: "P1",
      requirement: "Install unattended provider/maker/lifecycle services.",
      achieved: false,
      evidence: [
        PATHS.supervisor,
        PATHS.supervisorProcess,
        PATHS.internalTesterRuntime,
        PATHS.internalTesterResultPoller,
        PATHS.localRuntimeTask,
        PATHS.localRuntimeTaskInstall,
        PATHS.localRuntimeStartup,
        PATHS.localRuntimeStartupInstall,
        PATHS.localRuntimeLaunchProfile,
        PATHS.continuousSupervisor,
      ],
      notes:
        "Repeated local supervisor cycles, process-tree stop support, an internal tester runtime manager, internal-tester control of the dedicated result poller, a dry-run Windows scheduled-task install plan, a safe scheduled-task permission audit, and a user-level Startup launcher install/uninstall proof are proven. Windows denied scheduled-task registration in the current process context, so no scheduled task remains installed. The Startup launcher can carry the approved-settlement supervisor profile and dedicated result poller at user logon, but it is not a production service.",
    }),
    requirement({
      id: "official-result-auto-settlement",
      priority: "P1",
      requirement: "Automatically ingest official soccer results and settle markets.",
      achieved: false,
      evidence: [
        PATHS.settlementReadiness,
        PATHS.settlementExecution,
        PATHS.resultSettlementExecution,
        PATHS.resultSettlementLiveBlocked,
        PATHS.manualSettlement,
        PATHS.resultIngestion,
        PATHS.resultIngestionAuditEvent,
        PATHS.resultPoller,
        PATHS.resultPollerProcess,
        PATHS.continuousResultPoller,
        PATHS.resultSettlement,
        PATHS.resultSettlementRun,
        PATHS.settlementPreflight,
        PATHS.settlementAuditEvent,
        PATHS.settlementApprovalAuditEvent,
        PATHS.resultReviewTrail,
        PATHS.approvedAutoSettlement,
        PATHS.activeSettlementClone,
        PATHS.activeSettlementClosedEligibility,
        PATHS.supervisorApprovedSettlement,
      ],
      notes:
        "Provider-shaped result ingestion replay, durable canonical result-ingestion audit evidence, a dedicated local result polling runner with background process management, durable canonical settlement preflight/approval audit events, approval-file auto-execution, active-event market clone settlement, active-event closed-state eligibility, supervisor-approved wait mode, and trusted-result scheduler execution are proven on local evidence. Execution is blocked while the target market remains LIVE unless it later closes and exactly matches approval evidence. Live score ingestion is available only behind explicit live flags plus THE_ODDS_API_KEY, including the quota-capped poller and supervisor paths. Installed unattended provider result polling and unconfirmed active-event execution remain future work.",
    }),
  ];
  const openP0 = requirements.filter((item) => item.priority === "P0" && item.status !== "complete");
  const openP1 = requirements.filter((item) => item.priority === "P1" && item.status !== "complete");
  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-live-runtime-phase-audit",
    pass: openP0.length === 0,
    baseUrl,
    event: entries.liveProof?.event ?? null,
    selectedMarket: entries.liveProof?.selectedMarket ?? null,
    health,
    quote,
    localRuntimeStatus,
    localResultReview,
    localSettlementQueue,
    localLifecycle,
    artifactAgesHours: Object.fromEntries(
      Object.entries(entries).map(([key, value]) => [key, ageHours(value?.generatedAt)]),
    ),
    requirements,
    conclusion: {
      p0Complete: openP0.length === 0,
      openP0: openP0.map((item) => item.id),
      openP1: openP1.map((item) => item.id),
      phaseCompleteForLocalInternalRuntime: openP0.length === 0,
      fullProductionRuntimeComplete: false,
      runtimeTruth:
        "Local one-event runtime is internally usable with cached/live-proofed provider data, fake-token trading, local internal tester runtime status/control, supervisor monitoring, internal-tester managed result polling, provider-shaped replay result ingestion, opt-in quota-capped live result ingestion controls, and trusted-result settlement dry-run scheduling. It is not a production unattended daemon and does not install unattended official result polling.",
    },
  };
  await writeJson(outputPath, summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.pass) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
