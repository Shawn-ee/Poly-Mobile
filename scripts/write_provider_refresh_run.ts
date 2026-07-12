import fs from "node:fs/promises";
import { prisma } from "@/lib/db";
import { writeProviderRefreshRun } from "@/server/services/providerRefreshRun";

type JsonObject = Record<string, unknown>;

const DEFAULT_SUMMARY_PATH = "docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
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

const numberValue = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to write local provider refresh run in production.");
  }

  const summaryPath = argValue("summaryPath") ?? argValue("input") ?? DEFAULT_SUMMARY_PATH;
  const summary = JSON.parse(await fs.readFile(summaryPath, "utf8")) as JsonObject;
  const provider = getPath(summary, ["provider"]);
  const calls = getPath(provider, ["calls"]);
  const latestQuota = getPath(provider, ["quota", "latest"]);
  const selectedMarket = getPath(summary, ["selectedMarket"]);
  const policy = getPath(summary, ["policy"]);
  const checks = getPath(summary, ["checks"]);
  const seed = getPath(provider, ["seed"]);

  const run = await writeProviderRefreshRun({
    providerSource: stringValue(getPath(policy, ["providerSource"])) ?? "the-odds-api",
    referenceSource: stringValue(getPath(policy, ["referenceSource"])) ?? "sportsbook-odds",
    status: summary.pass === true ? "passed" : "failed",
    mode: "bounded-live-provider-proof",
    startedAt: stringValue(getPath(summary, ["startedAt"])) ?? stringValue(getPath(summary, ["generatedAt"])) ?? new Date().toISOString(),
    finishedAt: stringValue(getPath(summary, ["generatedAt"])) ?? new Date().toISOString(),
    eventSlug: stringValue(getPath(summary, ["event", "localSlug"])),
    providerEventId: stringValue(getPath(summary, ["event", "providerEventId"])),
    sportKey: stringValue(getPath(summary, ["event", "sportKey"])),
    selectedMarketId: stringValue(getPath(selectedMarket, ["id"])),
    selectedOutcomeId: stringValue(getPath(selectedMarket, ["outcomeId"])),
    refreshIterations: numberValue(getPath(policy, ["refreshIterations"])) ?? 0,
    providerCallCount: Array.isArray(calls) ? calls.length : 0,
    quotaCost: numberValue(getPath(provider, ["quota", "totalLastCost"])) ?? 0,
    requestsRemaining: stringValue(getPath(latestQuota, ["requestsRemaining"])),
    maxCredits: numberValue(getPath(policy, ["maxCredits"])),
    minRemaining: numberValue(getPath(policy, ["minRemaining"])),
    marketCount: numberValue(getPath(provider, ["normalizedMarketCount"])) ?? numberValue(getPath(seed, ["marketCount"])) ?? 0,
    outcomeCount: numberValue(getPath(seed, ["outcomeCount"])) ?? 0,
    snapshotCount: numberValue(getPath(seed, ["outcomeCount"])) ?? 0,
    staleBeforeRefresh:
      getPath(checks, ["staleDetectedBeforeRefresh"]) === true ||
      stringValue(getPath(summary, ["lifecycle", "beforeRefresh", "status"])) === "stale",
    readyAfterRefresh:
      getPath(checks, ["readyAfterRefresh"]) === true ||
      stringValue(getPath(summary, ["lifecycle", "afterRefresh", "status"])) === "ready",
    metadata: {
      source: "local-provider-refresh-proof",
      emittedBy: "scripts/write_provider_refresh_run.ts",
      quotaProtected: getPath(checks, ["quotaProtected"]) === true,
      summaryPath,
      selectedMarketKeys: getPath(provider, ["selectedMarketKeys"]),
      importedMarketKeys: getPath(provider, ["importedMarketKeys"]),
      checks,
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
    await prisma.$disconnect();
  });
