import fs from "node:fs/promises";

const COMPLETION_AUDIT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json";
const PHASE_AUDIT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json";
const WATCHDOG_PATH =
  "docs/mobile/harness/odds-api-live-runtime/internal-tester-watchdog-summary.redacted.json";

type JsonObject = Record<string, unknown>;

const readJson = async (filePath: string): Promise<JsonObject | null> => {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as JsonObject;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
};

const getPath = (source: unknown, keys: string[]) => {
  let cursor = source;
  for (const key of keys) {
    if (!cursor || typeof cursor !== "object" || !(key in cursor)) return null;
    cursor = (cursor as JsonObject)[key];
  }
  return cursor;
};

const asStringArray = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);

const pass = (value: JsonObject | null) => value?.pass === true || value?.result === "pass";

export async function getLocalLiveRuntimeStatus() {
  const [completionAudit, phaseAudit, watchdog] = await Promise.all([
    readJson(COMPLETION_AUDIT_PATH),
    readJson(PHASE_AUDIT_PATH),
    readJson(WATCHDOG_PATH),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    scope: "holiwyn-local-live-runtime-status",
    status:
      pass(completionAudit) && pass(phaseAudit) && pass(watchdog)
        ? "ready"
        : "needs_attention",
    event: completionAudit?.event ?? phaseAudit?.event ?? null,
    selectedMarket: phaseAudit?.selectedMarket ?? null,
    runtimeTruth: {
      localInternalRuntimeReady: getPath(completionAudit, ["runtimeTruth", "phaseCompleteForLocalInternalRuntime"]) === true,
      fullProductionRuntimeComplete: getPath(completionAudit, ["runtimeTruth", "fullProductionRuntimeComplete"]) === true,
      installedUnattendedService: getPath(completionAudit, ["runtimeTruth", "installedUnattendedService"]) === true,
      internalTesterWatchdogPass: getPath(completionAudit, ["runtimeTruth", "internalTesterWatchdogPass"]) === true,
      providerQuotaUsedByStatus: false,
      activeTesterSettlementExecutionAttempted:
        getPath(completionAudit, ["runtimeTruth", "activeTesterSettlementExecutionAttempted"]) === true,
    },
    answers: {
      marketMakerContinuous: getPath(completionAudit, ["answers", "marketMakerContinuous"]),
      oddsRefreshLiveOrReplay: getPath(completionAudit, ["answers", "oddsRefreshLiveOrReplay"]),
      oddsRefreshCadence: getPath(completionAudit, ["answers", "oddsRefreshCadence"]),
      quotaProtection: getPath(completionAudit, ["answers", "quotaProtection"]),
      staleHandling: getPath(completionAudit, ["answers", "staleHandling"]),
      lifecycle: getPath(completionAudit, ["answers", "lifecycle"]),
      activeSettlement: getPath(completionAudit, ["answers", "activeSettlement"]),
      localWatchdog: getPath(completionAudit, ["answers", "localWatchdog"]),
    },
    checks: completionAudit?.checks ?? null,
    gaps: {
      p0: asStringArray(getPath(completionAudit, ["gaps", "p0"])),
      p1: asStringArray(getPath(completionAudit, ["gaps", "p1"])),
      p2: asStringArray(getPath(completionAudit, ["gaps", "p2"])),
    },
    artifacts: {
      completionAudit: {
        path: COMPLETION_AUDIT_PATH,
        pass: pass(completionAudit),
        generatedAt: completionAudit?.generatedAt ?? null,
      },
      phaseAudit: {
        path: PHASE_AUDIT_PATH,
        pass: pass(phaseAudit),
        generatedAt: phaseAudit?.generatedAt ?? null,
      },
      watchdog: {
        path: WATCHDOG_PATH,
        pass: pass(watchdog),
        generatedAt: watchdog?.generatedAt ?? null,
        cleanupPassed:
          getPath(watchdog, ["cleanup", "supervisor", "pass"]) === true &&
          getPath(watchdog, ["cleanup", "resultPoller", "pass"]) === true,
      },
    },
  };
}
