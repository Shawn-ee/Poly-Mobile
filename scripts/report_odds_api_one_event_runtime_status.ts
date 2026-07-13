import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const DEFAULT_BASE_URL = "http://127.0.0.1:3002";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json";
const LIVE_PROOF_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json";
const RUNTIME_LAUNCH_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-runtime-launch-summary.redacted.json";
const MAKER_SEED_PATH =
  "docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json";
const SUPERVISOR_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-summary.redacted.json";
const CONTINUOUS_SUPERVISOR_PROOF_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-continuous-supervisor-proof-summary.redacted.json";
const CONTINUOUS_RESULT_POLLER_PROOF_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-continuous-result-poller-proof-summary.redacted.json";
const SCHEDULER_RUN_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-scheduler-run-summary.redacted.json";
const RESULT_SETTLEMENT_EXECUTION_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-scheduler-execution-summary.redacted.json";
const RESULT_SETTLEMENT_LIVE_BLOCKED_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-scheduler-execution-live-blocked.redacted.json";
const SUPERVISOR_STATE_PATH = ".runtime/one-event-live-supervisor/supervisor-process-state.json";
const RESULT_POLLER_STATE_PATH = ".runtime/one-event-result-poller/result-poller-process-state.json";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const numberArg = (name: string, fallback: number) => {
  const value = Number(argValue(name));
  return Number.isFinite(value) ? value : fallback;
};

type JsonObject = Record<string, unknown>;

