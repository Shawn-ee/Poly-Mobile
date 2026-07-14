import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/internal-tester-readiness-gate-summary.redacted.json";

const STAGES = [
  {
    id: "ordered-live-runtime-audit",
    command: ["npm", "run", "mobile:live-runtime-audit-gate"],
    summaryPath: "docs/mobile/harness/odds-api-live-runtime/live-runtime-audit-gate-summary.redacted.json",
  },
  {
    id: "operator-snapshot",
    command: ["npm", "run", "mobile:internal-tester-operator-snapshot"],
    summaryPath: "docs/mobile/harness/odds-api-live-runtime/internal-tester-operator-snapshot.redacted.json",
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

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
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
    throw new Error("Refusing to run local internal tester readiness gate in production.");
  }

  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const stages = [];
  for (const stage of STAGES) {
    const result = runStage(stage);
    stages.push(result);
    if (!result.pass) break;
  }

  const auditGate = await readJson(STAGES[0].summaryPath);
  const operatorSnapshot = await readJson(STAGES[1].summaryPath);
  const p0 = [
    ...stringArray(getPath(auditGate, ["gaps", "p0"])),
    ...stringArray(getPath(operatorSnapshot, ["gaps", "p0"])),
  ];
  const p1 = [
    ...stringArray(getPath(auditGate, ["gaps", "p1"])),
    ...stringArray(getPath(operatorSnapshot, ["gaps", "p1"])),
  ];
  const p2 = [
    ...stringArray(getPath(auditGate, ["gaps", "p2"])),
    ...stringArray(getPath(operatorSnapshot, ["gaps", "p2"])),
  ];

  const pass =
    stages.length === STAGES.length &&
    stages.every((stage) => stage.pass) &&
    auditGate?.pass === true &&
    operatorSnapshot?.pass === true &&
    p0.length === 0;

  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "holiwyn-internal-tester-readiness-gate",
    pass,
    providerQuotaUsedByThisGate: false,
    orderInvariant: {
      requiredOrder: STAGES.map((stage) => stage.id),
      reason:
        "Refresh the ordered runtime audit before generating the tester-facing operator snapshot so tester instructions are based on current backend/runtime evidence.",
    },
    stages,
    testerReady: {
      event: getPath(operatorSnapshot, ["event"]) ?? null,
      selectedMarket: getPath(operatorSnapshot, ["selectedMarket"]) ?? null,
      recommendedFirstAction: getPath(operatorSnapshot, ["operatorNextActions", "recommendedFirstAction"]) ?? null,
      recommendedCommand: getPath(operatorSnapshot, ["operatorNextActions", "recommendedCommand"]) ?? null,
      localTesterReadyRightNow: getPath(operatorSnapshot, ["runtime", "localTesterReadyRightNow"]) === true,
      warmNoQuotaRuntime: getPath(operatorSnapshot, ["runtime", "currentRuntimeState", "warmNoQuotaRuntime"]) === true,
      allLoopsRunning: getPath(operatorSnapshot, ["runtime", "currentRuntimeState", "allLoopsRunning"]) === true,
      quotaSpendingLoopRunning:
        getPath(operatorSnapshot, ["runtime", "currentRuntimeState", "quotaSpendingLoopRunning"]) === true,
      providerSnapshotFresh: getPath(operatorSnapshot, ["runtime", "currentRuntimeState", "providerSnapshotFresh"]) === true,
      nextAction: getPath(operatorSnapshot, ["runtime", "currentRuntimeState", "nextAction"]) ?? null,
      launchChecklist: getPath(operatorSnapshot, ["testerLaunchChecklist", "launch"]) ?? [],
      manualTradingFlow: getPath(operatorSnapshot, ["testerLaunchChecklist", "manualTradingFlow"]) ?? [],
      lifecycleChecks: getPath(operatorSnapshot, ["testerLaunchChecklist", "lifecycleChecks"]) ?? [],
    },
    evidence: {
      auditGate: STAGES[0].summaryPath,
      operatorSnapshot: STAGES[1].summaryPath,
    },
    checks: {
      orderedAuditGatePass: auditGate?.pass === true,
      operatorSnapshotPass: operatorSnapshot?.pass === true,
      noOpenP0: p0.length === 0,
      hasRecommendedCommand: typeof getPath(operatorSnapshot, ["operatorNextActions", "recommendedCommand"]) === "string",
      hasManualTradingFlow: Array.isArray(getPath(operatorSnapshot, ["testerLaunchChecklist", "manualTradingFlow"])),
    },
    gaps: { p0, p1: Array.from(new Set(p1)), p2: Array.from(new Set(p2)) },
    note:
      "No-quota internal tester readiness gate. It does not call providers, start loops, execute settlement, or read secrets. It only refreshes existing local audit evidence and emits a tester-facing summary.",
  };

  await writeJson(outputPath, summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.pass) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
