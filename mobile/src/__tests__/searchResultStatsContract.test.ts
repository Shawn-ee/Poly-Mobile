import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const searchSource = () => readFileSync("mobile/src/components/SearchScreen.tsx", "utf8");

describe("Search result stats contract", () => {
  test("does not expose frontend-invented market stats or chat counts", () => {
    const search = searchSource();

    expect(search).not.toContain("8200 +");
    expect(search).not.toContain("4200 +");
    expect(search).not.toContain("outcomeCount *");
    expect(search).not.toContain("Chat {");
    expect(search).not.toContain("today</Text>");
    expect(search).not.toContain("t.volume");
    expect(search).not.toContain("t.liquidity");
    expect(search).toContain("Starts");
    expect(search).toContain("event.startsAt");
    expect(search).toContain("save-event-");
    expect(search).toContain("search-result-");
  });
});
