import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-KM-event-detail-ui-hydration-wiring/cycle-KM-event-detail-ui-hydration-wiring.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const appSource = readFileSync("mobile/App.tsx", "utf8");
const apiSource = readFileSync("mobile/src/api.ts", "utf8");
const adapterSource = readFileSync("mobile/src/adapters/worldCupAdapter.ts", "utf8");
const eventDetailSource = readFileSync("mobile/src/components/EventDetail.tsx", "utf8");

const checks = {
  appImportsDetailNormalizer: appSource.includes('import { normalizeEventDetail, normalizeEventSummary } from "./src/adapters/worldCupAdapter";'),
  appOpensVisibleDetailWithServerHydration:
    appSource.includes("const openEventDetail = useCallback((event: Event) => {") &&
    appSource.includes("setSelectedEvent(event);") &&
    appSource.includes('if (MARKET_DATA_MODE !== "server") return;') &&
    appSource.includes("api.getEvent(event.id)") &&
    appSource.includes("normalizeEventDetail(detail)") &&
    appSource.includes("setSelectedEvent((current) => current?.id === event.id ? hydrated : current)"),
  appPassesHydratedEventToVisibleScreen:
    appSource.includes("<EventDetail") &&
    appSource.includes("event={selectedEvent}") &&
    appSource.includes("openEvent={openEventDetail}"),
  apiPrefersCompactLiveDetail:
    apiSource.includes("async getEvent(slug: string)") &&
    apiSource.includes("/api/mobile/events/${encodedSlug}/live-detail") &&
    apiSource.includes("return this.request<EventDetail>(`/api/events/${encodedSlug}`);"),
  adapterPreservesBackendRules:
    adapterSource.includes("marketProfile: event.marketProfile") &&
    adapterSource.includes("resultMode: event.resultMode") &&
    adapterSource.includes("gameRules: event.gameRules") &&
    adapterSource.includes("supportedMarketTypes: event.supportedMarketTypes"),
  eventDetailRendersBackendMarkets:
    eventDetailSource.includes("const gameLineMarkets = useMemo(() => event.markets.filter") &&
    eventDetailSource.includes("primaryMarket") &&
    eventDetailSource.includes("event.markets"),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Event Detail UI hydration wiring proof failed: ${name}`);
}

const summary = {
  cycle: "KM",
  scope: "event-detail-ui-hydration-wiring",
  generatedAt: new Date().toISOString(),
  preferredRoute: "/api/mobile/events/:slug/live-detail",
  fallbackRoute: "/api/events/:slug",
  pass: true,
  checks,
  evidence: {
    app: "mobile/App.tsx",
    api: "mobile/src/api.ts",
    adapter: "mobile/src/adapters/worldCupAdapter.ts",
    eventDetail: "mobile/src/components/EventDetail.tsx",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
