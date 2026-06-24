import fs from "fs";
import path from "path";

const orderbookView = fs.readFileSync(
  path.join(process.cwd(), "src", "components", "market", "orderbook", "OrderbookMarketView.tsx"),
  "utf8",
);
const orderTicket = fs.readFileSync(
  path.join(process.cwd(), "src", "components", "market", "orderbook", "OrderTicket.tsx"),
  "utf8",
);

describe("market trade ticket v1 disabled-state contract", () => {
  test("market detail gates ticket submission behind explicit internal trading flag", () => {
    expect(orderbookView).toContain('process.env.NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED === "true"');
    expect(orderbookView).toContain("submissionEnabled={internalTradingEnabled}");
  });

  test("ticket does not submit when submission is disabled", () => {
    expect(orderTicket).toContain("submissionEnabled = false");
    expect(orderTicket).toContain("!submissionEnabled ||");
    expect(orderTicket).toContain("if (!submissionEnabled) return;");
    expect(orderTicket).toContain("Trading disabled");
    expect(orderTicket).toContain("It does not create orders, mutate balances, or write ledger entries.");
  });
});
