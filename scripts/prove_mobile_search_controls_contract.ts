import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-KZ-search-controls-route-contract/cycle-KZ-search-controls-route-contract.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const appSource = readFileSync("mobile/App.tsx", "utf8");
const searchSource = readFileSync("mobile/src/components/SearchScreen.tsx", "utf8");
const serviceSource = readFileSync("mobile/src/services/searchEventService.ts", "utf8");

const checks = {
  appUsesBackendSearchService:
    appSource.includes("loadSearchEventPage({") &&
    appSource.includes("query,") &&
    appSource.includes("limit: SEARCH_EVENT_PAGE_SIZE") &&
    appSource.includes("cursor,"),
  appPassesServerSearchResults:
    appSource.includes('events={MARKET_DATA_MODE === "server" ? searchEvents : filteredEvents}') &&
    appSource.includes('loadMoreEvents={MARKET_DATA_MODE === "server" ? loadMoreSearchEvents : undefined}'),
  serviceCallsEventsRouteWithQueryPagination:
    serviceSource.includes("api.listWorldCupEvents({") &&
    serviceSource.includes("search: trimmedQuery") &&
    serviceSource.includes("limit: safeLimit") &&
    serviceSource.includes("cursor,"),
  searchKeepsQueryAndLoadMoreControls:
    searchSource.includes("search-world-cup-markets") &&
    searchSource.includes("clear-search") &&
    searchSource.includes("search-load-more-results") &&
    searchSource.includes("onScroll={handleScroll}"),
  searchDoesNotExposeUnsupportedLocalControls:
    !searchSource.includes("search-sort-") &&
    !searchSource.includes("search-category-") &&
    !searchSource.includes("setSort") &&
    !searchSource.includes("categoryChips"),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Search controls route-contract proof failed: ${name}`);
}

const summary = {
  cycle: "KZ",
  scope: "search-controls-route-contract",
  generatedAt: new Date().toISOString(),
  pass: true,
  route: "/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&search=<query>&limit=10&cursor=<event-id>",
  checks,
  evidence: {
    app: "mobile/App.tsx",
    screen: "mobile/src/components/SearchScreen.tsx",
    service: "mobile/src/services/searchEventService.ts",
    test: "mobile/src/__tests__/searchScreenContract.test.ts",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
