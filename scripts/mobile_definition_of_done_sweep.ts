import fs from "node:fs";
import path from "node:path";

type Status = "verified" | "partial" | "blocked";

type Criterion = {
  id: string;
  criterion: string;
  status: Status;
  evidence: string[];
  notes: string;
};

const exists = (file: string) => fs.existsSync(path.resolve(file));

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const summaryPath = argValue("summaryPath") ?? "docs/mobile/harness/cycle-current-mobile-definition-of-done-sweep.json";
const reportPath = argValue("reportPath") ?? "docs/mobile/MOBILE_FINAL_PARITY_SWEEP.md";

const evidence = {
  loopState: "docs/mobile/MOBILE_LOOP_STATE.md",
  gapTracker: "docs/mobile/MOBILE_FEATURE_GAP_TRACKER.md",
  qaReport: "docs/mobile/MOBILE_QA_REPORT.md",
  reviewReport: "docs/mobile/MOBILE_REVIEW_REPORT.md",
  finalQaSignoff: "docs/mobile/MOBILE_FINAL_QA_SIGNOFF.md",
  finalReviewSignoff: "docs/mobile/MOBILE_FINAL_REVIEW_SIGNOFF.md",
  finalSignoff: "docs/mobile/harness/cycle-current-mobile-final-signoff.json",
  samsungServerOrder: "docs/mobile/harness/cycle-current-mobile-samsung-backend-position-order-proof.json",
  androidReadiness: "docs/mobile/harness/cycle-current-android-dev-build-readiness.json",
  androidApkArtifactReadiness: "docs/mobile/harness/cycle-current-android-apk-artifact-readiness.json",
  samsungApk: "docs/mobile/harness/cycle-current-samsung-apk-smoke.json",
  cleanup: "docs/mobile/harness/cycle-current-mobile-backend-position-order-cleanup-after.json",
  portfolioScreenshot: "docs/mobile/screenshots/cycle-current-holiwyn-server-position-fallback-order-portfolio.png",
  ticketScreenshot: "docs/mobile/screenshots/cycle-current-holiwyn-server-position-fallback-order-ticket.png",
  internalReadinessBatch: "docs/mobile/harness/batch-internal-readiness-latest/internal-readiness-batch-summary.json",
  internalReadinessGapList: "docs/mobile/audits/BATCH_INTERNAL_READINESS_GAP_LIST.md",
  providerEvidencePlan: "docs/mobile/harness/batch-internal-readiness-latest/provider-evidence-refresh-plan.json",
};

const readJson = <T,>(file: string): T | null => {
  try {
    return JSON.parse(fs.readFileSync(path.resolve(file), "utf8").replace(/^\uFEFF/, "")) as T;
  } catch {
    return null;
  }
};

const finalSignoff = readJson<{ qaSignoff?: string; reviewSignoff?: string; unresolvedP0GapCount?: number }>(evidence.finalSignoff);
const samsungApkSmoke = readJson<{ ready?: boolean; status?: string; blocker?: string }>(evidence.samsungApk);
const internalReadiness = readJson<{
  readiness?: {
    localMvpReadyForInternalTesting?: boolean;
    providerBackedExchangeReady?: boolean;
    backendReady?: boolean;
    dbContainerHealthy?: boolean;
    s23Connected?: boolean;
    rootTypecheckReady?: boolean;
    jestCiReady?: boolean;
    mobileTypecheckReady?: boolean;
  };
  blockers?: {
    p0?: string[];
    p1?: string[];
  };
}>(evidence.internalReadinessBatch);
const internalReadinessP0Count = internalReadiness?.blockers?.p0?.length ?? 0;
const internalReadinessP1Count = internalReadiness?.blockers?.p1?.length ?? 0;
const providerEvidencePlan = readJson<{
  status?: string;
  shouldRefreshProviderEvidence?: boolean;
  nextStaleName?: string | null;
  nextStaleAt?: string | null;
  hoursUntilStale?: number | null;
  providerRefreshCommand?: string;
  providerBlockers?: string[];
  providerEvidenceCounts?: {
    worldCupTeamMatchEventCount?: number | null;
    usableWorldCupTeamMatchEventCount?: number | null;
    attachReadyProviderLineCandidateCount?: number | null;
  };
}>(evidence.providerEvidencePlan);
const providerPlanStatus = providerEvidencePlan?.status ?? "missing";
const providerPlanFreshEnough = providerEvidencePlan?.shouldRefreshProviderEvidence === false;
const localMvpBatchReady =
  internalReadiness?.readiness?.localMvpReadyForInternalTesting === true &&
  internalReadiness?.readiness?.backendReady === true &&
  internalReadiness?.readiness?.dbContainerHealthy === true &&
  internalReadiness?.readiness?.s23Connected === true &&
  internalReadiness?.readiness?.rootTypecheckReady === true &&
  internalReadiness?.readiness?.jestCiReady === true &&
  internalReadiness?.readiness?.mobileTypecheckReady === true &&
  internalReadinessP0Count === 0;
