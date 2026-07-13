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
  internalTesterOperatorSnapshot:
    "docs/mobile/harness/odds-api-live-runtime/internal-tester-operator-snapshot.redacted.json",
  managerOwnedExpoStart:
    "docs/mobile/harness/odds-api-live-runtime/manager-owned-expo-start-summary.redacted.json",
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
  s23Visible:
    "docs/mobile/harness/cycle-ZD-spain-france-cashout-fresh/cycle-ZD-SPAIN-FRANCE-CASHOUT-FRESH-odds-api-s23-visible-flow.json",
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

function isSpainFranceOddsApiVisibleProof(proof: JsonObject | null) {
  if (!pass(proof)) return false;
  const eventSlug = getPath(proof, ["eventSlug"]);
  const expectedTitle = getPath(proof, ["expectedTitle"]);
  return (
    eventSlug === "odds-api-single-soccer-test" ||
    expectedTitle === "Spain vs. France" ||
    getPath(proof, ["selectedMarket", "referenceSource"]) === "sportsbook-odds"
  );
}

async function resolveLatestS23VisibleProofPath() {
  const fallback = PATHS.s23Visible;
  const harnessRoot = "docs/mobile/harness";
  let entries: string[] = [];
  try {
    entries = await fs.readdir(harnessRoot);
  } catch {
    return fallback;
  }

  const candidates = await Promise.all(
    entries
      .filter((name) => /^cycle-/i.test(name))
      .map(async (name) => {
        const dirPath = path.join(harnessRoot, name);
        const files = await fs.readdir(dirPath).catch(() => []);
        const proofFile = files.find((file) => /odds-api-s23-visible-flow\.json$/i.test(file));
        if (!proofFile) return null;
        const proofPath = path.join(dirPath, proofFile).replace(/\\/g, "/");
        const proof = await readJson(proofPath);
        if (
          !isSpainFranceOddsApiVisibleProof(proof) ||
          !truthy(getPath(proof, ["assertions", "cashoutTicketIsClosePositionMode"])) ||
          !truthy(getPath(proof, ["assertions", "cashoutMaxUsesOwnedShares"])) ||
          !truthy(getPath(proof, ["assertions", "cashoutTicketHidesYesNoSelector"]))
        ) {
          return null;
        }
        const generatedAt = getPath(proof, ["generatedAt"]);
        const timestamp = typeof generatedAt === "string" ? Date.parse(generatedAt) : NaN;
        return { proofPath, timestamp: Number.isFinite(timestamp) ? timestamp : 0 };
      }),
  );

  const latest = candidates
    .filter((candidate): candidate is { proofPath: string; timestamp: number } => candidate !== null)
    .sort((a, b) => b.timestamp - a.timestamp)[0];
  return latest?.proofPath ?? fallback;
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
  PATHS.s23Visible = await resolveLatestS23VisibleProofPath();
  const entries = Object.fromEntries(
    await Promise.all(Object.entries(PATHS).map(async ([key, filePath]) => [key, await readJson(filePath)])),
  ) as Record<keyof typeof PATHS, JsonObject | null>;
  const internalTesterRuntimeScript = await fs.readFile("scripts/manage_holiwyn_internal_tester_runtime.ps1", "utf8");

  const eventTitle =
    getPath(entries.runtimeStatus, ["event", "title"]) ?? getPath(entries.liveProviderProof, ["event", "title"]);
  const commenceTime =
    getPath(entries.runtimeStatus, ["event", "commenceTime"]) ??
    getPath(entries.liveProviderProof, ["event", "commenceTime"]);
  const liveProofAgeHours = getPath(entries.runtimeStatus, ["provider", "liveProofAgeHours"]);
  const maxLiveProofAgeHours = getPath(entries.runtimeStatus, ["provider", "maxLiveProofAgeHours"]);
  const watchdogAgeHours = ageHours(getPath(entries.internalTesterWatchdog, ["generatedAt"]));
  const s23ProofAgeHours = ageHours(getPath(entries.s23Visible, ["generatedAt"]));
  const maxWatchdogAgeHours = 24;
  const maxS23ProofAgeHours = 24;
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
      getPath(entries.runtimeStatus, ["provenCapabilities", "installedOsService"]) === false &&
      getPath(entries.runtimeStatus, ["currentManagedProcesses", "checked"]) === true &&
      typeof getPath(entries.runtimeStatus, ["currentManagedProcesses", "allLoopsRunning"]) === "boolean" &&
      getPath(entries.runtimeStatus, ["currentManagedProcesses", "quotaSpendingLoopRunning"]) === false &&
      typeof getPath(entries.runtimeStatus, ["currentManagedProcesses", "localTesterReadyRightNow"]) === "boolean" &&
      getPath(entries.runtimeStatus, ["currentManagedProcesses", "supervisor", "checked"]) === true &&
      getPath(entries.runtimeStatus, ["currentManagedProcesses", "resultPoller", "checked"]) === true &&
      getPath(entries.runtimeStatus, ["continuityAnswer", "latestSupervisorRunProfileOnly"]) === true &&
      typeof getPath(entries.runtimeStatus, ["continuityAnswer", "currentLoopsRunningNow"]) === "boolean" &&
      getPath(entries.runtimeStatus, ["continuityAnswer", "currentLoopsQuotaSpending"]) === false &&
      getPath(entries.runtimeStatus, ["continuityAnswer", "marketMakerContinuousWhileSupervisorRuns"]) === true &&
      getPath(entries.runtimeStatus, ["continuityAnswer", "resultPollerContinuousWhileRunnerRuns"]) === true &&
      getPath(entries.runtimeStatus, ["continuityAnswer", "installedUnattendedService"]) === false,
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
      truthy(getPath(entries.runtimeStatus, ["checks", "makerSeedPassed"])) &&
      truthy(getPath(entries.runtimeStatus, ["checks", "selectedOutcomeQuoteFound"])) &&
      truthy(getPath(entries.runtimeStatus, ["checks", "selectedOutcomeBidVisible"])) &&
      truthy(getPath(entries.runtimeStatus, ["checks", "selectedOutcomeAskVisible"])),
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
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "structuredOperatorExecutionPlanAvailable"]) === true &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "durableApprovalEvidenceAvailable"]) === true &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "exactConfirmationStringsExposed"]) === false &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "exactConfirmationStored"]) === false &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "runtimeTruth", "activeMarketExecutionAttempted"]) === false &&
      typeof getPath(entries.phaseAudit, ["localSettlementQueue", "body", "queue", "itemCount"]) === "number" &&
      (getPath(entries.phaseAudit, ["localSettlementQueue", "body", "queue", "itemCount"]) as number) > 0 &&
      typeof getPath(entries.phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "operatorAction", "label"]) === "string" &&
      typeof getPath(entries.phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "operatorAction", "nextCommand"]) === "string" &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "operatorAction", "exactConfirmationExposed"]) === false &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "operatorAction", "providerQuotaRequired"]) === false &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "operatorExecutionPlan", "version"]) === 1 &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "operatorExecutionPlan", "providerQuotaRequired"]) === false &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "operatorExecutionPlan", "exactConfirmationExposed"]) === false &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "operatorExecutionPlan", "exactConfirmationStored"]) === false &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "approvalEvidence", "durableReviewRowAvailable"]) === true &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "approvalEvidence", "canonicalApprovalEventAvailable"]) === true &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "approvalEvidence", "exactConfirmationStored"]) === false &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "queue", "items", "0", "approvalEvidence", "exactConfirmationRedacted"]) === true &&
      getPath(entries.phaseAudit, ["localSettlementQueue", "body", "checks", "canonicalApprovalEvidenceForApprovedReviews"]) === true &&
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
    serviceOwnershipKnown:
      pass(entries.phaseAudit) &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "serviceOwnership", "checked"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "serviceOwnership", "serviceModel"]) ===
        "local_foreground_worker_processes" &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "serviceOwnership", "productionServiceInstalled"]) ===
        false &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "serviceOwnership", "installedOsService"]) === false &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "serviceOwnership", "foregroundSupervisorProven"]) ===
        true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "serviceOwnership", "foregroundResultPollerProven"]) ===
        true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "serviceOwnership", "foregroundLoopsProven"]) ===
        true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "serviceOwnership", "current", "quotaSpendingLoopRunning"]) ===
        false &&
      typeof getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "localLaunch",
        "recommendedProfileCommand",
      ]) === "string" &&
      typeof getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "localLaunch",
        "recommendedProfileInstallCommand",
      ]) === "string" &&
      typeof getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "localLaunch",
        "recommendedProfileUninstallCommand",
      ]) === "string" &&
      typeof getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "localLaunch",
        "recommendedProfileQuotaMode",
      ]) === "string" &&
      typeof getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "localLaunch",
        "recommendedProfileProductionBoundary",
      ]) === "string" &&
      typeof getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "localLaunch",
        "scheduledTaskPlanCommand",
      ]) === "string" &&
      typeof getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "localLaunch",
        "scheduledTaskInstallCommand",
      ]) === "string" &&
      typeof getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "localLaunch",
        "liveProviderCommand",
      ]) === "string" &&
      typeof getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "localLaunch",
        "liveProviderInternalTesterCommand",
      ]) === "string" &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "localLaunch",
        "liveProviderDefaultForInternalTesting",
      ]) === false &&
      typeof getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "localLaunch",
        "liveProviderQuotaMode",
      ]) === "string" &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "localLaunch",
        "ownershipProof",
        "startup",
        "installProofPass",
      ]) === true &&
      typeof getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "localLaunch",
        "ownershipProof",
        "startup",
        "launcherInstalledNow",
      ]) === "boolean" &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "localLaunch",
        "ownershipProof",
        "startup",
        "proofLeavesNoLauncher",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "localLaunch",
        "ownershipProof",
        "scheduledTask",
        "installAuditPass",
      ]) === true &&
      typeof getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "localLaunch",
        "ownershipProof",
        "scheduledTask",
        "installBlockedByWindowsPermission",
      ]) === "boolean" &&
      typeof getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "localLaunch",
        "ownershipProof",
        "scheduledTask",
        "installedNow",
      ]) === "boolean" &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "localLaunch",
        "ownershipProof",
        "foregroundProcesses",
        "noProviderQuotaByDefault",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "unattendedReadiness",
        "checked",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "unattendedReadiness",
        "classification",
      ]) === "local_user_startup_fallback_ready_scheduled_task_permission_blocked" &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "unattendedReadiness",
        "localInternalTesterReady",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "unattendedReadiness",
        "installedProductionServiceReady",
      ]) === false &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "unattendedReadiness",
        "productionDaemonInstalled",
      ]) === false &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "unattendedReadiness",
        "foregroundLoopsProven",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "unattendedReadiness",
        "startupFallbackProven",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "unattendedReadiness",
        "scheduledTaskPlanProven",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "unattendedReadiness",
        "scheduledTaskInstallBlockedByWindowsPermission",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "unattendedReadiness",
        "noProviderQuotaByDefault",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "unattendedReadiness",
        "recommendedInternalMode",
      ]) === "user_startup_fallback_or_manual_cached_runtime" &&
      Array.isArray(
        getPath(entries.phaseAudit, [
          "localRuntimeStatus",
          "body",
          "serviceOwnership",
          "unattendedReadiness",
          "p0",
        ]),
      ) &&
      (getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "unattendedReadiness",
        "p0",
      ]) as unknown[]).length === 0 &&
      Array.isArray(
        getPath(entries.phaseAudit, [
          "localRuntimeStatus",
          "body",
          "serviceOwnership",
          "unattendedReadiness",
          "p1",
        ]),
      ) &&
      (getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "unattendedReadiness",
        "p1",
      ]) as unknown[]).includes("installed_production_service_missing") &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "liveProviderMode",
        "statusRouteSpendsProviderQuota",
      ]) === false &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "liveProviderMode",
        "defaultInternalTesterModeSpendsProviderQuota",
      ]) === false &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "liveProviderMode",
        "requiresExplicitProviderFlag",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "liveProviderMode",
        "requiresTheOddsApiKeyForLiveProviderCalls",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "durableEvidence",
        "providerRefreshRunRecorded",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "durableEvidence",
        "providerRefreshQuotaProtected",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "durableEvidence",
        "marketMakerQuoteRunRecorded",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "durableEvidence",
        "runtimeHeartbeatsRecorded",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "durableEvidence",
        "runtimeRunsRecorded",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "serviceOwnership",
        "durableEvidence",
        "runtimeRunsPassed",
      ]) === true &&
      Array.isArray(getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "serviceOwnership", "p0"])) &&
      (getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "serviceOwnership", "p0"]) as unknown[]).length ===
        0,
    providerRefreshLoopKnown:
      pass(entries.phaseAudit) &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "providerRefreshLoop", "checked"]) === true &&
      typeof getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "providerRefreshLoop", "mode"]) ===
        "string" &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "providerRefreshLoop",
        "statusRouteSpendsProviderQuota",
      ]) === false &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "providerRefreshLoop",
        "requiresExplicitRunProviderProofFlag",
      ]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "providerRefreshLoop", "requiresTheOddsApiKey"]) ===
        true &&
      typeof getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "providerRefreshLoop",
        "cadence",
        "everyIterations",
      ]) === "number" &&
      typeof getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "providerRefreshLoop",
        "cadence",
        "maxRuns",
      ]) === "number" &&
      typeof getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "providerRefreshLoop",
        "cadence",
        "refreshIterationsPerRun",
      ]) === "number" &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "providerRefreshLoop",
        "quotaCaps",
        "latestRunWithinBudget",
      ]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "providerRefreshLoop", "latestRun", "recorded"]) ===
        true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "providerRefreshLoop", "latestRun", "status"]) ===
        "passed" &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "providerRefreshLoop",
        "latestRun",
        "staleBeforeRefresh",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "providerRefreshLoop",
        "latestRun",
        "readyAfterRefresh",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "providerRefreshLoop",
        "latestRun",
        "quotaProtected",
      ]) === true &&
      typeof getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "providerRefreshLoop",
        "mobileFreshness",
        "status",
      ]) === "string" &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "providerRefreshLoop",
        "mobileFreshness",
        "refreshDueSeconds",
      ]) === 60 &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "providerRefreshLoop",
        "mobileFreshness",
        "staleAfterSeconds",
      ]) === 90 &&
      Array.isArray(getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "providerRefreshLoop", "p0"])) &&
      (getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "providerRefreshLoop", "p0"]) as unknown[]).length ===
        0,
    settlementAutomationKnown:
      pass(entries.phaseAudit) &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "settlementAutomation", "checked"]) === true &&
      typeof getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "settlementAutomation", "mode"]) ===
        "string" &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "settlementAutomation",
        "resultPolling",
        "defaultModeSpendsProviderQuota",
      ]) === false &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "settlementAutomation",
        "resultPolling",
        "liveResultIngestionRequiresExplicitFlag",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "settlementAutomation",
        "resultPolling",
        "liveResultIngestionRequiresProviderKey",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "settlementAutomation",
        "resultPolling",
        "provenBackgroundPolling",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "settlementAutomation",
        "resultPolling",
        "settlementSchedulerWhilePollerRuns",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "settlementAutomation",
        "approvedScheduler",
        "supervisorWaitModeProven",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "settlementAutomation",
        "approvedScheduler",
        "schedulerWhileSupervisorRuns",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "settlementAutomation",
        "approvedScheduler",
        "activeEventExecutionAttempted",
      ]) === false &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "settlementAutomation",
        "approvedScheduler",
        "activeEventSettlementExecuted",
      ]) === false &&
      typeof getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "settlementAutomation",
        "activeEvent",
        "marketStatus",
      ]) === "string" &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "settlementAutomation",
        "activeEvent",
        "approvedReview",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "settlementAutomation",
        "activeEvent",
        "closedStateEligibilityProven",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "settlementAutomation",
        "safety",
        "providerQuotaUsedByStatus",
      ]) === false &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "settlementAutomation",
        "safety",
        "providerQuotaRequiredForExecutionPlan",
      ]) === false &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "settlementAutomation",
        "safety",
        "exactConfirmationRequiredKnown",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "settlementAutomation",
        "safety",
        "exactConfirmationStored",
      ]) === false &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "settlementAutomation",
        "safety",
        "exactConfirmationRedacted",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "settlementAutomation",
        "safety",
        "exactConfirmationExposed",
      ]) === false &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "settlementAutomation",
        "safety",
        "requiresClosedMarket",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "settlementAutomation",
        "safety",
        "requiresApproval",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "settlementAutomation",
        "safety",
        "requiresExactConfirmation",
      ]) === true &&
      Array.isArray(getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "settlementAutomation", "p0"])) &&
      (getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "settlementAutomation", "p0"]) as unknown[])
        .length === 0,
    productionReadinessBoundaryKnown:
      pass(entries.phaseAudit) &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "productionReadinessBoundary", "checked"]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "productionReadinessBoundary",
        "localInternalRuntimeReady",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "productionReadinessBoundary",
        "productionReady",
      ]) === false &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "productionReadinessBoundary",
        "fullProductionRuntimeComplete",
      ]) === false &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "productionReadinessBoundary",
        "fakeTokenOnly",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "productionReadinessBoundary",
        "noRealMoneyDeployment",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "productionReadinessBoundary",
        "providerRefreshStatusRouteSpendsQuota",
      ]) === false &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "productionReadinessBoundary",
        "officialResultAutomation",
        "activeEventExecutionAttempted",
      ]) === false &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "productionReadinessBoundary",
        "officialResultAutomation",
        "activeEventSettlementExecuted",
      ]) === false &&
      Array.isArray(
        getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "productionReadinessBoundary", "productionBlockers"]),
      ) &&
      (getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "productionReadinessBoundary",
        "productionBlockers",
      ]) as unknown[]).includes("installed_unattended_runtime_service_missing") &&
      (getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "productionReadinessBoundary",
        "productionBlockers",
      ]) as unknown[]).includes("production_auto_settlement_execution_not_enabled") &&
      Array.isArray(getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "productionReadinessBoundary", "p0"])) &&
      (getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "productionReadinessBoundary", "p0"]) as unknown[])
        .length === 0,
    operatorControlBoundaryKnown:
      pass(entries.phaseAudit) &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "operatorControlBoundary", "checked"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "operatorControlBoundary", "mode"]) ===
        "local_dev_read_only_operator_controls" &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "operatorControlBoundary", "devOnly"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "operatorControlBoundary", "readOnly"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "operatorControlBoundary", "noProviderQuota"]) === true &&
      getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "operatorControlBoundary", "publicMobileRoute"]) ===
        false &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "productionOperatorWorkflowReady",
      ]) === false &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "authenticatedControls",
        "requiredForProduction",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "authenticatedControls",
        "available",
      ]) === false &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "authenticatedControls",
        "sessionRouteAvailable",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "authenticatedControls",
        "roleChecksAvailable",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "authenticatedControls",
        "durableOperatorIdentityAvailable",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "productionAuthRequirements",
        "version",
      ]) === 1 &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "productionAuthRequirements",
        "status",
      ]) === "session_route_implemented" &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "productionAuthRequirements",
        "p1Gap",
      ]) === "authenticated_operator_controls_missing" &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "productionAuthRequirements",
        "publicMobileRouteAllowed",
      ]) === false &&
      Array.isArray(
        getPath(entries.phaseAudit, [
          "localRuntimeStatus",
          "body",
          "operatorControlBoundary",
          "productionAuthRequirements",
          "requiredRoutes",
        ]),
      ) &&
      (getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "productionAuthRequirements",
        "requiredRoutes",
      ]) as unknown[]).some(
        (route) =>
          route &&
          typeof route === "object" &&
          getPath(route, ["id"]) === "operator_session" &&
          getPath(route, ["method"]) === "GET" &&
          getPath(route, ["mutatesState"]) === false &&
          getPath(route, ["implementationStatus"]) === "implemented_read_only",
      ) &&
      (getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "productionAuthRequirements",
        "requiredRoutes",
      ]) as unknown[]).some(
        (route) =>
          route &&
          typeof route === "object" &&
          getPath(route, ["id"]) === "settlement_approval" &&
          getPath(route, ["method"]) === "POST" &&
          getPath(route, ["mutatesState"]) === true &&
          getPath(route, ["implementationStatus"]) === "implemented_guarded_no_execution" &&
          getPath(route, ["exactConfirmationStored"]) === false &&
          getPath(route, ["activeSettlementExecution"]) === false,
      ) &&
      (getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "productionAuthRequirements",
        "requiredRoutes",
      ]) as unknown[]).some(
        (route) =>
          route &&
          typeof route === "object" &&
          getPath(route, ["id"]) === "settlement_execution" &&
          getPath(route, ["requiresClosedMarket"]) === true &&
          getPath(route, ["requiresExactConfirmation"]) === true &&
          getPath(route, ["implementationStatus"]) === "implemented_guarded_exact_confirmation_local_execution" &&
          getPath(route, ["dryRunOnly"]) === false &&
          getPath(route, ["exactConfirmationExecutionSupported"]) === true &&
          getPath(route, ["executeRequiresApproval"]) === true &&
          getPath(route, ["executeRequiresTwoPersonOrAdminPolicy"]) === true &&
          getPath(route, ["exactConfirmationStored"]) === false &&
          getPath(route, ["activeSettlementExecution"]) === false,
      ) &&
      Array.isArray(
        getPath(entries.phaseAudit, [
          "localRuntimeStatus",
          "body",
          "operatorControlBoundary",
          "productionAuthRequirements",
          "requiredSchema",
        ]),
      ) &&
      (getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "productionAuthRequirements",
        "requiredSchema",
      ]) as unknown[]).some(
        (model) =>
          model &&
          typeof model === "object" &&
          getPath(model, ["model"]) === "OperatorAuditEvent" &&
          getPath(model, ["status"]) === "implemented_dedicated_operator_audit_table",
      ) &&
      Array.isArray(
        getPath(entries.phaseAudit, [
          "localRuntimeStatus",
          "body",
          "operatorControlBoundary",
          "productionAuthRequirements",
          "requiredGuards",
        ]),
      ) &&
      (getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "productionAuthRequirements",
        "requiredGuards",
      ]) as unknown[]).includes("public_mobile_routes_must_not_expose_operator_controls") &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "localControls",
        "operatorSessionRoute",
        "available",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "localControls",
        "operatorSessionRoute",
        "mutatesState",
      ]) === false &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "localControls",
        "settlementApprovalRoute",
        "available",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "localControls",
        "settlementApprovalRoute",
        "mutationScope",
      ]) === "approval_evidence_only" &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "localControls",
        "settlementApprovalRoute",
        "operatorAuditEventRecorded",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "localControls",
        "settlementExecutionRoute",
        "exactConfirmationExecutionSupported",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "localControls",
        "settlementExecutionRoute",
        "executeRequiresClosedMarket",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "localControls",
        "settlementExecutionRoute",
        "executeRequiresApproval",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "localControls",
        "settlementExecutionRoute",
        "executeRequiresExactConfirmation",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "localControls",
        "settlementExecutionRoute",
        "operatorAuditEventRecorded",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "localControls",
        "settlementExecutionRoute",
        "twoPersonOrAdminPolicyChecked",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "localControls",
        "settlementApprovalRoute",
        "exactConfirmationStored",
      ]) === false &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "localControls",
        "resultReviewRoute",
        "available",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "localControls",
        "resultReviewRoute",
        "authRequired",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "localControls",
        "settlementQueueRoute",
        "available",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "localControls",
        "settlementQueueRoute",
        "authRequired",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "localControls",
        "approvedSchedulerCommand",
        "exactConfirmationArgumentRedacted",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "executionSafety",
        "activeExecutionAttempted",
      ]) === false &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "executionSafety",
        "activeSettlementExecuted",
      ]) === false &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "executionSafety",
        "requiresClosedMarket",
      ]) === true &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "executionSafety",
        "exactConfirmationExposed",
      ]) === false &&
      getPath(entries.phaseAudit, [
        "localRuntimeStatus",
        "body",
        "operatorControlBoundary",
        "executionSafety",
        "exactConfirmationStored",
      ]) === false &&
      Array.isArray(getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "operatorControlBoundary", "p0"])) &&
      (getPath(entries.phaseAudit, ["localRuntimeStatus", "body", "operatorControlBoundary", "p0"]) as unknown[])
        .length === 0,
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
      getPath(entries.onboarding, ["runtimeTruth", "replaceExternalExpoRequested"]) === true &&
      getPath(entries.onboarding, ["runtimeTruth", "verifiedServerModeExpoDuringRuntimeStart"]) === true &&
      getPath(entries.onboardingRuntimeStart, ["action"]) === "start" &&
      getPath(entries.onboardingRuntimeStart, ["expo", "serverModeVerified"]) === true &&
      getPath(entries.onboardingRuntimeStart, ["runtimeTruth", "managerStartedExpoUsesServerMode"]) === true &&
      getPath(entries.onboardingRuntimeStart, ["runtimeTruth", "externalExpoServerModeUnverified"]) === false &&
      getPath(entries.onboardingRuntimeStart, ["runtimeTruth", "replaceExternalExpoRequested"]) === true &&
      getPath(entries.onboardingRuntimeStart, ["runtimeTruth", "s23AdbReverseConfiguredOnStart"]) === true &&
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
      typeof s23ProofAgeHours === "number" &&
      s23ProofAgeHours <= maxS23ProofAgeHours &&
      truthy(getPath(entries.s23Visible, ["assertions", "swipeSubmitReachedPortfolio"])) &&
      truthy(getPath(entries.s23Visible, ["assertions", "cashoutTicketIsClosePositionMode"])) &&
      truthy(getPath(entries.s23Visible, ["assertions", "cashoutMaxUsesOwnedShares"])) &&
      truthy(getPath(entries.s23Visible, ["assertions", "cashoutTicketHidesYesNoSelector"])) &&
      truthy(getPath(entries.s23Visible, ["assertions", "cashoutSellSubmitted"])) &&
      truthy(getPath(entries.s23Visible, ["assertions", "historyPreservesSportsbookLineIdentity"])),
      launchProfileKnown:
        pass(entries.localRuntimeLaunchProfile) &&
        truthy(getPath(entries.localRuntimeLaunchProfile, ["runtimeTruth", "localOperatorLaunchProfileDocumented"])) &&
        truthy(
          getPath(entries.localRuntimeLaunchProfile, [
            "runtimeTruth",
            "verifiedExpoReplacementCommandDocumented",
          ]),
        ) &&
        (getPath(entries.localRuntimeLaunchProfile, ["launchProfiles", "manualForegroundProfile", "commands"]) as
          | unknown[]
          | null)?.some(
          (entry) =>
            entry &&
            typeof entry === "object" &&
            getPath(entry, ["command"]) ===
              "npm run mobile:internal-tester-runtime -- -Action start -Force -ReplaceExternalExpo -WaitForReady",
        ) === true,
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
    internalTesterOperatorSnapshotKnown:
      pass(entries.internalTesterOperatorSnapshot) &&
      getPath(entries.internalTesterOperatorSnapshot, ["providerQuotaUsedByThisReport"]) === false &&
      getPath(entries.internalTesterOperatorSnapshot, ["runtime", "localInternalRuntimeReady"]) === true &&
      typeof getPath(entries.internalTesterOperatorSnapshot, [
        "operatorNextActions",
        "recommendedCommand",
      ]) === "string" &&
      typeof getPath(entries.internalTesterOperatorSnapshot, [
        "operatorNextActions",
        "selectedAction",
        "spendsProviderQuota",
      ]) === "boolean" &&
      getPath(entries.internalTesterOperatorSnapshot, ["settlement", "activeTesterSettlementExecutionAttempted"]) ===
        false &&
      Array.isArray(getPath(entries.internalTesterOperatorSnapshot, ["gaps", "p0"])) &&
      (getPath(entries.internalTesterOperatorSnapshot, ["gaps", "p0"]) as unknown[]).length === 0,
    managedS23ServerModeStartupKnown:
      pass(entries.managerOwnedExpoStart) &&
      getPath(entries.managerOwnedExpoStart, ["action"]) === "start" &&
      getPath(entries.managerOwnedExpoStart, ["expo", "serverModeVerified"]) === true &&
      getPath(entries.managerOwnedExpoStart, ["runtimeTruth", "managerStartedExpoUsesServerMode"]) === true &&
      getPath(entries.managerOwnedExpoStart, ["runtimeTruth", "externalExpoServerModeUnverified"]) === false &&
      getPath(entries.managerOwnedExpoStart, ["runtimeTruth", "replaceExternalExpoRequested"]) === true &&
      getPath(entries.managerOwnedExpoStart, ["runtimeTruth", "s23AdbReverseConfiguredOnStart"]) === true &&
      internalTesterRuntimeScript.includes("EXPO_PUBLIC_API_BASE_URL = '$BackendBaseUrl'") &&
      internalTesterRuntimeScript.includes("EXPO_PUBLIC_GOOGLE_AUTH_BASE_URL = '$BackendBaseUrl'") &&
      internalTesterRuntimeScript.includes("EXPO_PUBLIC_ORDER_MODE = 'server'") &&
        internalTesterRuntimeScript.includes("EXPO_PUBLIC_MARKET_DATA_MODE = 'server'") &&
        internalTesterRuntimeScript.includes("EXPO_PUBLIC_SHOW_ORDERBOOK = '0'") &&
        internalTesterRuntimeScript.includes("npm --prefix mobile run start -- --host localhost --port $ExpoPort") &&
        internalTesterRuntimeScript.includes("Invoke-AdbWithTimeout") &&
        internalTesterRuntimeScript.includes('"reverse", "tcp:$port", "tcp:$port"') &&
        internalTesterRuntimeScript.includes("s23_adb_reverse_failed") &&
        internalTesterRuntimeScript.includes("managerStartedExpoUsesServerMode") &&
        internalTesterRuntimeScript.includes("externalExpoServerModeUnverified") &&
        internalTesterRuntimeScript.includes("external_listener_unverified") &&
        internalTesterRuntimeScript.includes("ReplaceExternalExpo") &&
        internalTesterRuntimeScript.includes("replaceExternalExpoAvailable") &&
        internalTesterRuntimeScript.includes("Use -Force -ReplaceExternalExpo"),
  };
  const p0 = Object.entries(checks)
    .filter(([, value]) => value !== true)
    .map(([key]) => key);
  const completionRequirements = {
    marketMakerContinuity: {
      pass:
        checks.marketMakerContinuityKnown &&
        checks.durableMarketMakerQuoteRunKnown &&
        checks.providerMakerHandoffKnown,
      answer:
        "Local market making is continuous only while the foreground/local supervisor runs; durable maker quote rows and provider-to-maker handoff are proven, but no installed OS service exists.",
      evidence: [
        PATHS.runtimeStatus,
        PATHS.providerMakerHandoff,
        "localRuntimeStatus.providerRefreshRuns",
        "localRuntimeStatus.marketMakerQuoteRuns",
      ],
    },
    oddsRefreshMode: {
      pass:
        checks.liveProviderProofPass &&
        checks.oddsRefreshModeKnown &&
        checks.oddsRefreshCadenceKnown &&
        checks.durableProviderRefreshRunKnown &&
        checks.providerRefreshLoopKnown,
      answer:
        "Cached runtime checks use replay/stored proof without quota; live provider refresh is explicit, key-gated, quota-capped, persisted as ProviderRefreshRun evidence, and exposed through a machine-readable providerRefreshLoop policy/status block.",
      evidence: [
        PATHS.runtimeStatus,
        PATHS.liveProviderProof,
        "localRuntimeStatus.providerRefreshRuns",
        "localRuntimeStatus.providerRefreshLoop",
      ],
    },
    quotaProtection: {
      pass: checks.providerQuotaKnownAndProtected,
      answer:
        "Provider quota is protected by one-event scope, explicit live flags, max credit/min remaining limits, and status/audit routes that do not call the provider.",
      evidence: [PATHS.runtimeStatus, PATHS.liveProviderProof, "docs/mobile/ODDS_PROVIDER_REFRESH_POLICY.md"],
    },
    staleOddsHandling: {
      pass: checks.staleHandlingKnown,
      answer:
        "Mobile routes classify ready/refresh_due/stale/unavailable, stale guard can pause stale markets, and order placement rejects stale markets with MARKET_UNAVAILABLE.",
      evidence: [PATHS.staleGuardProof, PATHS.staleGuardRun, PATHS.runtimeStatus],
    },
    eventLifecycle: {
      pass:
        checks.lifecycleOpenPausedClosedSettledKnown &&
        checks.activeSettlementDecisionKnown &&
        checks.activeSettlementClosedEligibilityKnown &&
        checks.localSettlementQueueApiKnown,
      answer:
        "Open, paused, closed, and settlement mechanics are proven locally; active event settlement is guarded until CLOSED with approval and exact confirmation evidence.",
      evidence: [
        PATHS.lifecycleMatrix,
        PATHS.activeSettlementReadiness,
        PATHS.activeSettlementClosedEligibility,
        "localSettlementQueue",
      ],
    },
    oneEventMobileTrading: {
      pass:
        checks.oneRealUpcomingEventKnown &&
        checks.makerQuoteAvailable &&
        checks.mobileS23EndToEndTradeProofPass,
      answer:
        "One real upcoming soccer event is visible and tradable from S23 through event detail, quote, buy, portfolio, cashout/sell, and history proof.",
      evidence: [PATHS.liveReadiness, PATHS.s23Visible],
    },
    runtimeLaunch: {
      pass:
        checks.launchProfileKnown &&
        checks.internalTesterWatchdogKnown &&
        checks.currentRuntimeStateKnown &&
        checks.serviceOwnershipKnown &&
        checks.productionReadinessBoundaryKnown &&
        checks.operatorControlBoundaryKnown &&
        checks.currentRuntimeWarmStateProofKnown &&
        checks.oneCommandRuntimeLoopProofKnown &&
        checks.internalTesterOperatorSnapshotKnown &&
        checks.managedS23ServerModeStartupKnown,
        answer:
          "Local runtime can be launched through documented no-quota commands, observed warm with supervisor and result poller running, starts managed Expo in server-backed S23 mode, flags reused external Expo listeners as unverified, provides an explicit -Force -ReplaceExternalExpo path for verified manager-owned S23 startup, exposes explicit foreground-vs-installed service ownership plus read-only operator-control boundaries, provides a compact operator snapshot, and cleans up after proof.",
      evidence: [
        PATHS.localRuntimeLaunchProfile,
        PATHS.internalTesterWatchdog,
        PATHS.internalTesterOperatorSnapshot,
        PATHS.managerOwnedExpoStart,
        PATHS.currentRuntimeStateProof,
        PATHS.onboarding,
        "scripts/manage_holiwyn_internal_tester_runtime.ps1",
        "localRuntimeStatus.operatorControlBoundary",
      ],
    },
  };
  const completionRequirementP0 = Object.entries(completionRequirements)
    .filter(([, value]) => value.pass !== true)
    .map(([key]) => key);
  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "holiwyn-live-runtime-completion-audit",
    pass: p0.length === 0 && completionRequirementP0.length === 0,
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
        s23ProofAgeHours,
        maxS23ProofAgeHours,
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
      s23ProofAgeHours,
      maxS23ProofAgeHours,
    },
    sourceEvidence: PATHS,
    checks,
    completionRequirements,
    gaps: {
      p0: [...p0, ...completionRequirementP0.map((key) => `completion_requirement_failed:${key}`)],
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
