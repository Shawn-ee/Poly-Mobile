import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import {
  assertQuotaBudget,
  availableMarketKeysFromResponse,
  expandLineMarketsByPoint,
  normalizeOddsApiEvent,
  oddsApiGetJson,
  oddsApiSingleEventSlug,
  quotaCost,
  seedOddsApiSingleEvent,
  selectCandidateSoccerSports,
  selectOddsMarkets,
  selectPreferredEvent,
  tomorrowUtcWindow,
  type OddsApiCallRecord,
  type OddsApiEvent,
  type OddsApiEventOddsResponse,
  type OddsApiMarketsResponse,
  type OddsApiSport,
} from "@/server/services/theOddsApiSingleEventProvider";

const OUTPUT_DIR = "docs/mobile/harness/the-odds-api-single-event";
const AUDIT_PATH = "docs/mobile/audits/BATCH_THE_ODDS_API_SINGLE_EVENT.md";
const REGION = "us";
const ODDS_FORMAT = "decimal";
const MAX_CREDITS = 8;
const MIN_REMAINING = 2;

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const hasFlag = (name: string) => process.argv.includes(`--${name}`);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed The Odds API single-event provider in production.");
  }
  const outputDir = argValue("outputDir") ?? OUTPUT_DIR;
  const replayPath = argValue("fromRedactedOdds");
  const selectedEventId = argValue("eventId");
  const selectedSportKey = argValue("sportKey");
  const dryRun = hasFlag("dryRun");
  const calls: OddsApiCallRecord[] = [];
  await fs.mkdir(outputDir, { recursive: true });

  if (replayPath) {
    await replayRedactedOdds({ replayPath, outputDir, dryRun });
    return;
  }

  const apiKey = process.env.THE_ODDS_API_KEY?.trim();
  assert(apiKey, "THE_ODDS_API_KEY must be set in the environment. The key is never read from files or CLI args.");

  const sports = await oddsApiGetJson<OddsApiSport[]>({
    name: "sports",
    path: "/sports",
    apiKey,
    calls,
  });
  assertQuotaBudget({ calls, maxCredits: MAX_CREDITS, minRemaining: MIN_REMAINING });
  const candidateSports = selectCandidateSoccerSports(sports);
  assert(candidateSports.length > 0, "No active soccer sports were returned by The Odds API.");

  const window = tomorrowUtcWindow();
  const selection = await selectOneEvent({
    apiKey,
    calls,
    candidateSports,
    selectedEventId,
    selectedSportKey,
    window,
  });
  assert(selection, "No current/tomorrow soccer event found in the limited candidate sport set.");

  const marketsResponse = await oddsApiGetJson<OddsApiMarketsResponse>({
    name: "event-markets",
    path: `/sports/${encodeURIComponent(selection.sport.key)}/events/${encodeURIComponent(selection.event.id)}/markets`,
    apiKey,
    calls,
    searchParams: {
      regions: REGION,
      dateFormat: "iso",
    },
  });
  assertQuotaBudget({ calls, maxCredits: MAX_CREDITS, minRemaining: MIN_REMAINING });

  const availableMarketKeys = availableMarketKeysFromResponse(marketsResponse);
  const selectedMarketKeys = selectOddsMarkets(availableMarketKeys);
  assert(selectedMarketKeys.length > 0, "Selected event has no preferred MVP market keys available.");
  await writeJson(path.join(outputDir, "available-markets.redacted.json"), {
    generatedAt: new Date().toISOString(),
    source: "the-odds-api",
    redacted: true,
    sportKey: selection.sport.key,
    event: redactedEvent(selection.event),
    region: REGION,
    availableMarketKeys,
    selectedMarketKeys,
    apiCalls: calls,
  });

  const oddsResponse = await oddsApiGetJson<OddsApiEventOddsResponse>({
    name: "event-odds",
    path: `/sports/${encodeURIComponent(selection.sport.key)}/events/${encodeURIComponent(selection.event.id)}/odds`,
    apiKey,
    calls,
    searchParams: {
      regions: REGION,
      markets: selectedMarketKeys.join(","),
      oddsFormat: ODDS_FORMAT,
      dateFormat: "iso",
    },
  });
  assertQuotaBudget({ calls, maxCredits: MAX_CREDITS, minRemaining: MIN_REMAINING });

  const normalizedMarkets = normalizeOddsApiEvent(oddsResponse);
  assert(normalizedMarkets.length > 0, "The Odds API returned no normalizable sportsbook markets for the selected event.");
  await writeJson(path.join(outputDir, "event-odds.redacted.json"), {
    generatedAt: new Date().toISOString(),
    source: "the-odds-api",
    redacted: true,
    event: redactedEvent(oddsResponse),
    region: REGION,
    oddsFormat: ODDS_FORMAT,
    selectedBookmaker: normalizedMarkets[0]
      ? {
          key: normalizedMarkets[0].bookmakerKey,
          title: normalizedMarkets[0].bookmakerTitle,
        }
      : null,
    normalizedMarkets,
    apiCalls: calls,
  });

  const seed = dryRun
    ? null
    : await seedOddsApiSingleEvent({
        oddsEvent: oddsResponse,
        markets: normalizedMarkets,
        region: REGION,
        oddsFormat: ODDS_FORMAT,
      });

  const proof = await buildRouteProof({ seedSlug: oddsApiSingleEventSlug() });
  const summary = {
    pass: Boolean(seed) && proof.homeVisible && proof.detailVisible && proof.sportsbookMarketCount > 0,
    generatedAt: new Date().toISOString(),
    dryRun,
    scope: "the-odds-api-single-event-temporary-provider",
    policy: {
      providerSource: "the-odds-api",
      referenceSource: "sportsbook-odds",
      doesNotClaimPolymarketBacked: true,
      oneEventOnly: true,
      maxCredits: MAX_CREDITS,
      region: REGION,
    },
    sport: {
      key: selection.sport.key,
      title: selection.sport.title ?? null,
    },
    event: redactedEvent(selection.event),
    apiCalls: calls,
    quota: {
      totalLastCost: calls.reduce((total, call) => total + quotaCost(call.quota), 0),
      latest: calls.at(-1)?.quota ?? null,
    },
    availableMarketKeys,
    selectedMarketKeys,
    importedMarketKeys: Array.from(new Set(normalizedMarkets.map((market) => market.marketKey))),
    unavailablePreferredMarketKeys: selectedMarketKeys.length > 0
      ? []
      : ["h2h", "spreads", "totals"],
    normalized: {
      marketCount: normalizedMarkets.length,
      outcomeCount: normalizedMarkets.reduce((total, market) => total + market.outcomes.length, 0),
      marketTypes: Array.from(new Set(normalizedMarkets.map((market) => market.marketType))),
    },
    seed,
    mobile: proof,
  };

  await writeJson(path.join(outputDir, "single-event-summary.redacted.json"), summary);
  await writeAudit(summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.pass && !dryRun) process.exitCode = 1;
}

