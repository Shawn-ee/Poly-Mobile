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
  oddsApiSingleEventAudit: "docs/mobile/audits/BATCH_THE_ODDS_API_SINGLE_EVENT.md",
  oddsApiSingleEventSummary: "docs/mobile/harness/the-odds-api-single-event/single-event-summary.redacted.json",
  oddsApiMobileFlowProof: "docs/mobile/harness/the-odds-api-single-event/mobile-flow-proof.redacted.json",
  oddsApiS23Reachability: "docs/mobile/harness/the-odds-api-single-event/s23-device-reachability.redacted.json",
  oddsApiS23VisibleProof: "docs/mobile/harness/cycle-ODDSAPIS23-odds-api-s23-visible-flow/cycle-ODDSAPIS23-odds-api-s23-visible-flow.json",
  oddsApiInternalEnvironmentProof: "docs/mobile/harness/the-odds-api-internal-environment/internal-environment-proof.redacted.json",
  oddsApiLiveRuntimeProof: "docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json",
  oddsApiS23CashoutProof: "docs/mobile/harness/cycle-ZM-spain-france-cashout-s23/cycle-ZM-odds-api-s23-visible-flow.json",
};

const readJson = <T,>(file: string): T | null => {
  try {
    return JSON.parse(fs.readFileSync(path.resolve(file), "utf8").replace(/^\uFEFF/, "")) as T;
  } catch {
    return null;
  }
};

const stripGeneratedAt = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(stripGeneratedAt);
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  const clone: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === "generatedAt") {
      continue;
    }
    clone[key] = stripGeneratedAt(child);
  }
  return clone;
};

const sameJsonIgnoringGeneratedAt = (existingJson: string, nextValue: unknown) => {
  try {
    const existing = JSON.parse(existingJson.replace(/^\uFEFF/, ""));
    return JSON.stringify(stripGeneratedAt(existing)) === JSON.stringify(stripGeneratedAt(nextValue));
  } catch {
    return false;
  }
};

const normalizeGeneratedMarkdownLine = (markdownValue: string) =>
  markdownValue.replace(/^Generated: .+$/m, "Generated: <timestamp>");

const writeJsonIfMeaningfullyChanged = (file: string, value: unknown) => {
  const resolved = path.resolve(file);
  const nextJson = `${JSON.stringify(value, null, 2)}\n`;
  const existingJson = fs.existsSync(resolved) ? fs.readFileSync(resolved, "utf8") : null;
  if (!existingJson || !sameJsonIgnoringGeneratedAt(existingJson, value)) {
    fs.writeFileSync(resolved, nextJson);
  }
};

const writeMarkdownIfMeaningfullyChanged = (file: string, markdownValue: string) => {
  const resolved = path.resolve(file);
  const existingMarkdown = fs.existsSync(resolved) ? fs.readFileSync(resolved, "utf8") : null;
  if (!existingMarkdown || normalizeGeneratedMarkdownLine(existingMarkdown) !== normalizeGeneratedMarkdownLine(markdownValue)) {
    fs.writeFileSync(resolved, markdownValue);
  }
};

