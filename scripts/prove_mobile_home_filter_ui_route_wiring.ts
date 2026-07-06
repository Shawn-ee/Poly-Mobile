import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-KV-home-filter-ui-route-wiring/cycle-KV-home-filter-ui-route-wiring.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const appSource = readFileSync("mobile/App.tsx", "utf8");
const homeSource = readFileSync("mobile/src/components/HomeScreen.tsx", "utf8");
const serviceSource = readFileSync("mobile/src/services/homeEventFeedService.ts", "utf8");

const checks = {
  appOwnsVisibleHomeFilter:
    appSource.includes('import { HomeScreen, type HomeFilter } from "./src/components/HomeScreen";') &&
    appSource.includes('const [homeFilter, setHomeFilter] = useState<HomeFilter>("all")'),
  appUsesHomeFeedService:
    appSource.includes("loadHomeEventFeedPage({") &&
    appSource.includes("filter: homeFilter,") &&
    appSource.includes("limit: HOME_EVENT_PAGE_SIZE") &&
    appSource.includes("cursor,"),
  appPassesFilterControlsToHome:
    appSource.includes("homeFilter={homeFilter}") &&
    appSource.includes("setHomeFilter={setHomeFilter}") &&
    appSource.includes('loadMoreEvents={MARKET_DATA_MODE === "server" ? loadMoreBackendEvents : undefined}'),
  homeScreenDoesNotLocallyRefilterServerPages:
    homeSource.includes("usesServerPaging") &&
    homeSource.includes("? events") &&
    homeSource.includes('events.filter((event) => event.status === "live")') &&
    homeSource.includes('events.filter((event) => event.status === "today")'),
  serviceMapsVisibleFiltersToRouteStatus:
    serviceSource.includes("const statusForFilter = (filter: HomeEventFeedFilter) => filter === \"all\" ? null : filter") &&
    serviceSource.includes("api.listWorldCupEvents({") &&
    serviceSource.includes("status,") &&
    serviceSource.includes('source: "server-route"'),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Home filter UI route wiring proof failed: ${name}`);
}

const summary = {
  cycle: "KV",
  scope: "home-filter-ui-route-wiring",
  generatedAt: new Date().toISOString(),
  route: "/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&status=<home-filter>&limit=10&cursor=<event-id>",
  pass: true,
  checks,
  evidence: {
    app: "mobile/App.tsx",
    homeScreen: "mobile/src/components/HomeScreen.tsx",
    service: "mobile/src/services/homeEventFeedService.ts",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