async function selectOneEvent(params: {
  apiKey: string;
  calls: OddsApiCallRecord[];
  candidateSports: OddsApiSport[];
  selectedSportKey?: string;
  selectedEventId?: string;
  window: { from: string; to: string };
}) {
  const sports = params.selectedSportKey
    ? params.candidateSports.filter((sport) => sport.key === params.selectedSportKey)
    : params.candidateSports;
  for (const sport of sports) {
    const events = await oddsApiGetJson<OddsApiEvent[]>({
      name: `events:${sport.key}`,
      path: `/sports/${encodeURIComponent(sport.key)}/events`,
      apiKey: params.apiKey,
      calls: params.calls,
      searchParams: {
        dateFormat: "iso",
        commenceTimeFrom: params.window.from,
        commenceTimeTo: params.window.to,
        eventIds: params.selectedEventId,
      },
    });
    assertQuotaBudget({ calls: params.calls, maxCredits: MAX_CREDITS, minRemaining: MIN_REMAINING });
    const event = params.selectedEventId
      ? events.find((item) => item.id === params.selectedEventId) ?? null
      : selectPreferredEvent(events);
    if (event) return { sport, event };
  }
  return null;
}

async function replayRedactedOdds(params: { replayPath: string; outputDir: string; dryRun: boolean }) {
  const raw = JSON.parse(await fs.readFile(params.replayPath, "utf8"));
  const event = raw.event;
  assert(event && typeof event === "object", "Redacted odds fixture is missing event metadata.");
  const normalizedMarkets = Array.isArray(raw.normalizedMarkets)
    ? raw.normalizedMarkets.flatMap((market: any) => expandLineMarketsByPoint(market))
    : [];
  assert(normalizedMarkets.length > 0, "Redacted odds fixture has no normalized markets.");
  const oddsEvent: OddsApiEventOddsResponse = {
    id: String(event.id),
    sport_key: String(event.sportKey),
    sport_title: typeof event.sportTitle === "string" ? event.sportTitle : undefined,
    commence_time: String(event.startTime),
    home_team: String(event.homeTeam),
    away_team: String(event.awayTeam),
    bookmakers: [],
  };
  const seed = params.dryRun
    ? null
    : await seedOddsApiSingleEvent({
        oddsEvent,
        markets: normalizedMarkets,
        region: String(raw.region ?? REGION),
        oddsFormat: String(raw.oddsFormat ?? ODDS_FORMAT),
      });
  const proof = await buildRouteProof({ seedSlug: oddsApiSingleEventSlug() });
  const summary = {
    pass: Boolean(seed) && proof.homeVisible && proof.detailVisible && proof.sportsbookMarketCount > 0,
    generatedAt: new Date().toISOString(),
    dryRun: params.dryRun,
    replayedFromRedactedOdds: true,
    scope: "the-odds-api-single-event-temporary-provider-replay",
    policy: {
      providerSource: "the-odds-api",
      referenceSource: "sportsbook-odds",
      doesNotClaimPolymarketBacked: true,
      noProviderApiCalls: true,
    },
    event,
    apiCalls: raw.apiCalls ?? [],
    normalized: {
      marketCount: normalizedMarkets.length,
      outcomeCount: normalizedMarkets.reduce((total: number, market: any) => total + (Array.isArray(market.outcomes) ? market.outcomes.length : 0), 0),
      marketTypes: Array.from(new Set(normalizedMarkets.map((market: any) => market.marketType))),
      lineValues: normalizedMarkets.map((market: any) => market.line).filter((line: unknown) => line != null),
    },
    seed,
    mobile: proof,
  };
  await writeJson(path.join(params.outputDir, "single-event-replay-summary.redacted.json"), summary);
  await writeAudit({
    ...summary,
    sport: { key: oddsEvent.sport_key },
    availableMarketKeys: [],
    importedMarketKeys: Array.from(new Set(normalizedMarkets.map((market: any) => market.marketKey))),
  });
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.pass && !params.dryRun) process.exitCode = 1;
}

