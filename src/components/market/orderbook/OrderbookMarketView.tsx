"use client";

import { useEffect, useMemo, useState } from "react";
import MarketHeader from "@/components/market/shared/MarketHeader";
import OrderTicket from "@/components/market/orderbook/OrderTicket";

type Market = {
  id: string;
  title: string;
  description: string;
  status: string;
  outcomes: { id: string; name: string }[];
  pricesByOutcome?: Record<string, number>;
  event?: {
    slug: string | null;
    title: string;
  } | null;
};

type BookRow = {
  outcomeId: string;
  price: number;
  size: number;
};

type UserOrder = {
  id: string;
  outcomeId: string;
  outcomeName: string;
  side: "BUY" | "SELL";
  price: number;
  amount: number;
  remaining: number;
  status: string;
  createdAt: string;
};

type Trade = {
  id: string;
  executionId?: string;
  marketId?: string;
  outcomeId: string;
  outcomeName?: string;
  outcome: string;
  side: "BUY" | "SELL";
  price: number;
  quantity: number;
  shares: number;
  cost: number;
  createdAt: string;
};

type Position = {
  id: string;
  outcomeId: string;
  outcomeName: string;
  shares: number;
  reservedShares: number;
  avgCost: number;
  realizedPnl?: number;
};

const MAX_LEVELS = 20;
const MAX_TRADES = 100;

