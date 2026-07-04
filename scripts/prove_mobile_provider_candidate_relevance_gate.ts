import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { discoverMobileLiveProviderCandidates } from "@/server/services/mobileLiveProviderCandidates";

const DEFAULT_EVENT_SLUG = "world-cup-2026-curacao-vs-cote-divoire-2026-06-25";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-current-mobile-provider-candidate-relevance-gate.json";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const eventSlug = args.eventSlug ?? DEFAULT_EVENT_SLUG;
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;
  const maxCandidatesPerMarket = Number.parseInt(args.maxCandidatesPerMarket ?? "3", 10);

  const result = await discoverMobileLiveProviderCandidates({
    eventSlug,
    fetchProvider: true,
    maxCandidatesPerMarket: Number.isFinite(maxCandidatesPerMarket) ? maxCandidatesPerMarket : 3,
  });

  const targets = result.targets.map((target) => ({
    marketId: target.marketId,
    title: target.title,
    marketType: target.marketType,
    line: target.line,
    outcomeCount: target.outcomeCount,
    providerFetchAttempted: target.providerFetchAttempted,
    providerError: target.providerError,
    candidateCount: target.candidateCount,
    attachReady: target.attachProposal?.attachReady ?? false,
    bestCandidate: target.bestCandidate
      ? {
          slug: target.bestCandidate.slug,
          question: target.bestCandidate.question,
          score: target.bestCandidate.score,
          attachReadiness: target.bestCandidate.attachReadiness,
        }
      : null,
  }));

  const candidateCount = targets.reduce((sum, target) => sum + target.candidateCount, 0);
  const relevanceRejectedCount = targets.filter((target) =>
    target.bestCandidate?.attachReadiness.reasons.includes("insufficient_market_relevance")
  ).length;

  const summary = {
    generatedAt: new Date().toISOString(),
    eventSlug,
    provider: result.provider,
    fetchProvider: result.fetchProvider,
    targetMarketCount: result.targetMarketCount,
    attachReadyCandidateCount: result.attachReadyCandidateCount,
    providerErrorCount: result.providerErrorCount,
    candidateCount,
    relevanceRejectedCount,
    nextRequiredAction: result.nextRequiredAction,
    targets,
    pass:
      result.fetchProvider === true &&
      result.providerErrorCount === 0 &&
      result.targetMarketCount > 0 &&
      candidateCount > 0 &&
      result.attachReadyCandidateCount === 0 &&
      relevanceRejectedCount > 0 &&
      targets.every((target) => target.providerFetchAttempted && !target.attachReady),
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (!part.startsWith("--")) continue;
    const key = part.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

main()
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
