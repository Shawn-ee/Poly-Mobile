import fs from "node:fs/promises";
import { prisma } from "@/lib/db";
import { writeRuntimeServiceHeartbeat } from "@/server/services/runtimeServiceHeartbeat";

const COMPLETION_AUDIT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json";
const RUNTIME_STATUS_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json";
const PHASE_AUDIT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json";
const WATCHDOG_PATH =
  "docs/mobile/harness/odds-api-live-runtime/internal-tester-watchdog-summary.redacted.json";
const ACTIVE_SETTLEMENT_READINESS_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-readiness-summary.redacted.json";
const SUPERVISOR_STATE_PATH = ".runtime/one-event-live-supervisor/supervisor-process-state.json";
const RESULT_POLLER_STATE_PATH = ".runtime/one-event-result-poller/result-poller-process-state.json";
const MOBILE_REFRESH_DUE_SECONDS = 60;
const MOBILE_STALE_AFTER_SECONDS = 90;

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

const ageHours = (generatedAt: unknown) => {
  if (typeof generatedAt !== "string") return null;
  const parsed = Date.parse(generatedAt);
  if (!Number.isFinite(parsed)) return null;
  return Number(((Date.now() - parsed) / 3_600_000).toFixed(2));
};

const numberValue = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);

const stringValue = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : null);

const booleanValue = (value: unknown) => (typeof value === "boolean" ? value : null);

const objectValue = (value: unknown): JsonObject =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};

const pidRunning = (pid: number | null) => {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
};

async function getManagedProcessStatus(params: {
  statePath: string;
  kind: "supervisor" | "result-poller";
}) {
  const state = await readJson(params.statePath);
  const pid = numberValue(state?.pid);
  const running = pidRunning(pid);
  const continuous = booleanValue(state?.continuous);
  const runProviderProof = booleanValue(state?.runProviderProof);
  const runLiveResultIngestion = booleanValue(state?.runLiveResultIngestion);

  return {
    kind: params.kind,
    checked: true,
    statePath: params.statePath,
    known: state != null,
    pid,
    running,
    startedAt: stringValue(state?.startedAt),
    continuous,
    maxIterations: numberValue(state?.maxIterations),
    intervalSeconds: numberValue(state?.intervalSeconds),
    usesProviderQuota:
      params.kind === "supervisor"
        ? runProviderProof === true || runLiveResultIngestion === true
        : runLiveResultIngestion === true,
    modes:
      params.kind === "supervisor"
        ? {
            providerProof: runProviderProof === true,
            staleGuard: booleanValue(state?.runStaleGuard) === true,
            staleGuardEnforced: booleanValue(state?.enforceStaleGuard) === true,
            liveResultIngestion: runLiveResultIngestion === true,
            approvedResultSettlement: booleanValue(state?.runApprovedResultSettlement) === true,
          }
        : {
            liveResultIngestion: runLiveResultIngestion === true,
            approvedResultSettlement: booleanValue(state?.runApprovedResultSettlement) === true,
          },
  };
}

async function upsertRuntimeHeartbeat(processStatus: Awaited<ReturnType<typeof getManagedProcessStatus>>) {
  const serviceName =
    processStatus.kind === "supervisor" ? "one-event-live-supervisor" : "one-event-result-poller";
  const status = processStatus.running ? "running" : processStatus.known ? "stopped" : "unknown";
  return writeRuntimeServiceHeartbeat({
    serviceName,
    serviceKind: processStatus.kind,
    status,
    pid: processStatus.pid,
    running: processStatus.running,
    continuous: processStatus.continuous,
    usesProviderQuota: processStatus.usesProviderQuota,
    installedOsService: false,
    statePath: processStatus.statePath,
    startedAt: processStatus.startedAt,
    source: "local-runtime-status-route",
    metadata: {
      checked: processStatus.checked,
      known: processStatus.known,
      maxIterations: processStatus.maxIterations,
      intervalSeconds: processStatus.intervalSeconds,
      modes: processStatus.modes,
    },
  });
}

const compactRuntimeRunRow = (row: {
  runKey: string;
  serviceKey: string;
  serviceName: string;
  serviceKind: string;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  iterationCount: number;
  providerQuotaUsed: boolean;
  activeSettlementExecuted: boolean;
  installedOsService: boolean;
  eventSlug: string | null;
  selectedMarketId: string | null;
  resultAction: string | null;
  summaryPath: string | null;
  updatedAt: Date;
  metadata: unknown;
}) => ({
  runKey: row.runKey,
  serviceKey: row.serviceKey,
  serviceName: row.serviceName,
  serviceKind: row.serviceKind,
  status: row.status,
  startedAt: row.startedAt.toISOString(),
  finishedAt: row.finishedAt?.toISOString() ?? null,
  durationMs: row.durationMs,
  iterationCount: row.iterationCount,
  providerQuotaUsed: row.providerQuotaUsed,
  activeSettlementExecuted: row.activeSettlementExecuted,
  installedOsService: row.installedOsService,
  eventSlug: row.eventSlug,
  selectedMarketId: row.selectedMarketId,
  resultAction: row.resultAction,
  summaryPath: row.summaryPath,
  updatedAt: row.updatedAt.toISOString(),
  metadata: {
    source: stringValue(objectValue(row.metadata).source),
    workerOwned: objectValue(row.metadata).workerOwned === true,
    emittedBy: stringValue(objectValue(row.metadata).emittedBy),
  },
});