const finalSignoff = readJson<{
  qaSignoff?: string;
  reviewSignoff?: string;
  unresolvedP0GapCount?: number;
  definitionOfDoneBlockingCriteria?: { id?: string; status?: string; notes?: string }[];
}>(evidence.finalSignoff);
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
    temporarySportsbookBackendProofReady?: boolean;
    temporarySportsbookBackendProofHoursUntilStale?: number | null;
    temporarySportsbookInternalEnvironmentReady?: boolean;
    temporarySportsbookInternalEnvironmentChecks?: {
      backendHealth?: boolean;
      postgresHealth?: boolean;
      s23Reachable?: boolean;
      homeRouteVisible?: boolean;
      eventDetailVisible?: boolean;
      quoteRouteVisible?: boolean;
      buyOrderFilled?: boolean;
      positionVisibleAfterBuy?: boolean;
      cannotCashoutWithoutPosition?: boolean;
      cannotSellMoreThanOwned?: boolean;
      staleOrClosedMarketRejected?: boolean;
      missingProviderDataFailsGracefully?: boolean;
      cashoutSellFilled?: boolean;
      positionReducedAfterCashout?: boolean;
      buyHistoryVisible?: boolean;
      sellHistoryVisible?: boolean;
      s23VisibleProofFreshEnough?: boolean;
    };
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
const oddsApiSummary = readJson<{
  pass?: boolean;
  mobile?: { sportsbookMarketCount?: number; eventSlug?: string };
}>(evidence.oddsApiSingleEventSummary);
const oddsApiMobileFlowProof = readJson<{
  pass?: boolean;
  checks?: {
    fakeTokenOrderFilled?: boolean;
    portfolioPositionVisible?: boolean;
    historyTradeVisible?: boolean;
  };
}>(evidence.oddsApiMobileFlowProof);
const oddsApiS23Reachability = readJson<{
  pass?: boolean;
  proofLimitations?: string[];
}>(evidence.oddsApiS23Reachability);
const oddsApiS23VisibleProof = readJson<{
  result?: string;
  assertions?: {
    homeShowsTemporarySportsbookEvent?: boolean;
    detailShowsGameLines?: boolean;
    sportsbookSpreadLineVisible?: boolean;
    ticketPreservesSportsbookLineIdentity?: boolean;
    swipeSubmitReachedPortfolio?: boolean;
    portfolioPreservesSportsbookLineIdentity?: boolean;
    cashoutTicketOpened?: boolean;
    cashoutTicketIsClosePositionMode?: boolean;
    cashoutMaxUsesOwnedShares?: boolean;
    cashoutTicketHidesYesNoSelector?: boolean;
    cashoutSellSubmitted?: boolean;
    cashoutHistoryVisible?: boolean;
    historyPreservesSportsbookLineIdentity?: boolean;
  };
}>(evidence.oddsApiS23VisibleProof);
const oddsApiS23CashoutProof = readJson<{
  result?: string;
  assertions?: typeof oddsApiS23VisibleProof extends { assertions?: infer Assertions } ? Assertions : Record<string, boolean | undefined>;
}>(evidence.oddsApiS23CashoutProof);
const oddsApiInternalEnvironmentProof = readJson<{
  pass?: boolean;
  checks?: NonNullable<NonNullable<typeof internalReadiness>["readiness"]>["temporarySportsbookInternalEnvironmentChecks"];
}>(evidence.oddsApiInternalEnvironmentProof);
const oddsApiLiveRuntimeProof = readJson<{
  pass?: boolean;
  checks?: {
    backendHealth?: boolean;
    oneUpcomingProviderEventSelected?: boolean;
    providerLiveRefreshRan?: boolean;
    quotaProtected?: boolean;
    readyAfterRefresh?: boolean;
    homeVisible?: boolean;
    detailVisible?: boolean;
    buyFilled?: boolean;
    portfolioPositionVisible?: boolean;
    noCashoutWithoutPositionRejected?: boolean;
    closedMarketRejectsTrading?: boolean;
    cashoutSellFilled?: boolean;
    historyHasBuyAndSell?: boolean;
  };
}>(evidence.oddsApiLiveRuntimeProof);
const latestOddsApiS23Proof = oddsApiS23CashoutProof ?? oddsApiS23VisibleProof;
const latestOddsApiS23Assertions = latestOddsApiS23Proof?.assertions;
const temporarySportsbookProviderBridgeReady =
  (
    internalReadiness?.readiness?.temporarySportsbookBackendProofReady === true &&
    oddsApiSummary?.pass === true &&
    (oddsApiSummary.mobile?.sportsbookMarketCount ?? 0) > 0 &&
    oddsApiMobileFlowProof?.pass === true &&
    oddsApiMobileFlowProof.checks?.fakeTokenOrderFilled === true &&
    oddsApiMobileFlowProof.checks?.portfolioPositionVisible === true &&
    (
      oddsApiMobileFlowProof.checks?.historyTradeVisible === true ||
      (
        oddsApiMobileFlowProof.checks?.buyHistoryTradeVisible === true &&
        oddsApiMobileFlowProof.checks?.sellHistoryTradeVisible === true
      )
    )
  ) ||
  (
    internalReadiness?.readiness?.temporarySportsbookInternalEnvironmentReady === true &&
    oddsApiInternalEnvironmentProof?.pass === true &&
    oddsApiInternalEnvironmentProof.checks?.backendHealth === true &&
    oddsApiInternalEnvironmentProof.checks?.postgresHealth === true &&
    oddsApiInternalEnvironmentProof.checks?.s23Reachable === true &&
    oddsApiInternalEnvironmentProof.checks?.homeRouteVisible === true &&
    oddsApiInternalEnvironmentProof.checks?.eventDetailVisible === true &&
    oddsApiInternalEnvironmentProof.checks?.quoteRouteVisible === true &&
    oddsApiInternalEnvironmentProof.checks?.buyOrderFilled === true &&
    oddsApiInternalEnvironmentProof.checks?.positionVisibleAfterBuy === true &&
    oddsApiInternalEnvironmentProof.checks?.cannotCashoutWithoutPosition === true &&
    oddsApiInternalEnvironmentProof.checks?.cannotSellMoreThanOwned === true &&
    oddsApiInternalEnvironmentProof.checks?.staleOrClosedMarketRejected === true &&
    oddsApiInternalEnvironmentProof.checks?.missingProviderDataFailsGracefully === true &&
    oddsApiInternalEnvironmentProof.checks?.cashoutSellFilled === true &&
    oddsApiInternalEnvironmentProof.checks?.positionReducedAfterCashout === true &&
    oddsApiInternalEnvironmentProof.checks?.buyHistoryVisible === true &&
    oddsApiInternalEnvironmentProof.checks?.sellHistoryVisible === true &&
    oddsApiInternalEnvironmentProof.checks?.s23VisibleProofFreshEnough === true
  ) ||
  (
    oddsApiLiveRuntimeProof?.pass === true &&
    oddsApiLiveRuntimeProof.checks?.backendHealth === true &&
    oddsApiLiveRuntimeProof.checks?.oneUpcomingProviderEventSelected === true &&
    oddsApiLiveRuntimeProof.checks?.providerLiveRefreshRan === true &&
    oddsApiLiveRuntimeProof.checks?.quotaProtected === true &&
    oddsApiLiveRuntimeProof.checks?.readyAfterRefresh === true &&
    oddsApiLiveRuntimeProof.checks?.homeVisible === true &&
    oddsApiLiveRuntimeProof.checks?.detailVisible === true &&
    oddsApiLiveRuntimeProof.checks?.buyFilled === true &&
    oddsApiLiveRuntimeProof.checks?.portfolioPositionVisible === true &&
    oddsApiLiveRuntimeProof.checks?.noCashoutWithoutPositionRejected === true &&
    oddsApiLiveRuntimeProof.checks?.closedMarketRejectsTrading === true &&
    oddsApiLiveRuntimeProof.checks?.cashoutSellFilled === true &&
    oddsApiLiveRuntimeProof.checks?.historyHasBuyAndSell === true
  );
