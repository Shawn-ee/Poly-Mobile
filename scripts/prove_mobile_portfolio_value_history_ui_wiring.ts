import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  process.argv.find((arg) => arg.startsWith("--output="))?.slice("--output=".length) ??
  "docs/mobile/harness/cycle-KU-portfolio-value-history-ui-wiring/cycle-KU-portfolio-value-history-ui-wiring.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const appSource = readFileSync("mobile/App.tsx", "utf8");
const portfolioSource = readFileSync("mobile/src/components/Portfolio.tsx", "utf8");
const serviceSource = readFileSync("mobile/src/services/portfolioValueHistoryService.ts", "utf8");
const apiSource = readFileSync("mobile/src/api.ts", "utf8");

const checks = {
  apiHasCanonicalValueHistoryRoute:
    apiSource.includes("getPortfolioValueHistory") &&
    apiSource.includes("new URLSearchParams({ range })") &&
    apiSource.includes("`/api/portfolio/value-history?${params.toString()}`"),
  appImportsValueHistoryService:
    appSource.includes('import { loadPortfolioValueHistory as loadPortfolioValueHistoryRoute } from "./src/services/portfolioValueHistoryService";'),
  appPassesServiceLoaderToPortfolioInServerMode:
    appSource.includes("return loadPortfolioValueHistoryRoute({") &&
    appSource.includes("api,") &&
    appSource.includes("range,") &&
    appSource.includes("cash: balance") &&
    appSource.includes("positionsValue: positions.reduce((total, position) => total + portfolioPositionValue(position), 0)") &&
    appSource.includes("pnl: positions.reduce((total, position) => total + portfolioPositionValue(position) - position.amount, 0)") &&
    appSource.includes("loadValueHistory={ORDER_MODE === \"server\" && runtimeApiKey.length > 0 ? loadPortfolioValueHistory : undefined}"),
  portfolioFetchesActiveRangeThroughProp:
    portfolioSource.includes("loadValueHistory?: (range: PortfolioValueHistoryRange) => Promise<PortfolioValueHistory>") &&
    portfolioSource.includes("loadValueHistory(activeRange)") &&
    portfolioSource.includes("setServerValueHistory(history)"),
  portfolioChartDisplaysRouteSourceAndStatus:
    portfolioSource.includes("displayedValueHistory") &&
    portfolioSource.includes("source={displayedValueHistory.source}") &&
    portfolioSource.includes("status={displayedValueHistory.status}") &&
    portfolioSource.includes("portfolio-chart-source-${source}") &&
    portfolioSource.includes("portfolio-chart-status-${status}"),
  servicePrefersRouteAndFallsBackDeterministically:
    serviceSource.includes("await api.getPortfolioValueHistory(range)") &&
    serviceSource.includes('source: "deterministic-mobile-fallback"') &&
    serviceSource.includes("return deterministicPortfolioValueHistory"),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Portfolio value-history UI wiring proof failed: ${name}`);
}

const summary = {
  cycle: "KU",
  scope: "portfolio-value-history-ui-wiring",
  generatedAt: new Date().toISOString(),
  route: "/api/portfolio/value-history?range=<range>",
  pass: true,
  checks,
  evidence: {
    app: "mobile/App.tsx",
    portfolio: "mobile/src/components/Portfolio.tsx",
    service: "mobile/src/services/portfolioValueHistoryService.ts",
    api: "mobile/src/api.ts",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
