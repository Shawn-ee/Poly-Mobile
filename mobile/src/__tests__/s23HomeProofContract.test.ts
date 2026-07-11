import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("S23 Home proof contract", () => {
  test("captures the current Local MVP Home surface and rejects old Home clutter", () => {
    const script = read("mobile/scripts/s23-home-proof.ps1");
    const pkg = read("mobile/package.json");

    expect(script).toContain("cycle-VW-home.png");
    expect(script).toContain("cycle-VW-home.xml");
    expect(script).toContain("home-world-cup-games-focus");
    expect(script).toContain("home-secondary-markets-hidden-local-mvp");
    expect(script).toContain("Matches");
    expect(script).toContain("Search World Cup markets");
    expect(script).toContain("Trending");
    expect(script).toContain("game predictions");
    expect(script).toContain("world-cup-futures-tab");
    expect(script).toContain("home-filter-all");
    expect(script).toContain("header-account-action");
    expect(script).toContain("Stop-Process -Id $expo.Id -Force");

    expect(pkg).toContain("proof:s23:home");
  });
});
