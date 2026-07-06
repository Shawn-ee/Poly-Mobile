import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  process.argv.find((arg) => arg.startsWith("--output="))?.slice("--output=".length) ??
  "docs/mobile/harness/cycle-KS-event-detail-line-options-ui-wiring/cycle-KS-event-detail-line-options-ui-wiring.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const source = readFileSync("mobile/src/components/EventDetail.tsx", "utf8");

const checks = {
  importsLineOptionService:
    source.includes('} from "../services/marketLineOptionsService";') &&
    source.includes("lineOptionsFor,") &&
    source.includes("periodOptionsFor,") &&
    source.includes("matchingBackendLineMarket,"),
  noStaticSpreadLineRail: !source.includes('const spreadLineOptions = ["0.5", "1.5", "2.5"];'),
  noStaticTotalsLineRail: !source.includes('const totalsLineOptions = ["1.5", "2.5", "3.5"];'),
  noLocalBackendLineMatcher: !source.includes("const matchingBackendLineMarket = (type: string"),
  spreadOptionsFromBackendMarkets:
    source.includes('const spreadPeriodOptions = periodOptionsFor(event.markets, "spread");') &&
    source.includes('const spreadLineOptions = lineOptionsFor(event.markets, "spread", selectedSpreadPeriod);') &&
    source.includes('matchingBackendLineMarket(event.markets, "spread", selectedSpreadLine, selectedSpreadPeriod)'),
  totalsOptionsFromBackendMarkets:
    source.includes('const totalsPeriodOptions = periodOptionsFor(event.markets, "totals");') &&
    source.includes('const totalsLineOptions = lineOptionsFor(event.markets, "totals", selectedTotalsPeriod);') &&
    source.includes('matchingBackendLineMarket(event.markets, "totals", selectedTotalsLine, selectedTotalsPeriod)'),
  visiblePeriodChipsUseBackendAvailability:
    source.includes("{spreadPeriodOptions.map((period)") &&
    source.includes("{(group.periodOptions ?? linePeriods).map((period)") &&
    source.includes("periodOptions: totalsPeriodOptions"),
  spreadBlockRequiresBackendMarket:
    source.includes("{backendSpreadMarket && (") &&
    source.includes("testID=\"event-detail-market-toggle-spread\""),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Event Detail line options UI wiring proof failed: ${name}`);
}

const summary = {
  cycle: "KS",
  scope: "event-detail-line-options-ui-wiring",
  generatedAt: new Date().toISOString(),
  pass: true,
  checks,
  evidence: {
    eventDetail: "mobile/src/components/EventDetail.tsx",
    service: "mobile/src/services/marketLineOptionsService.ts",
    routeData: "/api/mobile/events/:slug/live-detail and /api/events/:slug/markets compact markets[]",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
