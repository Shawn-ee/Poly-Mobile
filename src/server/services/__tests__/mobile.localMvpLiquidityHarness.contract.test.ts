import { readFileSync } from "node:fs";

const seedScript = () => readFileSync("scripts/seed_mobile_route_spread_counterparty.ts", "utf8");
const s23Proof = () => readFileSync("scripts/prove_mobile_current_mvp_s23_visible_flow.ps1", "utf8");

describe("mobile Local MVP liquidity proof harness", () => {
  test("labels buy-fill and cashout-sell-fill liquidity with opposite resting sides", () => {
    const source = seedScript();

    expect(source).toContain('const liquidityPurpose = argValue("liquidityPurpose")');
    expect(source).toContain('"buy-fill"');
    expect(source).toContain('"cashout-sell-fill"');
    expect(source).toContain("buy-fill liquidity must seed a resting SELL ask");
    expect(source).toContain("cashout-sell-fill liquidity must seed a resting BUY bid");
    expect(source).toContain("local-mvp-internal-liquidity");
    expect(source).toContain('liquidityPurpose === "buy-fill"');
    expect(source).toContain("cleanupBlockingMarketBidsForcedByPurpose");
  });

  test("S23 current MVP proof passes explicit liquidity purpose flags", () => {
    const source = s23Proof();

    expect(source).toContain('"--liquidityPurpose=buy-fill"');
    expect(source).toContain('"--cleanupBlockingMarketBids"');
    expect(source).toContain('"--liquidityPurpose=cashout-sell-fill"');
    expect(source).toContain('"--liquidityPurpose=cleanup"');
  });
});
