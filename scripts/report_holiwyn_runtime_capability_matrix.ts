import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/runtime-capability-matrix.redacted.json";

type Capability = {
  id: string;
  area: string;
  status: "ready" | "proof-only" | "operator-triggered" | "missing";
  runtimeMode: "one-shot" | "continuous-while-command-runs" | "installed-service-missing" | "read-only-report";
  spendsProviderQuota: boolean;
  quotaProtection: string;
  startCommand: string | null;
  proofCommand: string | null;
  stopCommand: string | null;
  evidenceFiles: string[];
  currentLimitation: string | null;
};

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

async function readText(filePath: string) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "";
    throw error;
  }
}

async function writeJson(outputPath: string, value: unknown) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function scriptExists(packageScripts: Record<string, string>, name: string) {
  return typeof packageScripts[name] === "string" && packageScripts[name].trim().length > 0;
}

async function main() {
  const outputPath = argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const packageJson = await readJson<{ scripts?: Record<string, string> }>("package.json");
  const packageScripts = packageJson?.scripts ?? {};
  const supervisorScript = await readText("scripts/run_holiwyn_one_event_live_supervisor.ps1");
  const resultPollerScript = await readText("scripts/run_holiwyn_one_event_result_poller.ps1");
  const onboardingScript = await readText("scripts/onboard_holiwyn_one_event_live_runtime.ps1");
  const secretWrapper = await readText("scripts/run_holiwyn_one_event_live_runtime_with_secret.ps1");

  const requiredScripts = [
    "mobile:one-event-onboarding:cached-runtime",
    "mobile:one-event-onboarding:live-provider-runtime",
    "mobile:one-event-live-supervisor",
    "mobile:one-event-live-supervisor:continuous-proof",
    "mobile:one-event-live-supervisor:stop",
    "mobile:one-event-result-poller",
    "mobile:one-event-result-poller:continuous-proof",
    "mobile:one-event-result-poller:stop",
    "mobile:one-event-live-maker-seed",
    "mobile:one-event-lifecycle-scheduler-run",
    "mobile:internal-tester-runtime:cached-start",
    "mobile:internal-tester-runtime:live-provider-start",
    "mobile:internal-tester-runtime:stop",
  ];

  const capabilities: Capability[] = [
    {
      id: "one-event-onboarding-cached",
      area: "one-command local onboarding",
      status: scriptExists(packageScripts, "mobile:one-event-onboarding:cached-runtime") ? "ready" : "missing",
      runtimeMode: "one-shot",
      spendsProviderQuota: false,
      quotaProtection: "Uses cached/replay provider evidence and starts/stops runtime loops for proof.",
      startCommand: "npm run mobile:one-event-onboarding:cached-runtime",
      proofCommand: "npm run mobile:internal-tester-readiness-gate",
      stopCommand: null,
      evidenceFiles: [
        "scripts/onboard_holiwyn_one_event_live_runtime.ps1",
        "docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-summary.redacted.json",
      ],
      currentLimitation: "Does not prove fresh provider odds unless the live-provider variant is used.",
    },
    {
      id: "one-event-onboarding-live-provider",
      area: "one-command live provider onboarding",
      status: scriptExists(packageScripts, "mobile:one-event-onboarding:live-provider-runtime")
        ? "operator-triggered"
        : "missing",
      runtimeMode: "one-shot",
      spendsProviderQuota: true,
      quotaProtection:
        "Requires THE_ODDS_API_KEY from environment or ignored local secret file; uses quota caps and one-event scope.",
      startCommand: "npm run mobile:one-event-onboarding:live-provider-runtime",
      proofCommand: "npm run mobile:live-odds-refresh-preflight",
      stopCommand: null,
      evidenceFiles: [
        "scripts/onboard_holiwyn_one_event_live_runtime.ps1",
        "scripts/run_holiwyn_one_event_live_runtime_with_secret.ps1",
      ],
      currentLimitation: "Operator-triggered only; not an installed unattended provider polling service.",
    },
    {
      id: "one-event-live-supervisor",
      area: "market maker and runtime supervisor",
      status: scriptExists(packageScripts, "mobile:one-event-live-supervisor") ? "ready" : "missing",
      runtimeMode: "continuous-while-command-runs",
      spendsProviderQuota: false,
      quotaProtection:
        "Cached mode spends no provider quota. Provider proof is opt-in and capped by MaxProviderProofRuns.",
      startCommand: "npm run mobile:one-event-live-supervisor",
      proofCommand: "npm run mobile:one-event-live-supervisor:continuous-proof",
      stopCommand: "npm run mobile:one-event-live-supervisor:stop",
      evidenceFiles: [
        "scripts/run_holiwyn_one_event_live_supervisor.ps1",
        "scripts/manage_holiwyn_one_event_live_supervisor.ps1",
        "src/server/services/runtimeServiceHeartbeat.ts",
        "src/server/services/runtimeServiceRun.ts",
      ],
      currentLimitation: "Continuous only while the local command/process is running; installed OS service remains missing.",
    },
    {
      id: "one-event-result-poller",
      area: "result ingestion and settlement poller",
      status: scriptExists(packageScripts, "mobile:one-event-result-poller") ? "ready" : "missing",
      runtimeMode: "continuous-while-command-runs",
      spendsProviderQuota: false,
      quotaProtection: "Replay/local result mode is quota-free; live result ingestion is opt-in and capped.",
      startCommand: "npm run mobile:one-event-result-poller",
      proofCommand: "npm run mobile:one-event-result-poller:continuous-proof",
      stopCommand: "npm run mobile:one-event-result-poller:stop",
      evidenceFiles: [
        "scripts/run_holiwyn_one_event_result_poller.ps1",
        "scripts/manage_holiwyn_one_event_result_poller.ps1",
      ],
      currentLimitation: "Production official-result auto-settlement is not fully owned as an installed service.",
    },
    {
      id: "one-event-maker-seed",
      area: "fake-token market maker liquidity",
      status: scriptExists(packageScripts, "mobile:one-event-live-maker-seed") ? "ready" : "missing",
      runtimeMode: "one-shot",
      spendsProviderQuota: false,
      quotaProtection: "Uses stored provider reference snapshots; does not call The Odds API.",
      startCommand: "npm run mobile:one-event-live-maker-seed",
      proofCommand: "npm run mobile:provider-maker-handoff",
      stopCommand: null,
      evidenceFiles: [
        "scripts/seed_odds_api_live_shifted_maker.ts",
        "scripts/report_holiwyn_provider_maker_handoff.ts",
      ],
      currentLimitation: "Standalone command is one-shot; repeated reseeding requires the supervisor loop.",
    },
    {
      id: "one-event-lifecycle",
      area: "event lifecycle open/suspend/close/settlement",
      status: scriptExists(packageScripts, "mobile:one-event-lifecycle-scheduler-run") ? "ready" : "missing",
      runtimeMode: "one-shot",
      spendsProviderQuota: false,
      quotaProtection: "Lifecycle scheduler does not call the odds provider.",
      startCommand: "npm run mobile:one-event-lifecycle-scheduler-run",
      proofCommand: "npm run mobile:one-event-lifecycle-matrix",
      stopCommand: null,
      evidenceFiles: [
        "scripts/run_odds_api_one_event_lifecycle_scheduler.ts",
        "scripts/report_odds_api_one_event_lifecycle_matrix.ts",
      ],
      currentLimitation: "Scheduler can be repeated by the supervisor, but installed unattended ownership remains P1.",
    },
  ];

  const missingScripts = requiredScripts.filter((name) => !scriptExists(packageScripts, name));
  const sourceChecks = {
    supervisorSupportsContinuous: supervisorScript.includes("[switch]$Continuous"),
    supervisorCapsProviderProof: supervisorScript.includes("MaxProviderProofRuns"),
    supervisorWritesHeartbeat: supervisorScript.includes("mobile:runtime-heartbeat"),
    resultPollerSupportsContinuous: resultPollerScript.includes("[switch]$Continuous"),
    onboardingStartsRuntimeLoops: onboardingScript.includes("[switch]$StartRuntimeLoops"),
    onboardingStopsRuntimeLoops: onboardingScript.includes("[switch]$StopRuntimeLoopsAfterProof"),
    providerSecretWrapperUsesLocalSecret: secretWrapper.includes(".runtime") && secretWrapper.includes("the-odds-api-key.txt"),
    noHardcodedProviderKey:
      !supervisorScript.includes("THE_ODDS_API_KEY=") &&
      !onboardingScript.includes("THE_ODDS_API_KEY=") &&
      !secretWrapper.includes("THE_ODDS_API_KEY="),
  };

  const pass = missingScripts.length === 0 && Object.values(sourceChecks).every(Boolean);
  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "holiwyn-runtime-capability-matrix",
    pass,
    providerQuotaUsedByThisReport: false,
    missingScripts,
    sourceChecks,
    capabilityCounts: {
      total: capabilities.length,
      ready: capabilities.filter((item) => item.status === "ready").length,
      operatorTriggered: capabilities.filter((item) => item.status === "operator-triggered").length,
      missing: capabilities.filter((item) => item.status === "missing").length,
      continuousWhileCommandRuns: capabilities.filter((item) => item.runtimeMode === "continuous-while-command-runs").length,
      installedServiceMissing: capabilities.filter((item) => item.currentLimitation?.includes("installed")).length,
    },
    capabilities,
    conclusion: pass
      ? "Local runtime has quota-free cached onboarding, operator-triggered live-provider onboarding, continuous-while-command-runs supervisor/result-poller loops, one-shot maker/lifecycle commands, and no installed unattended service ownership yet."
      : "Runtime capability matrix is incomplete; inspect missingScripts/sourceChecks.",
  };

  await writeJson(outputPath, summary);
  console.log(JSON.stringify(summary, null, 2));
  if (!pass) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
