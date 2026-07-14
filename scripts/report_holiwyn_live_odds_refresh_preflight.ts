import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/live-odds-refresh-preflight-summary.redacted.json";
const READINESS_PATH =
  "docs/mobile/harness/odds-api-live-runtime/internal-tester-readiness-gate-summary.redacted.json";
const RUNTIME_STATUS_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json";
const AUDIT_GATE_PATH =
  "docs/mobile/harness/odds-api-live-runtime/live-runtime-audit-gate-summary.redacted.json";
const LIVE_ODDS_REFRESH_COMMAND = "npm run mobile:one-event-live-runtime:provider-secret";
const LIVE_ODDS_SECRET_PREFLIGHT_COMMAND = "npm run mobile:one-event-live-runtime:provider-secret-preflight";
const LIVE_ODDS_SECRET_REFRESH_COMMAND = "npm run mobile:one-event-live-runtime:provider-secret";
const PROVIDER_SECRET_FILE_PATH = ".runtime/secrets/the-odds-api-key.txt";
const PROVIDER_KEY_ENV_NAME = ["THE", "ODDS", "API", "KEY"].join("_");
const LIVE_RUNTIME_SCOPE = "holiwyn-live-odds-refresh-preflight";

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

async function fileHasNonWhitespaceValue(filePath: string) {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile() || stat.size <= 0) return false;
    const value = await fs.readFile(filePath, "utf8");
    return value.trim().length > 0;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
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

function compactAction(action: unknown) {
  if (!action || typeof action !== "object" || Array.isArray(action)) return null;
  return {
    id: getPath(action, ["id"]),
    command: getPath(action, ["command"]),
    requiresProviderKey: getPath(action, ["requiresProviderKey"]) === true,
    spendsProviderQuota: getPath(action, ["spendsProviderQuota"]) === true,
  };
}

function findLiveAction(readiness: JsonObject | null) {
  const direct = getPath(readiness, ["testerReady", "liveOddsAction"]);
  if (direct) return compactAction(direct);
  return null;
}