const temporarySportsbookProviderS23VisibleReady =
  latestOddsApiS23Proof?.result === "pass" &&
  latestOddsApiS23Assertions?.homeShowsTemporarySportsbookEvent === true &&
  latestOddsApiS23Assertions?.detailShowsGameLines === true &&
  (
    latestOddsApiS23Assertions?.sportsbookLineVisible === true ||
    latestOddsApiS23Assertions?.sportsbookSpreadLineVisible === true
  ) &&
  latestOddsApiS23Assertions?.ticketPreservesSportsbookLineIdentity === true &&
  latestOddsApiS23Assertions?.swipeSubmitReachedPortfolio === true &&
  latestOddsApiS23Assertions?.portfolioPreservesSportsbookLineIdentity === true &&
  latestOddsApiS23Assertions?.cashoutTicketOpened === true &&
  latestOddsApiS23Assertions?.cashoutTicketIsClosePositionMode === true &&
  latestOddsApiS23Assertions?.cashoutMaxUsesOwnedShares === true &&
  latestOddsApiS23Assertions?.cashoutTicketHidesYesNoSelector === true &&
  latestOddsApiS23Assertions?.cashoutSellSubmitted === true &&
  latestOddsApiS23Assertions?.cashoutHistoryVisible === true &&
  latestOddsApiS23Assertions?.historyPreservesSportsbookLineIdentity === true;
