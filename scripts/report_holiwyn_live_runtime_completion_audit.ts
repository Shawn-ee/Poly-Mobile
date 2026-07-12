import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json";

const PATHS = {
  runtimeStatus: "docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json",
  phaseAudit: "docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json",
  onboarding: "docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-summary.redacted.json",
  onboardingRuntimeStart:
    "docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-runtime-start-summary.redacted.json",
  onboardingRuntimeStatus:
    "docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-runtime-status-summary.redacted.json",
  onboardingRuntimeStop:
    "docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-runtime-stop-summary.redacted.json",
  liveProviderProof: "docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json",
  liveReadiness: "docs/mobile/harness/odds-api-live-runtime/one-event-live-readiness-summary.redacted.json",
  localRuntimeLaunchProfile:
    "docs/mobile/harness/odds-api-live-runtime/local-runtime-launch-profile-summary.redacted.json",
  internalTesterWatchdog:
    "docs/mobile/harness/odds-api-live-runtime/internal-tester-watchdog-summary.redacted.json",
  currentRuntimeStateProof:
    "docs/mobile/harness/odds-api-live-runtime/current-runtime-state-proof-summary.redacted.json",
  staleGuardProof: "docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-summary.redacted.json",
  staleGuardRun: "docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-run-summary.redacted.json",
  lifecycleMatrix: "docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-matrix-summary.redacted.json",
  activeSettlementReadiness:
    "docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-readiness-summary.redacted.json",
  activeSettlementClosedEligibility:
    "docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-closed-eligibility-summary.redacted.json",
  providerMakerHandoff:
    "docs/mobile/harness/odds-api-live-runtime/provider-maker-handoff-summary.redacted.json",
  s23Visible: "docs/mobile/harness/cycle-LIVEODDSS23-odds-api-live-runtime-s23/cycle-LIVEODDSS23-odds-api-s23-visible-flow.json",
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

function isFutureIso(value: unknown) {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed > Date.now();
}

function truthy(value: unknown) {
  return value === true;
}

function workerOwnedHeartbeatCount(value: unknown) {
  if (!Array.isArray(value)) return 0;
  return value.filter((record) => getPath(record, ["metadata", "workerOwned"]) === true).length;
}

function workerOwnedRunCount(value: unknown) {
  if (!Array.isArray(value)) return 0;
  return value.filter((record) => getPath(record, ["metadata", "workerOwned"]) === true).length;
}

function pass(entry: JsonObject | null) {
  return entry?.pass === true || entry?.result === "pass";
}

function ageHours(generatedAt: unknown) {
  if (typeof generatedAt !== "string") return null;
  const parsed = Date.parse(generatedAt);
  if (!Number.isFinite(parsed)) return null;
  return Number(((Date.now() - parsed) / 3_600_000).toFixed(2));
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run local live-runtime completion audit in production.");
  }

  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const entries = Object.fromEntries(
    await Promise.all(Object.entries(PATHS).map(async ([key, filePath]) => [key, await readJson(filePath)])),
  ) as Record<keyof typeof PATHS, JsonObject | null>;

  const eventTitle =
    getPath(entries.runtimeStatus, ["event", "title"]) ?? getPath(entries.liveProviderProof, ["event", "title"]);
  const commenceTime =
    getPath(entries.runtimeStatus, ["event", "commenceTime"]) ??
    getPath(entries.liveProviderProof, ["event", "commenceTime"]);
  const liveProofAgeHours = getPath(entries.runtimeStatus, ["provider", "liveProofAgeHours"]);
  const maxLiveProofAgeHours = getPath(entries.runtimeStatus, ["provider", "maxLiveProofAgeHours"]);
  const watchdogAgeHours = ageHours(getPath(entries.internalTesterWatchdog, ["generatedAt"]));
  const maxWatchdogAgeHours = 24;
  const checks = {
    backendRuntimeStatusPass: pass(entries.runtimeStatus),
    oneRealUpcomingEventKnown:
      typeof eventTitle === "string" &&
      eventTitle.length > 0 &&
      typeof getPath(entries.runtimeStatus, ["event", "providerEventId"]) === "string" &&
      isFutureIso(commenceTime),
    liveProviderProofPass: pass(entries.liveProviderProof),
    liveProviderProofFresh:
      typeof liveProofAgeHours === "number" &&
      typeof maxLiveProofAgeHours === "number" &&
      liveProofAgeHours <= maxLiveProofAgeHours,
    oddsRefreshModeKnown:
      truthy(getPath(entries.runtimeStatus, ["modeTruth", "cachedRuntimeUsesQuota"])) === false &&
      truthy(getPath(entries.runtimeStatus, ["modeTruth", "liveProviderRefreshRequiresExplicitFlag"])) === true,
    oddsRefreshCadenceKnown:
      typeof getPath(entries.runtimeStatus, ["provider", "policy", "refreshIterations"]) === "number" &&
      typeof getPath(entries.runtimeStatus, ["provider", "policy", "refreshIntervalMs"]) === "number",
    providerQuotaKnownAndProtected:
      truthy(getPath(entries.liveProviderProof, ["policy", "oneEventOnly"])) &&
      typeof getPath(entries.runtimeStatus, ["provider", "quota", "totalLastCost"]) === "number" &&
      typeof getPath(entries.runtimeStatus, ["provider", "policy", "maxCredits"]) === "number",
    durableProviderRefreshRunKnown:
      pass(entries.phaseAudit) &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "providerRefreshRuns", "checked"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "providerRefreshRuns", "durable"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "providerRefreshRuns", "latestRunPassed"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "providerRefreshRuns", "latestRunQuotaProtected"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "providerRefreshRuns", "latestRunWithinBudget"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "providerRefreshRuns", "latestRunReadyAfterRefresh"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "providerRefreshRuns", "latestRunStaleBeforeRefresh"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "providerRefreshRuns", "providerQuotaUsedByStatus"]) === false,
    durableMarketMakerQuoteRunKnown:
      pass(entries.phaseAudit) &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "marketMakerQuoteRuns", "checked"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "marketMakerQuoteRuns", "durable"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "marketMakerQuoteRuns", "latestRunPassed"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "marketMakerQuoteRuns", "latestRunLocalOnly"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "marketMakerQuoteRuns", "latestRunShiftedWorseThanProvider"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "marketMakerQuoteRuns", "latestRunQuoteRouteReady"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "marketMakerQuoteRuns", "latestRunSnapshotFresh"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "marketMakerQuoteRuns", "repeatedLocalRunsProven"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "marketMakerQuoteRuns", "installedOsService"]) === false,
    marketMakerContinuityKnown:
      truthy(getPath(entries.runtimeStatus, ["provenCapabilities", "makerReseedWhileSupervisorRuns"])) &&
      truthy(getPath(entries.runtimeStatus, ["provenCapabilities", "repeatedSupervisorCycles"])) &&
      getPath(entries.runtimeStatus, ["provenCapabilities", "installedOsService"]) === false,
    providerMakerHandoffKnown:
      pass(entries.providerMakerHandoff) &&
      getPath(entries.providerMakerHandoff, ["runtimeTruth", "providerRefreshToMakerQuoteHandoffProven"]) === true &&
      getPath(entries.providerMakerHandoff, ["runtimeTruth", "sameEventMarketOutcome"]) === true &&
      getPath(entries.providerMakerHandoff, ["runtimeTruth", "noProviderQuotaSpentByThisReport"]) === true &&
      getPath(entries.providerMakerHandoff, ["runtimeTruth", "localOnlyMakerQuote"]) === true &&
      getPath(entries.providerMakerHandoff, ["runtimeTruth", "installedOsService"]) === false &&
      getPath(entries.providerMakerHandoff, ["checks", "providerRunReadyAfterRefresh"]) === true &&
      getPath(entries.providerMakerHandoff, ["checks", "makerRunAfterProviderRefreshPassed"]) === true &&
      getPath(entries.providerMakerHandoff, ["checks", "makerRunShiftedWorseThanProvider"]) === true &&
      getPath(entries.providerMakerHandoff, ["checks", "makerRunQuoteRouteVisible"]) === true,
    makerQuoteAvailable:
      truthy(getPath(entries.runtimeStatus, ["checks", "quoteRouteHealthy"])) &&
      truthy(getPath(entries.runtimeStatus, ["checks", "makerSeedPassed"])),
    staleHandlingKnown:
      pass(entries.staleGuardProof) &&
      pass(entries.staleGuardRun) &&
      truthy(getPath(entries.runtimeStatus, ["checks", "schedulerRunPassed"])),
    lifecycleOpenPausedClosedSettledKnown:
      pass(entries.lifecycleMatrix) &&
      truthy(getPath(entries.lifecycleMatrix, ["checks", "openStateProven"])) &&
      truthy(getPath(entries.lifecycleMatrix, ["checks", "pausedStateProven"])) &&
      truthy(getPath(entries.lifecycleMatrix, ["checks", "closedStateProven"])) &&
      truthy(getPath(entries.lifecycleMatrix, ["checks", "settlementMechanicsProvenOnDisposableMarket"])),
    activeSettlementDecisionKnown:
      pass(entries.activeSettlementReadiness) &&
      truthy(getPath(entries.activeSettlementReadiness, ["runtimeTruth", "activeEventSettlementExecutionDecisionKnown"])),
    activeSettlementClosedEligibilityKnown:
      pass(entries.activeSettlementClosedEligibility) &&
      truthy(getPath(entries.activeSettlementClosedEligibility, ["runtimeTruth", "provesActiveEventClosedStateEligibility"])) &&
      getPath(entries.activeSettlementClosedEligibility, ["runtimeTruth", "activeEventSettlementExecuted"]) === false &&
      getPath(entries.activeSettlementClosedEligibility, ["runtimeTruth", "activeMarketRestored"]) === true &&
      getPath(entries.activeSettlementClosedEligibility, ["runtimeTruth", "providerQuotaUsed"]) === false,
    localResultReviewApiKnown:
      pass(entries.phaseAudit) &&
      getPath(entries.phaseAudit, ["localResultReview", "ok"]) === true &&
      getPath(entries.phaseAudit, ["localResultReview", "body", "status"]) === "ready" &&
      getPath(entries.phaseAudit, ["localResultReview", "body", "providerQuotaUsed"]) === false &&
      getPath(entries.phaseAudit, ["localResultReview", "body", "runtimeTruth", "readOnlyRoute"]) === true &&
      getPath(entries.phaseAudit, ["localResultReview", "body", "runtimeTruth", "devOnlyRoute"]) === true &&
      getPath(entries.phaseAudit, ["localResultReview", "body", "runtimeTruth", "canonicalProviderResultAuditAvailable"]) === true &&
      getPath(entries.phaseAudit, ["localResultReview", "body", "runtimeTruth", "canonicalSettlementPreflightAuditAvailable"]) === true &&
      getPath(entries.phaseAudit, ["localResultReview", "body", "runtimeTruth", "canonicalSettlementApprovalAuditAvailable"]) === true &&
      getPath(entries.phaseAudit, ["localResultReview", "body", "runtimeTruth", "durableOfficialResultReviewRecordAvailable"]) === true &&
      getPath(entries.phaseAudit, ["localResultReview", "body", "officialResultReview", "exactConfirmationStored"]) === false &&
      getPath(entries.phaseAudit, ["localResultReview", "body", "officialResultReview", "providerQuotaUsed"]) === false &&
      getPath(entries.phaseAudit, ["localResultReview", "body", "officialResultReview", "activeMarketExecutionAttempted"]) === false &&
      getPath(entries.phaseAudit, ["localResultReview", "body", "executionDecision", "exactConfirmationRequiredKnown"]) === true &&
      getPath(entries.phaseAudit, ["localResultReview", "body", "executionDecision", "exactConfirmationRedacted"]) === true &&
      getPath(entries.phaseAudit, ["localResultReview", "body", "executionDecision", "activeMarketExecutionAttemptedByThisRoute"]) === false &&
      Array.isArray(getPath(entries.phaseAudit, ["localResultReview", "body", "gaps", "p0"])) &&
      (getPath(entries.phaseAudit, ["localResultReview", "body", "gaps", "p0"]) as unknown[]).length === 0,
    localSettlementQueueApiKnown:
      pass(entries.phaseAudit) &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "ok"]) === true &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "status"]) === "ready" &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "providerQuotaUsed"]) === false &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "readOnlyRoute"]) === true &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "devOnlyRoute"]) === true &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "usesDurableOfficialResultReviewRows"]) === true &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "operatorQueueAvailable"]) === true &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "redactedOperatorExecutionPlanAvailable"]) === true &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "exactConfirmationStringsExposed"]) === false &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "exactConfirmationStored"]) === false &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "activeMarketExecutionAttempted"]) === false &&
      typeof getPath(entries.phaseAudit, ["localSettlementQueue", "body", "queue", "itemCount"]) === "number" &&
      (getPath(entries.phaseAudit, ["localSettlementQueue", "body", "queue", "itemCount"]) as number) > 0 &&
      typeof getPath(entries.phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "operatorAction", "label"]) === "string" &&
      typeof getPath(entries.phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "operatorAction", "nextCommand"]) === "string" &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "operatorAction", "exactConfirmationExposed"]) === false &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "operatorAction", "providerQuotaRequired"]) === false &&
      Array.isArray(getPath(entries.phaseAudit, ["localSettlementQueue", "body", "gaps", "p0"])) &&
      (getPath(entries.phaseAudit, ["localSettlementQueue", "body", "gaps", "p0"]) as unknown[]).length === 0,
    durableRuntimeHeartbeatsKnown:
      pass(entries.phaseAudit) &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "runtimeHeartbeats", "checked"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "runtimeHeartbeats", "durable"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "runtimeHeartbeats", "allExpectedServicesRecorded"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "runtimeHeartbeats", "quotaSpendingHeartbeatRunning"]) === false &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "runtimeHeartbeats", "installedOsService"]) === false &&
      workerOwnedHeartbeatCount(getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "runtimeHeartbeats", "records"])) >= 2,
    durableRuntimeRunsKnown:
      pass(entries.phaseAudit) &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "runtimeRuns", "checked"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "runtimeRuns", "durable"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "runtimeRuns", "allExpectedServicesRecorded"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "runtimeRuns", "allExpectedServicesPassed"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "runtimeRuns", "quotaSpendingRunRecorded"]) === false &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "runtimeRuns", "activeSettlementExecuted"]) === false &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "runtimeRuns", "installedOsService"]) === false &&
      workerOwnedRunCount(getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "runtimeRuns", "records"])) >= 2,
    currentRuntimeStateKnown:
      pass(entries.phaseAudit) &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "currentRuntimeState", "checked"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "currentRuntimeState", "localCapabilityReady"]) === true &&
      typeof getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "currentRuntimeState", "mode"]) === "string" &&
      typeof getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "currentRuntimeState", "nextAction"]) === "string" &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "currentRuntimeState", "quotaSpendingLoopRunning"]) === false &&
      Array.isArray(getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "currentRuntimeState", "p0"])) &&
      (getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "currentRuntimeState", "p0"]) as unknown[]).length === 0,
    currentRuntimeWarmStateProofKnown:
      pass(entries.currentRuntimeStateProof) &&
      getPath(entries.currentRuntimeStateProof, ["runtimeTruth", "warmNoQuotaRuntimeObserved"]) === true &&
      getPath(entries.currentRuntimeStateProof, ["runtimeTruth", "allLoopsRunningObserved"]) === true &&
      getPath(entries.currentRuntimeStateProof, ["runtimeTruth", "localCapabilityReadyWhileRunning"]) === true &&
      getPath(entries.currentRuntimeStateProof, ["runtimeTruth", "quotaSpendingLoopRunning"]) === false &&
      getPath(entries.currentRuntimeStateProof, ["runtimeTruth", "providerQuotaUsed"]) === false &&
      getPath(entries.currentRuntimeStateProof, ["runtimeTruth", "activeTesterSettlementExecution"]) === false &&
      getPath(entries.currentRuntimeStateProof, ["runtimeTruth", "stopsLoopsAfterProof"]) === true,
    oneCommandRuntimeLoopProofKnown:
      pass(entries.onboarding) &&
      pass(entries.onboardingRuntimeStart) &&
      pass(entries.onboardingRuntimeStatus) &&
      pass(entries.onboardingRuntimeStop) &&
      getPath(entries.onboarding, ["providerPolicy", "runtimeLoopStartRequiresExplicitFlag"]) === true &&
      getPath(entries.onboarding, ["providerPolicy", "runtimeLoopCleanupRequested"]) === true &&
      getPath(entries.onboarding, ["runtimeTruth", "runtimeLoopsStartedByOnboarding"]) === true &&
      getPath(entries.onboarding, ["runtimeTruth", "runtimeLoopsRunningDuringProof"]) === true &&
      getPath(entries.onboarding, ["runtimeTruth", "runtimeLoopsStoppedAfterProof"]) === true &&
      getPath(entries.onboardingRuntimeStatus, ["supervisor", "processSummary", "process", "after", "running"]) ===
        true &&
      getPath(entries.onboardingRuntimeStatus, [
        "resultPoller",
        "processSummary",
        "process",
        "after",
        "running",
      ]) === true &&
      getPath(entries.onboardingRuntimeStop, ["supervisor", "processSummary", "process", "after", "running"]) ===
        false &&
      getPath(entries.onboardingRuntimeStop, [
        "resultPoller",
        "processSummary",
        "process",
        "after",
        "running",
      ]) === false,
    mobileS23EndToEndTradeProofPass:
      pass(entries.s23Visible) &&
      truthy(getPath(entries.s23Visible, ["assertions", "swipeSubmitReachedPortfolio"])) &&
      truthy(getPath(entries.s23Visible, ["assertions", "cashoutSellSubmitted"])) &&
      truthy(getPath(entries.s23Visible, ["assertions", "historyPreservesSportsbookLineIdentity"])),
    launchProfileKnown:
      pass(entries.localRuntimeLaunchProfile) &&
      truthy(getPath(entries.localRuntimeLaunchProfile, ["runtimeTruth", "localOperatorLaunchProfileDocumented"])),
    internalTesterWatchdogKnown:
      pass(entries.internalTesterWatchdog) &&
      truthy(getPath(entries.internalTesterWatchdog, ["runtimeTruth", "watchdogCanVerifyBaseRuntime"])) &&
      truthy(getPath(entries.internalTesterWatchdog, ["runtimeTruth", "noProviderQuotaByDefault"])) &&
      truthy(getPath(entries.internalTesterWatchdog, ["runtimeTruth", "stopsLoopProcessesOnly"])) &&
      getPath(entries.internalTesterWatchdog, ["runtimeTruth", "installedOsService"]) === false &&
      truthy(getPath(entries.internalTesterWatchdog, ["iterations", "0", "runtimePassAfterIteration"])) &&
      getPath(entries.internalTesterWatchdog, ["iterations", "0", "supervisorProofExitCode"]) === 0 &&
      getPath(entries.internalTesterWatchdog, ["iterations", "0", "resultPollerProofExitCode"]) === 0 &&
      truthy(getPath(entries.internalTesterWatchdog, ["cleanup", "supervisor", "pass"])) &&
      truthy(getPath(entries.internalTesterWatchdog, ["cleanup", "resultPoller", "pass"])),
    internalTesterWatchdogFresh: typeof watchdogAgeHours === "number" && watchdogAgeHours <= maxWatchdogAgeHours,
  };
  const p0 = Object.entries(checks)
    .filter(([, value]) => value !== true)
    .map(([key]) => key);
  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "holiwyn-live-runtime-completion-audit",
    pass: p0.length === 0,
    providerQuotaUsed: false,
    event: {
      title: eventTitle ?? null,
      providerEventId: getPath(entries.runtimeStatus, ["event", "providerEventId"]) ?? null,
      sportKey: getPath(entries.runtimeStatus, ["event", "sportKey"]) ?? null,
      commenceTime: commenceTime ?? null,
      localSlug: getPath(entries.runtimeStatus, ["event", "localSlug"]) ?? null,
    },
    answers: {
      marketMakerContinuous:
        "Foreground/local supervisor proof shows maker reseeding while the supervisor runs; no installed OS service exists.",
      oddsRefreshLiveOrReplay:
        "Cached runtime checks use replay/stored proof and no quota. Live provider refresh is proven, explicit, and requires live-provider flags plus THE_ODDS_API_KEY.",
      oddsRefreshCadence: {
        liveProofIterations: getPath(entries.runtimeStatus, ["provider", "policy", "refreshIterations"]),
        liveProofIntervalMs: getPath(entries.runtimeStatus, ["provider", "policy", "refreshIntervalMs"]),
        supervisorProviderProofCadence:
          "Only when -RunProviderProof is passed; capped by MaxProviderProofRuns and ProviderProofEveryIterations.",
      },
      quotaProtection: {
        lastLiveProofCost: getPath(entries.runtimeStatus, ["provider", "quota", "totalLastCost"]),
        requestsRemaining: getPath(entries.runtimeStatus, ["provider", "quota", "requestsRemaining"]),
        maxCredits: getPath(entries.runtimeStatus, ["provider", "policy", "maxCredits"]),
        minRemaining: getPath(entries.runtimeStatus, ["provider", "policy", "minRemaining"]),
        oneEventOnly: getPath(entries.liveProviderProof, ["policy", "oneEventOnly"]),
      },
      freshness: {
        liveProofAgeHours,
        maxLiveProofAgeHours,
        watchdogAgeHours,
        maxWatchdogAgeHours,
      },
      staleHandling:
        "Routes classify ready/refresh_due/stale/unavailable; stale guard proof pauses stale markets and order placement rejects with MARKET_UNAVAILABLE, then restores.",
      lifecycle:
        "Open/paused/closed are proven on the active event lifecycle controls; settlement mechanics and trusted-result scheduler execution are proven on disposable/clone markets while active event remains guarded.",
      mobileTrading:
        "S23 proof covers Home -> Event Detail -> line market -> ticket -> buy -> Portfolio -> cashout/sell -> History for the provider-backed event.",
      activeSettlement:
        getPath(entries.activeSettlementReadiness, ["executionDecision", "operatorDecision"]) ?? null,
      activeSettlementClosedEligibility:
        getPath(entries.activeSettlementClosedEligibility, ["closedStateDecision", "operatorDecisionWhenClosed"]) ?? null,
      resultReview:
        "Local result-review API is phase-gated through /api/internal/live-runtime/result-review, reads canonical result/preflight/approval evidence, writes a redacted durable OfficialResultReview row, and does not spend provider quota.",
      settlementQueue:
        "Local settlement-queue API is phase-gated through /api/internal/live-runtime/settlement-queue, reads durable OfficialResultReview rows, reports pending/approved execution state, and redacts exact confirmation strings.",
      providerRefreshRuns:
        "Bounded live provider refresh proof is persisted as ProviderRefreshRun; local runtime status requires the latest selected-event run to be passed, quota-protected, within budget, stale-before-refresh, and ready-after-refresh without spending quota from the status route.",
      marketMakerQuoteRuns:
        "Shifted local maker quote proof is persisted as MarketMakerQuoteRun; local runtime status requires the latest selected-market run to be passed, local-only, shifted worse than provider, quote-route visible, backed by a fresh provider snapshot, and supported by at least two repeated local maker seed runs without claiming an installed OS service.",
      providerMakerHandoff:
        "Provider-to-maker handoff is proven by a no-quota report that verifies the latest selected-event provider refresh has a later shifted local maker quote run for the same event, market, and outcome.",
      runtimeHeartbeats:
        "Supervisor and result-poller loops emit worker-owned RuntimeServiceHeartbeat rows; local runtime status preserves that evidence without claiming an installed OS service.",
      runtimeRuns:
        "Supervisor and result-poller loops emit worker-owned RuntimeServiceRun rows when a run finishes; local runtime status requires latest passed rows for both services without quota spend, active settlement execution, or installed-service claims.",
      currentRuntimeState:
        "Local runtime status now separates proven capability from current warm-runtime state, including whether the supervisor/result-poller are running now, whether any running loop spends provider quota, and what operator action should happen next.",
      currentRuntimeWarmProof:
        "A local proof starts backend/Expo plus supervisor/result-poller loops, verifies /api/internal/live-runtime/status reports warm_no_quota_runtime with both loops running and no provider quota, then stops the loops again.",
      oneCommandRuntimeLoopProof:
        "The one-command onboarding wrapper can explicitly start the local supervisor/result-poller loops, prove both are running, and stop both afterward without spending provider quota.",
      localWatchdog:
        "Internal tester watchdog verifies backend/Expo/Postgres readiness, repeated supervisor proof, background result-poller proof, no-quota default mode, and loop cleanup.",
    },
    runtimeTruth: {
      phaseCompleteForLocalInternalRuntime: p0.length === 0,
      fullProductionRuntimeComplete: false,
      installedUnattendedService: false,
      internalTesterWatchdogPass: pass(entries.internalTesterWatchdog),
      providerQuotaUsedByThisAudit: false,
      activeTesterSettlementExecutionAttempted:
        getPath(entries.activeSettlementReadiness, ["runtimeTruth", "activeEventSettlementExecutionAttempted"]) ?? null,
      activeEventClosedStateEligibilityProven:
        getPath(entries.activeSettlementClosedEligibility, ["runtimeTruth", "provesActiveEventClosedStateEligibility"]) ?? null,
      s23ProofDevice: getPath(entries.s23Visible, ["device"]) ?? null,
    },
    sourceEvidence: PATHS,
    checks,
    gaps: {
      p0,
      p1: [
        "Installed unattended provider/maker/lifecycle service ownership remains open.",
        "Production official-result auto-settlement remains open; active-event execution is still guarded by CLOSED market status and exact confirmation.",
      ],
      p2: ["Multi-event provider polling and production dashboard/operator UI remain future work."],
    },
  };

  await writeJson(outputPath, summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.pass) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
