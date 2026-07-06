import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("inactive Futures surface contract", () => {
  test("does not keep the old Home Futures tab/list/chart surface wired into the app", () => {
    const app = read("mobile/App.tsx");
    const home = read("mobile/src/components/HomeScreen.tsx");
    const marketLists = read("mobile/src/components/MarketLists.tsx");

    expect(existsSync("mobile/src/components/FeaturedFuture.tsx")).toBe(false);
    expect(existsSync("mobile/src/components/WorldCupSegmented.tsx")).toBe(false);
    expect(app).not.toContain("worldCupTab");
    expect(app).not.toContain("setWorldCupTab");
    expect(app).not.toContain("futures={futures}");
    expect(home).not.toContain("WorldCupTab");
    expect(home).not.toContain("futures: Market[]");
    expect(marketLists).not.toContain("FutureList");
    expect(marketLists).not.toContain("futureCardStats");
    expect(marketLists).not.toContain("futureOutcomeVolume");
    expect(marketLists).not.toContain("future-market-chart");
    expect(marketLists).toContain("homeCardMarket(event)");
    expect(marketLists).toContain("event-card-retail-outcome-rail");
  });
});
