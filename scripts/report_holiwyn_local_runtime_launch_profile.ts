import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/local-runtime-launch-profile-summary.redacted.json";

const PATHS = {
  runtimeStatus: "docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json",
  internalTesterRuntime:
    "docs/mobile/harness/odds-api-live-runtime/internal-tester-runtime-manager-summary.redacted.json",
  supervisorProcess:
    "docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-process-summary.redacted.json",
  continuousSupervisor: "docs/mobile/harness/odds-api-live-runtime/one-event-continuous-supervisor-proof-summary.redacted.json",
  resultPollerProcess:
    "docs/mobile/harness/odds-api-live-runtime/one-event-result-poller-process-summary.redacted.json",
  continuousResultPoller:
    "docs/mobile/harness/odds-api-live-runtime/one-event-continuous-result-poller-proof-summary.redacted.json",
  localRuntimeTask: "docs/mobile/harness/odds-api-live-runtime/local-runtime-task-summary.redacted.json",
  localRuntimeTaskInstall:
    "docs/mobile/harness/odds-api-live-runtime/local-runtime-task-install-uninstall-summary.redacted.json",
  localRuntimeStartup:
    "docs/mobile/harness/odds-api-live-runtime/local-runtime-startup-summary.redacted.json",
  localRuntimeStartupInstall:
    "docs/mobile/harness/odds-api-live-runtime/local-runtime-startup-install-uninstall-summary.redacted.json",
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

function bool(value: unknown) {
  return value === true;
}

function pass(summary: JsonObject | null) {
  return bool(summary?.pass) || summary?.result === "pass";
}

function ageHours(generatedAt: unknown) {
  if (typeof generatedAt !== "string") return null;
  const parsed = Date.parse(generatedAt);
  if (!Number.isFinite(parsed)) return null;
  return Number(((Date.now() - parsed) / 3_600_000).toFixed(2));
}

function command(label: string, value: string, quotaMode = "no provider quota by default") {
  return { label, command: value, quotaMode };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run local runtime launch profile report in production.");
  }

  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const entries = Object.fromEntries(
    await Promise.all(Object.entries(PATHS).map(async ([key, filePath]) => [key, await readJson(filePath)])),
  ) as Record<keyof typeof PATHS, JsonObject | null>;

  const scheduledTaskRegistrationDenied =
    getPath(entries.localRuntimeTaskInstall, ["runtimeTruth", "scheduledTaskInstallBlockedByWindowsPermission"]) ===
      true ||
    String(getPath(entries.localRuntimeTaskInstall, ["operation", "install", "result"]) ?? "").includes("denied") ||
    String(getPath(entries.localRuntimeTaskInstall, ["install", "error"]) ?? "").toLowerCase().includes("denied");

  const checks = {
    runtimeStatusPass: pass(entries.runtimeStatus),
    internalTesterRuntimeStatusPass: pass(entries.internalTesterRuntime),
    continuousSupervisorProofPass: pass(entries.continuousSupervisor),
    continuousResultPollerProofPass: pass(entries.continuousResultPoller),
    startupPlanPresent: pass(entries.localRuntimeStartup),
    startupInstallProofPass: pass(entries.localRuntimeStartupInstall),
    startupProofLeavesNoLauncher:
      getPath(entries.localRuntimeStartupInstall, ["runtimeTruth", "noPersistentLauncherLeftInstalled"]) === true,
    startupProofIncludesSupervisorAndResultPoller:
      getPath(entries.localRuntimeStartupInstall, ["runtimeTruth", "startupLauncherIncludesResultPoller"]) === true &&
      getPath(entries.localRuntimeStartupInstall, ["runtimeTruth", "approvedSettlementModeInstallProof"]) === true,
    scheduledTaskPlanPresent: pass(entries.localRuntimeTask),
    scheduledTaskInstallAuditPass: pass(entries.localRuntimeTaskInstall),
    scheduledTaskNotInstalled:
      getPath(entries.localRuntimeTaskInstall, ["runtimeTruth", "noPersistentTaskLeftInstalled"]) === true ||
      getPath(entries.localRuntimeTask, ["runtimeTruth", "installedScheduledTask"]) === false,
    providerQuotaNotUsedByLaunchProofs:
      getPath(entries.localRuntimeStartupInstall, ["runtimeTruth", "providerQuotaUsed"]) === false &&
      getPath(entries.localRuntimeTaskInstall, ["runtimeTruth", "providerQuotaUsed"]) === false &&
      getPath(entries.continuousSupervisor, ["runtimeTruth", "quotaProtected"]) === true &&
      getPath(entries.continuousResultPoller, ["runtimeTruth", "providerQuotaUsed"]) === false,
    activeTesterSettlementNotExecuted:
      getPath(entries.runtimeStatus, ["settlementSafety", "activeTesterEventMutated"]) === false &&
      getPath(entries.localRuntimeStartupInstall, ["runtimeTruth", "activeTesterSettlementExecution"]) === false &&
      getPath(entries.continuousResultPoller, ["runtimeTruth", "activeTesterSettlementExecution"]) === false,
  };

  const p0 = Object.entries(checks)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "holiwyn-local-runtime-launch-profile",
    pass: p0.length === 0,
    launchProfiles: {
      recommendedInternalTesterProfile: {
        label: "User Startup fallback with backend, Expo, supervisor, result poller, result ingestion, settlement scheduling, and approved-settlement wait mode",
        command:
          "npm run mobile:local-runtime-startup -- -Action plan -StartSupervisor -StartResultPoller -RunResultIngestion -RunResultSettlement -RunApprovedResultSettlement",
        installCommand:
          "npm run mobile:local-runtime-startup -- -Action install -Apply -StartSupervisor -StartResultPoller -RunResultIngestion -RunResultSettlement -RunApprovedResultSettlement",
        uninstallCommand: "npm run mobile:local-runtime-startup -- -Action uninstall -Apply",
        quotaMode: "no provider quota unless provider/live-result flags are explicitly added",
        settlementMode: "approved scheduler waits for CLOSED market plus exact local approval match before execution",
        productionBoundary: "local Windows user-logon fallback, not a production service",
      },
      manualForegroundProfile: {
        commands: [
          command("runtime status", "npm run mobile:internal-tester-runtime -- -Action status"),
          command(
            "start backend/expo plus supervisor and result poller",
            "npm run mobile:internal-tester-runtime -- -Action start -StartSupervisor -StartResultPoller -RunResultIngestion -RunResultSettlement -RunApprovedResultSettlement -WaitForReady",
          ),
          command("stop manager-owned local runtime", "npm run mobile:internal-tester-runtime -- -Action stop"),
        ],
      },
      scheduledTaskProfile: {
        planCommand:
          "npm run mobile:local-runtime-task -- -Action plan -StartSupervisor -RunResultIngestion -RunResultSettlement",
        installCommand:
          "npm run mobile:local-runtime-task -- -Action install -Apply -StartSupervisor -RunResultIngestion -RunResultSettlement",
        usableInCurrentContext: !scheduledTaskRegistrationDenied,
        currentContextNote: scheduledTaskRegistrationDenied
          ? "Windows scheduled-task registration was denied in the current process context; use Startup fallback or an elevated shell/task-registration rights before applying."
          : "Scheduled-task registration has no current proof blocker, but install still requires explicit -Apply.",
      },
      liveProviderProfile: {
        command:
          "npm run mobile:one-event-live-supervisor -- -RunProviderProof -Continuous -MaxIterations 0 -MaxProviderProofRuns 1 -ProviderProofEveryIterations 1",
        quotaMode: "requires THE_ODDS_API_KEY and is capped by run count, cadence, per-run credits, and min remaining quota",
        defaultForInternalTesting: false,
      },
    },
    artifacts: PATHS,
    artifactAgesHours: Object.fromEntries(
      Object.entries(entries).map(([key, value]) => [key, ageHours(value?.generatedAt)]),
    ),
    checks,
    runtimeTruth: {
      localOperatorLaunchProfileDocumented: true,
      startupFallbackRecommendedForCurrentWindowsContext: scheduledTaskRegistrationDenied,
      scheduledTaskInstallerAvailableButNotInstalledByDefault: true,
      proofLeavesNoPersistentStartupLauncher: checks.startupProofLeavesNoLauncher,
      proofLeavesNoPersistentScheduledTask: checks.scheduledTaskNotInstalled,
      noProviderQuotaSpentByDefaultProfile: checks.providerQuotaNotUsedByLaunchProofs,
      activeTesterSettlementExecution: false,
      installedProductionService: false,
      fakeTokenOnly: true,
    },
    gaps: {
      p0,
      p1: [
        "This launch profile narrows local internal runtime operation; it does not install a production service.",
        "Official-result execution remains guarded by CLOSED market status, exact approval, and local operator controls.",
      ],
      p2: ["Multi-event production runtime launch profiles remain future work."],
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
