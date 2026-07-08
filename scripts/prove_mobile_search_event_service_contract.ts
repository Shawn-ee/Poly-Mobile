import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GET as listEvents } from "@/app/api/events/route";
import { loadSearchEventPage } from "../mobile/src/services/searchEventService";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KB-search-event-service-contract/cycle-KB-search-event-service-contract.json";
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
  const start = new Date(Date.now() + (params.index + 1) * 75 * 60 * 1000);
  const title = `KB Search Page ${params.index} vs Backend ${params.suffix}`;
  return prisma.event.create({
    data: {
      slug: `mobile-kb-search-page-${params.index}-${params.suffix}`,
      title,
      description: "Disposable event proving mobile Search service route pagination.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: `KB Home ${params.index}`,
      awayTeamName: "KB Backend",
      status: "upcoming",
      startTime: start,
      markets: {
        create: [{
          slug: `mobile-kb-search-market-${params.index}-${params.suffix}`,
          title: `${params.needle} Market ${params.index}`,
          description: "KB Search service proof market.",
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
          externalSlug: `kb-search-market-${params.index}-${params.suffix}`,
          externalMarketId: `gamma-kb-search-${params.index}-${params.suffix}`,
          conditionId: `condition-kb-search-${params.index}-${params.suffix}`,
          sourceUpdatedAt: new Date(),
          isListed: true,
          outcomes: {
            create: [
              {
                name: `KB Home ${params.index}`,
                label: `KB Home ${params.index}`,
                side: "home",
                code: "HOME",
                slug: `mobile-kb-search-outcome-home-${params.index}-${params.suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-kb-home-${params.index}-${params.suffix}`,
                referenceOutcomeLabel: `KB Home ${params.index}`,
              },
              {
                name: `${params.needle} Draw`,
                label: `${params.needle} Draw`,
                side: "draw",
                code: "DRAW",
                slug: `mobile-kb-search-outcome-draw-${params.index}-${params.suffix}`,
                displayOrder: 1,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-kb-draw-${params.index}-${params.suffix}`,
                referenceOutcomeLabel: `${params.needle} Draw`,
              },
              {
                name: "KB Backend",
                label: "KB Backend",
                side: "away",
                code: "AWAY",
                slug: `mobile-kb-search-outcome-away-${params.index}-${params.suffix}`,
                displayOrder: 2,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-kb-away-${params.index}-${params.suffix}`,
                referenceOutcomeLabel: "KB Backend",
              },
            ],
          },
        }],
      },
    },
  });
}

const routeApi = {
  listWorldCupEvents: async (input: { search?: string; limit?: number; cursor?: string | null }) => {
    const query = new URLSearchParams({
      sportKey: "soccer",
      leagueKey: "world_cup",
      includeMobileMarkets: "1",
      limit: String(input.limit ?? 10),
    });
    if (input.search?.trim()) query.set("search", input.search.trim());
    if (input.cursor) query.set("cursor", input.cursor);
    const response = await listEvents(new NextRequest(`http://localhost/api/events?${query.toString()}`));
    assert(response.status === 200, `Expected /api/events status 200, received ${response.status}.`);
    return response.json();
  },
};

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const needle = `KBNeedle${suffix}`;
  await Promise.all([0, 1, 2].map((index) => createSearchProofEvent({ suffix, index, needle })));

  const firstPage = await loadSearchEventPage({
    api: routeApi,
    query: needle,
    limit: 2,
    cursor: null,
  });
  assert(firstPage.source === "server-route", "Expected mobile service to use the server route.");
  assert(firstPage.events.length === 2, `Expected first service page of 2 events, received ${firstPage.events.length}.`);
  assert(firstPage.nextCursor, "Expected first service page to return nextCursor.");
  assert(firstPage.page.hasMore === true, "Expected first service page hasMore=true.");
  assert(firstPage.events.every((event: any) => event.markets?.length > 0), "Expected compact market data on first service page.");

  const secondPage = await loadSearchEventPage({
    api: routeApi,
    query: needle,
    limit: 2,
    cursor: firstPage.nextCursor,
  });
  assert(secondPage.source === "server-route", "Expected second service page to use the server route.");
  assert(secondPage.events.length === 1, `Expected second service page of 1 event, received ${secondPage.events.length}.`);
  assert(secondPage.nextCursor === null, "Expected second service page to end pagination.");
  assert(secondPage.page.hasMore === false, "Expected second service page hasMore=false.");
  assert(secondPage.events.every((event: any) => event.markets?.length > 0), "Expected compact market data on second service page.");

  const summary = {
    pass: true,
    createdAt: new Date().toISOString(),
    route: "/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&search=<market-or-outcome-text>&limit=2&cursor=<event-id>",
    service: "loadSearchEventPage",
    search: {
      query: needle,
      source: firstPage.source,
      matchedFields: ["market.title", "outcome.name", "outcome.label"],
    },
    firstPage: {
      count: firstPage.events.length,
      nextCursor: firstPage.nextCursor,
      hasMore: firstPage.page.hasMore,
      compactMarkets: firstPage.events.every((event: any) => event.markets?.length > 0),
      slugs: firstPage.events.map((event: any) => event.slug),
    },
    secondPage: {
      count: secondPage.events.length,
      nextCursor: secondPage.nextCursor,
      hasMore: secondPage.page.hasMore,
      compactMarkets: secondPage.events.every((event: any) => event.markets?.length > 0),
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
