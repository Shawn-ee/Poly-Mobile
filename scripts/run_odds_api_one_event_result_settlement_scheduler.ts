import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";
const DEFAULT_RESULT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/trusted-result-fixture.redacted.json";
const DEFAULT_SETTLEMENT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-summary.redacted.json";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-run-summary.redacted.json";

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
  const confirm = argValue("confirm");
  const allowTrustedLocalFixture = hasFlag("allowTrustedLocalFixture");
  const result = await readJson<TrustedResult>(resultPath);
  const p0: string[] = [];
  const p1: string[] = [];
  const p2: string[] = [];
  let action:
    | "no_result_file"
    | "waiting_for_final_result"
    | "preview_settlement"
    | "execute_settlement" = "no_result_file";
  let commandResult: JsonObject | null = null;
  let command: JsonObject | null = null;

  if (!result) {
    action = "no_result_file";
  } else if (result.eventSlug !== eventSlug) {
    p0.push(`Trusted result eventSlug ${result.eventSlug ?? "missing"} does not match ${eventSlug}.`);
  } else if (!isFinalStatus(result.status)) {
    action = "waiting_for_final_result";
  } else if (execute && result.source === "trusted-local-fixture" && !allowTrustedLocalFixture) {
    p0.push("Execution from trusted-local-fixture requires --allowTrustedLocalFixture.");
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
    if (run.status !== 0 || commandResult?.pass !== true) {
      p0.push("Trusted result settlement command failed.");
    }
  }

  p1.push("This scheduler consumes trusted local result JSON; official soccer result API ingestion is still not wired.");
  p1.push("Dry-run preview is the default; execution still requires explicit confirmation.");
  p2.push("Multi-event result queue and operator UI remain future work.");

  const pass =
    p0.length === 0 &&
    (action === "no_result_file" ||
      action === "waiting_for_final_result" ||
      (commandResult?.pass === true && commandResult?.mode === (execute ? "execute" : "dry-run")));

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
    providerStatus:
      result?.source === "trusted-local-fixture"
        ? "fixture_only"
        : result
          ? "trusted_external_input"
          : "missing",
    command,
    settlementSummaryPath: settlementOutputPath,
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
      officialResultProviderApiWired: false,
      dryRunDefault: true,
      executeRequiresConfirmation: true,
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
