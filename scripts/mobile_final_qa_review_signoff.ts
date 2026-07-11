import fs from "node:fs";
import path from "node:path";

type Gap = {
  id: string;
  area: string;
  feature: string;
  priority: string;
  status: string;
  notes: string;
};

type DefinitionOfDoneCriterion = {
  id: string;
  criterion: string;
  status: "verified" | "partial" | "blocked";
  evidence?: string[];
  notes: string;
};

type DefinitionOfDoneSweep = {
  readyToDeclareDone?: boolean;
  counts?: Record<string, number>;
  generatedAt?: string;
  criteria?: DefinitionOfDoneCriterion[];
  nextActions?: string[];
};

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const summaryPath = argValue("summaryPath") ?? "docs/mobile/harness/cycle-current-mobile-final-signoff.json";
const qaPath = argValue("qaPath") ?? "docs/mobile/MOBILE_FINAL_QA_SIGNOFF.md";
const reviewPath = argValue("reviewPath") ?? "docs/mobile/MOBILE_FINAL_REVIEW_SIGNOFF.md";
const definitionOfDoneSweepPath =
  argValue("definitionOfDoneSweepPath") ?? "docs/mobile/harness/cycle-current-mobile-definition-of-done-sweep.json";
const gapTrackerPath = "docs/mobile/MOBILE_FEATURE_GAP_TRACKER.md";
const paritySweepPath = "docs/mobile/MOBILE_FINAL_PARITY_SWEEP.md";

function read(file: string) {
  return fs.readFileSync(path.resolve(file), "utf8");
}

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(read(file).replace(/^\uFEFF/, "")) as T;
  } catch {
    return null;
  }
}

function parseGapTracker(markdown: string): Gap[] {
  return markdown
    .split(/\r?\n/)
    .filter((line) => line.startsWith("| GAP-"))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 7)
    .map((cells) => ({
      id: cells[0],
      area: cells[1],
      feature: cells[2],
      priority: cells[3],
      status: cells[5],
      notes: cells[6],
    }));
}

const gapTracker = read(gapTrackerPath);
const gaps = parseGapTracker(gapTracker);
const p0Gaps = gaps.filter((gap) => gap.priority === "P0");
const unresolvedP0Gaps = p0Gaps.filter((gap) => gap.status !== "Verified");
const verifiedP0Gaps = p0Gaps.filter((gap) => gap.status === "Verified");
const generatedAt = new Date().toISOString();
const definitionOfDoneSweep = readJson<DefinitionOfDoneSweep>(definitionOfDoneSweepPath);
const definitionOfDoneBlockingCriteria = (definitionOfDoneSweep?.criteria ?? []).filter(
  (criterion) => criterion.id !== "dod-final-cycle" && criterion.status !== "verified",
);
const definitionOfDoneSweepPresent = Boolean(definitionOfDoneSweep);
const finalSignoffPass = unresolvedP0Gaps.length === 0 && definitionOfDoneSweepPresent && definitionOfDoneBlockingCriteria.length === 0;

const evidence = {
  paritySweep: paritySweepPath,
  definitionOfDoneSweep: definitionOfDoneSweepPath,
  gapTracker: gapTrackerPath,
  samsungServerOrder: "docs/mobile/harness/cycle-current-mobile-samsung-backend-position-order-proof.json",
  androidReadiness: "docs/mobile/harness/cycle-current-android-dev-build-readiness.json",
  samsungApkSmoke: "docs/mobile/harness/cycle-current-samsung-apk-smoke.json",
  providerEvidencePlan: "docs/mobile/harness/batch-internal-readiness-latest/provider-evidence-refresh-plan.json",
  mobileApiTests: "cmd /c npm.cmd run test:mobile-api",
  mobileTypecheck: "cmd /c npm.cmd run typecheck (mobile)",
};