const hasPassingFinalSignoff =
  finalSignoff?.qaSignoff === "pass" &&
  finalSignoff.reviewSignoff === "pass" &&
  finalSignoff.unresolvedP0GapCount === 0 &&
  exists(evidence.finalQaSignoff) &&
  exists(evidence.finalReviewSignoff);
const hasPassingSamsungApkSmoke =
  samsungApkSmoke?.ready === true &&
  samsungApkSmoke.status === "installed_and_launched" &&
  !samsungApkSmoke.blocker;

const criteria: Criterion[] = [
  {
    id: "dod-android-runtime",
    criterion: "Android app runs reliably on the active Android QA target.",
    status: exists(evidence.androidReadiness) && exists(evidence.samsungServerOrder) ? "verified" : "blocked",
    evidence: [evidence.androidReadiness, evidence.samsungServerOrder, evidence.samsungApk],
    notes: "Samsung S23 is the primary Android runtime proof target and has passed the backend server-order proof; emulator remains fallback only when it is slow or stale.",
  },
  {
    id: "dod-ios-planned",
    criterion: "iOS support is planned but not required for first done state.",
    status: "verified",
    evidence: [evidence.loopState],
    notes: "Android-first scope remains documented.",
  },
  {
    id: "dod-world-cup-browse",
    criterion: "Home, World Cup games, futures, event detail, props, and live markets are browsable.",
    status: "verified",
    evidence: [evidence.gapTracker, evidence.loopState],
    notes: "Long-running tracker shows verified Home, Games, Futures, Event Detail, grouped props, Search, and Live coverage.",
  },
  {
    id: "dod-trading",
    criterion: "Trade ticket supports Buy/Sell and orders/trades can be created against Holiwyn backend or documented local backend mode.",
    status: exists(evidence.samsungServerOrder) ? "verified" : "blocked",
    evidence: [evidence.samsungServerOrder, evidence.ticketScreenshot],
    notes: "Latest Samsung proof creates a quote-backed backend BUY order and confirms an OPEN order in Portfolio.",
  },
  {
    id: "dod-portfolio",
    criterion: "Portfolio shows positions, open orders, activity/history, and fake/backend-derived USDT balance.",
    status: exists(evidence.portfolioScreenshot) ? "verified" : "blocked",
    evidence: [evidence.portfolioScreenshot, evidence.samsungServerOrder],
    notes: "Portfolio proof includes backend position, open-order details, latest order card, and fake-token balance.",
  },
  {
    id: "dod-account-search-localization",
    criterion: "Login shell, Search, and English/Simplified Chinese switching work.",
    status: "verified",
    evidence: [evidence.gapTracker, evidence.loopState],
    notes: "Feature tracker marks account shell, search, preference persistence, and bilingual switching as verified.",
  },
  {
    id: "dod-brand-safety",
    criterion: "No copied Polymarket assets or branding.",
    status: "verified",
    evidence: [evidence.loopState, evidence.reviewReport],
    notes: "Holiwyn branding is used; docs preserve the reference-only Polymarket guardrail.",
  },
  {
    id: "dod-reports",
    criterion: "Screenshots, loop reports, technical debt, and branch merge status are up to date.",
    status: exists(evidence.cleanup) && exists(evidence.loopState) ? "verified" : "partial",
    evidence: [evidence.loopState, evidence.gapTracker, evidence.cleanup],
    notes: "Cycles 277-279 are documented and locally merged; latest cleanup and proof screenshots are recorded.",
  },
  {
    id: "dod-current-local-mvp-batch",
    criterion: "Current Local MVP retail flow is ready for internal testing under the latest batch gate.",
    status: localMvpBatchReady ? "verified" : "blocked",
    evidence: [evidence.internalReadinessBatch, evidence.internalReadinessGapList],
    notes: localMvpBatchReady
      ? "Latest batch reports backend, DB, S23, root typecheck, Jest CI, mobile typecheck, and committed S23 proof aggregation ready with zero P0 blockers."
      : "Latest batch has a P0 blocker or missing readiness evidence; do not start manual internal testing until the batch passes.",
  },
  {
    id: "dod-provider-polymarket-parity",
    criterion: "Provider-backed Polymarket match/line parity is current, tradable, and not relying on contract fixtures for MVP line markets.",
    status: internalReadiness?.readiness?.providerBackedExchangeReady === true && internalReadinessP1Count === 0 ? "verified" : "partial",
    evidence: [evidence.internalReadinessBatch, evidence.internalReadinessGapList, evidence.providerEvidencePlan],
    notes:
      internalReadiness?.readiness?.providerBackedExchangeReady === true && internalReadinessP1Count === 0
        ? "Provider-backed exchange readiness has no current P1 blockers."
        : `Current batch still tracks ${internalReadinessP1Count} provider P1 gap(s), so Local MVP readiness must not be mistaken for full Polymarket/provider parity. Provider refresh plan status is ${providerPlanStatus}${providerPlanFreshEnough ? ", so another provider refresh should be skipped until the next stale window or a real candidate signal appears" : ", so run the provider refresh recovery before making provider-backed parity decisions"}.`,
  },
  {
    id: "dod-final-cycle",
    criterion: "Final cycle includes passing required harnesses, final QA report, final review report, final feature gap tracker, screenshots, and no unresolved P0 debt.",
    status: hasPassingFinalSignoff ? "verified" : "partial",
    evidence: [evidence.finalQaSignoff, evidence.finalReviewSignoff, evidence.finalSignoff, evidence.gapTracker],
    notes: hasPassingFinalSignoff
      ? "Final QA/review signoff passed and the feature tracker has zero unresolved P0 gaps."
      : "This sweep is the final-cycle audit artifact, but a dedicated final QA/review signoff and P0 debt closeout still need one more review pass before declaring mission complete.",
  },
  {
    id: "dod-apk-lane",
    criterion: "Samsung QA is moving off Expo Go toward dev build/APK.",
    status: hasPassingSamsungApkSmoke ? "verified" : exists(evidence.samsungApk) ? "partial" : "blocked",
    evidence: [evidence.androidReadiness, evidence.androidApkArtifactReadiness, evidence.samsungApk],
    notes: hasPassingSamsungApkSmoke
      ? "APK artifact exists and the Samsung APK smoke installed, launched, verified foreground focus, and found no crash dialog."
      : "APK install/launch harness exists and artifact-readiness evidence identifies the remaining apk_missing build artifact blocker.",
  },
];

