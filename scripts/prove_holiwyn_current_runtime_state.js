const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const backendPort = Number(process.env.HOLIWYN_BACKEND_PORT || 3002);
const expoPort = Number(process.env.HOLIWYN_EXPO_PORT || 8081);
const waitSeconds = Number(process.env.HOLIWYN_CURRENT_RUNTIME_WAIT_SECONDS || 45);
const resultPollerIntervalSeconds = Number(process.env.HOLIWYN_RESULT_POLLER_INTERVAL_SECONDS || 1);
const runtimeSummaryPath = path.join(repoRoot, "docs/mobile/harness/odds-api-live-runtime/internal-tester-runtime-manager-summary.redacted.json");
const proofSummaryPath = path.join(repoRoot, "docs/mobile/harness/odds-api-live-runtime/current-runtime-state-proof-summary.redacted.json");
const supervisorProcessSummaryPath = path.join(repoRoot, "docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-process-summary.redacted.json");
const resultPollerProcessSummaryPath = path.join(repoRoot, "docs/mobile/harness/odds-api-live-runtime/one-event-result-poller-process-summary.redacted.json");
const logDir = path.join(repoRoot, ".runtime/current-runtime-state-proof");
const statusUrl = `http://127.0.0.1:${backendPort}/api/internal/live-runtime/status`;

fs.mkdirSync(logDir, { recursive: true });

function rel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function tail(filePath, lines = 30) {
  try {
    return fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean).slice(-lines);
  } catch {
    return [];
  }
}

function runManager(label, args) {
  const startedAt = new Date().toISOString();
  const stdoutPath = path.join(logDir, `${label}.out.log`);
  const stderrPath = path.join(logDir, `${label}.err.log`);
  const result = spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "scripts/manage_holiwyn_internal_tester_runtime.ps1", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", fs.openSync(stdoutPath, "w"), fs.openSync(stderrPath, "w")],
    timeout: 120000,
  });
  return {
    label,
    args,
    exitCode: result.status ?? 124,
    pass: result.status === 0,
    signal: result.signal || null,
    startedAt,
    finishedAt: new Date().toISOString(),
    stdout: rel(stdoutPath),
    stderr: rel(stderrPath),
    stdoutTail: tail(stdoutPath),
    stderrTail: tail(stderrPath),
  };
}

function runCommand(label, command) {
  const startedAt = new Date().toISOString();
  const stdoutPath = path.join(logDir, `${label}.out.log`);
  const stderrPath = path.join(logDir, `${label}.err.log`);
  const executable = process.platform === "win32" ? "cmd.exe" : command[0];
  const args = process.platform === "win32" ? ["/d", "/s", "/c", command.join(" ")] : command.slice(1);
  const result = spawnSync(executable, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", fs.openSync(stdoutPath, "w"), fs.openSync(stderrPath, "w")],
    timeout: 120000,
    shell: false,
  });
  return {
    label,
    args: command,
    exitCode: result.status ?? 124,
    pass: result.status === 0,
    signal: result.signal || null,
    error: result.error ? result.error.message : null,
    startedAt,
    finishedAt: new Date().toISOString(),
    stdout: rel(stdoutPath),
    stderr: rel(stderrPath),
    stdoutTail: tail(stdoutPath),
    stderrTail: tail(stderrPath),
  };
}

async function getStatus() {
  try {
    const response = await fetch(statusUrl, { signal: AbortSignal.timeout(8000) });
    return await response.json();
  } catch (error) {
    return { status: "unavailable", error: error.message };
  }
}

async function waitForWarmState() {
  const deadline = Date.now() + waitSeconds * 1000;
  let status = null;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    status = await getStatus();
    const state = status && status.currentRuntimeState;
    if (state && state.warmNoQuotaRuntime === true && state.allLoopsRunning === true) {
      return status;
    }
  }
  return status || (await getStatus());
}

