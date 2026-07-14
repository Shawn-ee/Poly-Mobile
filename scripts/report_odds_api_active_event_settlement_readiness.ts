import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { loadLocalEnvForScript } from "./local_env";

const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-readiness-summary.redacted.json";

const PATHS = {
  settlementPreflight:
    "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-preflight-summary.redacted.json",
  settlementAuditEvent:
    "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-audit-event-summary.redacted.json",
  settlementApprovalAuditEvent:
    "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-approval-audit-event-summary.redacted.json",
  resultReviewTrail:
    "docs/mobile/harness/odds-api-live-runtime/one-event-result-review-trail-summary.redacted.json",
  supervisorApprovedSettlement:
    "docs/mobile/harness/odds-api-live-runtime/one-event-supervisor-approved-settlement-wait-summary.redacted.json",
  activeSettlementClone:
    "docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-clone-summary.redacted.json",
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

function truthy(value: unknown) {
  return value === true;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run local active settlement readiness report in production.");
  }

  const envLoad = loadLocalEnvForScript(["DATABASE_URL"]);
  if (envLoad.missingKeys.includes("DATABASE_URL")) {
    throw new Error(
      "DATABASE_URL is required for active settlement readiness. Set DATABASE_URL, set DOTENV_CONFIG_PATH, or run from a workspace with a local .env.",
    );
  }

  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const entries = Object.fromEntries(
    await Promise.all(Object.entries(PATHS).map(async ([key, filePath]) => [key, await readJson(filePath)])),
  ) as Record<keyof typeof PATHS, JsonObject | null>;

  const selectedMarketId =
    (argValue("marketId") as string | undefined) ??
    (getPath(entries.resultReviewTrail, ["selectedMarketId"]) as string | null) ??
    (getPath(entries.settlementApprovalAuditEvent, ["selectedMarket", "id"]) as string | null) ??
    (getPath(entries.settlementAuditEvent, ["selectedMarketId"]) as string | null);
  const winningOutcomeId =
    (argValue("outcomeId") as string | undefined) ??
    (getPath(entries.resultReviewTrail, ["winningOutcomeId"]) as string | null) ??
    (getPath(entries.settlementApprovalAuditEvent, ["winningOutcome", "id"]) as string | null) ??
    (getPath(entries.settlementAuditEvent, ["winningOutcomeId"]) as string | null);

  const market = selectedMarketId
    ? await prisma.market.findUnique({
        where: { id: selectedMarketId },
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          settlementStatus: true,
          resolvedOutcomeId: true,
          event: { select: { slug: true, title: true, startTime: true, status: true, liveStatus: true } },
        },
      })
    : null;
  const approvalEvent = selectedMarketId
    ? await prisma.canonicalEvent.findFirst({
        where: {
          stream: "MARKET",
          marketId: selectedMarketId,
          outcomeId: winningOutcomeId ?? undefined,
          eventType: "settlement.trusted_result.approved",
        },
        orderBy: { id: "desc" },
      })
    : null;
  const approvalPayload = approvalEvent?.payload as JsonObject | null | undefined;
  const preflightExecutionEligible = truthy(
    getPath(entries.settlementPreflight, ["executionPreflight", "executionEligibleNow"]),
  );
  const preflightDryRunPass = truthy(getPath(entries.settlementPreflight, ["executionPreflight", "dryRunPreviewPass"]));
  const reviewApprovalDigestMatches = truthy(
    getPath(entries.resultReviewTrail, ["checks", "approvalDigestMatchesPreflight"]),
  );
  const approvalDigestMatchesPreflight =
    reviewApprovalDigestMatches ||
    (typeof approvalPayload?.resultDigest === "string" &&
      approvalPayload.resultDigest === getPath(entries.settlementPreflight, ["settlement", "controls", "resultDigest"]));
  const executionEligibleNow =
    market?.status === "CLOSED" &&
    preflightExecutionEligible &&
    approvalDigestMatchesPreflight &&
    typeof approvalPayload?.confirm === "string";
  const blockers = [
    market ? null : "selected_market_missing",
    market?.event.slug === eventSlug ? null : "selected_market_event_slug_mismatch",
    preflightDryRunPass ? null : "settlement_preflight_dry_run_not_passing",
    approvalEvent ? null : "settlement_approval_event_missing",
    approvalDigestMatchesPreflight ? null : "approval_digest_does_not_match_preflight",
    market?.status === "CLOSED" ? null : `market_not_closed_for_execution:${String(market?.status ?? "unknown")}`,
    market?.resolvedOutcomeId ? "market_already_resolved" : null,
  ].filter((item): item is string => typeof item === "string");
  const checks = {
    selectedMarketFound: market != null,
    selectedMarketMatchesEvent: market?.event.slug === eventSlug,
    settlementPreflightPassed: entries.settlementPreflight?.pass === true,
    settlementPreflightDryRunPassed: preflightDryRunPass,
    settlementApprovalAuditEventFound: approvalEvent != null,
    resultReviewTrailPassed: entries.resultReviewTrail?.pass === true,
    approvalDigestMatchesPreflight,
    supervisorApprovedSettlementWaitProven:
      truthy(getPath(entries.supervisorApprovedSettlement, ["runtimeTruth", "supervisorApprovalModeWired"])) &&
      truthy(getPath(entries.supervisorApprovedSettlement, ["runtimeTruth", "activeMarketStillLiveSoNoExecution"])),
    activeEventCloneSettlementProofPassed: entries.activeSettlementClone?.pass === true,
    activeEventExecutionDecisionKnown: true,
    activeEventNotMutatedByReport: true,
    providerQuotaNotUsed: true,
  };
  const p0 = Object.entries(checks)
    .filter(([, value]) => value !== true)
    .map(([key]) => key);
  const operatorDecision = executionEligibleNow
    ? "eligible_for_exact_confirmation_execution"
    : blockers.some((blocker) => blocker.startsWith("market_not_closed_for_execution"))
      ? "wait_for_or_apply_market_close_before_execution"
      : "resolve_active_settlement_blockers_before_execution";

  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-active-event-settlement-readiness",
    pass: p0.length === 0,
    providerQuotaUsed: false,
    eventSlug,
    selectedMarketId,
    winningOutcomeId,
    activeMarket: market
      ? {
          id: market.id,
          slug: market.slug,
          title: market.title,
          status: market.status,
          settlementStatus: market.settlementStatus,
          resolvedOutcomeId: market.resolvedOutcomeId,
          event: {
            slug: market.event.slug,
            title: market.event.title,
            status: market.event.status,
            liveStatus: market.event.liveStatus,
            startTime: market.event.startTime?.toISOString() ?? null,
          },
        }
      : null,
    approvalEvidence: approvalEvent
      ? {
          id: approvalEvent.id.toString(),
          eventType: approvalEvent.eventType,
          marketId: approvalEvent.marketId,
          outcomeId: approvalEvent.outcomeId,
          createdAt: approvalEvent.createdAt.toISOString(),
          resultDigest: approvalPayload?.resultDigest ?? null,
          approvedBy: approvalPayload?.approvedBy ?? null,
          approvedAt: approvalPayload?.approvedAt ?? null,
          executionRequiresMarketStatus: approvalPayload?.executionRequiresMarketStatus ?? null,
          activeTesterSettlementExecution: approvalPayload?.activeTesterSettlementExecution ?? null,
        }
      : null,
    executionDecision: {
      executionEligibleNow,
      operatorDecision,
      blockers,
      exactConfirmationRequired: approvalPayload?.confirm ?? null,
      marketMustBeClosed: true,
      activeMarketExecutionAttempted: false,
    },
    sourceEvidence: PATHS,
    runtimeTruth: {
      activeEventSettlementExecutionDecisionKnown: true,
      activeEventCanExecuteNow: executionEligibleNow,
      activeEventSettlementExecutionAttempted: false,
      activeEventStillLive: market?.status === "LIVE",
      disposableCloneSettlementProven: entries.activeSettlementClone?.pass === true,
      supervisorApprovedSettlementWaitProven: checks.supervisorApprovedSettlementWaitProven,
      reportIsReadOnly: true,
      providerQuotaUsed: false,
    },
    checks,
    gaps: {
      p0,
      p1: [
        ...(executionEligibleNow
          ? []
          : ["Active tester event settlement remains blocked until the selected market is CLOSED and exact confirmation is used."]),
        "Installed unattended official-result polling remains future work.",
        "Production approval storage/operator UI remains future work.",
      ],
      p2: ["Multi-event settlement queue and lifecycle dashboard remain future work."],
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
