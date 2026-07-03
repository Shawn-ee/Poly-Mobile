import { describe, expect, test, vi } from "vitest";
import type { PolyApi } from "../api";
import { applyChartHistoryToEvent, chartMarketForEvent, chartRangeForEvent, loadMarketChartHistory } from "../services/marketChartService";
import { worldCupEvents } from "../mocks/worldCup";

describe("market chart service", () => {
  test("selects the live primary market and 1D range", () => {
    const event = worldCupEvents.find((item) => item.status === "live");

    expect(event).toBeDefined();
    expect(chartRangeForEvent(event!)).toBe("1D");
    expect(chartMarketForEvent(event!)?.marketType).toBe("moneyline");
  });

  test("loads backend chart history in EventDetail shape", async () => {
    const event = worldCupEvents.find((item) => item.status === "live")!;
    const getMarketChart = vi.fn(async () => ({
      marketId: "france-argentina-live",
      range: "1D" as const,
      ranges: ["1D", "1W", "1M", "MAX"] as const,
      generatedAt: "2026-06-15T12:00:00.000Z",
      lastUpdated: "2026-06-15T11:59:00.000Z",
      emptyState: null,
      outcomes: [{ id: "australia", name: "Australia" }],
      history: [
        { outcomeId: "australia", timestamp: "2026-06-15T11:58:00.000Z", price: 0.41, probability: 41 },
        { outcomeId: "egypt", timestamp: "2026-06-15T11:59:00.000Z", price: 0.59, probability: 59 },
      ],
      series: {},
    }));

    const history = await loadMarketChartHistory({ getMarketChart } as unknown as PolyApi, event);

    expect(getMarketChart).toHaveBeenCalledWith("france-argentina-live", "1D");
    expect(history).toEqual([
      { outcomeId: "australia", timestamp: "2026-06-15T11:58:00.000Z", probability: 41 },
      { outcomeId: "egypt", timestamp: "2026-06-15T11:59:00.000Z", probability: 59 },
    ]);
    const hydrated = applyChartHistoryToEvent(event, history);
    expect(hydrated.chartHistory).toBe(history);
    expect(hydrated.chartHistorySource).toBe("market-chart-route");
  });
});
