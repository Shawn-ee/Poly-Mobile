import { Prisma } from "@prisma/client";
import { COMBO_RISK_LIMITS, validateComboRisk, type ComboRiskLeg } from "@/server/services/comboRisk";

const dec = (value: string | number) => new Prisma.Decimal(value);

const quote = {
  bestBid: 0.48,
  bestAsk: 0.52,
  mid: 0.5,
  spread: 0.04,
  hasQuote: true,
};

const leg = (overrides: Partial<ComboRiskLeg> = {}): ComboRiskLeg => ({
  marketId: "market-1",
  outcomeId: "outcome-1",
  line: null,
  market: {
    id: "market-1",
    status: "LIVE",
    visibility: "PUBLIC",
    mechanism: "ORDERBOOK",
    isListed: true,
    eventId: "event-1",
    marketType: "moneyline",
    marketGroupKey: "main",
    line: null,
    period: "full_game",
    participantName: null,
    externalMarketId: null,
    conditionId: null,
    sourceUpdatedAt: null,
  },
  outcome: {
    id: "outcome-1",
    marketId: "market-1",
    isActive: true,
    isTradable: true,
    side: "team_a",
    code: "TEAM_A",
    status: "active",
  },
  quote,
  ...overrides,
});

describe("combo risk validation v1", () => {
  test("allows independent different-event combo within limits", () => {
    const result = validateComboRisk({
      stakeUSDC: dec("10"),
      potentialPayoutUSDC: dec("100"),
      legs: [
        leg(),
        leg({
          marketId: "market-2",
          outcomeId: "outcome-2",
          market: {
            ...leg().market,
            id: "market-2",
            eventId: "event-2",
          },
          outcome: {
            ...leg().outcome,
            id: "outcome-2",
            marketId: "market-2",
          },
        }),
      ],
    });

    expect(result.allowed).toBe(true);
    expect(result.reasonCodes).toEqual([]);
  });

  test("blocks same market and duplicate outcome conflicts with reason codes", () => {
    const result = validateComboRisk({
      stakeUSDC: dec("10"),
      legs: [
        leg(),
        leg({
          outcomeId: "outcome-1",
          outcome: {
            ...leg().outcome,
            side: "team_b",
            code: "TEAM_B",
          },
        }),
      ],
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toEqual(expect.arrayContaining(["COMBO_DUPLICATE_MARKET", "COMBO_DUPLICATE_OUTCOME"]));
  });

  test("blocks same-event moneyline mutual exclusivity", () => {
    const result = validateComboRisk({
      stakeUSDC: dec("10"),
      legs: [
        leg(),
        leg({
          marketId: "market-2",
          outcomeId: "outcome-2",
          market: { ...leg().market, id: "market-2" },
          outcome: { ...leg().outcome, id: "outcome-2", marketId: "market-2", side: "team_b", code: "TEAM_B" },
        }),
      ],
    });

    expect(result.reasonCodes).toEqual(expect.arrayContaining([
      "COMBO_MUTUALLY_EXCLUSIVE_OUTCOMES",
      "COMBO_SAME_EVENT_UNSUPPORTED",
    ]));
  });

  test("blocks over-under same-line conflict and correlated total ladder", () => {
    const over = leg({
      marketId: "total-25-over",
      outcomeId: "over-25",
      line: "2.5",
      market: { ...leg().market, id: "total-25-over", marketType: "total", marketGroupKey: "total", line: dec("2.5") },
      outcome: { ...leg().outcome, id: "over-25", marketId: "total-25-over", side: "over", code: "OVER" },
    });
    const under = leg({
      marketId: "total-25-under",
      outcomeId: "under-25",
      line: "2.5",
      market: { ...leg().market, id: "total-25-under", marketType: "total", marketGroupKey: "total", line: dec("2.5") },
      outcome: { ...leg().outcome, id: "under-25", marketId: "total-25-under", side: "under", code: "UNDER" },
    });
    const over35 = leg({
      marketId: "total-35-over",
      outcomeId: "over-35",
      line: "3.5",
      market: { ...leg().market, id: "total-35-over", marketType: "total", marketGroupKey: "total", line: dec("3.5") },
      outcome: { ...leg().outcome, id: "over-35", marketId: "total-35-over", side: "over", code: "OVER" },
    });

    expect(validateComboRisk({ stakeUSDC: dec("10"), legs: [over, under] }).reasonCodes)
      .toEqual(expect.arrayContaining(["COMBO_TOTAL_LINE_CONFLICT"]));
    expect(validateComboRisk({ stakeUSDC: dec("10"), legs: [over, over35] }).reasonCodes)
      .toEqual(expect.arrayContaining(["COMBO_CORRELATED_LINE_LADDER_UNSUPPORTED"]));
  });

  test("blocks spread opposite side conflict, equivalent markets, and YES/NO conflict", () => {
    const homeSpread = leg({
      marketId: "spread-home",
      outcomeId: "home-spread",
      line: "1.5",
      market: { ...leg().market, id: "spread-home", marketType: "spread", marketGroupKey: "spread", line: dec("1.5"), conditionId: "equiv-1" },
      outcome: { ...leg().outcome, id: "home-spread", marketId: "spread-home", side: "team_a", code: "YES" },
    });
    const awaySpread = leg({
      marketId: "spread-away",
      outcomeId: "away-spread",
      line: "1.5",
      market: { ...leg().market, id: "spread-away", marketType: "spread", marketGroupKey: "spread", line: dec("1.5"), conditionId: "equiv-1" },
      outcome: { ...leg().outcome, id: "away-spread", marketId: "spread-away", side: "team_b", code: "NO" },
    });

    const result = validateComboRisk({ stakeUSDC: dec("10"), legs: [homeSpread, awaySpread] });
    expect(result.reasonCodes).toEqual(expect.arrayContaining([
      "COMBO_SPREAD_SIDE_CONFLICT",
      "COMBO_EQUIVALENT_MARKET_UNSUPPORTED",
      "COMBO_YES_NO_CONFLICT",
    ]));
  });

  test("blocks quote, market, outcome, stake, leg, and payout risk failures", () => {
    const staleDate = new Date(Date.now() - COMBO_RISK_LIMITS.quoteStaleMs - 1000);
    const risky = validateComboRisk({
      stakeUSDC: dec("101"),
      potentialPayoutUSDC: dec("5001"),
      legs: [
        leg({
          quote: { ...quote, hasQuote: false, bestBid: null, bestAsk: null },
          market: {
            ...leg().market,
            visibility: "PRIVATE",
            status: "CLOSED",
            sourceUpdatedAt: staleDate,
          },
          outcome: {
            ...leg().outcome,
            isActive: false,
            isTradable: false,
          },
        }),
        leg({ marketId: "m2", outcomeId: "o2", market: { ...leg().market, id: "m2", eventId: "e2" }, outcome: { ...leg().outcome, id: "o2", marketId: "m2" } }),
        leg({ marketId: "m3", outcomeId: "o3", market: { ...leg().market, id: "m3", eventId: "e3" }, outcome: { ...leg().outcome, id: "o3", marketId: "m3" } }),
        leg({ marketId: "m4", outcomeId: "o4", market: { ...leg().market, id: "m4", eventId: "e4" }, outcome: { ...leg().outcome, id: "o4", marketId: "m4" } }),
        leg({ marketId: "m5", outcomeId: "o5", market: { ...leg().market, id: "m5", eventId: "e5" }, outcome: { ...leg().outcome, id: "o5", marketId: "m5" } }),
        leg({ marketId: "m6", outcomeId: "o6", market: { ...leg().market, id: "m6", eventId: "e6" }, outcome: { ...leg().outcome, id: "o6", marketId: "m6" } }),
        leg({ marketId: "m7", outcomeId: "o7", market: { ...leg().market, id: "m7", eventId: "e7" }, outcome: { ...leg().outcome, id: "o7", marketId: "m7" } }),
      ],
    });

    expect(risky.reasonCodes).toEqual(expect.arrayContaining([
      "COMBO_TOO_MANY_LEGS",
      "COMBO_STAKE_EXCEEDS_LIMIT",
      "COMBO_PAYOUT_EXCEEDS_LIMIT",
      "COMBO_MARKET_NOT_PUBLIC",
      "COMBO_MARKET_NOT_TRADABLE",
      "COMBO_OUTCOME_NOT_TRADABLE",
      "COMBO_QUOTE_MISSING",
      "COMBO_QUOTE_STALE",
    ]));
  });
});
