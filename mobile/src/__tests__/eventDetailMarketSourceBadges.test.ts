import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const eventDetailSource = () => readFileSync("mobile/src/components/EventDetail.tsx", "utf8");

describe("Event Detail market source badges", () => {
  test("keeps visible source labels for provider-backed and local-priced line markets", () => {
    const source = eventDetailSource();

    expect(source).toContain("marketSourceBadge");
    expect(source).toContain("market-source-badge-provider");
    expect(source).toContain("market-source-badge-local");
    expect(source).toContain("event-detail-market-source-");
    expect(source).toContain("Polymarket market");
    expect(source).toContain("Holiwyn line");
    expect(source).toContain("line-market-local-test-fake-token");
    expect(source).toContain('label: "Polymarket"');
    expect(source).toContain('label: "Holiwyn"');
    expect(source).toContain("market-source-polymarket-readable");
    expect(source).toContain("market-source-local-test-readable");
    expect(source).toContain("event-detail-line-source-banner");
    expect(source).toContain("Winner: Polymarket. Lines: Holiwyn pricing.");
    expect(source).toContain("line-source-local-test-fake-token");
    expect(source).toContain("line-provider-availability-");
    expect(source).toContain("line-contract-fixture-count-");
    expect(source).toContain("line-provider-families-");
    expect(source).toContain("line-contract-fixture-families-");
    expect(source).toContain("line-next-provider-action-");
    expect(source).toContain("familyReadiness.map");
    expect(source).toContain("line-family-readiness-${family.family}-${family.status}");
  });
});
