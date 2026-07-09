import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const eventDetailSource = () => readFileSync("mobile/src/components/EventDetail.tsx", "utf8");

describe("EventDetail chart status copy", () => {
  test("shows historical Polymarket chart data without hiding stale route state", () => {
    const source = eventDetailSource();

    expect(source).toContain('source === "polymarket-clob-prices-history" ? "History" : "Stale"');
    expect(source).toContain("chart-status-${event.chartHistoryStatus");
    expect(source).toContain("chart-source-${event.chartHistorySource");
    expect(source).toContain("chart-provider-status-visible");
  });
});
