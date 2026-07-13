import { readFileSync } from "node:fs";

const seedScript = () => readFileSync("scripts/seed_mobile_route_spread_counterparty.ts", "utf8");
const s23Proof = () => readFileSync("scripts/prove_mobile_current_mvp_s23_visible_flow.ps1", "utf8");
const oddsApiS23Proof = () => readFileSync("scripts/prove_mobile_odds_api_s23_visible_flow.ps1", "utf8");

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
    expect(source).toContain("resetSelectedMarketState");
    expect(source).toContain("collateralReset");
  });

  test("S23 current MVP proof passes explicit liquidity purpose flags", () => {
    const source = s23Proof();

    expect(source).toContain('"--liquidityPurpose=buy-fill"');
    expect(source).toContain('"--cleanupBlockingMarketBids"');
    expect(source).toContain('"--liquidityPurpose=cashout-sell-fill"');
    expect(source).toContain('"--liquidityPurpose=cleanup"');
  });

  test("S23 current MVP proof reports filled position visibility before cashout", () => {
    const source = s23Proof();

    expect(source).toContain(
      '$fixtureOrderLandedAsPosition = $afterSubmitRaw -match [regex]::Escape("position-card-")',
    );
    expect(source).toContain("filledPositionVisible = $fixtureOrderLandedAsPosition");
  });

  test("Odds API S23 proof starts from a clean selected market before buying", () => {
    const source = oddsApiS23Proof();

    expect(source).toContain('"--resetSelectedMarketState"');
    expect(source).toContain('"--liquidityPurpose=buy-fill"');
    expect(source).toContain('"--liquidityPurpose=cashout-sell-fill"');
  });

  test("S23 current MVP proof can target line families beyond spread", () => {
    const source = s23Proof();

    expect(source).toContain('[string]$LineMarketGroupKey = "spread"');
    expect(source).toContain('[string]$LineMarketType = "spread"');
    expect(source).toContain('[string]$LineValue = "1.5"');
    expect(source).toContain('[string]$LineOutcomeSide = "away"');
    expect(source).toContain('[string]$LineOutcomeLabel = "Egypt +1.5"');
    expect(source).toContain('[string]$LineTapPrefix = ""');
    expect(source).toContain('"--marketGroupKey=$LineMarketGroupKey"');
    expect(source).toContain('"--line=$LineValue"');
    expect(source).toContain('"--outcomeSide=$LineOutcomeSide"');
    expect(source).toContain('$lineSelectionTypeLabel = "selection-market-type-$LineMarketType"');
    expect(source).toContain('$lineSelectionSideLabel = "selection-side-$LineOutcomeSide"');
    expect(source).toContain('$lineTapPrefix = if ($LineTapPrefix) { $LineTapPrefix } else { "event-detail-outcome-$LineMarketGroupKey-" }');
    expect(source).toContain('"portfolio-history-visible-label-$LineOutcomeLabel"');
  });
});
