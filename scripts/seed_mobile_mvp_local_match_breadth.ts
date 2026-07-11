import fs from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { upsertReferenceQuoteSnapshots } from "@/server/services/referenceQuoteSnapshots";

const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/batch-internal-readiness-latest/mobile-mvp-local-match-breadth.json";

type MatchSpec = {
  slug: string;
  title: string;
  home: string;
  away: string;
  homeCode: string;
  awayCode: string;
  startOffsetMinutes: number;
};

type OutcomeSpec = {
  code: string;
  name: string;
  side: string;
  price: number;
};

type MarketSpec = {
  key: string;
  title: string;
  marketType: string;
  marketGroupKey: string;
  marketGroupTitle: string;
  period: string;
  displayOrder: number;
  line?: string;
  unit?: string;
  participantName?: string;
  outcomes: OutcomeSpec[];
};

const matches: MatchSpec[] = [
  {
    slug: "holiwyn-local-mexico-vs-ecuador",
    title: "Mexico vs. Ecuador",
    home: "Mexico",
    away: "Ecuador",
    homeCode: "MEX",
    awayCode: "ECU",
    startOffsetMinutes: 45,
  },
  {
    slug: "holiwyn-local-england-vs-congo-dr",
    title: "England vs. Congo DR",
    home: "England",
    away: "Congo DR",
    homeCode: "ENG",
    awayCode: "COD",
    startOffsetMinutes: 75,
  },
  {
    slug: "holiwyn-local-australia-vs-egypt",
    title: "Australia vs. Egypt",
    home: "Australia",
    away: "Egypt",
    homeCode: "AUS",
    awayCode: "EGY",
    startOffsetMinutes: 110,
  },
];

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function lineMarketSpecs(home: string, away: string): MarketSpec[] {
  return [
    {
      key: "winner-home",
      title: `${home} to win`,
      marketType: "match_winner_1x2",
      marketGroupKey: "regulation-winner",
      marketGroupTitle: "Regulation Winner",
      period: "regulation",
      displayOrder: 10,
      participantName: home,
      outcomes: [
        { code: "YES", name: home, side: "yes", price: 0.56 },
        { code: "NO", name: "No", side: "no", price: 0.44 },
      ],
    },
    {
      key: "spread-home-0-5",
      title: `${home} +0.5`,
      marketType: "spread",
      marketGroupKey: "spread",
      marketGroupTitle: "Spread",
      period: "regulation",
      displayOrder: 40,
      line: "0.5",
      unit: "goals",
      participantName: home,
      outcomes: [
        { code: "HOME", name: `${home} +0.5`, side: "home", price: 0.58 },
        { code: "AWAY", name: `${away} -0.5`, side: "away", price: 0.42 },
      ],
    },
    {
      key: "spread-away-1-5",
      title: `${away} +1.5`,
      marketType: "spread",
      marketGroupKey: "spread",
      marketGroupTitle: "Spread",
      period: "regulation",
      displayOrder: 41,
      line: "1.5",
      unit: "goals",
      participantName: away,
      outcomes: [
        { code: "AWAY", name: `${away} +1.5`, side: "away", price: 0.64 },
        { code: "HOME", name: `${home} -1.5`, side: "home", price: 0.36 },
      ],
    },
    {
      key: "total-goals-2-5",
      title: "Total goals 2.5",
      marketType: "total_goals",
      marketGroupKey: "totals",
      marketGroupTitle: "Totals",
      period: "regulation",
      displayOrder: 50,
      line: "2.5",
      unit: "goals",
      outcomes: [
        { code: "OVER", name: "Over 2.5", side: "over", price: 0.53 },
        { code: "UNDER", name: "Under 2.5", side: "under", price: 0.47 },
      ],
    },
    {
      key: "team-total-home-1-5",
      title: `${home} total goals 1.5`,
      marketType: "team_total_goals",
      marketGroupKey: "team-totals",
      marketGroupTitle: "Team Totals",
      period: "regulation",
      displayOrder: 60,
      line: "1.5",
      unit: "goals",
      participantName: home,
      outcomes: [
        { code: "OVER", name: `${home} Over 1.5`, side: "over", price: 0.46 },
        { code: "UNDER", name: `${home} Under 1.5`, side: "under", price: 0.54 },
      ],
    },
  ];
}

