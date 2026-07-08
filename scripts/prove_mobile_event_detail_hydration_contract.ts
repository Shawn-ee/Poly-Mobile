import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { GET as getLiveDetailRoute } from "@/app/api/mobile/events/[slug]/live-detail/route";
import { prisma } from "@/lib/db";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KG-event-detail-hydration-contract/cycle-KG-event-detail-hydration-contract.json";
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function seedEventDetailProofEvent() {
  const suffix = randomUUID().slice(0, 8);
  return prisma.event.create({
    data: {
      slug: `mobile-kg-event-detail-${suffix}`,
      title: `KG Regulation Home vs Away ${suffix}`,
      description: "Regulation 90-minute market can settle as draw; spread is available from backend markets.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "KG Home",
      awayTeamName: "KG Away",
      status: "live",
      liveStatus: "in_play",
      period: "1H",
      clock: "34:12",
      homeScore: 1,
      awayScore: 1,
      startTime: new Date(Date.now() - 30 * 60 * 1000),
      markets: {
        create: [
          {
            slug: `mobile-kg-regulation-winner-${suffix}`,
            title: "Regulation Time Winner",
            description: "Home/Tie/Away regulation winner.",
            status: "LIVE",
            mechanism: "ORDERBOOK",
            visibility: "PUBLIC",
            kind: "ORDERBOOK",
            type: "BINARY",
            marketType: "moneyline",
            marketGroupKey: "main",
            marketGroupTitle: "Regulation Time Winner",
            displayOrder: 0,
            period: "regulation",
            line: dec("0"),
            referenceSource: "polymarket",
            externalSlug: `kg-reg-winner-${suffix}`,
            externalMarketId: `gamma-kg-reg-winner-${suffix}`,
            conditionId: `condition-kg-reg-winner-${suffix}`,
            sourceUpdatedAt: new Date(),
            isListed: true,
            outcomes: {
              create: [
                {
                  name: "KG Home",
                  label: "KG Home",
                  side: "home",
                  code: "HOME",
                  slug: `kg-home-reg-${suffix}`,
                  displayOrder: 0,
                  isActive: true,
                  isTradable: true,
                  referenceTokenId: `token-kg-home-reg-${suffix}`,
                  referenceOutcomeLabel: "KG Home",
                },
                {
                  name: "Tie",
                  label: "Tie",
                  side: "draw",
                  code: "DRAW",
                  slug: `kg-draw-reg-${suffix}`,
                  displayOrder: 1,
                  isActive: true,
                  isTradable: true,
                  referenceTokenId: `token-kg-draw-reg-${suffix}`,
                  referenceOutcomeLabel: "Tie",
                },
                {
                  name: "KG Away",
                  label: "KG Away",
                  side: "away",
                  code: "AWAY",
                  slug: `kg-away-reg-${suffix}`,
                  displayOrder: 2,
                  isActive: true,
                  isTradable: true,
                  referenceTokenId: `token-kg-away-reg-${suffix}`,
                  referenceOutcomeLabel: "KG Away",
                },
              ],
            },
          },
          {
            slug: `mobile-kg-spread-${suffix}`,
            title: "KG Home -1.5 Spread",
            description: "Spread market available from backend.",
            status: "LIVE",
            mechanism: "ORDERBOOK",
            visibility: "PUBLIC",
            kind: "ORDERBOOK",
            type: "BINARY",
            marketType: "spread",
            marketGroupKey: "spread",
            marketGroupTitle: "Spread",
            displayOrder: 1,
            period: "regulation",
            line: dec("1.5"),
            referenceSource: "polymarket",
            externalSlug: `kg-spread-${suffix}`,
            externalMarketId: `gamma-kg-spread-${suffix}`,
            conditionId: `condition-kg-spread-${suffix}`,
            sourceUpdatedAt: new Date(),
            isListed: true,
            outcomes: {
              create: [
                {
                  name: "KG Home -1.5",
                  label: "KG Home -1.5",
                  side: "home",
                  code: "HOME",
                  slug: `kg-home-spread-${suffix}`,
                  displayOrder: 0,
                  isActive: true,
                  isTradable: true,
                  referenceTokenId: `token-kg-home-spread-${suffix}`,
                  referenceOutcomeLabel: "KG Home -1.5",
                },
                {
                  name: "KG Away +1.5",
                  label: "KG Away +1.5",
                  side: "away",
                  code: "AWAY",
                  slug: `kg-away-spread-${suffix}`,
                  displayOrder: 1,
                  isActive: true,
                  isTradable: true,
                  referenceTokenId: `token-kg-away-spread-${suffix}`,
                  referenceOutcomeLabel: "KG Away +1.5",
                },
              ],
            },
          },
        ],
      },
    },
  });
}

async function main() {
  const event = await seedEventDetailProofEvent();
  const response = await getLiveDetailRoute(new Request(`http://localhost/api/mobile/events/${event.slug}/live-detail`), {
    params: Promise.resolve({ slug: event.slug }),
  });
  const body = await response.json();

  assert(response.status === 200, `Expected live-detail route 200, received ${response.status}: ${JSON.stringify(body)}`);
  assert(body.event?.slug === event.slug, "Expected live-detail payload to return seeded event slug.");
  assert(body.event?.marketProfile === "regulation_90", `Expected regulation_90 profile, received ${body.event?.marketProfile}.`);
  assert(body.event?.resultMode === "can_draw", `Expected can_draw mode, received ${body.event?.resultMode}.`);
  assert(body.event?.gameRules?.allowDraw === true, "Expected gameRules.allowDraw=true.");
  assert(body.event?.gameRules?.includesOvertime === false, "Expected gameRules.includesOvertime=false.");
  assert(body.event?.supportedMarketTypes?.includes("regulation_90"), "Expected supported regulation_90 market type.");
  assert(body.event?.supportedMarketTypes?.includes("spread"), "Expected supported spread market type.");
  assert(Array.isArray(body.markets) && body.markets.length >= 2, `Expected compact markets, received ${body.markets?.length ?? 0}.`);
  assert(body.markets.some((market: any) => market.marketType === "spread" && String(market.line) === "1.5"), "Expected spread market line 1.5.");
  assert(
    body.markets.some((market: any) => market.outcomes?.some((outcome: any) => outcome.side === "draw" || outcome.label === "Tie")),
    "Expected regulation market draw/tie outcome from backend.",
  );

  const summary = {
    pass: true,
    createdAt: new Date().toISOString(),
    route: "/api/mobile/events/:slug/live-detail",
    event: {
      slug: body.event.slug,
      marketProfile: body.event.marketProfile,
      resultMode: body.event.resultMode,
      gameRules: body.event.gameRules,
      supportedMarketTypes: body.event.supportedMarketTypes,
    },
    markets: body.markets.map((market: any) => ({
      id: market.id,
      marketType: market.marketType,
      marketGroupTitle: market.marketGroupTitle,
      period: market.period,
      line: market.line,
      outcomes: market.outcomes?.map((outcome: any) => ({
        id: outcome.id,
        label: outcome.label,
        side: outcome.side,
      })),
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