function hoursOld(generatedAt: unknown) {
  if (typeof generatedAt !== "string") return null;
  const time = Date.parse(generatedAt);
  if (!Number.isFinite(time)) return null;
  return Math.max(0, (Date.now() - time) / 36e5);
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run local live odds refresh preflight in production.");
  }

  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const readiness = await readJson(READINESS_PATH);
  const runtimeStatus = await readJson(RUNTIME_STATUS_PATH);
  const auditGate = await readJson(AUDIT_GATE_PATH);
  const liveAction = findLiveAction(readiness);
  const providerEnvKeyConfigured = Boolean(process.env[PROVIDER_KEY_ENV_NAME]);
  const providerSecretFilePresent = await fileHasNonWhitespaceValue(PROVIDER_SECRET_FILE_PATH);
  const providerKeyConfigured = providerEnvKeyConfigured || providerSecretFilePresent;
  const providerKeySource = providerEnvKeyConfigured ? "environment" : providerSecretFilePresent ? "local-secret-file" : "missing";
  const cachedTradingReady = getPath(readiness, ["testerReady", "cachedTradingReady"]) === true;
  const liveOddsReady = getPath(readiness, ["testerReady", "liveOddsReady"]) === true;
  const providerSnapshotFresh = getPath(readiness, ["testerReady", "providerSnapshotFresh"]) === true;
  const quotaSpendingLoopRunning = getPath(readiness, ["testerReady", "quotaSpendingLoopRunning"]) === true;
  const liveActionKnown = liveOddsReady || liveAction?.command === LIVE_ODDS_REFRESH_COMMAND;
  const readinessPass = readiness?.pass === true;
  const auditGatePass = auditGate?.pass === true;
  const runtimeStatusPass = runtimeStatus?.pass === true;
  const p0 = [
    ...stringArray(getPath(readiness, ["gaps", "p0"])),
    ...stringArray(getPath(runtimeStatus, ["gaps", "p0"])),
    ...stringArray(getPath(auditGate, ["gaps", "p0"])),
  ];
  const p1 = [
    ...stringArray(getPath(readiness, ["gaps", "p1"])),
    ...stringArray(getPath(runtimeStatus, ["gaps", "p1"])),
    ...stringArray(getPath(auditGate, ["gaps", "p1"])),
  ];
  if (!providerKeyConfigured) {
    p1.push("Live provider refresh cannot run until the provider key is configured in the shell or ignored local secret file.");
  }
  if (!providerSnapshotFresh) {
    p1.push("Mobile provider snapshots are stale or not proven fresh; run the live provider refresh command when ready to spend quota.");
  }
  if (quotaSpendingLoopRunning) {
    p1.push("A quota-spending loop is already reported running; do not start another live provider refresh until it is stopped or confirmed intentional.");
  }

  const pass = readinessPass && auditGatePass && runtimeStatusPass && liveActionKnown && p0.length === 0;
  const summary = {
    generatedAt: new Date().toISOString(),
    scope: LIVE_RUNTIME_SCOPE,
    pass,
    providerQuotaUsedByThisReport: false,
    providerKeyConfigured,
    providerEnvKeyConfigured,
    providerSecretFilePresent,
    providerKeySource,
    providerSecretFilePath: PROVIDER_SECRET_FILE_PATH,
    providerKeyValuePrinted: false,
    commandLineContainsSecret: false,
    liveOddsRefreshCommand: LIVE_ODDS_REFRESH_COMMAND,
    liveOddsSecretPreflightCommand: LIVE_ODDS_SECRET_PREFLIGHT_COMMAND,
    liveOddsSecretRefreshCommand: LIVE_ODDS_SECRET_REFRESH_COMMAND,
    canRunLiveRefreshNow: !liveOddsReady && pass && providerKeyConfigured && !quotaSpendingLoopRunning,
    readiness: {
      cachedTradingReady,
      liveOddsReady,
      providerSnapshotFresh,
      quotaSpendingLoopRunning,
      nextAction: getPath(readiness, ["testerReady", "nextAction"]),
      readinessAgeHours: hoursOld(getPath(readiness, ["generatedAt"])),
      runtimeStatusAgeHours: hoursOld(getPath(runtimeStatus, ["generatedAt"])),
      auditGateAgeHours: hoursOld(getPath(auditGate, ["generatedAt"])),
    },
    liveAction: liveAction ?? {
      id: "live-provider-refresh",
      command: LIVE_ODDS_REFRESH_COMMAND,
      requiresProviderKey: true,
      spendsProviderQuota: true,
    },
    policy: {
      oneEventOnly: true,
      noBroadProviderScan: true,
      defaultModeSpendsQuota: false,
      liveRefreshSpendsQuota: true,
      providerKeyConfiguredOnlyAsBoolean: true,
      providerSecretFileCheckedOnlyForPresence: true,
      doNotPrintProviderKey: true,
    },
    checks: {
      readinessGatePass: readinessPass,
      runtimeStatusPass,
      auditGatePass,
      noOpenP0: p0.length === 0,
      liveOddsRefreshCommandKnown: liveActionKnown,
      providerKeyConfigured,
      providerEnvKeyConfigured,
      providerSecretFilePresent,
      providerSecretFilePathKnown: true,
      providerQuotaUsedByThisReport: false,
      secretValuePrinted: false,
    },
    evidence: {
      readinessGate: READINESS_PATH,
      runtimeStatus: RUNTIME_STATUS_PATH,
      auditGate: AUDIT_GATE_PATH,
    },
    gaps: {
      p0,
      p1: Array.from(new Set(p1)),
      p2: [
        ...new Set([
          ...stringArray(getPath(readiness, ["gaps", "p2"])),
          ...stringArray(getPath(runtimeStatus, ["gaps", "p2"])),
          ...stringArray(getPath(auditGate, ["gaps", "p2"])),
        ]),
      ],
    },
    note:
      "This preflight is a no-quota operator report. It does not call providers, start loops, mutate markets, print secrets, or run mobile proof.",
  };

  await writeJson(outputPath, summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.pass) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
