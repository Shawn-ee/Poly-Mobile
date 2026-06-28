import {
  formatSportsMarketLine,
  getLiveSportsMarketGroupKey,
  groupLiveSportsMarkets,
} from "@/lib/liveSportsMarketGroups";

describe("live sports market grouping UI helpers", () => {
  test("uses explicit group keys before market type fallbacks", () => {
    expect(getLiveSportsMarketGroupKey({ title: "Game Winner", marketType: "moneyline" })).toBe("main");
    expect(getLiveSportsMarketGroupKey({ title: "Total Points", marketType: "total" })).toBe("total");
    expect(getLiveSportsMarketGroupKey({ title: "LeBron Points", marketType: "player_prop" })).toBe("player_prop");
    expect(getLiveSportsMarketGroupKey({ title: "In-play Next Score", marketGroupKey: "live", marketType: "special" })).toBe("live");
    expect(getLiveSportsMarketGroupKey({ title: "Total goals 2.5", marketGroupKey: "totals" })).toBe("total");
    expect(getLiveSportsMarketGroupKey({ title: "Team goals 1.5", marketGroupKey: "team-totals" })).toBe("team_prop");
    expect(getLiveSportsMarketGroupKey({ title: "Both teams to score", marketGroupKey: "goals" })).toBe("game_prop");
    expect(getLiveSportsMarketGroupKey({ title: "USA +1.5", marketGroupKey: "spreads" })).toBe("spread");
  });

  test("groups and orders markets for event detail sections", () => {
    const groups = groupLiveSportsMarkets([
      { title: "LeBron Points 26.5", marketGroupKey: "player_prop", displayOrder: 3 },
      { title: "Game Winner", marketGroupKey: "main", displayOrder: 0 },
      { title: "Total Points 221.5", marketType: "total", displayOrder: 2 },
      { title: "Lakers -5.5", marketGroupKey: "spread", displayOrder: 1 },
    ]);

    expect(groups.map((group) => group.label)).toEqual([
      "Main",
      "Spread",
      "Total",
      "Game Props",
      "Team Props",
      "Player Props",
      "Period Props",
      "Specials",
      "Live",
    ]);
    expect(groups.find((group) => group.key === "main")?.markets.map((market) => market.title)).toEqual([
      "Game Winner",
    ]);
    expect(groups.find((group) => group.key === "spread")?.markets.map((market) => market.title)).toEqual([
      "Lakers -5.5",
    ]);
    expect(groups.find((group) => group.key === "player_prop")?.markets.map((market) => market.title)).toEqual([
      "LeBron Points 26.5",
    ]);
  });

  test("formats market metadata without leaking internal resolution fields", () => {
    expect(
      formatSportsMarketLine({
        participantName: "LeBron James",
        propCategory: "points",
        line: "26.5",
        unit: "points",
        period: "full_game",
      }),
    ).toBe("LeBron James / points / 26.5 / points / full game");
  });
});
