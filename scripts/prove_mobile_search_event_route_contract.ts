import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GET as listEvents } from "@/app/api/events/route";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-JT-search-event-route-contract/cycle-JT-search-event-route-contract.json";
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function createSearchProofEvent(params: { suffix: string; index: number; needle: string }) {
  const start = new Date(Date.now() + (params.index + 1) * 90 * 60 * 1000);
  const title = `JT Route Page ${params.index} vs Backend ${params.suffix}`;
  return prisma.event.create({
    data: {
      slug: `mobile-jt-search-page-${params.index}-${params.suffix}`,
      title,
      description: "Disposable event proving backend Search route text matching and cursor pagination.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: `JT Home ${params.index}`,
      awayTeamName: "JT Backend",
      status: "upcoming",
      startTime: start,
      markets: {
        create: [{
          slug: `mobile-jt-search-market-${params.index}-${params.suffix}`,
          title: `${params.needle} Market ${params.index}`,
          description: "JT Search route proof market.",
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
          externalSlug: `jt-search-market-${params.index}-${params.suffix}`,
          externalMarketId: `gamma-jt-search-${params.index}-${params.suffix}`,
          conditionId: `condition-jt-search-${params.index}-${params.suffix}`,
          sourceUpdatedAt: new Date(),
          isListed: true,
          outcomes: {
            create: [
              {
                name: `JT Home ${params.index}`,
                label: `JT Home ${params.index}`,
                side: "home",
                code: "HOME",
                slug: `mobile-jt-search-outcome-home-${params.index}-${params.suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-jt-home-${params.index}-${params.suffix}`,
                referenceOutcomeLabel: `JT Home ${params.index}`,
              },
              {
                name: `${params.needle} Draw`,
                label: `${params.needle} Draw`,
                side: "draw",
                code: "DRAW",
                slug: `mobile-jt-search-outcome-draw-${params.index}-${params.suffix}`,
                displayOrder: 1,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-jt-draw-${params.index}-${params.suffix}`,
                referenceOutcomeLabel: `${params.needle} Draw`,
              },
              {
                name: "JT Backend",
                label: "JT Backend",
                side: "away",
                code: "AWAY",
                slug: `mobile-jt-search-outcome-away-${params.index}-${params.suffix}`,
                displayOrder: 2,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-jt-away-${params.index}-${params.suffix}`,
                referenceOutcomeLabel: "JT Backend",
              },
            ],
          },
        }],
      },
    },
  });
}

async function readSearchPage(params: { limit: number; search: string; cursor?: string | null }) {
  const query = new URLSearchParams({
    sportKey: "soccer",
    leagueKey: "world_cup",
    includeMobileMarkets: "1",
    limit: String(params.limit),
    search: params.search,
  });
  if (params.cursor) query.set("cursor", params.cursor);
  const response = await listEvents(new NextRequest(`http://localhost/api/events?${query.toString()}`));
  assert(response.status === 200, `Expected /api/events status 200, received ${response.status}.`);
  return response.json();
}

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const needle = `JTNeedle${suffix}`;
  await Promise.all([0, 1, 2].map((index) => createSearchProofEvent({ suffix, index, needle })));

  const firstPage = await readSearchPage({ limit: 2, search: needle });
  assert(firstPage.events.length === 2, `Expected first Search page of 2 events, received ${firstPage.events.length}.`);
  assert(firstPage.nextCursor, "Expected first Search page to return nextCursor.");
  assert(firstPage.page?.hasMore === true, "Expected first Search page hasMore=true.");
  assert(firstPage.events.every((event: any) => event.markets?.length > 0), "Expected Search results to include compact markets.");
  assert(
    firstPage.events.every((event: any) =>
      event.markets.some((market: any) =>
        market.title.includes(needle) ||
        market.outcomes.some((outcome: any) => `${outcome.label ?? outcome.name ?? ""}`.includes(needle)),
      ),
    ),
    "Expected first Search page to match market or outcome text.",
  );

  const secondPage = await readSearchPage({ limit: 2, search: needle, cursor: firstPage.nextCursor });
  assert(secondPage.events.length === 1, `Expected second Search page of 1 event, received ${secondPage.events.length}.`);
  assert(secondPage.nextCursor === null, "Expected second Search page to end pagination.");
  assert(secondPage.page?.hasMore === false, "Expected second Search page hasMore=false.");
  assert(secondPage.events.every((event: any) => event.markets?.length > 0), "Expected second Search page events to include compact markets.");

  const summary = {
    pass: true,
    createdAt: new Date().toISOString(),
    route: "/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&search=<market-or-outcome-text>&limit=2&cursor=<event-id>",
    search: {
      query: needle,
      matchedFields: ["market.title", "outcome.name", "outcome.label"],
    },
    firstPage: {
      count: firstPage.events.length,
      nextCursor: firstPage.nextCursor,
      hasMore: firstPage.page.hasMore,
      slugs: firstPage.events.map((event: any) => event.slug),
    },
    secondPage: {
      count: secondPage.events.length,
      nextCursor: secondPage.nextCursor,
      hasMore: secondPage.page.hasMore,
      slugs: secondPage.events.map((event: any) => event.slug),
    },
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
