import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const eventDetailSource = () => readFileSync("mobile/src/components/EventDetail.tsx", "utf8");

describe("EventDetail chart interaction contract", () => {
  test("uses real chart history points for the visible chart readout", () => {
    const source = eventDetailSource();

    expect(source).toContain('useState<"early" | "mid" | "latest">("latest")');
    expect(source).toContain("const selectedHistory = event.chartHistory?.filter");
    expect(source).toContain("const selectedHistoryPoint = chartPoints");
    expect(source).toContain("compactChartPointTimeLabel");
    expect(source).toContain("event-detail-chart-point-");
    expect(source).toContain("event-detail-chart-selected-point-${selectedChartPoint}");
    expect(source).toContain("chart-selected-point-${selectedChartPoint}");
    expect(source).toContain("Latest");
    expect(source).toContain("Mid");
    expect(source).toContain("Earlier");
    expect(source).not.toContain("Target line");
  });
});