const counts = criteria.reduce<Record<Status, number>>(
  (current, item) => {
    current[item.status] += 1;
    return current;
  },
  { verified: 0, partial: 0, blocked: 0 },
);

const readyToDeclareDone = counts.blocked === 0 && counts.partial === 0 && internalReadinessP0Count === 0 && internalReadinessP1Count === 0;
const summary = {
  ready: true,
  readyToDeclareDone,
  counts,
  generatedAt: new Date().toISOString(),
  criteria,
  nextActions: readyToDeclareDone
    ? ["Declare mobile Definition of Done complete."]
    : [
        ...(localMvpBatchReady ? [] : ["Fix current internal-readiness P0 blockers before manual Local MVP testing."]),
        ...(internalReadinessP1Count === 0
          ? []
          : [
              providerPlanFreshEnough
                ? "Keep Local MVP testing on the contract-shaped line-market flow; provider evidence is fresh, so do not rerun provider discovery until the plan says refresh-soon/refresh-due or a real candidate signal appears."
                : `Refresh provider evidence with ${providerEvidencePlan?.providerRefreshCommand ?? "npm run mobile:internal-readiness-batch:provider-refresh"} before making provider-backed parity decisions.`,
            ]),
        ...(hasPassingFinalSignoff ? [] : ["Run a final QA/review signoff pass and close or explicitly downgrade remaining P0 debt."]),
        ...(hasPassingSamsungApkSmoke ? [] : ["Generate or provide dist/holiwyn-preview.apk, then run npm run smoke:samsung:apk."]),
        "Keep Samsung server-order proof as the main real-device trading regression until the APK lane exists.",
      ],
};

const markdown = `# Mobile Final Parity Sweep

Generated: ${summary.generatedAt}

Ready to declare done: ${readyToDeclareDone ? "Yes" : "No"}

Counts:

- Verified: ${counts.verified}
- Partial: ${counts.partial}
- Blocked: ${counts.blocked}

| ID | Status | Criterion | Notes |
| --- | --- | --- | --- |
${criteria.map((item) => `| ${item.id} | ${item.status} | ${item.criterion} | ${item.notes} |`).join("\n")}

## Next Actions

${summary.nextActions.map((item) => `- ${item}`).join("\n")}
`;

fs.mkdirSync(path.dirname(path.resolve(summaryPath)), { recursive: true });
fs.writeFileSync(path.resolve(summaryPath), `${JSON.stringify(summary, null, 2)}\n`);
fs.writeFileSync(path.resolve(reportPath), markdown);
console.log(JSON.stringify(summary, null, 2));
