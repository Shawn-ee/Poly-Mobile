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

const DEFAULT_PROVIDER_EVENT_SLUG = "fifwc-arg-egy-2026-07-07";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-current-mobile-provider-line-market-availability.json";
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
  const teamContext = deriveTeamContext({
    providerEventSlug,
    eventTitle: exactCandidates[0]?.eventTitle ?? null,
    homeTeam: args.homeTeam,
    awayTeam: args.awayTeam,
  });
  const lineTargets = buildLineTargets(teamContext);
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
    teamContext,
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

function buildLineTargets(teamContext: TeamContext) {
  const { homeTeam, awayTeam, homeCode, awayCode } = teamContext;
  const teamPair = `${homeTeam} ${awayTeam}`;
  const base = {
    id: "line-target",
    period: null,
    eventTitle: `${homeTeam} vs ${awayTeam}`,
    unit: "goals",
    marketGroupKey: "game-lines",
    marketGroupTitle: "Game Lines",
  };
  return [
    {
      key: `spread-${homeCode}-plus-1-5`,
      market: {
        ...base,
        id: `line-target-spread-${homeCode}`,
        title: `${homeTeam} +1.5`,
        marketType: "spread",
        line: new Prisma.Decimal("1.5"),
        outcomes: yesNoOutcomes(),
      },
      extraQueries: [
        `${teamPair} spread`,
        `${teamPair} handicap`,
        `${homeTeam} cover 1.5 ${awayTeam}`,
      ],
    },
    {
      key: `spread-${awayCode}-minus-1-5`,
      market: {
        ...base,
        id: `line-target-spread-${awayCode}`,
        title: `${awayTeam} -1.5`,
        marketType: "spread",
        line: new Prisma.Decimal("-1.5"),
        outcomes: yesNoOutcomes(),
      },
      extraQueries: [
        `${awayTeam} ${homeTeam} spread`,
        `${awayTeam} ${homeTeam} handicap`,
        `${awayTeam} cover 1.5 ${homeTeam}`,
      ],
    },
    {
      key: "total-goals-2-5",
      market: {
        ...base,
        id: "line-target-total-25",
        title: `${homeTeam} vs ${awayTeam} total goals 2.5`,
        marketType: "total_goals",
        line: new Prisma.Decimal("2.5"),
        outcomes: overUnderOutcomes("2.5"),
      },
      extraQueries: [
        `${teamPair} total goals`,
        `${teamPair} over under`,
        `${teamPair} goals over 2.5`,
      ],
    },
    {
      key: `team-total-${homeCode}-1-5`,
      market: {
        ...base,
        id: `line-target-team-total-${homeCode}`,
        title: `${homeTeam} goals 1.5`,
        marketType: "team_total_goals",
        line: new Prisma.Decimal("1.5"),
        outcomes: overUnderOutcomes("1.5"),
      },
      extraQueries: [
        `${teamPair} team total`,
        `${homeTeam} team goals over 1.5 ${awayTeam}`,
      ],
    },
    {
      key: `first-half-winner-${homeCode}`,
      market: {
        ...base,
        id: "line-target-first-half",
        title: `First half ${homeTeam} winner`,
        marketType: "first_half_winner",
        period: "first-half",
        line: null,
        outcomes: yesNoOutcomes(),
      },
      extraQueries: [
        `${teamPair} first half`,
        `${homeTeam} first half winner ${awayTeam}`,
      ],
    },
    {
      key: "corners-8-5",
      market: {
        ...base,
        id: "line-target-corners",
        title: `${homeTeam} vs ${awayTeam} corners 8.5`,
        marketType: "corners",
        line: new Prisma.Decimal("8.5"),
        outcomes: overUnderOutcomes("8.5"),
      },
      extraQueries: [
        `${teamPair} corners`,
        `${teamPair} corner kicks over 8.5`,
      ],
    },
  ];
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

function cleanTeamName(value?: string | null) {
  const cleaned = value?.replace(/\s+/g, " ").trim();
  return cleaned && !["home", "away"].includes(cleaned.toLowerCase()) ? cleaned : null;
}

function codeForTeam(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z]+/g, " ").trim();
  const matched = Object.entries(TEAM_NAME_BY_CODE).find(([, name]) => name.toLowerCase() === normalized);
  return (matched?.[0] ?? normalized.slice(0, 3)) || "tbd";
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
