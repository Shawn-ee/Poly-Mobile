import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/live-runtime-audit-gate-summary.redacted.json";

const STAGES = [
  {
    id: "runtime-status",
    command: ["npm", "run", "mobile:one-event-runtime-status"],
    summaryPath: "docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json",
  },
  {
    id: "phase-audit",
    command: ["npm", "run", "mobile:one-event-phase-audit"],
    summaryPath: "docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json",
  },
  {
    id: "completion-audit",
    command: ["npm", "run", "mobile:live-runtime-completion-audit"],
    summaryPath: "docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json",
  },
] as const;

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

function runStage(stage: (typeof STAGES)[number]) {
  const startedAt = new Date().toISOString();
  const executable = process.platform === "win32" ? "cmd" : stage.command[0];
  const args = process.platform === "win32" ? ["/c", ...stage.command] : stage.command.slice(1);
  const result = spawnSync(executable, args, {
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
    stdio: "pipe",
  });
  const finishedAt = new Date().toISOString();
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return {
    id: stage.id,
    command: stage.command.join(" "),
    summaryPath: stage.summaryPath,
    startedAt,
    finishedAt,
    exitCode: result.status ?? 1,
    pass: result.status === 0,
    providerQuotaUsedByStage: false,
  };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run local live-runtime audit gate in production.");
  }

  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const stages = [];
  for (const stage of STAGES) {
    const result = runStage(stage);
    stages.push(result);
    if (!result.pass) break;
  }

  const runtimeStatus = await readJson(STAGES[0].summaryPath);
  const phaseAudit = await readJson(STAGES[1].summaryPath);
  const completionAudit = await readJson(STAGES[2].summaryPath);
  const openP0 = [
    ...(Array.isArray(getPath(runtimeStatus, ["gaps", "p0"])) ? (getPath(runtimeStatus, ["gaps", "p0"]) as unknown[]) : []),
    ...(Array.isArray(getPath(phaseAudit, ["conclusion", "openP0"])) ? (getPath(phaseAudit, ["conclusion", "openP0"]) as unknown[]) : []),
    ...(Array.isArray(getPath(completionAudit, ["gaps", "p0"])) ? (getPath(completionAudit, ["gaps", "p0"]) as unknown[]) : []),
  ].filter((item): item is string => typeof item === "string");
  const pass =
    stages.length === STAGES.length &&
    stages.every((stage) => stage.pass) &&
    runtimeStatus?.pass === true &&
    phaseAudit?.pass === true &&
    completionAudit?.pass === true &&
    openP0.length === 0;

  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "holiwyn-live-runtime-ordered-audit-gate",
    pass,
    providerQuotaUsedByThisGate: false,
    orderInvariant: {
      requiredOrder: STAGES.map((stage) => stage.id),
      reason:
        "Runtime status must be refreshed before phase audit, and phase audit must be refreshed before completion audit, so downstream summaries cannot read stale failed artifacts.",
    },
    stages,
    evidence: {
      runtimeStatus: STAGES[0].summaryPath,
      phaseAudit: STAGES[1].summaryPath,
      completionAudit: STAGES[2].summaryPath,
    },
    checks: {
      allStagesRan: stages.length === STAGES.length,
      runtimeStatusPass: runtimeStatus?.pass === true,
      phaseAuditPass: phaseAudit?.pass === true,
      completionAuditPass: completionAudit?.pass === true,
      noOpenP0: openP0.length === 0,
    },
    gaps: {
      p0: openP0,
      p1: [
        "Installed unattended provider/maker/lifecycle service ownership remains open.",
        "Production official-result auto-settlement remains open; active-event execution is still guarded by CLOSED market status and exact confirmation.",
      ],
      p2: ["Multi-event provider polling and production dashboard/operator UI remain future work."],
    },
  };
  await writeJson(outputPath, summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.pass) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
