import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { loadLocalEnvForScript } from "./local_env";

const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";
const DEFAULT_INGESTION_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-result-ingestion-audit-event-ingest.redacted.json";
const DEFAULT_TRUSTED_RESULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/trusted-result-provider.redacted.json";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-result-ingestion-audit-event-summary.redacted.json";

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

function runIngestion(params: {
  eventSlug: string;
  ingestionOutputPath: string;
  trustedResultOutputPath: string;
}) {
  const executable = process.execPath;
  const args = [
    path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs"),
    "scripts/ingest_odds_api_one_event_result.ts",
    `--eventSlug=${params.eventSlug}`,
    `--output=${params.ingestionOutputPath}`,
    `--trustedResultOutput=${params.trustedResultOutputPath}`,
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
    throw new Error("Refusing to run local result ingestion audit proof in production.");
  }
  loadLocalEnvForScript(["DATABASE_URL"]);
  ({ prisma } = await import("@/lib/db"));

  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const ingestionOutputPath = argValue("ingestionOutput") ?? DEFAULT_INGESTION_OUTPUT_PATH;
  const trustedResultOutputPath = argValue("trustedResultOutput") ?? DEFAULT_TRUSTED_RESULT_OUTPUT_PATH;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

  const beforeMax = await prisma.canonicalEvent.aggregate({
    where: { eventType: "provider.result.ingested" },
    _max: { id: true },
  });
  const command = runIngestion({ eventSlug, ingestionOutputPath, trustedResultOutputPath });
  const ingestionSummary = await readJson(ingestionOutputPath);
  const auditEventId = getPath(ingestionSummary, ["auditEvent", "id"]);
  const trustedResultDigest = getPath(ingestionSummary, ["auditEvent", "payload", "trustedResultDigest"]);
  const trustedResult = await readJson(trustedResultOutputPath);
  const auditRow =
    typeof auditEventId === "string"
      ? await prisma.canonicalEvent.findUnique({ where: { id: BigInt(auditEventId) } })
      : null;
  const payload = auditRow?.payload as JsonObject | null | undefined;
  const checks = {
    commandPassed: command.exitCode === 0,
    ingestionPassed: ingestionSummary?.pass === true,
    summaryIncludesAuditEvent: typeof auditEventId === "string",
    canonicalEventCreatedAfterStart:
      auditRow != null &&
      (beforeMax._max.id == null || auditRow.id > beforeMax._max.id),
    canonicalEventTypeMatches: auditRow?.eventType === "provider.result.ingested",
    canonicalEventStreamMatches: auditRow?.stream === "MARKET",
    canonicalEventTopicMatches: auditRow?.topicKey === `market:provider-result:${eventSlug}`,
    payloadEventSlugMatches: payload?.eventSlug === eventSlug,
    payloadSourceEventMatches: payload?.sourceEventId === getPath(trustedResult, ["sourceEventId"]),
    payloadDigestMatches: payload?.trustedResultDigest === trustedResultDigest,
    payloadSettlementExecutionFalse: payload?.settlementExecutionAttempted === false,
    providerQuotaNotUsed: getPath(ingestionSummary, ["runtimeTruth", "defaultModeUsesQuota"]) === false,
  };
  const p0 = Object.entries(checks)
    .filter(([, value]) => value !== true)
    .map(([key]) => key);
  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-one-event-result-ingestion-audit-event-proof",
    pass: p0.length === 0,
    providerQuotaUsed: false,
    command,
    ingestionSummaryPath: ingestionOutputPath,
    trustedResultOutputPath,
    eventSlug,
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
            sourceEventId: payload?.sourceEventId ?? null,
            resultStatus: payload?.resultStatus ?? null,
            homeScore: payload?.homeScore ?? null,
            awayScore: payload?.awayScore ?? null,
            advanceTeam: payload?.advanceTeam ?? null,
            trustedResultDigest: payload?.trustedResultDigest ?? null,
            settlementExecutionAttempted: payload?.settlementExecutionAttempted ?? null,
          },
        }
      : null,
    checks,
    gaps: {
      p0,
      p1: [
        "Durable provider result ingestion audit events are now available for local proof/operator runs, but unattended official-result polling is still not installed.",
        "Result ingestion audit evidence is canonical event stream data, not a dedicated provider-result table yet.",
      ],
      p2: ["Operator result review UI and multi-event result queue remain future work."],
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
