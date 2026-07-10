import { readFileSync } from "node:fs";

const sourceProbe = () => readFileSync("scripts/prove_mobile_provider_line_source_probe.ts", "utf8");
const availabilityProbe = () => readFileSync("scripts/prove_mobile_provider_line_market_availability.ts", "utf8");
const breadthScan = () => readFileSync("scripts/prove_mobile_provider_line_breadth_scan.ts", "utf8");

describe("mobile provider line-market proof scripts", () => {
  test("default to the current Local MVP match instead of stale provider events", () => {
    for (const source of [sourceProbe(), availabilityProbe()]) {
      expect(source).toContain('const DEFAULT_PROVIDER_EVENT_SLUG = "fifwc-arg-egy-2026-07-07";');
      expect(source).toContain("deriveTeamContext");
      expect(source).toContain("homeTeam: args.homeTeam");
      expect(source).toContain("awayTeam: args.awayTeam");
      expect(source).not.toContain('const DEFAULT_PROVIDER_EVENT_SLUG = "fifwc-col-gha-2026-07-03";');
      expect(source).not.toContain('home: "Colombia"');
      expect(source).not.toContain('away: "Ghana"');
    }
  });

  test("line-source probe includes current team names in search and slug guesses", () => {
    const source = sourceProbe();

    expect(source).toContain("const teamPair = `${homeTeam} ${awayTeam}`;");
    expect(source).toContain("`${teamPair} spread`");
    expect(source).toContain("`${teamPair} total goals`");
    expect(source).toContain("`${slug}-${teamContext.homeCode}-spread`");
    expect(source).toContain("`${slug}-${teamContext.awayCode}-team-total`");
    expect(source).toContain("teamContext");
  });

  test("line breadth scan records diagnostics for line-oriented query misses", () => {
    const source = breadthScan();

    expect(source).toContain("lineQueryFamilySummary");
    expect(source).toContain("lineQueryOtherCandidateSamples");
    expect(source).toContain("lineQueryOtherCandidateSampleCount");
    expect(source).toContain("candidateDiagnostic");
    expect(source).toContain("no_attach_ready_world_cup_line_markets_found_keep_local_contract_fixtures_for_mvp");
  });
});
