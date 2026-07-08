import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-KJ-search-ui-route-wiring/cycle-KJ-search-ui-route-wiring.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const appSource = readFileSync("mobile/App.tsx", "utf8");
const searchSource = readFileSync("mobile/src/components/SearchScreen.tsx", "utf8");

const checks = {
  appImportsSearchService: appSource.includes('import { loadSearchEventPage } from "./src/services/searchEventService";'),
  appKeepsSearchServerState:
    appSource.includes("const [searchEvents, setSearchEvents]") &&
    appSource.includes("const [searchNextCursor, setSearchNextCursor]") &&
    appSource.includes("const [isLoadingSearchEvents, setIsLoadingSearchEvents]"),
  appUsesBackendSearchService:
    appSource.includes("const loadBackendSearchEvents") &&
    appSource.includes("loadSearchEventPage({") &&
    appSource.includes("query,") &&
    appSource.includes("limit: SEARCH_EVENT_PAGE_SIZE") &&
    appSource.includes("cursor,"),
  appPassesServerResultsToVisibleSearch:
    appSource.includes('events={MARKET_DATA_MODE === "server" ? searchEvents : filteredEvents}') &&
    appSource.includes('canLoadMoreEvents={MARKET_DATA_MODE === "server" ? Boolean(searchNextCursor) : undefined}') &&
    appSource.includes('loadMoreEvents={MARKET_DATA_MODE === "server" ? loadMoreSearchEvents : undefined}'),
  searchScreenExposesCursorPagination:
    searchSource.includes("canLoadMoreEvents?: boolean") &&
    searchSource.includes("loadMoreEvents?: () => void") &&
    searchSource.includes("search-load-more-results") &&
    searchSource.includes("onScroll={handleScroll}"),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Search UI route wiring proof failed: ${name}`);
}

const summary = {
  cycle: "KJ",
  scope: "search-ui-route-wiring",
  generatedAt: new Date().toISOString(),
  route: "/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&search=<query>&limit=10&cursor=<event-id>",
  pass: true,
  checks,
  evidence: {
    app: "mobile/App.tsx",
    searchScreen: "mobile/src/components/SearchScreen.tsx",
    service: "mobile/src/services/searchEventService.ts",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
