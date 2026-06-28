import { Prisma, MarketStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

type Fixture = {
  matchNo: string;
  slug: string;
  title: string;
  home: string;
  away: string;
  group: string;
  venue: string;
  city: string;
  kickoffLocal: string;
  startTime: string;
};

type OutcomeSpec = {
  name: string;
  code: string;
  side?: string;
  metadata?: Prisma.InputJsonValue;
};

type MarketSpec = {
  key: string;
  title: string;
  description: string;
  marketType: string;
  groupKey: string;
  groupTitle: string;
  displayOrder: number;
  line?: number;
  unit?: string;
  participantName?: string;
  participantType?: string;
  propCategory?: string;
  rules: Prisma.InputJsonValue;
  outcomes: OutcomeSpec[];
};

const fixtures: Fixture[] = [
  {
    matchNo: "M55",
    slug: "world-cup-2026-curacao-vs-cote-divoire-2026-06-25",
    title: "Curaçao vs Côte d'Ivoire",
    home: "Curaçao",
    away: "Côte d'Ivoire",
    group: "Group E",
    venue: "Philadelphia Stadium",
    city: "Philadelphia",
    kickoffLocal: "2026-06-25 4:00 PM ET",
    startTime: "2026-06-25T20:00:00.000Z",
  },
  {
    matchNo: "M56",
    slug: "world-cup-2026-ecuador-vs-germany-2026-06-25",
    title: "Ecuador vs Germany",
    home: "Ecuador",
    away: "Germany",
    group: "Group E",
    venue: "New York New Jersey Stadium",
    city: "East Rutherford",
    kickoffLocal: "2026-06-25 4:00 PM ET",
    startTime: "2026-06-25T20:00:00.000Z",
  },
  {
    matchNo: "M57",
    slug: "world-cup-2026-japan-vs-sweden-2026-06-25",
    title: "Japan vs Sweden",
    home: "Japan",
    away: "Sweden",
    group: "Group F",
    venue: "Dallas Stadium",
    city: "Arlington",
    kickoffLocal: "2026-06-25 6:00 PM CT",
    startTime: "2026-06-25T23:00:00.000Z",
  },
  {
    matchNo: "M58",
    slug: "world-cup-2026-tunisia-vs-netherlands-2026-06-25",
    title: "Tunisia vs Netherlands",
    home: "Tunisia",
    away: "Netherlands",
    group: "Group F",
    venue: "Kansas City Stadium",
    city: "Kansas City",
    kickoffLocal: "2026-06-25 6:00 PM CT",
    startTime: "2026-06-25T23:00:00.000Z",
  },
  {
    matchNo: "M59",
    slug: "world-cup-2026-turkiye-vs-usa-2026-06-25",
    title: "Türkiye vs USA",
    home: "Türkiye",
    away: "USA",
    group: "Group D",
    venue: "Los Angeles Stadium",
    city: "Inglewood",
    kickoffLocal: "2026-06-25 7:00 PM PT",
    startTime: "2026-06-26T02:00:00.000Z",
  },
  {
    matchNo: "M60",
    slug: "world-cup-2026-paraguay-vs-australia-2026-06-25",
    title: "Paraguay vs Australia",
    home: "Paraguay",
    away: "Australia",
    group: "Group D",
    venue: "San Francisco Bay Area Stadium",
    city: "Santa Clara",
    kickoffLocal: "2026-06-25 7:00 PM PT",
    startTime: "2026-06-26T02:00:00.000Z",
  },
];

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const yesNo = (yesMetadata: Prisma.InputJsonValue, noMetadata: Prisma.InputJsonValue): OutcomeSpec[] => [
  { name: "Yes", code: "YES", side: "yes", metadata: yesMetadata },
  { name: "No", code: "NO", side: "no", metadata: noMetadata },
];

function buildMarketSpecs(fixture: Fixture): MarketSpec[] {
  const specs: MarketSpec[] = [
    {
      key: "match-winner",
      title: "Match Winner",
      description: `Who will win ${fixture.title}? Draw is available as its own outcome.`,
      marketType: "match_winner_1x2",
      groupKey: "main",
      groupTitle: "Main",
      displayOrder: 10,
      rules: { template: "MATCH_WINNER_1X2", settlement: "manual", source: "official_result" },
      outcomes: [
        { name: fixture.home, code: "HOME", side: "home", metadata: { team: fixture.home } },
        { name: "Draw", code: "DRAW", side: "draw", metadata: { result: "draw" } },
        { name: fixture.away, code: "AWAY", side: "away", metadata: { team: fixture.away } },
      ],
    },
    {
      key: "home-draw-no-bet",
      title: `${fixture.home} draw no bet`,
      description: `Will ${fixture.home} win ${fixture.title}, with draw treated as void for operator review?`,
      marketType: "draw_no_bet",
      groupKey: "main",
      groupTitle: "Main",
      displayOrder: 20,
      participantName: fixture.home,
      participantType: "team",
      rules: { template: "DRAW_NO_BET", team: "home", voidOnDraw: true, settlement: "manual" },
      outcomes: yesNo({ team: fixture.home, result: "home_win" }, { team: fixture.home, result: "away_win" }),
    },
    {
      key: "away-draw-no-bet",
      title: `${fixture.away} draw no bet`,
      description: `Will ${fixture.away} win ${fixture.title}, with draw treated as void for operator review?`,
      marketType: "draw_no_bet",
      groupKey: "main",
      groupTitle: "Main",
      displayOrder: 21,
      participantName: fixture.away,
      participantType: "team",
      rules: { template: "DRAW_NO_BET", team: "away", voidOnDraw: true, settlement: "manual" },
      outcomes: yesNo({ team: fixture.away, result: "away_win" }, { team: fixture.away, result: "home_win" }),
    },
    {
      key: "both-teams-to-score",
      title: "Both teams to score",
      description: `Will both teams score in ${fixture.title}?`,
      marketType: "both_teams_to_score",
      groupKey: "goals",
      groupTitle: "Goals",
      displayOrder: 30,
      propCategory: "goals",
      rules: { template: "BOTH_TEAMS_TO_SCORE", settlement: "manual" },
      outcomes: yesNo({ bothTeamsScore: true }, { bothTeamsScore: false }),
    },
    {
      key: "first-team-to-score",
      title: "First team to score",
      description: `Which team will score first in ${fixture.title}?`,
      marketType: "first_team_to_score",
      groupKey: "goals",
      groupTitle: "Goals",
      displayOrder: 31,
      propCategory: "goals",
      rules: { template: "FIRST_TEAM_TO_SCORE", settlement: "manual" },
      outcomes: [
        { name: fixture.home, code: "HOME", side: "home", metadata: { team: fixture.home, firstGoal: "home" } },
        { name: "No goal", code: "NO_GOAL", side: "none", metadata: { firstGoal: "none" } },
        { name: fixture.away, code: "AWAY", side: "away", metadata: { team: fixture.away, firstGoal: "away" } },
      ],
    },
    {
      key: "home-clean-sheet",
      title: `${fixture.home} clean sheet`,
      description: `Will ${fixture.home} prevent ${fixture.away} from scoring?`,
      marketType: "clean_sheet",
      groupKey: "goals",
      groupTitle: "Goals",
      displayOrder: 32,
      participantName: fixture.home,
      participantType: "team",
      propCategory: "goals",
      rules: { template: "CLEAN_SHEET", team: "home", settlement: "manual" },
      outcomes: yesNo({ team: fixture.home, cleanSheet: true }, { team: fixture.home, cleanSheet: false }),
    },
    {
      key: "away-clean-sheet",
      title: `${fixture.away} clean sheet`,
      description: `Will ${fixture.away} prevent ${fixture.home} from scoring?`,
      marketType: "clean_sheet",
      groupKey: "goals",
      groupTitle: "Goals",
      displayOrder: 33,
      participantName: fixture.away,
      participantType: "team",
      propCategory: "goals",
      rules: { template: "CLEAN_SHEET", team: "away", settlement: "manual" },
      outcomes: yesNo({ team: fixture.away, cleanSheet: true }, { team: fixture.away, cleanSheet: false }),
    },
  ];

  for (const [index, line] of [0.5, 1.5, 2.5, 3.5, 4.5, 5.5].entries()) {
    specs.push({
      key: `total-goals-${line}`,
      title: `Total goals ${line}`,
      description: `Will ${fixture.title} finish over or under ${line} total goals?`,
      marketType: "total_goals",
      groupKey: "totals",
      groupTitle: "Totals",
      displayOrder: 100 + index,
      line,
      unit: "goals",
      propCategory: "goals",
      rules: { template: "TOTAL_GOALS", line, settlement: "manual" },
      outcomes: [
        { name: `Over ${line}`, code: `OVER_${String(line).replace(".", "_")}`, side: "over", metadata: { side: "over", line } },
        { name: `Under ${line}`, code: `UNDER_${String(line).replace(".", "_")}`, side: "under", metadata: { side: "under", line } },
      ],
    });
  }

  for (const team of [
    { label: fixture.home, side: "home" },
    { label: fixture.away, side: "away" },
  ]) {
    for (const [index, line] of [0.5, 1.5, 2.5, 3.5, 4.5, 5.5].entries()) {
      specs.push({
        key: `${team.side}-team-total-${line}`,
        title: `${team.label} goals ${line}`,
        description: `Will ${team.label} score over or under ${line} goals?`,
        marketType: "team_total_goals",
        groupKey: "team-totals",
        groupTitle: "Team Totals",
        displayOrder: (team.side === "home" ? 200 : 220) + index,
        line,
        unit: "goals",
        participantName: team.label,
        participantType: "team",
        propCategory: "goals",
        rules: { template: "TEAM_TOTAL_GOALS", team: team.side, line, settlement: "manual" },
        outcomes: [
          { name: `Over ${line}`, code: `OVER_${String(line).replace(".", "_")}`, side: "over", metadata: { team: team.side, side: "over", line } },
          { name: `Under ${line}`, code: `UNDER_${String(line).replace(".", "_")}`, side: "under", metadata: { team: team.side, side: "under", line } },
        ],
      });
    }
  }

  for (const team of [
    { label: fixture.home, side: "home", direction: 1 },
    { label: fixture.away, side: "away", direction: -1 },
  ]) {
    for (const [index, baseLine] of [0.5, 1.5, 2.5, 3.5, 4.5, 5.5].entries()) {
      const line = baseLine * team.direction;
      const lineText = line > 0 ? `+${line}` : String(line);
      specs.push({
        key: `${team.side}-spread-${lineText.replace("+", "plus").replace("-", "minus").replace(".", "_")}`,
        title: `${team.label} ${lineText}`,
        description: `Will ${team.label} cover the ${lineText} goal handicap in ${fixture.title}?`,
        marketType: "spread",
        groupKey: "spreads",
        groupTitle: "Spreads",
        displayOrder: (team.side === "home" ? 300 : 340) + index,
        line,
        unit: "goals",
        participantName: team.label,
        participantType: "team",
        propCategory: "handicap",
        rules: { template: "SOCCER_HANDICAP", team: team.side, line, settlement: "manual", recalculationRequired: true },
        outcomes: yesNo({ team: team.side, cover: true, line }, { team: team.side, cover: false, line }),
      });
    }
  }

  return specs;
}

async function ensureTags() {
  const tags = [
    { name: "Sports", slug: "sports", group: "category", order: 1 },
    { name: "Soccer", slug: "soccer", group: "sports", order: 2 },
    { name: "World Cup", slug: "world-cup", group: "competition", order: 3 },
    { name: "Operator Imported", slug: "operator-imported", group: "ops", order: 99 },
  ];

  const tagIds = new Map<string, string>();
  for (const tag of tags) {
    const row = await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name, group: tag.group, order: tag.order, isActive: true },
      create: tag,
      select: { id: true, slug: true },
    });
    tagIds.set(row.slug, row.id);
  }
  return tagIds;
}

