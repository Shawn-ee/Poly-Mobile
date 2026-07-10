import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const eventDetailSource = () => readFileSync("mobile/src/components/EventDetail.tsx", "utf8");

describe("EventDetail chart status copy", () => {
  test("keeps chart route metadata hidden after removing the visible market-page chart", () => {
    const source = eventDetailSource();

    expect(source).toContain('source === "polymarket-clob-prices-history" ? "History" : "Stale"');
    expect(source).toContain("chart-status-${event.chartHistoryStatus");
    expect(source).toContain("chart-source-${event.chartHistorySource");
    expect(source).toContain("event-detail-chart-hidden-local-mvp");
    expect(source).toContain("chart-ui-removed-local-mvp");
    expect(source).not.toContain("{renderProbabilityChart()}");
  });
});
