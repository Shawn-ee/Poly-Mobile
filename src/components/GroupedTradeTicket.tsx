"use client";

import { useEffect, useMemo, useState } from "react";

export type SelectedTrade = {
  marketId: string;
  yesOutcomeId: string | null;
  noOutcomeId: string | null;
  outcomeLabel: string;
  tradeOutcome: "YES" | "NO";
  buyYesPrice: number | null;
  buyNoPrice: number | null;
  bestBid: number | null;
  bestAsk: number | null;
  plannedBotBid: number | null;
  plannedBotAsk: number | null;
  probability: number | null;
};

const QUICK_AMOUNTS = [1, 5, 10, 50, 100];

function formatUsd(value: number | null) {
  return value == null || !Number.isFinite(value) ? "--" : `$${value.toFixed(2)}`;
}

function formatPrice(value: number | null) {
  return value == null || !Number.isFinite(value) ? "--" : `${(value * 100).toFixed(1)}¢`;
}

function clampPositive(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function computeDefaultPrice(trade: SelectedTrade): number {
  if (trade.tradeOutcome === "YES") {
    const price =
      trade.bestAsk ??
      trade.plannedBotAsk ??
      trade.buyYesPrice ??
      trade.probability ??
      0.5;
    return Number(price.toFixed(3));
  }
  // NO price
  if (trade.buyNoPrice != null) return trade.buyNoPrice;
  const yesRef =
    trade.bestBid ??
    trade.plannedBotBid ??
    trade.buyYesPrice ??
    trade.probability ??
    0.5;
  return Number((1 - yesRef).toFixed(3));
}

export default function GroupedTradeTicket({
  trade,
  onClose,
  onOrderPlaced,
}: {
  trade: SelectedTrade;
  onClose: () => void;
  onOrderPlaced: () => void;
}) {
  const defaultPrice = useMemo(() => computeDefaultPrice(trade), [trade]);

  const [amountUsd, setAmountUsd] = useState("10");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => res.json().catch(() => null))
      .then((data) => {
        if (!cancelled && data?.user?.id) setUserId(data.user.id);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const parsedAmount = parseFloat(amountUsd) || 0;
  const estimatedShares =
    defaultPrice > 0 && defaultPrice < 1 ? parsedAmount / defaultPrice : 0;
  const maxPayout = estimatedShares;
  const estimatedProfit = clampPositive(maxPayout - parsedAmount);

  const outcomeId =
    trade.tradeOutcome === "YES" ? trade.yesOutcomeId : trade.noOutcomeId;

  const formDisabled =
    submitting ||
    !outcomeId ||
    parsedAmount <= 0 ||
    defaultPrice <= 0.01 ||
    defaultPrice >= 0.99;

  const handleQuickAmount = (delta: number) => {
    const next = clampPositive(parsedAmount + delta);
    setAmountUsd(next.toFixed(2));
  };

  const handleSubmit = async () => {
    if (formDisabled) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          marketId: trade.marketId,
          side: "BUY",
          type: "LIMIT",
          outcomeId,
          price: defaultPrice.toFixed(8),
          size: estimatedShares.toFixed(6),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          data?.error?.message ?? data?.error ?? "Failed to place order",
        );
      }
      setFeedback({
        tone: "success",
        text: `Order placed · ${estimatedShares.toFixed(2)} shares of ${trade.tradeOutcome} @ ${formatPrice(defaultPrice)}`,
      });
      onOrderPlaced();
      // Reset amount for next trade
      setAmountUsd("10");
    } catch (error) {
      setFeedback({
        tone: "error",
        text:
          error instanceof Error ? error.message : "Failed to submit order.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Trade
          </div>
          <h3 className="mt-1 text-lg font-semibold text-neutral-900">
            {trade.outcomeLabel}
          </h3>
          <span
            className={`mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-medium ${
              trade.tradeOutcome === "YES"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            Buy {trade.tradeOutcome}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
          aria-label="Close trade panel"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Price display */}
      <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-neutral-600">Price per share</span>
          <span className="font-semibold text-neutral-900">
            {formatPrice(defaultPrice)}
          </span>
        </div>
        {trade.tradeOutcome === "YES" && trade.bestAsk != null && (
          <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
            <span>Best ask</span>
            <span>{formatPrice(trade.bestAsk)}</span>
          </div>
        )}
        {trade.tradeOutcome === "NO" && trade.bestBid != null && (
          <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
            <span>Best bid (YES)</span>
            <span>
              {formatPrice(trade.bestBid)} → NO {formatPrice(1 - trade.bestBid)}
            </span>
          </div>
        )}
      </div>

      {/* Amount input */}
      <div className="mt-4">
        <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Amount
        </label>
        <div className="mt-1 flex items-center gap-2 rounded-xl border border-neutral-300 px-3 py-2 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400">
          <span className="text-sm text-neutral-500">$</span>
          <input
            value={amountUsd}
            onChange={(event) => setAmountUsd(event.target.value)}
            inputMode="decimal"
            className="w-full bg-transparent text-sm outline-none"
            placeholder="10.00"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((quick) => (
            <button
              key={quick}
              type="button"
              onClick={() => handleQuickAmount(quick)}
              className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-700 transition hover:bg-neutral-100"
            >
              +${quick}
            </button>
          ))}
        </div>
      </div>

      {/* Estimates */}
      <div className="mt-4 space-y-2 rounded-xl border border-neutral-100 bg-neutral-50 p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-neutral-600">Est. shares</span>
          <span className="font-medium text-neutral-900">
            {estimatedShares.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-neutral-600">Max payout</span>
          <span className="font-medium text-neutral-900">
            {formatUsd(maxPayout)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-neutral-600">Max profit</span>
          <span className="font-medium text-emerald-700">
            {formatUsd(estimatedProfit)}
          </span>
        </div>
      </div>

      {/* Beta notice */}
      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-[11px] text-amber-700">
        ⚠️ Internal Beta — Test credits only
      </div>

      {/* Auth / Submit */}
      {!userId ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-sm text-amber-800">
          <a
            href="/login"
            className="font-medium underline underline-offset-2"
          >
            Log in
          </a>{" "}
          to place orders.
        </div>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={formDisabled}
          className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-medium transition ${
            trade.tradeOutcome === "YES"
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-rose-600 text-white hover:bg-rose-700"
          } disabled:cursor-not-allowed disabled:bg-neutral-300`}
        >
          {submitting
            ? "Placing order..."
            : `Buy ${trade.tradeOutcome} · ${formatPrice(defaultPrice)}`}
        </button>
      )}

      {!outcomeId && (
        <p className="mt-2 text-xs text-amber-700">
          This market is missing {trade.tradeOutcome} outcome data. Trading not
          available.
        </p>
      )}
      {feedback && (
        <p
          className={`mt-3 text-sm ${
            feedback.tone === "error" ? "text-rose-700" : "text-emerald-700"
          }`}
        >
          {feedback.text}
        </p>
      )}
    </div>
  );
}