async function upsertOutcomes(marketId: string, marketSlug: string, outcomes: OutcomeSpec[]) {
  const expectedCodes = new Set(outcomes.map((outcome) => outcome.code));

  for (const [index, outcome] of outcomes.entries()) {
    const existing = await prisma.outcome.findFirst({
      where: { marketId, code: outcome.code },
      select: { id: true },
    });

    if (existing) {
      await prisma.outcome.update({
        where: { id: existing.id },
        data: {
          name: outcome.name,
          label: outcome.name,
          side: outcome.side,
          displayOrder: index,
          isActive: true,
          isTradable: true,
          status: "active",
          metadata: outcome.metadata ?? Prisma.JsonNull,
          referenceOutcomeLabel: outcome.name,
        },
      });
      continue;
    }

    await prisma.outcome.create({
      data: {
        marketId,
        name: outcome.name,
        label: outcome.name,
        code: outcome.code,
        side: outcome.side,
        displayOrder: index,
        isActive: true,
        isTradable: true,
        status: "active",
        metadata: outcome.metadata ?? Prisma.JsonNull,
        referenceOutcomeLabel: outcome.name,
        slug: `${marketSlug}-${slugify(outcome.code)}`,
      },
    });
  }

  await prisma.outcome.updateMany({
    where: { marketId, code: { notIn: Array.from(expectedCodes) } },
    data: { isActive: false, status: "archived" },
  });
}

