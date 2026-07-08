import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_BASE_URL = "http://127.0.0.1:3002";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/cycle-OM-provider-breadth-runtime/cycle-OM-provider-breadth-runtime-route.json";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function fetchJson(url: string) {
  const response = await fetch(url);
  const body = await response.json().catch(() => ({}));
  assert(response.ok, `Expected ${url} ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

const summarizeEvent = (event: any) => ({
  slug: event.slug,
  title: event.title,
  eventType: event.eventType,
  source: event.source,
  marketCount: event.marketCount,
  polymarketMarketCount: event.marketSourceSummary?.polymarketMarketCount ?? 0,
  contractFixtureMarketCount: event.marketSourceSummary?.contractFixtureMarketCount ?? 0,
  regulationWinnerStatus: event.marketSourceSummary?.regulationWinner?.status ?? "unknown",
  lineMarketStatus: event.marketSourceSummary?.lineMarkets?.status ?? "unknown",
  lineFamilies: event.marketSourceSummary?.lineMarkets?.families ?? [],
  markets: Array.isArray(event.markets)
    ? event.markets.map((market: any) => ({
        marketId: market.id,
        title: market.title,
        marketType: market.marketType,
        marketGroupKey: market.marketGroupKey,
        referenceSource: market.referenceSource ?? null,
        externalSlug: market.externalSlug ?? null,
        externalMarketId: market.externalMarketId ?? null,
        outcomeCount: Array.isArray(market.outcomes) ? market.outcomes.length : 0,
      }))
    : [],
});

async function main() {
  const baseUrl = argValue("baseUrl") ?? DEFAULT_BASE_URL;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const broadUrl = `${baseUrl}/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10`;
  const mvpUrl = `${baseUrl}/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10`;

  const [broadPayload, mvpPayload] = await Promise.all([fetchJson(broadUrl), fetchJson(mvpUrl)]);
  const broadEvents = Array.isArray(broadPayload.events) ? broadPayload.events : [];
  const mvpEvents = Array.isArray(mvpPayload.events) ? mvpPayload.events : [];
  const providerBackedEvents = broadEvents
    .map(summarizeEvent)
    .filter((event) => event.polymarketMarketCount > 0);
  const providerBackedMatchEvents = providerBackedEvents.filter((event) => event.eventType === "match");
  const providerBackedOutrightEvents = providerBackedEvents.filter((event) => event.eventType !== "match");
  const mvpSummaries = mvpEvents.map(summarizeEvent);

  const detailSummaries = [];
  for (const event of providerBackedEvents.slice(0, 3)) {
    const detailUrl = `${baseUrl}/api/mobile/events/${encodeURIComponent(event.slug)}/live-detail`;
    const detail = await fetchJson(detailUrl);
    const markets = Array.isArray(detail.markets) ? detail.markets : [];
    detailSummaries.push({
      slug: event.slug,
      url: detailUrl,
      status: "ok",
      marketCount: markets.length,
      polymarketMarketCount: markets.filter((market: any) => market.referenceSource === "polymarket").length,
      contractFixtureMarketCount: markets.filter((market: any) => market.referenceSource === "contract-fixture").length,
      providerLifecycleSources: Array.from(
        new Set(markets.map((market: any) => market.providerLifecycle?.source).filter(Boolean)),
      ),
      marketSourceSummary: detail.event?.marketSourceSummary ?? detail.contract?.marketSourceSummary ?? null,
    });
  }

  const result = {
    generatedAt: new Date().toISOString(),
    cycle: "OM",
    scope: "provider-breadth-runtime-loop",
    routes: {
      broadMobileWorldCup: broadUrl,
      localMvpMatchOnly: mvpUrl,
      liveDetail: "/api/mobile/events/:slug/live-detail",
    },
    broadMobileWorldCup: {
      eventCount: broadEvents.length,
      providerBackedEventCount: providerBackedEvents.length,
      providerBackedMatchEventCount: providerBackedMatchEvents.length,
      providerBackedOutrightEventCount: providerBackedOutrightEvents.length,
      events: providerBackedEvents,
    },
    localMvpMatchOnly: {
      eventCount: mvpEvents.length,
      nonMatchCount: mvpSummaries.filter((event) => event.eventType !== "match").length,
      providerBackedMatchEventCount: mvpSummaries.filter(
        (event) => event.eventType === "match" && event.polymarketMarketCount > 0,
      ).length,
      events: mvpSummaries,
    },
    liveDetailChecks: detailSummaries,
    decisions: {
      providerBreadthReadyInBroadRuntime: providerBackedEvents.length >= 2,
      localMvpStillMatchOnly: mvpSummaries.length > 0 && mvpSummaries.every((event) => event.eventType === "match"),
      providerLineMarketsRemainGap: providerBackedMatchEvents.some((event) => event.lineMarketStatus === "contract-fixture"),
      noOpticOddsBlocker: process.env.OPTIC_ODDS_API_KEY ? "configured_optional" : "unconfigured_optional_non_blocking",
    },
    pass:
      providerBackedEvents.length >= 2 &&
      providerBackedMatchEvents.length >= 1 &&
      providerBackedOutrightEvents.length >= 1 &&
      mvpSummaries.length >= 1 &&
      mvpSummaries.every((event) => event.eventType === "match") &&
      detailSummaries.every((detail) => detail.polymarketMarketCount > 0),
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.pass) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
