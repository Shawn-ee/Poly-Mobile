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

function deriveLifecycleNextAction(selectedEventLifecycle: JsonObject) {
  const schedulerActionNow = stringValue(selectedEventLifecycle.schedulerActionNow) ?? "none";
  const startTime = stringValue(selectedEventLifecycle.startTime);
  const suspendBeforeStartSeconds =
    typeof selectedEventLifecycle.suspendBeforeStartSeconds === "number"
      ? selectedEventLifecycle.suspendBeforeStartSeconds
      : 300;
  const startMs = startTime ? Date.parse(startTime) : NaN;
  const pauseAt = Number.isFinite(startMs) ? new Date(startMs - suspendBeforeStartSeconds * 1000).toISOString() : null;
  const nextLifecycleAction =
    schedulerActionNow === "close" ? "close" : schedulerActionNow === "pause" ? "pause" : "pause";
  const nextLifecycleActionAt =
    schedulerActionNow === "close" ? startTime : schedulerActionNow === "pause" ? pauseAt : pauseAt;
  return {
    schedulerActionNow,
    nextLifecycleAction,
    nextLifecycleActionAt,
    pauseAt,
    closeAt: startTime,
  };
}

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

function buildTesterChecklist(params: {
  statusBody: JsonObject;
  backendOk: boolean;
  recommendedCommand: string | null;
}) {
  const event = objectValue(params.statusBody.event);
  const selectedMarket = objectValue(params.statusBody.selectedMarket);
  const selectedEventLifecycle = objectValue(params.statusBody.selectedEventLifecycle);
  const currentRuntimeState = objectValue(params.statusBody.currentRuntimeState);
  const serviceOwnership = objectValue(params.statusBody.serviceOwnership);
  const unattendedReadiness = objectValue(serviceOwnership.unattendedReadiness);
  const settlementDecision = stringValue(params.statusBody.settlementDecision);
  const eventTitle = stringValue(event.title) ?? "selected backend-owned event";
  const eventSlug = stringValue(event.localSlug) ?? "unknown-event";
  const selectedMarketTitle = stringValue(selectedMarket.title) ?? "selected market";
  const selectedOutcomeName = stringValue(selectedMarket.outcomeName) ?? "selected outcome";
  const warmNoQuotaRuntime = getPath(currentRuntimeState, ["warmNoQuotaRuntime"]) === true;
  const providerSnapshotFresh = getPath(currentRuntimeState, ["providerSnapshotFresh"]) === true;
  const localInternalTesterReady = getPath(unattendedReadiness, ["localInternalTesterReady"]) === true;
  const tradingWindow = stringValue(selectedEventLifecycle.tradingWindow) ?? "unknown";
  const lifecycleNext = deriveLifecycleNextAction(selectedEventLifecycle);

  return {
    generatedFrom: "/api/internal/live-runtime/status",
    providerQuotaUsedByChecklist: false,
    eventToOpen: {
      title: eventTitle,
      localSlug: eventSlug,
      selectedMarket: selectedMarketTitle,
      selectedOutcome: selectedOutcomeName,
    },
    launch: [
      {
        step: "Start or verify local tester runtime",
        expected:
          params.recommendedCommand ??
          "Use the recommended operator command from /api/internal/live-runtime/status.",
        pass: params.backendOk && localInternalTesterReady,
        notes: warmNoQuotaRuntime
          ? "Runtime loops are currently warm in no-quota mode."
          : "Runtime capability is proven, but supervisor/result-poller loops are not both running now.",
      },
      {
        step: "Open Holiwyn on Samsung S23",
        expected: "Expo should load the server-backed app and reach the backend on port 3002.",
        pass: params.backendOk,
        notes: "If a stale Expo listener is reused, restart with the explicit ReplaceExternalExpo manager path.",
      },
    ],
    manualTradingFlow: [
      {
        step: "Home",
        expected: `Home shows ${eventTitle}.`,
        routeDependency: "GET /api/events",
        pass: params.backendOk,
        notes: "Tap the event card to open Event Detail.",
      },
      {
        step: "Event Detail",
        expected: `Markets load from backend for ${eventSlug}; selected proof market is ${selectedMarketTitle}.`,
        routeDependency: `GET /api/mobile/events/${eventSlug}/live-detail`,
        pass: params.backendOk,
        notes: providerSnapshotFresh
          ? "Provider snapshots are fresh for mobile display."
          : "Cached mode is usable for internal testing; live mobile odds refresh requires the explicit provider-refresh command.",
      },
      {
        step: "Quote and buy",
        expected: `Open ${selectedOutcomeName}, enter an amount, and swipe to buy with fake tokens.`,
        routeDependency: "GET /api/markets/:id/quote; POST /api/orders",
        pass: params.backendOk,
        notes: "Order must use the selected market/outcome identity from Event Detail.",
      },
      {
        step: "Portfolio position",
        expected: "Portfolio shows the bought position and activity/history records.",
        routeDependency: "GET /api/portfolio; GET /api/portfolio/history",
        pass: params.backendOk,
        notes: "Cashout should open close-position mode, not a new buy ticket.",
      },
      {
        step: "Cashout/sell",
        expected: "Max uses owned shares only, no Yes/No selector appears, and selling updates History.",
        routeDependency: "POST /api/orders; GET /api/portfolio/history",
        pass: params.backendOk,
        notes: "Selling more than owned shares must be impossible in UI and rejected by backend.",
      },
    ],
    lifecycleChecks: [
      {
        step: "Event lifecycle timing",
        expected:
          lifecycleNext.schedulerActionNow === "close"
            ? "Run the lifecycle scheduler now so markets close before settlement review."
            : lifecycleNext.schedulerActionNow === "pause"
              ? "Run the lifecycle scheduler now so trading pauses before kickoff."
              : "Event remains open for internal testing until the next lifecycle action.",
        routeDependency: "GET /api/internal/live-runtime/status",
        pass: params.backendOk && tradingWindow !== "unknown",
        notes:
          lifecycleNext.schedulerActionNow === "none"
            ? `Current window: ${tradingWindow}; next lifecycle action: ${lifecycleNext.nextLifecycleAction} at ${lifecycleNext.nextLifecycleActionAt ?? "unknown"}.`
            : `Current window: ${tradingWindow}; scheduler action now: ${lifecycleNext.schedulerActionNow}.`,
      },
      {
        step: "Stale odds",
        expected: "Stale/closed markets reject order placement with MARKET_UNAVAILABLE.",
        routeDependency: "POST /api/orders",
        pass: params.backendOk,
        notes: "Use stale-guard proof for automated verification; do not spend provider quota for this checklist.",
      },
      {
        step: "Settlement",
        expected: settlementDecision ?? "Active event waits for CLOSED market plus exact approval before settlement.",
        routeDependency: "GET /api/internal/live-runtime/settlement-queue",
        pass: params.backendOk,
        notes: "Active tester settlement must not execute while the selected market is LIVE.",
      },
    ],
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
  const testerLaunchChecklist = buildTesterChecklist({
    statusBody,
    backendOk: health.ok && getPath(health.body, ["status"]) === "ok",
    recommendedCommand,
  });
  const serialized = JSON.stringify({ statusBody, selectedAction });
  const providerKeyMarker = ["THE_ODDS_API", "KEY="].join("_");
  const providerKeyExposed = serialized.includes(providerKeyMarker);
  const p0 = [
    ...asStringArray(getPath(statusBody, ["gaps", "p0"])),
    ...(health.ok && getPath(health.body, ["status"]) === "ok" ? [] : ["backend_health_not_ok"]),
    ...(status.ok && statusBody.status === "ready" ? [] : ["runtime_status_not_ready"]),
    ...(recommendedCommand ? [] : ["recommended_operator_command_missing"]),
    ...(testerLaunchChecklist.manualTradingFlow.length > 0 ? [] : ["tester_launch_checklist_missing"]),
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
      eventLifecycleAction: getPath(statusBody, ["operatorNextActions", "eventLifecycleAction"]),
      eventLifecycleWindow: getPath(statusBody, ["operatorNextActions", "eventLifecycleWindow"]),
      eventLifecycleOperatorAction: getPath(statusBody, ["operatorNextActions", "eventLifecycleOperatorAction"]),
      actionCount: selectedAction.actionCount,
      selectedAction: selectedAction.action,
      safety: getPath(statusBody, ["operatorNextActions", "safety"]),
    },
    selectedEventLifecycle: statusBody.selectedEventLifecycle ?? null,
    testerLaunchChecklist,
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
      "Read-only operator snapshot. It calls local health/status routes only, does not call providers, does not read provider keys, and does not start loops or execute settlement. The checklist is generated from backend status so testers can run the current one-event flow without digging through broad proof artifacts.",
  };

  await writeJson(outputPath, summary);
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.pass) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
