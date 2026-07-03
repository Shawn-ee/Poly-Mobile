import type { PolyApi } from "../api";
import type { OrderbookBookLevel } from "../types";
import type { Event, Market } from "../mocks/worldCup";

export type MarketDepthLoadResult = {
  status: "ready" | "empty";
  marketId: string | null;
  lastUpdated: string | null;
  emptyState: "no-depth" | null;
  levels: OrderbookBookLevel[];
};

export const depthMarketForEvent = (event: Event): Market | undefined =>
  event.markets.find((market) => market.type !== "prop" && market.type !== "future") ?? event.markets[0];

export const loadMarketDepthState = async (api: PolyApi, event: Event): Promise<MarketDepthLoadResult> => {
  const market = depthMarketForEvent(event);
  if (!market) {
    return { status: "empty", marketId: null, lastUpdated: null, emptyState: "no-depth", levels: [] };
  }
  const book = await api.getOrderbook(market.id, { maxLevels: 24 });
  return {
    status: book.levels.length > 0 ? "ready" : "empty",
    marketId: book.marketId,
    lastUpdated: book.generatedAt,
    emptyState: book.emptyState,
    levels: book.levels,
  };
};

export const applyDepthLoadingToEvent = (event: Event): Event => ({
  ...event,
  orderbookDepthStatus: "loading",
});

export const applyDepthErrorToEvent = (event: Event): Event => ({
  ...event,
  orderbookDepthStatus: "error",
  orderbookDepthSource: event.orderbookDepthSource ?? "embedded",
});

export const applyDepthStateToEvent = (event: Event, result: MarketDepthLoadResult): Event => {
  if (result.status === "empty" || !result.marketId) {
    return {
      ...event,
      orderbookDepthStatus: "empty",
      orderbookDepthLastUpdated: result.lastUpdated,
      orderbookDepthEmptyState: result.emptyState,
    };
  }

  return {
    ...event,
    orderbookDepthSource: "orderbook-route",
    orderbookDepthStatus: "ready",
    orderbookDepthLastUpdated: result.lastUpdated,
    orderbookDepthEmptyState: null,
    markets: event.markets.map((market) =>
      market.id === result.marketId
        ? {
            ...market,
            orderbookDepth: result.levels.map((level) => ({
              outcomeId: level.outcomeId,
              side: level.side,
              price: level.price,
              shares: level.shares,
              total: level.total,
            })),
          }
        : market,
    ),
  };
};

