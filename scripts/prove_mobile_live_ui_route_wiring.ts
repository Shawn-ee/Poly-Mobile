import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-KK-live-ui-route-wiring/cycle-KK-live-ui-route-wiring.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const appSource = readFileSync("mobile/App.tsx", "utf8");
const serviceSource = readFileSync("mobile/src/services/homeEventFeedService.ts", "utf8");

const checks = {
  appImportsFeedService: appSource.includes('import { loadHomeEventFeedPage } from "./src/services/homeEventFeedService";'),
  appKeepsLiveServerState:
    appSource.includes("const [liveEvents, setLiveEvents] = useState<Event[]>([])") &&
    appSource.includes("const liveRequestSeq = useRef(0)"),
  appUsesBackendLiveService:
    appSource.includes("const loadBackendLiveEvents") &&
    appSource.includes("loadHomeEventFeedPage({") &&
    appSource.includes('filter: "live"') &&
    appSource.includes("limit: LIVE_EVENT_PAGE_SIZE") &&
    appSource.includes("fallbackEvents: []"),
  appRefreshesVisibleLiveFromBackend:
    appSource.includes("await loadBackendLiveEvents();") &&
    appSource.includes("}, [loadBackendLiveEvents, loadBackendWorldCup]);"),
  appPassesServerResultsToVisibleLive:
    appSource.includes('events={MARKET_DATA_MODE === "server" ? liveEvents : events.filter((event) => event.status === "live")}'),
  serviceUsesEventsStatusRoute:
    serviceSource.includes("api.listWorldCupEvents({") &&
    serviceSource.includes("status,") &&
    serviceSource.includes("cursor,") &&
    serviceSource.includes('source: "server-route"'),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Live UI route wiring proof failed: ${name}`);
}

const summary = {
  cycle: "KK",
  scope: "live-ui-route-wiring",
  generatedAt: new Date().toISOString(),
  route: "/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&status=live&limit=10",
  pass: true,
  checks,
  evidence: {
    app: "mobile/App.tsx",
    service: "mobile/src/services/homeEventFeedService.ts",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
