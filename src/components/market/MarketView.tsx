"use client";

import OrderbookMarketView from "@/components/market/orderbook/OrderbookMarketView";
import PoolMarketView from "@/components/market/pool/PoolMarketView";

type MarketViewMarket = {
  id: string;
  mechanism: "ORDERBOOK" | "POOL";
  visibility: "PUBLIC" | "PRIVATE";
  status: string;
  ownerId: string | null;
  title: string;
  description: string;
};

export default function MarketView({ market }: { market: MarketViewMarket }) {
  if (market.mechanism === "POOL") {
    return <PoolMarketView market={market} />;
  }

  return <OrderbookMarketView market={market} />;
}

