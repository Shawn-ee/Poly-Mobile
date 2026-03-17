"use client";

import PoolMarketDetail from "@/components/PoolMarketDetail";

type PoolMarket = {
  id: string;
  title: string;
  description: string;
  status: string;
  visibility: "PUBLIC" | "PRIVATE";
  ownerId: string | null;
};

export default function PoolMarketView({ market }: { market: PoolMarket }) {
  return <PoolMarketDetail marketId={market.id} />;
}

