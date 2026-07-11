import fs from "node:fs";
import path from "node:path";

type BlockerPriority = "P0" | "P1" | "P2";

type GapRow = {
  pageFunction: string;
  actualBehavior: string;
  expectedBehavior: string;
  priority: BlockerPriority;
  affectedFilesRoutes: string;
  proofNeeded: string;
  blocksInternalTesting: boolean;
};

type ReadinessSummary = {
  generatedAt?: string;
  backendBaseUrl?: string;
  providerDiscoveryMode?: string;
  outputDir?: string;
  gapListPath?: string;
  readiness?: Record<string, unknown>;
  blockers?: {
    p0?: string[];
    p1?: string[];
    p2?: string[];
  };
  environmentHealth?: {
    git?: {
      branch?: string;
      status?: string;
      worktreeClean?: boolean;
    };
    android?: {
      targetDeviceId?: string;
      targetModel?: string;
      s23Connected?: boolean;
    };
    docker?: {
      polyPostgresHealthy?: boolean;
      polyPostgresStatus?: string;
    };
    localServices?: {
      backendPort3002Listening?: boolean;
      expoRunning?: boolean;
      proofPort8289Listening?: boolean;
    };
    bot?: {
      runningContinuously?: boolean;
    };
  };
  recovery?: {
    s23ProofRefreshCommands?: {
      name?: string;
      summaryPath?: string;
      command?: string;
    }[];
    rerunBatchCommand?: string;
  };
  interpretation?: string;
  nextActions?: string[];
};

const args = new Map<string, string>();
for (const arg of process.argv.slice(2)) {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  if (key && rest.length > 0) {
    args.set(key, rest.join("="));
  }
}

const summaryPath = args.get("summaryPath");
const outputPath = args.get("output");

if (!summaryPath || !outputPath) {
  throw new Error("Usage: tsx scripts/write_mobile_internal_readiness_gap_list.ts --summaryPath=<path> --output=<path>");
}

const repoRoot = path.resolve(__dirname, "..");
const resolvedSummaryPath = path.resolve(repoRoot, summaryPath);
const resolvedOutputPath = path.resolve(repoRoot, outputPath);
const summaryJson = fs.readFileSync(resolvedSummaryPath, "utf8").replace(/^\uFEFF/, "");
const summary = JSON.parse(summaryJson) as ReadinessSummary;

