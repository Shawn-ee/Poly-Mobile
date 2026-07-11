import { readFileSync } from "node:fs";

describe("mobile final QA/review signoff contract", () => {
  const source = () => readFileSync("scripts/mobile_final_qa_review_signoff.ts", "utf8");

  it("gates final signoff on the Definition of Done sweep, not only P0 gap rows", () => {
    const script = source();

    expect(script).toContain("cycle-current-mobile-definition-of-done-sweep.json");
    expect(script).toContain("DefinitionOfDoneSweep");
    expect(script).toContain("definitionOfDoneBlockingCriteria");
    expect(script).toContain("unresolvedP0Gaps.length === 0 && definitionOfDoneSweepPresent");
  });

  it("excludes the final-cycle criterion to avoid a circular signoff lock", () => {
    const script = source();

    expect(script).toContain('criterion.id !== "dod-final-cycle"');
    expect(script).toContain("criterion.status !== \"verified\"");
  });
});
