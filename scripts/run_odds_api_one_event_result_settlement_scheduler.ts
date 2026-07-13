import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { loadLocalEnvForScript } from "./local_env";

loadLocalEnvForScript(["DATABASE_URL"]);

const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";
const DEFAULT_RESULT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/trusted-result-fixture.redacted.json";
const DEFAULT_SETTLEMENT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-summary.redacted.json";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-run-summary.redacted.json";
const DEFAULT_APPROVAL_PATH =
  "docs/mobile/harness/odds-api-live-runtime/trusted-result-settlement-approval.redacted.json";

type TrustedResult = {
  status?: string | null;
  eventSlug?: string | null;
  source?: string | null;
  sourceEventId?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  recordedAt?: string | null;
};

type JsonObject = Record<string, unknown>;
type SettlementApproval = {
  approved?: boolean;
  eventSlug?: string | null;
  marketId?: string | null;
  outcomeId?: string | null;
  resultDigest?: string | null;
  confirm?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
};

type SettlementApprovalFile = SettlementApproval & {
  approvals?: SettlementApproval[];
};

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};
const hasFlag = (name: string) => process.argv.includes(`--${name}`);

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

function cleanOutput(value: string) {
  return value.split(/\r?\n/).filter(Boolean).slice(-20);
}

function isFinalStatus(status: unknown) {
  return ["final", "official"].includes(String(status ?? "").toLowerCase());
}

function getPath(source: unknown, keys: string[]) {
  let cursor = source;
  for (const key of keys) {
    if (!cursor || typeof cursor !== "object" || !(key in cursor)) return null;
    cursor = (cursor as JsonObject)[key];
  }
  return cursor;
}

function approvalsFromFile(source: SettlementApprovalFile | null) {
  if (!source) return [] as SettlementApproval[];
  if (Array.isArray(source.approvals)) return source.approvals;
  return [source];
}