async function main() {
  const tagIds = await ensureTags();
  const createdEventSlugs: string[] = [];
  const createdMarketSlugs: string[] = [];

  for (const fixture of fixtures) {
    const startTime = new Date(fixture.startTime);
    const event = await prisma.event.upsert({
      where: { slug: fixture.slug },
      update: {
        title: fixture.title,
        description: `${fixture.matchNo} ${fixture.group}. Operator-imported World Cup match for internal product review.`,
        category: "sports",
        sportKey: "soccer",
        leagueKey: "world_cup",
        eventType: "match",
        homeTeamName: fixture.home,
        awayTeamName: fixture.away,
        startTime,
        status: "scheduled",
        liveStatus: "pre_match",
        venue: fixture.venue,
        source: "fifa_schedule",
        externalEventId: fixture.matchNo,
        externalSlug: fixture.slug,
        metadata: {
          source: "FIFA schedule",
          importedBy: "operator_script",
          competition: "FIFA World Cup 2026",
          group: fixture.group,
          venue: fixture.venue,
          city: fixture.city,
          kickoffLocal: fixture.kickoffLocal,
          caution: "Internal display/testing market set. Settlement requires operator review.",
        },
      },
      create: {
        slug: fixture.slug,
        title: fixture.title,
        description: `${fixture.matchNo} ${fixture.group}. Operator-imported World Cup match for internal product review.`,
        category: "sports",
        sportKey: "soccer",
        leagueKey: "world_cup",
        eventType: "match",
        homeTeamName: fixture.home,
        awayTeamName: fixture.away,
        startTime,
        status: "scheduled",
        liveStatus: "pre_match",
        venue: fixture.venue,
        source: "fifa_schedule",
        externalEventId: fixture.matchNo,
        externalSlug: fixture.slug,
        metadata: {
          source: "FIFA schedule",
          importedBy: "operator_script",
          competition: "FIFA World Cup 2026",
          group: fixture.group,
          venue: fixture.venue,
          city: fixture.city,
          kickoffLocal: fixture.kickoffLocal,
          caution: "Internal display/testing market set. Settlement requires operator review.",
        },
      },
      select: { id: true, slug: true },
    });

    createdEventSlugs.push(event.slug ?? fixture.slug);

    for (const spec of buildMarketSpecs(fixture)) {
      const marketSlug = `${fixture.slug}-${spec.key}`;
      const market = await prisma.market.upsert({
        where: { slug: marketSlug },
        update: {
          title: `${fixture.title}: ${spec.title}`,
          description: spec.description,
          marketType: spec.marketType,
          marketGroupKey: spec.groupKey,
          marketGroupTitle: spec.groupTitle,
          displayOrder: spec.displayOrder,
          line: spec.line === undefined ? null : new Prisma.Decimal(spec.line),
          unit: spec.unit,
          participantName: spec.participantName,
          participantType: spec.participantType,
          propCategory: spec.propCategory,
          status: MarketStatus.LIVE,
          eventId: event.id,
          betCloseTime: startTime,
          closeTime: startTime,
          resolveTime: startTime,
          rules: spec.rules,
          rulesText: "Internal operator review only. Final settlement requires official result source and manual approval.",
          referenceSource: "fifa_schedule",
          externalMarketId: `${fixture.matchNo}-${spec.key}`,
          externalSlug: marketSlug,
          sourceUpdatedAt: new Date(),
          referenceMetadata: {
            source: "FIFA schedule",
            sourceUrl: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums",
            importedBy: "operator_script",
            fixture: fixture.matchNo,
            recalculationRequired: spec.marketType === "spread",
          },
          visibility: "PUBLIC",
          mechanism: "ORDERBOOK",
          kind: "ORDERBOOK",
          isListed: true,
        },
        create: {
          slug: marketSlug,
          title: `${fixture.title}: ${spec.title}`,
          description: spec.description,
          marketType: spec.marketType,
          marketGroupKey: spec.groupKey,
          marketGroupTitle: spec.groupTitle,
          displayOrder: spec.displayOrder,
          line: spec.line === undefined ? undefined : new Prisma.Decimal(spec.line),
          unit: spec.unit,
          participantName: spec.participantName,
          participantType: spec.participantType,
          propCategory: spec.propCategory,
          status: MarketStatus.LIVE,
          eventId: event.id,
          betCloseTime: startTime,
          closeTime: startTime,
          resolveTime: startTime,
          rules: spec.rules,
          rulesText: "Internal operator review only. Final settlement requires official result source and manual approval.",
          referenceSource: "fifa_schedule",
          externalMarketId: `${fixture.matchNo}-${spec.key}`,
          externalSlug: marketSlug,
          sourceUpdatedAt: new Date(),
          referenceMetadata: {
            source: "FIFA schedule",
            sourceUrl: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums",
            importedBy: "operator_script",
            fixture: fixture.matchNo,
            recalculationRequired: spec.marketType === "spread",
          },
          visibility: "PUBLIC",
          mechanism: "ORDERBOOK",
          kind: "ORDERBOOK",
          isListed: true,
        },
        select: { id: true, slug: true },
      });

      await upsertOutcomes(market.id, market.slug ?? marketSlug, spec.outcomes);
      createdMarketSlugs.push(market.slug ?? marketSlug);

      for (const tagId of tagIds.values()) {
        await prisma.marketTag.upsert({
          where: { marketId_tagId: { marketId: market.id, tagId } },
          update: {},
          create: { marketId: market.id, tagId },
        });
      }
    }
  }

  const summary = {
    fixtureCount: fixtures.length,
    eventSlugs: createdEventSlugs,
    marketCount: createdMarketSlugs.length,
    outcomesCount: await prisma.outcome.count({
      where: { market: { slug: { in: createdMarketSlugs } } },
    }),
  };

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
