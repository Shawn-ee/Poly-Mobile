import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-KQ-trade-ticket-submit-ui-wiring/cycle-KQ-trade-ticket-submit-ui-wiring.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const readCommitted = (path: string) => execSync(`git show HEAD:${path}`, { encoding: "utf8" });

const appSource = readCommitted("mobile/App.tsx");
const ticketSource = readCommitted("mobile/src/components/TradeTicket.tsx");
const orderServiceSource = readFileSync("mobile/src/services/orderService.ts", "utf8");
const apiSource = readFileSync("mobile/src/api.ts", "utf8");

const checks = {
  ticketSubmitControlRequiresPositiveTradableAmount:
    ticketSource.includes("<SwipeSubmitControl") &&
    ticketSource.includes("disabled={numericAmount <= 0 || !marketTradable}") &&
    ticketSource.includes("label={submitLabel}"),
  ticketSubmitControlSupportsSwipeAndPress:
    ticketSource.includes('accessibilityLabel="swipe-to-submit-order"') &&
    ticketSource.includes("onPress={() => void triggerSubmit()}") &&
    ticketSource.includes("if (gesture.dy < -70)") &&
    ticketSource.includes("void triggerSubmit()"),
  visibleTicketCallsPlaceOrder:
    ticketSource.includes("onSubmit={() => placeOrder(numericAmount, side, contractSide)}") &&
    ticketSource.includes('testID="place-mock-order"'),
  appPassesPlaceOrderToVisibleTicket:
    appSource.includes("<TradeTicket") &&
    appSource.includes("placeOrder={placeOrder}") &&
    appSource.includes("tradingMode={ORDER_MODE}") &&
    appSource.includes("ticket={ticket}"),
  appPlaceOrderUsesSubmitTicketOrder:
    appSource.includes("const placeOrder = async") &&
    appSource.includes("result = await submitTicketOrder({") &&
    appSource.includes("mode: ORDER_MODE") &&
    appSource.includes("api,") &&
    appSource.includes("market: ticket.market") &&
    appSource.includes("outcome: ticket.outcome") &&
    appSource.includes("amount: cost"),
  appRefreshesPortfolioAfterServerSubmit:
    appSource.includes('setMainTab("portfolio")') &&
    appSource.includes('if (ORDER_MODE === "server")') &&
    appSource.includes("refreshServerPortfolio().catch(() =>") &&
    appSource.includes('setPortfolioSyncStatus("error")'),
  orderServiceCallsCanonicalOrderRoute:
    orderServiceSource.includes("export const submitTicketOrder") &&
    orderServiceSource.includes('if (input.mode === "mock")') &&
    orderServiceSource.includes("const payload = await input.api.placeLimitOrder(orderInput)") &&
    orderServiceSource.includes("selection: selectionForOrder(input)") &&
    orderServiceSource.includes("contractSide: contractSideForOrder(input).toUpperCase()"),
  apiClientSubmitsLimitOrder:
    apiSource.includes("placeLimitOrder") &&
    apiSource.includes("return this.request(`/api/orders`, {") &&
    apiSource.includes('method: "POST"') &&
    apiSource.includes('"Idempotency-Key": clientOrderId') &&
    apiSource.includes('type: "LIMIT"'),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Trade Ticket submit UI wiring proof failed: ${name}`);
}

const summary = {
  cycle: "KQ",
  scope: "trade-ticket-submit-ui-wiring",
  generatedAt: new Date().toISOString(),
  route: "POST /api/orders",
  pass: true,
  checks,
  evidence: {
    app: "git show HEAD:mobile/App.tsx",
    ticket: "git show HEAD:mobile/src/components/TradeTicket.tsx",
    orderService: "mobile/src/services/orderService.ts",
    api: "mobile/src/api.ts",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
