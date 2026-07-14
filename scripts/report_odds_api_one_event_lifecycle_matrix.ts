import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { loadLocalEnvForScript } from "./local_env";

const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-matrix-summary.redacted.json";

const PATHS = {
  lifecycleControls: "docs/mobile/harness/odds-api-live-runtime/event-lifecycle-controls-summary.redacted.json",
  lifecycleScheduler: "docs/mobile/harness/odds-api-live-runtime/event-lifecycle-scheduler-summary.redacted.json",
  lifecycleSchedulerRun:
    "docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-scheduler-run-summary.redacted.json",
  settlementExecution: "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-execution-summary.redacted.json",
  trustedResultSettlementExecution:
    "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-scheduler-execution-summary.redacted.json",
  reviewTrail: "docs/mobile/harness/odds-api-live-runtime/one-event-result-review-trail-summary.redacted.json",
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

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run local lifecycle matrix report in production.");
  }

  const envLoad = loadLocalEnvForScript(["DATABASE_URL"]);
  if (envLoad.missingKeys.includes("DATABASE_URL")) {
    throw new Error(
      "DATABASE_URL is required for the lifecycle matrix. Set DATABASE_URL, set DOTENV_CONFIG_PATH, or run from a workspace with a local .env.",
    );
  }

  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const entries = Object.fromEntries(
    await Promise.all(Object.entries(PATHS).map(async ([key, filePath]) => [key, await readJson(filePath)])),
  ) as Record<keyof typeof PATHS, JsonObject | null>;

  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    select: {
      id: true,
      slug: true,
      title: true,
      startTime: true,
      status: true,
      liveStatus: true,
      markets: {
        where: { isListed: true, referenceSource: "sportsbook-odds" },
        select: { id: true, status: true, resolvedOutcomeId: true, settlementStatus: true },
      },
    },
  });

  const openProven =
    getPath(entries.lifecycleControls, ["checks", "liveOrderAccepted"]) === true &&
    getPath(entries.lifecycleControls, ["lifecycle", "open", "marketStatus"]) === "LIVE";
  const pausedProven =
    getPath(entries.lifecycleControls, ["checks", "pausedOrderRejected"]) === true &&
    getPath(entries.lifecycleControls, ["lifecycle", "paused", "marketStatus"]) === "PAUSED";
  const closedProven =
    getPath(entries.lifecycleControls, ["checks", "closedOrderRejected"]) === true &&
    getPath(entries.lifecycleScheduler, ["checks", "closeAfterStart"]) === true;
  const settlementPreviewProven =
    getPath(entries.lifecycleControls, ["checks", "settlementPreviewNonMutating"]) === true &&
    getPath(entries.lifecycleControls, ["lifecycle", "settlementPreview", "payoutConservationPass"]) === true;
  const settlementMechanicsProven =
    getPath(entries.settlementExecution, ["checks", "settlementExecuted"]) === true &&
    getPath(entries.settlementExecution, ["checks", "payoutConservationPass"]) === true &&
    getPath(entries.settlementExecution, ["checks", "positionsFinalizedPass"]) === true;
  const trustedSchedulerSettlementProven =
    getPath(entries.trustedResultSettlementExecution, ["checks", "liveMarketExecutionBlocked"]) === true &&
    getPath(entries.trustedResultSettlementExecution, ["checks", "executeSchedulerPassed"]) === true &&
    getPath(entries.trustedResultSettlementExecution, ["checks", "disposableMarketResolved"]) === true &&
    getPath(entries.trustedResultSettlementExecution, ["checks", "targetTesterEventNotMutated"]) === true;
  const activeEventReviewProven =
    getPath(entries.reviewTrail, ["checks", "providerResultAuditEventFound"]) === true &&
    getPath(entries.reviewTrail, ["checks", "settlementPreflightAuditEventFound"]) === true &&
    getPath(entries.reviewTrail, ["runtimeTruth", "activeTesterSettlementExecution"]) === false;

  const checks = {
    eventFound: event != null,
    openStateProven: openProven,
    pausedStateProven: pausedProven,
    closedStateProven: closedProven,
    settlementPreviewProven,
    settlementMechanicsProvenOnDisposableMarket: settlementMechanicsProven,
    trustedResultSchedulerSettlementProvenOnDisposableMarket: trustedSchedulerSettlementProven,
    activeEventReviewTrailProven: activeEventReviewProven,
    activeEventNotSettledByMatrix: true,
    reportIsReadOnly: true,
    providerQuotaNotUsed: true,
  };
  const warnings = [
    getPath(entries.lifecycleControls, ["selectedMarket", "title"]) &&
    event?.title &&
    !String(getPath(entries.lifecycleControls, ["selectedMarket", "title"])).includes(event.title)
      ? "lifecycle_controls_selected_market_title_does_not_match_current_event_title"
      : null,
  ].filter(Boolean);
  const p0 = Object.entries(checks)
    .filter(([, value]) => value !== true)
    .map(([key]) => key);

  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-one-event-lifecycle-matrix",
    pass: p0.length === 0,
    providerQuotaUsed: false,
    event: event
      ? {
          id: event.id,
          slug: event.slug,
          title: event.title,
          startTime: event.startTime?.toISOString() ?? null,
          status: event.status,
          liveStatus: event.liveStatus,
          listedSportsbookMarketCount: event.markets.length,
          currentMarketStatuses: Array.from(new Set(event.markets.map((market) => market.status))).sort(),
          resolvedMarketCount: event.markets.filter((market) => market.resolvedOutcomeId).length,
        }
      : null,
    lifecycleMatrix: {
      open: {
        proven: openProven,
        evidence: PATHS.lifecycleControls,
        userImpact: "LIVE market accepts fake-token orders.",
      },
      suspendedPaused: {
        proven: pausedProven,
        evidence: [PATHS.lifecycleControls, PATHS.lifecycleScheduler],
        userImpact: "PAUSED market rejects orders with MARKET_UNAVAILABLE.",
      },
      closed: {
        proven: closedProven,
        evidence: [PATHS.lifecycleControls, PATHS.lifecycleScheduler, PATHS.lifecycleSchedulerRun],
        userImpact: "CLOSED market rejects orders and lifecycle scheduler can close after start.",
      },
      settledResolved: {
        proven: settlementPreviewProven && settlementMechanicsProven && trustedSchedulerSettlementProven,
        evidence: [PATHS.settlementExecution, PATHS.trustedResultSettlementExecution, PATHS.reviewTrail],
        userImpact:
          "Settlement mechanics and trusted-result scheduler execution are proven on disposable local markets; active tester event still waits for CLOSED status plus operator confirmation.",
      },
    },
    runtimeTruth: {
      readOnlyReport: true,
      activeTesterEventSettlementExecuted: false,
      activeTesterEventReviewTrailExists: activeEventReviewProven,
      disposableSettlementExecutionProven: settlementMechanicsProven && trustedSchedulerSettlementProven,
      automaticOfficialResultSettlementInstalled: false,
      providerQuotaUsed: false,
      lifecycleControlsArtifactHasEventTitleWarning: warnings.length > 0,
    },
    checks,
    gaps: {
      p0,
      p1: [
        "The active tester event remains unexecuted until CLOSED status and exact operator confirmation.",
        "Official-result polling and production service ownership are still not installed.",
        ...warnings,
      ],
      p2: ["A first-class lifecycle dashboard/operator UI remains future work."],
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
