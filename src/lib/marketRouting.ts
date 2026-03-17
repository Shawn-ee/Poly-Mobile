type MarketRoutingLike = {
  visibility?: "PUBLIC" | "PRIVATE" | null;
  mechanism?: "ORDERBOOK" | "POOL" | null;
  kind?: "ORDERBOOK" | "POOL" | null;
};

export const isPublicMarket = (market: MarketRoutingLike) =>
  market.visibility === "PUBLIC";

export const isPrivateMarket = (market: MarketRoutingLike) =>
  market.visibility === "PRIVATE";

export const isPoolMarket = (market: MarketRoutingLike) =>
  market.mechanism === "POOL" || market.kind === "POOL";

export const isOrderbookMarket = (market: MarketRoutingLike) =>
  market.mechanism === "ORDERBOOK";

export const assertMarketRoutingInvariant = (input: {
  visibility: "PUBLIC" | "PRIVATE";
  mechanism: "ORDERBOOK" | "POOL";
}) => {
  if (input.mechanism === "POOL" && input.visibility !== "PRIVATE") {
    throw new Error("POOL markets must be PRIVATE");
  }
  if (input.visibility === "PUBLIC" && input.mechanism === "POOL") {
    throw new Error("PUBLIC markets cannot use POOL mechanism");
  }
};
