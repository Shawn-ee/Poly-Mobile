import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json";

const PATHS = {
  runtimeStatus: "docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json",
  phaseAudit: "docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json",
  liveProviderProof: "docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json",
  liveReadiness: "docs/mobile/harness/odds-api-live-runtime/one-event-live-readiness-summary.redacted.json",
  localRuntimeLaunchProfile:
    "docs/mobile/harness/odds-api-live-runtime/local-runtime-launch-profile-summary.redacted.json",
  internalTesterWatchdog:
    "docs/mobile/harness/odds-api-live-runtime/internal-tester-watchdog-summary.redacted.json",
  staleGuardProof: "docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-summary.redacted.json",
  staleGuardRun: "docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-run-summary.redacted.json",
  lifecycleMatrix: "docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-matrix-summary.redacted.json",
  activeSettlementReadiness:
    "docs/mobile/harness/odds-api-live-runtime/one-event-active-settlement-readiness-summary.redacted.json",
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
    marketMakerContinuityKnown:
      truthy(getPath(entries.runtimeStatus, ["provenCapabilities", "makerReseedWhileSupervisorRuns"])) &&
      truthy(getPath(entries.runtimeStatus, ["provenCapabilities", "repeatedSupervisorCycles"])) &&
      getPath(entries.runtimeStatus, ["provenCapabilities", "installedOsService"]) === false,
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
      getPath(entries.phaseAudit, ["localResultReview", "body", "executionDecision", "exactConfirmationRequiredKnown"]) === true &&
      getPath(entries.phaseAudit, ["localResultReview", "body", "executionDecision", "exactConfirmationRedacted"]) === true &&
      getPath(entries.phaseAudit, ["localResultReview", "body", "executionDecision", "activeMarketExecutionAttemptedByThisRoute"]) === false &&
      Array.isArray(getPath(entries.phaseAudit, ["localResultReview", "body", "gaps", "p0"])) &&
      (getPath(entries.phaseAudit, ["localResultReview", "body", "gaps", "p0"]) as unknown[]).length === 0,
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
      resultReview:
        "Local result-review API is phase-gated through /api/internal/live-runtime/result-review, reads canonical result/preflight/approval evidence, redacts exact confirmation strings, and does not spend provider quota.",
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
