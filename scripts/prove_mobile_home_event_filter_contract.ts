import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GET as listEvents } from "@/app/api/events/route";
import { loadHomeEventFeedPage } from "../mobile/src/services/homeEventFeedService";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KD-home-event-filter-contract/cycle-KD-home-event-filter-contract.json";
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function createHomeFilterProofEvent(params: { suffix: string; index: number; status: "live" | "upcoming" }) {
  const start = new Date(Date.now() + (params.index + 1) * 45 * 60 * 1000);
  const title = `KD ${params.status} Home Filter ${params.index} ${params.suffix}`;
  return prisma.event.create({
    data: {
      slug: `mobile-kd-home-filter-${params.status}-${params.index}-${params.suffix}`,
      title,
      description: "Disposable event proving backend Home status-filter pagination.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: `KD ${params.status} Home ${params.index}`,
      awayTeamName: "KD Backend",
      status: params.status,
      startTime: start,
      markets: {
        create: [{
          slug: `mobile-kd-home-filter-market-${params.status}-${params.index}-${params.suffix}`,
          title: `${title} - Regulation Time Winner`,
          description: "KD Home status filter proof market.",
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
          externalSlug: `kd-home-filter-market-${params.status}-${params.index}-${params.suffix}`,
          externalMarketId: `gamma-kd-home-filter-${params.status}-${params.index}-${params.suffix}`,
          conditionId: `condition-kd-home-filter-${params.status}-${params.index}-${params.suffix}`,
          sourceUpdatedAt: new Date(),
          isListed: true,
          outcomes: {
            create: [
              {
                name: `KD ${params.status} Home ${params.index}`,
                label: `KD ${params.status} Home ${params.index}`,
                side: "home",
                code: "HOME",
                slug: `mobile-kd-home-filter-home-${params.status}-${params.index}-${params.suffix}`,
                displayOrder: 0,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-kd-home-${params.status}-${params.index}-${params.suffix}`,
                referenceOutcomeLabel: `KD ${params.status} Home ${params.index}`,
              },
              {
                name: "Tie",
                label: "Tie",
                side: "draw",
                code: "DRAW",
                slug: `mobile-kd-home-filter-draw-${params.status}-${params.index}-${params.suffix}`,
                displayOrder: 1,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-kd-draw-${params.status}-${params.index}-${params.suffix}`,
                referenceOutcomeLabel: "Tie",
              },
              {
                name: "KD Backend",
                label: "KD Backend",
                side: "away",
                code: "AWAY",
                slug: `mobile-kd-home-filter-away-${params.status}-${params.index}-${params.suffix}`,
                displayOrder: 2,
                isActive: true,
                isTradable: true,
                referenceTokenId: `token-kd-away-${params.status}-${params.index}-${params.suffix}`,
                referenceOutcomeLabel: "KD Backend",
              },
            ],
          },
        }],
      },
    },
  });
}

const routeApi = {
  listWorldCupEvents: async (input: { limit?: number; cursor?: string | null; status?: string | null }) => {
    const query = new URLSearchParams({
      sportKey: "soccer",
      leagueKey: "world_cup",
      includeMobileMarkets: "1",
      limit: String(input.limit ?? 10),
    });
    if (input.status?.trim()) query.set("status", input.status.trim());
    if (input.cursor) query.set("cursor", input.cursor);
    const response = await listEvents(new NextRequest(`http://localhost/api/events?${query.toString()}`));
    assert(response.status === 200, `Expected /api/events status 200, received ${response.status}.`);
    return response.json();
  },
};

async function main() {
  const suffix = randomUUID().slice(0, 8);
  await Promise.all([
    createHomeFilterProofEvent({ suffix, index: 0, status: "live" }),
    createHomeFilterProofEvent({ suffix, index: 1, status: "live" }),
    createHomeFilterProofEvent({ suffix, index: 0, status: "upcoming" }),
    createHomeFilterProofEvent({ suffix, index: 1, status: "upcoming" }),
  ]);

  const livePage = await loadHomeEventFeedPage({
    api: routeApi,
    filter: "live",
    limit: 10,
    cursor: null,
  });
  const upcomingPage = await loadHomeEventFeedPage({
    api: routeApi,
    filter: "upcoming",
    limit: 10,
    cursor: null,
  });

  const liveEvents = livePage.events.filter((event: any) => event.slug.includes(suffix));
  const upcomingEvents = upcomingPage.events.filter((event: any) => event.slug.includes(suffix));

  assert(livePage.source === "server-route", "Expected live Home feed to use the server route.");
  assert(upcomingPage.source === "server-route", "Expected upcoming Home feed to use the server route.");
  assert(liveEvents.length === 2, `Expected 2 proof live events, received ${liveEvents.length}.`);
  assert(upcomingEvents.length === 2, `Expected 2 proof upcoming events, received ${upcomingEvents.length}.`);
  assert(liveEvents.every((event: any) => event.status === "live"), "Expected live feed to contain only live proof events.");
  assert(upcomingEvents.every((event: any) => event.status === "upcoming"), "Expected upcoming feed to contain only upcoming proof events.");
  assert(liveEvents.every((event: any) => event.markets?.length > 0), "Expected compact markets on live proof events.");
  assert(upcomingEvents.every((event: any) => event.markets?.length > 0), "Expected compact markets on upcoming proof events.");

  const summary = {
    pass: true,
    createdAt: new Date().toISOString(),
    route: "/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&status=<home-filter>&limit=10",
    service: "loadHomeEventFeedPage",
    filters: {
      live: {
        source: livePage.source,
        status: livePage.status,
        proofCount: liveEvents.length,
        compactMarkets: liveEvents.every((event: any) => event.markets?.length > 0),
        slugs: liveEvents.map((event: any) => event.slug),
      },
      upcoming: {
        source: upcomingPage.source,
        status: upcomingPage.status,
        proofCount: upcomingEvents.length,
        compactMarkets: upcomingEvents.every((event: any) => event.markets?.length > 0),
        slugs: upcomingEvents.map((event: any) => event.slug),
      },
    },
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(summary, null, 2));
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
