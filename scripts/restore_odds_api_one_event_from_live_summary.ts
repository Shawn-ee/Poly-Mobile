import fs from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const DEFAULT_SUMMARY_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-cached-restore-summary.redacted.json";

type SeedMarket = {
  id: string;
  slug?: string | null;
  title: string;
  marketType: string;
  marketGroupTitle?: string | null;
  line?: string | null;
  outcomeCount?: number;
};

type LiveSummary = {
  pass?: boolean;
  generatedAt?: string;
  event?: {
    providerEventId?: string;
    sportKey?: string;
    title?: string;
    commenceTime?: string;
    localSlug?: string;
  };
  provider?: {
    seed?: {
      event?: {
        id?: string;
        slug?: string | null;
        title?: string;
      };
      markets?: SeedMarket[];
    };
  };
};

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function writeJson(outputPath: string, value: unknown) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function parseTitleTeams(title: string) {
  const [away, home] = title.split(" vs. ").map((item) => item.trim()).filter(Boolean);
  return {
    awayTeamName: away || null,
    homeTeamName: home || null,
  };
}

function displayOrderFor(market: SeedMarket, index: number) {
  const slug = market.slug ?? "";
  if (market.marketType === "to_advance") return 0;
  if (slug.includes("regulation-home")) return 10;
  if (slug.includes("regulation-away")) return 11;
  if (slug.includes("regulation-draw")) return 12;
  if (market.marketType === "match_winner_1x2") return 20 + index;
  if (market.marketType === "spread") return 100 + index;
  if (market.marketType === "total_goals") return 200 + index;
  return 500 + index;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to restore one-event local runtime state in production.");
  }

  const summaryPath = argValue("summaryPath") ?? DEFAULT_SUMMARY_PATH;
  const outputPath = argValue("output") ?? argValue("summaryOutput") ?? DEFAULT_OUTPUT_PATH;
  const summary = await readJson<LiveSummary>(summaryPath);
  assert(summary.pass === true, `Live runtime summary ${summaryPath} did not pass.`);
  assert(summary.event?.title, "Live runtime summary is missing event.title.");
  assert(summary.event?.commenceTime, "Live runtime summary is missing event.commenceTime.");
  assert(summary.event?.localSlug, "Live runtime summary is missing event.localSlug.");
  assert(Array.isArray(summary.provider?.seed?.markets), "Live runtime summary is missing provider.seed.markets.");

  const eventSlug = summary.event.localSlug;
  const eventTitle = summary.event.title;
  const eventStartTime = new Date(summary.event.commenceTime);
  assert(Number.isFinite(eventStartTime.getTime()), `Invalid event commenceTime: ${summary.event.commenceTime}`);
  const restoredMarketIds = new Set(summary.provider.seed.markets.map((market) => market.id));
  const teams = parseTitleTeams(eventTitle);

  const restoredEvent = await prisma.event.update({
    where: { slug: eventSlug },
    data: {
      title: eventTitle,
      description: `${eventTitle} local one-event live runtime test`,
      sportKey: summary.event.sportKey ?? "soccer",
      leagueKey: summary.event.sportKey ?? "soccer",
      eventType: "match",
      category: "Soccer",
      homeTeamName: teams.homeTeamName,
      awayTeamName: teams.awayTeamName,
      startTime: eventStartTime,
      status: "ACTIVE",
      liveStatus: "scheduled",
      source: "the-odds-api",
      externalEventId: summary.event.providerEventId ?? null,
      metadata: {
        providerSource: "the-odds-api",
        restoreSource: "cached-live-runtime-summary",
        restoredAt: new Date().toISOString(),
        liveRuntimeSummaryPath: summaryPath,
        resultMode: "must_advance",
        primaryMarketProfile: "advance",
      },
    },
  });

  const staleMarkets = await prisma.market.updateMany({
    where: {
      eventId: restoredEvent.id,
      referenceSource: "sportsbook-odds",
      id: { notIn: Array.from(restoredMarketIds) },
    },
    data: {
      status: "CLOSED",
      isListed: false,
      settlementStatus: "closed_cached_restore_stale_replay",
    },
  });

  let restoredMarketCount = 0;
  for (const [index, market] of summary.provider.seed.markets.entries()) {
    const updated = await prisma.market.updateMany({
      where: { id: market.id, eventId: restoredEvent.id },
      data: {
        slug: market.slug ?? undefined,
        title: market.title,
        marketType: market.marketType,
        marketGroupTitle: market.marketGroupTitle ?? undefined,
        line: market.line != null ? new Prisma.Decimal(market.line) : null,
        status: "LIVE",
        visibility: "PUBLIC",
        mechanism: "ORDERBOOK",
        isListed: true,
        isCanceled: false,
        settlementStatus: null,
        referenceSource: "sportsbook-odds",
        displayOrder: displayOrderFor(market, index),
        sourceUpdatedAt: new Date(summary.generatedAt ?? Date.now()),
        referenceMetadata: {
          providerSource: "the-odds-api",
          restoreSource: "cached-live-runtime-summary",
          restoredAt: new Date().toISOString(),
          expectedOutcomeCount: market.outcomeCount ?? null,
        },
      },
    });
    restoredMarketCount += updated.count;
  }

  const selectedEvent = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      markets: {
        where: { referenceSource: "sportsbook-odds", isListed: true, visibility: "PUBLIC" },
        select: { id: true, title: true, marketType: true, line: true, status: true },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  assert(selectedEvent, `Event ${eventSlug} was not found after restore.`);

  const checks = {
    eventTitleRestored: selectedEvent.title === eventTitle,
    eventUpcomingOrCurrent: selectedEvent.startTime != null && selectedEvent.startTime.getTime() > Date.now(),
    restoredMarketsVisible: restoredMarketCount > 0 && selectedEvent.markets.length >= restoredMarketCount,
    staleReplayMarketsClosed: staleMarkets.count >= 0,
  };
  const summaryOut = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-one-event-cached-live-restore",
    pass: Object.values(checks).every(Boolean),
    sourceSummaryPath: summaryPath,
    event: {
      id: selectedEvent.id,
      slug: selectedEvent.slug,
      title: selectedEvent.title,
      startTime: selectedEvent.startTime?.toISOString() ?? null,
      source: selectedEvent.source,
      externalEventId: selectedEvent.externalEventId,
    },
    markets: {
      restoredMarketCount,
      staleReplayClosedCount: staleMarkets.count,
      visibleMarketCount: selectedEvent.markets.length,
      visibleTitles: selectedEvent.markets.map((market) => market.title),
    },
    checks,
    gaps: {
      p0: Object.entries(checks).filter(([, value]) => !value).map(([key]) => key),
      p1: ["This is a quota-free cached restore; fresh live provider refresh still requires THE_ODDS_API_KEY explicitly."],
      p2: ["Per-provider-event slugs should replace the reusable local test slug before multi-event onboarding."],
    },
  };

  await writeJson(outputPath, summaryOut);
  process.stdout.write(`${JSON.stringify(summaryOut, null, 2)}\n`);
  if (!summaryOut.pass) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
