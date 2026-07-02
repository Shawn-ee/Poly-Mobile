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
  samsungServerOrder: "docs/mobile/harness/cycle-current-mobile-samsung-backend-position-order-proof.json",
  androidReadiness: "docs/mobile/harness/cycle-current-android-dev-build-readiness.json",
  samsungApk: "docs/mobile/harness/cycle-current-samsung-apk-smoke.json",
  cleanup: "docs/mobile/harness/cycle-current-mobile-backend-position-order-cleanup-after.json",
  portfolioScreenshot: "docs/mobile/screenshots/cycle-current-holiwyn-server-position-fallback-order-portfolio.png",
  ticketScreenshot: "docs/mobile/screenshots/cycle-current-holiwyn-server-position-fallback-order-ticket.png",
};

const criteria: Criterion[] = [
  {
    id: "dod-android-runtime",
    criterion: "Android app runs reliably on emulator.",
    status: exists(evidence.androidReadiness) ? "partial" : "blocked",
    evidence: [evidence.androidReadiness, evidence.samsungApk],
    notes: "Samsung real-device QA is now the active path; emulator remains known slow/stale and should not be treated as fully reliable yet.",
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
    id: "dod-final-cycle",
    criterion: "Final cycle includes passing required harnesses, final QA report, final review report, final feature gap tracker, screenshots, and no unresolved P0 debt.",
    status: "partial",
    evidence: [evidence.qaReport, evidence.reviewReport, evidence.gapTracker],
    notes: "This sweep is the final-cycle audit artifact, but a dedicated final QA/review signoff and P0 debt closeout still need one more review pass before declaring mission complete.",
  },
  {
    id: "dod-apk-lane",
    criterion: "Samsung QA is moving off Expo Go toward dev build/APK.",
    status: exists(evidence.samsungApk) ? "partial" : "blocked",
    evidence: [evidence.androidReadiness, evidence.samsungApk],
    notes: "APK install/launch harness exists and records apk_missing cleanly; actual APK generation remains the blocker.",
  },
];

const counts = criteria.reduce<Record<Status, number>>(
  (current, item) => {
    current[item.status] += 1;
    return current;
  },
  { verified: 0, partial: 0, blocked: 0 },
);

const readyToDeclareDone = counts.blocked === 0 && counts.partial === 0;
const summary = {
  ready: true,
  readyToDeclareDone,
  counts,
  generatedAt: new Date().toISOString(),
  criteria,
  nextActions: readyToDeclareDone
    ? ["Declare mobile Definition of Done complete."]
    : [
        "Run a final QA/review signoff pass and close or explicitly downgrade remaining P0 debt.",
        "Generate or provide dist/holiwyn-preview.apk, then run npm run smoke:samsung:apk.",
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
