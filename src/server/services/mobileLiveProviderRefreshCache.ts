export function buildMobileLiveProviderRefreshCachePaths(params: {
  eventSlug: string;
  marketIds: string[];
}) {
  const encodedSlug = encodeURIComponent(params.eventSlug);
  const encodedMarketIds = params.marketIds.map((marketId) => encodeURIComponent(marketId));

  return {
    liveDetailPath: `/api/mobile/events/${encodedSlug}/live-detail`,
    eventPath: `/api/events/${encodedSlug}`,
    chartPaths: encodedMarketIds.map((marketId) => `/api/markets/${marketId}/chart`),
    orderbookPaths: encodedMarketIds.map((marketId) => `/api/orderbook/${marketId}/book`),
  };
}
