import { describe, expect, test } from "vitest";
import {
  openOrderPotentialCopyKey,
  openOrderPotentialValue,
  openOrderRemainingShares,
  openOrderValue,
} from "../services/openOrderEconomicsService";

describe("open order economics service", () => {
  test("uses remaining shares as buy-side potential payout", () => {
    const order = { side: "buy" as const, price: 0.47, remaining: 250 };

    expect(openOrderRemainingShares(order)).toBe(250);
    expect(openOrderValue(order)).toBe(117.5);
    expect(openOrderPotentialCopyKey(order)).toBe("potentialPayout");
    expect(openOrderPotentialValue(order)).toBe(250);
  });

  test("uses remaining value as sell-side potential proceeds", () => {
    const order = { side: "sell" as const, price: 0.52, remaining: 100, orderValue: 52 };

    expect(openOrderPotentialCopyKey(order)).toBe("potentialProceeds");
    expect(openOrderPotentialValue(order)).toBe(52);
  });
});
