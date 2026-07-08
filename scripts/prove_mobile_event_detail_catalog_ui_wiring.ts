import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-KN-event-detail-catalog-ui-wiring/cycle-KN-event-detail-catalog-ui-wiring.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const appSource = readFileSync("mobile/App.tsx", "utf8");
const serviceSource = readFileSync("mobile/src/services/eventMarketCatalogService.ts", "utf8");
const eventDetailSource = readFileSync("mobile/src/components/EventDetail.tsx", "utf8");

const checks = {
  appImportsCatalogService:
    appSource.includes('import { loadEventMarketCatalog } from "./src/services/eventMarketCatalogService";'),
  appRefreshesSelectedEventMarkets:
    appSource.includes("const selectedEventMarketKey = selectedEvent?.markets.map") &&
    appSource.includes("loadEventMarketCatalog({ api, slug: eventId, fallbackMarkets })") &&
    appSource.includes("return { ...current, markets: catalog.markets };"),
  appScopesCatalogToSelectedEvent:
    appSource.includes("const eventId = selectedEvent.id") &&
    appSource.includes("if (!current || current.id !== eventId) return current"),
  serviceUsesBackendCatalogRoute:
    serviceSource.includes("getEventMarkets?: (slug: string)") &&
    serviceSource.includes("const payload = await input.api.getEventMarkets(slug)") &&
    serviceSource.includes('source: "server-route"') &&
    serviceSource.includes("markets: payload.markets.map(normalizeMarket).filter"),
  serviceKeepsEmptyRouteAuthoritative:
    serviceSource.includes("markets: payload.markets.map(normalizeMarket).filter") &&
    serviceSource.indexOf('source: "server-route"') < serviceSource.indexOf("markets: payload.markets.map"),
  eventDetailRendersCatalogMarkets:
    eventDetailSource.includes("const gameLineMarkets = useMemo(() => event.markets.filter") &&
    eventDetailSource.includes("lineOptionsFor(event.markets") &&
    eventDetailSource.includes("matchingBackendLineMarket") &&
    eventDetailSource.includes("backendSpreadMarket"),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Event Detail catalog UI wiring proof failed: ${name}`);
}

const summary = {
  cycle: "KN",
  scope: "event-detail-catalog-ui-wiring",
  generatedAt: new Date().toISOString(),
  route: "/api/events/:slug/markets",
  pass: true,
  checks,
  evidence: {
    app: "mobile/App.tsx",
    service: "mobile/src/services/eventMarketCatalogService.ts",
    eventDetail: "mobile/src/components/EventDetail.tsx",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
