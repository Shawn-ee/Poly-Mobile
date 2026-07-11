import { readFileSync } from "node:fs";

describe("mobile provider scan depth contracts", () => {
  const matchScanner = () => readFileSync("scripts/scan_polymarket_worldcup_match_events.ts", "utf8");
  const lineScanner = () => readFileSync("scripts/prove_mobile_provider_line_breadth_scan.ts", "utf8");

  it("paginates World Cup match event scans and records whether matches are open or closed", () => {
    const source = matchScanner();

    expect(source).toContain("DEFAULT_PAGES");
    expect(source).toContain("DEFAULT_MATCH_EVENT_EVIDENCE_LIMIT");
    expect(source).toContain('url.searchParams.set("offset"');
    expect(source).toContain("openMatchEventCount");
    expect(source).toContain("closedOrEndedMatchEventCount");
    expect(source).toContain("usableOpenNonMatchWorldCupEventCount");
    expect(source).toContain("usableOpenNonMatchWorldCupEvents");
    expect(source).toContain("isFifaSoccerWorldCupRelevant");
    expect(source).toContain("excludedGenericWorldCupMatchEventCount");
    expect(source).toContain("excludedGenericWorldCupMatchEvents");
    expect(source).toContain("matchEventEvidenceOmittedCount");
    expect(source).toContain("upcomingOrLive");
    expect(source).toContain("isPastDate");
  });

  it("does not treat closed or non-accepting provider line candidates as attach-ready", () => {
    const source = lineScanner();

    expect(source).toContain("DEFAULT_EVENT_TAG_PAGES");
    expect(source).toContain("DEFAULT_DYNAMIC_EVENT_PROBE_LIMIT");
    expect(source).toContain("DEFAULT_EXACT_SLUG_GUESS_LIMIT");
    expect(source).toContain("identityCompleteProviderLineCandidateCount");
    expect(source).toContain("closedOrUnavailableIdentityLineCandidateCount");
    expect(source).toContain("isUsableAttachReadyLineCandidate");
    expect(source).toContain("candidate.acceptingOrders");
    expect(source).toContain("!candidate.closed");
  });
});