function runtimeDigest(summary) {
  if (!summary) return null;
  return {
    generatedAt: summary.generatedAt,
    pass: summary.pass === true,
    action: summary.action,
    readiness: {
      backendReady: Boolean(summary.readiness && summary.readiness.backendReady),
      expoReady: Boolean(summary.readiness && summary.readiness.expoReady),
      postgresReady: Boolean(summary.readiness && summary.readiness.postgresReady),
      s23Connected: Boolean(summary.readiness && summary.readiness.s23Connected),
    },
    supervisorRunning: Boolean(summary.supervisor && summary.supervisor.processSummary && summary.supervisor.processSummary.process.after.running === true),
    resultPollerRunning: Boolean(summary.resultPoller && summary.resultPoller.processSummary && summary.resultPoller.processSummary.process.after.running === true),
    runtimeTruth: summary.runtimeTruth || null,
  };
}

function processDigest(summary) {
  if (!summary) return null;
  return {
    generatedAt: summary.generatedAt,
    pass: summary.pass === true,
    action: summary.operation ? summary.operation.action : null,
    operationResult: summary.operation ? summary.operation.result : null,
    running: Boolean(summary.process && summary.process.after && summary.process.after.running === true),
    pid: summary.process && summary.process.after ? summary.process.after.pid ?? null : null,
    statePath: summary.process ? summary.process.statePath ?? null : null,
  };
}

