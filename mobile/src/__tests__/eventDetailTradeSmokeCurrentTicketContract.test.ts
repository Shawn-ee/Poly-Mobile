import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const smokeSource = () => readFileSync("mobile/scripts/smoke.ps1", "utf8");

describe("Event Detail trade smoke current ticket contract", () => {
  test("checks the Polymarket-style ticket instead of the removed advanced settings panel", () => {
    const smoke = smokeSource();
    const eventDetailTradeBlock = smoke.slice(smoke.indexOf("if ($EventDetailTrade) {"), smoke.indexOf("Save-Screenshot -Name \"cycle-current-holiwyn-event-detail-away-ticket.png\""));

    expect(eventDetailTradeBlock).toContain("ticket-retail-reference-layout");
    expect(eventDetailTradeBlock).toContain("ticket-header-retail-readable");
    expect(eventDetailTradeBlock).toContain("ticket-market-source-badge-hidden");
    expect(eventDetailTradeBlock).toContain("ticket-header-source-pill-hidden-local-mvp");
    expect(eventDetailTradeBlock).toContain("ticket-preset-25");
    expect(eventDetailTradeBlock).toContain("swipe-submit-gesture-required");
    expect(eventDetailTradeBlock).not.toContain("ticket-settings");
    expect(eventDetailTradeBlock).not.toContain("ticket-advanced-details");
    expect(eventDetailTradeBlock).not.toContain("ticket-preset-10");
  });

  test("checks the second outcome ticket against the current phone ticket layout", () => {
    const smoke = smokeSource();
    const start = smoke.indexOf('Save-Screenshot -Name "cycle-current-holiwyn-event-detail-away-ticket.png"');
    const end = smoke.indexOf('Invoke-TapHierarchyNode -Path $eventDetailHierarchy -Identifier "event-detail-group-prop"', start);
    expect(start).toBeGreaterThan(0);
    expect(end).toBeGreaterThan(start);
    const awayTicketBlock = smoke.slice(start, end);

    expect(awayTicketBlock).toContain("Mexico vs Ecuador");
    expect(awayTicketBlock).toContain("ticket-retail-reference-layout");
    expect(awayTicketBlock).toContain("ticket-header-retail-readable");
    expect(awayTicketBlock).toContain("ticket-market-source-badge-hidden");
    expect(awayTicketBlock).toContain("ticket-header-source-pill-hidden-local-mvp");
    expect(awayTicketBlock).toContain("ticket-preset-25");
    expect(awayTicketBlock).toContain("ticket-swipe-area-fixed-bottom");
    expect(awayTicketBlock).not.toContain("Mexico vs. Ecuador");
    expect(awayTicketBlock).not.toContain('"ticket-preset-5",');
  });
});
