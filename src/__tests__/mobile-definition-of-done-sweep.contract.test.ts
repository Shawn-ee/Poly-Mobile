import { readFileSync } from "node:fs";

describe("mobile Definition of Done sweep contract", () => {
  const source = () => readFileSync("scripts/mobile_definition_of_done_sweep.ts", "utf8");

  it("keeps provider parity as the explicit remaining partial criterion", () => {
    const script = source();

    expect(script).toContain("dod-provider-polymarket-parity");
    expect(script).toContain("providerPlanStatus");
    expect(script).toContain("Provider refresh plan status is");
  });

  it("does not double-count provider P1 debt as missing final-cycle artifacts", () => {
    const script = source();

    expect(script).toContain("hasCurrentFinalCycleAudit");
    expect(script).toContain("finalSignoff?.unresolvedP0GapCount === 0");
    expect(script).toContain("Overall completion still depends on the separate provider parity criterion.");
    expect(script).toContain("readyToDeclareDone = counts.blocked === 0 && counts.partial === 0 && internalReadinessP0Count === 0 && internalReadinessP1Count === 0");
  });
});