async function getLatestRuntimeRuns() {
  const rows = await prisma.runtimeServiceRun.findMany({
    where: {
      serviceKey: {
        in: ["local:one-event-live-supervisor", "local:one-event-result-poller"],
      },
    },
    orderBy: { startedAt: "desc" },
    take: 10,
  });
  const latestByService = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!latestByService.has(row.serviceKey)) latestByService.set(row.serviceKey, row);
  }
  return Array.from(latestByService.values()).map(compactRuntimeRunRow);
}

const compactProviderRefreshRunRow = (row: {
  runKey: string;
  providerSource: string;
  referenceSource: string;
  status: string;
  mode: string;
  startedAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  eventSlug: string | null;
  providerEventId: string | null;
  sportKey: string | null;
  selectedMarketId: string | null;
  selectedOutcomeId: string | null;
  refreshIterations: number;
  providerCallCount: number;
  quotaCost: number;
  requestsRemaining: string | null;
  maxCredits: number | null;
  minRemaining: number | null;
  marketCount: number;
  outcomeCount: number;
  snapshotCount: number;
  staleBeforeRefresh: boolean;
  readyAfterRefresh: boolean;
  updatedAt: Date;
  metadata: unknown;
}) => ({
  runKey: row.runKey,
  providerSource: row.providerSource,
  referenceSource: row.referenceSource,
  status: row.status,
  mode: row.mode,
  startedAt: row.startedAt.toISOString(),
  finishedAt: row.finishedAt?.toISOString() ?? null,
  durationMs: row.durationMs,
  eventSlug: row.eventSlug,
  providerEventId: row.providerEventId,
  sportKey: row.sportKey,
  selectedMarketId: row.selectedMarketId,
  selectedOutcomeId: row.selectedOutcomeId,
  refreshIterations: row.refreshIterations,
  providerCallCount: row.providerCallCount,
  quotaCost: row.quotaCost,
  requestsRemaining: row.requestsRemaining,
  maxCredits: row.maxCredits,
  minRemaining: row.minRemaining,
  marketCount: row.marketCount,
  outcomeCount: row.outcomeCount,
  snapshotCount: row.snapshotCount,
  staleBeforeRefresh: row.staleBeforeRefresh,
  readyAfterRefresh: row.readyAfterRefresh,
  updatedAt: row.updatedAt.toISOString(),
  metadata: {
    source: stringValue(objectValue(row.metadata).source),
    emittedBy: stringValue(objectValue(row.metadata).emittedBy),
    quotaProtected: objectValue(row.metadata).quotaProtected === true,
  },
});

async function getLatestProviderRefreshRun(eventSlug: string | null) {
  const rows = await prisma.providerRefreshRun.findMany({
    where: {
      providerSource: "the-odds-api",
      referenceSource: "sportsbook-odds",
      ...(eventSlug ? { eventSlug } : {}),
    },
    orderBy: { startedAt: "desc" },
    take: 1,
  });
  return rows[0] ? compactProviderRefreshRunRow(rows[0]) : null;
}

