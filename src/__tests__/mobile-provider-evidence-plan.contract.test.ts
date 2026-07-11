import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

describe("mobile provider evidence refresh planner", () => {
  const scriptSource = () => readFileSync("scripts/plan_mobile_provider_evidence_refresh.ts", "utf8");
  const packageJson = () => readFileSync("package.json", "utf8");
  const auditDoc = () => readFileSync("docs/mobile/audits/BATCH_INTERNAL_READINESS_HARNESS.md", "utf8");
  const functionLog = () => readFileSync("docs/mobile/FUNCTION_IMPLEMENTATION_LOG.md", "utf8");

  it("exposes a no-provider-call command for deciding when provider evidence should refresh", () => {
    expect(packageJson()).toContain("mobile:provider-evidence-plan");
    expect(packageJson()).toContain("scripts/plan_mobile_provider_evidence_refresh.ts");

    const source = scriptSource();
    expect(source).toContain("cachedProviderEvidenceHoursUntilStale");
    expect(source).toContain("computeHoursUntilStale");
    expect(source).toContain("providerRefreshCommand");
    expect(source).toContain("Only start provider-backed trading work if the refreshed evidence shows a real attach-ready World Cup match or line market.");
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("Gamma");
    expect(source).not.toContain("CLOB");
  });

  it("writes a machine-readable skip plan from fresh cached provider evidence", () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), "provider-evidence-plan-"));
    const outputPath = path.join(tempDir, "plan.json");
    const command = process.platform === "win32" ? "cmd.exe" : "npx";
    const commandArgs = process.platform === "win32" ? ["/c", "npx"] : [];

    try {
      execFileSync(
        command,
        [
          ...commandArgs,
          "tsx",
          "scripts/plan_mobile_provider_evidence_refresh.ts",
          "--summaryPath=docs/mobile/harness/batch-internal-readiness-latest/internal-readiness-batch-summary.json",
          `--output=${outputPath}`,
          "--refreshWindowHours=1",
        ],
        { encoding: "utf8" },
      );

      const plan = JSON.parse(readFileSync(outputPath, "utf8"));
      expect(plan.status).toBe("skip-refresh");
      expect(plan.shouldRefreshProviderEvidence).toBe(false);
      expect(plan.providerRefreshCommand).toBe("npm run mobile:internal-readiness-batch:provider-refresh");
      expect(plan.providerBlockers).toContain("provider_worldcup_match_books_unavailable_or_closed");
      expect(plan.providerEvidenceCounts.attachReadyProviderLineCandidateCount).toBe(0);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("uses absolute staleAt timestamps instead of trusting aged cached hours", () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), "provider-evidence-plan-"));
    const summaryPath = path.join(tempDir, "summary.json");
    const outputPath = path.join(tempDir, "plan.json");
    const command = process.platform === "win32" ? "cmd.exe" : "npx";
    const commandArgs = process.platform === "win32" ? ["/c", "npx"] : [];

    try {
      writeFileSync(
        summaryPath,
        JSON.stringify({
          providerDiscoveryMode: "cached",
          readiness: {
            cachedProviderEvidenceFresh: true,
            cachedProviderEvidenceNextStaleName: "provider-visible-tradable-flow",
            cachedProviderEvidenceNextStaleAt: "2026-07-12T13:50:00.000Z",
            cachedProviderEvidenceHoursUntilStale: 16,
            cachedProviderEvidence: [
              {
                name: "provider-visible-tradable-flow",
                staleAt: "2026-07-12T13:50:00.000Z",
                hoursUntilStale: 16,
                fresh: true,
                present: true,
              },
            ],
            providerBackedExchangeReady: false,
            providerMvpTradableFlowReady: false,
            worldCupTeamMatchEventCount: 422,
            usableWorldCupTeamMatchEventCount: 0,
            attachReadyProviderLineCandidateCount: 0,
          },
          blockers: { p0: [], p1: ["provider_mvp_match_snapshot_not_mm_safe"], p2: [] },
          recovery: { providerRefreshCommand: "npm run mobile:internal-readiness-batch:provider-refresh" },
        }),
      );

      execFileSync(
        command,
        [
          ...commandArgs,
          "tsx",
          "scripts/plan_mobile_provider_evidence_refresh.ts",
          `--summaryPath=${summaryPath}`,
          `--output=${outputPath}`,
          "--refreshWindowHours=2",
          "--now=2026-07-12T14:20:00.000Z",
        ],
        { encoding: "utf8" },
      );

      const plan = JSON.parse(readFileSync(outputPath, "utf8"));
      expect(plan.status).toBe("refresh-due");
      expect(plan.shouldRefreshProviderEvidence).toBe(true);
      expect(plan.hoursUntilStale).toBe(-0.5);
      expect(plan.reason).toBe("Cached provider evidence is missing or stale.");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("documents the planner as loop control, not a provider parity pass", () => {
    expect(auditDoc()).toContain("mobile:provider-evidence-plan");
    expect(auditDoc()).toContain("refresh-soon");
    expect(auditDoc()).toContain("It does not call Gamma, CLOB, or backend APIs.");
    expect(functionLog()).toContain("Cycle PROVIDERPLAN - Provider Evidence Refresh Planner");
    expect(functionLog()).toContain("No provider-backed parity feature is marked complete by this planner.");
  });

  it("is consumed by final Definition of Done reporting", () => {
    const sweep = readFileSync("scripts/mobile_definition_of_done_sweep.ts", "utf8");

    expect(sweep).toContain("provider-evidence-refresh-plan.json");
    expect(sweep).toContain("providerPlanStatus");
    expect(sweep).toContain("providerPlanFreshEnough");
    expect(sweep).toContain("do not rerun provider discovery until the plan says refresh-soon/refresh-due");
  });
});
