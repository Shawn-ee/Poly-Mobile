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
  continuousSupervisor: "docs/mobile/harness/odds-api-live-runtime/one-event-continuous-supervisor-proof-summary.redacted.json",
  staleGuardProof: "docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-summary.redacted.json",
  staleGuardRun: "docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-run-summary.redacted.json",
  lifecycleControls: "docs/mobile/harness/odds-api-live-runtime/event-lifecycle-controls-summary.redacted.json",
  lifecycleScheduler: "docs/mobile/harness/odds-api-live-runtime/event-lifecycle-scheduler-summary.redacted.json",
  lifecycleSchedulerRun: "docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-scheduler-run-summary.redacted.json",
  settlementReadiness: "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-readiness-summary.redacted.json",
  manualSettlement: "docs/mobile/harness/odds-api-live-runtime/one-event-manual-settlement-summary.redacted.json",
  resultIngestion: "docs/mobile/harness/odds-api-live-runtime/one-event-result-ingestion-summary.redacted.json",
  resultSettlement: "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-summary.redacted.json",
  resultSettlementRun: "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-run-summary.redacted.json",
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
      achieved: pass(entries.runtimeStatus) && getPath(runtimeStatusTruth, ["cachedRuntimeUsesQuota"]) === false,
      evidence: [PATHS.runtimeStatus, PATHS.onboarding],
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
        "Replay-mode result ingestion is proven inside repeated supervisor cycles. Live score polling and settlement execution remain explicit P1 work.",
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
        pass(entries.resultSettlementRun),
      evidence: [
        PATHS.settlementReadiness,
        PATHS.manualSettlement,
        PATHS.resultIngestion,
        PATHS.resultSettlement,
        PATHS.resultSettlementRun,
        "docs/mobile/EVENT_LIFECYCLE_RUNBOOK.md",
      ],
      notes:
        "Provider-shaped score ingestion can produce trusted result JSON in replay mode, and the local scheduler can dry-run that result. Live score ingestion is explicit and quota-guarded; unattended official result polling remains P1.",
    }),
    requirement({
      id: "backend-runtime-health",
      priority: "P0",
      requirement: "Backend health and selected quote route are reachable locally.",
      achieved: health.ok && (health.body as JsonObject)?.status === "ok" && quote?.ok === true,
      evidence: [`${baseUrl}/api/health`, quote ? `${baseUrl}/api/markets/${selectedMarketId}/quote` : "missing quote route"],
    }),
    requirement({
      id: "unattended-service",
      priority: "P1",
      requirement: "Install unattended provider/maker/lifecycle services.",
      achieved: false,
      evidence: [PATHS.supervisor, PATHS.supervisorProcess, PATHS.continuousSupervisor],
      notes: "Repeated local supervisor cycles and process-tree stop support are proven, but no OS/service manager install exists.",
    }),
    requirement({
      id: "official-result-auto-settlement",
      priority: "P1",
      requirement: "Automatically ingest official soccer results and settle markets.",
      achieved: false,
      evidence: [
        PATHS.settlementReadiness,
        PATHS.manualSettlement,
        PATHS.resultIngestion,
        PATHS.resultSettlement,
        PATHS.resultSettlementRun,
      ],
      notes:
        "Provider-shaped result ingestion replay is proven and live score ingestion is available only behind --live plus THE_ODDS_API_KEY. Unattended provider result polling and unconfirmed execution remain future work.",
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
        "Local one-event runtime is internally usable with cached/live-proofed provider data, fake-token trading, supervisor monitoring, provider-shaped result ingestion, and trusted-result settlement dry-run scheduling. It is not a production unattended daemon and does not install unattended official result polling.",
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
