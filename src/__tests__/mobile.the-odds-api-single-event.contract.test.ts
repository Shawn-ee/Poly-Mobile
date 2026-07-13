import { readFileSync } from "node:fs";
import {
  availableMarketKeysFromResponse,
  normalizeOddsApiEvent,
  quotaCost,
  sanitizeOddsApiPath,
  expandLineMarketsByPoint,
  selectCandidateSoccerSports,
  selectOddsMarkets,
  tomorrowUtcWindow,
} from "@/server/services/theOddsApiSingleEventProvider";
import { buildMobileMarketSourceSummary } from "@/server/services/mobileLiveEventDetail";

describe("The Odds API single-event temporary provider", () => {
  const packageJson = () => readFileSync("package.json", "utf8");
  const script = () => readFileSync("scripts/seed_the_odds_api_single_event.ts", "utf8");
  const liveRuntimeScript = () => readFileSync("scripts/start_holiwyn_one_event_live_runtime.ps1", "utf8");
  const liveRuntimeSecretScript = () =>
    readFileSync("scripts/run_holiwyn_one_event_live_runtime_with_secret.ps1", "utf8");
  const internalTesterRuntimeScript = () => readFileSync("scripts/manage_holiwyn_internal_tester_runtime.ps1", "utf8");
  const oneEventOnboardingScript = () => readFileSync("scripts/onboard_holiwyn_one_event_live_runtime.ps1", "utf8");
  const oneEventSupervisorScript = () => readFileSync("scripts/run_holiwyn_one_event_live_supervisor.ps1", "utf8");
  const runtimeStatusScript = () => readFileSync("scripts/report_odds_api_one_event_runtime_status.ts", "utf8");
  const operatorSnapshotScript = () =>
    readFileSync("scripts/report_holiwyn_internal_tester_operator_snapshot.ts", "utf8");
  const phaseAuditScript = () => readFileSync("scripts/report_odds_api_live_runtime_phase_audit.ts", "utf8");
  const completionAuditScript = () => readFileSync("scripts/report_holiwyn_live_runtime_completion_audit.ts", "utf8");
  const liveReadinessScript = () => readFileSync("scripts/prove_holiwyn_one_event_live_readiness.ps1", "utf8");
  const internalEnvScript = () => readFileSync("scripts/prove_mobile_odds_api_internal_environment.ts", "utf8");
  const routeCounterpartyScript = () => readFileSync("scripts/seed_mobile_route_spread_counterparty.ts", "utf8");
  const service = () => readFileSync("src/server/services/theOddsApiSingleEventProvider.ts", "utf8");
  const lifecycleSchedulerService = () => readFileSync("src/server/services/oneEventLifecycleScheduler.ts", "utf8");

  it("is exposed as an env-var-only script and does not contain a hardcoded API key", () => {
    expect(packageJson()).toContain("mobile:the-odds-api-single-event");
    expect(packageJson()).toContain("mobile:the-odds-api-single-event-flow");
    expect(packageJson()).toContain("mobile:odds-api-internal-env-proof");
    expect(script()).toContain("process.env.THE_ODDS_API_KEY");
    expect(script()).not.toContain("apiKey: \"");
    expect(service()).not.toContain("apiKey: \"");
    expect(script()).not.toContain("THE_ODDS_API_KEY=");
    expect(service()).not.toContain("THE_ODDS_API_KEY=");
    expect(internalEnvScript()).not.toContain("THE_ODDS_API_KEY");
    expect(internalEnvScript()).not.toContain("apiKey: \"");
  });

  it("redacts apiKey from recorded request paths", () => {
    const url = new URL("https://api.the-odds-api.com/v4/sports/soccer_epl/events?id=1&apiKey=secret");
    expect(sanitizeOddsApiPath(url)).toBe("/v4/sports/soccer_epl/events?id=1");
  });

  it("seeds S23 route counterparty liquidity against active tradable outcomes only", () => {
    const source = routeCounterpartyScript();
    expect(source).toContain("outcomes: { where: { isActive: true, isTradable: true }, orderBy: { displayOrder: \"asc\" } }");
    expect(source).toContain("placeOrderAndMatch");
  });

  it("keeps provider outcome seeding repeatable when legacy global slugs collide", () => {
    const source = service();
    expect(source).toContain("export async function outcomeSlugForUpsert");
    expect(source).toContain("findUnique({");
    expect(source).toContain("where: { slug: baseSlug }");
    expect(source).toContain("existing.marketId === marketId && existing.code === outcomeCode");
    expect(source).toContain('return `${baseSlug}-${shortHash(`${marketId}:${outcomeCode}`, 8)}`');
    expect(source).toContain("const slug = await outcomeSlugForUpsert(params.marketId, params.marketSlug, params.spec.code)");
  });

  it("lets cached one-event runtime checks reuse canonical fresh provider proof without spending quota", () => {
    const source = liveRuntimeScript();
    expect(source).toContain("if (-not $RunProviderProof -and -not (Test-Path -LiteralPath $resolvedLiveProofSummaryPath))");
    expect(source).toContain("docs\\mobile\\harness\\odds-api-live-runtime\\one-event-live-runtime-summary.redacted.json");
    expect(source).toContain("$canonicalLiveProofSummaryPath");
  });

  it("exposes explicit one-command onboarding aliases for cached and live-provider runtime proof", () => {
    const pkg = packageJson();
    expect(pkg).toContain("mobile:one-event-onboarding:cached-runtime");
    expect(pkg).toContain("mobile:one-event-onboarding:live-provider-runtime");
    expect(pkg).toContain("-AllowDisconnectedS23 -StartRuntimeLoops -StopRuntimeLoopsAfterProof");
    expect(pkg).toContain("-RunProviderRefresh -StartRuntimeLoops -StopRuntimeLoopsAfterProof");
    expect(pkg).not.toContain("mobile:one-event-onboarding:cached-runtime\": \"powershell -ExecutionPolicy Bypass -File scripts/onboard_holiwyn_one_event_live_runtime.ps1 -RunProviderRefresh");
  });

  it("supports a redacted local secret-file wrapper for live provider refresh", () => {
    const pkg = packageJson();
    const source = liveRuntimeSecretScript();
    const gitignore = readFileSync(".gitignore", "utf8");
    expect(pkg).toContain("mobile:one-event-live-runtime:provider-secret-preflight");
    expect(pkg).toContain("mobile:one-event-live-runtime:provider-secret");
    expect(source).toContain(".runtime\\secrets\\the-odds-api-key.txt");
    expect(source).toContain("providerQuotaUsedByPreflight = $false");
    expect(source).toContain("valuePrinted = $false");
    expect(source).toContain("commandLineContainsSecret = $false");
    expect(source).toContain("start_holiwyn_one_event_live_runtime.ps1");
    expect(source).toContain("-RunProviderProof");
    expect(source).not.toContain("THE_ODDS_API_KEY=");
    expect(source).not.toContain("apiKey:");
    expect(gitignore).toContain(".runtime/");
  });

  it("exposes a redacted no-quota internal tester operator snapshot", () => {
    const pkg = packageJson();
    const source = operatorSnapshotScript();
    expect(pkg).toContain("mobile:internal-tester-operator-snapshot");
    expect(source).toContain("holiwyn-internal-tester-operator-snapshot");
    expect(source).toContain("/api/internal/live-runtime/status");
    expect(source).toContain("providerQuotaUsedByThisReport: false");
    expect(source).toContain("recommendedCommand");
    expect(source).toContain("testerLaunchChecklist");
    expect(source).toContain("manualTradingFlow");
    expect(source).toContain("Cashout/sell");
    expect(source).toContain("Max uses owned shares only");
    expect(source).toContain("provider_secret_exposed");
    expect(source).toContain("does not call providers");
    expect(source).not.toContain("process.env.THE_ODDS_API_KEY");
    expect(source).not.toContain("THE_ODDS_API_KEY=");
  });

  it("gates live-runtime audits on the internal tester operator snapshot", () => {
    expect(phaseAuditScript()).toContain("internalTesterOperatorSnapshot");
    expect(phaseAuditScript()).toContain('id: "internal-tester-operator-snapshot"');
    expect(phaseAuditScript()).toContain("providerQuotaUsedByThisReport");
    expect(phaseAuditScript()).toContain("recommendedCommand");
    expect(completionAuditScript()).toContain("internalTesterOperatorSnapshot");
    expect(completionAuditScript()).toContain("internalTesterOperatorSnapshotKnown");
    expect(completionAuditScript()).toContain("providerQuotaUsedByThisReport");
    expect(completionAuditScript()).toContain("recommendedCommand");
  });

  it("starts managed Expo in server-backed S23 tester mode", () => {
    const source = internalTesterRuntimeScript();
    expect(source).toContain("EXPO_PUBLIC_API_BASE_URL = '$BackendBaseUrl'");
    expect(source).toContain("EXPO_PUBLIC_GOOGLE_AUTH_BASE_URL = '$BackendBaseUrl'");
    expect(source).toContain("EXPO_PUBLIC_ORDER_MODE = 'server'");
    expect(source).toContain("EXPO_PUBLIC_MARKET_DATA_MODE = 'server'");
    expect(source).toContain("EXPO_PUBLIC_SHOW_ORDERBOOK = '0'");
    expect(source).toContain("npm --prefix mobile run start -- --host localhost --port $ExpoPort");
    expect(source).toContain("Invoke-AdbWithTimeout");
    expect(source).toContain("adb timed out after ${TimeoutSeconds}s");
    expect(source).toContain("s23_adb_reverse_failed");
    expect(source).toContain("managerStartedExpoUsesServerMode");
    expect(source).toContain("externalExpoServerModeUnverified");
    expect(source).toContain("external_listener_unverified");
    expect(source).toContain("ReplaceExternalExpo");
    expect(source).toContain("replaceExternalExpoAvailable");
    expect(source).toContain("Use -Force -ReplaceExternalExpo");
    expect(source).toContain("Get-LiveRuntimeStatus");
    expect(source).toContain("Wait-LiveRuntimeWarm");
    expect(source).toContain("live_runtime_status_not_warm_after_loop_start");
    expect(source).toContain("liveRuntimeStatusWarmObserved");
  });

  it("uses bounded actual-serial S23 detection in one-event runtime operator scripts", () => {
    const scripts = [
      internalTesterRuntimeScript(),
      liveRuntimeScript(),
      liveReadinessScript(),
      oneEventOnboardingScript(),
      oneEventSupervisorScript(),
    ];

    for (const source of scripts) {
      expect(source).toContain("Invoke-AdbWithTimeout");
      expect(source).toContain('"devices", "-l"');
      expect(source).toContain("adb timed out after ${TimeoutSeconds}s");
      expect(source).toContain('Where-Object { $_ -match "\\sdevice\\s" }');
      expect(source).toContain("model:SM_S911U1");
      expect(source).toContain("$serial = if ($line -and $line -match");
      expect(source).toContain("deviceId = $serial");
      expect(source).not.toContain('deviceId = if ($line) { "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp" }');
    }
  });

  it("exposes lifecycle timing and mutation truth from the one-event scheduler", () => {
    const source = lifecycleSchedulerService();
    expect(source).toContain("function lifecycleTiming");
    expect(source).toContain("tradingWindow");
    expect(source).toContain("pre_start_suspend_window");
    expect(source).toContain("secondsUntilNextLifecycleAction");
    expect(source).toContain("nextLifecycleActionAt");
    expect(source).toContain("operatorNextAction");
    expect(source).toContain("candidateMarketStatusCounts");
    expect(source).toContain("mutationApplied");
    expect(source).toContain("eventStatus");
    expect(source).toContain("eventLiveStatus");
  });

  it("gates live-runtime audits on managed S23 server-backed startup", () => {
    expect(phaseAuditScript()).toContain('id: "managed-s23-server-mode-startup"');
    expect(phaseAuditScript()).toContain("managedS23ServerModeStartupKnown");
    expect(phaseAuditScript()).toContain("externalExpoServerModeUnverified");
    expect(phaseAuditScript()).toContain("ReplaceExternalExpo");
    expect(completionAuditScript()).toContain("managedS23ServerModeStartupKnown");
    expect(completionAuditScript()).toContain("externalExpoServerModeUnverified");
    expect(completionAuditScript()).toContain("ReplaceExternalExpo");
    expect(completionAuditScript()).toContain("scripts/manage_holiwyn_internal_tester_runtime.ps1");
  });

  it("gates one-event readiness on the fresh S23 close-position cashout proof", () => {
    expect(phaseAuditScript()).toContain("resolveLatestS23VisibleProofPath");
    expect(completionAuditScript()).toContain("resolveLatestS23VisibleProofPath");
    expect(phaseAuditScript()).toContain("isSpainFranceOddsApiVisibleProof");
    expect(completionAuditScript()).toContain("isSpainFranceOddsApiVisibleProof");
    expect(phaseAuditScript()).toContain('eventSlug === "odds-api-single-soccer-test"');
    expect(completionAuditScript()).toContain('eventSlug === "odds-api-single-soccer-test"');
    expect(phaseAuditScript()).toContain('expectedTitle === "Spain vs. France"');
    expect(completionAuditScript()).toContain('expectedTitle === "Spain vs. France"');
    expect(phaseAuditScript()).toContain('getPath(proof, ["selectedMarket", "referenceSource"]) === "sportsbook-odds"');
    expect(completionAuditScript()).toContain('getPath(proof, ["selectedMarket", "referenceSource"]) === "sportsbook-odds"');
    expect(liveReadinessScript()).toContain("Resolve-LatestS23VisibleProofPath");
    expect(phaseAuditScript()).toContain("odds-api-s23-visible-flow\\.json");
    expect(completionAuditScript()).toContain("odds-api-s23-visible-flow\\.json");
    expect(liveReadinessScript()).toContain("*odds-api-s23-visible-flow.json");
    expect(liveReadinessScript()).toContain("cashoutTicketIsClosePositionMode");
    expect(liveReadinessScript()).toContain("cashoutMaxUsesOwnedShares");
    expect(liveReadinessScript()).toContain("cashoutTicketHidesYesNoSelector");
    expect(liveReadinessScript()).toContain("Set-LocalDatabaseEnv");
    expect(phaseAuditScript()).toContain("cashoutTicketIsClosePositionMode");
    expect(phaseAuditScript()).toContain("cashoutMaxUsesOwnedShares");
    expect(phaseAuditScript()).toContain("cashoutTicketHidesYesNoSelector");
    expect(phaseAuditScript()).toContain("s23ProofAgeHours");
    expect(phaseAuditScript()).toContain("maxS23ProofAgeHours");
    expect(completionAuditScript()).toContain("cashoutTicketIsClosePositionMode");
    expect(completionAuditScript()).toContain("cashoutMaxUsesOwnedShares");
    expect(completionAuditScript()).toContain("cashoutTicketHidesYesNoSelector");
    expect(completionAuditScript()).toContain("s23ProofAgeHours");
    expect(completionAuditScript()).toContain("maxS23ProofAgeHours");
    expect(liveReadinessScript()).toContain("s23CashoutClosePositionMode");
    expect(liveReadinessScript()).toContain("s23CashoutMaxUsesOwnedShares");
    expect(liveReadinessScript()).toContain("s23CashoutHidesYesNoSelector");
  });

  it("separates current loop process state from proven runtime capability in one-event status", () => {
    const source = runtimeStatusScript();
    expect(source).toContain("currentManagedProcesses");
    expect(source).toContain("continuityAnswer");
    expect(source).toContain("SUPERVISOR_STATE_PATH");
    expect(source).toContain("RESULT_POLLER_STATE_PATH");
    expect(source).toContain("local .runtime process state plus OS pid check");
    expect(source).toContain("marketMakerContinuousWhileSupervisorRuns");
    expect(source).toContain("installedUnattendedService: false");
    expect(source).toContain("windowsProcessCommandLine");
    expect(source).toContain("run_holiwyn_one_event_live_supervisor.ps1");
    expect(source).toContain("run_holiwyn_one_event_result_poller.ps1");
  });

  it("gates one-event runtime status on fresh trusted-result settlement guard proof", () => {
    const source = runtimeStatusScript();
    expect(source).toContain("maxSettlementProofAgeHours");
    expect(source).toContain("resultSettlementExecutionFresh");
    expect(source).toContain("resultSettlementLiveBlockedFresh");
    expect(source).toContain("resultSettlementGuardFresh");
    expect(source).toContain("rerun_trusted_result_settlement_execution_proof");
    expect(source).toContain("resultSettlementGuardFresh: resultSettlementExecutionFresh && resultSettlementLiveBlockedFresh");
  });

  it("gates phase and completion audits on current loop state plus continuity truth", () => {
    expect(phaseAuditScript()).toContain("runtimeStatusCurrentProcesses");
    expect(phaseAuditScript()).toContain("runtimeStatusContinuityAnswer");
    expect(phaseAuditScript()).toContain("current stopped/running loop truth");
    expect(completionAuditScript()).toContain("currentManagedProcesses");
    expect(completionAuditScript()).toContain("continuityAnswer");
    expect(completionAuditScript()).toContain("currentLoopsQuotaSpending");
  });

  it("limits discovery to preferred active soccer sport keys", () => {
    const sports = selectCandidateSoccerSports([
      { key: "americanfootball_nfl", group: "American Football", active: true },
      { key: "soccer_fifa_world_cup", group: "Soccer", title: "FIFA World Cup", active: true },
      { key: "soccer_usa_mls", group: "Soccer", title: "MLS", active: true },
      { key: "soccer_fifa_world_cup_winner", group: "Soccer", title: "World Cup Winner", active: true, has_outrights: true },
    ]);
    expect(sports.map((sport) => sport.key)).toEqual(["soccer_fifa_world_cup", "soccer_usa_mls"]);
  });

  it("selects only available MVP market keys for the single event", () => {
    const available = availableMarketKeysFromResponse({
      id: "event-1",
      sport_key: "soccer_epl",
      commence_time: "2026-07-12T18:00:00Z",
      home_team: "Home",
      away_team: "Away",
      bookmakers: [
        {
          key: "book",
          title: "Book",
          markets: [
            { key: "h2h" },
            { key: "spreads" },
            { key: "totals" },
            { key: "alternate_totals" },
            { key: "player_shots" },
          ],
        },
      ],
    });
    expect(selectOddsMarkets(available)).toEqual(["h2h", "spreads", "totals", "alternate_totals"]);
  });

  it("normalizes sportsbook odds into backend-shaped market and outcome identities", () => {
    const markets = normalizeOddsApiEvent({
      id: "event-1",
      sport_key: "soccer_epl",
      sport_title: "EPL",
      commence_time: "2026-07-12T18:00:00Z",
      home_team: "France",
      away_team: "Paraguay",
      bookmakers: [
        {
          key: "draftkings",
          title: "DraftKings",
          markets: [
            {
              key: "h2h",
              last_update: "2026-07-11T18:00:00Z",
              outcomes: [
                { name: "France", price: 1.8 },
                { name: "Draw", price: 3.4 },
                { name: "Paraguay", price: 4.8 },
              ],
            },
            {
              key: "spreads",
              last_update: "2026-07-11T18:00:00Z",
              outcomes: [
                { name: "France", price: 1.91, point: -1.5 },
                { name: "Paraguay", price: 1.91, point: 1.5 },
              ],
            },
          ],
        },
      ],
    });
    expect(markets.map((market) => market.marketType)).toEqual(["match_winner_1x2", "spread"]);
    expect(markets[0]?.outcomes).toHaveLength(3);
    expect(markets[1]?.line).toBe(1.5);
    expect(markets[1]?.mobileDisplayPolicy).toMatchObject({ visible: true, reason: "clean_half_goal_spread" });
    expect(markets[1]?.outcomes[0]?.normalizedProbability).toBeGreaterThan(0);
  });

  it("hides raw Asian quarter handicap and total lines from mobile-facing imports", () => {
    const markets = normalizeOddsApiEvent({
      id: "event-raw-lines",
      sport_key: "soccer_epl",
      sport_title: "EPL",
      commence_time: "2026-07-12T18:00:00Z",
      home_team: "France",
      away_team: "Paraguay",
      bookmakers: [
        {
          key: "draftkings",
          title: "DraftKings",
          markets: [
            {
              key: "alternate_spreads",
              outcomes: [
                { name: "France", price: 1.9, point: -0.25 },
                { name: "Paraguay", price: 1.9, point: 0.25 },
                { name: "France", price: 2.1, point: -1.5 },
                { name: "Paraguay", price: 1.7, point: 1.5 },
              ],
            },
            {
              key: "alternate_totals",
              outcomes: [
                { name: "Over", price: 1.9, point: 1.75 },
                { name: "Under", price: 1.9, point: 1.75 },
                { name: "Over", price: 1.8, point: 2 },
                { name: "Under", price: 2, point: 2 },
                { name: "Over", price: 2.05, point: 2.5 },
                { name: "Under", price: 1.75, point: 2.5 },
              ],
            },
          ],
        },
      ],
    });

    expect(markets.map((market) => `${market.marketType}:${market.line}`)).toEqual(["spread:1.5", "total_goals:2.5"]);
    expect(markets.every((market) => market.mobileDisplayPolicy.visible)).toBe(true);
  });

  it("splits alternate line markets into separate selectable line rows", () => {
    const expanded = expandLineMarketsByPoint({
      marketKey: "alternate_totals",
      bookmakerKey: "book",
      bookmakerTitle: "Book",
      lastUpdate: "2026-07-11T18:00:00Z",
      marketType: "total_goals",
      marketGroupKey: "totals",
      marketGroupTitle: "Total Goals",
      title: "Total Goals",
      period: "regulation",
      displayOrder: 40,
      line: null,
      unit: "goals",
      participantName: null,
      mobileDisplayPolicy: {
        visible: true,
        reason: "clean_half_goal_total",
        normalizedLine: null,
        providerMarketType: "alternate_totals",
      },
      outcomes: [
        { code: "over-2-5", name: "Over 2.5", side: "over", decimalOdds: 2, impliedProbability: 0.5, normalizedProbability: 0.25, point: 2.5, description: null },
        { code: "under-2-5", name: "Under 2.5", side: "under", decimalOdds: 1.8, impliedProbability: 0.5556, normalizedProbability: 0.25, point: 2.5, description: null },
        { code: "over-3-5", name: "Over 3.5", side: "over", decimalOdds: 3, impliedProbability: 0.3333, normalizedProbability: 0.25, point: 3.5, description: null },
        { code: "under-3-5", name: "Under 3.5", side: "under", decimalOdds: 1.4, impliedProbability: 0.7143, normalizedProbability: 0.25, point: 3.5, description: null },
      ],
    });
    expect(expanded.map((market) => market.line)).toEqual([2.5, 3.5]);
    expect(expanded.every((market) => market.outcomes.length === 2)).toBe(true);
    expect(expanded.every((market) => market.mobileDisplayPolicy.visible)).toBe(true);
  });

  it("counts The Odds API line markets as approved provider-backed, not contract fixtures", () => {
    const summary = buildMobileMarketSourceSummary([
      {
        marketType: "spread",
        marketGroupKey: "spread",
        marketGroupTitle: "Spread",
        referenceSource: "sportsbook-odds",
        approvedLineProviderReady: true,
      },
    ]);
    expect(summary.sourceBreakdown["sportsbook-odds"]).toBe(1);
    expect(summary.lineMarkets.approvedLineProviderCount).toBe(1);
    expect(summary.lineMarkets.status).toBe("partial-provider-backed");
  });

  it("classifies compact sportsbook-odds lines as provider-backed even without expanded metadata", () => {
    const summary = buildMobileMarketSourceSummary([
      {
        marketType: "spread",
        marketGroupKey: "spread",
        marketGroupTitle: "Spread",
        referenceSource: "sportsbook-odds",
      },
      {
        marketType: "total_goals",
        marketGroupKey: "totals",
        marketGroupTitle: "Total Goals",
        referenceSource: "sportsbook-odds",
      },
      {
        marketType: "match_winner_1x2",
        marketGroupKey: "regulation-winner",
        marketGroupTitle: "Regulation Time Winner",
        referenceSource: "sportsbook-odds",
      },
    ]);
    expect(summary.regulationWinner.status).toBe("provider-backed");
    expect(summary.regulationWinner.providerBackedCount).toBe(1);
    expect(summary.lineMarkets.approvedLineProviderCount).toBe(2);
    expect(summary.lineMarkets.providerAvailability.status).toBe("partial");
  });

  it("parses quota header costs without forcing live network calls in CI", () => {
    expect(quotaCost({ requestsUsed: "10", requestsRemaining: "90", requestsLast: "3" })).toBe(3);
    expect(quotaCost({ requestsUsed: null, requestsRemaining: null, requestsLast: null })).toBe(0);
  });

  it("formats discovery window timestamps in The Odds API's accepted no-millisecond form", () => {
    expect(tomorrowUtcWindow(new Date("2026-07-11T19:00:00.123Z"))).toEqual({
      from: "2026-07-12T00:00:00Z",
      to: "2026-07-13T00:00:00Z",
    });
  });

  it("keeps replay proofs from downgrading market availability and S23 audit evidence", () => {
    expect(script()).toContain("available-markets.redacted.json");
    expect(script()).toContain("readS23ProofSummary");
    expect(script()).toContain("No-quota replay: pass");
    expect(script()).toContain("S23 proof summary");
    expect(script()).not.toContain("availableMarketKeys: [],");
  });

  it("has a repeatable no-quota internal environment proof with required negative cases", () => {
    const proof = internalEnvScript();
    expect(proof).toContain("DEFAULT_FIXTURE_PATH");
    expect(proof).toContain("noProviderApiCalls: true");
    expect(proof).toContain("cannotCashoutWithoutPosition");
    expect(proof).toContain("cannotSellMoreThanOwned");
    expect(proof).toContain("staleOrClosedMarketRejected");
    expect(proof).toContain("missingProviderDataFailsGracefully");
    expect(proof).toContain("GET /api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1");
    expect(proof).toContain("POST /api/orders");
    expect(proof).toContain("GET /api/portfolio/history");
    expect(proof).toContain("one-shot deterministic local maker liquidity");
  });
});
