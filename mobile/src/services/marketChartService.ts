import type { PolyApi } from "../api";
import type { EventChartPoint, MarketChartRange } from "../types";
import type { Event, Market } from "../mocks/worldCup";

export type MarketChartLoadResult = {
  status: "ready" | "empty";
  range: MarketChartRange;
  lastUpdated: string | null;
  emptyState: "no-history" | null;
  chartHistory: EventChartPoint[];
};

export const chartRangeForEvent = (event: Event): MarketChartRange => event.status === "live" ? "1D" : "1W";

export const chartMarketForEvent = (event: Event): Market | undefined =>
  event.markets.find((market) => market.type !== "prop" && market.type !== "future") ?? event.markets[0];

export const chartHistoryFromMarketChart = (history: Awaited<ReturnType<PolyApi["getMarketChart"]>>): EventChartPoint[] =>
  history.history.map((point) => ({
    outcomeId: point.outcomeId,
    timestamp: point.timestamp,
    probability: point.probability,
  }));

export const loadMarketChartState = async (api: PolyApi, event: Event): Promise<MarketChartLoadResult> => {
  const market = chartMarketForEvent(event);
  const range = chartRangeForEvent(event);
  if (!market) return { status: "empty", range, lastUpdated: null, emptyState: "no-history", chartHistory: [] };
  const chart = await api.getMarketChart(market.id, range);
  const chartHistory = chartHistoryFromMarketChart(chart);
  return {
    status: chartHistory.length > 0 ? "ready" : "empty",
    range: chart.range,
    lastUpdated: chart.lastUpdated,
    emptyState: chart.emptyState,
    chartHistory,
  };
};

export const loadMarketChartHistory = async (api: PolyApi, event: Event): Promise<EventChartPoint[]> =>
  (await loadMarketChartState(api, event)).chartHistory;

export const applyChartLoadingToEvent = (event: Event): Event => ({
  ...event,
  chartHistoryStatus: "loading",
  chartHistoryRange: chartRangeForEvent(event),
});

export const applyChartErrorToEvent = (event: Event): Event => ({
  ...event,
  chartHistoryStatus: "error",
  chartHistorySource: event.chartHistorySource ?? "embedded",
});

export const applyChartStateToEvent = (event: Event, result: MarketChartLoadResult): Event => {
  if (result.status === "empty") {
    return {
      ...event,
      chartHistoryStatus: "empty",
      chartHistoryRange: result.range,
      chartHistoryLastUpdated: result.lastUpdated,
      chartHistoryEmptyState: result.emptyState,
    };
  }
  return {
    ...event,
    chartHistory: result.chartHistory,
    chartHistorySource: "market-chart-route",
    chartHistoryStatus: "ready",
    chartHistoryRange: result.range,
    chartHistoryLastUpdated: result.lastUpdated,
    chartHistoryEmptyState: null,
  };
};

export const applyChartHistoryToEvent = (event: Event, chartHistory: EventChartPoint[]): Event =>
  applyChartStateToEvent(event, {
    status: chartHistory.length > 0 ? "ready" : "empty",
    range: chartRangeForEvent(event),
    lastUpdated: null,
    emptyState: chartHistory.length > 0 ? null : "no-history",
    chartHistory,
  });
