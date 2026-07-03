import type { PolyApi } from "../api";
import type { EventChartPoint, MarketChartRange } from "../types";
import type { Event, Market } from "../mocks/worldCup";

export const chartRangeForEvent = (event: Event): MarketChartRange => event.status === "live" ? "1D" : "1W";

export const chartMarketForEvent = (event: Event): Market | undefined =>
  event.markets.find((market) => market.type !== "prop" && market.type !== "future") ?? event.markets[0];

export const chartHistoryFromMarketChart = (history: Awaited<ReturnType<PolyApi["getMarketChart"]>>): EventChartPoint[] =>
  history.history.map((point) => ({
    outcomeId: point.outcomeId,
    timestamp: point.timestamp,
    probability: point.probability,
  }));

export const loadMarketChartHistory = async (api: PolyApi, event: Event): Promise<EventChartPoint[]> => {
  const market = chartMarketForEvent(event);
  if (!market) return [];
  const chart = await api.getMarketChart(market.id, chartRangeForEvent(event));
  return chartHistoryFromMarketChart(chart);
};

export const applyChartHistoryToEvent = (event: Event, chartHistory: EventChartPoint[]): Event => {
  if (chartHistory.length === 0) return event;
  return {
    ...event,
    chartHistory,
    chartHistorySource: "market-chart-route",
  };
};
