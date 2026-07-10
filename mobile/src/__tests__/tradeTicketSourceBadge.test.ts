import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const tradeTicketSource = () => readFileSync("mobile/src/components/TradeTicket.tsx", "utf8");

describe("Trade Ticket market source audit marker", () => {
  test("keeps provider/local source identity hidden from the retail header", () => {
    const source = tradeTicketSource();

    expect(source).toContain("ticketSourceBadge");
    expect(source).toContain("ticketReferenceSource");
    expect(source).toContain("ticket.selection?.referenceTokenId || ticket.selection?.conditionId || ticket.outcome.referenceTokenId");
    expect(source).toContain("ticket-market-source-badge-hidden");
    expect(source).toContain("ticket-source-audit-only");
    expect(source).toContain("ticket-source-badge-provider");
    expect(source).toContain("ticket-source-badge-local");
    expect(source).toContain("ticket-header-source-pill-hidden-local-mvp");
    expect(source).toContain("ticket-source-note-audit-only");
    expect(source).toContain('label: "Polymarket"');
    expect(source).toContain('label: "Holiwyn"');
    expect(source).not.toContain('label: "Checking"');
    expect(source).toContain("Holiwyn line");
    expect(source).not.toContain("ticket-market-source-badge-inline-safe");
  });
});
