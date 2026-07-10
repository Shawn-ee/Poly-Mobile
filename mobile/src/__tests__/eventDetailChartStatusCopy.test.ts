import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const eventDetailSource = () => readFileSync("mobile/src/components/EventDetail.tsx", "utf8");

describe("EventDetail chart status copy", () => {
  test("removes chart route metadata from the rendered Local MVP market page", () => {
    const source = eventDetailSource();

    expect(source).toContain('source === "polymarket-clob-prices-history" ? "History" : "Stale"');
    expect(source).not.toContain("event-detail-chart-hidden-local-mvp");
    expect(source).not.toContain("chart-ui-removed-local-mvp");
    expect(source).not.toContain("{renderProbabilityChart()}");
  });
});
