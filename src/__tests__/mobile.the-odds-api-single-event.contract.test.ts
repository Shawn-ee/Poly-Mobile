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
  const internalTesterRuntimeScript = () => readFileSync("scripts/manage_holiwyn_internal_tester_runtime.ps1", "utf8");
  const phaseAuditScript = () => readFileSync("scripts/report_odds_api_live_runtime_phase_audit.ts", "utf8");
  const completionAuditScript = () => readFileSync("scripts/report_holiwyn_live_runtime_completion_audit.ts", "utf8");
  const internalEnvScript = () => readFileSync("scripts/prove_mobile_odds_api_internal_environment.ts", "utf8");
  const routeCounterpartyScript = () => readFileSync("scripts/seed_mobile_route_spread_counterparty.ts", "utf8");
  const service = () => readFileSync("src/server/services/theOddsApiSingleEventProvider.ts", "utf8");

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

  it("starts managed Expo in server-backed S23 tester mode", () => {
    const source = internalTesterRuntimeScript();
    expect(source).toContain("EXPO_PUBLIC_API_BASE_URL = '$BackendBaseUrl'");
    expect(source).toContain("EXPO_PUBLIC_GOOGLE_AUTH_BASE_URL = '$BackendBaseUrl'");
    expect(source).toContain("EXPO_PUBLIC_ORDER_MODE = 'server'");
    expect(source).toContain("EXPO_PUBLIC_MARKET_DATA_MODE = 'server'");
    expect(source).toContain("EXPO_PUBLIC_SHOW_ORDERBOOK = '0'");
    expect(source).toContain("npm --prefix mobile run start -- --host localhost --port $ExpoPort");
    expect(source).toContain("adb -s $Device.deviceId reverse \"tcp:$port\" \"tcp:$port\"");
    expect(source).toContain("s23_adb_reverse_failed");
    expect(source).toContain("managerStartedExpoUsesServerMode");
    expect(source).toContain("externalExpoServerModeUnverified");
    expect(source).toContain("external_listener_unverified");
    expect(source).toContain("ReplaceExternalExpo");
    expect(source).toContain("replaceExternalExpoAvailable");
    expect(source).toContain("Use -Force -ReplaceExternalExpo");
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