async function upsertOutcome(params: {
  marketId: string;
  marketSlug: string;
  spec: OutcomeSpec;
  index: number;
}) {
  const existing = await prisma.outcome.findFirst({
    where: { marketId: params.marketId, code: params.spec.code },
    select: { id: true },
  });
  const data = {
    name: params.spec.name,
    label: params.spec.name,
    side: params.spec.side,
    displayOrder: params.index,
    isActive: true,
    isTradable: true,
    status: "active",
    referenceTokenId: `contract-${params.marketSlug}-${slugify(params.spec.code)}`,
    referenceOutcomeLabel: params.spec.name,
    referenceMetadata: {
      source: "contract-fixture",
      reason: "Local MVP World Cup match breadth fixture.",
    },
  };

  return existing
    ? prisma.outcome.update({ where: { id: existing.id }, data })
    : prisma.outcome.create({
        data: {
          marketId: params.marketId,
          code: params.spec.code,
          slug: `${params.marketSlug}-${slugify(params.spec.code)}`,
          ...data,
        },
      });
}

async function seedMarket(event: { id: string; slug: string; title: string }, spec: MarketSpec, now: Date) {
  const marketSlug = `${event.slug}-${spec.key}`;
  const market = await prisma.market.upsert({
    where: { slug: marketSlug },
    create: {
      slug: marketSlug,
      title: `${event.title}: ${spec.title}`,
      description: `Local MVP contract-shaped ${spec.marketGroupTitle} market for ${event.title}.`,
      categoryLegacy: "sports",
      type: "BINARY",
      marketType: spec.marketType,
      marketGroupKey: spec.marketGroupKey,
      marketGroupTitle: spec.marketGroupTitle,
      displayOrder: spec.displayOrder,
      line: spec.line ? dec(spec.line) : undefined,
      unit: spec.unit,
      period: spec.period,
      participantName: spec.participantName,
      participantType: spec.participantName ? "team" : undefined,
      propCategory: ["total_goals", "team_total_goals"].includes(spec.marketType)
        ? "goals"
        : spec.marketType === "spread"
          ? "handicap"
          : undefined,
      status: "LIVE",
      eventId: event.id,
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      kind: "ORDERBOOK",
      isListed: true,
      referenceSource: "contract-fixture",
      externalSlug: marketSlug,
      externalMarketId: `contract-${marketSlug}`,
      conditionId: `condition-${marketSlug}`,
      sourceUpdatedAt: now,
      rules: {
        template: spec.marketType,
        source: "contract-fixture",
        line: spec.line ?? null,
        period: spec.period,
      },
      rulesText: "Local MVP fake-token market. Replace with provider-backed mapping when this market family is available.",
      referenceMetadata: {
        source: "contract-fixture",
        providerBacked: false,
        importStatus: "approved",
        referenceOnly: false,
        tradable: true,
        reason: "Internal Home/Event Detail breadth while Polymarket World Cup match books are closed or unavailable.",
      },
    },
    update: {
      title: `${event.title}: ${spec.title}`,
      description: `Local MVP contract-shaped ${spec.marketGroupTitle} market for ${event.title}.`,
      marketType: spec.marketType,
      marketGroupKey: spec.marketGroupKey,
      marketGroupTitle: spec.marketGroupTitle,
      displayOrder: spec.displayOrder,
      line: spec.line ? dec(spec.line) : null,
      unit: spec.unit,
      period: spec.period,
      participantName: spec.participantName,
      participantType: spec.participantName ? "team" : null,
      propCategory: ["total_goals", "team_total_goals"].includes(spec.marketType)
        ? "goals"
        : spec.marketType === "spread"
          ? "handicap"
          : null,
      status: "LIVE",
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      kind: "ORDERBOOK",
      isListed: true,
      referenceSource: "contract-fixture",
      externalSlug: marketSlug,
      externalMarketId: `contract-${marketSlug}`,
      conditionId: `condition-${marketSlug}`,
      sourceUpdatedAt: now,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      externalSlug: true,
      externalMarketId: true,
      conditionId: true,
      marketType: true,
      marketGroupTitle: true,
    },
  });

  const outcomes = [];
  for (const [index, outcomeSpec] of spec.outcomes.entries()) {
    outcomes.push(await upsertOutcome({ marketId: market.id, marketSlug, spec: outcomeSpec, index }));
  }
  await prisma.outcome.updateMany({
    where: { marketId: market.id, id: { notIn: outcomes.map((outcome) => outcome.id) } },
    data: { isActive: false, status: "archived" },
  });
  await upsertReferenceQuoteSnapshots(outcomes.map((outcome, index) => {
    const outcomeSpec = spec.outcomes[index]!;
    const price = outcomeSpec.price;
    return {
      marketId: market.id,
      outcomeId: outcome.id,
      source: "contract-fixture",
      externalSlug: market.externalSlug,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
      tokenId: outcome.referenceTokenId,
      outcomeLabel: outcome.referenceOutcomeLabel,
      outcomePrice: price,
      bestBid: Math.max(0.01, Number((price - 0.02).toFixed(2))),
      bestAsk: Math.min(0.99, Number((price + 0.02).toFixed(2))),
      spread: 0.04,
      lastTradePrice: price,
      volume: 2500,
      volume24hr: 420,
      liquidity: 1500,
      liquidityClob: 0,
      acceptingOrders: true,
      qualityStatus: "approved",
      mmEligible: false,
      reason: "contract_fixture_for_local_mvp_breadth",
      fetchedAt: now,
    };
  }));

  return { market, outcomeCount: outcomes.length };
}

