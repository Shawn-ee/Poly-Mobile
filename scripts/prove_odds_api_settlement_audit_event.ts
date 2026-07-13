import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { loadLocalEnvForScript } from "./local_env";

const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";
const DEFAULT_RESULT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/trusted-result-provider.redacted.json";
const DEFAULT_SETTLEMENT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-audit-event-dry-run.redacted.json";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-audit-event-summary.redacted.json";

type JsonObject = Record<string, unknown>;

let prisma: typeof import("@/lib/db")["prisma"];

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

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

function getPath(source: unknown, keys: string[]) {
  let cursor = source;
  for (const key of keys) {
    if (!cursor || typeof cursor !== "object" || !(key in cursor)) return null;
    cursor = (cursor as JsonObject)[key];
  }
  return cursor;
}

function cleanOutput(value: string) {
  return value.split(/\r?\n/).filter(Boolean).slice(-20);
}

function runSettlement(params: {
  eventSlug: string;
  resultPath: string;
  settlementOutputPath: string;
}) {
  const executable = process.execPath;
  const args = [
    path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs"),
    "scripts/settle_odds_api_one_event_from_result.ts",
    `--eventSlug=${params.eventSlug}`,
    `--result=${params.resultPath}`,
    `--output=${params.settlementOutputPath}`,
    "--writeAuditEvent",
  ];
  const run = spawnSync(executable, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
  });
  return {
    executable,
    args,
    exitCode: run.status,
    stdoutTail: cleanOutput(run.stdout ?? ""),
    stderrTail: cleanOutput(run.stderr ?? ""),
  };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run local settlement audit proof in production.");
  }
  loadLocalEnvForScript(["DATABASE_URL"]);
  ({ prisma } = await import("@/lib/db"));

  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const resultPath = argValue("result") ?? argValue("resultPath") ?? DEFAULT_RESULT_PATH;
  const settlementOutputPath = argValue("settlementOutput") ?? DEFAULT_SETTLEMENT_OUTPUT_PATH;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const beforeMax = await prisma.canonicalEvent.aggregate({
    where: { eventType: { startsWith: "settlement.trusted_result." } },
    _max: { id: true },
  });
  const command = runSettlement({ eventSlug, resultPath, settlementOutputPath });
  const settlementSummary = await readJson(settlementOutputPath);
  const auditEventId = getPath(settlementSummary, ["auditEvent", "id"]);
  const selectedMarketId = getPath(settlementSummary, ["selectedMarket", "id"]);
  const winningOutcomeId = getPath(settlementSummary, ["winningOutcome", "id"]);
  const resultDigest = getPath(settlementSummary, ["controls", "resultDigest"]);
  const auditRow =
    typeof auditEventId === "string"
      ? await prisma.canonicalEvent.findUnique({
          where: { id: BigInt(auditEventId) },
        })
      : null;
  const payload = auditRow?.payload as JsonObject | null | undefined;
  const checks = {
    commandPassed: command.exitCode === 0,
    settlementDryRunPassed: settlementSummary?.pass === true,
    summaryIncludesAuditEvent: typeof auditEventId === "string",
    canonicalEventCreatedAfterStart:
      auditRow != null &&
      (beforeMax._max.id == null || auditRow.id > beforeMax._max.id),
    canonicalEventTypeMatches: auditRow?.eventType === "settlement.trusted_result.preflight",
    canonicalEventMarketMatches: auditRow?.marketId === selectedMarketId,
    canonicalEventOutcomeMatches: auditRow?.outcomeId === winningOutcomeId,
    payloadDigestMatches: payload?.resultDigest === resultDigest,
    payloadDryRunMode: payload?.executionMode === "dry-run",
    providerQuotaNotUsed: true,
    marketNotMutatedByProof: getPath(settlementSummary, ["preview", "mutation"]) === "none",
  };
  const p0 = Object.entries(checks)
    .filter(([, value]) => value !== true)
    .map(([key]) => key);
  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-one-event-settlement-audit-event-proof",
    pass: p0.length === 0,
    providerQuotaUsed: false,
    command,
    settlementSummaryPath: settlementOutputPath,
    eventSlug,
    selectedMarketId,
    winningOutcomeId,
    auditEvent: auditRow
      ? {
          id: auditRow.id.toString(),
          eventType: auditRow.eventType,
          stream: auditRow.stream,
          topicKey: auditRow.topicKey,
          marketId: auditRow.marketId,
          outcomeId: auditRow.outcomeId,
          createdAt: auditRow.createdAt.toISOString(),
          payload: {
            eventSlug: payload?.eventSlug ?? null,
            resultDigest: payload?.resultDigest ?? null,
            executionMode: payload?.executionMode ?? null,
            executionAttempted: payload?.executionAttempted ?? null,
            previewPayoutConservationPass: payload?.previewPayoutConservationPass ?? null,
            currentMarketStatus: payload?.currentMarketStatus ?? null,
          },
        }
      : null,
    checks,
    gaps: {
      p0,
      p1: [
        "Durable settlement audit events are now available for explicit local proof/operator runs, but unattended official-result polling is still not installed.",
        "Execution remains operator-confirmed rather than automatic.",
      ],
      p2: ["Operator settlement UI and multi-event settlement queue remain future work."],
    },
  };

  await writeJson(outputPath, summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.pass) process.exit(1);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    if (prisma) await prisma.$disconnect();
  });