function findApproval(params: {
  approvalFile: SettlementApprovalFile | null;
  eventSlug: string;
  marketId: string | null;
  outcomeId: string | null;
  resultDigest: string | null;
  confirm: string | null;
}) {
  return (
    approvalsFromFile(params.approvalFile).find((approval) =>
      approval.approved === true &&
      approval.eventSlug === params.eventSlug &&
      approval.marketId === params.marketId &&
      approval.outcomeId === params.outcomeId &&
      approval.resultDigest === params.resultDigest &&
      approval.confirm === params.confirm,
    ) ?? null
  );
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run local result settlement scheduler in production.");
  }

  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const resultPath = argValue("result") ?? argValue("resultPath") ?? DEFAULT_RESULT_PATH;
  const settlementOutputPath =
    argValue("settlementOutput") ?? DEFAULT_SETTLEMENT_OUTPUT_PATH;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const execute = hasFlag("execute");
  const autoExecuteApproved = hasFlag("autoExecuteApproved");
  const writeAuditEvent = hasFlag("writeAuditEvent");
  const confirm = argValue("confirm");
  const approvalPath = argValue("approval") ?? argValue("approvalPath") ?? DEFAULT_APPROVAL_PATH;
  const allowTrustedLocalFixture = hasFlag("allowTrustedLocalFixture");
  const result = await readJson<TrustedResult>(resultPath);
  const approvalFile = autoExecuteApproved ? await readJson<SettlementApprovalFile>(approvalPath) : null;
  const p0: string[] = [];
  const p1: string[] = [];
  const p2: string[] = [];
  let action:
    | "no_result_file"
    | "waiting_for_final_result"
    | "preview_settlement"
    | "execute_settlement"
    | "approved_waiting_for_closed_market"
    | "auto_execute_settlement" = "no_result_file";
  let commandResult: JsonObject | null = null;
  let previewCommandResult: JsonObject | null = null;
  let command: JsonObject | null = null;
  let previewCommand: JsonObject | null = null;
  let matchedApproval: SettlementApproval | null = null;

  if (!result) {
    action = "no_result_file";
  } else if (result.eventSlug !== eventSlug) {
    p0.push(`Trusted result eventSlug ${result.eventSlug ?? "missing"} does not match ${eventSlug}.`);
  } else if (!isFinalStatus(result.status)) {
    action = "waiting_for_final_result";
  } else if (execute && result.source === "trusted-local-fixture" && !allowTrustedLocalFixture) {
    p0.push("Execution from trusted-local-fixture requires --allowTrustedLocalFixture.");
  } else if (autoExecuteApproved && result.source === "trusted-local-fixture" && !allowTrustedLocalFixture) {
    p0.push("Approved auto-execution from trusted-local-fixture requires --allowTrustedLocalFixture.");
  } else {
    action = execute ? "execute_settlement" : "preview_settlement";
    const args = [
      path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs"),
      "scripts/settle_odds_api_one_event_from_result.ts",
      `--eventSlug=${eventSlug}`,
      `--result=${resultPath}`,
      `--output=${settlementOutputPath}`,
    ];
    if (execute) {
      args.push("--execute");
      if (confirm) args.push(`--confirm=${confirm}`);
    }
    if (writeAuditEvent) args.push("--writeAuditEvent");
    const executable = process.execPath;
    const run = spawnSync(executable, args, {
      cwd: process.cwd(),
      encoding: "utf8",
      env: process.env,
    });
    command = {
      executable,
      args,
      exitCode: run.status,
      stdoutTail: cleanOutput(run.stdout ?? ""),
      stderrTail: cleanOutput(run.stderr ?? ""),
    };
    commandResult = await readJson<JsonObject>(settlementOutputPath);
    if (!autoExecuteApproved && (run.status !== 0 || commandResult?.pass !== true)) {
      p0.push("Trusted result settlement command failed.");
    }
    if (autoExecuteApproved) {
      previewCommand = command;
      previewCommandResult = commandResult;
      if (run.status !== 0 || commandResult?.pass !== true) {
        p0.push("Trusted result settlement preflight command failed.");
      } else {
        const marketId = getPath(commandResult, ["selectedMarket", "id"]);
        const outcomeId = getPath(commandResult, ["winningOutcome", "id"]);
        const resultDigest = getPath(commandResult, ["controls", "resultDigest"]);
        const requiredConfirm = getPath(commandResult, ["controls", "executeRequiresConfirm"]);
        const currentMarketStatus = getPath(commandResult, ["controls", "currentMarketStatus"]);
        matchedApproval = findApproval({
          approvalFile,
          eventSlug,
          marketId: typeof marketId === "string" ? marketId : null,
          outcomeId: typeof outcomeId === "string" ? outcomeId : null,
          resultDigest: typeof resultDigest === "string" ? resultDigest : null,
          confirm: typeof requiredConfirm === "string" ? requiredConfirm : null,
        });
        if (!matchedApproval) {
          p0.push("No matching trusted-result settlement approval was found.");
        } else if (currentMarketStatus !== "CLOSED") {
          action = "approved_waiting_for_closed_market";
        } else {
          action = "auto_execute_settlement";
          const executeOutputPath = argValue("executeSettlementOutput") ?? settlementOutputPath;
          const executeArgs = [
            path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs"),
            "scripts/settle_odds_api_one_event_from_result.ts",
            `--eventSlug=${eventSlug}`,
            `--result=${resultPath}`,
            `--output=${executeOutputPath}`,
            "--execute",
            `--confirm=${requiredConfirm}`,
          ];
          if (writeAuditEvent) executeArgs.push("--writeAuditEvent");
          const executeRun = spawnSync(executable, executeArgs, {
            cwd: process.cwd(),
            encoding: "utf8",
            env: process.env,
          });
          command = {
            executable,
            args: executeArgs,
            exitCode: executeRun.status,
            stdoutTail: cleanOutput(executeRun.stdout ?? ""),
            stderrTail: cleanOutput(executeRun.stderr ?? ""),
          };
          commandResult = await readJson<JsonObject>(executeOutputPath);
          if (executeRun.status !== 0 || commandResult?.pass !== true || commandResult?.mode !== "execute") {
            p0.push("Approved trusted result settlement execution failed.");
          }
        }
      }
    }
  }

  p1.push(
    "This scheduler consumes trusted result JSON; provider-shaped result ingestion is available as a separate explicit step.",
  );
  p1.push("Dry-run preview is the default; execution requires either explicit confirmation or an exact local approval file.");
  p2.push("Multi-event result queue and operator UI remain future work.");

  const pass =
    p0.length === 0 &&
    (action === "no_result_file" ||
      action === "waiting_for_final_result" ||
      action === "approved_waiting_for_closed_market" ||
      (commandResult?.pass === true &&
        commandResult?.mode === (action === "auto_execute_settlement" || execute ? "execute" : "dry-run")));

  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-one-event-result-settlement-scheduler-run",
    pass,
    eventSlug,
    resultInput: result
      ? {
          path: resultPath,
          source: result.source ?? null,
          sourceEventId: result.sourceEventId ?? null,
          eventSlug: result.eventSlug ?? null,
          status: result.status ?? null,
          homeScore: result.homeScore ?? null,
          awayScore: result.awayScore ?? null,
          recordedAt: result.recordedAt ?? null,
        }
      : null,
    action,
    executionRequested: execute,
    autoExecuteApproved,
    approval: autoExecuteApproved
      ? {
          path: approvalPath,
          matched: matchedApproval
            ? {
                eventSlug: matchedApproval.eventSlug ?? null,
                marketId: matchedApproval.marketId ?? null,
                outcomeId: matchedApproval.outcomeId ?? null,
                resultDigest: matchedApproval.resultDigest ?? null,
                approvedBy: matchedApproval.approvedBy ?? null,
                approvedAt: matchedApproval.approvedAt ?? null,
              }
            : null,
        }
      : null,
    providerStatus:
      result?.source === "trusted-local-fixture"
        ? "fixture_only"
        : result
          ? "trusted_external_input"
          : "missing",
    command,
    previewCommand,
    settlementSummaryPath: settlementOutputPath,
    previewSettlementDigest: previewCommandResult
      ? {
          pass: previewCommandResult.pass,
          mode: previewCommandResult.mode,
          selectedMarket: previewCommandResult.selectedMarket ?? null,
          winningOutcome: previewCommandResult.winningOutcome ?? null,
          controls: previewCommandResult.controls ?? null,
        }
      : null,
    settlementDigest: commandResult
      ? {
          pass: commandResult.pass,
          mode: commandResult.mode,
          selectedMarket: commandResult.selectedMarket ?? null,
          winningOutcome: commandResult.winningOutcome ?? null,
          preview: commandResult.preview ?? null,
          execution: commandResult.execution ?? null,
          controls: commandResult.controls ?? null,
        }
      : null,
    runtimeTruth: {
      canRunFromSupervisorOrCron: true,
      providerResultIngestionAvailable: true,
      unattendedResultPollingInstalled: false,
      dryRunDefault: true,
      executeRequiresConfirmation: true,
      autoExecuteRequiresApprovalFile: true,
      autoExecuteRequiresClosedMarket: true,
      fakeTokenOnly: true,
    },
    gaps: {
      p0,
      p1,
      p2,
    },
  };

  await writeJson(outputPath, summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!pass) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