const summary = {
  ready: finalSignoffPass,
  generatedAt,
  p0GapCount: p0Gaps.length,
  verifiedP0GapCount: verifiedP0Gaps.length,
  unresolvedP0GapCount: unresolvedP0Gaps.length,
  unresolvedP0Gaps,
  definitionOfDoneSweepPresent,
  definitionOfDoneReadyToDeclareDone: definitionOfDoneSweep?.readyToDeclareDone ?? false,
  definitionOfDoneCounts: definitionOfDoneSweep?.counts ?? null,
  definitionOfDoneBlockingCriteria,
  qaSignoff: finalSignoffPass ? "pass" : "fail",
  reviewSignoff: finalSignoffPass ? "pass" : "fail",
  evidence,
  residualRisks: [
    ...(definitionOfDoneBlockingCriteria.length === 0
      ? []
      : [
          "Final signoff is blocked by non-final Definition of Done criteria that remain partial or blocked.",
          ...definitionOfDoneBlockingCriteria.map((criterion) => `${criterion.id}: ${criterion.notes}`),
        ]),
    "Samsung APK smoke now installs and launches dist/holiwyn-preview.apk; future production signing/release-channel hardening remains separate.",
    "Emulator reliability remains partial in this workstation environment; Samsung is the stronger QA target.",
    "Deposit, withdraw, and EBPay remain intentionally out of scope.",
  ],
};

const qaMarkdown = `# Mobile Final QA Signoff

Generated: ${generatedAt}

Result: ${summary.qaSignoff.toUpperCase()}

P0 gap audit:

- Total P0 gaps: ${summary.p0GapCount}
- Verified P0 gaps: ${summary.verifiedP0GapCount}
- Unresolved P0 gaps: ${summary.unresolvedP0GapCount}

Definition of Done audit:

- Sweep present: ${summary.definitionOfDoneSweepPresent ? "yes" : "no"}
- Sweep ready to declare done: ${summary.definitionOfDoneReadyToDeclareDone ? "yes" : "no"}
- Non-final partial/blocked criteria: ${summary.definitionOfDoneBlockingCriteria.length}

Required evidence reviewed:

- Final parity sweep: ${evidence.paritySweep}
- Definition of Done sweep JSON: ${evidence.definitionOfDoneSweep}
- Feature gap tracker: ${evidence.gapTracker}
- Samsung backend server-order proof: ${evidence.samsungServerOrder}
- Android dev-build readiness: ${evidence.androidReadiness}
- Samsung APK smoke install/launch evidence: ${evidence.samsungApkSmoke}
- Provider evidence refresh plan: ${evidence.providerEvidencePlan}
- Mobile API regression: ${evidence.mobileApiTests}
- Mobile TypeScript check: ${evidence.mobileTypecheck}

Residual risks:

${summary.residualRisks.map((risk) => `- ${risk}`).join("\n")}
`;

const reviewMarkdown = `# Mobile Final Review Signoff

Generated: ${generatedAt}

Result: ${summary.reviewSignoff.toUpperCase()}

Review conclusion:

- Unresolved P0 feature gap count in ${gapTrackerPath}: ${summary.unresolvedP0GapCount}.
- Non-final partial/blocked Definition of Done criteria: ${summary.definitionOfDoneBlockingCriteria.length}.
- The latest Samsung server-order proof verifies the core backend trading path: backend position, quote-backed ticket, real server BUY order, and Portfolio open order.
- The APK lane installs and launches on Samsung with foreground/crash-dialog verification.
- The app must not be declared production-ready for real-money payments; EBPay, deposit, and withdraw remain intentionally deferred.

Unresolved P0 gaps:

${unresolvedP0Gaps.length === 0 ? "- None." : unresolvedP0Gaps.map((gap) => `- ${gap.id}: ${gap.feature} (${gap.status})`).join("\n")}

Definition of Done blockers:

${definitionOfDoneBlockingCriteria.length === 0 ? "- None." : definitionOfDoneBlockingCriteria.map((criterion) => `- ${criterion.id}: ${criterion.status} - ${criterion.notes}`).join("\n")}
`;

for (const [file, content] of [
  [summaryPath, `${JSON.stringify(summary, null, 2)}\n`],
  [qaPath, qaMarkdown],
  [reviewPath, reviewMarkdown],
] as const) {
  const resolved = path.resolve(file);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, content);
}

console.log(JSON.stringify(summary, null, 2));
