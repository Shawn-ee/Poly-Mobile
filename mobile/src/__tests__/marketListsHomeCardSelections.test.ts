import { describe, expect, test } from "vitest";
import { homeCardSelectionsForEvent } from "../services/homeCardSelectionService";
import type { Event, Market } from "../mocks/worldCup";

const binaryMarket = (id: string, title: string, yesProbability: number): Market => ({
  id,
  marketGroupId: "provider-regulation",
  marketType: "moneyline",
  period: "regulation",
  line: null,
  referenceSource: "polymarket",
  externalSlug: id,
  externalMarketId: `provider-${id}`,
  conditionId: `condition-${id}`,
  title,
  zhTitle: title,
  type: "game-line",
  outcomes: [
    {
      id: `${id}-yes`,
      label: "Yes",
      zhLabel: "Yes",
      probability: yesProbability,
      side: "yes",
      color: "#2563eb",
    },
    {
      id: `${id}-no`,
      label: "No",
      zhLabel: "No",
      probability: 100 - yesProbability,
      side: "no",
      color: "#60a5fa",
    },
  ],
});

const event: Event = {
  id: "switzerland-vs-colombia",
  title: "Switzerland vs. Colombia",
  zhTitle: "Switzerland vs. Colombia",
  league: "World Cup",
  startsAt: "Live",
  status: "live",
  tag: "Live",
  zhTag: "Live",
  teams: [
    { name: "Switzerland", zhName: "Switzerland", flag: "SUI" },
    { name: "Colombia", zhName: "Colombia", flag: "COL" },
  ],
  marketProfile: "regulation_90",
  resultMode: "can_draw",
  gameRules: {
    allowDraw: true,
    includesOvertime: false,
    description: "Regulation 90-minute winner can settle as home, draw, or away.",
  },
  supportedMarketTypes: ["regulation_90"],
  markets: [
    binaryMarket("fifwc-che-col-2026-07-07-draw", "Will Switzerland vs. Colombia end in a draw?", 32),
    binaryMarket("fifwc-che-col-2026-07-07-che", "Will Switzerland win on 2026-07-07?", 27),
    binaryMarket("fifwc-che-col-2026-07-07-col", "Will Colombia win on 2026-07-07?", 43),
  ],
};

describe("homeCardSelectionsForEvent", () => {
  test("composes provider-backed regulation soccer cards from three binary markets", () => {
    const selections = homeCardSelectionsForEvent(event);

    expect(selections.map((selection) => selection.outcome.label)).toEqual([
      "Switzerland",
      "Draw",
      "Colombia",
    ]);
    expect(selections.map((selection) => selection.market.id)).toEqual([
      "fifwc-che-col-2026-07-07-che",
      "fifwc-che-col-2026-07-07-draw",
      "fifwc-che-col-2026-07-07-col",
    ]);
    expect(selections.every((selection) => selection.outcome.id.endsWith("-yes"))).toBe(true);
  });
});
