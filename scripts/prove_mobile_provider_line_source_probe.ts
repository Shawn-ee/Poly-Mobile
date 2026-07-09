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

const DEFAULT_PROVIDER_EVENT_SLUG = "fifwc-arg-egy-2026-07-07";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-current-mobile-provider-line-source-probe.json";
const TEAM_NAME_BY_CODE: Record<string, string> = {
  arg: "Argentina",
  aus: "Australia",
  bra: "Brazil",
  col: "Colombia",
  cro: "Croatia",
  ecu: "Ecuador",
  egy: "Egypt",
  fra: "France",
  gha: "Ghana",
  mex: "Mexico",
  nor: "Norway",
  par: "Paraguay",
  por: "Portugal",
  usa: "USA",
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const providerEventSlug = args.providerEventSlug ?? DEFAULT_PROVIDER_EVENT_SLUG;
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;

  const exactEventCandidates = await fetchProviderCandidatesFromSportsEvents({
    eventSlugs: [providerEventSlug],
    tagSlugs: [],
  });
  const teamContext = deriveTeamContext({
    providerEventSlug,
    eventTitle: exactEventCandidates[0]?.eventTitle ?? null,
    homeTeam: args.homeTeam,
    awayTeam: args.awayTeam,
  });
  const lineTargets = buildLineTargets(teamContext);
  const exactEventFamilySummary = summarizeProviderCandidateFamilies(exactEventCandidates);

  const exactSlugGuesses = buildExactLineSlugGuesses(providerEventSlug, teamContext);
  const exactSlugCandidates = await fetchProviderCandidatesForSlugs(exactSlugGuesses);
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
      exactSlugGuesses: exactSlugGuesses.filter((slug) =>
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
        guessedSlugCount: exactSlugGuesses.length,
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

function buildLineTargets(teamContext: TeamContext) {
  const { homeTeam, awayTeam, homeCode, awayCode } = teamContext;
  const teamPair = `${homeTeam} ${awayTeam}`;
  const base = {
    id: "line-target",
    eventTitle: `${homeTeam} vs ${awayTeam}`,
    unit: "goals",
    marketGroupKey: "game-lines",
    marketGroupTitle: "Game Lines",
  };
  return [
    lineTarget(`spread-${homeCode}-plus-1-5`, `${homeTeam} +1.5`, "spread", "1.5", null, yesNoOutcomes(), [
      `${teamPair} spread`,
      `${teamPair} handicap`,
      `${homeTeam} +1.5 ${awayTeam}`,
      `${homeTeam} cover 1.5 ${awayTeam}`,
    ], ["spread", "handicap"]),
    lineTarget(`spread-${awayCode}-minus-1-5`, `${awayTeam} -1.5`, "spread", "-1.5", null, yesNoOutcomes(), [
      `${awayTeam} ${homeTeam} spread`,
      `${awayTeam} ${homeTeam} handicap`,
      `${awayTeam} -1.5 ${homeTeam}`,
      `${awayTeam} cover 1.5 ${homeTeam}`,
    ], ["spread", "handicap"]),
    lineTarget("total-goals-2-5", `${homeTeam} vs ${awayTeam} total goals 2.5`, "total_goals", "2.5", null, overUnderOutcomes("2.5"), [
      `${teamPair} total goals`,
      `${teamPair} over under`,
      `${teamPair} over 2.5`,
      `${teamPair} goals over 2.5`,
    ], ["total", "goals", "over", "under"]),
    lineTarget(`team-total-${homeCode}-1-5`, `${homeTeam} team total goals 1.5`, "team_total_goals", "1.5", null, overUnderOutcomes("1.5"), [
      `${teamPair} team total`,
      `${homeTeam} team goals over 1.5 ${awayTeam}`,
      `${homeTeam} total goals ${awayTeam}`,
    ], [homeCode, "team-total", "team-goals"]),
    lineTarget(`team-total-${awayCode}-1-5`, `${awayTeam} team total goals 1.5`, "team_total_goals", "1.5", null, overUnderOutcomes("1.5"), [
      `${awayTeam} ${homeTeam} team total`,
      `${awayTeam} team goals over 1.5 ${homeTeam}`,
      `${awayTeam} total goals ${homeTeam}`,
    ], [awayCode, "team-total", "team-goals"]),
    lineTarget("first-half-total-goals-1-5", "First half total goals 1.5", "total_goals", "1.5", "first-half", overUnderOutcomes("1.5"), [
      `${teamPair} first half total goals`,
      `${teamPair} first half over under`,
      `${teamPair} 1h over 1.5`,
    ], ["first-half", "1h"]),
    lineTarget(`first-half-winner-${homeCode}`, `First half ${homeTeam} winner`, "first_half_winner", null, "first-half", yesNoOutcomes(), [
      `${teamPair} first half winner`,
      `${homeTeam} first half ${awayTeam}`,
      `${teamPair} 1h winner`,
    ], ["first-half", "1h"]),
    lineTarget("corners-8-5", `${homeTeam} vs ${awayTeam} corners 8.5`, "corners", "8.5", null, overUnderOutcomes("8.5"), [
      `${teamPair} corners`,
      `${teamPair} corner kicks over 8.5`,
      `${teamPair} total corners`,
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

type TeamContext = {
  homeTeam: string;
  awayTeam: string;
  homeCode: string;
  awayCode: string;
};

function deriveTeamContext(params: {
  providerEventSlug: string;
  eventTitle?: string | null;
  homeTeam?: string;
  awayTeam?: string;
}): TeamContext {
  const slugCodes = params.providerEventSlug.match(/fifwc-([a-z]{3})-([a-z]{3})-\d{4}-\d{2}-\d{2}/i);
  const titleTeams = params.eventTitle?.match(/\b(.+?)\s+(?:vs\.?|v\.?)\s+(.+?)$/i);
  const homeCode = slugCodes?.[1]?.toLowerCase() ?? codeForTeam(params.homeTeam ?? titleTeams?.[1] ?? "home");
  const awayCode = slugCodes?.[2]?.toLowerCase() ?? codeForTeam(params.awayTeam ?? titleTeams?.[2] ?? "away");
  return {
    homeCode,
    awayCode,
    homeTeam: cleanTeamName(params.homeTeam ?? titleTeams?.[1]) ?? TEAM_NAME_BY_CODE[homeCode] ?? homeCode.toUpperCase(),
    awayTeam: cleanTeamName(params.awayTeam ?? titleTeams?.[2]) ?? TEAM_NAME_BY_CODE[awayCode] ?? awayCode.toUpperCase(),
  };
}

function buildExactLineSlugGuesses(providerEventSlug: string, teamContext: TeamContext) {
  const slug = providerEventSlug.trim();
  const homeName = slugify(teamContext.homeTeam);
  const awayName = slugify(teamContext.awayTeam);
  return Array.from(new Set([
    `${slug}-spread`,
    `${slug}-handicap`,
    `${slug}-${teamContext.homeCode}-spread`,
    `${slug}-${teamContext.awayCode}-spread`,
    `${slug}-${homeName}-spread`,
    `${slug}-${awayName}-spread`,
    `${slug}-total-goals`,
    `${slug}-total-goals-25`,
    `${slug}-over-under`,
    `${slug}-over-25`,
    `${slug}-under-25`,
    `${slug}-team-total-${teamContext.homeCode}`,
    `${slug}-team-total-${teamContext.awayCode}`,
    `${slug}-${teamContext.homeCode}-team-total`,
    `${slug}-${teamContext.awayCode}-team-total`,
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

function cleanTeamName(value?: string | null) {
  const cleaned = value?.replace(/\s+/g, " ").trim();
  return cleaned && !["home", "away"].includes(cleaned.toLowerCase()) ? cleaned : null;
}

function codeForTeam(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z]+/g, " ").trim();
  const matched = Object.entries(TEAM_NAME_BY_CODE).find(([, name]) => name.toLowerCase() === normalized);
  return (matched?.[0] ?? normalized.slice(0, 3)) || "tbd";
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
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
    const [key, ...inlineParts] = part.slice(2).split("=");
    if (inlineParts.length > 0) {
      args[key] = inlineParts.join("=");
      continue;
    }
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