async function main() {
  const startedAt = new Date().toISOString();
  const commands = [];
  const p0 = [];
  const p1 = [
    "Mobile-visible provider snapshots may still be stale in no-quota mode; live odds refresh remains explicit and quota-capped.",
    "This proves a local warm runtime, not an installed OS service.",
  ];
  const p2 = ["Multi-event warm-runtime orchestration remains future work."];

  commands.push(runManager("pre-stop-internal-runtime", ["-Action", "stop"]));
  const restoreCommand = {
    ...runCommand("restore-cached-live-one-event", [
      "npm",
      "run",
      "mobile:one-event-cached-restore",
    ]),
    restoresBackendOwnedEvent: true,
    restoresFrom: "docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json",
    expectedEvent: "Spain vs. France",
  };
  commands.push(restoreCommand);

  commands.push(runCommand("start-supervisor-warm-no-quota", [
    "npm", "run", "mobile:one-event-live-supervisor:process", "--",
    "-Action", "start",
    "-Continuous",
    "-MaxIterations", "0",
    "-BackendPort", String(backendPort),
    "-Force",
    "-RunResultIngestion",
  ]));
  commands.push(runCommand("start-result-poller-warm-no-quota", [
    "npm", "run", "mobile:one-event-result-poller:process", "--",
    "-Action", "start",
    "-Continuous",
    "-MaxIterations", "0",
    "-IntervalSeconds", String(resultPollerIntervalSeconds),
    "-Force",
  ]));

  await new Promise((resolve) => setTimeout(resolve, 5000));
  const runningStatus = await getStatus();
  commands.push(runCommand("status-supervisor-while-running", ["npm", "run", "mobile:one-event-live-supervisor:status"]));
  const supervisorWhileRunning = readJson(supervisorProcessSummaryPath);
  commands.push(runCommand("status-result-poller-while-running", ["npm", "run", "mobile:one-event-result-poller:status"]));
  const resultPollerWhileRunning = readJson(resultPollerProcessSummaryPath);
  const startSummary = readJson(runtimeSummaryPath);
  commands.push(runCommand("stop-supervisor-after-proof", ["npm", "run", "mobile:one-event-live-supervisor:stop"]));
  const supervisorStopSummary = readJson(supervisorProcessSummaryPath);
  commands.push(runCommand("stop-result-poller-after-proof", ["npm", "run", "mobile:one-event-result-poller:stop"]));
  const resultPollerStopSummary = readJson(resultPollerProcessSummaryPath);
  const stopSummary = readJson(runtimeSummaryPath);

  const runningState = runningStatus && runningStatus.currentRuntimeState ? runningStatus.currentRuntimeState : null;
  const managedProcesses = runningStatus && runningStatus.managedProcesses ? runningStatus.managedProcesses : null;
  const directSupervisorRunning = Boolean(supervisorWhileRunning && supervisorWhileRunning.process && supervisorWhileRunning.process.after && supervisorWhileRunning.process.after.running === true);
  const directResultPollerRunning = Boolean(resultPollerWhileRunning && resultPollerWhileRunning.process && resultPollerWhileRunning.process.after && resultPollerWhileRunning.process.after.running === true);
  const directWarmNoQuotaRuntime = directSupervisorRunning && directResultPollerRunning;

  if (!(runningStatus && runningStatus.status === "ready")) p0.push("local_runtime_status_not_ready_while_running");
  if (restoreCommand.pass !== true) p0.push("cached_one_event_restore_failed");
  if (!(runningState && runningState.localCapabilityReady === true)) p0.push("current_runtime_state_local_capability_not_ready");
  if (!directWarmNoQuotaRuntime) p0.push("direct_process_state_did_not_see_warm_no_quota_runtime");
  if (runningState && runningState.quotaSpendingLoopRunning === true) p0.push("quota_spending_loop_running");
  if (runningState && Array.isArray(runningState.p0) && runningState.p0.length > 0) p0.push("current_runtime_state_has_p0_gaps");
  if (!(runningState && runningState.warmNoQuotaRuntime === true)) p1.push("backend_status_route_did_not_report_warm_no_quota_runtime");
  if (!(runningState && runningState.allLoopsRunning === true)) p1.push("backend_status_route_did_not_report_all_loops_running");
  if (!(managedProcesses && managedProcesses.supervisor.running === true && managedProcesses.resultPoller.running === true)) {
    p1.push("backend_status_route_managed_processes_did_not_report_both_loops_running");
  }
  if (!(supervisorStopSummary && supervisorStopSummary.process && supervisorStopSummary.process.after && supervisorStopSummary.process.after.running === false && resultPollerStopSummary && resultPollerStopSummary.process && resultPollerStopSummary.process.after && resultPollerStopSummary.process.after.running === false)) {
    p0.push("stop_did_not_cleanup_runtime_loops");
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "holiwyn-current-runtime-state-proof",
    pass: p0.length === 0,
    startedAt,
    completedAt: new Date().toISOString(),
    settings: {
      backendPort,
      expoPort,
      resultPollerIntervalSeconds,
      waitSeconds,
      providerQuotaSpent: false,
    },
    runtimeTruth: {
      warmNoQuotaRuntimeObserved: directWarmNoQuotaRuntime,
      allLoopsRunningObserved: directWarmNoQuotaRuntime,
      backendStatusRouteWarmNoQuotaObserved: Boolean(runningState && runningState.warmNoQuotaRuntime === true),
      backendStatusRouteAllLoopsObserved: Boolean(runningState && runningState.allLoopsRunning === true),
      localCapabilityReadyWhileRunning: Boolean(runningState && runningState.localCapabilityReady === true),
      quotaSpendingLoopRunning: Boolean(runningState && runningState.quotaSpendingLoopRunning === true),
      testerReadyRightNow: Boolean(runningState && runningState.testerReadyRightNow === true),
      providerSnapshotFresh: Boolean(runningState && runningState.providerSnapshotFresh === true),
      mobileOddsLiveFresh: Boolean(runningState && runningState.providerSnapshotFresh === true),
      stopsLoopsAfterProof: Boolean(supervisorStopSummary && supervisorStopSummary.process && supervisorStopSummary.process.after && supervisorStopSummary.process.after.running === false && resultPollerStopSummary && resultPollerStopSummary.process && resultPollerStopSummary.process.after && resultPollerStopSummary.process.after.running === false),
      providerQuotaUsed: false,
      installedOsService: false,
      activeTesterSettlementExecution: false,
    },
    currentRuntimeState: runningState,
    managedProcesses,
    proof: {
      startSummary: runtimeDigest(startSummary),
      supervisorWhileRunning: processDigest(supervisorWhileRunning),
      resultPollerWhileRunning: processDigest(resultPollerWhileRunning),
      stopSummary: runtimeDigest(stopSummary),
      supervisorStopSummary: processDigest(supervisorStopSummary),
      resultPollerStopSummary: processDigest(resultPollerStopSummary),
      statusUrl,
    },
    commands,
    gaps: { p0, p1, p2 },
  };

  writeJson(proofSummaryPath, summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  process.exit(summary.pass ? 0 : 1);
}

main().catch((error) => {
  writeJson(proofSummaryPath, {
    generatedAt: new Date().toISOString(),
    scope: "holiwyn-current-runtime-state-proof",
    pass: false,
    error: error.message,
    gaps: { p0: ["current_runtime_state_proof_crashed"], p1: [], p2: [] },
  });
  console.error(error);
  process.exit(1);
});
