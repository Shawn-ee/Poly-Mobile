"use client";

import { useEffect, useState } from "react";

type AdminWithdrawalItem = {
  id: string;
  userId: string;
  userEmail: string | null;
  username: string;
  amountUSDC: string;
  destinationAddress: string | null;
  status: string;
  requestedAt: string;
  completedAt?: string | null;
  rejectedAt?: string | null;
  txHash?: string | null;
  adminNotes?: string | null;
};

export default function AdminWithdrawalsPage() {
  const [pending, setPending] = useState<AdminWithdrawalItem[]>([]);
  const [recent, setRecent] = useState<AdminWithdrawalItem[]>([]);
  const [txById, setTxById] = useState<Record<string, string>>({});
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/withdrawals", { cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Failed to load withdrawals.");
      setLoading(false);
      return;
    }
    setPending(data.pending ?? []);
    setRecent(data.recent ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const completeRequest = async (id: string) => {
    const txHash = (txById[id] ?? "").trim();
    if (!txHash) {
      setError("txHash is required.");
      return;
    }
    setBusyId(id);
    setError("");
    const res = await fetch(`/api/admin/withdrawals/${id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txHash, notes: noteById[id] ?? "" }),
    });
    const data = await res.json().catch(() => null);
    setBusyId(null);
    if (!res.ok) {
      setError(data?.error ?? "Failed to complete withdrawal.");
      return;
    }
    await load();
  };

  const rejectRequest = async (id: string) => {
    setBusyId(id);
    setError("");
    const res = await fetch(`/api/admin/withdrawals/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: noteById[id] ?? "" }),
    });
    const data = await res.json().catch(() => null);
    setBusyId(null);
    if (!res.ok) {
      setError(data?.error ?? "Failed to reject withdrawal.");
      return;
    }
    await load();
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Admin Withdrawals</h1>
        <button
          className="rounded-md border border-neutral-300 px-3 py-1 text-sm"
          onClick={() => load()}
          type="button"
        >
          Refresh
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="mt-4 text-sm text-neutral-600">Loading...</p> : null}

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Pending</h2>
        {pending.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-600">No pending withdrawals.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-600">
                  <th className="px-2 py-2 font-medium">Request</th>
                  <th className="px-2 py-2 font-medium">User</th>
                  <th className="px-2 py-2 font-medium">Amount</th>
                  <th className="px-2 py-2 font-medium">Address</th>
                  <th className="px-2 py-2 font-medium">Requested</th>
                  <th className="px-2 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-100 align-top">
                    <td className="px-2 py-2 text-xs text-neutral-700">{item.id}</td>
                    <td className="px-2 py-2 text-neutral-700">
                      <div>{item.username}</div>
                      <div className="text-xs text-neutral-500">{item.userEmail ?? item.userId}</div>
                    </td>
                    <td className="px-2 py-2 text-neutral-700">{item.amountUSDC}</td>
                    <td className="px-2 py-2 text-neutral-700">{item.destinationAddress ?? "--"}</td>
                    <td className="px-2 py-2 text-neutral-700">
                      {new Date(item.requestedAt).toLocaleString()}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-col gap-2">
                        <input
                          className="rounded border border-neutral-300 px-2 py-1 text-xs"
                          placeholder="txHash for complete"
                          value={txById[item.id] ?? ""}
                          onChange={(event) =>
                            setTxById((prev) => ({ ...prev, [item.id]: event.target.value }))
                          }
                        />
                        <input
                          className="rounded border border-neutral-300 px-2 py-1 text-xs"
                          placeholder="notes (optional)"
                          value={noteById[item.id] ?? ""}
                          onChange={(event) =>
                            setNoteById((prev) => ({ ...prev, [item.id]: event.target.value }))
                          }
                        />
                        <div className="flex gap-2">
                          <button
                            className="rounded border border-neutral-300 px-2 py-1 text-xs"
                            onClick={() => completeRequest(item.id)}
                            disabled={busyId === item.id}
                            type="button"
                          >
                            Complete
                          </button>
                          <button
                            className="rounded border border-neutral-300 px-2 py-1 text-xs"
                            onClick={() => rejectRequest(item.id)}
                            disabled={busyId === item.id}
                            type="button"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Recent Processed</h2>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-600">No recent processed withdrawals.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-600">
                  <th className="px-2 py-2 font-medium">Request</th>
                  <th className="px-2 py-2 font-medium">User</th>
                  <th className="px-2 py-2 font-medium">Amount</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Tx</th>
                  <th className="px-2 py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-100">
                    <td className="px-2 py-2 text-xs text-neutral-700">{item.id}</td>
                    <td className="px-2 py-2 text-neutral-700">{item.userEmail ?? item.userId}</td>
                    <td className="px-2 py-2 text-neutral-700">{item.amountUSDC}</td>
                    <td className="px-2 py-2 text-neutral-700">{item.status}</td>
                    <td className="px-2 py-2 text-xs text-neutral-700">{item.txHash ?? "--"}</td>
                    <td className="px-2 py-2 text-neutral-700">{item.adminNotes ?? "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

