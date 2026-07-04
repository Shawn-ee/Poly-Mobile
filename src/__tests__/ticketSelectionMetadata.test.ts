import { buildTicketSelectionMetadata } from "@/server/services/ticketSelectionMetadata";

describe("ticket selection metadata", () => {
  test("derives selected line identity and YES/NO contract side from market and outcome rows", () => {
    expect(
      buildTicketSelectionMetadata({
        market: {
          id: "world-cup-spread-1h",
          title: "Japan vs Morocco spread",
          marketGroupKey: "spreads",
          marketType: "spread",
          line: { toString: () => "-1.5" },
          period: "1H",
          referenceSource: "polymarket",
          externalMarketId: "gamma-world-cup-spread-1h",
          conditionId: "condition-world-cup-spread-1h",
        },
        outcome: {
          id: "spread-yes",
          name: "YES",
          label: "Japan",
          side: "yes",
          referenceTokenId: "token-spread-yes",
          referenceOutcomeLabel: "Japan",
        },
      }),
    ).toEqual({
      marketId: "world-cup-spread-1h",
      outcomeId: "spread-yes",
      marketGroupId: "spreads",
      marketType: "spread",
      line: "-1.5",
      period: "1H",
      side: "yes",
      displayLabel: "Japan -1.5 1H",
      contractSide: "yes",
      referenceSource: "polymarket",
      externalMarketId: "gamma-world-cup-spread-1h",
      conditionId: "condition-world-cup-spread-1h",
      referenceTokenId: "token-spread-yes",
      referenceOutcomeLabel: "Japan",
    });
  });
});
