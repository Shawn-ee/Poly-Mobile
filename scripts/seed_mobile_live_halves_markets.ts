import fs from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const DEFAULT_EVENT_SLUG = "world-cup-2026-curacao-vs-cote-divoire-2026-06-25";
const DEFAULT_SUMMARY_PATH = "docs/mobile/harness/cycle-current-mobile-live-halves-markets-seed.json";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? null;
};

const hasFlag = (name: string) => process.argv.includes(`--${name}`);

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function upsertHalfMarket(params: {
  apply: boolean;
  event: {
    id: string;
    slug: string | null;
    title: string;
    category: string | null;
    startTime: Date | null;
    homeTeamName: string | null;
    awayTeamName: string | null;
  };
  period: "first-half" | "second-half";
  title: string;
  displayOrder: number;
}) {
  const home = params.event.homeTeamName ?? params.event.title.split(/\s+vs\.?\s+/i)[0] ?? "Home";
  const away = params.event.awayTeamName ?? params.event.title.split(/\s+vs\.?\s+/i)[1] ?? "Away";
  const slug = `${params.event.slug ?? slugify(params.event.title)}-${params.period}-winner`;
  const rules = {
    template: "MATCH_WINNER_1X2",
    period: params.period,
    settlement: "manual",
    source: "official_half_result",
  };

  if (!params.apply) {
    const existing = await prisma.market.findUnique({
      where: { slug },
      include: { outcomes: { orderBy: [{ displayOrder: "asc" }] } },
    });
    return { market: existing, created: false, slug };
  }

  const market = await prisma.market.upsert({
    where: { slug },
    update: {
      title: params.title,
      description: `Who will win the ${params.title.toLowerCase()} period in ${params.event.title}?`,
      eventId: params.event.id,
      categoryLegacy: params.event.category ?? "sports",
      type: "MULTI_WINNER",
      kind: "ORDERBOOK",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      status: "LIVE",
      marketType: "match_winner_1x2",
      marketGroupKey: "halves",
      marketGroupTitle: "Halves",
      displayOrder: params.displayOrder,
      period: params.period,
      rules: rules as Prisma.InputJsonValue,
      betCloseTime: params.event.startTime,
      closeTime: params.event.startTime,
      sourceUpdatedAt: new Date("2020-01-01T00:00:00.000Z"),
    },
    create: {
      slug,
      title: params.title,
      description: `Who will win the ${params.title.toLowerCase()} period in ${params.event.title}?`,
      eventId: params.event.id,
      categoryLegacy: params.event.category ?? "sports",
      type: "MULTI_WINNER",
      kind: "ORDERBOOK",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      status: "LIVE",
      marketType: "match_winner_1x2",
      marketGroupKey: "halves",
      marketGroupTitle: "Halves",
      displayOrder: params.displayOrder,
      period: params.period,
      rules: rules as Prisma.InputJsonValue,
      betCloseTime: params.event.startTime,
      closeTime: params.event.startTime,
      sourceUpdatedAt: new Date("2020-01-01T00:00:00.000Z"),
    },
    include: { outcomes: { orderBy: [{ displayOrder: "asc" }] } },
  });

  const outcomeSpecs = [
    { name: home, code: "HOME", side: "home", metadata: { team: "home", period: params.period } },
    { name: "Draw", code: "DRAW", side: "draw", metadata: { result: "draw", period: params.period } },
    { name: away, code: "AWAY", side: "away", metadata: { team: "away", period: params.period } },
  ];

  for (const [index, outcome] of outcomeSpecs.entries()) {
    const existing = await prisma.outcome.findFirst({
      where: { marketId: market.id, code: outcome.code },
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
          metadata: outcome.metadata,
        },
      });
      continue;
    }

    await prisma.outcome.create({
      data: {
        marketId: market.id,
        name: outcome.name,
        label: outcome.name,
        code: outcome.code,
        side: outcome.side,
        displayOrder: index,
        isActive: true,
        isTradable: true,
        status: "active",
        metadata: outcome.metadata,
      },
    });
  }

  const withOutcomes = await prisma.market.findUniqueOrThrow({
    where: { id: market.id },
    include: { outcomes: { orderBy: [{ displayOrder: "asc" }] } },
  });

  return { market: withOutcomes, created: market.createdAt.getTime() === market.updatedAt.getTime(), slug };
}

async function main() {
  const apply = hasFlag("apply");
  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const summaryPath = argValue("summaryPath") ?? DEFAULT_SUMMARY_PATH;
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      startTime: true,
      homeTeamName: true,
      awayTeamName: true,
    },
  });
  if (!event) throw new Error(`No event found for ${eventSlug}.`);

  const seeded = await Promise.all([
    upsertHalfMarket({ apply, event, period: "first-half", title: "1st Half Winner", displayOrder: 410 }),
    upsertHalfMarket({ apply, event, period: "second-half", title: "2nd Half Winner", displayOrder: 420 }),
  ]);

  const summary = {
    applied: apply,
    event: { id: event.id, slug: event.slug, title: event.title },
    markets: seeded.map(({ market, slug }) => ({
      id: market?.id ?? null,
      slug,
      title: market?.title ?? null,
      marketType: market?.marketType ?? "match_winner_1x2",
      marketGroupKey: market?.marketGroupKey ?? "halves",
      period: market?.period ?? null,
      outcomeCount: market?.outcomes.length ?? 0,
      outcomeIds: market?.outcomes.map((outcome) => outcome.id) ?? [],
    })),
  };

  await fs.mkdir(path.dirname(summaryPath), { recursive: true });
  await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
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
