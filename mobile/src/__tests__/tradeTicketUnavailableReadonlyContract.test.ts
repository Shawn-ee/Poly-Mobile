import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const tradeTicketSource = () => readFileSync("mobile/src/components/TradeTicket.tsx", "utf8");

describe("Trade Ticket unavailable readonly contract", () => {
  test("turns blocked markets into a visible readonly ticket state", () => {
    const source = tradeTicketSource();

    expect(source).toContain("const ticketReadOnly = !marketTradable");
    expect(source).toContain("ticket-market-status-visible");
    expect(source).toContain("ticket-readonly-market-state");
    expect(source).toContain("ticket-amount-entry-disabled");
    expect(source).toContain("disabled={ticketReadOnly}");
    expect(source).toContain("ticket-side-disabled-readonly");
    expect(source).toContain("ticket-preset-disabled-readonly");
    expect(source).toContain("ticket-keypad-readonly-disabled");
    expect(source).toContain("ticket-keypad-disabled-readonly");
    expect(source).toContain("disabled={numericAmount <= 0 || !marketTradable}");
    expect(source).toContain("unavailable={!marketTradable}");
  });
});
