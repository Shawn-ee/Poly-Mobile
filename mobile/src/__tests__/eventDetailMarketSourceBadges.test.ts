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
    expect(source).toContain("Local test line");
    expect(source).toContain("event-detail-line-source-banner");
    expect(source).toContain("Winner: Polymarket / Lines: local test.");
    expect(source).toContain("line-provider-availability-");
    expect(source).toContain("line-contract-fixture-count-");
    expect(source).toContain("familyReadiness.map");
    expect(source).toContain("line-family-readiness-${family.family}-${family.status}");
  });
});
