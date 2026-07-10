import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const portfolioSource = () => readFileSync("mobile/src/components/Portfolio.tsx", "utf8");

describe("Portfolio orders density contract", () => {
  test("renders a Polymarket-like open order row with compact metric strip", () => {
    const source = portfolioSource();

    expect(source).toContain("open-order-polymarket-row-parity");
    expect(source).toContain("open-order-metric-strip");
    expect(source).toContain("open-order-event-context-${compactPortfolioEventSubline(order)}");
    expect(source).toContain("open-order-market-context-${openOrderMarketSubline(order)}");
    expect(source).toContain("openOrderDisplayTitle(order)");
    expect(source).toContain("openOrderSideLabel(order)");
    expect(source).toContain("openOrderSidePill");
    expect(source).toContain("openOrderMarketMeta");
    expect(source).toContain("PositionFlag context=\"history\" item={order}");
    expect(source).toContain("openOrderRemainingShares(order).toLocaleString");
    expect(source).toContain("cancel-open-order-");
  });
});
