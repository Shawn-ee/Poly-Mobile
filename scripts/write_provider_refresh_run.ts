import fs from "node:fs/promises";
import { loadLocalEnvForScript } from "./local_env";

type JsonObject = Record<string, unknown>;

let prisma: typeof import("@/lib/db")["prisma"];
let writeProviderRefreshRun: typeof import("@/server/services/providerRefreshRun")["writeProviderRefreshRun"];

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

const normalizeOutcomeLabel = (value: string | null) =>
  value
    ?.toLowerCase()
    .replace(/\+/g, "")
    .replace(/\s+/g, " ")
    .trim() ?? null;

async function resolveSelectedOutcomeId(params: {
  marketId: string | null;
  outcomeId: string | null;
  outcomeName: string | null;
}) {
  if (!params.marketId) {
    return { outcomeId: params.outcomeId, reconciled: false, reason: "missing_market_id" };
  }
  if (params.outcomeId) {
    const existing = await prisma.outcome.findFirst({
      where: { id: params.outcomeId, marketId: params.marketId },
      select: { id: true },
    });
    if (existing) return { outcomeId: params.outcomeId, reconciled: false, reason: "outcome_id_current" };
  }

  const outcomes = await prisma.outcome.findMany({
    where: { marketId: params.marketId, isActive: true, isTradable: true },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true },
  });
  const normalizedName = normalizeOutcomeLabel(params.outcomeName);
  const matchedByName = normalizedName
    ? outcomes.find((outcome) => normalizeOutcomeLabel(outcome.name) === normalizedName)
    : null;
  const selected = matchedByName ?? outcomes[0] ?? null;
  return {
    outcomeId: selected?.id ?? params.outcomeId,
    reconciled: Boolean(selected && selected.id !== params.outcomeId),
    reason: matchedByName ? "matched_current_outcome_label" : selected ? "fallback_first_current_outcome" : "no_current_outcome",
  };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to write local provider refresh run in production.");
  }
  loadLocalEnvForScript(["DATABASE_URL"]);
  ({ prisma } = await import("@/lib/db"));
  ({ writeProviderRefreshRun } = await import("@/server/services/providerRefreshRun"));

  const summaryPath = argValue("summaryPath") ?? argValue("input") ?? DEFAULT_SUMMARY_PATH;
  const summary = JSON.parse(await fs.readFile(summaryPath, "utf8")) as JsonObject;
  const provider = getPath(summary, ["provider"]);
  const calls = getPath(provider, ["calls"]);
  const latestQuota = getPath(provider, ["quota", "latest"]);
  const selectedMarket = getPath(summary, ["selectedMarket"]);
  const selectedMarketId = stringValue(getPath(selectedMarket, ["id"]));
  const selectedOutcomeId = stringValue(getPath(selectedMarket, ["outcomeId"]));
  const selectedOutcomeName = stringValue(getPath(selectedMarket, ["outcomeName"]));
  const selectedOutcome = await resolveSelectedOutcomeId({
    marketId: selectedMarketId,
    outcomeId: selectedOutcomeId,
    outcomeName: selectedOutcomeName,
  });
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
    selectedMarketId,
    selectedOutcomeId: selectedOutcome.outcomeId,
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
      selectedOutcomeReconciliation: {
        originalOutcomeId: selectedOutcomeId,
        originalOutcomeName: selectedOutcomeName,
        reconciledOutcomeId: selectedOutcome.outcomeId,
        reconciled: selectedOutcome.reconciled,
        reason: selectedOutcome.reason,
      },
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
    if (prisma) await prisma.$disconnect();
  });
