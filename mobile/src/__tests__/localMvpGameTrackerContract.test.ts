import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

describe("Local MVP game tracker contract", () => {
  test("does not keep the superseded chart/chat/order-book P0 tracker as current truth", () => {
    const tracker = readFileSync("docs/mobile/GAME_PAGE_PARITY_GAP_TRACKER.md", "utf8");

    expect(tracker).toContain("Holiwyn Local MVP Game Page Gap Tracker");
    expect(tracker).toContain("supersedes the older July 2 full Polymarket game-page parity tracker");
    expect(tracker).toContain("Chart is absent from default Event Detail UI");
    expect(tracker).toContain("Order book UI is hidden by default");
    expect(tracker).toContain("Chat, social preview, share/watchlist, and live-stat surfaces are absent");
    expect(tracker).toContain("Real provider-backed line markets are not falsely claimed");
    expect(tracker).not.toContain("Chat page is now a real page state");
    expect(tracker).not.toContain("Top book and share controls are tappable");
    expect(tracker).not.toContain("Chart now renders two independent outcome traces");
    expect(tracker).not.toContain("Social preview card is now proven");
  });

  test("current feature criteria do not require the removed market-page chart", () => {
    const criteria = readFileSync("docs/mobile/POLYMARKET_FEATURE_CRITERIA.md", "utf8");
    const fdCriteria = criteria.slice(
      criteria.indexOf("## Cycle FD Route Discovery To Event Detail Criteria"),
      criteria.indexOf("## Cycle FE Home Route Event Ticket Criteria"),
    );
    const feCriteria = criteria.slice(
      criteria.indexOf("## Cycle FE Home Route Event Ticket Criteria"),
      criteria.indexOf("## Cycle", criteria.indexOf("## Cycle FE Home Route Event Ticket Criteria") + 1),
    );

    expect(fdCriteria).toContain("without the market-page chart");
    expect(fdCriteria).toContain("absence of `event-detail-price-chart`");
    expect(fdCriteria).not.toContain("chart/probability");
    expect(feCriteria).toContain("absence of `event-detail-price-chart`");
    expect(feCriteria).not.toContain("chart/probability");
  });
});
