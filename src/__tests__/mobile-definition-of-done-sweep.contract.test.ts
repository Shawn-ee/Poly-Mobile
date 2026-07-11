import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync, utimesSync } from "node:fs";
import os from "node:os";
import path from "node:path";

describe("mobile Definition of Done sweep contract", () => {
  const source = () => readFileSync("scripts/mobile_definition_of_done_sweep.ts", "utf8");

  it("keeps provider parity as the explicit remaining partial criterion", () => {
    const script = source();

    expect(script).toContain("dod-provider-polymarket-parity");
    expect(script).toContain("providerPlanStatus");
    expect(script).toContain("Provider refresh plan status is");
  });

  it("tracks The Odds API as a temporary provider bridge without closing Polymarket parity", () => {
    const script = source();

    expect(script).toContain("dod-temporary-sportsbook-provider-bridge");
    expect(script).toContain("temporarySportsbookProviderBridgeReady");
    expect(script).toContain("temporarySportsbookBackendProofReady");
    expect(script).toContain("single-event-summary.redacted.json");
    expect(script).not.toContain("single-event-replay-summary.redacted.json");
    expect(script).toContain("The Odds API single-event bridge is seeded");
    expect(script).toContain("does not block Local MVP readiness");
  });

  it("does not double-count provider P1 debt as missing final-cycle artifacts", () => {
    const script = source();

    expect(script).toContain("hasCurrentFinalCycleAudit");
    expect(script).toContain("finalSignoff?.unresolvedP0GapCount === 0");
    expect(script).toContain("Overall completion still depends on the separate provider parity criterion.");
    expect(script).toContain("readyToDeclareDone = counts.blocked === 0 && counts.partial === 0 && internalReadinessP0Count === 0 && internalReadinessP1Count === 0");
  });

  it("does not tell the loop to wait for the APK lane after APK smoke is verified", () => {
    const script = source();

    expect(script).toContain("Keep Samsung APK smoke for install/launch coverage and Samsung server-order proof for the real-device trading regression.");
    expect(script).not.toContain("Keep Samsung server-order proof as the main real-device trading regression until the APK lane exists.");
  });

  it("does not rewrite sweep artifacts when only generated timestamps change", () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), "mobile-dod-sweep-"));
    const summaryPath = path.join(tempDir, "summary.json");
    const reportPath = path.join(tempDir, "report.md");
    const command = process.platform === "win32" ? "cmd.exe" : "npx";
    const commandArgs = process.platform === "win32" ? ["/c", "npx"] : [];

    try {
      execFileSync(
        command,
        [
          ...commandArgs,
          "tsx",
          "scripts/mobile_definition_of_done_sweep.ts",
          `--summaryPath=${summaryPath}`,
          `--reportPath=${reportPath}`,
        ],
        { encoding: "utf8" },
      );

      const oldTime = new Date("2001-01-01T00:00:00.000Z");
      utimesSync(summaryPath, oldTime, oldTime);
      utimesSync(reportPath, oldTime, oldTime);
      const summaryMtime = statSync(summaryPath).mtimeMs;
      const reportMtime = statSync(reportPath).mtimeMs;

      execFileSync(
        command,
        [
          ...commandArgs,
          "tsx",
          "scripts/mobile_definition_of_done_sweep.ts",
          `--summaryPath=${summaryPath}`,
          `--reportPath=${reportPath}`,
        ],
        { encoding: "utf8" },
      );

      expect(statSync(summaryPath).mtimeMs).toBe(summaryMtime);
      expect(statSync(reportPath).mtimeMs).toBe(reportMtime);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
