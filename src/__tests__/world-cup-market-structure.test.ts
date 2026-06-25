import fs from "fs";
import path from "path";

import {
  buildWorldCupMarketSections,
  estimateWorldCupTicket,
  findWorldCupOutcomeSelection,
  getSelectedWorldCupLine,
  type WorldCupMarketLike,
} from "@/lib/worldCupMarketStructure";

const market = (overrides: Partial<WorldCupMarketLike>): WorldCupMarketLike => ({
  id: overrides.id ?? "market",
  title: overrides.title ?? "Ecuador vs Germany: Total goals 2.5",
  status: overrides.status ?? "LIVE",
  marketGroupKey: overrides.marketGroupKey ?? "totals",
  marketGroupTitle: overrides.marketGroupTitle ?? "Totals",
  displayOrder: overrides.displayOrder ?? 1,
  line: overrides.line ?? "2.5",
  unit: overrides.unit ?? "goals",
  participantName: overrides.participantName ?? null,
  propCategory: overrides.propCategory ?? "goals",
  marketType: overrides.marketType ?? "total_goals",
  pricesByOutcome: overrides.pricesByOutcome ?? {},
  outcomes: overrides.outcomes ?? [
    { id: `${overrides.id ?? "market"}-over`, name: "Over 2.5", label: "Over 2.5", side: "over", code: "OVER_2_5", displayOrder: 0, price: 0.61 },
    { id: `${overrides.id ?? "market"}-under`, name: "Under 2.5", label: "Under 2.5", side: "under", code: "UNDER_2_5", displayOrder: 1, price: 0.4 },
  ],
});

describe("world cup market structure", () => {
  test("groups match, spread, total, and game props into product sections", () => {
    const sections = buildWorldCupMarketSections([
      market({ id: "moneyline", marketGroupKey: "main", marketType: "match_winner_1x2", line: null }),
      market({ id: "spread-home", marketGroupKey: "spreads", marketType: "spread", participantName: "ECU", line: "1.5" }),
      market({ id: "total", marketGroupKey: "totals", marketType: "total_goals", line: "2.5" }),
      market({ id: "btts", marketGroupKey: "goals", marketType: "both_teams_to_score", line: null }),
    ]);

    expect(sections.find((section) => section.key === "match")?.marketCount).toBe(3);
    expect(sections.find((section) => section.key === "goals")?.marketCount).toBe(1);
  });

  test("pairs spread markets by absolute line for one line selector", () => {
    const sections = buildWorldCupMarketSections([
      market({
        id: "ecu-plus-1-5",
        marketGroupKey: "spreads",
        marketType: "spread",
        participantName: "ECU",
        displayOrder: 1,
        line: "1.5",
        outcomes: [{ id: "ecu-cover", name: "Yes", side: "yes", code: "YES", displayOrder: 0, price: 0.64 }],
      }),
      market({
        id: "ger-minus-1-5",
        marketGroupKey: "spreads",
        marketType: "spread",
        participantName: "GER",
        displayOrder: 2,
        line: "-1.5",
        outcomes: [{ id: "ger-cover", name: "Yes", side: "yes", code: "YES", displayOrder: 0, price: 0.37 }],
      }),
    ]);

    const spread = sections.find((section) => section.key === "match")?.bundles.find((bundle) => bundle.key === "spread");
    expect(spread?.lineSelectable).toBe(false);
    expect(spread?.lines).toHaveLength(1);
    expect(spread?.lines[0].label).toBe("1.5");
    expect(spread?.lines[0].selections.map((selection) => selection.label)).toEqual(["ECU +1.5", "GER -1.5"]);
  });

  test("selects total line and finds selected outcome for ticket", () => {
    const sections = buildWorldCupMarketSections([
      market({ id: "total-1-5", line: "1.5", displayOrder: 1 }),
      market({ id: "total-2-5", line: "2.5", displayOrder: 2 }),
      market({ id: "total-3-5", line: "3.5", displayOrder: 3 }),
    ]);

    const total = sections.find((section) => section.key === "match")?.bundles.find((bundle) => bundle.key === "total");
    expect(total?.lineSelectable).toBe(true);

    const selectedLine = getSelectedWorldCupLine(total!, total?.lines.find((line) => line.line === "3.5")?.key);
    expect(selectedLine?.line).toBe("3.5");

    const selected = findWorldCupOutcomeSelection(sections, selectedLine?.selections[0].outcome.id ?? null);
    expect(selected?.bundle.key).toBe("total");
    expect(selected?.line.line).toBe("3.5");
  });

  test("ticket estimate recalculates from amount and selected price", () => {
    expect(estimateWorldCupTicket({ amount: 10, price: 0.5 })).toEqual({
      cost: 10,
      shares: 20,
      potentialPayout: 20,
      potentialProfit: 10,
    });
  });

  test("event page keeps order submission display gated", () => {
    const pageSource = fs.readFileSync(path.join(process.cwd(), "src", "app", "events", "[slug]", "page.tsx"), "utf8");
    expect(pageSource).toContain('process.env.NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED === "true"');
    expect(pageSource).toContain("Event-page ticket is preview-only");
    expect(pageSource).not.toContain("fetch(`/api/orders`");
  });
});
