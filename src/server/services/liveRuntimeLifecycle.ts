import fs from "node:fs/promises";
import { prisma } from "@/lib/db";

const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";

const PATHS = {
  lifecycleControls: "docs/mobile/harness/odds-api-live-runtime/event-lifecycle-controls-summary.redacted.json",
  lifecycleScheduler: "docs/mobile/harness/odds-api-live-runtime/event-lifecycle-scheduler-summary.redacted.json",
  lifecycleSchedulerRun:
    "docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-scheduler-run-summary.redacted.json",
  lifecycleMatrix: "docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-matrix-summary.redacted.json",
  settlementExecution: "docs/mobile/harness/odds-api-live-runtime/one-event-settlement-execution-summary.redacted.json",
  trustedResultSettlementExecution:
    "docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-scheduler-execution-summary.redacted.json",
  activeSettlementReadiness:
    "docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-readiness-summary.redacted.json",
  resultReviewTrail: "docs/mobile/harness/odds-api-live-runtime/one-event-result-review-trail-summary.redacted.json",
};

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

const stringValue = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : null);
const bool = (value: unknown) => value === true;

const pass = (summary: JsonObject | null) => bool(summary?.pass) || summary?.result === "pass";

const artifactSummary = (summary: JsonObject | null, path: string) => ({
  path,
  present: summary != null,
  pass: pass(summary),
  generatedAt: stringValue(summary?.generatedAt),
  providerQuotaUsed: summary?.providerQuotaUsed === true,
});

