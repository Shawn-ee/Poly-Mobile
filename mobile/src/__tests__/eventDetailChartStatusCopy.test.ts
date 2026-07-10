import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const eventDetailSource = () => readFileSync("mobile/src/components/EventDetail.tsx", "utf8");

describe("EventDetail chart status copy", () => {
  test("removes chart route metadata and chart renderer from the Local MVP market page", () => {
    const source = eventDetailSource();

    expect(source).not.toContain("chartSourceLabel");
    expect(source).not.toContain("chartStatusLabel");
    expect(source).not.toContain("event-detail-chart-hidden-local-mvp");
    expect(source).not.toContain("chart-ui-removed-local-mvp");
    expect(source).not.toContain("event-detail-chart-route-state");
    expect(source).not.toContain("event-detail-price-chart");
    expect(source).not.toContain("{renderProbabilityChart()}");
  });
});
