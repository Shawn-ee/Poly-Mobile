import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_BASE_URL = "http://127.0.0.1:3002";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/internal-tester-operator-snapshot.redacted.json";

type JsonObject = Record<string, unknown>;

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const getPath = (source: unknown, keys: string[]) => {
  let cursor = source;
  for (const key of keys) {
    if (!cursor || typeof cursor !== "object" || !(key in cursor)) return null;
    cursor = (cursor as JsonObject)[key];
  }
  return cursor;
};

const asStringArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const stringValue = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : null);

const objectValue = (value: unknown): JsonObject =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};

async function fetchJson(url: string) {
  try {
    const response = await fetch(url);
    const body = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, body, error: null };
  } catch (error) {
    return {
      ok: false,
      status: null,
      body: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function writeJson(outputPath: string, value: unknown) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function selectAction(statusBody: JsonObject) {
  const operatorNextActions = objectValue(statusBody.operatorNextActions);
  const actionId = stringValue(operatorNextActions.recommendedFirstAction) ?? "cached_internal_testing";
  const actions = Array.isArray(operatorNextActions.actions) ? operatorNextActions.actions : [];
  const action = actions.find((entry) => getPath(entry, ["id"]) === actionId) ?? actions[0] ?? null;
  return {
    recommendedFirstAction: actionId,
    action: action ? objectValue(action) : null,
    actionCount: actions.length,
  };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run local operator snapshot in production.");
  }

  const baseUrl = argValue("baseUrl") ?? DEFAULT_BASE_URL;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const health = await fetchJson(`${baseUrl}/api/health`);
  const status = await fetchJson(`${baseUrl}/api/internal/live-runtime/status`);
  const statusBody = objectValue(status.body);
  const selectedAction = selectAction(statusBody);
  const recommendedCommand = stringValue(getPath(selectedAction.action, ["command"]));
  const serialized = JSON.stringify({ statusBody, selectedAction });
  const providerKeyMarker = ["THE_ODDS_API", "KEY="].join("_");
  const providerKeyExposed = serialized.includes(providerKeyMarker);
  const p0 = [
    ...asStringArray(getPath(statusBody, ["gaps", "p0"])),
    ...(health.ok && getPath(health.body, ["status"]) === "ok" ? [] : ["backend_health_not_ok"]),
    ...(status.ok && statusBody.status === "ready" ? [] : ["runtime_status_not_ready"]),
    ...(recommendedCommand ? [] : ["recommended_operator_command_missing"]),
    ...(providerKeyExposed ? ["provider_secret_exposed"] : []),
  ];

  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "holiwyn-internal-tester-operator-snapshot",
    pass: p0.length === 0,
    baseUrl,
    providerQuotaUsedByThisReport: false,
    event: statusBody.event ?? null,
    selectedMarket: statusBody.selectedMarket ?? null,
    backend: {
      ok: health.ok,
      status: health.status,
      body: health.body,
      error: health.error,
    },
    runtime: {
      status: statusBody.status ?? null,
      localInternalRuntimeReady: getPath(statusBody, ["runtimeTruth", "localInternalRuntimeReady"]) === true,
      localTesterReadyRightNow: getPath(statusBody, ["runtimeTruth", "localTesterReadyRightNow"]) === true,
      currentRuntimeState: statusBody.currentRuntimeState ?? null,
      managedProcesses: statusBody.managedProcesses ?? null,
      serviceOwnership: {
        serviceModel: getPath(statusBody, ["serviceOwnership", "serviceModel"]),
        installedOsService: getPath(statusBody, ["serviceOwnership", "installedOsService"]) === true,
        productionServiceInstalled: getPath(statusBody, ["serviceOwnership", "productionServiceInstalled"]) === true,
      },
    },
    providerSnapshots: statusBody.providerSnapshots ?? null,
    operatorNextActions: {
      recommendedFirstAction: selectedAction.recommendedFirstAction,
      recommendedCommand,
      defaultNoQuotaAction: getPath(statusBody, ["operatorNextActions", "defaultNoQuotaAction"]),
      liveOddsAction: getPath(statusBody, ["operatorNextActions", "liveOddsAction"]),
      nextProviderAction: getPath(statusBody, ["operatorNextActions", "nextProviderAction"]),
      actionCount: selectedAction.actionCount,
      selectedAction: selectedAction.action,
      safety: getPath(statusBody, ["operatorNextActions", "safety"]),
    },
    settlement: {
      decision: statusBody.settlementDecision ?? null,
      activeTesterSettlementExecutionAttempted:
        getPath(statusBody, ["runtimeTruth", "activeTesterSettlementExecutionAttempted"]) === true,
    },
    gaps: {
      p0,
      p1: asStringArray(getPath(statusBody, ["gaps", "p1"])),
      p2: asStringArray(getPath(statusBody, ["gaps", "p2"])),
    },
    note:
      "Read-only operator snapshot. It calls local health/status routes only, does not call providers, does not read provider keys, and does not start loops or execute settlement.",
  };

  await writeJson(outputPath, summary);
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.pass) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
