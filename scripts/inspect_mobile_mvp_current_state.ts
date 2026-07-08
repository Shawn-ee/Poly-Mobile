import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_BASE_URL = "http://127.0.0.1:3002";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/cycle-LU-current-state-inspection/cycle-LU-current-state-inspection.json";

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

function marketSummary(markets: any[]) {
  return markets.map((market) => ({
    marketGroupTitle: market.marketGroupTitle,
    marketType: market.marketType,
    line: market.line ?? null,
    period: market.period ?? null,
    referenceSource: market.referenceSource ?? null,
    externalSlug: market.externalSlug ?? null,
    outcomeCount: Array.isArray(market.outcomes) ? market.outcomes.length : 0,
  }));
}

async function main() {
  const baseUrl = argValue("baseUrl") ?? DEFAULT_BASE_URL;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const cycle = argValue("cycle") ?? "current";
  const homeUrl = `${baseUrl}/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10`;
  const home = await fetchJson(homeUrl);
  const events = Array.isArray(home.events) ? home.events : [];
  const matchEvents = events.filter((event: any) => event.eventType === "match");
  const futures = events.filter((event: any) => event.eventType !== "match");
  const selectedEvent = events.find((event: any) =>
    event.marketSourceSummary?.regulationWinner?.status === "provider-backed" &&
    event.marketSourceSummary?.lineMarkets?.status === "contract-fixture"
  );

  assert(events.length > 0, "Home route returned no World Cup events.");
  assert(futures.length === 0, "Mobile MVP route returned futures/outrights even though mobileMvpMatches=1 was requested.");
  assert(selectedEvent, "No Home event exposes provider-backed winner plus contract-fixture line markets.");

  const detailUrl = `${baseUrl}/api/mobile/events/${encodeURIComponent(selectedEvent.slug)}/live-detail`;
  const detail = await fetchJson(detailUrl);
  const markets = Array.isArray(detail.markets) ? detail.markets : [];
  const providerWinnerMarkets = markets.filter((market: any) =>
    market.referenceSource === "polymarket" && market.marketType === "match_winner_1x2"
  );
  const providerLineMarkets = markets.filter((market: any) =>
    market.referenceSource === "polymarket" &&
    ["spread", "total_goals", "team_total_goals", "totals", "team-total"].includes(market.marketType)
  );
  const fixtureLineMarkets = markets.filter((market: any) =>
    market.referenceSource === "contract-fixture" &&
    ["spread", "total_goals", "team_total_goals", "totals", "team-total"].includes(market.marketType)
  );

  const result = {
    cycle,
    result: "inspection-pass",
    inspectedAt: new Date().toISOString(),
    baseUrl,
    homeRoute: {
      url: homeUrl,
      eventCount: events.length,
      matchEventCount: matchEvents.length,
      futuresCount: futures.length,
      events: events.map((event: any) => ({
        slug: event.slug,
        title: event.title,
        eventType: event.eventType,
        liveStatus: event.liveStatus,
        marketCount: event.marketCount,
        regulationWinnerStatus: event.marketSourceSummary?.regulationWinner?.status ?? "unknown",
        lineMarketStatus: event.marketSourceSummary?.lineMarkets?.status ?? "unknown",
        lineFamilies: event.marketSourceSummary?.lineMarkets?.families ?? [],
      })),
    },
    selectedMvpEvent: {
      slug: selectedEvent.slug,
      title: selectedEvent.title,
      marketSourceSummary: selectedEvent.marketSourceSummary,
    },
    detailRoute: {
      url: detailUrl,
      marketSourceSummary: detail.event?.marketSourceSummary,
      providerWinnerMarketCount: providerWinnerMarkets.length,
      providerLineMarketCount: providerLineMarkets.length,
      fixtureLineMarketCount: fixtureLineMarkets.length,
      markets: marketSummary(markets),
    },
    diagnosis: {
      serviceReadiness: {
        localMvpPathReady: providerWinnerMarkets.length > 0 && fixtureLineMarkets.length > 0,
        realProviderBackedRegulationWinnerReady: providerWinnerMarkets.length > 0,
        realProviderBackedLineMarketsReady: providerLineMarkets.length > 0,
        contractFixtureLineMarketsReady: fixtureLineMarkets.length > 0,
      },
      regulationWinner: providerWinnerMarkets.length > 0
        ? "Provider-backed Regulation Winner is available from Polymarket Gamma/CLOB-derived data."
        : "Provider-backed Regulation Winner is missing.",
      lineMarkets: providerLineMarkets.length > 0
        ? "Provider-backed line markets are available."
        : "No provider-backed spread/totals/team-total markets are attached for the selected Polymarket event; Local MVP line markets are contract-shaped backend fixtures.",
      nextPath: [
        "Do not block Local MVP on Optic Odds.",
        "Use the provider-backed Regulation Winner for real Polymarket parity.",
        "Keep Spread/Totals/Team Total as explicit contract-fixture line markets until Polymarket exposes attach-ready line rows or another approved provider is configured.",
        "Next visible cycle should prove the S23 Home -> Event Detail -> line ticket -> server order -> Portfolio/history path against current route data, not stale FI disposable event names.",
      ],
    },
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