const compactMarketMakerQuoteRunRow = (row: {
  runKey: string;
  marketId: string;
  outcomeId: string;
  eventSlug: string | null;
  status: string;
  mode: string;
  startedAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  makerUserId: string | null;
  bidOrderId: string | null;
  askOrderId: string | null;
  providerSource: string;
  referenceBid: { toString(): string } | null;
  referenceAsk: { toString(): string } | null;
  outcomePrice: { toString(): string } | null;
  plannedBid: { toString(): string } | null;
  plannedAsk: { toString(): string } | null;
  quoteOffsetTicks: number;
  size: { toString(): string } | null;
  mintQuantity: { toString(): string } | null;
  canceledOrderCount: number;
  restingOrderCount: number;
  quoteRouteStatus: number | null;
  shiftedBidWorseThanProvider: boolean;
  shiftedAskWorseThanProvider: boolean;
  quoteRouteShowsBid: boolean;
  quoteRouteShowsAsk: boolean;
  snapshotFresh: boolean;
  installedOsService: boolean;
  updatedAt: Date;
  metadata: unknown;
}) => ({
  runKey: row.runKey,
  marketId: row.marketId,
  outcomeId: row.outcomeId,
  eventSlug: row.eventSlug,
  status: row.status,
  mode: row.mode,
  startedAt: row.startedAt.toISOString(),
  finishedAt: row.finishedAt?.toISOString() ?? null,
  durationMs: row.durationMs,
  makerUserId: row.makerUserId,
  bidOrderId: row.bidOrderId,
  askOrderId: row.askOrderId,
  providerSource: row.providerSource,
  referenceBid: row.referenceBid?.toString() ?? null,
  referenceAsk: row.referenceAsk?.toString() ?? null,
  outcomePrice: row.outcomePrice?.toString() ?? null,
  plannedBid: row.plannedBid?.toString() ?? null,
  plannedAsk: row.plannedAsk?.toString() ?? null,
  quoteOffsetTicks: row.quoteOffsetTicks,
  size: row.size?.toString() ?? null,
  mintQuantity: row.mintQuantity?.toString() ?? null,
  canceledOrderCount: row.canceledOrderCount,
  restingOrderCount: row.restingOrderCount,
  quoteRouteStatus: row.quoteRouteStatus,
  shiftedBidWorseThanProvider: row.shiftedBidWorseThanProvider,
  shiftedAskWorseThanProvider: row.shiftedAskWorseThanProvider,
  quoteRouteShowsBid: row.quoteRouteShowsBid,
  quoteRouteShowsAsk: row.quoteRouteShowsAsk,
  snapshotFresh: row.snapshotFresh,
  installedOsService: row.installedOsService,
  updatedAt: row.updatedAt.toISOString(),
  metadata: {
    source: stringValue(objectValue(row.metadata).source),
    emittedBy: stringValue(objectValue(row.metadata).emittedBy),
    localOnly: objectValue(row.metadata).localOnly === true,
  },
});

async function getLatestMarketMakerQuoteRun(marketId: string | null) {
  const rows = await prisma.marketMakerQuoteRun.findMany({
    where: {
      ...(marketId ? { marketId } : {}),
      providerSource: "sportsbook-odds",
    },
    orderBy: { startedAt: "desc" },
    take: 1,
  });
  return rows[0] ? compactMarketMakerQuoteRunRow(rows[0]) : null;
}

async function getProviderSnapshotFreshness(params: {
  marketId: string | null;
  maxAgeHours: number | null;
}) {
  if (!params.marketId) {
    return {
      checked: false,
      fresh: false,
      marketId: null,
      reason: "missing_selected_market_id",
      snapshotCount: 0,
      latestFetchedAt: null,
      latestAgeHours: null,
      maxAgeHours: params.maxAgeHours,
      sources: [],
      acceptingOrderSnapshotCount: 0,
      mmEligibleSnapshotCount: 0,
    };
  }

  const snapshots = await prisma.referenceQuoteSnapshot.findMany({
    where: { marketId: params.marketId },
    select: {
      source: true,
      fetchedAt: true,
      acceptingOrders: true,
      mmEligible: true,
      qualityStatus: true,
      reason: true,
    },
    orderBy: { fetchedAt: "desc" },
  });
  const latest = snapshots[0] ?? null;
  const latestAgeHours = latest ? Number(((Date.now() - latest.fetchedAt.getTime()) / 3_600_000).toFixed(2)) : null;
  const latestAgeSeconds = latest ? Math.max(0, Math.round((Date.now() - latest.fetchedAt.getTime()) / 1000)) : null;
  const fresh =
    snapshots.length > 0 &&
    typeof latestAgeHours === "number" &&
    typeof params.maxAgeHours === "number" &&
    latestAgeHours <= params.maxAgeHours;
  const mobileLifecycleStatus =
    latestAgeSeconds == null
      ? "unavailable"
      : latestAgeSeconds > MOBILE_STALE_AFTER_SECONDS
        ? "stale"
        : latestAgeSeconds >= MOBILE_REFRESH_DUE_SECONDS
          ? "refresh_due"
          : "ready";
  const mobileRouteFresh = mobileLifecycleStatus === "ready";
  const mobileRouteRefreshDue = mobileLifecycleStatus === "refresh_due";
  const mobileRouteStale = mobileLifecycleStatus === "stale";
  const sources = Array.from(new Set(snapshots.map((snapshot) => snapshot.source))).sort();

  return {
    checked: true,
    fresh,
    freshnessBasis: "local_proof_window",
    marketId: params.marketId,
    reason: snapshots.length === 0 ? "missing_provider_snapshots" : fresh ? null : "provider_snapshots_stale",
    snapshotCount: snapshots.length,
    latestFetchedAt: latest?.fetchedAt.toISOString() ?? null,
    latestAgeHours,
    latestAgeSeconds,
    maxAgeHours: params.maxAgeHours,
    sources,
    acceptingOrderSnapshotCount: snapshots.filter((snapshot) => snapshot.acceptingOrders).length,
    mmEligibleSnapshotCount: snapshots.filter((snapshot) => snapshot.mmEligible).length,
    latestQualityStatus: latest?.qualityStatus ?? null,
    latestReason: latest?.reason ?? null,
    mobileRouteFresh,
    mobileRouteRefreshDue,
    mobileRouteStale,
    mobileLifecycleStatus,
    mobileRefreshDueSeconds: MOBILE_REFRESH_DUE_SECONDS,
    mobileStaleAfterSeconds: MOBILE_STALE_AFTER_SECONDS,
    mobileRefreshDueAt: latest
      ? new Date(latest.fetchedAt.getTime() + MOBILE_REFRESH_DUE_SECONDS * 1000).toISOString()
      : null,
    mobileStaleAt: latest
      ? new Date(latest.fetchedAt.getTime() + MOBILE_STALE_AFTER_SECONDS * 1000).toISOString()
      : null,
    nextProviderAction:
      mobileLifecycleStatus === "ready"
        ? "none"
        : mobileLifecycleStatus === "refresh_due"
          ? "refresh_provider_snapshots"
          : mobileLifecycleStatus === "stale"
            ? "refresh_provider_snapshots_or_keep_cached_test_mode"
            : "import_or_refresh_provider_snapshots",
  };
}

