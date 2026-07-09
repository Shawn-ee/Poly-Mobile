import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const tradeTicketSource = () => readFileSync("mobile/src/components/TradeTicket.tsx", "utf8");

describe("Trade Ticket market source badge", () => {
  test("shows provider/local source labels from ticket selection identity", () => {
    const source = tradeTicketSource();

    expect(source).toContain("ticketSourceBadge");
    expect(source).toContain("ticketReferenceSource");
    expect(source).toContain("ticket.selection?.referenceTokenId || ticket.selection?.conditionId || ticket.outcome.referenceTokenId");
    expect(source).toContain("ticket-market-source-badge");
    expect(source).toContain("ticket-market-source-badge-hidden");
    expect(source).toContain("ticket-source-badge-provider");
    expect(source).toContain("ticket-source-badge-local");
    expect(source).toContain("ticket-header-source-pill-hidden-local-mvp");
    expect(source).toContain('label: "Polymarket"');
    expect(source).toContain('label: "Holiwyn"');
    expect(source).not.toContain('label: "Checking"');
    expect(source).toContain("Holiwyn line");
  });
});
