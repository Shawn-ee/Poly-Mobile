import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const searchScreenSource = () => readFileSync("mobile/src/components/SearchScreen.tsx", "utf8");

describe("SearchScreen route contract", () => {
  test("does not expose unsupported local sort, filter, category, social, or saved controls", () => {
    const source = searchScreenSource();

    expect(source).not.toContain("search-sort-live");
    expect(source).not.toContain("search-sort-popular");
    expect(source).not.toContain("search-filter-sheet");
    expect(source).not.toContain("search-filter-panel");
    expect(source).not.toContain("search-filter-live");
    expect(source).not.toContain("search-filter-saved");
    expect(source).not.toContain("search-category-");
    expect(source).not.toContain("setSort");
    expect(source).not.toContain("setFilter");
    expect(source).not.toContain("categoryChips");
    expect(source).not.toContain("filterChip");
    expect(source).not.toContain("save-event-");
    expect(source).not.toContain("bookmark-outline");
    expect(source).not.toContain("bookmark");
    expect(source).not.toContain("toggleSavedEvent");
    expect(source).not.toContain("savedEventIds");
    expect(source).not.toContain("Chat {");
    expect(source).toContain("search-world-cup-markets");
    expect(source).toContain("search-load-more-results");
    expect(source).toContain("search-filter-controls-hidden-local-mvp");
    expect(source).toContain("search-sort-controls-hidden-local-mvp");
  });
});
