import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const SPORTS_MARKET_TEMPLATES = [
  "MATCH_WINNER_1X2",
  "TOTAL_GOALS_2_5",
  "BOTH_TEAMS_TO_SCORE",
  "TEAM_TO_QUALIFY",
  "CORRECT_SCORE_BASIC",
] as const;

export type SportsMarketTemplate = (typeof SPORTS_MARKET_TEMPLATES)[number];

type Tx = Prisma.TransactionClient;

type EventForTemplate = {
  id: string;
  slug: string | null;
  title: string;
  homeTeamName: string | null;
  awayTeamName: string | null;
};

type OutcomeTemplate = {
  label: string;
  code: string;
  metadata?: Prisma.InputJsonObject;
};

type MarketTemplateInput = {
  title: string;
  description: string;
  marketType: string;
  rules: Prisma.InputJsonObject;
  outcomes: OutcomeTemplate[];
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const uniqueMarketSlug = (event: EventForTemplate, title: string) =>
  `${event.slug ?? slugify(event.title)}-${slugify(title)}-${Math.random().toString(36).slice(2, 8)}`;

const teamLabel = (value: string | null, fallback: string) => value?.trim() || fallback;

const templateMarkets = (template: SportsMarketTemplate, event: EventForTemplate): MarketTemplateInput[] => {
  const home = teamLabel(event.homeTeamName, "Home");
  const away = teamLabel(event.awayTeamName, "Away");

  switch (template) {
    case "MATCH_WINNER_1X2":
      return [
        {
          title: "Match Winner",
          description: `Who will win ${event.title}?`,
          marketType: "match_winner_1x2",
          rules: { template, settlement: "manual", result: "regulation_or_event_rules" },
          outcomes: [
            { label: home, code: "HOME", metadata: { side: "home" } },
            { label: "Draw", code: "DRAW", metadata: { side: "draw" } },
            { label: away, code: "AWAY", metadata: { side: "away" } },
          ],
        },
      ];
    case "TOTAL_GOALS_2_5":
      return [
        {
          title: "Total Goals 2.5",
          description: `Will ${event.title} finish over or under 2.5 total goals?`,
          marketType: "total_goals",
          rules: { template, settlement: "manual", line: 2.5 },
          outcomes: [
            { label: "Over 2.5", code: "OVER_2_5", metadata: { side: "over", line: 2.5 } },
            { label: "Under 2.5", code: "UNDER_2_5", metadata: { side: "under", line: 2.5 } },
          ],
        },
      ];
    case "BOTH_TEAMS_TO_SCORE":
      return [
        {
          title: "Both Teams To Score",
          description: `Will both teams score in ${event.title}?`,
          marketType: "both_teams_to_score",
          rules: { template, settlement: "manual" },
          outcomes: [
            { label: "Yes", code: "YES", metadata: { value: true } },
            { label: "No", code: "NO", metadata: { value: false } },
          ],
        },
      ];
    case "TEAM_TO_QUALIFY":
      return [
        {
          title: `Will ${home} qualify?`,
          description: `Will ${home} qualify from ${event.title}?`,
          marketType: "team_to_qualify",
          rules: { template, settlement: "manual", team: "home" },
          outcomes: [
            { label: "Yes", code: "YES", metadata: { team: "home", value: true } },
            { label: "No", code: "NO", metadata: { team: "home", value: false } },
          ],
        },
        {
          title: `Will ${away} qualify?`,
          description: `Will ${away} qualify from ${event.title}?`,
          marketType: "team_to_qualify",
          rules: { template, settlement: "manual", team: "away" },
          outcomes: [
            { label: "Yes", code: "YES", metadata: { team: "away", value: true } },
            { label: "No", code: "NO", metadata: { team: "away", value: false } },
          ],
        },
      ];
    case "CORRECT_SCORE_BASIC":
      return [
        {
          title: "Correct Score Basic",
          description: `What will be the correct score in ${event.title}?`,
          marketType: "correct_score",
          rules: { template, settlement: "manual", scoreSet: "basic" },
          outcomes: ["0-0", "1-0", "0-1", "1-1", "2-1", "1-2", "Other"].map((score) => ({
            label: score,
            code: score === "Other" ? "OTHER" : score,
            metadata: { score },
          })),
        },
      ];
  }
};

export const isSportsMarketTemplate = (value: unknown): value is SportsMarketTemplate =>
  typeof value === "string" && SPORTS_MARKET_TEMPLATES.includes(value as SportsMarketTemplate);

export const createMarketsFromSportsTemplate = async (params: {
  eventId: string;
  template: SportsMarketTemplate;
  createdBy?: string | null;
  status?: "UPCOMING" | "LIVE";
  tx?: Tx;
}) => {
  const client = params.tx ?? prisma;
  const event = await client.event.findUnique({
    where: { id: params.eventId },
    select: {
      id: true,
      slug: true,
      title: true,
      homeTeamName: true,
      awayTeamName: true,
      category: true,
      startTime: true,
    },
  });
  if (!event) {
    throw new Error("Event not found.");
  }

  const markets = [];
  for (const marketTemplate of templateMarkets(params.template, event)) {
    const market = await client.market.create({
      data: {
        slug: uniqueMarketSlug(event, marketTemplate.title),
        title: marketTemplate.title,
        description: marketTemplate.description,
        eventId: event.id,
        categoryLegacy: event.category ?? "sports",
        type: marketTemplate.outcomes.length > 2 ? "MULTI_WINNER" : "BINARY",
        kind: "ORDERBOOK",
        mechanism: "ORDERBOOK",
        visibility: "PUBLIC",
        status: params.status ?? "UPCOMING",
        marketType: marketTemplate.marketType,
        rules: marketTemplate.rules,
        betCloseTime: event.startTime ?? null,
        closeTime: event.startTime ?? null,
        createdBy: params.createdBy ?? null,
        outcomes: {
          create: marketTemplate.outcomes.map((outcome, index) => ({
            name: outcome.label,
            label: outcome.label,
            code: outcome.code,
            displayOrder: index,
            status: "active",
            isActive: true,
            isTradable: true,
            metadata: outcome.metadata ?? {},
          })),
        },
      },
      include: { outcomes: { orderBy: [{ displayOrder: "asc" }] } },
    });
    markets.push(market);
  }

  return markets;
};

export const createMarketsFromSportsTemplates = async (params: {
  eventId: string;
  templates: SportsMarketTemplate[];
  createdBy?: string | null;
  status?: "UPCOMING" | "LIVE";
}) =>
  prisma.$transaction(async (tx) => {
    const created = [];
    for (const template of params.templates) {
      created.push(
        ...(await createMarketsFromSportsTemplate({
          eventId: params.eventId,
          template,
          createdBy: params.createdBy,
          status: params.status,
          tx,
        })),
      );
    }
    return created;
  });
