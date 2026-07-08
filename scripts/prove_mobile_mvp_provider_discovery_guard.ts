import fs from "node:fs/promises";
import path from "node:path";
import {
  discoverMobileLiveProviderCandidates,
} from "@/server/services/mobileLiveProviderCandidates";

const DEFAULT_EVENT_SLUG = "argentina-vs-egypt";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/cycle-MI-provider-discovery-guard/cycle-MI-provider-discovery-guard.json";

const LINE_MARKET_TYPES = new Set(["spread", "total_goals", "team_total_goals", "totals", "team-total"]);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function main() {
  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const discovery = await discoverMobileLiveProviderCandidates({
    eventSlug,
    maxCandidatesPerMarket: 3,
    providerSearchMode: "combined",
  });

  const targets = discovery.targets.map((target) => ({
    marketId: target.marketId,
    title: target.title,
    marketType: target.marketType,
    line: target.line,
    expectedProviderFamily: target.expectedProviderFamily,
    candidateCount: target.candidateCount,
    attachReady: target.attachProposal?.attachReady ?? false,
    bestCandidate: target.bestCandidate
      ? {
          slug: target.bestCandidate.slug,
          question: target.bestCandidate.question,
          eventTitle: target.bestCandidate.eventTitle,
          expectedFamily: target.bestCandidate.attachReadiness.expectedFamily,
          candidateFamily: target.bestCandidate.attachReadiness.candidateFamily,
          reasons: target.bestCandidate.attachReadiness.reasons,
          matchedImportantTokens: target.bestCandidate.attachReadiness.relevance.matchedImportantTokens,
          relevant: target.bestCandidate.attachReadiness.relevance.relevant,
        }
      : null,
  }));
  const matchWinnerTargets = targets.filter((target) => target.expectedProviderFamily === "match_winner");
  const lineTargets = targets.filter((target) => LINE_MARKET_TYPES.has(target.marketType));
  const unsafeOutrightAttachTargets = matchWinnerTargets.filter((target) =>
    target.attachReady && /win-the-2026-fifa-world-cup|world-cup-winner/i.test(target.bestCandidate?.slug ?? "")
  );
  const attachReadyLineTargets = lineTargets.filter((target) => target.attachReady);
  const lineWrongFamilyRejections = lineTargets.filter((target) =>
    target.bestCandidate?.reasons.includes("provider_family_mismatch")
  );

  assert(matchWinnerTargets.length >= 3, "Expected at least three match-winner targets.");
  assert(matchWinnerTargets.filter((target) => target.attachReady).length >= 3, "Expected exact match-winner candidates to remain attach-ready.");
  assert(unsafeOutrightAttachTargets.length === 0, "World Cup outright winner candidates must not attach to match-specific markets.");
  assert(lineTargets.length >= 3, "Expected Spread/Totals/Team Total targets to be present.");
  assert(attachReadyLineTargets.length === 0, "Current MVP line targets must not attach wrong-family provider candidates.");
  assert(lineWrongFamilyRejections.length >= 3, "Expected line targets to reject wrong-family match-winner candidates.");

  const summary = {
    cycle: "MI",
    result: "pass",
    generatedAt: new Date().toISOString(),
    provider: discovery.provider,
    eventSlug: discovery.eventSlug,
    providerSearchMode: discovery.providerSearchMode,
    providerEventSlugs: discovery.providerEventSlugs,
    providerCandidateFamilySummary: discovery.providerCandidateFamilySummary,
    targetMarketCount: discovery.targetMarketCount,
    attachReadyCandidateCount: discovery.attachReadyCandidateCount,
    nextRequiredAction: discovery.nextRequiredAction,
    assertions: {
      matchWinnerAttachReadyCount: matchWinnerTargets.filter((target) => target.attachReady).length,
      unsafeOutrightAttachCount: unsafeOutrightAttachTargets.length,
      lineTargetCount: lineTargets.length,
      attachReadyLineTargetCount: attachReadyLineTargets.length,
      lineWrongFamilyRejectionCount: lineWrongFamilyRejections.length,
    },
    targets,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
