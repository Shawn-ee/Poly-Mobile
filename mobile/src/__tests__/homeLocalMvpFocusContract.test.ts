import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("Home Local MVP focus contract", () => {
  test("keeps Home focused on World Cup matches and Live stats without visible filter controls", () => {
    const app = read("mobile/App.tsx");
    const home = read("mobile/src/components/HomeScreen.tsx");

    expect(app).not.toContain("type HomeFilter");
    expect(app).not.toContain("homeFilter={");
    expect(app).not.toContain("setHomeFilter={");
    expect(app).toContain('filter: "all"');

    expect(home).toContain("home-world-cup-games-focus");
    expect(home).toContain("World Cup");
    expect(home).toContain("Matches");
    expect(home).toContain("live");
    expect(home).toContain("home-filter-controls-hidden-local-mvp");
    expect(home).not.toContain("home-filter-all");
    expect(home).not.toContain("home-filter-live");
    expect(home).not.toContain("home-filter-today");
    expect(home).not.toContain("filterChip");
    expect(home).not.toContain("filterRow");
  });

  test("preserves 10-at-a-time progressive match loading", () => {
    const home = read("mobile/src/components/HomeScreen.tsx");
    const app = read("mobile/App.tsx");

    expect(app).toContain("const HOME_EVENT_PAGE_SIZE = 10");
    expect(home).toContain("initialHomeMatchCount");
    expect(home).toContain("nextHomeMatchCount");
    expect(home).toContain("visible-${pagedEvents.length}-of-${visibleEvents.length}");
    expect(home).toContain("home-load-more-matches");
    expect(home).toContain("Load 10 more");
    expect(home).toContain("distanceFromBottom < 160");
  });
});
