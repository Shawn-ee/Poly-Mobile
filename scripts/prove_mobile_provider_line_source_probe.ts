import fs from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import {
  buildProviderCandidateSearchQueries,
  classifyProviderMarketFamily,
  fetchProviderCandidatesForQueries,
  fetchProviderCandidatesForSlugs,
  fetchProviderCandidatesFromSportsEvents,
  rankProviderCandidates,
  summarizeProviderCandidateFamilies,
} from "@/server/services/mobileLiveProviderCandidates";

const DEFAULT_PROVIDER_EVENT_SLUG = "fifwc-col-gha-2026-07-03";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-current-mobile-provider-line-source-probe.json";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const providerEventSlug = args.providerEventSlug ?? DEFAULT_PROVIDER_EVENT_SLUG;
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;
  const lineTargets = buildLineTargets();

  const exactEventCandidates = await fetchProviderCandidatesFromSportsEvents({
    eventSlugs: [providerEventSlug],
    tagSlugs: [],
  });
  const exactEventFamilySummary = summarizeProviderCandidateFamilies(exactEventCandidates);

  const exactSlugCandidates = await fetchProviderCandidatesForSlugs(buildExactLineSlugGuesses(providerEventSlug));
  const exactSlugFamilySummary = summarizeProviderCandidateFamilies(exactSlugCandidates);

  const targetResults = [];
  for (const target of lineTargets) {
    const queries = Array.from(new Set([
      ...buildProviderCandidateSearchQueries(target.market),
      ...target.extraQueries,
    ])).slice(0, 12);
    const broadCandidates = await fetchProviderCandidatesForQueries(queries, { limitPerQuery: 12 });
    const mergedCandidates = mergeCandidates([
      ...exactEventCandidates,
      ...exactSlugCandidates,
      ...broadCandidates,
    ]);
    const ranked = rankProviderCandidates(target.market, mergedCandidates).slice(0, 10);
    targetResults.push({
      key: target.key,
      marketType: target.market.marketType,
      title: target.market.title,
      period: target.market.period,
      line: target.market.line?.toString() ?? null,
      exactSlugGuesses: buildExactLineSlugGuesses(providerEventSlug).filter((slug) =>
        target.slugHintMatchers.some((matcher) => slug.includes(matcher))
      ),
      queries,
      broadCandidateCount: broadCandidates.length,
      mergedCandidateCount: mergedCandidates.length,
      attachReadyCandidateCount: ranked.filter((candidate) => candidate.attachReadiness.attachReady).length,
      familyMismatchCount: ranked.filter((candidate) =>
        candidate.attachReadiness.reasons.includes("provider_family_mismatch")
      ).length,
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

  const exactLineCandidateCount = countLineFamilies(exactEventFamilySummary);
  const exactSlugLineCandidateCount = countLineFamilies(exactSlugFamilySummary);
  const attachReadyLineTargetCount = targetResults.filter((target) => target.attachReadyCandidateCount > 0).length;

  const summary = {
    generatedAt: new Date().toISOString(),
    provider: "polymarket-gamma",
    providerEventSlug,
    surfaces: {
      exactEvent: {
        source: "gamma-api.polymarket.com/events?slug",
        candidateCount: exactEventCandidates.length,
        familySummary: exactEventFamilySummary,
        lineCandidateCount: exactLineCandidateCount,
        samples: exactEventCandidates.map((candidate) => ({
          slug: candidate.slug,
          question: candidate.question,
          family: classifyProviderMarketFamily(candidate),
          tokenComplete: candidate.outcomes.every((outcome) => Boolean(outcome.tokenId)),
        })),
      },
      exactSlugGuesses: {
        source: "gamma-api.polymarket.com/markets?slug",
        guessedSlugCount: buildExactLineSlugGuesses(providerEventSlug).length,
        candidateCount: exactSlugCandidates.length,
        familySummary: exactSlugFamilySummary,
        lineCandidateCount: exactSlugLineCandidateCount,
        candidates: exactSlugCandidates.map((candidate) => ({
          slug: candidate.slug,
          question: candidate.question,
          family: classifyProviderMarketFamily(candidate),
          tokenComplete: candidate.outcomes.every((outcome) => Boolean(outcome.tokenId)),
        })),
      },
      broadLineQueries: {
        source: "gamma-api.polymarket.com/markets?search",
        targetCount: lineTargets.length,
        totalBroadCandidateCount: targetResults.reduce((sum, target) => sum + target.broadCandidateCount, 0),
        attachReadyLineTargetCount,
        targets: targetResults,
      },
    },
    nextRequiredAction:
      attachReadyLineTargetCount > 0 || exactLineCandidateCount > 0 || exactSlugLineCandidateCount > 0
        ? "review_and_attach_real_line_provider_candidates"
        : "line_provider_source_still_missing_use_operator_review_or_alternate_provider_source",
    pass:
      exactEventCandidates.length >= 3 &&
      exactLineCandidateCount === 0 &&
      exactSlugLineCandidateCount === 0 &&
      lineTargets.length >= 8 &&
      targetResults.every((target) => target.attachReadyCandidateCount === 0) &&
      targetResults.some((target) => target.broadCandidateCount > 0) &&
      targetResults.some((target) => target.insufficientRelevanceCount > 0 || target.familyMismatchCount > 0),
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

function buildLineTargets() {
  const base = {
    id: "line-target",
    unit: "goals",
    marketGroupKey: "game-lines",
    marketGroupTitle: "Game Lines",
  };
  return [
    lineTarget("spread-colombia-plus-1-5", "Colombia +1.5", "spread", "1.5", null, yesNoOutcomes(), [
      "Colombia Ghana spread",
      "Colombia Ghana handicap",
      "Colombia +1.5 Ghana",
      "Colombia cover 1.5 Ghana",
    ], ["spread", "handicap"]),
    lineTarget("spread-ghana-minus-1-5", "Ghana -1.5", "spread", "-1.5", null, yesNoOutcomes(), [
      "Ghana Colombia spread",
      "Ghana Colombia handicap",
      "Ghana -1.5 Colombia",
      "Ghana cover 1.5 Colombia",
    ], ["spread", "handicap"]),
    lineTarget("total-goals-2-5", "Colombia vs Ghana total goals 2.5", "total_goals", "2.5", null, overUnderOutcomes("2.5"), [
      "Colombia Ghana total goals",
      "Colombia Ghana over under",
      "Colombia Ghana over 2.5",
      "Colombia Ghana goals over 2.5",
    ], ["total", "goals", "over", "under"]),
    lineTarget("team-total-colombia-1-5", "Colombia team total goals 1.5", "team_total_goals", "1.5", null, overUnderOutcomes("1.5"), [
      "Colombia Ghana team total",
      "Colombia team goals over 1.5 Ghana",
      "Colombia total goals Ghana",
    ], ["col", "team-total", "team-goals"]),
    lineTarget("team-total-ghana-1-5", "Ghana team total goals 1.5", "team_total_goals", "1.5", null, overUnderOutcomes("1.5"), [
      "Ghana Colombia team total",
      "Ghana team goals over 1.5 Colombia",
      "Ghana total goals Colombia",
    ], ["gha", "team-total", "team-goals"]),
    lineTarget("first-half-total-goals-1-5", "First half total goals 1.5", "total_goals", "1.5", "first-half", overUnderOutcomes("1.5"), [
      "Colombia Ghana first half total goals",
      "Colombia Ghana first half over under",
      "Colombia Ghana 1h over 1.5",
    ], ["first-half", "1h"]),
    lineTarget("first-half-winner-colombia", "First half Colombia winner", "first_half_winner", null, "first-half", yesNoOutcomes(), [
      "Colombia Ghana first half winner",
      "Colombia first half Ghana",
      "Colombia Ghana 1h winner",
    ], ["first-half", "1h"]),
    lineTarget("corners-8-5", "Colombia vs Ghana corners 8.5", "corners", "8.5", null, overUnderOutcomes("8.5"), [
      "Colombia Ghana corners",
      "Colombia Ghana corner kicks over 8.5",
      "Colombia Ghana total corners",
    ], ["corner", "corners"]),
  ].map((target) => ({
    ...target,
    market: {
      ...base,
      ...target.market,
    },
  }));
}

function lineTarget(
  key: string,
  title: string,
  marketType: string,
  line: string | null,
  period: string | null,
  outcomes: ReturnType<typeof yesNoOutcomes>,
  extraQueries: string[],
  slugHintMatchers: string[],
) {
  return {
    key,
    market: {
      id: `line-target-${key}`,
      title,
      marketType,
      line: line ? new Prisma.Decimal(line) : null,
      period,
      outcomes,
    },
    extraQueries,
    slugHintMatchers,
  };
}

function buildExactLineSlugGuesses(providerEventSlug: string) {
  const slug = providerEventSlug.trim();
  return Array.from(new Set([
    `${slug}-spread`,
    `${slug}-handicap`,
    `${slug}-col-spread`,
    `${slug}-gha-spread`,
    `${slug}-colombia-spread`,
    `${slug}-ghana-spread`,
    `${slug}-total-goals`,
    `${slug}-total-goals-25`,
    `${slug}-over-under`,
    `${slug}-over-25`,
    `${slug}-under-25`,
    `${slug}-team-total-col`,
    `${slug}-team-total-gha`,
    `${slug}-col-team-total`,
    `${slug}-gha-team-total`,
    `${slug}-first-half`,
    `${slug}-first-half-winner`,
    `${slug}-1h`,
    `${slug}-1h-winner`,
    `${slug}-first-half-total-goals`,
    `${slug}-corners`,
    `${slug}-total-corners`,
    `${slug}-correct-score`,
  ]));
}

function countLineFamilies(summary: ReturnType<typeof summarizeProviderCandidateFamilies>) {
  return (
    summary.spread +
    summary.total_goals +
    summary.team_total_goals +
    summary.corners +
    summary.first_half +
    summary.second_half +
    summary.correct_score
  );
}

function mergeCandidates<T extends { slug: string }>(candidates: T[]) {
  const bySlug = new Map<string, T>();
  for (const candidate of candidates) {
    if (!bySlug.has(candidate.slug)) bySlug.set(candidate.slug, candidate);
  }
  return Array.from(bySlug.values());
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
