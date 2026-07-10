import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

describe("mobile event route proof-noise contract", () => {
  test("mobile-visible event feeds exclude disposable proof events", () => {
    const route = readFileSync("src/app/api/events/route.ts", "utf8");
    const providerBreadthProof = readFileSync("scripts/prove_mobile_provider_breadth_runtime.ts", "utf8");

    expect(route).toContain("const mobileProofNoiseFilter");
    expect(route).toContain("includeMobileMarkets ? mobileProofNoiseFilter() : {}");
    expect(route).toContain('startsWith: "mobile-"');
    expect(route).toContain('contains: "proof"');
    expect(route).toContain('contains: "provider breadth"');

    expect(providerBreadthProof).toContain("providerBackedOutrightEventCount");
    expect(providerBreadthProof).toContain("providerBackedOutrightEvents.length >= 1");
  });

  test("provider-winner Android proof treats Event Detail chart as removed", () => {
    const s23Proof = readFileSync("scripts/prove_mobile_provider_winner_s23_visible_flow.ps1", "utf8");

    expect(s23Proof).toContain("Assert-NotContains -Path $detailTopXml");
    expect(s23Proof).toContain('"event-detail-price-chart"');
    expect(s23Proof).not.toContain('Reason "route-backed chart source state"');
  });
});
