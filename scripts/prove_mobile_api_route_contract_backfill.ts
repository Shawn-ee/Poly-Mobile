import fs from "node:fs/promises";
import path from "node:path";
import { PolyApi } from "../mobile/src/api";

const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/cycle-JV-mobile-api-route-contract-backfill/cycle-JV-mobile-api-route-contract-backfill.json";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function main() {
  const requests: Array<{ url: string; authorization: string | null }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    requests.push({ url, authorization: headers.get("Authorization") });

    if (url.includes("/api/events?")) {
      return Response.json({
        events: [
          {
            id: "event-jv-1",
            slug: "event-jv-1",
            title: "JV Route Contract",
            description: null,
            category: "Sports / Soccer",
            sportKey: "soccer",
            leagueKey: "world_cup",
            homeTeamName: "Home",
            awayTeamName: "Away",
            startTime: null,
            status: "upcoming",
            liveStatus: null,
            period: null,
            clock: null,
            homeScore: null,
            awayScore: null,
            marketCount: 1,
            activeMarketCount: 1,
            marketProfile: "regulation_90",
            resultMode: "can_draw",
            gameRules: { allowDraw: true, includesOvertime: false, description: "90-minute regulation result." },
            supportedMarketTypes: ["regulation_90", "spread"],
            topOutcomes: ["Home", "Tie", "Away"],
            markets: [],
          },
        ],
        nextCursor: "cursor-jv-2",
        page: { limit: 5, nextCursor: "cursor-jv-2", hasMore: true },
      });
    }

    if (url.includes("/api/portfolio/value-history?")) {
      return Response.json({
        range: "1W",
        ranges: ["1D", "1W", "1M", "All"],
        source: "portfolio-value-history-route",
        status: "ready",
        generatedAt: "2026-07-06T12:00:00.000Z",
        lastUpdated: "2026-07-06T12:00:00.000Z",
        emptyState: null,
        points: [
          {
            timestamp: "2026-07-06T12:00:00.000Z",
            value: 140.86,
            cash: 40.8,
            positionsValue: 100.06,
            pnl: 37.9,
          },
        ],
      });
    }

    return Response.json({ error: "Unexpected route" }, { status: 500 });
  }) as typeof fetch;

  try {
    const api = new PolyApi("https://api.example.test", "test-api-key");
    const eventPage = await api.listWorldCupEvents({ search: "Home", limit: 5, cursor: "cursor-jv-1" });
    const valueHistory = await api.getPortfolioValueHistory("1W");

    const eventsRequest = requests.find((request) => request.url.includes("/api/events?"));
    const historyRequest = requests.find((request) => request.url.includes("/api/portfolio/value-history?"));
    assert(eventsRequest, "Expected listWorldCupEvents to request /api/events.");
    assert(historyRequest, "Expected getPortfolioValueHistory to request /api/portfolio/value-history.");
    assert(eventsRequest.url.includes("limit=5"), "Expected event request to include limit.");
    assert(eventsRequest.url.includes("cursor=cursor-jv-1"), "Expected event request to include cursor.");
    assert(eventsRequest.url.includes("includeMobileMarkets=1"), "Expected event request to opt into compact mobile markets.");
    assert(eventPage.page?.hasMore === true, "Expected event page metadata to preserve hasMore.");
    assert(eventPage.events[0]?.marketProfile === "regulation_90", "Expected mobile EventSummary to preserve marketProfile.");
    assert(valueHistory.source === "portfolio-value-history-route", "Expected portfolio value history route source.");
    assert(valueHistory.points[0]?.value === 140.86, "Expected value-history points to survive API decoding.");
    assert(requests.every((request) => request.authorization === "Bearer test-api-key"), "Expected API-key auth header on requests.");

    const summary = {
      pass: true,
      createdAt: new Date().toISOString(),
      scope: "mobile API route contract backfill",
      routes: {
        events: eventsRequest.url,
        portfolioValueHistory: historyRequest.url,
      },
      eventPage: {
        count: eventPage.events.length,
        nextCursor: eventPage.nextCursor,
        hasMore: eventPage.page?.hasMore,
        marketProfile: eventPage.events[0]?.marketProfile,
        supportedMarketTypes: eventPage.events[0]?.supportedMarketTypes,
      },
      portfolioValueHistory: {
        source: valueHistory.source,
        range: valueHistory.range,
        pointCount: valueHistory.points.length,
      },
    };

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    globalThis.fetch = originalFetch;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
