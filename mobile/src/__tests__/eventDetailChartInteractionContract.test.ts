import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const eventDetailSource = () => readFileSync("mobile/src/components/EventDetail.tsx", "utf8");
const smokeSource = () => readFileSync("mobile/scripts/smoke.ps1", "utf8");

describe("EventDetail chart interaction contract", () => {
  test("keeps the Local MVP market page chart-free", () => {
    const source = eventDetailSource();

    expect(source).not.toContain('useState<"early" | "mid" | "latest">("latest")');
    expect(source).not.toContain("const selectedHistory = event.chartHistory?.filter");
    expect(source).not.toContain("const selectedHistoryPoint = chartPoints");
    expect(source).not.toContain("compactChartPointTimeLabel");
    expect(source).not.toContain("renderProbabilityChart");
    expect(source).not.toContain("event-detail-chart-hidden-local-mvp");
    expect(source).not.toContain("chart-ui-removed-local-mvp");
    expect(source).not.toContain("{renderProbabilityChart()}");
    expect(source).not.toContain("event-detail-chart-point-");
    expect(source).not.toContain("event-detail-chart-selected-point");
    expect(source).not.toContain("chart-selected-point");
    expect(source).not.toContain("Chart selection");
    expect(source).not.toContain("Polymarket chart");
    expect(source).not.toContain("Target line");
    expect(source).not.toContain("activeLineDetailTab");
    expect(source).not.toContain("event-detail-line-detail-tabs");
    expect(source).not.toContain("event-detail-inline-graph");
    expect(source).not.toContain("Line movement for Team to Advance");
    expect(source).not.toContain("event-detail-inline-order-book");
    expect(source).not.toContain("event-detail-inline-about");
  });

  test("keeps mobile proof harnesses from requiring chart controls", () => {
    const smoke = smokeSource();

    expect(smoke).not.toMatch(/Assert-HierarchyContains[^\n]*event-detail-price-chart/);
    expect(smoke).not.toMatch(/Assert-HierarchyContains[^\n]*event-detail-chart/);
    expect(smoke).not.toMatch(/Assert-HierarchyContains[^\n]*chart-selected/);
    expect(smoke).not.toMatch(/Assert-HierarchyContains[^\n]*chart-filter/);
    expect(smoke).not.toMatch(/Invoke-TapHierarchyNode[^\n]*event-detail-chart/);
    expect(smoke).not.toMatch(/Assert-HierarchyContains[^\n]*Line movement for Team to Advance/);
    expect(smoke).toContain("Assert-HierarchyDoesNotContain");
  });
});
