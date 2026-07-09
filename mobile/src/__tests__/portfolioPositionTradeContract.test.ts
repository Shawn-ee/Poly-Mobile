import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const portfolioSource = () => readFileSync("mobile/src/components/Portfolio.tsx", "utf8");

describe("Portfolio position trade actions", () => {
  test("keeps explicit Sell trade affordance on the generic trade ticket path", () => {
    const source = portfolioSource();
    const sellActionIndex = source.indexOf("position-trade-sell-");
    const sellActionBlock = source.slice(sellActionIndex, sellActionIndex + 500);

    expect(sellActionIndex).toBeGreaterThan(0);
    expect(sellActionBlock).toContain('openPositionTrade(position, "sell")');
    expect(sellActionBlock).not.toContain("openCashoutPosition(position)");
  });

  test("routes the visible Cash out position action through the generic Sell ticket", () => {
    const source = portfolioSource();
    const cashOutActionIndex = source.indexOf("portfolio-position-cash-out-");
    const cashOutActionBlock = source.slice(cashOutActionIndex, cashOutActionIndex + 500);

    expect(cashOutActionIndex).toBeGreaterThan(0);
    expect(cashOutActionBlock).toContain('openPositionTrade(position, "sell")');
    expect(cashOutActionBlock).not.toContain("openCashoutPosition(position)");
  });

  test("does not keep a hidden dedicated close-position fallback in the default MVP path", () => {
    const source = portfolioSource();

    expect(source).not.toContain("close-position-");
    expect(source).not.toContain("openCashoutPosition");
  });
});
