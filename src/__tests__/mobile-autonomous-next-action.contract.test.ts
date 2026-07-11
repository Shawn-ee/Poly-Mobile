import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

describe("mobile autonomous next-action planner", () => {
  const source = () => readFileSync("scripts/plan_mobile_autonomous_next_action.ts", "utf8");
  const packageJson = () => readFileSync("package.json", "utf8");
  const functionLog = () => readFileSync("docs/mobile/FUNCTION_IMPLEMENTATION_LOG.md", "utf8");

  it("exposes a single command that consumes readiness, provider, and DoD evidence", () => {
    const script = source();

    expect(packageJson()).toContain("mobile:autonomous-next-action");
    expect(script).toContain("internal-readiness-batch-summary.json");
    expect(script).toContain("provider-evidence-refresh-plan.json");
    expect(script).toContain("cycle-current-mobile-definition-of-done-sweep.json");
    expect(script).toContain("refresh-s23-proof");
    expect(script).toContain("refresh-provider-evidence");
    expect(script).toContain("prove-temporary-provider-on-s23");
    expect(script).toContain("provider-parity-wait");
    expect(script).toContain("the-odds-api-single-event");
    expect(script).not.toContain("fetch(");
  });

  it("writes an S23 visible-proof plan when temporary sportsbook provider evidence is backend-proven only", () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), "mobile-next-action-"));
    const outputPath = path.join(tempDir, "plan.json");
    const command = process.platform === "win32" ? "cmd.exe" : "npx";
    const commandArgs = process.platform === "win32" ? ["/c", "npx"] : [];

    try {
      execFileSync(
        command,
        [
          ...commandArgs,
          "tsx",
          "scripts/plan_mobile_autonomous_next_action.ts",
          `--output=${outputPath}`,
          "--s23RefreshWindowHours=2",
        ],
        { encoding: "utf8" },
      );

      const plan = JSON.parse(readFileSync(outputPath, "utf8"));
      expect(plan.status).toBe("prove-temporary-provider-on-s23");
      expect(plan.priority).toBe("P1");
      expect(plan.state.localMvpReady).toBe(true);
      expect(plan.state.remainingPartialCriteria).toContain("dod-provider-polymarket-parity");
      expect(plan.state.temporaryProviderReady).toBe(true);
      expect(plan.state.temporaryProviderNeedsS23VisualProof).toBe(true);
      expect(plan.commands).toContain("npm run mobile:the-odds-api-single-event-flow");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("documents the planner as loop control without marking provider parity done", () => {
    expect(functionLog()).toContain("Cycle NEXTACTION - Autonomous Next-Action Planner");
    expect(functionLog()).toContain("does not close provider-backed Polymarket parity");
  });
});