export async function getLocalLiveRuntimeLifecycle(params: { eventSlug?: string | null } = {}) {
  const entries = Object.fromEntries(
    await Promise.all(Object.entries(PATHS).map(async ([key, filePath]) => [key, await readJson(filePath)])),
  ) as Record<keyof typeof PATHS, JsonObject | null>;

  const eventSlug =
    stringValue(params.eventSlug) ??
    stringValue(getPath(entries.lifecycleMatrix, ["event", "slug"])) ??
    DEFAULT_EVENT_SLUG;

  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      liveStatus: true,
      startTime: true,
      source: true,
      externalEventId: true,
      markets: {
        where: { isListed: true, referenceSource: "sportsbook-odds" },
        select: {
          id: true,
          title: true,
          status: true,
          settlementStatus: true,
          resolvedOutcomeId: true,
          marketType: true,
          line: true,
        },
      },
    },
  });

  const openProven =
    bool(getPath(entries.lifecycleControls, ["checks", "liveOrderAccepted"])) &&
    getPath(entries.lifecycleControls, ["lifecycle", "open", "marketStatus"]) === "LIVE";
  const pausedProven =
    bool(getPath(entries.lifecycleControls, ["checks", "pausedOrderRejected"])) &&
    getPath(entries.lifecycleControls, ["lifecycle", "paused", "marketStatus"]) === "PAUSED";
  const closedProven =
    bool(getPath(entries.lifecycleControls, ["checks", "closedOrderRejected"])) &&
    bool(getPath(entries.lifecycleScheduler, ["checks", "closeAfterStart"]));
  const settlementPreviewProven =
    bool(getPath(entries.lifecycleControls, ["checks", "settlementPreviewNonMutating"])) &&
    bool(getPath(entries.lifecycleControls, ["lifecycle", "settlementPreview", "payoutConservationPass"]));
  const disposableSettlementProven =
    bool(getPath(entries.settlementExecution, ["checks", "settlementExecuted"])) &&
    bool(getPath(entries.settlementExecution, ["checks", "payoutConservationPass"])) &&
    bool(getPath(entries.settlementExecution, ["checks", "positionsFinalizedPass"])) &&
    getPath(entries.settlementExecution, ["targetTesterEventMutated"]) === false;
  const trustedSchedulerDisposableSettlementProven =
    bool(getPath(entries.trustedResultSettlementExecution, ["checks", "liveMarketExecutionBlocked"])) &&
    bool(getPath(entries.trustedResultSettlementExecution, ["checks", "executeSchedulerPassed"])) &&
    bool(getPath(entries.trustedResultSettlementExecution, ["checks", "disposableMarketResolved"])) &&
    (bool(getPath(entries.trustedResultSettlementExecution, ["checks", "targetTesterEventNotMutated"])) ||
      bool(getPath(entries.trustedResultSettlementExecution, ["checks", "targetTesterEventSettlementStateNotMutated"])));
  const activeReviewTrailProven =
    bool(getPath(entries.resultReviewTrail, ["checks", "providerResultAuditEventFound"])) &&
    bool(getPath(entries.resultReviewTrail, ["checks", "settlementPreflightAuditEventFound"])) &&
    getPath(entries.resultReviewTrail, ["runtimeTruth", "activeTesterSettlementExecution"]) === false;
  const activeExecutionAttempted =
    getPath(entries.activeSettlementReadiness, ["runtimeTruth", "activeEventSettlementExecutionAttempted"]) === true ||
    getPath(entries.resultReviewTrail, ["runtimeTruth", "activeTesterSettlementExecution"]) === true;
  const activeExecutionEligibleNow =
    getPath(entries.activeSettlementReadiness, ["executionDecision", "executionEligibleNow"]) === true ||
    getPath(entries.activeSettlementReadiness, ["runtimeTruth", "activeEventSettlementExecutionEligibleNow"]) === true;

  const checks = {
    eventFound: event != null,
    routeIsReadOnly: true,
    devOnlyRoute: true,
    providerQuotaNotUsed: true,
    openStateProven: openProven,
    pausedStateProven: pausedProven,
    closedStateProven: closedProven,
    settlementPreviewProven,
    disposableSettlementMechanicsProven: disposableSettlementProven,
    trustedResultSchedulerDisposableSettlementProven: trustedSchedulerDisposableSettlementProven,
    activeEventReviewTrailProven: activeReviewTrailProven,
    activeTesterEventSettlementNotExecuted: !activeExecutionAttempted,
  };

  const p0 = Object.entries(checks)
    .filter(([, value]) => value !== true)
    .map(([key]) => key);
  const currentMarketStatuses = Array.from(new Set((event?.markets ?? []).map((market) => market.status))).sort();
  const resolvedMarketCount = (event?.markets ?? []).filter((market) => market.resolvedOutcomeId).length;
  const selectedMarketStatus =
    stringValue(getPath(entries.activeSettlementReadiness, ["executionDecision", "activeMarketStatus"])) ??
    stringValue(getPath(entries.activeSettlementReadiness, ["activeMarket", "status"]));

  return {
    status: p0.length === 0 ? "ready" : "needs_attention",
    generatedAt: new Date().toISOString(),
    providerQuotaUsed: false,
    event: event
      ? {
          id: event.id,
          slug: event.slug,
          title: event.title,
          status: event.status,
          liveStatus: event.liveStatus,
          startTime: event.startTime?.toISOString() ?? null,
          source: event.source,
          externalEventId: event.externalEventId,
          listedSportsbookMarketCount: event.markets.length,
          currentMarketStatuses,
          resolvedMarketCount,
        }
      : null,
    lifecycle: {
      open: {
        proven: openProven,
        acceptsOrdersWhenLive: bool(getPath(entries.lifecycleControls, ["checks", "liveOrderAccepted"])),
        evidence: PATHS.lifecycleControls,
      },
      suspended: {
        proven: pausedProven,
        rejectsOrdersWhenPaused: bool(getPath(entries.lifecycleControls, ["checks", "pausedOrderRejected"])),
        evidence: [PATHS.lifecycleControls, PATHS.lifecycleScheduler],
      },
      closed: {
        proven: closedProven,
        rejectsOrdersWhenClosed: bool(getPath(entries.lifecycleControls, ["checks", "closedOrderRejected"])),
        schedulerCanCloseAfterStart: bool(getPath(entries.lifecycleScheduler, ["checks", "closeAfterStart"])),
        evidence: [PATHS.lifecycleControls, PATHS.lifecycleScheduler, PATHS.lifecycleSchedulerRun],
      },
      settledResolved: {
        proven: settlementPreviewProven && disposableSettlementProven && trustedSchedulerDisposableSettlementProven,
        activeTesterEventSettlementExecuted: activeExecutionAttempted,
        activeExecutionEligibleNow,
        activeMarketStatus: selectedMarketStatus,
        executionRequiresMarketStatus:
          stringValue(getPath(entries.activeSettlementReadiness, ["executionDecision", "executionRequiresMarketStatus"])) ??
          "CLOSED",
        evidence: [
          PATHS.settlementExecution,
          PATHS.trustedResultSettlementExecution,
          PATHS.activeSettlementReadiness,
          PATHS.resultReviewTrail,
        ],
      },
    },
    artifacts: Object.fromEntries(Object.entries(PATHS).map(([key, filePath]) => [key, artifactSummary(entries[key as keyof typeof PATHS], filePath)])),
    runtimeTruth: {
      readOnlyRoute: true,
      devOnlyRoute: true,
      providerQuotaUsed: false,
      activeTesterEventSettlementExecuted: activeExecutionAttempted,
      activeTesterEventReviewTrailExists: activeReviewTrailProven,
      disposableSettlementExecutionProven: disposableSettlementProven && trustedSchedulerDisposableSettlementProven,
      automaticOfficialResultSettlementInstalled: false,
      installedOsService: false,
    },
    checks,
    gaps: {
      p0,
      p1: [
        "Active tester event settlement still waits for CLOSED status and exact operator confirmation.",
        "Installed unattended lifecycle/result service ownership remains open.",
        "Production official-result auto-settlement remains open.",
      ],
      p2: ["A first-class lifecycle dashboard/operator UI remains future work."],
    },
  };
}
