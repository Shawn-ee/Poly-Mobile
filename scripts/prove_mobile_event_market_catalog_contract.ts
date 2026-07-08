import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { GET as getEventMarketsRoute } from "@/app/api/events/[slug]/markets/route";
import { prisma } from "@/lib/db";
import { normalizeMarket } from "../mobile/src/adapters/worldCupAdapter";
import type { Market as BackendMarket } from "../mobile/src/types";

const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/cycle-KH-event-market-catalog-contract/cycle-KH-event-market-catalog-contract.json";
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function seedEvent() {
  const suffix = randomUUID().slice(0, 8);
  return prisma.event.create({
    data: {
      slug: `mobile-kh-market-catalog-${suffix}`,
      title: `KH Home vs Away ${suffix}`,
      description: "Disposable event for mobile Event Detail market catalog proof.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "KH Home",
      awayTeamName: "KH Away",
      status: "live",
      liveStatus: "in_play",
      period: "1H",
      clock: "22:15",
      startTime: new Date(Date.now() - 20 * 60 * 1000),
      markets: {
        create: [
          marketInput({
            suffix,
            slug: "spread",
            title: "KH Home -1.5 Spread",
            marketType: "spread",
            marketGroupKey: "spreads",
            marketGroupTitle: "Spread",
            period: "regulation",
            line: "1.5",
            displayOrder: 0,
          }),
          marketInput({
            suffix,
            slug: "totals",
            title: "Over 2.5 Total Goals",
            marketType: "total_goals",
            marketGroupKey: "totals",
            marketGroupTitle: "Totals",
            period: "full-game",
            line: "2.5",
            displayOrder: 1,
          }),
          marketInput({
            suffix,
            slug: "team-total",
            title: "KH Home Over 1.5 Goals",
            marketType: "team_total_goals",
            marketGroupKey: "team-totals",
            marketGroupTitle: "Team totals",
            period: "first-half",
            line: "1.5",
            displayOrder: 2,
          }),
          marketInput({
            suffix,
            slug: "private",
            title: "Private hidden market",
            marketType: "spread",
            marketGroupKey: "spreads",
            marketGroupTitle: "Spread",
            period: "second-half",
            line: "0.5",
            displayOrder: 3,
            visibility: "PRIVATE",
          }),
          marketInput({
            suffix,
            slug: "unlisted",
            title: "Unlisted hidden market",
            marketType: "totals",
            marketGroupKey: "totals",
            marketGroupTitle: "Totals",
            period: "second-half",
            line: "3.5",
            displayOrder: 4,
            isListed: false,
          }),
        ],
      },
    },
  });
}

function marketInput(input: {
  suffix: string;
  slug: string;
  title: string;
  marketType: string;
  marketGroupKey: string;
  marketGroupTitle: string;
  period: string;
  line: string;
  displayOrder: number;
  visibility?: "PUBLIC" | "PRIVATE";
  isListed?: boolean;
}) {
  return {
    slug: `mobile-kh-${input.slug}-${input.suffix}`,
    title: input.title,
    description: `${input.marketGroupTitle} route catalog proof market.`,
    status: "LIVE",
    mechanism: "ORDERBOOK",
    visibility: input.visibility ?? "PUBLIC",
    kind: "ORDERBOOK",
    type: "BINARY",
    marketType: input.marketType,
    marketGroupKey: input.marketGroupKey,
    marketGroupTitle: input.marketGroupTitle,
    displayOrder: input.displayOrder,
    period: input.period,
    line: dec(input.line),
    referenceSource: "polymarket",
    externalSlug: `kh-${input.slug}-${input.suffix}`,
    externalMarketId: `gamma-kh-${input.slug}-${input.suffix}`,
    conditionId: `condition-kh-${input.slug}-${input.suffix}`,
    sourceUpdatedAt: new Date(),
    isListed: input.isListed ?? true,
    outcomes: {
      create: [
        {
          name: `${input.title} Yes`,
          label: "Yes",
          side: "yes",
          code: "YES",
          slug: `kh-${input.slug}-yes-${input.suffix}`,
          displayOrder: 0,
          isActive: true,
          isTradable: true,
          referenceTokenId: `token-kh-${input.slug}-yes-${input.suffix}`,
          referenceOutcomeLabel: "Yes",
        },
        {
          name: `${input.title} No`,
          label: "No",
          side: "no",
          code: "NO",
          slug: `kh-${input.slug}-no-${input.suffix}`,
          displayOrder: 1,
          isActive: true,
          isTradable: true,
          referenceTokenId: `token-kh-${input.slug}-no-${input.suffix}`,
          referenceOutcomeLabel: "No",
        },
      ],
    },
  };
}

async function main() {
  const event = await seedEvent();
  const response = await getEventMarketsRoute(new Request(`http://localhost/api/events/${event.slug}/markets`), {
    params: Promise.resolve({ slug: event.slug }),
  });
  const body = await response.json();

  assert(response.status === 200, `Expected /api/events/:slug/markets 200, got ${response.status}: ${JSON.stringify(body)}`);
  assert(Array.isArray(body.markets), "Expected route body.markets array.");
  assert(body.markets.length === 3, `Expected only 3 public/listed markets, got ${body.markets.length}.`);
  assert(body.markets.every((market: BackendMarket) => market.outcomes.length === 2), "Expected active outcomes on every market.");
  assert(!body.markets.some((market: BackendMarket) => /hidden/i.test(market.title)), "Expected private/unlisted markets to be filtered.");

  const normalized = body.markets.map((market: BackendMarket) => normalizeMarket(market));
  assert(normalized.some((market) => market.marketType === "spread" && market.period === "regulation" && market.line === "1.5"), "Expected regulation spread line 1.5.");
  assert(normalized.some((market) => market.marketType === "totals" && market.period === "full-game" && market.line === "2.5"), "Expected totals alias normalized to full-game line 2.5.");
  assert(normalized.some((market) => market.marketType === "team-total" && market.period === "first-half" && market.line === "1.5"), "Expected team-total alias normalized to first-half line 1.5.");

  const summary = {
    pass: true,
    createdAt: new Date().toISOString(),
    route: "/api/events/:slug/markets",
    event: { slug: event.slug },
    routeMarketCount: body.markets.length,
    hiddenMarketsFiltered: true,
    normalizedMarkets: normalized.map((market) => ({
      id: market.id,
      title: market.title,
      marketType: market.marketType,
      period: market.period,
      line: market.line,
      outcomeCount: market.outcomes.length,
    })),
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