const blockerRows: Record<string, Omit<GapRow, "priority">> = {
  backend_or_local_database_not_ready: {
    pageFunction: "Backend and local database",
    actualBehavior: "Backend health, Docker/Postgres health, or local DB connectivity is not ready.",
    expectedBehavior: "Backend on port 3002 and local Postgres must be reachable before internal MVP testing.",
    affectedFilesRoutes: "`/api/health`; `scripts/mobile_backend_readiness.ps1`; Docker `poly_postgres`.",
    proofNeeded: "`docs/mobile/harness/batch-internal-readiness-latest/mobile-backend-readiness.json` plus batch summary health fields.",
    blocksInternalTesting: true,
  },
  internal_mvp_startup_contract_not_ready: {
    pageFunction: "S23 Local MVP startup command",
    actualBehavior: "The one-command S23 startup contract is missing, failed, starts unexpected processes in proof mode, or emits mismatched mobile/auth callback origins.",
    expectedBehavior: "`npm run mobile:internal-mvp:start` should be backed by a no-start proof that emits matching LAN mobile API/auth origins and an exact Google callback URL.",
    affectedFilesRoutes: "`scripts/start_poly_mobile_rehearsal.ps1`; `scripts/mobile_internal_readiness_batch.ps1`; `package.json` `mobile:internal-mvp:start`.",
    proofNeeded: "`internal-mvp-startup-contract.json` with matching `mobileApiBaseUrl`, `backendAuthBaseUrl`, `expectedGoogleCallback`, no started processes, and no committed secret token.",
    blocksInternalTesting: true,
  },
  local_mvp_match_breadth_not_ready: {
    pageFunction: "Home and Live event discovery",
    actualBehavior: "The Local MVP match-breadth harness could not create or confirm enough route-visible match cards.",
    expectedBehavior: "Home/Live should expose World Cup match cards for the internal retail flow without importing irrelevant provider markets.",
    affectedFilesRoutes: "`/api/events`; `scripts/seed_mobile_mvp_local_match_breadth.ts`; mobile Home/Live feed services.",
    proofNeeded: "`mobile-mvp-local-match-breadth.json` and S23 Home/Live proof after breadth changes.",
    blocksInternalTesting: true,
  },
  local_mvp_route_not_ready: {
    pageFunction: "Event Detail route",
    actualBehavior: "The current mobile MVP event route is missing or not shaped for the ticket flow.",
    expectedBehavior: "`/api/mobile/events/:slug/live-detail` should expose the selected event, outcomes, line markets, and source state.",
    affectedFilesRoutes: "`/api/mobile/events/[slug]/live-detail`; `src/server/services/mobileLiveEventDetail.ts`; `scripts/inspect_mobile_mvp_current_state.ts`.",
    proofNeeded: "`mobile-current-state-inspection.json` and S23 Event Detail proof.",
    blocksInternalTesting: true,
  },
  s23_local_mvp_device_proof_not_ready: {
    pageFunction: "S23 full MVP proof",
    actualBehavior: "One or more committed S23 Local MVP proof summaries is missing, failed, stale, from the wrong device, or references missing artifacts.",
    expectedBehavior: "Committed S23 proofs for filled buy/history, open-order cancel, and cashout/sell should all pass recently on `SM_S911U1`.",
    affectedFilesRoutes: "`docs/mobile/harness/cycle-XG-full-local-mvp-s23-flow`; `cycle-XH-open-order-cancel-s23-flow`; `cycle-XI-cashout-sell-s23-flow`.",
    proofNeeded: "Fresh S23 proof summaries with `result=pass`, `fresh=true`, and referenced artifacts present. Use the generated S23 proof recovery commands below when this gate fails.",
    blocksInternalTesting: true,
  },
  root_typecheck_failed: {
    pageFunction: "Root TypeScript validation",
    actualBehavior: "Root TypeScript validation failed.",
    expectedBehavior: "`npx tsc --noEmit --pretty false --incremental false` must pass.",
    affectedFilesRoutes: "Root TypeScript source and config.",
    proofNeeded: "`root-typecheck.json` with exit code 0.",
    blocksInternalTesting: true,
  },
  jest_ci_failed: {
    pageFunction: "Root CI test suite",
    actualBehavior: "Root CI tests failed.",
    expectedBehavior: "`npm run test:ci` must pass.",
    affectedFilesRoutes: "Root tests, server routes, provider scripts, and shared services.",
    proofNeeded: "`jest-ci.json` with exit code 0.",
    blocksInternalTesting: true,
  },
  mobile_typecheck_failed: {
    pageFunction: "Mobile TypeScript validation",
    actualBehavior: "Mobile typecheck failed.",
    expectedBehavior: "`npm --prefix mobile run typecheck` must pass.",
    affectedFilesRoutes: "`mobile/src`; mobile package TypeScript config.",
    proofNeeded: "`mobile-typecheck.json` with exit code 0.",
    blocksInternalTesting: true,
  },
  provider_worldcup_match_books_unavailable_or_closed: {
    pageFunction: "Provider-backed World Cup match books",
    actualBehavior: "Polymarket-backed World Cup match books are unavailable, closed, not accepting orders, or invalid for local-MM seeding.",
    expectedBehavior: "At least one provider-backed World Cup match market should have a usable accepting-order book before provider-backed match trading is claimed.",
    affectedFilesRoutes: "`scripts/check_poly_internal_exchange_readiness.ts`; `scripts/refresh_reference_snapshots.ts`; Gamma/CLOB provider data; reference snapshots.",
    proofNeeded: "`internal-exchange-readiness.json` showing provider books ready, or explicit unavailable/closed evidence.",
    blocksInternalTesting: false,
  },
  provider_mvp_match_snapshot_not_mm_safe: {
    pageFunction: "Provider-visible tradable match proof",
    actualBehavior: "The selected provider match is visible but its latest provider quote snapshot is not safe for local market-maker quote placement.",
    expectedBehavior: "A provider-backed match should have a fresh non-edge bid/ask snapshot before local-MM fake-token trading is claimed.",
    affectedFilesRoutes: "`scripts/prove_mobile_provider_visible_tradable_flow.ts`; `ReferenceQuoteSnapshot`; `/api/markets/:marketId/quote`; `/api/orders`.",
    proofNeeded: "`provider-visible-tradable-flow.json` with `pass=true`, or the current blocker recorded as provider data debt.",
    blocksInternalTesting: false,
  },
  no_usable_polymarket_worldcup_team_match_books: {
    pageFunction: "Provider World Cup team-match discovery",
    actualBehavior: "The scanner found no usable attach-ready Polymarket World Cup team-match books.",
    expectedBehavior: "Discovery should find match-like provider events only when they are real, relevant, and usable for the MVP path.",
    affectedFilesRoutes: "`scripts/scan_polymarket_worldcup_match_events.ts`; Gamma API; CLOB market data.",
    proofNeeded: "`worldcup-match-event-scan.json` showing at least one usable team-match event.",
    blocksInternalTesting: false,
  },
  no_attach_ready_polymarket_worldcup_line_markets: {
    pageFunction: "Provider line-market discovery",
    actualBehavior: "No attach-ready Polymarket-backed spread, total, team-total, or similar line market is available for the current World Cup match flow.",
    expectedBehavior: "Line-market provider parity should only pass when real provider markets can attach to stable event, market, outcome, and token IDs.",
    affectedFilesRoutes: "`scripts/prove_mobile_provider_line_breadth_scan.ts`; Gamma API; mobile live-detail data contract.",
    proofNeeded: "`provider-line-breadth-scan.json` showing attach-ready line candidates.",
    blocksInternalTesting: false,
  },
  google_redirect_uri_mismatch: {
    pageFunction: "Google/account login",
    actualBehavior: "Google auth preflight reports the emitted redirect URI does not match the configured OAuth callback.",
    expectedBehavior: "The callback URL emitted by the backend should be registered in Google Cloud for real consent testing.",
    affectedFilesRoutes: "`/api/auth/google/start`; `mobile/scripts/google-auth-runtime-preflight.ps1`; Google Cloud OAuth client settings.",
    proofNeeded: "`google-auth-runtime-preflight.json` with matching callback checks.",
    blocksInternalTesting: false,
  },
  google_auth_runtime_preflight_has_warnings: {
    pageFunction: "Google/account login",
    actualBehavior: "Google auth runtime preflight has warnings.",
    expectedBehavior: "Auth preflight should run without warnings before claiming real Google consent readiness.",
    affectedFilesRoutes: "`/api/auth/google/start`; mobile Google auth preflight scripts.",
    proofNeeded: "Runtime preflight JSON with zero failed checks.",
    blocksInternalTesting: false,
  },
  google_physical_callback_not_phone_reachable: {
    pageFunction: "Google/account login on S23",
    actualBehavior: "The physical-device Google callback is not reachable from the phone, commonly because it points at localhost.",
    expectedBehavior: "S23 consent should use a hosted or LAN callback that the phone can open and Google Cloud authorizes.",
    affectedFilesRoutes: "`/api/auth/google/start`; `scripts/mobile_google_lan_auth_preflight.ps1`; local `NEXTAUTH_URL`; Google Cloud OAuth client settings.",
    proofNeeded: "`google-auth-lan-callback-preflight.json` and strict runtime preflight with the LAN/hosted callback.",
    blocksInternalTesting: false,
  },
};

function asArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function boolText(value: unknown): string {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "unknown";
}

function tableCell(value: string): string {
  return value.replace(/\r?\n/g, " ").replace(/\|/g, "\\|");
}

function rowForBlocker(blocker: string, priority: BlockerPriority): GapRow {
  const known = blockerRows[blocker];
  if (known) {
    return { ...known, priority };
  }

  return {
    pageFunction: blocker,
    actualBehavior: `Batch reported blocker \`${blocker}\`.`,
    expectedBehavior: "Investigate the batch output and convert this blocker into a named readiness criterion.",
    priority,
    affectedFilesRoutes: "See `internal-readiness-batch-summary.json` and step logs.",
    proofNeeded: "Updated blocker mapping plus passing batch evidence.",
    blocksInternalTesting: priority === "P0",
  };
}

const p0Rows = asArray(summary.blockers?.p0).map((blocker) => rowForBlocker(blocker, "P0"));
const p1Rows = asArray(summary.blockers?.p1).map((blocker) => rowForBlocker(blocker, "P1"));
const p2Rows = asArray(summary.blockers?.p2).map((blocker) => rowForBlocker(blocker, "P2"));
const rows = [...p0Rows, ...p1Rows, ...p2Rows];

const readiness = summary.readiness ?? {};
const env = summary.environmentHealth ?? {};
const sourceSummaryPath = path.relative(repoRoot, resolvedSummaryPath).replace(/\\/g, "/");
const outputRepoPath = path.relative(repoRoot, resolvedOutputPath).replace(/\\/g, "/");
const branch = env.git?.branch ?? "unknown";
const generatedAt = new Date().toISOString();

