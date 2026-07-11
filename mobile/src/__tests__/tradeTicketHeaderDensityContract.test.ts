import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const ticketSource = () => readFileSync("mobile/src/components/TradeTicket.tsx", "utf8");

describe("Trade Ticket header density contract", () => {
  test("keeps provider/source labels audit-only in the retail ticket header", () => {
    const ticket = ticketSource();

    expect(ticket).toContain("ticket-source-audit-only");
    expect(ticket).toContain("ticket-market-source-badge-hidden");
    expect(ticket).toContain("ticket-header-source-pill-hidden-local-mvp");
    expect(ticket).toContain("ticket-source-note-audit-only");
    expect(ticket).toContain("ticket-local-test-pricing");
    expect(ticket).not.toContain("ticket-market-source-badge-inline-safe");
    expect(ticket).not.toContain("ticket-header-source-pill-no-clip");
  });

  test("shows the selected outcome in the header and hides the extra buy/sell badge", () => {
    const ticket = ticketSource();

    expect(ticket).toContain("ticket-header-selected-outcome-simple");
    expect(ticket).toContain("ticket-header-actual-outcome-label");
    expect(ticket).toContain("ticket.selection?.referenceOutcomeLabel ?? outcomeLabel");
    expect(ticket).toContain("ticket-order-mode-audit-only");
    expect(ticket).toContain("ticket-order-mode-visible-hidden-local-mvp");
    expect(ticket).not.toContain("ticket-order-mode-visible ticket-order-mode-");
  });
});
