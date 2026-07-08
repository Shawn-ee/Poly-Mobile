import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-KP-portfolio-sync-ui-wiring/cycle-KP-portfolio-sync-ui-wiring.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const readCommitted = (path: string) => execSync(`git show HEAD:${path}`, { encoding: "utf8" });

const appSource = readCommitted("mobile/App.tsx");
const syncServiceSource = readFileSync("mobile/src/services/portfolioSyncService.ts", "utf8");
const applyServiceSource = readFileSync("mobile/src/services/portfolioStateApplyService.ts", "utf8");
const portfolioSource = readCommitted("mobile/src/components/Portfolio.tsx");

const checks = {
  appImportsPortfolioSyncServices:
    appSource.includes('import { applyServerPortfolioState } from "./src/services/portfolioStateApplyService";') &&
    appSource.includes('import { loadServerPortfolioState } from "./src/services/portfolioSyncService";'),
  appLoadsPortfolioInServerMode:
    appSource.includes('if (ORDER_MODE !== "server" || runtimeApiKey.length === 0) return undefined;') &&
    appSource.includes("loadServerPortfolioState(api).then((serverState)") &&
    appSource.includes("if (!cancelled && mounted.current) applyServerState(serverState)") &&
    appSource.includes('setPortfolioSyncStatus("error")'),
  appAppliesSnapshotAndHistoryToVisibleState:
    appSource.includes("const applyServerState = useCallback") &&
    appSource.includes("setPortfolioSyncStatus(serverState.syncStatus)") &&
    appSource.includes("setBalance((current) =>") &&
    appSource.includes("setPositions((current) =>") &&
    appSource.includes("setOpenOrders((current) =>") &&
    appSource.includes("setActivities((current) =>") &&
    appSource.match(/applyServerPortfolioState/g)?.length >= 4,
  appRefreshesAfterServerOrderSubmit:
    appSource.includes('setMainTab("portfolio")') &&
    appSource.includes("if (ORDER_MODE === \"server\")") &&
    appSource.includes("refreshServerPortfolio().catch(() =>") &&
    appSource.includes("setPortfolioSyncStatus(\"error\")"),
  appRefreshesAfterCancelAndClose:
    appSource.includes("cancelOpenOrderOnServer({ mode: ORDER_MODE, api, order })") &&
    appSource.includes("return refreshServerPortfolio().then(() =>") &&
    appSource.includes("await closePositionOnServer({ mode: ORDER_MODE, api, position })") &&
    appSource.includes("await refreshServerPortfolio().catch(() =>"),
  appPassesServerBackedStateToPortfolio:
    appSource.includes("<Portfolio") &&
    appSource.includes("balance={balance}") &&
    appSource.includes("positions={positions}") &&
    appSource.includes("openOrders={openOrders}") &&
    appSource.includes("activities={activities}") &&
    appSource.includes("syncStatus={portfolioSyncStatus}") &&
    appSource.includes("cancelOpenOrder={cancelOpenOrder}"),
  syncServiceReadsSnapshotAndHistoryRoutes:
    syncServiceSource.includes("loadPortfolioSnapshot(api)") &&
    syncServiceSource.includes("loadPortfolioHistoryActivities(api)") &&
    syncServiceSource.includes("Promise.allSettled") &&
    syncServiceSource.includes('syncStatus: snapshot || activities ? "synced" : "error"'),
  applyServicePreservesPartialRouteSuccess:
    applyServiceSource.includes("balance: serverState.snapshot ? serverState.snapshot.balance : current.balance") &&
    applyServiceSource.includes("positions: serverState.snapshot ? serverState.snapshot.positions : current.positions") &&
    applyServiceSource.includes("openOrders: serverState.snapshot ? serverState.snapshot.openOrders : current.openOrders") &&
    applyServiceSource.includes("activities: serverState.activities ? serverState.activities : current.activities"),
  portfolioRendersSyncedRouteState:
    portfolioSource.includes("syncStatus") &&
    portfolioSource.includes('accessibilityLabel="portfolio-sync-status"') &&
    portfolioSource.includes("positions.map") &&
    portfolioSource.includes("openOrders.slice(0, 5).map") &&
    portfolioSource.includes("activities.slice(0, 5).map"),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Portfolio sync UI wiring proof failed: ${name}`);
}

const summary = {
  cycle: "KP",
  scope: "portfolio-sync-ui-wiring",
  generatedAt: new Date().toISOString(),
  routes: ["/api/portfolio", "/api/portfolio/history"],
  pass: true,
  checks,
  evidence: {
    app: "git show HEAD:mobile/App.tsx",
    portfolio: "git show HEAD:mobile/src/components/Portfolio.tsx",
    syncService: "mobile/src/services/portfolioSyncService.ts",
    applyService: "mobile/src/services/portfolioStateApplyService.ts",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