const markdown: string[] = [
  "# Batch Internal Readiness Gap List",
  "",
  `Generated: ${generatedAt}`,
  "",
  `Source summary: \`${sourceSummaryPath}\``,
  "",
  `Output: \`${outputRepoPath}\``,
  "",
  `Branch: \`${branch}\``,
  "",
  "Scope: Local MVP retail betting flow only: Home -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token/server-backed order -> Portfolio/history.",
  "",
  "Out of scope: order book UI, chat, live sports statistics, social/watchlist, deposit/withdraw, non-MVP polish, and provider futures/player-prop imports.",
  "",
  "## Overall Status",
  "",
  `- Local MVP internal testing ready: ${boolText(readiness.localMvpReadyForInternalTesting)}`,
  `- Backend health ready: ${boolText(readiness.backendReady)}`,
  `- DB container healthy: ${boolText(readiness.dbContainerHealthy)}`,
  `- S23 connected: ${boolText(readiness.s23Connected)}${env.android?.targetDeviceId ? ` (${env.android.targetDeviceId}, ${env.android.targetModel ?? "unknown model"})` : ""}`,
  `- Expo running: ${boolText(readiness.expoRunning)}`,
  `- Continuous bot running: ${boolText(readiness.botRunningContinuously)}`,
  `- Worktree clean at batch start: ${boolText(readiness.worktreeClean)}`,
  `- Root typecheck: ${boolText(readiness.rootTypecheckReady)}`,
  `- Jest CI: ${boolText(readiness.jestCiReady)}`,
  `- Mobile typecheck: ${boolText(readiness.mobileTypecheckReady)}`,
  `- S23 Local MVP proof ready: ${boolText(readiness.s23LocalMvpDeviceProofReady)}`,
  `- S23 proof max age: ${readiness.s23ProofMaxAgeHours ?? "unknown"} hours`,
  `- S23 startup contract ready: ${boolText(readiness.internalMvpStartupReady)}`,
  `- Provider-backed exchange ready: ${boolText(readiness.providerBackedExchangeReady)}`,
  `- Provider discovery mode: ${summary.providerDiscoveryMode ?? "unknown"}`,
  `- P0 blocker count: ${p0Rows.length}`,
  `- P1 blocker count: ${p1Rows.length}`,
  `- P2 blocker count: ${p2Rows.length}`,
  "",
  "## Current Runtime Snapshot",
  "",
  `- Backend base URL: \`${summary.backendBaseUrl ?? "unknown"}\``,
  `- Mobile-visible events: ${readiness.mobileVisibleEventCount ?? "unknown"}`,
  `- Provider-visible markets: ${readiness.providerVisibleMarketCount ?? "unknown"}`,
  `- Provider local-MM-ready markets: ${readiness.providerLocalMmReadyMarketCount ?? "unknown"}`,
  `- Local MVP match breadth ready: ${boolText(readiness.localMatchBreadthReady)} (${readiness.localMatchBreadthEventCount ?? "unknown"} events)`,
  `- Provider books unavailable or closed: ${boolText(readiness.providerBooksUnavailableOrClosed)}`,
  `- Provider snapshot refresh succeeded: ${boolText(readiness.providerSnapshotRefreshSucceeded)} (${readiness.providerSnapshotRefreshUpdatedCount ?? "unknown"} updated)`,
  `- Provider MVP tradable flow ready: ${boolText(readiness.providerMvpTradableFlowReady)}${readiness.providerMvpTradableFlowBlocker ? ` (${readiness.providerMvpTradableFlowBlocker})` : ""}`,
  `- Usable World Cup team-match provider events: ${readiness.usableWorldCupTeamMatchEventCount ?? "unknown"}`,
  `- Attach-ready provider line candidates: ${readiness.attachReadyProviderLineCandidateCount ?? "unknown"}`,
  `- Internal MVP startup callback: ${readiness.internalMvpStartupExpectedGoogleCallback ? `\`${readiness.internalMvpStartupExpectedGoogleCallback}\`` : "unknown"}`,
  "",
  "## Open Issues",
  "",
];

if (rows.length === 0) {
  markdown.push("No open P0/P1/P2 blockers were reported by the latest batch summary.", "");
} else {
  markdown.push("| Page/function | Actual behavior | Expected behavior | Priority | Affected files/routes | Proof needed | Blocks internal testing? |");
  markdown.push("| --- | --- | --- | --- | --- | --- | --- |");
  for (const row of rows) {
    markdown.push(
      `| ${tableCell(row.pageFunction)} | ${tableCell(row.actualBehavior)} | ${tableCell(row.expectedBehavior)} | ${row.priority} | ${tableCell(row.affectedFilesRoutes)} | ${tableCell(row.proofNeeded)} | ${row.blocksInternalTesting ? "Yes" : "No"} |`,
    );
  }
  markdown.push("");
}

markdown.push(
  "## Passing Gates",
  "",
  "| Gate | Status | Evidence |",
  "| --- | --- | --- |",
  `| Backend and DB | ${boolText(readiness.backendReady && readiness.dbContainerHealthy)} | \`mobile-backend-readiness.json\`; Docker health snapshot. |`,
  `| S23 startup contract | ${boolText(readiness.internalMvpStartupReady)} | \`internal-mvp-startup-contract.json\`. |`,
  `| Local MVP route | ${boolText(readiness.currentRouteLocalMvpReady)} | \`mobile-current-state-inspection.json\`. |`,
  `| Local match breadth | ${boolText(readiness.localMatchBreadthReady)} | \`mobile-mvp-local-match-breadth.json\`. |`,
  `| S23 full MVP proof | ${boolText(readiness.s23LocalMvpDeviceProofReady)} | XG filled buy/history, XH open-order cancel, XI cashout/sell summaries. |`,
  `| Root typecheck | ${boolText(readiness.rootTypecheckReady)} | \`root-typecheck.json\`. |`,
  `| Jest CI | ${boolText(readiness.jestCiReady)} | \`jest-ci.json\`. |`,
  `| Mobile typecheck | ${boolText(readiness.mobileTypecheckReady)} | \`mobile-typecheck.json\`. |`,
  "",
  "## Interpretation",
  "",
  summary.interpretation ?? "No interpretation was provided by the batch summary.",
  "",
  "## S23 Proof Recovery Commands",
  "",
);

