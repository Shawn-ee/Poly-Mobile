import { Prisma } from "@prisma/client";

type ProviderEventLike = {
  externalSlug: string;
  title: string;
  description?: string | null;
  category?: string | null;
  tags?: string[];
};

type ProviderMarketLike = {
  question: string;
  slug: string;
  groupItemTitle?: string | null;
  outcomes?: string[];
};

export type NormalizedSoccerEvent = {
  sportKey: "soccer";
  leagueKey: "world_cup" | "soccer_awards" | "soccer";
  eventType: "match" | "outright" | "future";
  marketProfile: "outright" | "to_advance" | "regulation_90" | "full_match_with_overtime";
  resultMode: "one_winner" | "can_draw" | "no_draw";
  homeTeamName: string | null;
  awayTeamName: string | null;
  period: string | null;
  clock: string | null;
  gameRules: {
    allowDraw: boolean;
    includesOvertime: boolean;
    description: string;
  };
  supportedMarketTypes: string[];
};

export type NormalizedSoccerMarket = {
  marketType:
    | "outright"
    | "to_advance"
    | "match_winner_1x2"
    | "spread"
    | "total_goals"
    | "team_total_goals"
    | "first_half_winner"
    | "second_half_winner"
    | "soccer_unknown";
  marketGroupKey: string;
  marketGroupTitle: string;
  period: string;
  line: Prisma.Decimal | null;
  unit: string | null;
  participantType: string | null;
  participantName: string | null;
  participantId: string | null;
  propCategory: string | null;
  outcomeSideByLabel: Record<string, string>;
  rules: Prisma.InputJsonValue;
  rulesText: string;
};

export function normalizePolymarketSoccerEvent(event: ProviderEventLike): NormalizedSoccerEvent {
  const key = `${event.externalSlug} ${event.title} ${event.description ?? ""} ${(event.tags ?? []).join(" ")}`.toLowerCase();
  const isWorldCup = key.includes("world cup") || key.includes("world-cup");
  const isWinner = key.includes("winner") || key.includes("outright");
  const isAward = key.includes("ballon") || key.includes("award");
  if (isWorldCup && isWinner) {
    return {
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "future",
      marketProfile: "outright",
      resultMode: "one_winner",
      homeTeamName: "World Cup",
      awayTeamName: "Winner",
      period: "Futures",
      clock: "Live",
      gameRules: {
        allowDraw: false,
        includesOvertime: false,
        description: "Tournament outright winner market. Exactly one participant wins.",
      },
      supportedMarketTypes: ["outright"],
    };
  }
  if (isWinner || isAward) {
    return {
      sportKey: "soccer",
      leagueKey: isAward ? "soccer_awards" : "soccer",
      eventType: "future",
      marketProfile: "outright",
      resultMode: "one_winner",
      homeTeamName: event.title,
      awayTeamName: "Winner",
      period: "Futures",
      clock: "Live",
      gameRules: {
        allowDraw: false,
        includesOvertime: false,
        description: "Soccer futures/outright winner market. Exactly one participant wins.",
      },
      supportedMarketTypes: ["outright"],
    };
  }

  const teams = parseTeams(event.title);
  const hasAdvanceIntent = hasAdvanceLanguage(key);
  const canDraw = !hasAdvanceIntent && !key.includes("penalties") && !key.includes("extra time");
  return {
    sportKey: "soccer",
    leagueKey: "world_cup",
    eventType: "match",
    marketProfile: hasAdvanceIntent ? "to_advance" : canDraw ? "regulation_90" : "full_match_with_overtime",
    resultMode: canDraw ? "can_draw" : "no_draw",
    homeTeamName: teams?.home ?? null,
    awayTeamName: teams?.away ?? null,
    period: "Regulation",
    clock: null,
    gameRules: {
      allowDraw: canDraw,
      includesOvertime: !canDraw,
      description: hasAdvanceIntent
        ? "Advance/qualify market with no draw outcome."
        : canDraw
          ? "Regulation-time soccer market can settle as home win, draw, or away win."
          : "Full-match market includes extra time or penalties and has no draw outcome.",
    },
    supportedMarketTypes: [hasAdvanceIntent ? "to_advance" : canDraw ? "regulation_90" : "full_match_with_overtime"],
  };
}

