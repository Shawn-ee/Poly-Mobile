"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PoolMarketItem = {
  id: string;
  title: string;
  status: string;
  betCloseTime: string | null;
  resolveTime: string | null;
  resolvedOutcomeId: string | null;
  outcomes: { id: string; name: string }[];
  totalPot: number;
  participants: number;
};

type JoinedMarketItem = PoolMarketItem & {
  myBet: {
    outcomeId: string;
    outcomeName: string;
    amount: number;
  };
  isOwner: boolean;
};

export default function MyPoolsPage() {
  const [owned, setOwned] = useState<PoolMarketItem[]>([]);
  const [joined, setJoined] = useState<JoinedMarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/pool-markets/mine");
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(data?.error ?? "Failed to load private markets.");
      return;
    }
    setOwned(data.owned ?? []);
    setJoined(data.joined ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const cancelMarket = async (marketId: string) => {
    setMessage("");
    const ok = window.confirm("Cancel this market and refund all participants?");
    if (!ok) return;
    const res = await fetch(`/api/pool-markets/${marketId}/cancel`, {
      method: "POST",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.error ?? "Failed to cancel market.");
      return;
    }
    setMessage("Market canceled and refunded.");
    await load();
  };

  const resolveLabel = (market: PoolMarketItem) => {
    if (!market.resolveTime) return "Resolve";
    const resolveAt = new Date(market.resolveTime).getTime();
    return Date.now() >= resolveAt ? "Resolve now" : "Resolve";
  };

  if (loading) {
    return <main className="mx-auto max-w-5xl px-4 py-8">Loading private markets...</main>;
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">My private markets</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Manage private pool markets you created or joined.
      </p>
      {message ? (
        <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
          {message}
        </div>
      ) : null}

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Owned by you</h2>
          <Link
            href="/create"
            className="rounded-md border border-neutral-300 px-3 py-1 text-sm text-neutral-700"
          >
            Create new
          </Link>
        </div>
        {owned.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-4 text-sm text-neutral-600">
            No owned private markets yet.
          </div>
        ) : (
          <div className="space-y-3">
            {owned.map((market) => (
              <div
                key={market.id}
                className="rounded-lg border border-neutral-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold">{market.title}</div>
                    <div className="mt-1 text-xs text-neutral-600">
                      Status {market.status} | Pot {market.totalPot.toFixed(2)} U |{" "}
                      {market.participants} participants
                    </div>
                    <div className="mt-1 text-xs text-neutral-500">
                      Bet close:{" "}
                      {market.betCloseTime
                        ? new Date(market.betCloseTime).toLocaleString()
                        : "--"}
                      {" | "}
                      Resolve:{" "}
                      {market.resolveTime
                        ? new Date(market.resolveTime).toLocaleString()
                        : "--"}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Link
                      href={`/markets/${market.id}`}
                      className="rounded-md border border-neutral-300 px-3 py-1 text-neutral-700"
                    >
                      Open
                    </Link>
                    {market.status !== "RESOLVED" ? (
                      <>
                        <Link
                          href={`/markets/${market.id}`}
                          className="rounded-md border border-neutral-300 px-3 py-1 text-neutral-700"
                        >
                          {resolveLabel(market)}
                        </Link>
                        <button
                          onClick={() => cancelMarket(market.id)}
                          className="rounded-md border border-neutral-300 px-3 py-1 text-neutral-700"
                          type="button"
                        >
                          Cancel
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">You joined</h2>
        {joined.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-4 text-sm text-neutral-600">
            You have not joined any private markets yet.
          </div>
        ) : (
          <div className="space-y-3">
            {joined.map((market) => (
              <div
                key={`${market.id}-${market.myBet.outcomeId}`}
                className="rounded-lg border border-neutral-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold">{market.title}</div>
                    <div className="mt-1 text-xs text-neutral-600">
                      Status {market.status} | My bet {market.myBet.outcomeName} for{" "}
                      {market.myBet.amount.toFixed(2)} U
                    </div>
                    <div className="mt-1 text-xs text-neutral-500">
                      Pot {market.totalPot.toFixed(2)} U | {market.participants} participants
                    </div>
                  </div>
                  <Link
                    href={`/markets/${market.id}`}
                    className="rounded-md border border-neutral-300 px-3 py-1 text-xs text-neutral-700"
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}



