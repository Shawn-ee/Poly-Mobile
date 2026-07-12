import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";
const DEFAULT_RESULT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/trusted-result-provider.redacted.json";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-preflight-summary.redacted.json";
const DEFAULT_SCHEDULER_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-preflight-scheduler.redacted.json";
const DEFAULT_SETTLEMENT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-preflight-dry-run.redacted.json";

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

function cleanOutput(value: string) {
  return value.split(/\r?\n/).filter(Boolean).slice(-20);
}

function isFinalStatus(status: unknown) {
  return ["final", "official"].includes(String(status ?? "").toLowerCase());
}

function runScheduler(params: {
  eventSlug: string;
  resultPath: string;
  schedulerOutputPath: string;
  settlementOutputPath: string;
}) {
  const executable = process.execPath;
  const args = [
    path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs"),
    "scripts/run_odds_api_one_event_result_settlement_scheduler.ts",
    `--eventSlug=${params.eventSlug}`,
    `--result=${params.resultPath}`,
    `--output=${params.schedulerOutputPath}`,
    `--settlementOutput=${params.settlementOutputPath}`,
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
    throw new Error("Refusing to run local settlement preflight in production.");
  }

  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const resultPath = argValue("result") ?? argValue("resultPath") ?? DEFAULT_RESULT_PATH;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const schedulerOutputPath = argValue("schedulerOutput") ?? DEFAULT_SCHEDULER_OUTPUT_PATH;
  const settlementOutputPath = argValue("settlementOutput") ?? DEFAULT_SETTLEMENT_OUTPUT_PATH;
  const result = await readJson(resultPath);
  const command = runScheduler({ eventSlug, resultPath, schedulerOutputPath, settlementOutputPath });
  const schedulerSummary = await readJson(schedulerOutputPath);
  const settlementSummary = await readJson(settlementOutputPath);
  const marketStatus = getPath(settlementSummary, ["selectedMarket", "statusBefore"]);
  const confirmationPhrase = getPath(settlementSummary, ["controls", "executeRequiresConfirm"]);
  const resultIsFinal = isFinalStatus(getPath(schedulerSummary, ["resultInput", "status"]));
  const dryRunPreviewPass =
    command.exitCode === 0 &&
    schedulerSummary?.pass === true &&
    settlementSummary?.pass === true &&
    getPath(settlementSummary, ["preview", "mutation"]) === "none" &&
    getPath(settlementSummary, ["preview", "payoutConservationPass"]) === true;
  const executionEligibleNow =
    dryRunPreviewPass &&
    resultIsFinal &&
    marketStatus === "CLOSED" &&
    typeof confirmationPhrase === "string" &&
    confirmationPhrase.startsWith("SETTLE_FROM_RESULT:");

  const blockers = [
    result ? null : "trusted_result_file_missing",
    result && getPath(result, ["eventSlug"]) !== eventSlug ? "trusted_result_event_slug_mismatch" : null,
    result && !resultIsFinal ? "trusted_result_not_final" : null,
    !dryRunPreviewPass ? "settlement_dry_run_not_passing" : null,
    dryRunPreviewPass && marketStatus !== "CLOSED"
      ? `market_not_closed_for_execution:${String(marketStatus ?? "unknown")}`
      : null,
    dryRunPreviewPass && typeof confirmationPhrase !== "string"
      ? "missing_execution_confirmation_phrase"
      : null,
  ].filter((item): item is string => typeof item === "string");

  const p0 = [
    result ? null : "trusted_result_file_missing",
    command.exitCode === 0 ? null : "settlement_scheduler_dry_run_failed",
    dryRunPreviewPass ? null : "settlement_preview_failed",
  ].filter((item): item is string => typeof item === "string");

  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-one-event-settlement-preflight",
    pass: p0.length === 0,
    eventSlug,
    providerQuotaUsed: false,
    resultInput: result
      ? {
          path: resultPath,
          source: getPath(result, ["source"]),
          sourceEventId: getPath(result, ["sourceEventId"]),
          eventSlug: getPath(result, ["eventSlug"]),
          status: getPath(result, ["status"]),
          recordedAt: getPath(result, ["recordedAt"]),
        }
      : null,
    scheduler: {
      command,
      summaryPath: schedulerOutputPath,
      action: getPath(schedulerSummary, ["action"]),
      pass: schedulerSummary?.pass ?? null,
    },
    settlement: {
      summaryPath: settlementOutputPath,
      pass: settlementSummary?.pass ?? null,
      selectedMarket: getPath(settlementSummary, ["selectedMarket"]),
      winningOutcome: getPath(settlementSummary, ["winningOutcome"]),
      preview: getPath(settlementSummary, ["preview"]),
      controls: getPath(settlementSummary, ["controls"]),
    },
    executionPreflight: {
      resultIsFinal,
      marketStatus,
      dryRunPreviewPass,
      executionEligibleNow,
      executionRequiresMarketStatus: "CLOSED",
      executeRequiresConfirmation: confirmationPhrase ?? null,
      blockers,
      nextOperatorAction: executionEligibleNow
        ? "review_confirmation_and_execute_if_trusted"
        : blockers.includes(`market_not_closed_for_execution:${String(marketStatus ?? "unknown")}`)
          ? "wait_for_or_apply_market_close_before_execution"
          : "resolve_preflight_blockers_before_execution",
    },
    runtimeTruth: {
      noProviderQuota: true,
      dryRunOnly: true,
      activeTesterEventMutated: false,
      executionRequiresClosedMarket: true,
      executionRequiresExactConfirmation: true,
    },
    gaps: {
      p0,
      p1: [
        ...(executionEligibleNow ? [] : ["Active one-event settlement execution is not currently eligible; see preflight blockers."]),
        "Unattended official-result polling remains future work.",
        "Execution remains operator-confirmed rather than automatic.",
      ],
      p2: ["Operator settlement UI and multi-event settlement queue remain future work."],
    },
  };

  await writeJson(outputPath, summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.pass) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
