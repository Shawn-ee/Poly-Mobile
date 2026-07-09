import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const tradeTicketSource = () => readFileSync("mobile/src/components/TradeTicket.tsx", "utf8");

describe("Trade Ticket mode clarity", () => {
  test("renders a visible Buy/Sell mode badge separate from the Yes/No outcome selector", () => {
    const source = tradeTicketSource();

    expect(source).toContain("ticket-order-mode-visible");
    expect(source).toContain("ticket-order-mode-${side}");
    expect(source).toContain('const modeLabel = side === "sell" ? t.sell : t.buy;');
    expect(source).toContain("modeOutcomeLabel");
    expect(source).toContain("orderModeBadgeSell");
    expect(source).toContain('accessibilityLabel={`ticket-side-${option}`}');
    expect(source).toContain('{option === "buy" ? "Yes" : "No"}');
  });

  test("captures Android swipe gestures on the submit control before children steal touch", () => {
    const source = tradeTicketSource();

    expect(source).toContain("onStartShouldSetPanResponderCapture");
    expect(source).toContain("onMoveShouldSetPanResponderCapture");
    expect(source).toContain("onStartShouldSetResponderCapture");
    expect(source).toContain("onMoveShouldSetResponderCapture");
    expect(source).toContain("swipe-submit-gesture-required");
  });
});
