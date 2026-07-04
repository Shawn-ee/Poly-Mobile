import fs from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import {
  buildProviderCandidateSearchQueries,
  classifyProviderMarketFamily,
  fetchProviderCandidatesForQueries,
  fetchProviderCandidatesFromSportsEvents,
  rankProviderCandidates,
  summarizeProviderCandidateFamilies,
} from "@/server/services/mobileLiveProviderCandidates";

const DEFAULT_PROVIDER_EVENT_SLUG = "fifwc-col-gha-2026-07-03";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-current-mobile-provider-line-market-availability.json";

type LineTarget = ReturnType<typeof buildLineTargets>[number];

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const providerEventSlug = args.providerEventSlug ?? DEFAULT_PROVIDER_EVENT_SLUG;
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;

  const exactCandidates = await fetchProviderCandidatesFromSportsEvents({
    eventSlugs: [providerEventSlug],
    tagSlugs: [],
  });
  const exactFamilySummary = summarizeProviderCandidateFamilies(exactCandidates);
  const lineTargets = buildLineTargets();
  const targetResults = [];

  for (const target of lineTargets) {
    const queries = [
      ...buildProviderCandidateSearchQueries(target.market),
      ...target.extraQueries,
    ];
    const candidates = await fetchProviderCandidatesForQueries(Array.from(new Set(queries)).slice(0, 8), {
      limitPerQuery: 10,
    });
    const ranked = rankProviderCandidates(target.market, candidates).slice(0, 8);
    targetResults.push({
      key: target.key,
      marketType: target.market.marketType,
      title: target.market.title,
      line: target.market.line?.toString() ?? null,
      queries: Array.from(new Set(queries)).slice(0, 8),
      candidateCount: candidates.length,
      attachReadyCandidateCount: ranked.filter((candidate) => candidate.attachReadiness.attachReady).length,
      insufficientRelevanceCount: ranked.filter((candidate) =>
        candidate.attachReadiness.reasons.includes("insufficient_market_relevance")
      ).length,
      ranked: ranked.map((candidate) => ({
        slug: candidate.slug,
        question: candidate.question,
        eventTitle: candidate.eventTitle,
        family: classifyProviderMarketFamily(candidate),
        score: candidate.score,
        attachReady: candidate.attachReadiness.attachReady,
        reasons: candidate.attachReadiness.reasons,
        relevance: candidate.attachReadiness.relevance,
      })),
    });
  }

  const exactLineCandidateCount =
    exactFamilySummary.spread +
    exactFamilySummary.total_goals +
    exactFamilySummary.team_total_goals +
    exactFamilySummary.corners +
    exactFamilySummary.first_half +
    exactFamilySummary.second_half +
    exactFamilySummary.correct_score;
  const broadCandidateCount = targetResults.reduce((sum, target) => sum + target.candidateCount, 0);
  const broadAttachReadyCount = targetResults.reduce((sum, target) => sum + target.attachReadyCandidateCount, 0);
  const broadInsufficientRelevanceCount = targetResults.reduce((sum, target) => sum + target.insufficientRelevanceCount, 0);

  const summary = {
    generatedAt: new Date().toISOString(),
    provider: "polymarket-gamma",
    providerEventSlug,
    exactEvent: {
      candidateCount: exactCandidates.length,
      familySummary: exactFamilySummary,
      lineCandidateCount: exactLineCandidateCount,
      candidates: exactCandidates.map((candidate) => ({
        slug: candidate.slug,
        question: candidate.question,
        family: classifyProviderMarketFamily(candidate),
        outcomeCount: candidate.outcomes.length,
        tokenComplete: candidate.outcomes.every((outcome) => Boolean(outcome.tokenId)),
      })),
    },
    lineSearch: {
      targetCount: lineTargets.length,
      broadCandidateCount,
      attachReadyCandidateCount: broadAttachReadyCount,
      insufficientRelevanceCount: broadInsufficientRelevanceCount,
      targets: targetResults,
    },
    nextRequiredAction:
      exactLineCandidateCount > 0 || broadAttachReadyCount > 0
        ? "review_attach_ready_line_market_candidates"
        : "provider_line_markets_not_available_or_not_relevant_for_exact_event",
    pass:
      exactCandidates.length >= 2 &&
      exactLineCandidateCount === 0 &&
      lineTargets.length >= 6 &&
      broadCandidateCount > 0 &&
      broadAttachReadyCount === 0 &&
      broadInsufficientRelevanceCount > 0,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

function buildLineTargets() {
  const teams = {
    home: "Colombia",
    away: "Ghana",
  };
  const base = {
    id: "line-target",
    period: null,
    unit: "goals",
    marketGroupKey: "game-lines",
    marketGroupTitle: "Game Lines",
  };
  return [
    {
      key: "spread-colombia-plus-1-5",
      market: {
        ...base,
        id: "line-target-spread-col",
        title: "Colombia +1.5",
        marketType: "spread",
        line: new Prisma.Decimal("1.5"),
        outcomes: yesNoOutcomes(),
      },
      extraQueries: [
        "Colombia Ghana spread",
        "Colombia Ghana handicap",
        "Colombia cover 1.5 Ghana",
      ],
    },
    {
      key: "spread-ghana-minus-1-5",
      market: {
        ...base,
        id: "line-target-spread-gha",
        title: "Ghana -1.5",
        marketType: "spread",
        line: new Prisma.Decimal("-1.5"),
        outcomes: yesNoOutcomes(),
      },
      extraQueries: [
        "Ghana Colombia spread",
        "Ghana Colombia handicap",
        "Ghana cover 1.5 Colombia",
      ],
    },
    {
      key: "total-goals-2-5",
      market: {
        ...base,
        id: "line-target-total-25",
        title: "Total goals 2.5",
        marketType: "total_goals",
        line: new Prisma.Decimal("2.5"),
        outcomes: overUnderOutcomes("2.5"),
      },
      extraQueries: [
        "Colombia Ghana total goals",
        "Colombia Ghana over under",
        "Colombia Ghana goals over 2.5",
      ],
    },
    {
      key: "team-total-colombia-1-5",
      market: {
        ...base,
        id: "line-target-team-total-col",
        title: "Colombia goals 1.5",
        marketType: "team_total_goals",
        line: new Prisma.Decimal("1.5"),
        outcomes: overUnderOutcomes("1.5"),
      },
      extraQueries: [
        "Colombia Ghana team total",
        "Colombia team goals over 1.5 Ghana",
      ],
    },
    {
      key: "first-half-winner-colombia",
      market: {
        ...base,
        id: "line-target-first-half",
        title: "First half Colombia winner",
        marketType: "first_half_winner",
        period: "first-half",
        line: null,
        outcomes: yesNoOutcomes(),
      },
      extraQueries: [
        "Colombia Ghana first half",
        "Colombia first half winner Ghana",
      ],
    },
    {
      key: "corners-8-5",
      market: {
        ...base,
        id: "line-target-corners",
        title: "Corners 8.5",
        marketType: "corners",
        line: new Prisma.Decimal("8.5"),
        outcomes: overUnderOutcomes("8.5"),
      },
      extraQueries: [
        "Colombia Ghana corners",
        "Colombia Ghana corner kicks over 8.5",
      ],
    },
  ];
}

function yesNoOutcomes() {
  return [
    { id: "yes", name: "Yes", side: "yes", displayOrder: 0, referenceOutcomeLabel: "Yes" },
    { id: "no", name: "No", side: "no", displayOrder: 1, referenceOutcomeLabel: "No" },
  ];
}

function overUnderOutcomes(line: string) {
  return [
    { id: "over", name: `Over ${line}`, side: "over", displayOrder: 0, referenceOutcomeLabel: `Over ${line}` },
    { id: "under", name: `Under ${line}`, side: "under", displayOrder: 1, referenceOutcomeLabel: `Under ${line}` },
  ];
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

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