async function buildRouteProof(params: { seedSlug: string }) {
  const event = await prisma.event.findUnique({
    where: { slug: params.seedSlug },
    include: {
      markets: {
        where: { isListed: true, visibility: "PUBLIC" },
        include: { outcomes: { where: { isActive: true } } },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!event) {
    return {
      homeVisible: false,
      detailVisible: false,
      sportsbookMarketCount: 0,
      tradableOutcomeCount: 0,
      routeMode: "database-proof",
      eventSlug: params.seedSlug,
    };
  }
  const sportsbookMarkets = event.markets.filter((market) => market.referenceSource === "sportsbook-odds");
  return {
    homeVisible: true,
    detailVisible: sportsbookMarkets.length > 0,
    sportsbookMarketCount: sportsbookMarkets.length,
    tradableOutcomeCount: sportsbookMarkets.reduce(
      (total, market) => total + market.outcomes.filter((outcome) => outcome.isTradable).length,
      0,
    ),
    routeMode: "database-proof",
    eventSlug: event.slug,
    title: event.title,
    marketTypes: Array.from(new Set(sportsbookMarkets.map((market) => market.marketType))),
  };
}

function redactedEvent(event: OddsApiEvent) {
  return {
    id: event.id,
    title: `${event.away_team} vs. ${event.home_team}`,
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    startTime: event.commence_time,
    sportKey: event.sport_key,
    sportTitle: event.sport_title ?? null,
  };
}

async function writeJson(outputPath: string, value: unknown) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeAudit(summary: any) {
  const lines = [
    "# Batch The Odds API Single Event",
    "",
    "## Scope",
    "- Temporary sportsbook odds provider for one soccer event only.",
    "- Uses `THE_ODDS_API_KEY` from the local environment only.",
    "- Does not claim Polymarket-backed parity.",
    "- Does not enable real-money behavior.",
    "",
    "## Selected Event",
    `- Sport key: ${summary.sport.key}`,
    `- Event id: ${summary.event.id}`,
    `- Event title: ${summary.event.title}`,
    `- Start time: ${summary.event.startTime}`,
    "",
    "## API Calls",
    ...summary.apiCalls.map((call: OddsApiCallRecord) =>
      `- ${call.name}: ${call.path} | status ${call.status} | used ${call.quota.requestsUsed ?? "n/a"} | remaining ${call.quota.requestsRemaining ?? "n/a"} | last ${call.quota.requestsLast ?? "n/a"}`
    ),
    "",
    "## Markets",
    `- Available market keys: ${summary.availableMarketKeys.join(", ") || "none"}`,
    `- Imported market keys: ${summary.importedMarketKeys.join(", ") || "none"}`,
    `- Normalized markets: ${summary.normalized.marketCount}`,
    `- Normalized outcomes: ${summary.normalized.outcomeCount}`,
    "",
    "## Mobile/Backend Proof",
    `- Seed slug: ${summary.mobile.eventSlug}`,
    `- Home visible: ${summary.mobile.homeVisible}`,
    `- Detail visible: ${summary.mobile.detailVisible}`,
    `- Sportsbook market count: ${summary.mobile.sportsbookMarketCount}`,
    `- Tradable outcome count: ${summary.mobile.tradableOutcomeCount}`,
    "",
    "## Result",
    `- Pass: ${summary.pass}`,
    "- Remaining blocker: S23 UI order/portfolio proof still needs to run against the seeded event after local services are up.",
    "",
  ];
  await fs.mkdir(path.dirname(AUDIT_PATH), { recursive: true });
  await fs.writeFile(AUDIT_PATH, `${lines.join("\n")}\n`, "utf8");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