async function seedMatch(spec: MatchSpec, now: Date) {
  const startTime = new Date(now.getTime() + spec.startOffsetMinutes * 60_000);
  const event = await prisma.event.upsert({
    where: { slug: spec.slug },
    create: {
      slug: spec.slug,
      title: spec.title,
      description: `Local MVP World Cup match fixture for ${spec.title}.`,
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: spec.home,
      awayTeamName: spec.away,
      startTime,
      status: "active",
      liveStatus: "LIVE",
      period: "1H",
      clock: "12'",
      homeScore: 0,
      awayScore: 0,
      source: "contract-fixture",
      externalEventId: `contract-${spec.slug}`,
      externalSlug: spec.slug,
      sourceUpdatedAt: now,
      metadata: {
        source: "contract-fixture",
        providerBacked: false,
        localMvpBreadthFixture: true,
        teamCodes: { home: spec.homeCode, away: spec.awayCode },
        excludes: ["orderbook-ui", "chat", "live-stats"],
      },
    },
    update: {
      title: spec.title,
      description: `Local MVP World Cup match fixture for ${spec.title}.`,
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: spec.home,
      awayTeamName: spec.away,
      startTime,
      status: "active",
      liveStatus: "LIVE",
      period: "1H",
      clock: "12'",
      homeScore: 0,
      awayScore: 0,
      source: "contract-fixture",
      externalEventId: `contract-${spec.slug}`,
      externalSlug: spec.slug,
      sourceUpdatedAt: now,
      metadata: {
        source: "contract-fixture",
        providerBacked: false,
        localMvpBreadthFixture: true,
        teamCodes: { home: spec.homeCode, away: spec.awayCode },
        excludes: ["orderbook-ui", "chat", "live-stats"],
      },
    },
    select: { id: true, slug: true, title: true },
  });

  const seededMarkets = [];
  for (const marketSpec of lineMarketSpecs(spec.home, spec.away)) {
    seededMarkets.push(await seedMarket({ id: event.id, slug: event.slug!, title: event.title }, marketSpec, now));
  }
  return { event, seededMarkets };
}

async function fetchHomeCount(baseUrl: string) {
  const response = await fetch(
    `${baseUrl}/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10`,
  );
  const body = await response.json().catch(() => ({}));
  return {
    status: response.status,
    eventCount: Array.isArray(body.events) ? body.events.length : 0,
    events: Array.isArray(body.events)
      ? body.events.map((event: { slug?: string; title?: string; eventType?: string; marketCount?: number }) => ({
          slug: event.slug,
          title: event.title,
          eventType: event.eventType,
          marketCount: event.marketCount,
        }))
      : [],
  };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed Local MVP match breadth in production.");
  }
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const baseUrl = argValue("baseUrl") ?? "http://127.0.0.1:3002";
  const now = new Date();
  const before = await fetchHomeCount(baseUrl);
  const seeded = [];
  for (const spec of matches) {
    seeded.push(await seedMatch(spec, now));
  }
  const after = await fetchHomeCount(baseUrl);
  const pass = after.status === 200 && after.eventCount >= 4;
  const summary = {
    pass,
    generatedAt: now.toISOString(),
    scope: "mobile-mvp-local-match-breadth",
    baseUrl,
    policy: {
      source: "contract-fixture",
      purpose: "internal Home/Live/Event Detail breadth while provider World Cup match books are closed.",
      doesNotClaimProviderParity: true,
      excludes: ["orderbook-ui", "chat", "live-stats"],
    },
    before,
    after,
    seeded: seeded.map(({ event, seededMarkets }) => ({
      event: {
        id: event.id,
        slug: event.slug,
        title: event.title,
      },
      marketCount: seededMarkets.length,
      markets: seededMarkets.map(({ market, outcomeCount }) => ({
        id: market.id,
        slug: market.slug,
        title: market.title,
        marketType: market.marketType,
        marketGroupTitle: market.marketGroupTitle,
        outcomeCount,
      })),
    })),
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(summary, null, 2));
  if (!pass) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
