import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";

const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";
const DEFAULT_SETTLEMENT_AUDIT_SUMMARY_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-audit-event-summary.redacted.json";
const DEFAULT_RESULT_INGESTION_AUDIT_SUMMARY_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-result-ingestion-audit-event-summary.redacted.json";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-result-review-trail-summary.redacted.json";

type JsonObject = Record<string, unknown>;

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

function compactPayload(payload: unknown) {
  const value = (payload ?? {}) as JsonObject;
  return {
    eventSlug: value.eventSlug ?? null,
    sourceEventId: value.sourceEventId ?? null,
    resultStatus: value.resultStatus ?? null,
    homeScore: value.homeScore ?? null,
    awayScore: value.awayScore ?? null,
    advanceTeam: value.advanceTeam ?? null,
    trustedResultDigest: value.trustedResultDigest ?? null,
    resultDigest: value.resultDigest ?? null,
    executionMode: value.executionMode ?? null,
    executionAttempted: value.executionAttempted ?? null,
    settlementExecutionAttempted: value.settlementExecutionAttempted ?? null,
    previewPayoutConservationPass: value.previewPayoutConservationPass ?? null,
    currentMarketStatus: value.currentMarketStatus ?? null,
  };
}

function compactEvent(row: Awaited<ReturnType<typeof prisma.canonicalEvent.findFirst>>) {
  if (!row) return null;
  return {
    id: row.id.toString(),
    eventType: row.eventType,
    stream: row.stream,
    topicKey: row.topicKey,
    marketId: row.marketId,
    outcomeId: row.outcomeId,
    createdAt: row.createdAt.toISOString(),
    payload: compactPayload(row.payload),
  };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run local result review trail report in production.");
  }

  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const settlementAuditSummaryPath = argValue("settlementAuditSummary") ?? DEFAULT_SETTLEMENT_AUDIT_SUMMARY_PATH;
  const resultIngestionAuditSummaryPath =
    argValue("resultIngestionAuditSummary") ?? DEFAULT_RESULT_INGESTION_AUDIT_SUMMARY_PATH;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

  const [settlementAuditSummary, resultIngestionAuditSummary] = await Promise.all([
    readJson(settlementAuditSummaryPath),
    readJson(resultIngestionAuditSummaryPath),
  ]);

  const selectedMarketId =
    (argValue("marketId") as string | undefined) ??
    (getPath(settlementAuditSummary, ["selectedMarketId"]) as string | null) ??
    (getPath(settlementAuditSummary, ["auditEvent", "marketId"]) as string | null);
  const winningOutcomeId =
    (argValue("outcomeId") as string | undefined) ??
    (getPath(settlementAuditSummary, ["winningOutcomeId"]) as string | null) ??
    (getPath(settlementAuditSummary, ["auditEvent", "outcomeId"]) as string | null);

  const providerResultEvent = await prisma.canonicalEvent.findFirst({
    where: {
      stream: "MARKET",
      topicKey: `market:provider-result:${eventSlug}`,
      eventType: "provider.result.ingested",
    },
    orderBy: { id: "desc" },
  });
  const settlementPreflightEvent = selectedMarketId
    ? await prisma.canonicalEvent.findFirst({
        where: {
          stream: "MARKET",
          marketId: selectedMarketId,
          eventType: "settlement.trusted_result.preflight",
        },
        orderBy: { id: "desc" },
      })
    : null;
  const market = selectedMarketId
    ? await prisma.market.findUnique({
        where: { id: selectedMarketId },
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          marketType: true,
          line: true,
          event: { select: { slug: true, title: true, startTime: true } },
        },
      })
    : null;

  const providerPayload = providerResultEvent?.payload as JsonObject | null | undefined;
  const settlementPayload = settlementPreflightEvent?.payload as JsonObject | null | undefined;
  const checks = {
    providerResultAuditEventFound: providerResultEvent != null,
    providerResultTopicMatches: providerResultEvent?.topicKey === `market:provider-result:${eventSlug}`,
    providerResultHasTrustedDigest: typeof providerPayload?.trustedResultDigest === "string",
    providerResultDidNotAttemptSettlement: providerPayload?.settlementExecutionAttempted === false,
    settlementPreflightAuditEventFound: settlementPreflightEvent != null,
    settlementMarketMatchesSelected: settlementPreflightEvent?.marketId === selectedMarketId,
    settlementOutcomeMatchesSelected: settlementPreflightEvent?.outcomeId === winningOutcomeId,
    settlementHasConfirmationDigest: typeof settlementPayload?.resultDigest === "string",
    settlementPreflightDryRun: settlementPayload?.executionMode === "dry-run",
    settlementDidNotExecuteActiveMarket: settlementPayload?.executionAttempted === false,
    settlementPayoutPreviewPassed: settlementPayload?.previewPayoutConservationPass === true,
    selectedMarketExists: market != null,
    reportIsReadOnly: true,
    providerQuotaNotUsed: true,
  };
  const p0 = Object.entries(checks)
    .filter(([, value]) => value !== true)
    .map(([key]) => key);

  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-one-event-result-review-trail",
    pass: p0.length === 0,
    providerQuotaUsed: false,
    eventSlug,
    selectedMarketId,
    winningOutcomeId,
    sourceEvidence: {
      settlementAuditSummaryPath,
      resultIngestionAuditSummaryPath,
    },
    market: market
      ? {
          id: market.id,
          slug: market.slug,
          title: market.title,
          status: market.status,
          marketType: market.marketType,
          line: market.line?.toString() ?? null,
          event: {
            slug: market.event.slug,
            title: market.event.title,
            startTime: market.event.startTime?.toISOString() ?? null,
          },
        }
      : null,
    reviewTrail: {
      providerResultEvent: compactEvent(providerResultEvent),
      settlementPreflightEvent: compactEvent(settlementPreflightEvent),
      digestNote:
        "trustedResultDigest hashes the provider-shaped trusted-result JSON; resultDigest hashes the guarded settlement confirmation tuple.",
      operatorDecision:
        settlementPayload?.currentMarketStatus === "CLOSED"
          ? "eligible_for_exact_confirmation_review"
          : "wait_for_closed_market_before_execution",
    },
    runtimeTruth: {
      canonicalProviderResultAuditAvailable: providerResultEvent != null,
      canonicalSettlementPreflightAuditAvailable: settlementPreflightEvent != null,
      executionRequiresMarketClosed: true,
      activeTesterSettlementExecution: false,
      readOnlyReport: true,
      providerQuotaUsed: false,
      dedicatedOfficialResultTableExists: false,
      operatorReviewUiExists: false,
    },
    checks,
    gaps: {
      p0,
      p1: [
        "Operator can now inspect the local canonical result/settlement review trail from a single report, but official-result polling is still not installed as a production service.",
        "Execution still requires exact operator confirmation and CLOSED market status.",
      ],
      p2: [
        "A dedicated official-result table, durable approval model, and operator review UI remain future work.",
      ],
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
    await prisma.$disconnect();
  });
