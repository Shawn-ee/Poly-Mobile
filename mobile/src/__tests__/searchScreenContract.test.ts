import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const searchScreenSource = () => readFileSync("mobile/src/components/SearchScreen.tsx", "utf8");

describe("SearchScreen route contract", () => {
  test("does not expose unsupported local sort or category controls", () => {
    const source = searchScreenSource();

    expect(source).not.toContain("search-sort-");
    expect(source).not.toContain("search-category-");
    expect(source).not.toContain("setSort");
    expect(source).not.toContain("categoryChips");
    expect(source).not.toContain("save-event-");
    expect(source).not.toContain("bookmark-outline");
    expect(source).not.toContain("bookmark");
    expect(source).not.toContain("toggleSavedEvent");
    expect(source).not.toContain("savedEventIds");
    expect(source).toContain("search-world-cup-markets");
    expect(source).toContain("search-load-more-results");
  });
});
