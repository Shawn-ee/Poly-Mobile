import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-LJ-mvp-backend-readiness-gate/cycle-LJ-mvp-backend-readiness-gate.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const appSource = readFileSync("mobile/App.tsx", "utf8");
const portfolioSource = readFileSync("mobile/src/components/Portfolio.tsx", "utf8");
const apiSource = readFileSync("mobile/src/api.ts", "utf8");
const readinessReport = readFileSync("docs/mobile/MVP_BACKEND_READINESS_AUDIT_REPORT_2026-07-06.md", "utf8");
const cancelStart = appSource.indexOf("const cancelOpenOrder =");
const cancelEnd = appSource.indexOf("return (", cancelStart);
const cancelBlock = appSource.slice(cancelStart, cancelEnd);

const checks = {
  reportExistsAndRanksBlockers:
    readinessReport.includes("P0 blockers for internal local use: **0 found") &&
    readinessReport.includes("Ready for internal local testing: **Yes, after Cycle LJ**") &&
    readinessReport.includes("P1 readiness blockers before certifying internal-use readiness: **0 remaining after Cycle LJ") &&
    readinessReport.includes("Cycle LJ - MVP Internal Backend Readiness Proof Gate"),
  apiClientCoversVisibleMvpRoutes:
    apiSource.includes("listWorldCupEvents") &&
    apiSource.includes("getEvent(slug") &&
    apiSource.includes("getEventMarkets") &&
    apiSource.includes("getMarketQuote") &&
    apiSource.includes("placeLimitOrder") &&
    apiSource.includes("cancelOrder") &&
    apiSource.includes("getPortfolio()") &&
    apiSource.includes("getPortfolioHistory") &&
    apiSource.includes("getPortfolioValueHistory") &&
    apiSource.includes("getAccountBalance") &&
    apiSource.includes("getProfileSummary") &&
    apiSource.includes("getProfilePreferences"),
  serverHomeDoesNotRenderBundledFallback:
    appSource.includes('if (page.source === "local-fallback")') &&
    !appSource.includes("const filteredFallbackEvents = worldCupEvents.filter((event) => matchesHomeFilter(event, homeFilter))") &&
    !appSource.includes("setEvents(worldCupEvents)") &&
    appSource.includes("if (!append) setEvents([])"),
  portfolioRouteFailureStaysVisible:
    portfolioSource.includes("routeErrorValueHistory") &&
    portfolioSource.includes('source: "portfolio-value-history-route"') &&
    portfolioSource.includes('status: "error"') &&
    !portfolioSource.includes('serverValueHistory?.range === activeRange && serverValueHistory.status !== "error"'),
  serverCancelIsNotOptimistic:
    cancelBlock.includes('if (ORDER_MODE !== "server")') &&
    cancelBlock.includes("cancelOpenOrderOnServer({ mode: ORDER_MODE, api, order })") &&
    cancelBlock.indexOf('if (ORDER_MODE !== "server")') < cancelBlock.indexOf("cancelOpenOrderOnServer") &&
    cancelBlock.lastIndexOf("setOpenOrders((current) => current.filter((item) => item.id !== order.id))") > cancelBlock.indexOf("cancelOpenOrderOnServer"),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `MVP backend readiness gate proof failed: ${name}`);
}

const summary = {
  cycle: "LJ",
  scope: "mvp-backend-readiness-gate",
  generatedAt: new Date().toISOString(),
  pass: true,
  decision:
    "Visible MVP route wiring is inventoried, and the main server-mode readiness risks from the audit are guarded: Home no longer renders bundled events after route fallback, Portfolio value-history route failure remains visible, and server cancel is no longer optimistic.",
  checks,
  evidence: {
    readinessReport: "docs/mobile/MVP_BACKEND_READINESS_AUDIT_REPORT_2026-07-06.md",
    app: "mobile/App.tsx",
    portfolio: "mobile/src/components/Portfolio.tsx",
    api: "mobile/src/api.ts",
    test: "mobile/src/__tests__/mvpBackendReadinessGate.test.ts",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