const temporarySportsbookProviderNeedsVisibleS23 =
  temporarySportsbookProviderBridgeReady &&
  !temporarySportsbookProviderS23VisibleReady &&
  oddsApiS23Reachability?.pass === true &&
  (oddsApiS23Reachability.proofLimitations ?? []).some((item) => item.toLowerCase().includes("not a full visual walkthrough"));
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
const hasCurrentFinalCycleAudit =
  Boolean(finalSignoff) &&
  finalSignoff?.unresolvedP0GapCount === 0 &&
  exists(evidence.finalQaSignoff) &&
  exists(evidence.finalReviewSignoff) &&
  exists(evidence.finalSignoff) &&
  exists(evidence.gapTracker);
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
    id: "dod-temporary-sportsbook-provider-bridge",
    criterion: "Temporary sportsbook provider bridge is available for Local MVP testing without claiming Polymarket-backed parity.",
    status: temporarySportsbookProviderBridgeReady ? "verified" : "partial",
    evidence: [
      evidence.oddsApiSingleEventAudit,
      evidence.oddsApiSingleEventSummary,
      evidence.oddsApiMobileFlowProof,
      evidence.oddsApiS23Reachability,
      evidence.oddsApiS23VisibleProof,
      evidence.oddsApiInternalEnvironmentProof,
      evidence.oddsApiLiveRuntimeProof,
      evidence.oddsApiS23CashoutProof,
    ],
    notes: temporarySportsbookProviderBridgeReady
      ? temporarySportsbookProviderNeedsVisibleS23
        ? "The Odds API single-event bridge is seeded and fake-token order/Portfolio/history proof passed, but S23 evidence is reachability only; run a full visible S23 walkthrough before treating the seeded provider as human-tested UI proof."
        : `The Odds API single-event bridge is seeded and has fresh backend proof, fake-token order, Portfolio/history, and S23 evidence. Backend proof hours until stale: ${internalReadiness?.readiness?.temporarySportsbookBackendProofHoursUntilStale ?? "unknown"}.`
      : "The temporary sportsbook provider bridge is missing, stale, or not fully proven. This does not block Local MVP readiness but should be recovered before using sportsbook-derived markets for manual testing.",
  },
  {
    id: "dod-final-cycle",
    criterion: "Final cycle includes passing required harnesses, final QA report, final review report, final feature gap tracker, screenshots, and no unresolved P0 debt.",
    status: hasCurrentFinalCycleAudit ? "verified" : "partial",
    evidence: [evidence.finalQaSignoff, evidence.finalReviewSignoff, evidence.finalSignoff, evidence.gapTracker],
    notes: hasCurrentFinalCycleAudit
      ? "Final QA/review artifacts exist and the feature tracker has zero unresolved P0 gaps. Overall completion still depends on the separate provider parity criterion."
      : "This sweep is the final-cycle audit artifact, but a dedicated final QA/review artifact set and P0 debt closeout still need one more review pass before declaring mission complete.",
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
              temporarySportsbookProviderNeedsVisibleS23
                ? "Run a focused S23 visible walkthrough for odds-api-single-soccer-test before spending more provider quota or opening another provider-discovery cycle."
                :
              providerPlanFreshEnough
                ? "Keep Local MVP testing on the contract-shaped line-market flow; provider evidence is fresh, so do not rerun provider discovery until the plan says refresh-soon/refresh-due or a real candidate signal appears."
                : `Refresh provider evidence with ${providerEvidencePlan?.providerRefreshCommand ?? "npm run mobile:internal-readiness-batch:provider-refresh"} before making provider-backed parity decisions.`,
            ]),
        ...(hasCurrentFinalCycleAudit ? [] : ["Run a final QA/review signoff pass and close or explicitly downgrade remaining P0 debt."]),
        ...(hasPassingSamsungApkSmoke
          ? ["Keep Samsung APK smoke for install/launch coverage and Samsung server-order proof for the real-device trading regression."]
          : ["Generate or provide dist/holiwyn-preview.apk, then run npm run smoke:samsung:apk."]),
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
writeJsonIfMeaningfullyChanged(summaryPath, summary);
writeMarkdownIfMeaningfullyChanged(reportPath, markdown);
console.log(JSON.stringify(summary, null, 2));
