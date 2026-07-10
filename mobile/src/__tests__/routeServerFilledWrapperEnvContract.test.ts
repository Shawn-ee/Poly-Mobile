import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

describe("Route server-filled wrapper env contract", () => {
  test("loads dotenv before Prisma-backed provider setup commands", () => {
    const wrapper = readFileSync("mobile/scripts/local-mvp-route-server-filled-proof.ps1", "utf8");

    expect(wrapper).toContain("npx.cmd tsx -r dotenv/config scripts/prove_mobile_el_a_provider_breadth.ts");
    expect(wrapper).toContain("npx.cmd tsx -r dotenv/config scripts/seed_mobile_route_spread_counterparty.ts");
    expect(wrapper).toContain("--marketGroupKey=team-totals");
    expect(wrapper).toContain("--outcomeSide=over");
    expect(wrapper).toContain("--line=1.5");
    expect(wrapper).toContain("--askSize=200");
    expect(wrapper).toContain("--mintQuantity=240");
    expect(wrapper).toContain("--makerBalance=300");
    expect(wrapper).toContain('cmd /c "npm.cmd run mobile:dev-credential 2>&1"');
    expect(wrapper).toContain("$previousDatabaseUrl = $env:DATABASE_URL");
    expect(wrapper).toContain("if (-not $env:DATABASE_URL)");
    expect(wrapper).toContain('"postgresql://" + "postgres:postgres" + "@127.0.0.1:5432/polymarket"');
    expect(wrapper).toContain("Remove-Item Env:\\DATABASE_URL");
    expect(wrapper).not.toContain("npx.cmd tsx scripts/prove_mobile_el_a_provider_breadth.ts");
    expect(wrapper).not.toContain("npx.cmd tsx scripts/seed_mobile_route_spread_counterparty.ts");
  });

  test("keeps route server-filled UI proof on Local MVP retail detail markers", () => {
    const smoke = readFileSync("mobile/scripts/smoke.ps1", "utf8");
    const branch = smoke.slice(smoke.indexOf("$eventDetailBaseExpected = if"), smoke.indexOf("Assert-HierarchyContains -Path $eventDetailHierarchy -Expected $eventDetailBaseExpected"));

    expect(branch).toContain("$LocalMvpRouteServerFilledFlow");
    expect(branch).toContain("event-detail-non-prediction-lower-content-hidden-local-mvp");
    expect(branch).toContain("live-data-source-polymarket-gamma");
    expect(branch.indexOf("$LocalMvpRouteServerFilledFlow")).toBeLessThan(branch.indexOf("$ServerLiveDetailBackendProof"));
  });

  test("allows Local MVP route server proof to keep chart and probability display while hiding social/depth UI", () => {
    const smoke = readFileSync("mobile/scripts/smoke.ps1", "utf8");
    const hiddenBlock = smoke.slice(smoke.indexOf("$mvpHiddenChartChatExpected = @("), smoke.indexOf("$mvpRouteTargetOutcomeId"));

    expect(hiddenBlock).toContain("event-detail-chat-page");
    expect(hiddenBlock).toContain("event-detail-live-stats-panel");
    expect(hiddenBlock).not.toContain("event-detail-price-chart");
    expect(hiddenBlock).not.toContain("event-detail-chart-retail-surface-fit");
    expect(hiddenBlock).not.toContain("chart-status-ready");
  });

  test("targets provider-backed dynamic line market identities instead of old fixture ids", () => {
    const smoke = readFileSync("mobile/scripts/smoke.ps1", "utf8");
    const routeStart = smoke.indexOf("$mvpRouteTargetOutcomeId = if");
    const routeEnd = smoke.indexOf("$proof = [ordered]@{", routeStart);
    const routeBlock = smoke.slice(routeStart, routeEnd);
    const portfolioStart = smoke.indexOf('Assert-HierarchyContains -Path $mvpRoutePortfolioTopHierarchy -Expected @(');
    const portfolioBlock = smoke.slice(portfolioStart, smoke.indexOf('$mvpRoutePortfolioHierarchy = $mvpRoutePortfolioTopHierarchy', portfolioStart));
    const lineExpectedBlock = routeBlock.slice(routeBlock.indexOf("$mvpRouteLineExpected = @("), routeBlock.indexOf("$mvpRouteLineHierarchy = $null"));

    expect(routeBlock).toContain('"event-detail-outcome-spread-"');
    expect(routeBlock).toContain('"selection-period-regulation"');
    expect(routeBlock).toContain('"token-el-a-spread-reg-15-home"');
    expect(routeBlock).toContain('"token-el-a-team-total-over"');
    expect(routeBlock).toContain('"Breadth Home Over 1.5 goals"');
    expect(routeBlock).toContain('"Argentina Over 1.5 goals"');
    expect(routeBlock).toContain("$mvpRoutePortfolioCost");
    expect(routeBlock).toContain("{ '$75' }");
    expect(routeBlock).toContain("$mvpRoutePortfolioToWin");
    expect(routeBlock).toContain("{ '$144.23' }");
    expect(smoke).toContain('"portfolio-history-fill-count-1"');
    expect(smoke).not.toContain('"portfolio-history-fill-count-3"');
    expect(portfolioBlock).toContain('"portfolio-account-entry-top-left"');
    expect(portfolioBlock).toContain('"portfolio-account-entry-google"');
    expect(routeBlock).toContain('"ticket-advanced-hidden-local-mvp"');
    expect(routeBlock).toContain('"event-detail-compact-game-header"');
    expect(routeBlock).toContain('"event-detail-header-team-identity-fit"');
    expect(routeBlock).toContain('"540", "1980", "540", "1370", "1800"');
    expect(routeBlock).toContain('if ($mvpRouteTargetTicketMarketType -eq "spread")');
    expect(routeBlock).toContain("input swipe 540 760 540 1280 300");
    expect(routeBlock).toContain("Invoke-TapHierarchyNode -Path $mvpRouteLineHierarchy -Identifier $mvpRouteTargetOutcomeId -StartsWith");
    expect(routeBlock).not.toContain('"event-detail-outcome-spread-spread-yes"');
    expect(lineExpectedBlock).not.toContain('"selection-period-Reg. Time",');
    expect(lineExpectedBlock).not.toContain('"ticket-source-backend-line-market",');
    expect(routeBlock).not.toContain("Invoke-TapHierarchyNode -Path $mvpRouteSpreadTicketHierarchy -Identifier \"ticket-settings\"");
    expect(routeBlock).not.toContain('"ticket-settings-state-closed"');
    expect(portfolioBlock).not.toContain('"portfolio-settings portfolio-settings-state-closed"');
    expect(portfolioBlock).toContain('Assert-HierarchyDoesNotContain -Path $mvpRoutePortfolioTopHierarchy -Unexpected @("portfolio-settings", "portfolio-settings-sheet", "local-mvp-account-sheet")');
    expect(routeBlock).not.toContain("portfolio-provider-token-token-el-a-spread-home");
  });
});
