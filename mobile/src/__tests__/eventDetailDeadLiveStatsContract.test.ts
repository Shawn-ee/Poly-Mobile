import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const eventDetailSource = () => readFileSync("mobile/src/components/EventDetail.tsx", "utf8");

describe("Event Detail dead live stats contract", () => {
  test("does not carry fake live sports stats or match-flow UI", () => {
    const source = eventDetailSource();

    expect(source).not.toContain("event-detail-live-stats-panel");
    expect(source).not.toContain("event-detail-live-stats-timeline");
    expect(source).not.toContain("liveStatRows");
    expect(source).not.toContain("Possession");
    expect(source).not.toContain("Shots on target");
    expect(source).not.toContain("Expected goals");
    expect(source).not.toContain("Match flow");
    expect(source).not.toContain("USA pressure");
    expect(source).toContain("event-detail-game-lines");
    expect(source).toContain("event-detail-player-props");
    expect(source).toContain("event-detail-live-data-inline");
  });
});
