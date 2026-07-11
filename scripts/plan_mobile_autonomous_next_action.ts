import fs from "node:fs";
import path from "node:path";

type ReadinessSummary = {
  generatedAt?: string;
  readiness?: {
    localMvpReadyForInternalTesting?: boolean;
    s23LocalMvpDeviceProofReady?: boolean;
    s23ProofNextStaleName?: string | null;
    s23ProofNextStaleAt?: string | null;
    s23ProofHoursUntilStale?: number | null;
    cachedProviderEvidenceFresh?: boolean;
    cachedProviderEvidenceNextStaleName?: string | null;
    cachedProviderEvidenceNextStaleAt?: string | null;
    cachedProviderEvidenceHoursUntilStale?: number | null;
    providerBackedExchangeReady?: boolean;
    rootTypecheckReady?: boolean;
    jestCiReady?: boolean;
    mobileTypecheckReady?: boolean;
  };
  blockers?: {
    p0?: string[];
    p1?: string[];
    p2?: string[];
  };
  recovery?: {
    s23ProofRefreshCommands?: { name?: string; command?: string }[];
    providerRefreshCommand?: string;
    rerunBatchCommand?: string;
  };
};

type ProviderEvidencePlan = {
  status?: string;
  shouldRefreshProviderEvidence?: boolean;
  providerRefreshCommand?: string;
  rerunBatchCommand?: string;
  nextStaleName?: string | null;
  nextStaleAt?: string | null;
  hoursUntilStale?: number | null;
  providerBlockers?: string[];
};

type DefinitionOfDoneSweep = {
  readyToDeclareDone?: boolean;
  counts?: {
    verified?: number;
    partial?: number;
    blocked?: number;
  };
  criteria?: { id?: string; status?: string; notes?: string }[];
};

type OddsApiSingleEventProof = {
  pass?: boolean;
  mobile?: {
    homeVisible?: boolean;
    detailVisible?: boolean;
    sportsbookMarketCount?: number;
    tradableOutcomeCount?: number;
    eventSlug?: string;
  };
  checks?: {
    homeVisible?: boolean;
    detailVisible?: boolean;
    fakeTokenOrderFilled?: boolean;
    portfolioPositionVisible?: boolean;
    historyTradeVisible?: boolean;
  };
};

type S23ReachabilityProof = {
  pass?: boolean;
  proofLimitations?: string[];
};

type OddsApiS23VisibleProof = {
  result?: string;
  assertions?: {
    homeShowsTemporarySportsbookEvent?: boolean;
    detailShowsGameLines?: boolean;
    sportsbookSpreadLineVisible?: boolean;
    ticketPreservesSportsbookLineIdentity?: boolean;
    swipeSubmitReachedPortfolio?: boolean;
    portfolioPreservesSportsbookLineIdentity?: boolean;
    historyPreservesSportsbookLineIdentity?: boolean;
  };
};

type NextActionPlan = {
  generatedAt: string;
  status:
    | "fix-p0-readiness"
    | "refresh-s23-proof"
    | "refresh-provider-evidence"
    | "prove-temporary-provider-on-s23"
    | "manual-local-mvp-ready"
    | "provider-parity-wait"
    | "done"
    | "missing-evidence";
  priority: "P0" | "P1" | "P2" | "none";
  reason: string;
  recommendedAction: string;
  commands: string[];
  sourceEvidence: {
    readinessSummaryPath: string;
    providerEvidencePlanPath: string;
    definitionOfDoneSweepPath: string;
    oddsApiSingleEventSummaryPath: string;
    oddsApiMobileFlowProofPath: string;
    oddsApiS23ReachabilityPath: string;
    oddsApiS23VisibleProofPath: string;
  };
  state: {
    localMvpReady: boolean;
    p0Blockers: string[];
    p1Blockers: string[];
    s23ProofReady: boolean;
    s23ProofNextStaleName: string | null;
    s23ProofHoursUntilStale: number | null;
    providerPlanStatus: string | null;
    providerEvidenceHoursUntilStale: number | null;
    readyToDeclareDone: boolean;
    dodCounts: DefinitionOfDoneSweep["counts"];
    remainingPartialCriteria: string[];
    temporaryProviderReady: boolean;
    temporaryProviderNeedsS23VisualProof: boolean;
    temporaryProviderEventSlug: string | null;
  };
};

