import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

describe("Current route server-filled wrapper contract", () => {
  test("prepares the real current MVP match and does not use disposable provider-breadth data", () => {
    const wrapper = readFileSync("mobile/scripts/local-mvp-current-route-server-filled-proof.ps1", "utf8");

    expect(wrapper).toContain('EventSlug = "argentina-vs-egypt"');
    expect(wrapper).toContain('ProviderEventSlug = "fifwc-arg-egy-2026-07-07"');
    expect(wrapper).toContain("scripts/restore_current_mobile_mvp_match.ts");
    expect(wrapper).toContain("scripts/seed_mobile_mvp_match_line_markets.ts");
    expect(wrapper).toContain("scripts/seed_mobile_route_spread_counterparty.ts");
    expect(wrapper).toContain("--marketGroupKey=team-totals");
    expect(wrapper).toContain("--outcomeSide=over");
    expect(wrapper).toContain("--line=1.5");
    expect(wrapper).toContain("-LocalMvpCurrentRouteServerFilledFlow");
    expect(wrapper).toContain("$env:EXPO_PUBLIC_ORDER_MODE = \"server\"");
    expect(wrapper).toContain("$env:EXPO_PUBLIC_MARKET_DATA_MODE = \"server\"");
    expect(wrapper).not.toContain("scripts/prove_mobile_el_a_provider_breadth.ts");
    expect(wrapper).not.toContain("EL-A Provider Breadth");
  });

  test("asserts current-route source identity honestly as fixture lines over provider winner", () => {
    const smoke = readFileSync("mobile/scripts/smoke.ps1", "utf8");
    const block = smoke.slice(smoke.indexOf("$mvpRouteCurrentMatch"), smoke.indexOf("$mvpRouteLineHierarchy = $null"));

    expect(smoke).toContain("[switch]$LocalMvpCurrentRouteServerFilledFlow");
    expect(smoke).toContain('"local-mvp-current-route-server-filled-proof.ps1"');
    expect(smoke).toContain('"cycle-$mvpRouteServerCycle-local-mvp-current-route-server-filled-flow-proof.json"');
    expect(block).toContain('"Argentina vs. Egypt"');
    expect(block).toContain('"ARG"');
    expect(block).toContain('"EGY"');
    expect(block).toContain('"contract-argentina-vs-egypt-team-total-home-1-5-over"');
    expect(block).toContain('"provider-source-contract-fixture"');
    expect(smoke).toContain('"regulation-winner-provider-backed"');
    expect(smoke).toContain('"line-source-contract-fixture"');
    expect(smoke).toContain('"winner source is Polymarket-backed"');
    expect(block).toContain('"Argentina Over 1.5 goals"');
    expect(block).toContain("'To win $144.23'");
  });
});
