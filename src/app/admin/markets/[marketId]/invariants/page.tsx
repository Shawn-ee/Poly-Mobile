"use client";

import { useCallback, useEffect, useState } from "react";

type InvariantState = {
  marketId: string;
  marketStatus: string;
  marketMechanism: string;
  marketVisibility: string;
  outcome1: { id: string; name: string };
  outcome2: { id: string; name: string };
  bestBidOutcome1: string | null;
  bestBidOutcome2: string | null;
  bestAskOutcome1: string | null;
  bestAskOutcome2: string | null;
  bidSum: string | null;
  askSum: string | null;
  bidInvariantPass: boolean;
  askInvariantPass: boolean;
  marketCollateralUSDC: string;
  outstandingSharesOutcome1: string;
  outstandingSharesOutcome2: string;
  outstandingSharesEqual: boolean;
  collateralMatchesOutstanding: boolean;
  invariantStatusSummary: "PASS" | "FAIL" | string;
  timestamp: string;
};

export default function AdminMarketInvariantsPage({
  params,
}: {
  params: Promise<{ marketId: string }>;
}) {
  const [marketId, setMarketId] = useState<string>("");
  const [state, setState] = useState<InvariantState | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>("");

  useEffect(() => {
    params.then((p) => setMarketId(p.marketId));
  }, [params]);

  const load = useCallback(async () => {
    if (!marketId) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/markets/${marketId}/invariants`, {
      cache: "no-store",
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      setError(payload?.error ?? "Failed to load invariant state.");
      setState(null);
      setLoading(false);
      return;
    }
    setState(payload as InvariantState);
    setLastRefresh(new Date().toISOString());
    setLoading(false);
  }, [marketId]);

  useEffect(() => {
    if (!marketId) return;
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [marketId, load]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Market Invariants</h1>
      <div className="mt-2 text-sm text-neutral-600">{marketId || "Loading market id..."}</div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={load}
          className="rounded-md border border-neutral-300 px-3 py-1 text-sm"
          type="button"
        >
          Refresh
        </button>
        <div className="text-xs text-neutral-500">
          Last refresh: {lastRefresh ? new Date(lastRefresh).toLocaleString() : "--"}
        </div>
      </div>

      {loading ? <p className="mt-4 text-sm text-neutral-600">Loading...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {state ? (
        <div className="mt-4 space-y-3 rounded-lg border border-neutral-200 bg-white p-4 text-sm">
          <div>
            <strong>Status:</strong> {state.marketStatus} | {state.marketMechanism} |{" "}
            {state.marketVisibility}
          </div>
          <div>
            <strong>Summary:</strong>{" "}
            <span className={state.invariantStatusSummary === "PASS" ? "text-green-700" : "text-red-700"}>
              {state.invariantStatusSummary}
            </span>
          </div>
          <div>
            <strong>Outcomes:</strong> {state.outcome1.name} ({state.outcome1.id}) /{" "}
            {state.outcome2.name} ({state.outcome2.id})
          </div>
          <div>
            <strong>Best bids:</strong> {state.bestBidOutcome1 ?? "--"} /{" "}
            {state.bestBidOutcome2 ?? "--"} | sum={state.bidSum ?? "--"} | pass=
            {String(state.bidInvariantPass)}
          </div>
          <div>
            <strong>Best asks:</strong> {state.bestAskOutcome1 ?? "--"} /{" "}
            {state.bestAskOutcome2 ?? "--"} | sum={state.askSum ?? "--"} | pass=
            {String(state.askInvariantPass)}
          </div>
          <div>
            <strong>Collateral:</strong> {state.marketCollateralUSDC}
          </div>
          <div>
            <strong>Outstanding:</strong> {state.outstandingSharesOutcome1} /{" "}
            {state.outstandingSharesOutcome2}
          </div>
          <div>
            <strong>Outstanding equal:</strong> {String(state.outstandingSharesEqual)}
          </div>
          <div>
            <strong>Collateral matches outstanding:</strong>{" "}
            {String(state.collateralMatchesOutstanding)}
          </div>
          <div>
            <strong>Engine timestamp:</strong> {new Date(state.timestamp).toLocaleString()}
          </div>
        </div>
      ) : null}
    </main>
  );
}

