import { describe, expect, test } from "vitest";
import type { Market } from "../mocks/worldCup";
import { lineOptionsFor, matchingBackendLineMarket, periodOptionsFor } from "../services/marketLineOptionsService";

const market = (overrides: Partial<Market>): Market => ({
  id: overrides.id ?? "market",
  title: overrides.title ?? "Market",
  zhTitle: overrides.zhTitle ?? overrides.title ?? "Market",
  type: "game-line",
  outcomes: overrides.outcomes ?? [
    { id: "home", label: "Home", zhLabel: "Home", probability: 52, color: "#0a8f61" },
    { id: "away", label: "Away", zhLabel: "Away", probability: 48, color: "#ef4444" },
  ],
  ...overrides,
});

describe("marketLineOptionsService", () => {
  test("does not invent spread period or line options when backend sends one spread market", () => {
    const markets = [
      market({ id: "spread-15", title: "Home vs Away - Spread 1.5", marketType: "spread", period: "full-game", line: "1.5" }),
    ];

    expect(periodOptionsFor(markets, "spread")).toEqual(["Reg. Time"]);
    expect(lineOptionsFor(markets, "spread", "Reg. Time")).toEqual(["1.5"]);
    expect(lineOptionsFor(markets, "spread", "1st Half")).toEqual([]);
    expect(matchingBackendLineMarket(markets, "spread", "0.5", "Reg. Time")).toBeUndefined();
    expect(matchingBackendLineMarket(markets, "spread", "1.5", "1st Half")).toBeUndefined();
  });

  test("returns only backend-backed period and line choices for spread markets", () => {
    const markets = [
      market({ id: "spread-rt-025", marketType: "spread", period: "full-game", line: "0.25" }),
      market({ id: "spread-rt-05", marketType: "spread", period: "full-game", line: "0.5" }),
      market({ id: "spread-rt-075", marketType: "spread", period: "full-game", line: "0.75" }),
      market({ id: "spread-rt-10", marketType: "spread", period: "full-game", line: "1" }),
      market({ id: "spread-rt-15", marketType: "spread", period: "regulation", line: "1.5" }),
      market({ id: "spread-1h-05", marketType: "spread", period: "first-half", line: "0.5" }),
      market({ id: "spread-1h-15", marketType: "spread", period: "first-half", line: "1.5" }),
    ];

    expect(periodOptionsFor(markets, "spread")).toEqual(["Reg. Time", "1st Half"]);
    expect(lineOptionsFor(markets, "spread", "Reg. Time")).toEqual(["1.5"]);
    expect(lineOptionsFor(markets, "spread", "1st Half")).toEqual(["1.5"]);
    expect(lineOptionsFor(markets, "spread", "2nd Half")).toEqual([]);
    expect(matchingBackendLineMarket(markets, "spread", "0.5", "Reg. Time")).toBeUndefined();
    expect(matchingBackendLineMarket(markets, "spread", "0.25", "Reg. Time")).toBeUndefined();
    expect(matchingBackendLineMarket(markets, "spread", "0.75", "Reg. Time")).toBeUndefined();
    expect(matchingBackendLineMarket(markets, "spread", "1", "Reg. Time")).toBeUndefined();
    expect(matchingBackendLineMarket(markets, "spread", "1.5", "Reg. Time")?.id).toBe("spread-rt-15");
  });

  test("prefers signed Holiwyn contract fixtures over raw provider rows for supported spread lines", () => {
    const markets = [
      market({
        id: "provider-spread-15",
        title: "Argentina vs Switzerland - Spread +1.5",
        marketType: "spread",
        period: "regulation",
        line: "1.5",
        referenceSource: "sportsbook-odds",
      }),
      market({
        id: "fixture-spread-pos-15",
        title: "Argentina vs Switzerland: Argentina +1.5",
        marketType: "spread",
        period: "regulation",
        line: "1.5",
        referenceSource: "contract-fixture",
      }),
      market({
        id: "fixture-spread-neg-15",
        title: "Argentina vs Switzerland: Argentina -1.5",
        marketType: "spread",
        period: "regulation",
        line: "-1.5",
        referenceSource: "contract-fixture",
      }),
    ];

    expect(lineOptionsFor(markets, "spread", "Reg. Time")).toEqual(["-1.5", "1.5"]);
    expect(matchingBackendLineMarket(markets, "spread", "1.5", "Reg. Time")?.id).toBe("fixture-spread-pos-15");
    expect(matchingBackendLineMarket(markets, "spread", "-1.5", "Reg. Time")?.id).toBe("fixture-spread-neg-15");
  });

  test("treats provider totals aliases as totals markets", () => {
    const markets = [
      market({ id: "provider-total-05", marketType: "total_goals" as Market["marketType"], period: "full-game", line: "0.5" }),
      market({ id: "provider-total-15", marketType: "total_goals" as Market["marketType"], period: "full-game", line: "1.5" }),
      market({ id: "provider-total-25", marketType: "total_goals" as Market["marketType"], period: "full-game", line: "2.5" }),
      market({ id: "provider-total-35", marketType: "total_goals" as Market["marketType"], period: "full-game", line: "3.5" }),
      market({ id: "provider-total-45", marketType: "total_goals" as Market["marketType"], period: "full-game", line: "4.5" }),
    ];

    expect(periodOptionsFor(markets, "totals")).toEqual(["Reg. Time"]);
    expect(lineOptionsFor(markets, "totals", "Reg. Time")).toEqual(["0.5", "1.5", "2.5", "3.5", "4.5"]);
    expect(matchingBackendLineMarket(markets, "totals", "2.5", "Reg. Time")?.id).toBe("provider-total-25");
  });
});
