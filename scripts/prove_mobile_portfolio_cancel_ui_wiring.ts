import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-KR-portfolio-cancel-ui-wiring/cycle-KR-portfolio-cancel-ui-wiring.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const readCommitted = (path: string) => execSync(`git show HEAD:${path}`, { encoding: "utf8" });

const appSource = readCommitted("mobile/App.tsx");
const portfolioSource = readCommitted("mobile/src/components/Portfolio.tsx");
const cancelServiceSource = readFileSync("mobile/src/services/openOrderService.ts", "utf8");
const apiSource = readFileSync("mobile/src/api.ts", "utf8");

const checks = {
  portfolioRendersVisibleCancelButton:
    portfolioSource.includes("openOrders.slice(0, 5).map") &&
    portfolioSource.includes('accessibilityLabel={`cancel-open-order-${order.id}`}') &&
    portfolioSource.includes('testID={`cancel-open-order-${order.id}`}') &&
    portfolioSource.includes("onPress={() => cancelOpenOrder(order)}"),
  appPassesCancelHandlerToPortfolio:
    appSource.includes("<Portfolio") &&
    appSource.includes("openOrders={openOrders}") &&
    appSource.includes("cancelOpenOrder={cancelOpenOrder}"),
  appCancelHandlerCallsServerService:
    appSource.includes("const cancelOpenOrder = (order: OpenOrder)") &&
    appSource.includes("cancelOpenOrderOnServer({ mode: ORDER_MODE, api, order })") &&
    appSource.includes("const canceledActivity = openOrderCanceledActivity(order, t.justNow)") &&
    appSource.includes("setOpenOrders((current) => current.filter((item) => item.id !== order.id))"),
  appRefreshesBackendPortfolioAfterServerCancel:
    appSource.includes('if (ORDER_MODE === "server")') &&
    appSource.includes("return refreshServerPortfolio().then(() =>") &&
    appSource.includes('setPortfolioSyncStatus("error")'),
  cancelServiceUsesApiCancelRouteInServerMode:
    cancelServiceSource.includes('if (mode !== "server")') &&
    cancelServiceSource.includes("await api.cancelOrder(order.id)") &&
    cancelServiceSource.includes('action: "canceled"'),
  apiClientDeletesCanonicalOrderRoute:
    apiSource.includes("cancelOrder(orderId: string)") &&
    apiSource.includes("this.request(`/api/orders/${encodeURIComponent(orderId)}`, {") &&
    apiSource.includes('method: "DELETE"'),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Portfolio cancel UI wiring proof failed: ${name}`);
}

const summary = {
  cycle: "KR",
  scope: "portfolio-cancel-ui-wiring",
  generatedAt: new Date().toISOString(),
  route: "DELETE /api/orders/:id",
  pass: true,
  checks,
  evidence: {
    app: "git show HEAD:mobile/App.tsx",
    portfolio: "git show HEAD:mobile/src/components/Portfolio.tsx",
    cancelService: "mobile/src/services/openOrderService.ts",
    api: "mobile/src/api.ts",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