const s23ProofRefreshCommands = summary.recovery?.s23ProofRefreshCommands ?? [];
if (s23ProofRefreshCommands.length === 0) {
  markdown.push("No S23 proof recovery commands were provided by the latest batch summary.", "");
} else {
  markdown.push("Run these only when `s23_local_mvp_device_proof_not_ready` is reported, then rerun the batch.");
  markdown.push("");
  for (const proofCommand of s23ProofRefreshCommands) {
    markdown.push(`### ${proofCommand.name ?? "unnamed-proof"}`);
    markdown.push("");
    markdown.push(`Expected summary: \`${proofCommand.summaryPath ?? "unknown"}\``);
    markdown.push("");
    markdown.push("```powershell");
    markdown.push(proofCommand.command ?? "# missing command");
    markdown.push("```");
    markdown.push("");
  }
  if (summary.recovery?.rerunBatchCommand) {
    markdown.push("After refreshing the required S23 proofs:");
    markdown.push("");
    markdown.push("```powershell");
    markdown.push(summary.recovery.rerunBatchCommand);
    markdown.push("```");
    markdown.push("");
  }
}

markdown.push(
  "## Next Actions From Batch",
  "",
);

for (const action of summary.nextActions ?? []) {
  markdown.push(`- ${action}`);
}

markdown.push("");

fs.mkdirSync(path.dirname(resolvedOutputPath), { recursive: true });
fs.writeFileSync(resolvedOutputPath, markdown.join("\n"), "utf8");

console.log(`Wrote ${outputRepoPath}`);
