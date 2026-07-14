import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { loadLocalEnvForScript } from "./local_env";

loadLocalEnvForScript(["DATABASE_URL"]);

import { prisma } from "@/lib/db";

const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";
const DEFAULT_RESULT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/trusted-result-provider.redacted.json";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-closed-eligibility-summary.redacted.json";
const DEFAULT_DRY_RUN_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-closed-eligibility-dry-run.redacted.json";

type JsonObject = Record<string, any>;

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

async function readJson<T>(filePath: string): Promise<T | null> {
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
  return value.split(/\r?\n/).filter(Boolean).slice(-24);
}

function runTrustedResultDryRun(args: string[]) {
  const executable = process.execPath;
  const commandArgs = [
    path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs"),
    "scripts/settle_odds_api_one_event_from_result.ts",
    ...args,
  ];
  const run = spawnSync(executable, commandArgs, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
  });
  return {
    executable,
    args: commandArgs,
    exitCode: run.status,
    stdoutTail: cleanOutput(run.stdout ?? ""),
    stderrTail: cleanOutput(run.stderr ?? ""),
  };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run active-event closed settlement eligibility proof in production.");
  }

  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const resultPath = argValue("result") ?? argValue("resultPath") ?? DEFAULT_RESULT_PATH;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const dryRunOutput = argValue("dryRunOutput") ?? DEFAULT_DRY_RUN_OUTPUT_PATH;

  const readiness = await readJson<JsonObject>(
    "docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-readiness-summary.redacted.json",
  );
  const selectedMarketId = argValue("marketId") ?? (getPath(readiness, ["selectedMarketId"]) as string | null);
  if (!selectedMarketId) throw new Error("No active selected market id was found for closed eligibility proof.");

  const before = await prisma.market.findUniqueOrThrow({
    where: { id: selectedMarketId },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      settlementStatus: true,
      resolvedOutcomeId: true,
      closeTime: true,
      event: { select: { slug: true, title: true } },
    },
  });
  if (before.event.slug !== eventSlug) {
    throw new Error(`Selected market event ${before.event.slug} does not match ${eventSlug}.`);
  }
  if (before.resolvedOutcomeId) {
    throw new Error("Refusing to run proof on an already resolved active selected market.");
  }

  let dryRun: JsonObject | null = null;
  let runResult: ReturnType<typeof runTrustedResultDryRun> | null = null;
  let restored = false;
  let afterRestore:
    | {
        status: string;
        settlementStatus: string | null;
        resolvedOutcomeId: string | null;
        closeTime: string | null;
      }
    | null = null;

  try {
    await prisma.market.update({
      where: { id: selectedMarketId },
      data: {
        status: "CLOSED",
        settlementStatus: "closed_for_active_settlement_eligibility_proof",
        closeTime: new Date(),
      },
    });

    runResult = runTrustedResultDryRun([
      `--eventSlug=${eventSlug}`,
      `--marketId=${selectedMarketId}`,
      `--result=${resultPath}`,
      `--output=${dryRunOutput}`,
      "--writeAuditEvent",
    ]);
    dryRun = await readJson<JsonObject>(dryRunOutput);
  } finally {
    await prisma.market.update({
      where: { id: selectedMarketId },
      data: {
        status: before.status,
        settlementStatus: before.settlementStatus,
        resolvedOutcomeId: before.resolvedOutcomeId,
        closeTime: before.closeTime,
      },
    });
    restored = true;
    const restoredMarket = await prisma.market.findUniqueOrThrow({
      where: { id: selectedMarketId },
      select: {
        status: true,
        settlementStatus: true,
        resolvedOutcomeId: true,
        closeTime: true,
      },
    });
    afterRestore = {
      status: restoredMarket.status,
      settlementStatus: restoredMarket.settlementStatus,
      resolvedOutcomeId: restoredMarket.resolvedOutcomeId,
      closeTime: restoredMarket.closeTime?.toISOString() ?? null,
    };
  }

  const requiredConfirm = getPath(dryRun, ["controls", "executeRequiresConfirm"]);
  const resultDigest = getPath(dryRun, ["controls", "resultDigest"]);
  const winningOutcomeId = getPath(dryRun, ["winningOutcome", "id"]) as string | null;
  const approvalEvent = await prisma.canonicalEvent.findFirst({
    where: {
      stream: "MARKET",
      marketId: selectedMarketId,
      outcomeId: winningOutcomeId ?? undefined,
      eventType: "settlement.trusted_result.approved",
    },
    orderBy: { id: "desc" },
  });
  const approvalPayload = approvalEvent?.payload as JsonObject | null | undefined;

  const checks = {
    dryRunCommandPassed: runResult?.exitCode === 0,
    dryRunSummaryPassed: dryRun?.pass === true,
    activeMarketWasTemporarilyClosed: getPath(dryRun, ["selectedMarket", "statusBefore"]) === "CLOSED",
    dryRunDidNotExecuteSettlement: getPath(dryRun, ["execution", "attempted"]) === false,
    dryRunPreviewConservationPassed: getPath(dryRun, ["preview", "payoutConservationPass"]) === true,
    exactConfirmationKnown: typeof requiredConfirm === "string" && requiredConfirm.startsWith("SETTLE_FROM_RESULT:"),
    approvalEventFound: approvalEvent != null,
    approvalDigestMatchesDryRun: typeof resultDigest === "string" && approvalPayload?.resultDigest === resultDigest,
    approvalConfirmMatchesDryRun: typeof requiredConfirm === "string" && approvalPayload?.confirm === requiredConfirm,
    restoredOriginalStatus: afterRestore?.status === before.status,
    restoredOriginalSettlementStatus: afterRestore?.settlementStatus === before.settlementStatus,
    activeMarketStillUnresolved: afterRestore?.resolvedOutcomeId === before.resolvedOutcomeId && before.resolvedOutcomeId == null,
  };
  const p0 = Object.entries(checks)
    .filter(([, value]) => value !== true)
    .map(([key]) => key);
  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-active-event-closed-settlement-eligibility-proof",
    pass: p0.length === 0,
    providerQuotaUsed: false,
    eventSlug,
    selectedMarket: {
      id: before.id,
      slug: before.slug,
      title: before.title,
      eventTitle: before.event.title,
      statusBeforeProof: before.status,
      settlementStatusBeforeProof: before.settlementStatus,
      restored,
      afterRestore,
    },
    closedStateDecision: {
      dryRunOutput,
      winningOutcomeId,
      resultDigest,
      exactConfirmationRequired: requiredConfirm,
      operatorDecisionWhenClosed:
        p0.length === 0 ? "eligible_for_exact_confirmation_execution_after_market_close" : "not_eligible",
      executionAttempted: false,
    },
    approvalEvidence: approvalEvent
      ? {
          id: approvalEvent.id.toString(),
          eventType: approvalEvent.eventType,
          marketId: approvalEvent.marketId,
          outcomeId: approvalEvent.outcomeId,
          resultDigest: approvalPayload?.resultDigest ?? null,
          exactConfirmationStored: typeof approvalPayload?.confirm === "string",
        }
      : null,
    run: runResult,
    runtimeTruth: {
      provesActiveEventClosedStateEligibility: p0.length === 0,
      activeEventSettlementExecuted: false,
      activeMarketRestored: restored && afterRestore?.status === before.status,
      providerQuotaUsed: false,
      exactApprovalStillRequiredForExecution: true,
    },
    checks,
    gaps: {
      p0,
      p1: [
        "This proves active-event closed-state eligibility, not unattended official-result polling.",
        "The active tester market is restored after proof; actual execution still requires market CLOSED plus exact operator confirmation.",
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
    await prisma.$disconnect();
  });
