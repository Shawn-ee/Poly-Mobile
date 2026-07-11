import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs";
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
    expect(script).toContain("refresh-temporary-provider-proof");
    expect(script).toContain("prove-temporary-provider-on-s23");
    expect(script).toContain("provider-parity-wait");
    expect(script).toContain("the-odds-api-single-event");
    expect(script).toContain("single-event-summary.redacted.json");
    expect(script).toContain("temporarySportsbookBackendProofReady");
    expect(script).toContain("samePlanIgnoringGeneratedAt");
    expect(script).toContain("stripGeneratedAt");
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
          `--oddsApiS23VisibleProofPath=${path.join(tempDir, "missing-s23-visible-proof.json")}`,
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
      expect(plan.commands).toContain("npm run mobile:the-odds-api-s23-visible-flow");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("refreshes temporary sportsbook backend proof when the batch marks it stale", () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), "mobile-next-action-"));
    const outputPath = path.join(tempDir, "plan.json");
    const readinessPath = path.join(tempDir, "readiness.json");
    const providerPlanPath = path.join(tempDir, "provider-plan.json");
    const dodPath = path.join(tempDir, "dod.json");
    const oddsSummaryPath = path.join(tempDir, "odds-summary.json");
    const oddsFlowPath = path.join(tempDir, "odds-flow.json");
    const reachabilityPath = path.join(tempDir, "reachability.json");
    const visiblePath = path.join(tempDir, "visible.json");
    const command = process.platform === "win32" ? "cmd.exe" : "npx";
    const commandArgs = process.platform === "win32" ? ["/c", "npx"] : [];

    try {
      writeFileSync(
        readinessPath,
        JSON.stringify({
          readiness: {
            localMvpReadyForInternalTesting: true,
            s23LocalMvpDeviceProofReady: true,
            s23ProofHoursUntilStale: 12,
            cachedProviderEvidenceFresh: true,
            cachedProviderEvidenceHoursUntilStale: 12,
            temporarySportsbookBackendProofReady: false,
          },
          blockers: { p0: [], p1: ["temporary_sportsbook_backend_proof_stale_or_missing"], p2: [] },
          recovery: { rerunBatchCommand: "npm run mobile:internal-readiness-batch" },
        }),
      );
      writeFileSync(providerPlanPath, JSON.stringify({ status: "skip-refresh", shouldRefreshProviderEvidence: false }));
      writeFileSync(dodPath, JSON.stringify({ readyToDeclareDone: false, criteria: [{ id: "dod-provider-polymarket-parity", status: "partial" }] }));
      writeFileSync(oddsSummaryPath, JSON.stringify({ pass: true, mobile: { sportsbookMarketCount: 1, eventSlug: "odds-api-single-soccer-test" } }));
      writeFileSync(oddsFlowPath, JSON.stringify({ pass: true, checks: { fakeTokenOrderFilled: true, portfolioPositionVisible: true, historyTradeVisible: true } }));
      writeFileSync(reachabilityPath, JSON.stringify({ pass: true, proofLimitations: [] }));
      writeFileSync(visiblePath, JSON.stringify({ result: "pass", assertions: {
        homeShowsTemporarySportsbookEvent: true,
        detailShowsGameLines: true,
        sportsbookSpreadLineVisible: true,
        ticketPreservesSportsbookLineIdentity: true,
        swipeSubmitReachedPortfolio: true,
        portfolioPreservesSportsbookLineIdentity: true,
        historyPreservesSportsbookLineIdentity: true,
      } }));

      execFileSync(
        command,
        [
          ...commandArgs,
          "tsx",
          "scripts/plan_mobile_autonomous_next_action.ts",
          `--output=${outputPath}`,
          `--readinessSummaryPath=${readinessPath}`,
          `--providerEvidencePlanPath=${providerPlanPath}`,
          `--definitionOfDoneSweepPath=${dodPath}`,
          `--oddsApiSingleEventSummaryPath=${oddsSummaryPath}`,
          `--oddsApiMobileFlowProofPath=${oddsFlowPath}`,
          `--oddsApiS23ReachabilityPath=${reachabilityPath}`,
          `--oddsApiS23VisibleProofPath=${visiblePath}`,
        ],
        { encoding: "utf8" },
      );

      const plan = JSON.parse(readFileSync(outputPath, "utf8"));
      expect(plan.status).toBe("refresh-temporary-provider-proof");
      expect(plan.priority).toBe("P1");
      expect(plan.state.temporaryProviderBackendProofReady).toBe(false);
      expect(plan.commands).toContain("npm run mobile:the-odds-api-single-event");
      expect(plan.commands).toContain("npm run mobile:the-odds-api-single-event-flow");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("does not rewrite the committed plan when only generatedAt would change", () => {
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
      const firstPlan = JSON.parse(readFileSync(outputPath, "utf8"));
      firstPlan.generatedAt = "2000-01-01T00:00:00.000Z";
      writeFileSync(outputPath, `${JSON.stringify(firstPlan, null, 2)}\n`);
      const oldTime = new Date("2001-01-01T00:00:00.000Z");
      utimesSync(outputPath, oldTime, oldTime);
      const before = statSync(outputPath).mtimeMs;

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

      expect(statSync(outputPath).mtimeMs).toBe(before);
      expect(JSON.parse(readFileSync(outputPath, "utf8")).generatedAt).toBe("2000-01-01T00:00:00.000Z");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("documents the planner as loop control without marking provider parity done", () => {
    expect(functionLog()).toContain("Cycle NEXTACTION - Autonomous Next-Action Planner");
    expect(functionLog()).toContain("does not close provider-backed Polymarket parity");
  });
});
