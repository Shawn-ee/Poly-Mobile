import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { loadLocalEnvForScript } from "./local_env";

loadLocalEnvForScript(["DATABASE_URL"]);

let prisma: typeof import("@/lib/db")["prisma"];

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

const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

function shortHash(value: string, length = 10) {
  return createHash("sha256").update(value).digest("hex").slice(0, length);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function referenceSourceFor(market: SeedMarket) {
  return market.slug?.includes("-holiwyn-") ? "contract-fixture" : "sportsbook-odds";
}

function marketGroupKeyFor(market: SeedMarket) {
  if (market.marketType === "to_advance") return "to-advance";
  if (market.marketType === "spread") return "spread";
  if (market.marketType === "total_goals") return "totals";
  return "regulation-winner";
}

function outcomeSpecsFor(market: SeedMarket, teams: ReturnType<typeof parseTitleTeams>) {
  const home = teams.homeTeamName ?? "Home";
  const away = teams.awayTeamName ?? "Away";
  const line = market.line ?? "";
  const slug = market.slug ?? "";

  if (market.marketType === "to_advance") {
    return [
      { code: "HOME_ADVANCES", name: `${home} advances`, side: "home", probability: 0.58 },
      { code: "AWAY_ADVANCES", name: `${away} advances`, side: "away", probability: 0.42 },
    ];
  }
  if (market.marketType === "spread") {
    const parsed = Number(line);
    const homeProbability = Number.isFinite(parsed) ? Math.max(0.08, Math.min(0.92, 0.5 + parsed * 0.09)) : 0.5;
    const awayLine = Number.isFinite(parsed) ? -parsed : null;
    const signedHome = Number.isFinite(parsed) && parsed > 0 ? `+${line}` : line;
    const signedAway = awayLine != null ? (awayLine > 0 ? `+${awayLine}` : String(awayLine)) : "";
    return [
      { code: "HOME", name: `${home} ${signedHome}`.trim(), side: "home", probability: homeProbability },
      { code: "AWAY", name: `${away} ${signedAway}`.trim(), side: "away", probability: 1 - homeProbability },
    ];
  }
  if (market.marketType === "total_goals") {
    const parsed = Number(line);
    const overProbability = Number.isFinite(parsed) ? Math.max(0.08, Math.min(0.92, 0.86 - parsed * 0.12)) : 0.5;
    return [
      { code: "OVER", name: `Over ${line}`.trim(), side: "over", probability: overProbability },
      { code: "UNDER", name: `Under ${line}`.trim(), side: "under", probability: 1 - overProbability },
    ];
  }
  if (slug.includes("regulation-home")) {
    return [
      { code: "YES", name: "Yes", side: "yes", probability: 0.45 },
      { code: "NO", name: "No", side: "no", probability: 0.55 },
    ];
  }
  if (slug.includes("regulation-away")) {
    return [
      { code: "YES", name: "Yes", side: "yes", probability: 0.35 },
      { code: "NO", name: "No", side: "no", probability: 0.65 },
    ];
  }
  if (slug.includes("regulation-draw")) {
    return [
      { code: "YES", name: "Yes", side: "yes", probability: 0.2 },
      { code: "NO", name: "No", side: "no", probability: 0.8 },
    ];
  }
  return [
    { code: "HOME", name: home, side: "home", probability: 0.45 },
    { code: "AWAY", name: away, side: "away", probability: 0.35 },
    { code: "DRAW", name: "Draw", side: "draw", probability: 0.2 },
  ];
}

async function upsertOutcomesAndSnapshots(params: {
  market: { id: string; slug: string | null; externalSlug: string | null; externalMarketId: string | null; conditionId: string | null };
  seedMarket: SeedMarket;
  teams: ReturnType<typeof parseTitleTeams>;
  now: Date;
  referenceSource: string;
}) {
  const specs = outcomeSpecsFor(params.seedMarket, params.teams);
  const outcomeIds: string[] = [];
  for (const [index, spec] of specs.entries()) {
    const existing = await prisma.outcome.findFirst({
      where: { marketId: params.market.id, code: spec.code },
      select: { id: true },
    });
    const tokenPrefix = params.referenceSource === "contract-fixture" ? "holiwyn-contract" : "odds-api";
    const referenceTokenId = `${tokenPrefix}-${shortHash(`${params.market.slug}:${spec.code}`, 24)}`;
    const data = {
      name: spec.name,
      label: spec.name,
      side: spec.side,
      displayOrder: index,
      isActive: true,
      isTradable: true,
      status: "active",
      referenceTokenId,
      referenceOutcomeLabel: spec.name,
      referenceMetadata: {
        providerSource: "the-odds-api",
        referenceSource: params.referenceSource,
        restoreSource: "cached-live-runtime-summary",
        normalizedProbability: Number(spec.probability.toFixed(4)),
      },
    };
    const outcome = existing
      ? await prisma.outcome.update({ where: { id: existing.id }, data })
      : await prisma.outcome.create({
          data: {
            marketId: params.market.id,
            code: spec.code,
            slug: `${params.market.slug}-${slugify(spec.code)}`,
            ...data,
          },
        });
    outcomeIds.push(outcome.id);

    const price = Math.max(0.01, Math.min(0.99, Number(spec.probability.toFixed(4))));
    await prisma.referenceQuoteSnapshot.upsert({
      where: {
        marketId_outcomeId_source: {
          marketId: params.market.id,
          outcomeId: outcome.id,
          source: params.referenceSource,
        },
      },
      create: {
        marketId: params.market.id,
        outcomeId: outcome.id,
        source: params.referenceSource,
        externalSlug: params.market.externalSlug,
        externalMarketId: params.market.externalMarketId,
        conditionId: params.market.conditionId,
        tokenId: referenceTokenId,
        outcomeLabel: spec.name,
        outcomePrice: dec(price),
        bestBid: dec(Math.max(0.01, Number((price - 0.02).toFixed(4)))),
        bestAsk: dec(Math.min(0.99, Number((price + 0.02).toFixed(4)))),
        spread: dec("0.04"),
        lastTradePrice: dec(price),
        volume: dec("0"),
        volume24hr: dec("0"),
        liquidity: dec("1000"),
        liquidityClob: dec("0"),
        acceptingOrders: true,
        qualityStatus: "approved",
        mmEligible: false,
        reason: "cached_live_runtime_restore",
        fetchedAt: params.now,
      },
      update: {
        tokenId: referenceTokenId,
        outcomeLabel: spec.name,
        outcomePrice: dec(price),
        bestBid: dec(Math.max(0.01, Number((price - 0.02).toFixed(4)))),
        bestAsk: dec(Math.min(0.99, Number((price + 0.02).toFixed(4)))),
        spread: dec("0.04"),
        lastTradePrice: dec(price),
        volume: dec("0"),
        volume24hr: dec("0"),
        liquidity: dec("1000"),
        liquidityClob: dec("0"),
        acceptingOrders: true,
        qualityStatus: "approved",
        mmEligible: false,
        reason: "cached_live_runtime_restore",
        fetchedAt: params.now,
      },
    });
  }
  await prisma.outcome.updateMany({
    where: { marketId: params.market.id, id: { notIn: outcomeIds } },
    data: { isActive: false, isTradable: false, status: "archived" },
  });
  return outcomeIds.length;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to restore one-event local runtime state in production.");
  }

  ({ prisma } = await import("@/lib/db"));

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

  const restoredAt = new Date();
  const sourceUpdatedAt = new Date(summary.generatedAt ?? Date.now());
  const restoredEvent = await prisma.event.upsert({
    where: { slug: eventSlug },
    create: {
      slug: eventSlug,
      title: eventTitle,
      description: `${eventTitle} local one-event live runtime test`,
      sportKey: summary.event.sportKey ?? "soccer",
      leagueKey: summary.event.sportKey ?? "soccer",
      eventType: "match",
      category: "Soccer",
      homeTeamName: teams.homeTeamName,
      awayTeamName: teams.awayTeamName,
      startTime: eventStartTime,
      status: "active",
      liveStatus: "LIVE",
      source: "the-odds-api",
      externalEventId: summary.event.providerEventId ?? null,
      externalSlug: `${summary.event.sportKey ?? "soccer"}-${summary.event.providerEventId ?? eventSlug}`,
      sourceUpdatedAt,
      metadata: {
        providerSource: "the-odds-api",
        restoreSource: "cached-live-runtime-summary",
        restoredAt: restoredAt.toISOString(),
        liveRuntimeSummaryPath: summaryPath,
        resultMode: "must_advance",
        primaryMarketProfile: "advance",
      },
    },
    update: {
      title: eventTitle,
      description: `${eventTitle} local one-event live runtime test`,
      sportKey: summary.event.sportKey ?? "soccer",
      leagueKey: summary.event.sportKey ?? "soccer",
      eventType: "match",
      category: "Soccer",
      homeTeamName: teams.homeTeamName,
      awayTeamName: teams.awayTeamName,
      startTime: eventStartTime,
      status: "active",
      liveStatus: "LIVE",
      source: "the-odds-api",
      externalEventId: summary.event.providerEventId ?? null,
      externalSlug: `${summary.event.sportKey ?? "soccer"}-${summary.event.providerEventId ?? eventSlug}`,
      sourceUpdatedAt,
      metadata: {
        providerSource: "the-odds-api",
        restoreSource: "cached-live-runtime-summary",
        restoredAt: restoredAt.toISOString(),
        liveRuntimeSummaryPath: summaryPath,
        resultMode: "must_advance",
        primaryMarketProfile: "advance",
      },
    },
  });

  const staleMarkets = await prisma.market.updateMany({
    where: {
      eventId: restoredEvent.id,
      referenceSource: { in: ["sportsbook-odds", "contract-fixture"] },
      id: { notIn: Array.from(restoredMarketIds) },
    },
    data: {
      status: "CLOSED",
      isListed: false,
      settlementStatus: "closed_cached_restore_stale_replay",
    },
  });

  let restoredMarketCount = 0;
  let restoredOutcomeCount = 0;
  for (const [index, market] of summary.provider.seed.markets.entries()) {
    const referenceSource = referenceSourceFor(market);
    const slug = market.slug ?? `${eventSlug}-${slugify(market.title)}`;
    const externalMarketId = referenceSource === "contract-fixture"
      ? `holiwyn-contract-${slug}`
      : `${summary.event.providerEventId ?? eventSlug}:${market.marketType}:${market.line ?? "main"}`;
    const conditionId = `${referenceSource === "contract-fixture" ? "holiwyn-contract" : "odds-api"}-${shortHash(`${slug}:${externalMarketId}`, 24)}`;
    const restoredMarket = await prisma.market.upsert({
      where: { slug },
      create: {
        id: market.id,
        slug,
        title: market.title,
        description: referenceSource === "contract-fixture"
          ? "Holiwyn-owned fake-token prediction contract restored from cached local live-runtime proof."
          : "Sportsbook-derived fake-token market restored from cached local live-runtime proof.",
        categoryLegacy: "sports",
        type: "BINARY",
        marketType: market.marketType,
        marketGroupKey: marketGroupKeyFor(market),
        marketGroupTitle: market.marketGroupTitle ?? undefined,
        line: market.line != null ? new Prisma.Decimal(market.line) : undefined,
        unit: ["spread", "total_goals"].includes(market.marketType) ? "goals" : undefined,
        period: market.marketType === "to_advance" ? "full-game" : "regulation",
        status: "LIVE",
        eventId: restoredEvent.id,
        visibility: "PUBLIC",
        mechanism: "ORDERBOOK",
        kind: "ORDERBOOK",
        isListed: true,
        isCanceled: false,
        settlementStatus: null,
        referenceSource,
        externalSlug: `${summary.event.sportKey ?? "soccer"}-${summary.event.providerEventId ?? eventSlug}`,
        externalMarketId,
        conditionId,
        displayOrder: displayOrderFor(market, index),
        sourceUpdatedAt,
        referenceMetadata: {
          providerSource: "the-odds-api",
          referenceSource,
          restoreSource: "cached-live-runtime-summary",
          restoredAt: restoredAt.toISOString(),
          expectedOutcomeCount: market.outcomeCount ?? null,
          providerBacked: referenceSource === "sportsbook-odds",
          sportsbookDerived: referenceSource === "sportsbook-odds",
          tradable: true,
        },
      },
      update: {
        slug: market.slug ?? undefined,
        title: market.title,
        description: referenceSource === "contract-fixture"
          ? "Holiwyn-owned fake-token prediction contract restored from cached local live-runtime proof."
          : "Sportsbook-derived fake-token market restored from cached local live-runtime proof.",
        marketType: market.marketType,
        marketGroupKey: marketGroupKeyFor(market),
        marketGroupTitle: market.marketGroupTitle ?? undefined,
        line: market.line != null ? new Prisma.Decimal(market.line) : null,
        unit: ["spread", "total_goals"].includes(market.marketType) ? "goals" : null,
        period: market.marketType === "to_advance" ? "full-game" : "regulation",
        status: "LIVE",
        visibility: "PUBLIC",
        mechanism: "ORDERBOOK",
        kind: "ORDERBOOK",
        isListed: true,
        isCanceled: false,
        settlementStatus: null,
        referenceSource,
        externalSlug: `${summary.event.sportKey ?? "soccer"}-${summary.event.providerEventId ?? eventSlug}`,
        externalMarketId,
        conditionId,
        displayOrder: displayOrderFor(market, index),
        sourceUpdatedAt,
        referenceMetadata: {
          providerSource: "the-odds-api",
          referenceSource,
          restoreSource: "cached-live-runtime-summary",
          restoredAt: restoredAt.toISOString(),
          expectedOutcomeCount: market.outcomeCount ?? null,
          providerBacked: referenceSource === "sportsbook-odds",
          sportsbookDerived: referenceSource === "sportsbook-odds",
          tradable: true,
        },
      },
    });
    restoredMarketCount += 1;
    restoredOutcomeCount += await upsertOutcomesAndSnapshots({
      market: restoredMarket,
      seedMarket: market,
      teams,
      now: sourceUpdatedAt,
      referenceSource,
    });
  }

  const selectedEvent = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      markets: {
        where: { referenceSource: { in: ["sportsbook-odds", "contract-fixture"] }, isListed: true, visibility: "PUBLIC" },
        select: { id: true, title: true, marketType: true, line: true, status: true, referenceSource: true, outcomes: { where: { isActive: true, isTradable: true }, select: { id: true } } },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  assert(selectedEvent, `Event ${eventSlug} was not found after restore.`);

  const checks = {
    eventTitleRestored: selectedEvent.title === eventTitle,
    eventUpcomingOrCurrent: selectedEvent.startTime != null && selectedEvent.startTime.getTime() > Date.now(),
    restoredMarketsVisible: restoredMarketCount > 0 && selectedEvent.markets.length >= restoredMarketCount,
    restoredTradableOutcomes: restoredOutcomeCount > 0 && selectedEvent.markets.every((market) => market.outcomes.length > 0),
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
      restoredOutcomeCount,
      staleReplayClosedCount: staleMarkets.count,
      visibleMarketCount: selectedEvent.markets.length,
      sportsbookMarketCount: selectedEvent.markets.filter((market) => market.referenceSource === "sportsbook-odds").length,
      contractFixtureMarketCount: selectedEvent.markets.filter((market) => market.referenceSource === "contract-fixture").length,
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
    if (prisma) await prisma.$disconnect();
  });