function buildOperatorNextActions(params: {
  providerSnapshots: JsonObject;
  settlementDecision: JsonObject;
  supervisorRunning: boolean;
  resultPollerRunning: boolean;
}) {
  const mobileLifecycleStatus = stringValue(params.providerSnapshots.mobileLifecycleStatus) ?? "unknown";
  const nextProviderAction = stringValue(params.providerSnapshots.nextProviderAction) ?? "inspect_status";
  const settlementOperatorDecision = stringValue(params.settlementDecision.operatorDecision);
  const settlementEligible = booleanValue(params.settlementDecision.executionEligibleNow);
  const actions = [
    {
      id: "cached_internal_testing",
      priority: "P0",
      label: "Keep cached local internal testing mode",
      command: "npm run mobile:one-event-onboarding",
      requiresProviderKey: false,
      spendsProviderQuota: false,
      reason: "Replays/restores the selected one-event runtime and verifies readiness without provider quota.",
    },
  ];

  if (mobileLifecycleStatus !== "ready") {
    actions.push({
      id: "refresh_mobile_live_odds",
      priority: "P0",
      label: "Refresh mobile-visible live odds",
      command: "npm run mobile:one-event-live-runtime:provider",
      requiresProviderKey: true,
      spendsProviderQuota: true,
      reason:
        mobileLifecycleStatus === "stale"
          ? "Selected market provider snapshots are stale under the mobile 90-second live-display window."
          : mobileLifecycleStatus === "refresh_due"
            ? "Selected market provider snapshots are past the mobile 60-second refresh-due threshold."
            : "Selected market needs provider snapshots before live mobile display can be fresh.",
    });
  }

  if (!params.supervisorRunning) {
    actions.push({
      id: "start_cached_supervisor",
      priority: "P1",
      label: "Start local cached supervisor loop",
      command: "npm run mobile:one-event-live-supervisor:process -- -Action start -Continuous -MaxIterations 0",
      requiresProviderKey: false,
      spendsProviderQuota: false,
      reason: "Keeps local maker/lifecycle/result dry-run checks warm in cached no-quota mode while the process is running.",
    });
  }

  if (!params.resultPollerRunning) {
    actions.push({
      id: "start_cached_result_poller",
      priority: "P1",
      label: "Start local cached result poller",
      command: "npm run mobile:one-event-result-poller:process -- -Action start -Continuous -MaxIterations 0",
      requiresProviderKey: false,
      spendsProviderQuota: false,
      reason: "Repeats provider-shaped result ingestion and settlement scheduling dry-runs without provider quota.",
    });
  }

  if (settlementOperatorDecision === "wait_for_or_apply_market_close_before_execution" || settlementEligible === false) {
    actions.push({
      id: "settlement_wait_for_closed_market",
      priority: "P1",
      label: "Wait for closed market before settlement",
      command: "npm run mobile:one-event-active-settlement-readiness",
      requiresProviderKey: false,
      spendsProviderQuota: false,
      reason:
        "Active-event trusted-result settlement is intentionally blocked while the selected market is not CLOSED.",
    });
  }

  return {
    recommendedFirstAction:
      nextProviderAction === "none"
        ? "cached_internal_testing"
        : nextProviderAction === "refresh_provider_snapshots_or_keep_cached_test_mode"
          ? "cached_internal_testing"
          : nextProviderAction === "refresh_provider_snapshots" || nextProviderAction === "import_or_refresh_provider_snapshots"
          ? "refresh_mobile_live_odds"
          : "cached_internal_testing",
    defaultNoQuotaAction: "cached_internal_testing",
    liveOddsAction: mobileLifecycleStatus === "ready" ? "none" : "refresh_mobile_live_odds",
    nextProviderAction,
    actions,
    safety:
      "Commands are local-only. Provider-refresh commands require THE_ODDS_API_KEY in the environment and remain quota-capped by the underlying proof scripts; the status route never returns or reads the key.",
  };
}

