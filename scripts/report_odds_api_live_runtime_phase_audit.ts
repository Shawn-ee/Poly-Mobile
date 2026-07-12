import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_BASE_URL = "http://127.0.0.1:3002";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json";

const PATHS = {
  liveProof: "docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json",
  onboarding: "docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-summary.redacted.json",
  readiness: "docs/mobile/harness/odds-api-live-runtime/one-event-live-readiness-summary.redacted.json",
  runtimeStatus: "docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json",
  runtimeLaunch: "docs/mobile/harness/odds-api-live-runtime/one-event-runtime-launch-summary.redacted.json",
  supervisor: "docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-summary.redacted.json",
  supervisorProcess: "docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-process-summary.redacted.json",
  internalTesterRuntime:
    "docs/mobile/harness/odds-api-live-runtime/internal-tester-runtime-manager-summary.redacted.json",
  localRuntimeTask: "docs/mobile/harness/odds-api-live-runtime/local-runtime-task-summary.redacted.json",
  localRuntimeTaskInstall:
    "docs/mobile/harness/odds-api-live-runtime/local-runtime-task-install-uninstall-summary.redacted.json",
  localRuntimeStartup:
    "docs/mobile/harness/odds-api-live-runtime/local-runtime-startup-summary.redacted.json",
  localRuntimeStartupInstall:
    "docs/mobile/harness/odds-api-live-runtime/local-runtime-startup-install-uninstall-summary.redacted.json",
  continuousSupervisor: "docs/mobile/harness/odds-api-live-runtime/one-event-continuous-supervisor-proof-summary.redacted.json",
  staleGuardProof: "docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-summary.redacted.json",
  staleGuardRun: "docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-run-summary.redacted.json",
  lifecycleControls: "docs/mobile/harness/odds-api-live-runtime/event-lifecycle-controls-summary.redacted.json",
  lifecycleScheduler: "docs/mobile/harness/odds-api-live-runtime/event-lifecycle-scheduler-summary.redacted.json",
  lifecycleSchedulerRun: "docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-scheduler-run-summary.redacted.json",
  settlementReadiness: "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-readiness-summary.redacted.json",
  settlementExecution: "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-execution-summary.redacted.json",
  resultSettlementExecution:
    "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-scheduler-execution-summary.redacted.json",
  resultSettlementLiveBlocked:
    "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-scheduler-execution-live-blocked.redacted.json",
  manualSettlement: "docs/mobile/harness/odds-api-live-runtime/one-event-manual-settlement-summary.redacted.json",
  resultIngestion: "docs/mobile/harness/odds-api-live-runtime/one-event-result-ingestion-summary.redacted.json",
  resultSettlement: "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-summary.redacted.json",
  resultSettlementRun: "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-run-summary.redacted.json",
  settlementPreflight:
    "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-preflight-summary.redacted.json",
  settlementAuditEvent:
    "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-audit-event-summary.redacted.json",
  makerSeed: "docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json",
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

async function fetchJson(url: string) {
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
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const entries = Object.fromEntries(
    await Promise.all(Object.entries(PATHS).map(async ([key, filePath]) => [key, await readJson(filePath)])),
  ) as Record<keyof typeof PATHS, JsonObject | null>;
  const health = await fetchJson(`${baseUrl}/api/health`);
  const selectedMarketId = text(getPath(entries.liveProof, ["selectedMarket", "id"]));
  const quote = selectedMarketId
    ? await fetchJson(`${baseUrl}/api/markets/${encodeURIComponent(selectedMarketId)}/quote`)
    : null;
  const liveEventStart = text(getPath(entries.liveProof, ["event", "commenceTime"]));
  const eventUpcoming = liveEventStart ? Date.parse(liveEventStart) > Date.now() : false;
  const quotaUsed = numberValue(getPath(entries.liveProof, ["provider", "quota", "totalLastCost"]));
  const quotaRemaining = text(getPath(entries.liveProof, ["provider", "quota", "latest", "requestsRemaining"]));
  const supervisorTruth = getPath(entries.supervisor, ["runtimeTruth"]);
  const internalTesterTruth = getPath(entries.internalTesterRuntime, ["runtimeTruth"]);
  const continuousSupervisorTruth = getPath(entries.continuousSupervisor, ["runtimeTruth"]);
  const runtimeStatusTruth = getPath(entries.runtimeStatus, ["modeTruth"]);
  const staleRunResult = getPath(entries.staleGuardRun, ["result"]);
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
        quote?.ok === true,
      evidence: [PATHS.makerSeed, quote ? `${baseUrl}/api/markets/${selectedMarketId}/quote` : "missing quote route"],
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
      requirement: "Event lifecycle open, suspended, and closed behavior is proven.",
      achieved:
        pass(entries.lifecycleControls) &&
        pass(entries.lifecycleScheduler) &&
        getPath(entries.lifecycleControls, ["checks", "pausedOrderRejected"]) === true &&
        getPath(entries.lifecycleControls, ["checks", "closedOrderRejected"]) === true,
      evidence: [PATHS.lifecycleControls, PATHS.lifecycleScheduler, PATHS.lifecycleSchedulerRun],
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
        getPath(entries.settlementPreflight, ["executionPreflight", "dryRunPreviewPass"]) === true &&
        getPath(entries.settlementPreflight, ["executionPreflight", "executionRequiresMarketStatus"]) === "CLOSED" &&
        getPath(entries.settlementAuditEvent, ["checks", "canonicalEventTypeMatches"]) === true &&
        getPath(entries.settlementAuditEvent, ["checks", "marketNotMutatedByProof"]) === true,
      evidence: [
        PATHS.settlementReadiness,
        PATHS.manualSettlement,
        PATHS.resultIngestion,
        PATHS.resultSettlement,
        PATHS.resultSettlementRun,
        PATHS.settlementPreflight,
        PATHS.settlementAuditEvent,
        "docs/mobile/EVENT_LIFECYCLE_RUNBOOK.md",
      ],
      notes:
        "Provider-shaped score ingestion can produce trusted result JSON in replay mode, and the local scheduler can dry-run that result. Settlement preflight reports current execution eligibility and blockers. Trusted-result execution is blocked unless the market is CLOSED. Explicit operator/proof runs can write durable canonical settlement audit events. Live score ingestion is explicit and quota-guarded through the command or supervisor controls; installed unattended official result polling remains P1.",
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
      id: "backend-runtime-health",
      priority: "P0",
      requirement: "Backend health and selected quote route are reachable locally.",
      achieved: health.ok && (health.body as JsonObject)?.status === "ok" && quote?.ok === true,
      evidence: [`${baseUrl}/api/health`, quote ? `${baseUrl}/api/markets/${selectedMarketId}/quote` : "missing quote route"],
    }),
    requirement({
      id: "internal-tester-runtime-manager",
      priority: "P0",
      requirement: "Local internal tester runtime manager can report backend, Expo, Postgres, S23, and supervisor status without spending provider quota.",
      achieved:
        pass(entries.internalTesterRuntime) &&
        getPath(entries.internalTesterRuntime, ["readiness", "backendReady"]) === true &&
        getPath(entries.internalTesterRuntime, ["readiness", "expoReady"]) === true &&
        getPath(entries.internalTesterRuntime, ["readiness", "postgresReady"]) === true &&
        getPath(entries.internalTesterRuntime, ["s23", "connected"]) === true &&
        getPath(internalTesterTruth, ["localControlPlaneAvailable"]) === true &&
        getPath(internalTesterTruth, ["stopsOnlyOwnedBackendExpoProcesses"]) === true &&
        getPath(internalTesterTruth, ["installedOsService"]) === false,
      evidence: [PATHS.internalTesterRuntime],
      notes:
        "This proves local operator visibility/control for internal testing. It reuses external backend/Expo listeners when present and only stops manager-owned backend/Expo processes.",
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
        PATHS.localRuntimeTask,
        PATHS.localRuntimeTaskInstall,
        PATHS.localRuntimeStartup,
        PATHS.localRuntimeStartupInstall,
        PATHS.continuousSupervisor,
      ],
      notes:
        "Repeated local supervisor cycles, process-tree stop support, an internal tester runtime manager, a dry-run Windows scheduled-task install plan, a safe scheduled-task permission audit, and a user-level Startup launcher install/uninstall proof are proven. Windows denied scheduled-task registration in the current process context, so no scheduled task remains installed. The Startup launcher is a user-logon fallback, not a production service.",
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
        PATHS.resultSettlement,
        PATHS.resultSettlementRun,
        PATHS.settlementPreflight,
        PATHS.settlementAuditEvent,
      ],
      notes:
        "Provider-shaped result ingestion replay, durable canonical settlement audit events, and trusted-result scheduler execution are proven on local evidence. Execution is blocked while the target market remains LIVE. Live score ingestion is available only behind explicit live flags plus THE_ODDS_API_KEY, including the quota-capped supervisor path. Installed unattended provider result polling and unconfirmed active-event execution remain future work.",
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
        "Local one-event runtime is internally usable with cached/live-proofed provider data, fake-token trading, local internal tester runtime status/control, supervisor monitoring, provider-shaped replay result ingestion, opt-in quota-capped live result ingestion controls, and trusted-result settlement dry-run scheduling. It is not a production unattended daemon and does not install unattended official result polling.",
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
