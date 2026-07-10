import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const eventDetailSource = () => readFileSync("mobile/src/components/EventDetail.tsx", "utf8");

describe("EventDetail chart interaction contract", () => {
  test("keeps chart-history internals unrendered while the visible market-page chart is disabled", () => {
    const source = eventDetailSource();

    expect(source).toContain('useState<"early" | "mid" | "latest">("latest")');
    expect(source).toContain("const selectedHistory = event.chartHistory?.filter");
    expect(source).toContain("const selectedHistoryPoint = chartPoints");
    expect(source).toContain("compactChartPointTimeLabel");
    expect(source).not.toContain("event-detail-chart-hidden-local-mvp");
    expect(source).not.toContain("chart-ui-removed-local-mvp");
    expect(source).not.toContain("{renderProbabilityChart()}");
    expect(source).toContain("event-detail-chart-point-");
    expect(source).toContain("event-detail-chart-selected-point-${selectedChartPoint}");
    expect(source).toContain("chart-selected-point-${selectedChartPoint}");
    expect(source).toContain("Latest");
    expect(source).toContain("Mid");
    expect(source).toContain("Earlier");
    expect(source).not.toContain("Target line");
  });
});