export function normalizePolymarketSoccerMarket(
  event: NormalizedSoccerEvent,
  market: ProviderMarketLike,
  participantName: string | null,
): NormalizedSoccerMarket {
  const key = `${market.question} ${market.slug} ${market.groupItemTitle ?? ""}`.toLowerCase();
  const period = derivePeriod(key, event);
  const line = extractLine(key);
  const participant = participantName ?? market.groupItemTitle ?? extractWinnerParticipant(market.question);
  const participantType = participant ? event.leagueKey === "soccer_awards" ? "player" : "team" : null;

  if (event.marketProfile === "outright" || /^will\s+.+?\s+win\b/i.test(market.question)) {
    return {
      marketType: "outright",
      marketGroupKey: "outrights",
      marketGroupTitle: "Outrights",
      period: "futures",
      line: null,
      unit: null,
      participantType,
      participantName: participant,
      participantId: participant ? slugify(participant) : null,
      propCategory: null,
      outcomeSideByLabel: { yes: "yes", no: "no" },
      rules: {
        template: "SOCCER_OUTRIGHT_WINNER",
        resultMode: event.resultMode,
        participant,
        providerParsedFrom: "polymarket-gamma",
      },
      rulesText: "Soccer outright winner market normalized from Polymarket provider data.",
    };
  }

  if (hasAdvanceLanguage(key)) {
    return simpleMarket("to_advance", "advance", "To Advance", period, participant, line, "SOCCER_TO_ADVANCE");
  }
  if (key.includes("spread") || key.includes("handicap")) {
    return simpleMarket("spread", "spread", "Spread", period, participant, line, "SOCCER_HANDICAP");
  }
  if (key.includes("team") && key.includes("total")) {
    return simpleMarket("team_total_goals", "team-totals", "Team Totals", period, participant, line, "SOCCER_TEAM_TOTAL_GOALS");
  }
  if (key.includes("total") || key.includes("over") || key.includes("under")) {
    return simpleMarket("total_goals", "totals", "Totals", period, null, line, "SOCCER_TOTAL_GOALS");
  }
  if (period === "first-half") {
    return simpleMarket("first_half_winner", "halves", "First Half", period, participant, null, "SOCCER_FIRST_HALF_WINNER");
  }
  if (period === "second-half") {
    return simpleMarket("second_half_winner", "halves", "Second Half", period, participant, null, "SOCCER_SECOND_HALF_WINNER");
  }

  return {
    marketType: event.marketProfile === "regulation_90" ? "match_winner_1x2" : "soccer_unknown",
    marketGroupKey: "main",
    marketGroupTitle: event.marketProfile === "regulation_90" ? "Regulation Winner" : "Game Lines",
    period,
    line: null,
    unit: null,
    participantType: participant ? "team" : null,
    participantName: participant,
    participantId: participant ? slugify(participant) : null,
    propCategory: null,
    outcomeSideByLabel: { home: "home", draw: "draw", tie: "draw", away: "away", yes: "yes", no: "no" },
    rules: {
      template: event.marketProfile === "regulation_90" ? "SOCCER_REGULATION_WINNER" : "SOCCER_MARKET_UNCLASSIFIED",
      resultMode: event.resultMode,
      providerParsedFrom: "polymarket-gamma",
    },
    rulesText: "Soccer market normalized from Polymarket provider data.",
  };
}

export function normalizedSoccerMetadata(params: {
  event: NormalizedSoccerEvent;
  market?: NormalizedSoccerMarket | null;
}): Prisma.InputJsonValue {
  return {
    normalizedSoccer: {
      version: 1,
      sportKey: params.event.sportKey,
      leagueKey: params.event.leagueKey,
      eventType: params.event.eventType,
      marketProfile: params.event.marketProfile,
      resultMode: params.event.resultMode,
      gameRules: params.event.gameRules,
      supportedMarketTypes: params.event.supportedMarketTypes,
      market: params.market
        ? {
            marketType: params.market.marketType,
            marketGroupKey: params.market.marketGroupKey,
            marketGroupTitle: params.market.marketGroupTitle,
            period: params.market.period,
            line: params.market.line?.toString() ?? null,
            participantType: params.market.participantType,
            participantName: params.market.participantName,
            participantId: params.market.participantId,
          }
        : null,
    },
  };
}

function simpleMarket(
  marketType: NormalizedSoccerMarket["marketType"],
  marketGroupKey: string,
  marketGroupTitle: string,
  period: string,
  participantName: string | null,
  line: Prisma.Decimal | null,
  template: string,
): NormalizedSoccerMarket {
  return {
    marketType,
    marketGroupKey,
    marketGroupTitle,
    period,
    line,
    unit: marketType.includes("goal") || marketType === "spread" ? "goals" : null,
    participantType: participantName ? "team" : null,
    participantName,
    participantId: participantName ? slugify(participantName) : null,
    propCategory: null,
    outcomeSideByLabel: { yes: "yes", no: "no", over: "over", under: "under", home: "home", away: "away", draw: "draw", tie: "draw" },
    rules: {
      template,
      period,
      line: line?.toString() ?? null,
      participant: participantName,
      providerParsedFrom: "polymarket-gamma",
    },
    rulesText: `${marketGroupTitle} soccer market normalized from Polymarket provider data.`,
  };
}

function hasAdvanceLanguage(value: string) {
  return /\b(advance|advances|qualify|qualifies|qualification|to advance|to qualify|penalty|penalties|shootout|extra time)\b/i.test(value);
}

function derivePeriod(key: string, event: NormalizedSoccerEvent) {
  if (key.includes("first half") || key.includes("1st half")) return "first-half";
  if (key.includes("second half") || key.includes("2nd half")) return "second-half";
  if (event.eventType === "future") return "futures";
  return "regulation";
}

function extractLine(key: string) {
  const match = key.match(/(?:over|under|spread|handicap|total|goals?)\s*([+-]?\d+(?:\.\d+)?)/i);
  if (!match?.[1]) return null;
  return new Prisma.Decimal(match[1]);
}

function extractWinnerParticipant(question: string) {
  const match = question.match(/^Will\s+(.+?)\s+win\b/i);
  return match?.[1]?.trim() ?? null;
}

function parseTeams(title: string) {
  const match = title.match(/^(.+?)\s+(?:vs\.?|v\.?)\s+(.+)$/i);
  if (!match?.[1] || !match?.[2]) return null;
  return { home: match[1].trim(), away: match[2].trim() };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