export async function getLocalLiveRuntimeStatus() {
  const [
    completionAudit,
    runtimeStatus,
    phaseAudit,
    watchdog,
    activeSettlementReadiness,
    supervisorProcess,
    resultPollerProcess,
  ] = await Promise.all([
    readJson(COMPLETION_AUDIT_PATH),
    readJson(RUNTIME_STATUS_PATH),
    readJson(PHASE_AUDIT_PATH),
    readJson(WATCHDOG_PATH),
    readJson(ACTIVE_SETTLEMENT_READINESS_PATH),
    getManagedProcessStatus({ kind: "supervisor", statePath: SUPERVISOR_STATE_PATH }),
    getManagedProcessStatus({ kind: "result-poller", statePath: RESULT_POLLER_STATE_PATH }),
  ]);

  const completionAgeHours = ageHours(completionAudit?.generatedAt);
  const phaseAgeHours = ageHours(phaseAudit?.generatedAt);
  const watchdogAgeHours = ageHours(watchdog?.generatedAt);
  const liveProofAgeAtCompletionHours = numberValue(getPath(completionAudit, ["answers", "freshness", "liveProofAgeHours"]));
  const maxLiveProofAgeHours = numberValue(getPath(completionAudit, ["answers", "freshness", "maxLiveProofAgeHours"]));
  const liveProofCurrentAgeHours =
    typeof liveProofAgeAtCompletionHours === "number" && typeof completionAgeHours === "number"
      ? Number((liveProofAgeAtCompletionHours + completionAgeHours).toFixed(2))
      : null;
  const selectedMarketId =
    stringValue(getPath(phaseAudit, ["selectedMarket", "id"])) ??
    stringValue(getPath(phaseAudit, ["selectedMarket", "marketId"])) ??
    stringValue(getPath(completionAudit, ["selectedMarket", "id"])) ??
    stringValue(getPath(completionAudit, ["selectedMarket", "marketId"]));
  const providerSnapshots = await getProviderSnapshotFreshness({
    marketId: selectedMarketId,
    maxAgeHours: maxLiveProofAgeHours,
  });
  const runtimeHeartbeats = await Promise.all([
    upsertRuntimeHeartbeat(supervisorProcess),
    upsertRuntimeHeartbeat(resultPollerProcess),
  ]);
  const runtimeRuns = await getLatestRuntimeRuns();
  const providerRefreshRun = await getLatestProviderRefreshRun(
    stringValue(getPath(completionAudit, ["event", "localSlug"])) ?? stringValue(getPath(phaseAudit, ["event", "localSlug"])),
  );
  const marketMakerQuoteRun = await getLatestMarketMakerQuoteRun(selectedMarketId);
  const p0Gaps = asStringArray(getPath(completionAudit, ["gaps", "p0"]));
  const artifactFreshness = {
    maxCompletionAuditAgeHours: 24,
    maxPhaseAuditAgeHours: 24,
    maxWatchdogAgeHours: 24,
    maxLiveProofAgeHours,
    completionAuditAgeHours: completionAgeHours,
    phaseAuditAgeHours: phaseAgeHours,
    watchdogAgeHours,
    liveProofAgeAtCompletionHours,
    liveProofCurrentAgeHours,
    completionAuditFresh: typeof completionAgeHours === "number" && completionAgeHours <= 24,
    phaseAuditFresh: typeof phaseAgeHours === "number" && phaseAgeHours <= 24,
    watchdogFresh: typeof watchdogAgeHours === "number" && watchdogAgeHours <= 24,
    liveProofFresh:
      typeof liveProofCurrentAgeHours === "number" &&
      typeof maxLiveProofAgeHours === "number" &&
      liveProofCurrentAgeHours <= maxLiveProofAgeHours,
  };
  const resultReviewReady =
    getPath(phaseAudit, ["localResultReview", "ok"]) === true &&
    getPath(phaseAudit, ["localResultReview", "body", "status"]) === "ready" &&
    getPath(phaseAudit, ["localResultReview", "body", "providerQuotaUsed"]) === false &&
    getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "readOnlyRoute"]) === true &&
    getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "devOnlyRoute"]) === true &&
    getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "canonicalProviderResultAuditAvailable"]) === true &&
    getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "canonicalSettlementPreflightAuditAvailable"]) === true &&
    getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "canonicalSettlementApprovalAuditAvailable"]) === true &&
    getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "durableOfficialResultReviewRecordAvailable"]) === true &&
    getPath(phaseAudit, ["localResultReview", "body", "officialResultReview", "exactConfirmationStored"]) === false &&
    getPath(phaseAudit, ["localResultReview", "body", "officialResultReview", "providerQuotaUsed"]) === false &&
    getPath(phaseAudit, ["localResultReview", "body", "officialResultReview", "activeMarketExecutionAttempted"]) === false &&
    getPath(phaseAudit, ["localResultReview", "body", "executionDecision", "exactConfirmationRequiredKnown"]) === true &&
    getPath(phaseAudit, ["localResultReview", "body", "executionDecision", "exactConfirmationRedacted"]) === true &&
    getPath(phaseAudit, ["localResultReview", "body", "executionDecision", "activeMarketExecutionAttemptedByThisRoute"]) === false &&
    Array.isArray(getPath(phaseAudit, ["localResultReview", "body", "gaps", "p0"])) &&
    (getPath(phaseAudit, ["localResultReview", "body", "gaps", "p0"]) as unknown[]).length === 0;
  const ready =
    pass(completionAudit) &&
    pass(phaseAudit) &&
    pass(watchdog) &&
    p0Gaps.length === 0 &&
    artifactFreshness.completionAuditFresh &&
    artifactFreshness.phaseAuditFresh &&
    artifactFreshness.watchdogFresh &&
    artifactFreshness.liveProofFresh &&
    providerSnapshots.fresh &&
    resultReviewReady;
  const operatorNextActions = buildOperatorNextActions({
    providerSnapshots,
    settlementDecision: {
      executionEligibleNow: getPath(activeSettlementReadiness, ["executionDecision", "executionEligibleNow"]),
      operatorDecision: getPath(activeSettlementReadiness, ["executionDecision", "operatorDecision"]),
    },
    supervisorRunning: supervisorProcess.running,
    resultPollerRunning: resultPollerProcess.running,
  });
  const settlementDecision = {
    checked: activeSettlementReadiness != null,
    path: ACTIVE_SETTLEMENT_READINESS_PATH,
    pass: pass(activeSettlementReadiness),
    generatedAt: activeSettlementReadiness?.generatedAt ?? null,
    providerQuotaUsed: getPath(activeSettlementReadiness, ["providerQuotaUsed"]) === true,
    activeMarketStatus: getPath(activeSettlementReadiness, ["activeMarket", "status"]),
    activeEventStatus: getPath(activeSettlementReadiness, ["activeMarket", "event", "status"]),
    executionEligibleNow: getPath(activeSettlementReadiness, ["executionDecision", "executionEligibleNow"]) === true,
    operatorDecision: getPath(activeSettlementReadiness, ["executionDecision", "operatorDecision"]),
    blockers: asStringArray(getPath(activeSettlementReadiness, ["executionDecision", "blockers"])),
    marketMustBeClosed: getPath(activeSettlementReadiness, ["executionDecision", "marketMustBeClosed"]) === true,
    exactConfirmationRequiredKnown:
      typeof getPath(activeSettlementReadiness, ["executionDecision", "exactConfirmationRequired"]) === "string",
    activeMarketExecutionAttempted:
      getPath(activeSettlementReadiness, ["executionDecision", "activeMarketExecutionAttempted"]) === true,
    disposableCloneSettlementProven:
      getPath(activeSettlementReadiness, ["runtimeTruth", "disposableCloneSettlementProven"]) === true,
    supervisorApprovedSettlementWaitProven:
      getPath(activeSettlementReadiness, ["runtimeTruth", "supervisorApprovedSettlementWaitProven"]) === true,
    nextSafeAction:
      getPath(activeSettlementReadiness, ["executionDecision", "executionEligibleNow"]) === true
        ? "execute_only_with_exact_confirmation_after_operator_review"
        : "wait_for_or_apply_market_close_before_execution",
  };
  const resultReview = {
    checked: getPath(phaseAudit, ["localResultReview"]) != null,
    path: "/api/internal/live-runtime/result-review",
    pass: resultReviewReady,
    providerQuotaUsed: getPath(phaseAudit, ["localResultReview", "body", "providerQuotaUsed"]) === true,
    readOnlyRoute: getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "readOnlyRoute"]) === true,
    devOnlyRoute: getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "devOnlyRoute"]) === true,
    canonicalProviderResultAuditAvailable:
      getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "canonicalProviderResultAuditAvailable"]) === true,
    canonicalSettlementPreflightAuditAvailable:
      getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "canonicalSettlementPreflightAuditAvailable"]) === true,
    canonicalSettlementApprovalAuditAvailable:
      getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "canonicalSettlementApprovalAuditAvailable"]) === true,
    durableOfficialResultReviewRecordAvailable:
      getPath(phaseAudit, ["localResultReview", "body", "runtimeTruth", "durableOfficialResultReviewRecordAvailable"]) === true,
    officialResultReview: {
      reviewKey: getPath(phaseAudit, ["localResultReview", "body", "officialResultReview", "reviewKey"]) ?? null,
      exactConfirmationStored:
        getPath(phaseAudit, ["localResultReview", "body", "officialResultReview", "exactConfirmationStored"]) === true,
      providerQuotaUsed:
        getPath(phaseAudit, ["localResultReview", "body", "officialResultReview", "providerQuotaUsed"]) === true,
      activeMarketExecutionAttempted:
        getPath(phaseAudit, ["localResultReview", "body", "officialResultReview", "activeMarketExecutionAttempted"]) === true,
    },
    exactConfirmationRequiredKnown:
      getPath(phaseAudit, ["localResultReview", "body", "executionDecision", "exactConfirmationRequiredKnown"]) === true,
    exactConfirmationRedacted:
      getPath(phaseAudit, ["localResultReview", "body", "executionDecision", "exactConfirmationRedacted"]) === true,
    activeMarketExecutionAttemptedByRoute:
      getPath(phaseAudit, ["localResultReview", "body", "executionDecision", "activeMarketExecutionAttemptedByThisRoute"]) === true,
    p0: asStringArray(getPath(phaseAudit, ["localResultReview", "body", "gaps", "p0"])),
    nextSafeAction:
      getPath(phaseAudit, ["localResultReview", "body", "executionDecision", "executionEligibleNow"]) === true
        ? "operator_review_required_before_exact_confirmed_execution"
        : "wait_for_or_apply_market_close_before_execution",
  };

  return {
    generatedAt: new Date().toISOString(),
    scope: "holiwyn-local-live-runtime-status",
    status: ready ? "ready" : "needs_attention",
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
      p0: p0Gaps,
      p1: asStringArray(getPath(completionAudit, ["gaps", "p1"])),
      p2: asStringArray(getPath(completionAudit, ["gaps", "p2"])),
    },
    freshness: artifactFreshness,
    providerSnapshots,
    providerRefreshRuns: {
      checked: true,
      durable: true,
      source: "ProviderRefreshRun",
      latest: providerRefreshRun,
      latestRunPassed: providerRefreshRun?.status === "passed",
      latestRunQuotaProtected: providerRefreshRun?.metadata.quotaProtected === true,
      latestRunWithinBudget:
        providerRefreshRun != null &&
        typeof providerRefreshRun.maxCredits === "number" &&
        providerRefreshRun.quotaCost <= providerRefreshRun.maxCredits,
      latestRunReadyAfterRefresh: providerRefreshRun?.readyAfterRefresh === true,
      latestRunStaleBeforeRefresh: providerRefreshRun?.staleBeforeRefresh === true,
      providerQuotaUsedByStatus: false,
      note:
        "This durable row records the latest bounded live provider refresh proof for the selected one-event runtime. The status route reads it but does not call the provider or spend quota.",
    },
    marketMakerQuoteRuns: {
      checked: true,
      durable: true,
      source: "MarketMakerQuoteRun",
      latest: marketMakerQuoteRun,
      latestRunPassed: marketMakerQuoteRun?.status === "passed",
      latestRunLocalOnly: marketMakerQuoteRun?.metadata.localOnly === true,
      latestRunShiftedWorseThanProvider:
        marketMakerQuoteRun?.shiftedBidWorseThanProvider === true &&
        marketMakerQuoteRun?.shiftedAskWorseThanProvider === true,
      latestRunQuoteRouteReady:
        marketMakerQuoteRun?.quoteRouteShowsBid === true &&
        marketMakerQuoteRun?.quoteRouteShowsAsk === true &&
        marketMakerQuoteRun?.quoteRouteStatus === 200,
      latestRunSnapshotFresh: marketMakerQuoteRun?.snapshotFresh === true,
      installedOsService: marketMakerQuoteRun?.installedOsService === true,
      note:
        "This durable row records the latest local shifted-maker quote cycle for the selected market. It proves local quote placement and quote-route visibility, not installed production daemon ownership.",
    },
    settlementDecision,
    resultReview,
    runtimeCapabilities: {
      latestRunProfileOnly: getPath(runtimeStatus, ["modeTruth", "latestSupervisorRunProfileOnly"]) === true,
      latestSupervisorProfile: getPath(runtimeStatus, ["supervisor", "latestRunProfile"]) ?? null,
      provenCapabilities: {
        repeatedSupervisorCycles:
          getPath(runtimeStatus, ["provenCapabilities", "repeatedSupervisorCycles"]) === true,
        makerReseedWhileSupervisorRuns:
          getPath(runtimeStatus, ["provenCapabilities", "makerReseedWhileSupervisorRuns"]) === true,
        lifecycleSchedulerWhileSupervisorRuns:
          getPath(runtimeStatus, ["provenCapabilities", "lifecycleSchedulerWhileSupervisorRuns"]) === true,
        resultIngestionWhileSupervisorRuns:
          getPath(runtimeStatus, ["provenCapabilities", "resultIngestionWhileSupervisorRuns"]) === true,
        resultSettlementSchedulerWhileSupervisorRuns:
          getPath(runtimeStatus, ["provenCapabilities", "resultSettlementSchedulerWhileSupervisorRuns"]) === true,
        supervisorProviderRefreshQuotaProtected:
          getPath(runtimeStatus, ["provenCapabilities", "supervisorProviderRefreshQuotaProtected"]) === true,
        resultPollingBackgroundProof:
          getPath(runtimeStatus, ["provenCapabilities", "resultPollingBackgroundProof"]) === true,
        resultPollingContinuousWhileRunnerRuns:
          getPath(runtimeStatus, ["provenCapabilities", "resultPollingContinuousWhileRunnerRuns"]) === true,
        resultSettlementSchedulerWhilePollerRuns:
          getPath(runtimeStatus, ["provenCapabilities", "resultSettlementSchedulerWhilePollerRuns"]) === true,
        installedOsService: getPath(runtimeStatus, ["provenCapabilities", "installedOsService"]) === true,
      },
      currentProcessState: {
        anyLoopRunning: supervisorProcess.running || resultPollerProcess.running,
        quotaSpendingLoopRunning: supervisorProcess.usesProviderQuota || resultPollerProcess.usesProviderQuota,
      },
      note:
        "latestSupervisorProfile describes only the latest supervisor artifact; provenCapabilities describes prior passing repeated supervisor/result-poller proofs.",
    },
    operatorNextActions,
    managedProcesses: {
      supervisor: supervisorProcess,
      resultPoller: resultPollerProcess,
      anyLoopRunning: supervisorProcess.running || resultPollerProcess.running,
      quotaSpendingLoopRunning: supervisorProcess.usesProviderQuota || resultPollerProcess.usesProviderQuota,
      note:
        "Read-only live process check from local .runtime state and OS pid existence. Ready status is based on proven local capability and fresh data, not on requiring background loops to be running right now.",
    },
    runtimeHeartbeats: {
      checked: true,
      durable: true,
      source: "RuntimeServiceHeartbeat",
      records: runtimeHeartbeats,
      allExpectedServicesRecorded:
        runtimeHeartbeats.length === 2 &&
        runtimeHeartbeats.every((row) => row.serviceKey === "local:one-event-live-supervisor" || row.serviceKey === "local:one-event-result-poller"),
      quotaSpendingHeartbeatRunning: runtimeHeartbeats.some((row) => row.running && row.usesProviderQuota),
      installedOsService: runtimeHeartbeats.some((row) => row.installedOsService),
      note:
        "These durable rows include worker-emitted heartbeat metadata when the local loops run, then the status route mirrors current process-state checks. They do not mean a production OS service is installed.",
    },
    runtimeRuns: {
      checked: true,
      durable: true,
      source: "RuntimeServiceRun",
      records: runtimeRuns,
      allExpectedServicesRecorded:
        runtimeRuns.length === 2 &&
        runtimeRuns.every((row) => row.serviceKey === "local:one-event-live-supervisor" || row.serviceKey === "local:one-event-result-poller"),
      allExpectedServicesPassed:
        runtimeRuns.length === 2 && runtimeRuns.every((row) => row.status === "passed"),
      quotaSpendingRunRecorded: runtimeRuns.some((row) => row.providerQuotaUsed),
      activeSettlementExecuted: runtimeRuns.some((row) => row.activeSettlementExecuted),
      installedOsService: runtimeRuns.some((row) => row.installedOsService),
      workerOwnedRunCount: runtimeRuns.filter((row) => row.metadata.workerOwned).length,
      note:
        "These durable rows are emitted by the local runtime workers when a supervisor/result-poller run finishes. They prove latest run outcome, not installed production service ownership.",
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
      runtimeStatus: {
        path: RUNTIME_STATUS_PATH,
        pass: pass(runtimeStatus),
        generatedAt: runtimeStatus?.generatedAt ?? null,
      },
      watchdog: {
        path: WATCHDOG_PATH,
        pass: pass(watchdog),
        generatedAt: watchdog?.generatedAt ?? null,
        cleanupPassed:
          getPath(watchdog, ["cleanup", "supervisor", "pass"]) === true &&
          getPath(watchdog, ["cleanup", "resultPoller", "pass"]) === true,
      },
      activeSettlementReadiness: {
        path: ACTIVE_SETTLEMENT_READINESS_PATH,
        pass: pass(activeSettlementReadiness),
        generatedAt: activeSettlementReadiness?.generatedAt ?? null,
      },
    },
  };
}
