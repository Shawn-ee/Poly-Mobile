import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const eventDetailSource = () => readFileSync("mobile/src/components/EventDetail.tsx", "utf8");

describe("Event Detail market source metadata", () => {
  test("keeps source metadata audit-only instead of visible retail labels", () => {
    const source = eventDetailSource();

    expect(source).toContain("marketSourceBadge");
    expect(source).toContain("market-source-badge-provider");
    expect(source).toContain("market-source-badge-local");
    expect(source).toContain("event-detail-market-source-");
    expect(source).toContain("sourceAuditOnly");
    expect(source).toContain("Polymarket market");
    expect(source).toContain("Holiwyn line");
    expect(source).toContain("line-market-local-test-fake-token");
    expect(source).toContain('label: "Polymarket"');
    expect(source).toContain('label: "Holiwyn"');
    expect(source).toContain("market-source-polymarket-readable");
    expect(source).toContain("market-source-local-test-readable");
    expect(source).toContain("event-detail-line-source-banner");
    expect(source).toContain("lineSourceCompact");
    expect(source).toContain("lineSourceCompactText");
    expect(source).toContain("styles.sourceAuditOnly");
    expect(source).not.toContain("lineSourceBanner:");
    expect(source).not.toContain("lineSourceLabel:");
    expect(source).not.toContain("lineSourceText:");
    expect(source).toContain('label: locale === "zh" ? "来源" : "Source"');
    expect(source).toContain("Winner: Polymarket. Lines: Holiwyn.");
    expect(source).toContain("line-source-local-test-fake-token");
    expect(source).toContain("line-source-approved-provider");
    expect(source).toContain("line-source-polymarket-provider");
    expect(source).toContain("line-provider-availability-");
    expect(source).toContain("line-approved-provider-count-");
    expect(source).toContain("line-contract-fixture-count-");
    expect(source).toContain("line-expected-families-");
    expect(source).toContain("line-provider-families-");
    expect(source).toContain("line-contract-fixture-families-");
    expect(source).toContain("line-provider-unavailable-families-");
    expect(source).toContain("line-fixture-only-families-");
    expect(source).toContain("line-missing-families-");
    expect(source).toContain("line-next-provider-action-");
    expect(source).toContain("familyReadiness.map");
    expect(source).toContain("line-family-readiness-${family.family}-${family.status}");
    expect(source).toContain("line-family-approved-provider-count-${family.family}-${family.approvedLineProviderCount ?? 0}");
    expect(source).toContain("Winner: Polymarket. Lines: Holiwyn.");
    expect(source).toContain("Holiwyn lines.");
    expect(source).toContain("\\u80dc\\u8d1f: Polymarket\\u3002\\u76d8\\u53e3: \\u5229\\u4e91\\u4f53\\u80b2\\u3002");
  });
});
