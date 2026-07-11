import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync, utimesSync } from "node:fs";
import os from "node:os";
import path from "node:path";

describe("mobile final QA/review signoff contract", () => {
  const source = () => readFileSync("scripts/mobile_final_qa_review_signoff.ts", "utf8");

  it("gates final signoff on the Definition of Done sweep, not only P0 gap rows", () => {
    const script = source();

    expect(script).toContain("cycle-current-mobile-definition-of-done-sweep.json");
    expect(script).toContain("DefinitionOfDoneSweep");
    expect(script).toContain("definitionOfDoneBlockingCriteria");
    expect(script).toContain("unresolvedP0Gaps.length === 0 && definitionOfDoneSweepPresent");
  });

  it("includes the provider evidence refresh plan in final signoff evidence", () => {
    const script = source();

    expect(script).toContain("provider-evidence-refresh-plan.json");
    expect(script).toContain("Provider evidence refresh plan");
    expect(script).toContain("writeJsonIfMeaningfullyChanged");
    expect(script).toContain("writeMarkdownIfMeaningfullyChanged");
  });

  it("excludes the final-cycle criterion to avoid a circular signoff lock", () => {
    const script = source();

    expect(script).toContain('criterion.id !== "dod-final-cycle"');
    expect(script).toContain("criterion.status !== \"verified\"");
  });

  it("does not rewrite signoff artifacts when only generated timestamps change", () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), "mobile-final-signoff-"));
    const summaryPath = path.join(tempDir, "signoff.json");
    const qaPath = path.join(tempDir, "qa.md");
    const reviewPath = path.join(tempDir, "review.md");
    const command = process.platform === "win32" ? "cmd.exe" : "npx";
    const commandArgs = process.platform === "win32" ? ["/c", "npx"] : [];

    try {
      const args = [
        ...commandArgs,
        "tsx",
        "scripts/mobile_final_qa_review_signoff.ts",
        `--summaryPath=${summaryPath}`,
        `--qaPath=${qaPath}`,
        `--reviewPath=${reviewPath}`,
      ];

      execFileSync(command, args, { encoding: "utf8" });
      const oldTime = new Date("2001-01-01T00:00:00.000Z");
      utimesSync(summaryPath, oldTime, oldTime);
      utimesSync(qaPath, oldTime, oldTime);
      utimesSync(reviewPath, oldTime, oldTime);
      const summaryMtime = statSync(summaryPath).mtimeMs;
      const qaMtime = statSync(qaPath).mtimeMs;
      const reviewMtime = statSync(reviewPath).mtimeMs;

      execFileSync(command, args, { encoding: "utf8" });

      expect(statSync(summaryPath).mtimeMs).toBe(summaryMtime);
      expect(statSync(qaPath).mtimeMs).toBe(qaMtime);
      expect(statSync(reviewPath).mtimeMs).toBe(reviewMtime);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
