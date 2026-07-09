import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const ticketSource = () => readFileSync("mobile/src/components/TradeTicket.tsx", "utf8");

describe("Trade Ticket header density contract", () => {
  test("keeps source badge out of the long outcome row on phone layouts", () => {
    const ticket = ticketSource();

    expect(ticket).toContain("ticketSourceRow");
    expect(ticket).toContain("ticket-market-source-badge-inline-safe");
    expect(ticket).toContain("ticket-header-source-pill-no-clip");
    expect(ticket).toContain('ticketSourcePill: { minHeight: 22');
    expect(ticket).toContain("maxWidth: 96");
    expect(ticket).toContain("ticketSourceNote: { flex: 1, minWidth: 0");
  });
});
