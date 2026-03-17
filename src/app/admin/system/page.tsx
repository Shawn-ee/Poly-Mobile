"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SystemPayload = {
  status: string;
  db: string;
  env: string;
  timestamp: string;
  config: {
    strict: boolean;
    valid: boolean;
    warnings: string[];
    errors: string[];
  };
  metrics: {
    activePublicMarkets: number;
    pendingWithdrawals: number;
    recentProcessedWithdrawals: number;
  };
  reconciliation: {
    balances: { pass: boolean; checkedUsers: number; mismatches: number };
    publicMarkets: { pass: boolean; checkedMarkets: number; mismatches: number };
    withdrawals: { pass: boolean; checkedRequests: number; mismatches: number };
  };
  links: {
    withdrawals: string;
    system: string;
  };
};

export default function AdminSystemPage() {
  const [data, setData] = useState<SystemPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/system", { cache: "no-store" });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      setError(payload?.error ?? "Failed to load system monitor.");
      setData(null);
      setLoading(false);
      return;
    }
    setData(payload as SystemPayload);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">System Monitor</h1>
        <button
          type="button"
          onClick={load}
          className="rounded-md border border-neutral-300 px-3 py-1 text-sm"
        >
          Refresh
        </button>
      </div>

      {loading ? <p className="mt-4 text-sm text-neutral-600">Loading...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {data ? (
        <div className="mt-4 space-y-4">
          <section className="rounded-lg border border-neutral-200 bg-white p-4 text-sm">
            <div>
              <strong>Status:</strong> {data.status} ({data.db})
            </div>
            <div>
              <strong>Env:</strong> {data.env}
            </div>
            <div>
              <strong>Timestamp:</strong> {new Date(data.timestamp).toLocaleString()}
            </div>
            <div>
              <strong>Config:</strong>{" "}
              {data.config.valid ? "valid" : "invalid"} (strict={String(data.config.strict)})
            </div>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-4 text-sm">
            <h2 className="text-base font-semibold">Metrics</h2>
            <div className="mt-2">
              Active public markets: {data.metrics.activePublicMarkets}
            </div>
            <div>Pending withdrawals: {data.metrics.pendingWithdrawals}</div>
            <div>Recent processed withdrawals: {data.metrics.recentProcessedWithdrawals}</div>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-4 text-sm">
            <h2 className="text-base font-semibold">Reconciliation</h2>
            <div className="mt-2">
              Balances: pass={String(data.reconciliation.balances.pass)} checkedUsers=
              {data.reconciliation.balances.checkedUsers} mismatches=
              {data.reconciliation.balances.mismatches}
            </div>
            <div>
              Public markets: pass={String(data.reconciliation.publicMarkets.pass)} checkedMarkets=
              {data.reconciliation.publicMarkets.checkedMarkets} mismatches=
              {data.reconciliation.publicMarkets.mismatches}
            </div>
            <div>
              Withdrawals: pass={String(data.reconciliation.withdrawals.pass)} checkedRequests=
              {data.reconciliation.withdrawals.checkedRequests} mismatches=
              {data.reconciliation.withdrawals.mismatches}
            </div>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-4 text-sm">
            <h2 className="text-base font-semibold">Links</h2>
            <div className="mt-2 flex gap-4">
              <Link className="text-blue-700 underline" href="/admin/withdrawals">
                Admin Withdrawals
              </Link>
              <Link className="text-blue-700 underline" href="/admin">
                Admin Markets
              </Link>
              <Link className="text-blue-700 underline" href="/admin/bots">
                Bot Monitor
              </Link>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
