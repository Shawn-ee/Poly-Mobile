import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_BASE_URL = "http://127.0.0.1:3002";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/cycle-OP-search-provider-breadth/cycle-OP-search-provider-breadth-route.json";

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
  status: event.status,
  source: event.source,
  marketCount: event.marketCount,
  polymarketMarketCount: event.marketSourceSummary?.polymarketMarketCount ?? 0,
  contractFixtureMarketCount: event.marketSourceSummary?.contractFixtureMarketCount ?? 0,
  regulationWinnerStatus: event.marketSourceSummary?.regulationWinner?.status ?? "unknown",
  lineMarketStatus: event.marketSourceSummary?.lineMarkets?.status ?? "unknown",
  lineFamilies: event.marketSourceSummary?.lineMarkets?.families ?? [],
  topMarketTitles: Array.isArray(event.markets)
    ? event.markets.slice(0, 4).map((market: any) => ({
        title: market.title,
        marketType: market.marketType,
        referenceSource: market.referenceSource ?? null,
        outcomeCount: Array.isArray(market.outcomes) ? market.outcomes.length : 0,
      }))
    : [],
});

async function main() {
  const baseUrl = argValue("baseUrl") ?? DEFAULT_BASE_URL;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const searchUrl = `${baseUrl}/api/events?sportKey=soccer&source=polymarket&includeMobileMarkets=1&limit=10`;
  const worldCupUrl = `${baseUrl}/api/events?sportKey=soccer&leagueKey=world_cup&source=polymarket&includeMobileMarkets=1&limit=10`;

  const [searchPayload, worldCupPayload] = await Promise.all([fetchJson(searchUrl), fetchJson(worldCupUrl)]);
  const searchEvents = Array.isArray(searchPayload.events) ? searchPayload.events : [];
  const worldCupEvents = Array.isArray(worldCupPayload.events) ? worldCupPayload.events : [];
  const providerBackedEvents = searchEvents
    .map(summarizeEvent)
    .filter((event) => event.polymarketMarketCount > 0);
  const providerBackedWorldCupEvents = worldCupEvents
    .map(summarizeEvent)
    .filter((event) => event.polymarketMarketCount > 0);
  const matchEvents = providerBackedEvents.filter((event) => event.eventType === "match");
  const nonMatchEvents = providerBackedEvents.filter((event) => event.eventType !== "match");

  const result = {
    generatedAt: new Date().toISOString(),
    cycle: "OP",
    scope: "search-provider-breadth-visible-contract",
    routes: {
      searchProviderBreadth: searchUrl,
      worldCupProviderBreadth: worldCupUrl,
    },
    searchProviderBreadth: {
      eventCount: searchEvents.length,
      providerBackedEventCount: providerBackedEvents.length,
      providerBackedMatchEventCount: matchEvents.length,
      providerBackedNonMatchEventCount: nonMatchEvents.length,
      events: providerBackedEvents,
    },
    worldCupProviderBreadth: {
      eventCount: worldCupEvents.length,
      providerBackedEventCount: providerBackedWorldCupEvents.length,
      events: providerBackedWorldCupEvents,
    },
    mobileVisibilityContract: {
      searchRowsCanShowMultipleProviderBackedEvents: providerBackedEvents.length >= 2,
      sourceSummaryFieldsPresent: providerBackedEvents.every(
        (event) => event.polymarketMarketCount > 0 && event.regulationWinnerStatus !== "unknown",
      ),
      includesMatchAndOutrightWhenAvailable: matchEvents.length >= 1 && nonMatchEvents.length >= 1,
    },
    pass:
      providerBackedEvents.length >= 2 &&
      providerBackedWorldCupEvents.length >= 2 &&
      providerBackedEvents.every((event) => event.polymarketMarketCount > 0) &&
      matchEvents.length >= 1 &&
      nonMatchEvents.length >= 1,
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
