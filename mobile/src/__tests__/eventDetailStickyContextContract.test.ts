import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const eventDetailSource = () => readFileSync("mobile/src/components/EventDetail.tsx", "utf8");

describe("Event Detail sticky context contract", () => {
  test("shows compact match context before users are deep in market rows", () => {
    const source = eventDetailSource();

    expect(source).toContain("event-detail-sticky-market-shell");
    expect(source).toContain("event-detail-compact-game-header");
    expect(source).toContain("event-detail-header-team-identity-fit");
    expect(source).toContain("Game Lines Player Props");
    expect(source).toContain("contentOffset.y > 180");
    expect(source).not.toContain("contentOffset.y > 360");
  });
});
