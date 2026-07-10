import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const searchScreenSource = () => readFileSync("mobile/src/components/SearchScreen.tsx", "utf8");
const appSource = () => readFileSync("mobile/App.tsx", "utf8");

describe("SearchScreen route contract", () => {
  test("does not expose unsupported local sort, filter, category, social, or saved controls", () => {
    const source = searchScreenSource();
    const smoke = readFileSync("mobile/scripts/smoke.ps1", "utf8");

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
    expect(smoke).toContain("forceResetState=1,forceSearch=1");
    expect(smoke).toContain('} elseif ($SearchSort) {');
    expect(smoke).toContain('$env:EXPO_PUBLIC_API_BASE_URL = "http://${ExpoHost}:3002"');
    expect(smoke).toContain('$env:EXPO_PUBLIC_MARKET_DATA_MODE = "server"');
    expect(smoke).toContain('@("Holiwyn", "Search World Cup markets", "Top results", "search-result-")');
    expect(smoke).toContain("Wait-HierarchyContains -Name \"cycle-current-holiwyn-search-sort-screen.xml\"");
    expect(smoke).toContain("-RestartUrl $launchUrl");
    expect(smoke).toContain('"search-result-"');
    expect(smoke).toContain('Invoke-TapHierarchyNode -Path $searchSortScreenHierarchy -Identifier "search-result-" -StartsWith');
    expect(smoke).toContain('"cycle-current-holiwyn-search-open-result.xml"');
  });

  test("keeps route-backed Search rows visible if quote decoration is unavailable", () => {
    const source = appSource();

    expect(source).toContain("const quotesByMarketId = await loadMarketQuotesById(api, event.markets.map((market) => market.id));");
    expect(source).toContain("return applyTicketQuotesToEvent(event, quotesByMarketId);");
    expect(source).toContain("catch {\n          return event;\n        }");
  });
});
