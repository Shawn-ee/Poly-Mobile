import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const eventDetailSource = () => readFileSync("mobile/src/components/EventDetail.tsx", "utf8");

describe("Event Detail no chat/stats contract", () => {
  test("does not carry chat UI or frontend-invented event stats", () => {
    const source = eventDetailSource();

    expect(source).not.toContain("event-detail-chat");
    expect(source).not.toContain("chatPage");
    expect(source).not.toContain("Message this market");
    expect(source).not.toContain("3 traders typing");
    expect(source).not.toContain("stats.volume");
    expect(source).not.toContain("stats.liquidity");
    expect(source).not.toContain("stats.traders");
    expect(source).not.toContain("event-detail-volume-hidden");
    expect(source).not.toContain("event-detail-stats");
    expect(source).not.toContain("event-detail-share-sheet");
    expect(source).not.toContain("event-detail-share-action");
    expect(source).not.toContain("event-detail-save-notice");
    expect(source).not.toContain("Share this market");
    expect(source).not.toContain("Saved to watchlist");
    expect(source).not.toContain("Removed from watchlist");
    expect(source).not.toContain('name="share-outline"');
    expect(source).not.toContain("18250");
    expect(source).not.toContain("9400");
    expect(source).toContain("event-detail-game-lines");
    expect(source).toContain("event-detail-player-props");
    expect(source).toContain("event-detail-market-summary");
  });
});