async function readJson<T = JsonObject>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function writeJson(outputPath: string, value: unknown) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function fetchRaw(url: string) {
  try {
    const response = await fetch(url);
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

function bool(value: unknown) {
  return value === true;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : null;
}

function getPath(source: unknown, keys: string[]) {
  let cursor = source;
  for (const key of keys) {
    if (!cursor || typeof cursor !== "object" || !(key in cursor)) return null;
    cursor = (cursor as JsonObject)[key];
  }
  return cursor;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function windowsProcessCommandLine(pid: number | null) {
  if (!pid || process.platform !== "win32") return null;
  try {
    const command = [
      "$process = Get-CimInstance Win32_Process -Filter 'ProcessId = " + pid + "' -ErrorAction SilentlyContinue;",
      "if ($process) { $process.CommandLine }",
    ].join(" ");
    const output = execFileSync("powershell", ["-NoProfile", "-Command", command], {
      encoding: "utf8",
      timeout: 5000,
      windowsHide: true,
    }).trim();
    return output.length > 0 ? output : null;
  } catch (error) {
    return null;
  }
}

function expectedRuntimeCommand(kind: "supervisor" | "result-poller") {
  return kind === "supervisor" ? "run_holiwyn_one_event_live_supervisor.ps1" : "run_holiwyn_one_event_result_poller.ps1";
}

function pidRunning(pid: number | null, kind: "supervisor" | "result-poller") {
  if (!pid) return false;
  const commandLine = windowsProcessCommandLine(pid);
  if (process.platform === "win32") {
    return commandLine?.includes(expectedRuntimeCommand(kind)) === true;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

async function managedProcessState(params: { statePath: string; kind: "supervisor" | "result-poller" }) {
  const state = await readJson(params.statePath);
  const pid = numberValue(state?.pid);
  const running = pidRunning(pid, params.kind);
  const runProviderProof = bool(getPath(state, ["runProviderProof"]));
  const runLiveResultIngestion = bool(getPath(state, ["runLiveResultIngestion"]));
  return {
    kind: params.kind,
    checked: true,
    statePath: params.statePath,
    known: state != null,
    pid,
    running,
    startedAt: stringValue(state?.startedAt),
    continuous: bool(state?.continuous),
    maxIterations: numberValue(state?.maxIterations),
    intervalSeconds: numberValue(state?.intervalSeconds),
    usesProviderQuota: params.kind === "supervisor" ? runProviderProof || runLiveResultIngestion : runLiveResultIngestion,
    modes:
      params.kind === "supervisor"
        ? {
            providerProof: runProviderProof,
            staleGuard: bool(getPath(state, ["runStaleGuard"])),
            staleGuardEnforced: bool(getPath(state, ["enforceStaleGuard"])),
            liveResultIngestion: runLiveResultIngestion,
            approvedResultSettlement: bool(getPath(state, ["runApprovedResultSettlement"])),
          }
        : {
            liveResultIngestion: runLiveResultIngestion,
            approvedResultSettlement: bool(getPath(state, ["runApprovedResultSettlement"])),
          },
  };
}

function ageHours(generatedAt: unknown) {
  const text = stringValue(generatedAt);
  if (!text) return null;
  const parsed = Date.parse(text);
  if (!Number.isFinite(parsed)) return null;
  return Number(((Date.now() - parsed) / 3_600_000).toFixed(2));
}

function latestQuota(liveProof: JsonObject | null) {
  const latest = getPath(liveProof, ["provider", "quota", "latest"]);
  const totalLastCost = getPath(liveProof, ["provider", "quota", "totalLastCost"]);
  return {
    totalLastCost: typeof totalLastCost === "number" ? totalLastCost : null,
    requestsUsed: stringValue(getPath(latest, ["requestsUsed"])),
    requestsRemaining: stringValue(getPath(latest, ["requestsRemaining"])),
    requestsLast: stringValue(getPath(latest, ["requestsLast"])),
  };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run local runtime status report in production.");
  }

  const baseUrl = argValue("baseUrl") ?? DEFAULT_BASE_URL;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const maxLiveProofAgeHours = numberArg("maxLiveProofAgeHours", 24);
  const maxSettlementProofAgeHours = numberArg("maxSettlementProofAgeHours", 24);
  const liveProof = await readJson(LIVE_PROOF_PATH);
  const runtimeLaunch = await readJson(RUNTIME_LAUNCH_PATH);
  const makerSeed = await readJson(MAKER_SEED_PATH);
  const supervisor = await readJson(SUPERVISOR_PATH);
  const continuousSupervisorProof = await readJson(CONTINUOUS_SUPERVISOR_PROOF_PATH);
  const continuousResultPollerProof = await readJson(CONTINUOUS_RESULT_POLLER_PROOF_PATH);
  const schedulerRun = await readJson(SCHEDULER_RUN_PATH);
  const resultSettlementExecution = await readJson(RESULT_SETTLEMENT_EXECUTION_PATH);
  const resultSettlementLiveBlocked = await readJson(RESULT_SETTLEMENT_LIVE_BLOCKED_PATH);
  const supervisorProcess = await managedProcessState({
    statePath: SUPERVISOR_STATE_PATH,
    kind: "supervisor",
  });
  const resultPollerProcess = await managedProcessState({
    statePath: RESULT_POLLER_STATE_PATH,
    kind: "result-poller",
  });

  const selectedMarketId =
    stringValue(getPath(makerSeed, ["selectedMarket", "id"])) ??
    stringValue(getPath(liveProof, ["selectedMarket", "id"]));
  const quoteRoute = selectedMarketId
    ? await fetchRaw(`${baseUrl}/api/markets/${encodeURIComponent(selectedMarketId)}/quote`)
    : null;
  const health = await fetchRaw(`${baseUrl}/api/health`);
  const liveProofAgeHours = ageHours(liveProof?.generatedAt);
  const makerSeedAgeHours = ageHours(makerSeed?.generatedAt);
  const schedulerAgeHours = ageHours(schedulerRun?.generatedAt);
  const resultSettlementExecutionAgeHours = ageHours(resultSettlementExecution?.generatedAt);
  const resultSettlementLiveBlockedAgeHours = ageHours(resultSettlementLiveBlocked?.generatedAt);
  const liveProofFresh =
    liveProofAgeHours != null && liveProofAgeHours >= 0 && liveProofAgeHours <= maxLiveProofAgeHours;
  const resultSettlementExecutionFresh =
    resultSettlementExecutionAgeHours != null &&
    resultSettlementExecutionAgeHours >= 0 &&
    resultSettlementExecutionAgeHours <= maxSettlementProofAgeHours;
  const resultSettlementLiveBlockedFresh =
    resultSettlementLiveBlockedAgeHours != null &&
    resultSettlementLiveBlockedAgeHours >= 0 &&
    resultSettlementLiveBlockedAgeHours <= maxSettlementProofAgeHours;
  const supervisorRuntimeTruth = getPath(supervisor, ["runtimeTruth"]);
  const continuousSupervisorTruth = getPath(continuousSupervisorProof, ["runtimeTruth"]);
  const continuousResultPollerTruth =
    getPath(continuousResultPollerProof, ["runtimeTruth"]) ??
    getPath(continuousResultPollerProof, ["processSummary", "poller", "digest", "runtimeTruth"]);
  const continuousResultPollerDigestTruth = getPath(continuousResultPollerProof, [
    "processSummary",
    "poller",
    "digest",
    "runtimeTruth",
  ]);
  const provenCapabilities = {
    repeatedSupervisorCycles: bool(getPath(continuousSupervisorTruth, ["repeatedLocalSupervisorCyclesProven"])),
    makerReseedWhileSupervisorRuns: bool(getPath(continuousSupervisorTruth, ["marketMakerReseedWhileRunning"])),
    lifecycleSchedulerWhileSupervisorRuns: bool(getPath(continuousSupervisorTruth, ["lifecycleSchedulerWhileRunning"])),
    resultIngestionWhileSupervisorRuns: bool(getPath(continuousSupervisorTruth, ["resultIngestionWhileRunning"])),
    resultSettlementSchedulerWhileSupervisorRuns: bool(
      getPath(continuousSupervisorTruth, ["resultSettlementSchedulerWhileRunning"]),
    ),
    supervisorProviderRefreshQuotaProtected: bool(getPath(continuousSupervisorTruth, ["quotaProtected"])),
    resultPollingBackgroundProof: bool(continuousResultPollerProof?.pass),
    resultPollingContinuousWhileRunnerRuns:
      bool(getPath(continuousResultPollerTruth, ["resultPollingContinuousWhileRunnerRuns"])) ||
      bool(getPath(continuousResultPollerTruth, ["resultPollingWhileProcessRuns"])) ||
      bool(getPath(continuousResultPollerDigestTruth, ["resultPollingContinuousWhileRunnerRuns"])),
    resultSettlementSchedulerWhilePollerRuns: bool(
      getPath(continuousResultPollerTruth, ["settlementSchedulerContinuousWhileRunnerRuns"]),
    ) || bool(getPath(continuousResultPollerTruth, ["settlementSchedulerWhileProcessRuns"])) ||
      bool(getPath(continuousResultPollerDigestTruth, ["settlementSchedulerContinuousWhileRunnerRuns"])),
    installedOsService: false,
  };
  const settlementChecks = {
    proofPresent: resultSettlementExecution != null,
    proofPassed: bool(resultSettlementExecution?.pass),
    dryRunSchedulerPassed: getPath(resultSettlementExecution, ["checks", "dryRunSchedulerPassed"]) === true,
    confirmationPhraseProduced: getPath(resultSettlementExecution, ["checks", "confirmationPhraseProduced"]) === true,
    liveMarketExecutionBlocked: getPath(resultSettlementExecution, ["checks", "liveMarketExecutionBlocked"]) === true,
    liveMarketNotResolvedByBlockedAttempt:
      getPath(resultSettlementExecution, ["checks", "liveMarketNotResolvedByBlockedAttempt"]) === true,
    closedMarketExecutionPassed: getPath(resultSettlementExecution, ["checks", "executeSettlementPassed"]) === true,
    targetTesterEventNotMutated: getPath(resultSettlementExecution, ["checks", "targetTesterEventNotMutated"]) === true,
    liveBlockedArtifactPresent: resultSettlementLiveBlocked != null,
    liveBlockedArtifactShowsBlocked:
      resultSettlementLiveBlocked?.pass === false &&
      getPath(resultSettlementLiveBlocked, ["execution", "attempted"]) === false &&
      String(getPath(resultSettlementLiveBlocked, ["execution", "reason"]) ?? "").startsWith(
        "market_must_be_closed_before_result_settlement:",
      ),
  };

  const checks = {
    backendHealthy: health.ok && (health.body as JsonObject | null)?.status === "ok",
    liveProofPresent: liveProof != null,
    liveProofPassed: bool(liveProof?.pass),
    liveProofFresh,
    quotaKnown: latestQuota(liveProof).requestsRemaining != null,
    makerSeedPresent: makerSeed != null,
    makerSeedPassed: bool(makerSeed?.pass),
    quoteRouteHealthy: quoteRoute?.ok === true,
    schedulerRunPresent: schedulerRun != null,
    schedulerRunPassed: bool(schedulerRun?.pass),
    supervisorPresent: supervisor != null,
    supervisorPassed: bool(supervisor?.pass),
    continuousSupervisorProofPresent: continuousSupervisorProof != null,
    continuousSupervisorProofPassed: bool(continuousSupervisorProof?.pass),
    repeatedSupervisorCapabilitiesKnown:
      provenCapabilities.repeatedSupervisorCycles &&
      provenCapabilities.makerReseedWhileSupervisorRuns &&
      provenCapabilities.lifecycleSchedulerWhileSupervisorRuns,
    continuousResultPollerProofPresent: continuousResultPollerProof != null,
    continuousResultPollerProofPassed: bool(continuousResultPollerProof?.pass),
    resultSettlementGuardPresent: settlementChecks.proofPresent,
    resultSettlementGuardPassed: settlementChecks.proofPassed,
    resultSettlementGuardFresh: resultSettlementExecutionFresh && resultSettlementLiveBlockedFresh,
    liveResultSettlementBlockedWhileLive:
      settlementChecks.liveMarketExecutionBlocked &&
      settlementChecks.liveMarketNotResolvedByBlockedAttempt &&
      settlementChecks.liveBlockedArtifactShowsBlocked,
  };
  const p0Gaps = Object.entries(checks)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  const currentManagedProcesses = {
    checked: true,
    supervisor: supervisorProcess,
    resultPoller: resultPollerProcess,
    allLoopsRunning: supervisorProcess.running && resultPollerProcess.running,
    quotaSpendingLoopRunning: supervisorProcess.usesProviderQuota || resultPollerProcess.usesProviderQuota,
    localTesterReadyRightNow:
      checks.backendHealthy &&
      checks.liveProofFresh &&
      checks.repeatedSupervisorCapabilitiesKnown &&
      supervisorProcess.running &&
      resultPollerProcess.running &&
      !supervisorProcess.usesProviderQuota &&
      !resultPollerProcess.usesProviderQuota,
    source: "local .runtime process state plus OS pid check",
  };
  const continuityAnswer = {
    latestSupervisorRunProfileOnly: true,
    currentLoopsRunningNow: currentManagedProcesses.allLoopsRunning,
    currentLoopsQuotaSpending: currentManagedProcesses.quotaSpendingLoopRunning,
    marketMakerContinuousWhileSupervisorRuns: provenCapabilities.makerReseedWhileSupervisorRuns,
    lifecycleSchedulerContinuousWhileSupervisorRuns: provenCapabilities.lifecycleSchedulerWhileSupervisorRuns,
    resultPollerContinuousWhileRunnerRuns: provenCapabilities.resultPollingContinuousWhileRunnerRuns,
    installedUnattendedService: false,
    operatorMeaning:
      "Holiwyn has proven continuous local foreground/background loops while the supervisor/result-poller are running; it does not have an installed unattended production daemon.",
  };

  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-one-event-runtime-status",
    pass: p0Gaps.length === 0,
    baseUrl,
    modeTruth: {
      cachedRuntimeUsesQuota: false,
      liveProviderRefreshRequiresExplicitFlag: true,
      latestSupervisorRunProfileOnly: true,
      liveProviderRefreshContinuousWhileSupervisorRuns: bool(
        getPath(supervisorRuntimeTruth, ["providerRefreshContinuousWhileSupervisorRuns"]),
      ),
      liveProviderRefreshQuotaCappedWhileSupervisorRuns: bool(
        getPath(supervisorRuntimeTruth, ["providerRefreshQuotaCappedWhileSupervisorRuns"]),
      ),
      makerRefreshContinuousWhileSupervisorRuns: bool(
        getPath(supervisorRuntimeTruth, ["marketMakerRefreshContinuousWhileSupervisorRuns"]),
      ),
      lifecycleSchedulerContinuousWhileSupervisorRuns: bool(
        getPath(supervisorRuntimeTruth, ["lifecycleSchedulerContinuousWhileSupervisorRuns"]),
      ),
      unattendedServiceInstalled: bool(getPath(supervisorRuntimeTruth, ["unattendedServiceInstalled"])),
    },
    provenCapabilities: {
      supervisorProofPath: CONTINUOUS_SUPERVISOR_PROOF_PATH,
      supervisorProofGeneratedAt: continuousSupervisorProof?.generatedAt ?? null,
      resultPollerProofPath: CONTINUOUS_RESULT_POLLER_PROOF_PATH,
      resultPollerProofGeneratedAt: continuousResultPollerProof?.generatedAt ?? null,
      ...provenCapabilities,
      notes: [
        "modeTruth reflects only the latest supervisor summary profile.",
        "provenCapabilities reflects previously passing continuous supervisor/result-poller proof artifacts.",
        "Provider refresh can run under the supervisor only with explicit live-provider flags and quota caps; cached supervisor proof spends no provider quota.",
      ],
    },
    currentManagedProcesses,
    continuityAnswer,
    event: liveProof?.event ?? runtimeLaunch?.provider?.proof?.event ?? null,
    selectedMarket: liveProof?.selectedMarket ?? makerSeed?.selectedMarket ?? null,
    backend: {
      health,
    },
    provider: {
      liveProofPath: LIVE_PROOF_PATH,
      liveProofGeneratedAt: liveProof?.generatedAt ?? null,
      liveProofAgeHours,
      maxLiveProofAgeHours,
      quota: latestQuota(liveProof),
      policy: liveProof?.policy ?? runtimeLaunch?.provider?.quotaPolicy ?? null,
      cachedModeUsesQuota: false,
    },
    maker: {
      makerSeedPath: MAKER_SEED_PATH,
      makerSeedGeneratedAt: makerSeed?.generatedAt ?? null,
      makerSeedAgeHours,
      quoteRoute,
    },
    lifecycle: {
      schedulerRunPath: SCHEDULER_RUN_PATH,
      schedulerGeneratedAt: schedulerRun?.generatedAt ?? null,
      schedulerAgeHours,
      schedulerAction: getPath(schedulerRun, ["scheduler", "action"]),
      schedulerReason: getPath(schedulerRun, ["scheduler", "reason"]),
      schedulerCandidateMarketCount: getPath(schedulerRun, ["scheduler", "candidateMarketCount"]),
    },
    settlementSafety: {
      resultSettlementExecutionPath: RESULT_SETTLEMENT_EXECUTION_PATH,
      resultSettlementLiveBlockedPath: RESULT_SETTLEMENT_LIVE_BLOCKED_PATH,
      resultSettlementExecutionGeneratedAt: resultSettlementExecution?.generatedAt ?? null,
      resultSettlementExecutionAgeHours,
      resultSettlementLiveBlockedGeneratedAt: resultSettlementLiveBlocked?.generatedAt ?? null,
      resultSettlementLiveBlockedAgeHours,
      maxSettlementProofAgeHours,
      resultSettlementExecutionFresh,
      resultSettlementLiveBlockedFresh,
      resultSettlementGuardFresh: resultSettlementExecutionFresh && resultSettlementLiveBlockedFresh,
      nextSettlementProofAction:
        resultSettlementExecutionFresh && resultSettlementLiveBlockedFresh
          ? "none"
          : "rerun_trusted_result_settlement_execution_proof",
      executionRequiresMarketStatus: getPath(resultSettlementLiveBlocked, ["controls", "executeRequiresMarketStatus"]),
      blockedExecutionReason: getPath(resultSettlementLiveBlocked, ["execution", "reason"]),
      activeTesterEventMutated: getPath(resultSettlementExecution, ["targetTesterEvent", "mutated"]),
      checks: settlementChecks,
    },
    supervisor: {
      supervisorPath: SUPERVISOR_PATH,
      generatedAt: supervisor?.generatedAt ?? null,
      completedIterations: getPath(supervisor, ["settings", "completedIterations"]),
      runtimeTruth: supervisorRuntimeTruth,
      latestRunProfile: {
        makerSeedEnabled: getPath(supervisor, ["settings", "makerSeedEnabled"]),
        lifecycleSchedulerEnabled: getPath(supervisor, ["settings", "lifecycleSchedulerEnabled"]),
        resultIngestionEnabled: getPath(supervisor, ["settings", "resultIngestionEnabled"]),
        resultSettlementEnabled: getPath(supervisor, ["settings", "resultSettlementEnabled"]),
        approvedResultSettlementEnabled: getPath(supervisor, ["settings", "approvedResultSettlementEnabled"]),
        runProviderProof: getPath(supervisor, ["settings", "runProviderProof"]),
      },
    },
    checks,
    gaps: {
      p0: p0Gaps,
      p1: [
        "Status report proves foreground/local runtime truth only; it does not install an unattended daemon.",
        "Official-result automatic settlement remains future work; current trusted-result execution is guarded by exact confirmation and CLOSED market status.",
      ],
      p2: ["Multi-event provider polling remains future work."],
    },
  };

  await writeJson(outputPath, summary);
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.pass) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
