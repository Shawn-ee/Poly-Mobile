import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const tradeTicketSource = () => readFileSync("mobile/src/components/TradeTicket.tsx", "utf8");

describe("Trade Ticket market source audit marker", () => {
  test("keeps provider/local source identity hidden from the retail header with clean Chinese copy", () => {
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
    expect(source).toContain("\\u5229\\u4e91\\u4f53\\u80b2\\u76d8\\u53e3");
    expect(source).toContain("Polymarket \\u5e02\\u573a");
    expect(source).not.toMatch(/[\u00c3\u00c2]|\u00e5\u02c6\u00a9|\u00e7\u203a\u02dc|\u00e5\u00b8\u201a|\u00e5\u0153\u00ba/);
    expect(source).not.toContain("ticket-market-source-badge-inline-safe");
  });
});
