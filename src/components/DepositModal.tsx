"use client";

import { useMemo, useState } from "react";

type DepositModalProps = {
  open: boolean;
  walletAddress: string | null;
  onClose: () => void;
  onComplete?: () => void;
};

export default function DepositModal({
  open,
  walletAddress,
  onClose,
  onComplete,
}: DepositModalProps) {
  const [txHash, setTxHash] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const baseChainId = process.env.NEXT_PUBLIC_BASE_CHAIN_ID ?? "8453";
  const usdcAddress = process.env.NEXT_PUBLIC_USDC_BASE_ADDRESS ?? "Set NEXT_PUBLIC_USDC_BASE_ADDRESS";
  const depositAddress =
    process.env.NEXT_PUBLIC_PROJECT_DEPOSIT_ADDRESS ??
    "Set NEXT_PUBLIC_PROJECT_DEPOSIT_ADDRESS";

  const shortDepositAddress = useMemo(() => {
    if (!depositAddress.startsWith("0x") || depositAddress.length < 12) return depositAddress;
    return `${depositAddress.slice(0, 8)}...${depositAddress.slice(-6)}`;
  }, [depositAddress]);

  if (!open) return null;

  const verifyDeposit = async () => {
    if (!walletAddress) {
      setError("Link a wallet first.");
      return;
    }
    if (!txHash.trim()) {
      setError("Enter a transaction hash.");
      return;
    }
    setError("");
    setStatus("");
    setLoading(true);

    const res = await fetch("/api/wallet/deposit-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txHash: txHash.trim() }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(data?.error ?? "Deposit verification failed.");
      return;
    }

    setStatus(
      data.credited
        ? `Deposit confirmed: +${data.amount} U.`
        : `Deposit already credited (${data.amount} U).`
    );
    onComplete?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Deposit USDC (Base)</h2>
          <button onClick={onClose} className="text-sm text-neutral-500" type="button">
            Close
          </button>
        </div>
        <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
          <div>Network: Base (chainId {baseChainId})</div>
          <div className="mt-1 break-all">USDC: {usdcAddress}</div>
          <div className="mt-1 break-all">
            Deposit address: {shortDepositAddress}
          </div>
        </div>
        <p className="mt-3 text-sm text-neutral-600">
          Send USDC from your linked wallet to the deposit address, then paste the tx hash.
        </p>
        <div className="mt-4 space-y-3">
          <input
            value={txHash}
            onChange={(event) => setTxHash(event.target.value)}
            placeholder="0x..."
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            onClick={verifyDeposit}
            disabled={loading}
            className="w-full rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
            type="button"
          >
            {loading ? "Verifying..." : "Verify and credit"}
          </button>
        </div>
        {status ? <div className="mt-3 text-sm text-emerald-700">{status}</div> : null}
        {error ? <div className="mt-3 text-sm text-red-700">{error}</div> : null}
      </div>
    </div>
  );
}


