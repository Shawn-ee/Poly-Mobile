import fs from "node:fs/promises";
import path from "node:path";

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
const SCHEDULER_RUN_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-scheduler-run-summary.redacted.json";

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
  const liveProof = await readJson(LIVE_PROOF_PATH);
  const runtimeLaunch = await readJson(RUNTIME_LAUNCH_PATH);
  const makerSeed = await readJson(MAKER_SEED_PATH);
  const supervisor = await readJson(SUPERVISOR_PATH);
  const schedulerRun = await readJson(SCHEDULER_RUN_PATH);

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
  const liveProofFresh =
    liveProofAgeHours != null && liveProofAgeHours >= 0 && liveProofAgeHours <= maxLiveProofAgeHours;
  const supervisorRuntimeTruth = getPath(supervisor, ["runtimeTruth"]);

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
  };
  const p0Gaps = Object.entries(checks)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-one-event-runtime-status",
    pass: p0Gaps.length === 0,
    baseUrl,
    modeTruth: {
      cachedRuntimeUsesQuota: false,
      liveProviderRefreshRequiresExplicitFlag: true,
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
    supervisor: {
      supervisorPath: SUPERVISOR_PATH,
      generatedAt: supervisor?.generatedAt ?? null,
      completedIterations: getPath(supervisor, ["settings", "completedIterations"]),
      runtimeTruth: supervisorRuntimeTruth,
    },
    checks,
    gaps: {
      p0: p0Gaps,
      p1: [
        "Status report proves foreground/local runtime truth only; it does not install an unattended daemon.",
        "Official-result automatic settlement remains future work.",
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