const repoRoot = path.resolve(__dirname, "..");

function parseArgs(argv: string[]) {
  const parsed = new Map<string, string>();
  for (const arg of argv) {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    if (key && rest.length > 0) {
      parsed.set(key, rest.join("="));
    }
  }
  return parsed;
}

function readJson<T>(relativePath: string): T | null {
  const resolved = path.resolve(repoRoot, relativePath);
  if (!fs.existsSync(resolved)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(resolved, "utf8").replace(/^\uFEFF/, "")) as T;
}

function ensureParentDir(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function buildPlan(
  readiness: ReadinessSummary | null,
  providerPlan: ProviderEvidencePlan | null,
  dod: DefinitionOfDoneSweep | null,
  oddsApiSummary: OddsApiSingleEventProof | null,
  oddsApiMobileFlowProof: OddsApiSingleEventProof | null,
  oddsApiS23Reachability: S23ReachabilityProof | null,
  oddsApiS23VisibleProof: OddsApiS23VisibleProof | null,
  paths: NextActionPlan["sourceEvidence"],
  s23RefreshWindowHours: number,
): NextActionPlan {
  const p0Blockers = readiness?.blockers?.p0 ?? [];
  const p1Blockers = readiness?.blockers?.p1 ?? [];
  const readinessState = readiness?.readiness ?? {};
  const remainingPartialCriteria = (dod?.criteria ?? [])
    .filter((criterion) => criterion.status === "partial" || criterion.status === "blocked")
    .map((criterion) => criterion.id ?? "unknown");
  const s23ProofHoursUntilStale = numberOrNull(readinessState.s23ProofHoursUntilStale);
  const s23RefreshDue =
    readinessState.s23LocalMvpDeviceProofReady !== true ||
    (s23ProofHoursUntilStale !== null && s23ProofHoursUntilStale <= s23RefreshWindowHours);
  const providerRefreshDue = providerPlan?.shouldRefreshProviderEvidence === true;
  const temporaryProviderReady =
    oddsApiSummary?.pass === true &&
    (oddsApiSummary.mobile?.sportsbookMarketCount ?? 0) > 0 &&
    oddsApiMobileFlowProof?.pass === true &&
    oddsApiMobileFlowProof.checks?.fakeTokenOrderFilled === true &&
    oddsApiMobileFlowProof.checks?.portfolioPositionVisible === true &&
    oddsApiMobileFlowProof.checks?.historyTradeVisible === true;
  const temporaryProviderS23VisibleProofReady =
    oddsApiS23VisibleProof?.result === "pass" &&
    oddsApiS23VisibleProof.assertions?.homeShowsTemporarySportsbookEvent === true &&
    oddsApiS23VisibleProof.assertions?.detailShowsGameLines === true &&
    oddsApiS23VisibleProof.assertions?.sportsbookSpreadLineVisible === true &&
    oddsApiS23VisibleProof.assertions?.ticketPreservesSportsbookLineIdentity === true &&
    oddsApiS23VisibleProof.assertions?.swipeSubmitReachedPortfolio === true &&
    oddsApiS23VisibleProof.assertions?.portfolioPreservesSportsbookLineIdentity === true &&
    oddsApiS23VisibleProof.assertions?.historyPreservesSportsbookLineIdentity === true;
  const temporaryProviderNeedsS23VisualProof =
    temporaryProviderReady &&
    !temporaryProviderS23VisibleProofReady &&
    (oddsApiS23Reachability?.pass === true) &&
    (oddsApiS23Reachability.proofLimitations ?? []).some((item) => item.toLowerCase().includes("not a full visual walkthrough"));

  let status: NextActionPlan["status"] = "provider-parity-wait";
  let priority: NextActionPlan["priority"] = "P1";
  let reason = "Provider-backed Polymarket parity is the only remaining partial criterion, but provider evidence is fresh.";
  let recommendedAction = "Do not open a new provider scan. Keep Local MVP internal testing/regression proof ready while waiting for provider evidence to become stale or a real candidate signal.";
  let commands: string[] = [];

  if (!readiness || !providerPlan || !dod) {
    status = "missing-evidence";
    priority = "P0";
    reason = "One or more required planner inputs are missing.";
    recommendedAction = "Regenerate the internal readiness batch, provider evidence plan, and Definition of Done sweep before choosing the next work cycle.";
    commands = ["npm run mobile:internal-readiness-batch", "npm run mobile:provider-evidence-plan", "npm run mobile:definition-of-done-sweep"];
  } else if (dod.readyToDeclareDone === true) {
    status = "done";
    priority = "none";
    reason = "Definition of Done sweep reports ready to declare done.";
    recommendedAction = "No autonomous development action is required.";
  } else if (p0Blockers.length > 0 || readinessState.localMvpReadyForInternalTesting !== true) {
    status = "fix-p0-readiness";
    priority = "P0";
    reason = "Internal Local MVP readiness has P0 blockers or is not ready.";
    recommendedAction = "Fix the readiness P0 blockers before opening provider or UI parity work.";
    commands = ["npm run mobile:internal-readiness-batch"];
  } else if (s23RefreshDue) {
    status = "refresh-s23-proof";
    priority = "P0";
    reason = `S23 Local MVP proof is missing, failed, or within ${s23RefreshWindowHours} hours of staleness.`;
    recommendedAction = "Run the S23 proof refresh command set from the readiness summary, then rerun the internal readiness batch.";
    commands = (readiness.recovery?.s23ProofRefreshCommands ?? [])
      .map((entry) => entry.command)
      .filter((command): command is string => Boolean(command));
  } else if (providerRefreshDue) {
    status = "refresh-provider-evidence";
    priority = "P1";
    reason = "Provider evidence is stale, nearly stale, missing, or explicitly due for refresh.";
    recommendedAction = "Refresh provider evidence and only begin provider-backed work if refreshed evidence shows a real attach-ready World Cup match or line market.";
    commands = [providerPlan.providerRefreshCommand ?? readiness.recovery?.providerRefreshCommand ?? "npm run mobile:internal-readiness-batch:provider-refresh"];
  } else if (temporaryProviderNeedsS23VisualProof) {
    status = "prove-temporary-provider-on-s23";
    priority = "P1";
    reason = "The temporary sportsbook provider bridge is seeded and backend/mobile-service proven, but the S23 proof is only reachability, not a visible seeded-event walkthrough.";
    recommendedAction = "Run a focused S23 visible proof for odds-api-single-soccer-test: Home -> Event Detail -> sportsbook spread/total line -> ticket -> fake-token order -> Portfolio/history. Do not spend more provider quota unless the redacted replay evidence is missing.";
    commands = [
      "npm run mobile:the-odds-api-single-event -- --fromRedactedOdds=docs/mobile/harness/the-odds-api-single-event/event-odds.redacted.json",
      "npm run mobile:the-odds-api-s23-visible-flow",
    ];
  } else if (remainingPartialCriteria.length === 0 && p1Blockers.length === 0) {
    status = "manual-local-mvp-ready";
    priority = "P2";
    reason = "Local MVP is ready and no provider P1 blockers are present, but final done was not declared.";
    recommendedAction = "Run manual internal Local MVP testing or final signoff review.";
  }

  return {
    generatedAt: new Date().toISOString(),
    status,
    priority,
    reason,
    recommendedAction,
    commands,
    sourceEvidence: paths,
    state: {
      localMvpReady: readinessState.localMvpReadyForInternalTesting === true,
      p0Blockers,
      p1Blockers,
      s23ProofReady: readinessState.s23LocalMvpDeviceProofReady === true,
      s23ProofNextStaleName: readinessState.s23ProofNextStaleName ?? null,
      s23ProofHoursUntilStale,
      providerPlanStatus: providerPlan?.status ?? null,
      providerEvidenceHoursUntilStale: numberOrNull(providerPlan?.hoursUntilStale ?? readinessState.cachedProviderEvidenceHoursUntilStale),
      readyToDeclareDone: dod?.readyToDeclareDone === true,
      dodCounts: dod?.counts,
      remainingPartialCriteria,
      temporaryProviderReady,
      temporaryProviderNeedsS23VisualProof,
      temporaryProviderEventSlug: oddsApiSummary?.mobile?.eventSlug ?? oddsApiMobileFlowProof?.mobile?.eventSlug ?? null,
    },
  };
}

const args = parseArgs(process.argv.slice(2));
const readinessSummaryPath =
  args.get("readinessSummaryPath") ?? "docs/mobile/harness/batch-internal-readiness-latest/internal-readiness-batch-summary.json";
const providerEvidencePlanPath =
  args.get("providerEvidencePlanPath") ?? "docs/mobile/harness/batch-internal-readiness-latest/provider-evidence-refresh-plan.json";
const definitionOfDoneSweepPath =
  args.get("definitionOfDoneSweepPath") ?? "docs/mobile/harness/cycle-current-mobile-definition-of-done-sweep.json";
const oddsApiSingleEventSummaryPath =
  args.get("oddsApiSingleEventSummaryPath") ?? "docs/mobile/harness/the-odds-api-single-event/single-event-replay-summary.redacted.json";
const oddsApiMobileFlowProofPath =
  args.get("oddsApiMobileFlowProofPath") ?? "docs/mobile/harness/the-odds-api-single-event/mobile-flow-proof.redacted.json";
const oddsApiS23ReachabilityPath =
  args.get("oddsApiS23ReachabilityPath") ?? "docs/mobile/harness/the-odds-api-single-event/s23-device-reachability.redacted.json";
const oddsApiS23VisibleProofPath =
  args.get("oddsApiS23VisibleProofPath") ??
  "docs/mobile/harness/cycle-ODDSAPIS23-odds-api-s23-visible-flow/cycle-ODDSAPIS23-odds-api-s23-visible-flow.json";
const outputPath = args.get("output") ?? "docs/mobile/harness/batch-internal-readiness-latest/mobile-autonomous-next-action-plan.json";
const s23RefreshWindowHours = Number(args.get("s23RefreshWindowHours") ?? "2");

if (!Number.isFinite(s23RefreshWindowHours) || s23RefreshWindowHours < 0) {
  throw new Error("--s23RefreshWindowHours must be a non-negative number");
}

const paths = {
  readinessSummaryPath,
  providerEvidencePlanPath,
  definitionOfDoneSweepPath,
  oddsApiSingleEventSummaryPath,
  oddsApiMobileFlowProofPath,
  oddsApiS23ReachabilityPath,
  oddsApiS23VisibleProofPath,
};
const plan = buildPlan(
  readJson<ReadinessSummary>(readinessSummaryPath),
  readJson<ProviderEvidencePlan>(providerEvidencePlanPath),
  readJson<DefinitionOfDoneSweep>(definitionOfDoneSweepPath),
  readJson<OddsApiSingleEventProof>(oddsApiSingleEventSummaryPath),
  readJson<OddsApiSingleEventProof>(oddsApiMobileFlowProofPath),
  readJson<S23ReachabilityProof>(oddsApiS23ReachabilityPath),
  readJson<OddsApiS23VisibleProof>(oddsApiS23VisibleProofPath),
  paths,
  s23RefreshWindowHours,
);

const resolvedOutputPath = path.resolve(repoRoot, outputPath);
ensureParentDir(resolvedOutputPath);
fs.writeFileSync(resolvedOutputPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");

console.log(`PLAN ${outputPath}`);
console.log(`STATUS ${plan.status}`);
console.log(`PRIORITY ${plan.priority}`);
console.log(`RECOMMENDED ${plan.recommendedAction}`);
