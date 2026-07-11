import fs from "node:fs";
import path from "node:path";

type ProviderEvidenceRow = {
  name?: string;
  summaryPath?: string;
  generatedAt?: string;
  ageHours?: number;
  maxAgeHours?: number;
  staleAt?: string;
  hoursUntilStale?: number;
  fresh?: boolean;
  present?: boolean;
};

type InternalReadinessSummary = {
  generatedAt?: string;
  providerDiscoveryMode?: string;
  readiness?: {
    cachedProviderEvidenceFresh?: boolean;
    cachedProviderEvidenceNextStaleName?: string | null;
    cachedProviderEvidenceNextStaleAt?: string | null;
    cachedProviderEvidenceHoursUntilStale?: number | null;
    cachedProviderEvidence?: ProviderEvidenceRow[];
    providerBackedExchangeReady?: boolean;
    providerMvpTradableFlowReady?: boolean;
    worldCupTeamMatchEventCount?: number;
    usableWorldCupTeamMatchEventCount?: number;
    attachReadyProviderLineCandidateCount?: number;
  };
  blockers?: {
    p0?: string[];
    p1?: string[];
    p2?: string[];
  };
  recovery?: {
    providerRefreshCommand?: string;
    rerunBatchCommand?: string;
  };
};

type ProviderEvidencePlan = {
  generatedAt: string;
  sourceSummaryPath: string;
  refreshWindowHours: number;
  providerDiscoveryMode: string | null;
  status: "skip-refresh" | "refresh-due" | "refresh-soon" | "missing-summary";
  shouldRefreshProviderEvidence: boolean;
  reason: string;
  providerRefreshCommand: string;
  rerunBatchCommand: string;
  nextStaleName: string | null;
  nextStaleAt: string | null;
  hoursUntilStale: number | null;
  cachedProviderEvidenceFresh: boolean;
  providerBackedExchangeReady: boolean;
  providerMvpTradableFlowReady: boolean;
  providerBlockers: string[];
  providerEvidence: ProviderEvidenceRow[];
  providerEvidenceCounts: {
    worldCupTeamMatchEventCount: number | null;
    usableWorldCupTeamMatchEventCount: number | null;
    attachReadyProviderLineCandidateCount: number | null;
  };
  nextActions: string[];
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

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readJsonFile<T>(relativePath: string): T | null {
  const resolved = path.resolve(repoRoot, relativePath);
  if (!fs.existsSync(resolved)) {
    return null;
  }

  const json = fs.readFileSync(resolved, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(json) as T;
}

function ensureParentDir(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function buildPlan(
  summary: InternalReadinessSummary | null,
  sourceSummaryPath: string,
  refreshWindowHours: number,
): ProviderEvidencePlan {
  const readiness = summary?.readiness ?? {};
  const p1Blockers = summary?.blockers?.p1 ?? [];
  const providerBlockers = p1Blockers.filter((blocker) => blocker.toLowerCase().includes("provider"));
  const providerEvidence = Array.isArray(readiness.cachedProviderEvidence) ? readiness.cachedProviderEvidence : [];
  const fresh = readiness.cachedProviderEvidenceFresh === true;
  const hoursUntilStale = numberOrNull(readiness.cachedProviderEvidenceHoursUntilStale);
  const hasMissingEvidence = providerEvidence.length === 0 || providerEvidence.some((row) => row.present === false);
  const hasStaleEvidence = !fresh || providerEvidence.some((row) => row.fresh === false);
  const dueSoon = hoursUntilStale !== null && hoursUntilStale <= refreshWindowHours;

  let status: ProviderEvidencePlan["status"] = "skip-refresh";
  let reason = "Cached provider evidence is fresh and outside the refresh window.";

  if (!summary) {
    status = "missing-summary";
    reason = "The internal readiness summary is missing, so provider decisions cannot be trusted.";
  } else if (hasMissingEvidence || hasStaleEvidence || p1Blockers.includes("provider_cached_evidence_stale")) {
    status = "refresh-due";
    reason = "Cached provider evidence is missing or stale.";
  } else if (dueSoon) {
    status = "refresh-soon";
    reason = `Cached provider evidence will go stale within ${refreshWindowHours} hours.`;
  }

  const shouldRefreshProviderEvidence = status !== "skip-refresh";
  const providerRefreshCommand = summary?.recovery?.providerRefreshCommand ?? "npm run mobile:internal-readiness-batch:provider-refresh";
  const rerunBatchCommand = summary?.recovery?.rerunBatchCommand ?? "npm run mobile:internal-readiness-batch";

  return {
    generatedAt: new Date().toISOString(),
    sourceSummaryPath,
    refreshWindowHours,
    providerDiscoveryMode: summary?.providerDiscoveryMode ?? null,
    status,
    shouldRefreshProviderEvidence,
    reason,
    providerRefreshCommand,
    rerunBatchCommand,
    nextStaleName: readiness.cachedProviderEvidenceNextStaleName ?? null,
    nextStaleAt: readiness.cachedProviderEvidenceNextStaleAt ?? null,
    hoursUntilStale,
    cachedProviderEvidenceFresh: fresh,
    providerBackedExchangeReady: readiness.providerBackedExchangeReady === true,
    providerMvpTradableFlowReady: readiness.providerMvpTradableFlowReady === true,
    providerBlockers,
    providerEvidence,
    providerEvidenceCounts: {
      worldCupTeamMatchEventCount: numberOrNull(readiness.worldCupTeamMatchEventCount),
      usableWorldCupTeamMatchEventCount: numberOrNull(readiness.usableWorldCupTeamMatchEventCount),
      attachReadyProviderLineCandidateCount: numberOrNull(readiness.attachReadyProviderLineCandidateCount),
    },
    nextActions: shouldRefreshProviderEvidence
      ? [
          `Run ${providerRefreshCommand}.`,
          `Then run ${rerunBatchCommand}.`,
          "Only start provider-backed trading work if the refreshed evidence shows a real attach-ready World Cup match or line market.",
        ]
      : [
          "Skip provider refresh for this loop pass.",
          "Continue Local MVP testing or wait until the next provider evidence stale time before rerunning provider discovery.",
          "Do not open new provider scans unless a real candidate signal appears.",
        ],
  };
}

const args = parseArgs(process.argv.slice(2));
const summaryPath = args.get("summaryPath") ?? "docs/mobile/harness/batch-internal-readiness-latest/internal-readiness-batch-summary.json";
const outputPath = args.get("output") ?? "docs/mobile/harness/batch-internal-readiness-latest/provider-evidence-refresh-plan.json";
const refreshWindowHours = Number(args.get("refreshWindowHours") ?? "2");

if (!Number.isFinite(refreshWindowHours) || refreshWindowHours < 0) {
  throw new Error("--refreshWindowHours must be a non-negative number");
}

const summary = readJsonFile<InternalReadinessSummary>(summaryPath);
const plan = buildPlan(summary, summaryPath, refreshWindowHours);
const resolvedOutputPath = path.resolve(repoRoot, outputPath);
ensureParentDir(resolvedOutputPath);
fs.writeFileSync(resolvedOutputPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");

console.log(`SUMMARY ${summaryPath}`);
console.log(`PLAN ${outputPath}`);
console.log(`STATUS ${plan.status}`);
console.log(`SHOULD_REFRESH ${plan.shouldRefreshProviderEvidence}`);
if (plan.shouldRefreshProviderEvidence) {
  console.log(`NEXT ${plan.providerRefreshCommand}`);
}
