import fs from "node:fs/promises";
import { loadLocalEnvForScript } from "./local_env";

let prisma: typeof import("@/lib/db")["prisma"];
let writeRuntimeServiceRun: typeof import("@/server/services/runtimeServiceRun")["writeRuntimeServiceRun"];

type JsonObject = Record<string, unknown>;

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const booleanArg = (name: string, fallback = false) => {
  const value = argValue(name);
  if (value == null) return fallback;
  return value === "true" || value === "1" || value === "yes";
};

const numberArg = (name: string, fallback = 0) => {
  const value = argValue(name);
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const required = (name: string) => {
  const value = argValue(name);
  if (!value) throw new Error(`Missing required --${name}=...`);
  return value;
};

const readSummary = async (path: string | null) => {
  if (!path) return {};
  return JSON.parse(await fs.readFile(path, "utf8")) as JsonObject;
};

const getPath = (source: unknown, keys: string[]) => {
  let cursor = source;
  for (const key of keys) {
    if (!cursor || typeof cursor !== "object" || !(key in cursor)) return null;
    cursor = (cursor as JsonObject)[key];
  }
  return cursor;
};

const stringValue = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : null);

const latestCycle = (summary: JsonObject) => {
  const cycles = getPath(summary, ["cycles"]);
  return Array.isArray(cycles) && cycles.length > 0 ? (cycles[cycles.length - 1] as JsonObject) : {};
};

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to write local runtime run record in production.");
  }
  loadLocalEnvForScript(["DATABASE_URL"]);
  ({ prisma } = await import("@/lib/db"));
  ({ writeRuntimeServiceRun } = await import("@/server/services/runtimeServiceRun"));

  const serviceName = required("serviceName");
  const serviceKind = required("serviceKind");
  const summaryPath = argValue("summaryPath") ?? null;
  const summary = await readSummary(summaryPath);
  const latest = latestCycle(summary);
  const pass = summary.pass === true;
  const startedAt = argValue("startedAt") ?? stringValue(summary.startedAt);
  if (!startedAt) throw new Error("Missing runtime run startedAt.");

  const providerQuotaUsed =
    booleanArg("providerQuotaUsed", false) ||
    getPath(summary, ["settings", "runProviderProof"]) === true ||
    getPath(summary, ["settings", "runLiveResultIngestion"]) === true;
  const resultAction =
    stringValue(getPath(latest, ["resultSettlementAction"])) ??
    stringValue(getPath(latest, ["settlementDigest", "executionDecision", "operatorDecision"])) ??
    stringValue(getPath(summary, ["runtimeTruth", "settlementSchedulerMode"]));
  const selectedMarketId =
    stringValue(getPath(latest, ["selectedMarket", "id"])) ??
    stringValue(getPath(latest, ["selectedMarket", "marketId"])) ??
    stringValue(getPath(latest, ["settlementDigest", "marketId"]));
  const eventSlug =
    stringValue(getPath(summary, ["eventSlug"])) ??
    stringValue(getPath(latest, ["event", "slug"])) ??
    stringValue(getPath(latest, ["event", "localSlug"])) ??
    stringValue(getPath(latest, ["eventSlug"]));

  const run = await writeRuntimeServiceRun({
    serviceName,
    serviceKind,
    status: argValue("status") ?? (pass ? "passed" : "failed"),
    startedAt,
    finishedAt: argValue("finishedAt") ?? stringValue(summary.completedAt) ?? new Date().toISOString(),
    iterationCount: numberArg("iterationCount", Number(getPath(summary, ["settings", "completedIterations"])) || 0),
    providerQuotaUsed,
    activeSettlementExecuted: booleanArg("activeSettlementExecuted", false),
    installedOsService: booleanArg("installedOsService", false),
    eventSlug,
    selectedMarketId,
    resultAction,
    summaryPath,
    metadata: {
      source: "local-runtime-worker",
      emittedBy: "scripts/write_runtime_service_run.ts",
      workerOwned: true,
      scope: stringValue(summary.scope),
      summaryGeneratedAt: stringValue(summary.generatedAt),
      latestIteration: latest,
      runtimeTruth: getPath(summary, ["runtimeTruth"]),
      gaps: getPath(summary, ["gaps"]),
    },
  });

  process.stdout.write(`${JSON.stringify({ pass: true, run }, null, 2)}\n`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    if (prisma) await prisma.$disconnect();
  });
