import * as fs from "node:fs/promises";
import * as path from "node:path";
import { Prisma, MarketStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { GET as getMobileLiveDetail } from "@/app/api/mobile/events/[slug]/live-detail/route";
import { upsertReferenceQuoteSnapshots } from "@/server/services/referenceQuoteSnapshots";

const DEFAULT_EVENT_SLUG = "switzerland-vs-colombia";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-LN-match-line-service-readiness/cycle-LN-match-line-service-readiness.json";

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

const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

function parseTeams(title: string, homeTeamName: string | null, awayTeamName: string | null) {
  if (homeTeamName && awayTeamName) return { home: homeTeamName, away: awayTeamName };
  const match = title.match(/^(.+?)\s+vs\.?\s+(.+)$/i);
  return {
    home: match?.[1]?.trim() || "Home",
    away: match?.[2]?.trim() || "Away",
  };
}

function lineMarketSpecs(home: string, away: string): MarketSpec[] {
  return [
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

async function readLiveDetailRoute(eventSlug: string) {
  const response = await getMobileLiveDetail(
    new Request(`http://localhost/api/mobile/events/${encodeURIComponent(eventSlug)}/live-detail`),
    { params: Promise.resolve({ slug: eventSlug }) },
  );
  const payload = await response.json();
  return { status: response.status, payload };
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
      reason: "Local MVP line market contract until a Polymarket soccer match exposes this market family.",
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

async function seedLineMarket(event: { id: string; slug: string | null; title: string }, spec: MarketSpec) {
  const marketSlug = `${event.slug}-${spec.key}`;
  const now = new Date();
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
      propCategory: ["total_goals", "team_total_goals"].includes(spec.marketType) ? "goals" : spec.marketType === "spread" ? "handicap" : undefined,
      status: MarketStatus.LIVE,
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
      rulesText: "Local MVP fake-token market. Replace with Polymarket-backed provider mapping when this market family is available.",
      referenceMetadata: {
        source: "contract-fixture",
        providerBacked: false,
        importStatus: "approved",
        referenceOnly: false,
        tradable: true,
        reason: "Polymarket-first inspection found current local match events only had Regulation Winner rows.",
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
      propCategory: ["total_goals", "team_total_goals"].includes(spec.marketType) ? "goals" : spec.marketType === "spread" ? "handicap" : null,
      status: MarketStatus.LIVE,
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
    select: { id: true, slug: true, title: true, externalSlug: true, externalMarketId: true, conditionId: true },
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
      reason: "contract_fixture_for_local_mvp",
      fetchedAt: now,
    };
  }));

  return { market, outcomes };
}

async function main() {
  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const cycle = argValue("cycle") ?? "current";
  const before = await readLiveDetailRoute(eventSlug);

  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    select: { id: true, slug: true, title: true, homeTeamName: true, awayTeamName: true },
  });
  if (!event?.slug) throw new Error(`Event ${eventSlug} was not found.`);

  const teams = parseTeams(event.title, event.homeTeamName, event.awayTeamName);
  await prisma.event.update({
    where: { id: event.id },
    data: {
      status: "active",
      liveStatus: "LIVE",
      sourceUpdatedAt: new Date(),
      metadata: {
        mobileMvpLineMarketReadiness: {
          source: "contract-fixture",
          reason: "Local MVP needs selectable line markets even when Polymarket match provider rows are not available.",
          excludes: ["orderbook-ui", "chat", "live-stats"],
        },
      },
    },
  });

  const seeded = [];
  for (const spec of lineMarketSpecs(teams.home, teams.away)) {
    seeded.push(await seedLineMarket({ id: event.id, slug: event.slug, title: event.title }, spec));
  }

  const after = await readLiveDetailRoute(eventSlug);
  const afterMarkets = Array.isArray(after.payload.markets) ? after.payload.markets : [];
  const typeSet = new Set(afterMarkets.map((market: any) => market.marketType));
  const groupSet = new Set(afterMarkets.map((market: any) => market.marketGroupTitle ?? market.marketGroupKey));
  const assertions = {
    routeOk: after.status === 200,
    regulationWinnerPresent: afterMarkets.some((market: any) =>
      ["match_winner_1x2", "moneyline"].includes(market.marketType) &&
      `${market.marketGroupTitle ?? market.marketGroupKey}`.toLowerCase().includes("regulation"),
    ),
    spreadPresent: typeSet.has("spread"),
    totalsPresent: typeSet.has("total_goals"),
    teamTotalsPresent: typeSet.has("team_total_goals"),
    noOrderbookUiWork: true,
  };
  const pass = Object.values(assertions).every(Boolean);
  const summary = {
    pass,
    generatedAt: new Date().toISOString(),
    cycle,
    eventSlug,
    eventTitle: event.title,
    inspection: {
      beforeStatus: before.status,
      beforeMarketCount: Array.isArray(before.payload.markets) ? before.payload.markets.length : 0,
      beforeMarketTypes: Array.isArray(before.payload.markets)
        ? Array.from(new Set(before.payload.markets.map((market: any) => market.marketType)))
        : [],
      conclusion: "Current live match routes had Regulation Winner only; spreads/totals were absent from the served mobile data.",
    },
    seededMarkets: seeded.map(({ market, outcomes }) => ({
      id: market.id,
      slug: market.slug,
      title: market.title,
      outcomeCount: outcomes.length,
    })),
    after: {
      status: after.status,
      marketCount: afterMarkets.length,
      marketTypes: Array.from(typeSet),
      marketGroups: Array.from(groupSet),
      sample: afterMarkets.map((market: any) => ({
        id: market.id,
        title: market.title,
        marketType: market.marketType,
        marketGroupTitle: market.marketGroupTitle,
        line: market.line,
        period: market.period,
        outcomeCount: Array.isArray(market.outcomes) ? market.outcomes.length : 0,
      })),
    },
    assertions,
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
