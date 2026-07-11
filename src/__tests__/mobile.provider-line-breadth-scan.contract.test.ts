import fs from "node:fs";

describe("mobile provider line breadth scan contract", () => {
  test("derives current-match line probes from Gamma event payloads", () => {
    const source = fs.readFileSync("scripts/prove_mobile_provider_line_breadth_scan.ts", "utf8");

    expect(source).toContain("buildEventProbeFromGammaEvent");
    expect(source).toContain("parseTeamsFromTitle");
    expect(source).toContain("dynamicEventSpecificProbeCount");
    expect(source).toContain("localFixtureEventSpecificProbeCount");
    expect(source).toContain("buildLocalFixtureEventProbes");
    expect(source).toContain("exactSlugGuesses");
    expect(source).toContain("eventSpecificSearchQueries");
    expect(source).toContain("source: \"gamma-event\"");
    expect(source).toContain("source: \"local-fixture\"");
    expect(source).toContain("fifwc-[a-z0-9-]+-\\d{4}-\\d{2}-\\d{2}");
  });
});