export default function OrderbookMarketView({
  market: initialMarket,
}: {
  market: {
    id: string;
    title: string;
    description: string;
    status: string;
  };
}) {
  const marketId = initialMarket.id;
  const [market, setMarket] = useState<Market | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [outcomeId, setOutcomeId] = useState<string>("");
  const [bids, setBids] = useState<BookRow[]>([]);
  const [asks, setAsks] = useState<BookRow[]>([]);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [position, setPosition] = useState<Position | null>(null);
  const [message, setMessage] = useState("");

  const loadWallet = async () => {
    const res = await fetch("/api/wallet/balance");
    if (!res.ok) {
      setWalletBalance(null);
      return;
    }
    const data = await res.json();
    setWalletBalance(typeof data.balance === "number" ? data.balance : 0);
  };

  const loadMarket = async () => {
    const marketRes = await fetch(`/api/markets/${marketId}`);
    if (!marketRes.ok) return;
    const marketData = await marketRes.json();
    const nextMarket = marketData.market as Market;
    setMarket(nextMarket);
    if (!outcomeId && nextMarket.outcomes.length) {
      setOutcomeId(nextMarket.outcomes[0].id);
    }
  };

  const loadBook = async () => {
    const query = outcomeId ? `?outcomeId=${outcomeId}` : "";
    const res = await fetch(`/api/orderbook/${marketId}/book${query}`);
    if (!res.ok) return;
    const data = await res.json();
    setBids(data.bids ?? []);
    setAsks(data.asks ?? []);
  };

  const loadOrders = async () => {
    const res = await fetch(
      `/api/orders?marketId=${encodeURIComponent(marketId)}&status=OPEN,PARTIAL&limit=100`
    );
    if (!res.ok) return;
    const data = await res.json();
    setOrders(
      (data.items ?? []).map((item: {
        id: string;
        outcomeId: string;
        outcomeName: string;
        side: "BUY" | "SELL";
        price: string | number;
        size: string | number;
        remaining: string | number;
        status: string;
        createdAt: string;
      }) => ({
        id: item.id,
        outcomeId: item.outcomeId,
        outcomeName: item.outcomeName,
        side: item.side,
        price: Number(item.price),
        amount: Number(item.size),
        remaining: Number(item.remaining),
        status: item.status,
        createdAt: item.createdAt,
      }))
    );
  };

  const loadTrades = async () => {
    const res = await fetch(`/api/orderbook/${marketId}/trades`);
    if (!res.ok) return;
    const data = await res.json();
    setTrades(data.trades ?? []);
  };

  const loadPosition = async (nextOutcomeId: string) => {
    if (!nextOutcomeId) {
      setPosition(null);
      return;
    }
    const res = await fetch(`/api/markets/${marketId}/positions?outcomeId=${nextOutcomeId}`);
    if (!res.ok) {
      setPosition(null);
      return;
    }
    const data = await res.json();
    setPosition((data.positions?.[0] as Position | undefined) ?? null);
  };

  const loadAll = async () => {
    await Promise.all([loadMarket(), loadWallet(), loadOrders(), loadTrades()]);
    if (outcomeId) {
      await Promise.all([loadBook(), loadPosition(outcomeId)]);
    }
  };

  useEffect(() => {
    loadAll();
  }, [marketId]);

  useEffect(() => {
    if (!outcomeId) return;
    Promise.all([loadBook(), loadPosition(outcomeId)]);
  }, [outcomeId]);

  useEffect(() => {
    if (!outcomeId) return;

    const marketStream = new EventSource(
      `/api/stream/market/${marketId}?outcomeId=${encodeURIComponent(outcomeId)}`
    );
    const handleMarketEvent = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data ?? "{}");
      const nextPayload = payload?.payload;
      if (!nextPayload) return;
      setBids(
        (nextPayload?.topLevels?.bids ?? []).map((row: { outcomeId: string; price: string | number; size: string | number }) => ({
          outcomeId: row.outcomeId,
          price: Number(row.price),
          size: Number(row.size),
        }))
      );
      setAsks(
        (nextPayload?.topLevels?.asks ?? []).map((row: { outcomeId: string; price: string | number; size: string | number }) => ({
          outcomeId: row.outcomeId,
          price: Number(row.price),
          size: Number(row.size),
        }))
      );
      setTrades(
        (nextPayload?.recentTrades ?? []).map(
          (trade: {
            id: string;
            executionId?: string;
            marketId?: string;
            outcomeId: string;
            outcomeName?: string;
            outcome?: string;
            side: "BUY" | "SELL";
            price: string | number;
            quantity: string | number;
            shares?: string | number;
            cost?: string | number;
            createdAt: string;
          }) => ({
            id: trade.id,
            executionId: trade.executionId,
            marketId: trade.marketId,
            outcomeId: trade.outcomeId,
            outcomeName: trade.outcomeName,
            outcome: trade.outcome ?? trade.outcomeName ?? "",
            side: trade.side,
            price: Number(trade.price),
            quantity: Number(trade.quantity),
            shares: Number(trade.shares ?? trade.quantity),
            cost: Number(trade.cost ?? trade.quantity),
            createdAt: trade.createdAt,
          })
        )
      );
    };
    marketStream.addEventListener("quote.snapshot", handleMarketEvent);
    marketStream.addEventListener("quote.updated", handleMarketEvent);

    const userStream = new EventSource(
      `/api/stream/me/orders?marketId=${encodeURIComponent(marketId)}`
    );
    const handleUserEvent = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data ?? "{}");
      const nextPayload = payload?.payload;
      if (!nextPayload) return;
      setOrders(
        (nextPayload?.orders ?? []).map(
          (item: {
            id: string;
            outcomeId: string;
            outcomeName: string;
            side: "BUY" | "SELL";
            price: string | number;
            amount: string | number;
            remaining: string | number;
            status: string;
            createdAt: string;
          }) => ({
            id: item.id,
            outcomeId: item.outcomeId,
            outcomeName: item.outcomeName,
            side: item.side,
            price: Number(item.price),
            amount: Number(item.amount),
            remaining: Number(item.remaining),
            status: item.status,
            createdAt: item.createdAt,
          })
        )
      );
    };
    userStream.addEventListener("account.snapshot", handleUserEvent);
    userStream.addEventListener("account.updated", handleUserEvent);

    return () => {
      marketStream.removeEventListener("quote.snapshot", handleMarketEvent);
      marketStream.removeEventListener("quote.updated", handleMarketEvent);
      userStream.removeEventListener("account.snapshot", handleUserEvent);
      userStream.removeEventListener("account.updated", handleUserEvent);
      marketStream.close();
      userStream.close();
    };
  }, [marketId, outcomeId]);

  const submitOrder = async (payload: {
    side: "BUY" | "SELL";
    type: "LIMIT" | "MARKET";
    outcomeId: string;
    size: string;
    price?: string;
    maxSpend?: string;
  }) => {
    setMessage("");
    const res = await fetch(`/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({ marketId, ...payload }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error?.message ?? data?.error ?? "Failed to place order");
    }
    const order = data?.order;
    const successMessage =
      payload.type === "LIMIT"
        ? `Order placed: ${payload.side} ${Number(order?.size ?? payload.size).toFixed(2)} @ ${Number(
            order?.price ?? payload.price ?? 0,
          ).toFixed(2)} (${order?.status ?? "OPEN"})`
        : `Order placed: ${payload.side} ${Number(order?.size ?? payload.size).toFixed(2)} ${
            selectedOutcome?.name ?? ""
          } (${order?.status ?? "OPEN"})`;
    setMessage(successMessage);
    await loadAll();
    return successMessage;
  };

  const cancelOrder = async (orderId: string) => {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.error?.message ?? data?.error ?? "Failed to cancel order");
      return;
    }
    setMessage("Order canceled.");
    await loadAll();
  };

  const selectedOutcome = useMemo(
    () => market?.outcomes.find((outcome) => outcome.id === outcomeId) ?? null,
    [market, outcomeId]
  );
  const bidsToShow = useMemo(() => bids.slice(0, MAX_LEVELS), [bids]);
  const asksToShow = useMemo(() => asks.slice(0, MAX_LEVELS), [asks]);
  const tradesToShow = useMemo(() => trades.slice(0, MAX_TRADES), [trades]);
  const bidsTrimmed = bids.length > MAX_LEVELS;
  const asksTrimmed = asks.length > MAX_LEVELS;
  const tradesTrimmed = trades.length > MAX_TRADES;
  const selectedOutcomeTrades = useMemo(
    () => trades.filter((trade) => trade.outcomeId === outcomeId),
    [trades, outcomeId]
  );
  const bestBid = bids.length ? bids[0].price : null;
  const bestAsk = asks.length ? asks[0].price : null;
  const lastTradePrice =
    selectedOutcomeTrades.length
      ? selectedOutcomeTrades[0].price
      : null;
  const markPrice =
    bestBid !== null && bestAsk !== null
      ? (bestBid + bestAsk) / 2
      : lastTradePrice ?? bestBid ?? bestAsk ?? null;
  const netShares = position?.shares ?? 0;
  const reservedShares = position?.reservedShares ?? 0;
  const avgCost = position?.avgCost ?? 0;
  const marketValue = markPrice !== null ? netShares * markPrice : null;
  const unrealizedPnl = markPrice !== null ? (markPrice - avgCost) * netShares : null;
  const formatToken = (value: number | null) => (value === null || !Number.isFinite(value) ? "--" : value.toFixed(2));

  if (!market) {
    return <main className="mx-auto max-w-6xl px-4 py-8">Loading market...</main>;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <MarketHeader
        title={market.title}
        description={market.description}
        status={market.status}
        walletBalance={walletBalance}
        event={
          market.event?.slug
            ? {
                slug: market.event.slug,
                title: market.event.title,
              }
            : null
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="text-lg font-semibold">Orderbook Depth</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {market.outcomes.map((outcome) => (
                <button
                  key={outcome.id}
                  onClick={() => setOutcomeId(outcome.id)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    outcome.id === outcomeId
                      ? "border-black bg-black text-white"
                      : "border-neutral-300 text-neutral-700"
                  }`}
                  type="button"
                >
                  {outcome.name}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 text-sm font-medium text-emerald-700">Bids</div>
                <div className="space-y-1 text-sm">
                  {bidsToShow.map((row, idx) => (
                    <div key={`${row.outcomeId}-${row.price}-${idx}`} className="flex justify-between">
                      <span>{row.price.toFixed(2)}</span>
                      <span>{row.size.toFixed(2)}</span>
                    </div>
                  ))}
                  {!bidsToShow.length ? <div className="text-neutral-500">No bids</div> : null}
                  {bidsTrimmed ? (
                    <div className="text-xs text-neutral-500">Showing top 20 levels</div>
                  ) : null}
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm font-medium text-rose-700">Asks</div>
                <div className="space-y-1 text-sm">
                  {asksToShow.map((row, idx) => (
                    <div key={`${row.outcomeId}-${row.price}-${idx}`} className="flex justify-between">
                      <span>{row.price.toFixed(2)}</span>
                      <span>{row.size.toFixed(2)}</span>
                    </div>
                  ))}
                  {!asksToShow.length ? <div className="text-neutral-500">No asks</div> : null}
                  {asksTrimmed ? (
                    <div className="text-xs text-neutral-500">Showing top 20 levels</div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="text-lg font-semibold">Recent Trades</h2>
            <div className="mt-1 text-xs text-neutral-500">Recent trades (max 100)</div>
            <div className="mt-3 max-h-[22rem] overflow-y-auto space-y-2 pr-1 text-sm">
              {tradesToShow.map((trade) => (
                <div key={trade.id} className="flex justify-between border-b border-neutral-100 pb-2">
                  <span>
                    {trade.side.toLowerCase()} {trade.quantity.toFixed(2)} {trade.outcome} @
                    {trade.price.toFixed(2)}
                  </span>
                  <span>{new Date(trade.createdAt).toLocaleString()}</span>
                </div>
              ))}
              {!tradesToShow.length ? <div className="text-neutral-500">No trades yet.</div> : null}
              {tradesTrimmed ? <div className="text-xs text-neutral-500">Showing latest 100 trades</div> : null}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <OrderTicket
            market={market}
            selectedOutcomeId={outcomeId}
            onSelectedOutcomeIdChange={setOutcomeId}
            walletBalance={walletBalance}
            position={
              position
                ? {
                    shares: position.shares,
                    reservedShares: position.reservedShares,
                  }
                : null
            }
            bestBid={bestBid}
            bestAsk={bestAsk}
            onSubmitOrder={submitOrder}
            marketOrdersSupported
          />

          {message ? (
            <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
              {message}
            </div>
          ) : null}

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="text-lg font-semibold">My Position</h2>
            {netShares === 0 && reservedShares === 0 ? (
              <div className="mt-3 text-sm text-neutral-500">No position yet.</div>
            ) : (
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Shares</span>
                  <span>{formatToken(netShares)}</span>
                </div>
                {reservedShares > 0 ? (
                  <div className="flex items-center justify-between">
                    <span>Reserved</span>
                    <span>{formatToken(reservedShares)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <span>Avg Cost</span>
                  <span>{formatToken(avgCost)} / share</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mark Price</span>
                  <span>{formatToken(markPrice)} / share</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Position Value</span>
                  <span>{formatToken(marketValue)} U</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Unrealized P&L</span>
                  <span
                    className={
                      unrealizedPnl !== null
                        ? unrealizedPnl > 0
                          ? "text-emerald-700"
                          : unrealizedPnl < 0
                            ? "text-rose-700"
                            : ""
                        : ""
                    }
                  >
                    {formatToken(unrealizedPnl)} U
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="text-lg font-semibold">My Open Orders</h2>
            <div className="mt-3 space-y-2 text-sm">
              {orders.map((order) => (
                <div key={order.id} className="rounded border border-neutral-200 p-2">
                  <div className="flex items-center justify-between">
                    <span>
                      {order.side} {order.outcomeName} {order.remaining.toFixed(2)}/{order.amount.toFixed(2)} @
                      {order.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="rounded border border-neutral-300 px-2 py-1 text-xs"
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
              {!orders.length ? <div className="text-neutral-500">No open orders.</div> : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

