"use client";

import { useEffect, useMemo, useState } from "react";

type TicketMarket = {
  id: string;
  title: string;
  status: string;
  outcomes: { id: string; name: string }[];
  pricesByOutcome?: Record<string, number>;
};

type TicketPosition = {
  shares: number;
  reservedShares: number;
} | null;

type SubmitOrderPayload =
  | {
      side: "BUY" | "SELL";
      type: "LIMIT";
      outcomeId: string;
      price: string;
      size: string;
    }
  | {
      side: "BUY";
      type: "MARKET";
      outcomeId: string;
      size: string;
      maxSpend: string;
    }
  | {
      side: "SELL";
      type: "MARKET";
      outcomeId: string;
      size: string;
    };

const QUICK_BUY_AMOUNTS = [1, 5, 10, 100];
const FALLBACK_PRICE = 0.5;

const formatMoney = (value: number | null) =>
  value === null || !Number.isFinite(value) ? "--" : `$${value.toFixed(2)}`;

const formatPrice = (value: number | null) =>
  value === null || !Number.isFinite(value) ? "--" : value.toFixed(2);

const clampPositive = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0);

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function OrderTicket({
  market,
  selectedOutcomeId,
  onSelectedOutcomeIdChange,
  walletBalance,
  position,
  bestBid,
  bestAsk,
  onSubmitOrder,
  marketOrdersSupported,
}: {
  market: TicketMarket;
  selectedOutcomeId: string;
  onSelectedOutcomeIdChange: (outcomeId: string) => void;
  walletBalance: number | null;
  position: TicketPosition;
  bestBid: number | null;
  bestAsk: number | null;
  onSubmitOrder: (payload: SubmitOrderPayload) => Promise<string>;
  marketOrdersSupported: boolean;
}) {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [buyLimitInputMode, setBuyLimitInputMode] = useState<"amount" | "shares">("amount");
  const [amountUsd, setAmountUsd] = useState("10");
  const [shares, setShares] = useState("10");
  const [limitPrice, setLimitPrice] = useState("0.50");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "error" | "success"; text: string } | null>(
    null,
  );

  const selectedOutcome =
    market.outcomes.find((outcome) => outcome.id === selectedOutcomeId) ?? market.outcomes[0] ?? null;

  const selectedDisplayPrice = useMemo(() => {
    if (!selectedOutcome) return FALLBACK_PRICE;
    const fromMarket = market.pricesByOutcome?.[selectedOutcome.id];
    if (typeof fromMarket === "number" && Number.isFinite(fromMarket)) {
      return fromMarket;
    }
    return FALLBACK_PRICE;
  }, [market.pricesByOutcome, selectedOutcome]);

  const estimatedBuyMarketPrice = bestAsk ?? selectedDisplayPrice;
  const estimatedSellMarketPrice = bestBid ?? selectedDisplayPrice;
  const availableShares = clampPositive((position?.shares ?? 0) - (position?.reservedShares ?? 0));
  const marketOpenForTrading = market.status === "LIVE" || market.status === "ACTIVE";

  useEffect(() => {
    if (!selectedOutcome && market.outcomes[0]) {
      onSelectedOutcomeIdChange(market.outcomes[0].id);
    }
  }, [market.outcomes, onSelectedOutcomeIdChange, selectedOutcome]);

  useEffect(() => {
    if (side === "BUY") {
      setLimitPrice(formatPrice(bestAsk ?? selectedDisplayPrice));
    } else {
      setLimitPrice(formatPrice(bestBid ?? selectedDisplayPrice));
    }
  }, [bestAsk, bestBid, selectedDisplayPrice, side]);

  const parsedAmountUsd = parseNumber(amountUsd);
  const parsedShares = parseNumber(shares);
  const parsedLimitPrice = parseNumber(limitPrice);

  const buyLimitEstimatedShares =
    buyLimitInputMode === "amount"
      ? parsedLimitPrice > 0
        ? parsedAmountUsd / parsedLimitPrice
        : 0
      : parsedShares;
  const buyLimitEstimatedCost =
    buyLimitInputMode === "amount" ? parsedAmountUsd : parsedShares * parsedLimitPrice;
  const buyMarketEstimatedShares =
    estimatedBuyMarketPrice > 0 ? parsedAmountUsd / estimatedBuyMarketPrice : 0;
  const buyMarketToWin = buyMarketEstimatedShares * (1 - estimatedBuyMarketPrice);
  const buyLimitToWin = buyLimitEstimatedShares * (1 - parsedLimitPrice);
  const sellMarketReceive = parsedShares * estimatedSellMarketPrice;
  const sellLimitReceive = parsedShares * parsedLimitPrice;

  const selectedOutcomeName = selectedOutcome?.name ?? "Outcome";
  const submitLabel =
    side === "BUY"
      ? orderType === "MARKET"
        ? `Buy ${selectedOutcomeName}`
        : `Place Buy Order`
      : orderType === "MARKET"
        ? `Sell ${selectedOutcomeName}`
        : `Place Sell Order`;

  const formDisabled =
    submitting ||
    !marketOpenForTrading ||
    !selectedOutcome ||
    (orderType === "MARKET" && !marketOrdersSupported) ||
    (side === "BUY" && orderType === "MARKET" && parsedAmountUsd <= 0) ||
    (side === "BUY" && orderType === "LIMIT" && (parsedLimitPrice <= 0 || buyLimitEstimatedShares <= 0)) ||
    (side === "SELL" && orderType === "MARKET" && (parsedShares <= 0 || parsedShares > availableShares)) ||
    (side === "SELL" && orderType === "LIMIT" && (parsedLimitPrice <= 0 || parsedShares <= 0 || parsedShares > availableShares));

  const handleQuickBuy = (delta: number) => {
    const next = clampPositive(parsedAmountUsd + delta);
    setAmountUsd(next.toFixed(2));
  };

  const handleSellPercent = (percent: number) => {
    const nextShares = clampPositive(availableShares * percent);
    setShares(nextShares.toFixed(2));
  };

  const handleSubmit = async () => {
    if (!selectedOutcome) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      let message = "";
      if (side === "BUY" && orderType === "MARKET") {
        message = await onSubmitOrder({
          side: "BUY",
          type: "MARKET",
          outcomeId: selectedOutcome.id,
          size: buyMarketEstimatedShares.toFixed(6),
          maxSpend: parsedAmountUsd.toFixed(6),
        });
      } else if (side === "BUY" && orderType === "LIMIT") {
        const sizeToSend =
          buyLimitInputMode === "amount"
            ? buyLimitEstimatedShares
            : parsedShares;
        message = await onSubmitOrder({
          side: "BUY",
          type: "LIMIT",
          outcomeId: selectedOutcome.id,
          price: parsedLimitPrice.toFixed(8),
          size: sizeToSend.toFixed(6),
        });
      } else if (side === "SELL" && orderType === "MARKET") {
        message = await onSubmitOrder({
          side: "SELL",
          type: "MARKET",
          outcomeId: selectedOutcome.id,
          size: parsedShares.toFixed(6),
        });
      } else {
        message = await onSubmitOrder({
          side: "SELL",
          type: "LIMIT",
          outcomeId: selectedOutcome.id,
          price: parsedLimitPrice.toFixed(8),
          size: parsedShares.toFixed(6),
        });
      }
      setFeedback({ tone: "success", text: message });
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Failed to submit order.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex rounded-xl bg-neutral-100 p-1">
        {(["BUY", "SELL"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setSide(tab)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              side === tab
                ? tab === "BUY"
                  ? "bg-emerald-600 text-white"
                  : "bg-rose-600 text-white"
                : "text-neutral-600"
            }`}
          >
            {tab === "BUY" ? "Buy" : "Sell"}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Order Type
        </label>
        <select
          value={orderType}
          onChange={(event) => setOrderType(event.target.value as "MARKET" | "LIMIT")}
          className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="MARKET" disabled={!marketOrdersSupported}>
            Market{marketOrdersSupported ? "" : " (Unavailable)"}
          </option>
          <option value="LIMIT">Limit</option>
        </select>
      </div>

      <div className="mt-4">
        <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Outcome
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {market.outcomes.map((outcome) => {
            const displayPrice = market.pricesByOutcome?.[outcome.id] ?? (outcome.id === selectedOutcomeId ? selectedDisplayPrice : FALLBACK_PRICE);
            const active = outcome.id === selectedOutcomeId;
            const upperName = outcome.name.trim().toUpperCase();
            const accent =
              upperName === "YES"
                ? active
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : "border-neutral-300 text-neutral-700"
                : upperName === "NO"
                  ? active
                    ? "border-rose-500 bg-rose-50 text-rose-800"
                    : "border-neutral-300 text-neutral-700"
                  : active
                    ? "border-blue-500 bg-blue-50 text-blue-800"
                    : "border-neutral-300 text-neutral-700";
            return (
              <button
                key={outcome.id}
                type="button"
                onClick={() => onSelectedOutcomeIdChange(outcome.id)}
                className={`rounded-xl border px-4 py-3 text-left transition ${accent}`}
              >
                <div className="text-xs font-medium uppercase tracking-wide opacity-70">
                  {outcome.name}
                </div>
                <div className="mt-1 text-lg font-semibold">{formatPrice(displayPrice)}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600">
        <div className="flex items-center justify-between">
          <span>Best bid</span>
          <span>{formatPrice(bestBid)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span>Best ask</span>
          <span>{formatPrice(bestAsk)}</span>
        </div>
        {orderType === "MARKET" ? (
          <div className="mt-2 text-[11px] text-neutral-500">
            Estimates use the current best {side === "BUY" ? "ask" : "bid"} and can move before execution.
          </div>
        ) : null}
      </div>

      {side === "BUY" && orderType === "MARKET" ? (
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Amount in Dollars
            </label>
            <input
              value={amountUsd}
              onChange={(event) => setAmountUsd(event.target.value)}
              inputMode="decimal"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3 text-sm"
              placeholder="10.00"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_BUY_AMOUNTS.map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => handleQuickBuy(quick)}
                className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-700"
              >
                +${quick}
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Estimated shares</span>
              <span>{buyMarketEstimatedShares.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span>To win</span>
              <span>{formatMoney(buyMarketToWin)}</span>
            </div>
          </div>
        </div>
      ) : null}

      {side === "BUY" && orderType === "LIMIT" ? (
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Limit Price
            </label>
            <input
              value={limitPrice}
              onChange={(event) => setLimitPrice(event.target.value)}
              inputMode="decimal"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3 text-sm"
              placeholder="0.50"
            />
          </div>
          <div className="flex rounded-xl bg-neutral-100 p-1">
            {(["amount", "shares"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setBuyLimitInputMode(mode)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm ${
                  buyLimitInputMode === mode ? "bg-white font-medium text-neutral-900 shadow-sm" : "text-neutral-600"
                }`}
              >
                {mode === "amount" ? "Amount" : "Shares"}
              </button>
            ))}
          </div>
          {buyLimitInputMode === "amount" ? (
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Amount
              </label>
              <input
                value={amountUsd}
                onChange={(event) => setAmountUsd(event.target.value)}
                inputMode="decimal"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3 text-sm"
                placeholder="10.00"
              />
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Shares
              </label>
              <input
                value={shares}
                onChange={(event) => setShares(event.target.value)}
                inputMode="decimal"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3 text-sm"
                placeholder="10"
              />
            </div>
          )}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Estimated shares</span>
              <span>{buyLimitEstimatedShares.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span>To win</span>
              <span>{formatMoney(buyLimitToWin)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-neutral-500">
              <span>Estimated cost</span>
              <span>{formatMoney(buyLimitEstimatedCost)}</span>
            </div>
          </div>
        </div>
      ) : null}

      {side === "SELL" && orderType === "MARKET" ? (
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Shares
            </label>
            <input
              value={shares}
              onChange={(event) => setShares(event.target.value)}
              inputMode="decimal"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3 text-sm"
              placeholder="10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSellPercent(0.25)}
              className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-700"
            >
              25%
            </button>
            <button
              type="button"
              onClick={() => handleSellPercent(0.5)}
              className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-700"
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => setShares(availableShares.toFixed(2))}
              className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-700"
            >
              Max
            </button>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Available shares</span>
              <span>{availableShares.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span>You&apos;ll receive</span>
              <span>{formatMoney(sellMarketReceive)}</span>
            </div>
          </div>
        </div>
      ) : null}

      {side === "SELL" && orderType === "LIMIT" ? (
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Limit Price
            </label>
            <input
              value={limitPrice}
              onChange={(event) => setLimitPrice(event.target.value)}
              inputMode="decimal"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3 text-sm"
              placeholder="0.50"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Shares
            </label>
            <input
              value={shares}
              onChange={(event) => setShares(event.target.value)}
              inputMode="decimal"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3 text-sm"
              placeholder="10"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Expiry
            </label>
            <select
              value="never"
              disabled
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3 text-sm text-neutral-500"
            >
              <option value="never">Never</option>
            </select>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Available shares</span>
              <span>{availableShares.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span>You&apos;ll receive</span>
              <span>{formatMoney(sellLimitReceive)}</span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm">
        <div className="flex items-center justify-between">
          <span>Available balance</span>
          <span>{formatMoney(walletBalance)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={formDisabled}
        className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        {submitLabel}
      </button>

      {!marketOrdersSupported && orderType === "MARKET" ? (
        <p className="mt-3 text-sm text-amber-700">
          Market order mode is not available with the current backend configuration.
        </p>
      ) : null}
      {!marketOpenForTrading ? (
        <p className="mt-3 text-sm text-neutral-500">
          This market is not open for trading.
        </p>
      ) : null}
      {feedback ? (
        <p className={`mt-3 text-sm ${feedback.tone === "error" ? "text-rose-700" : "text-emerald-700"}`}>
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
}
