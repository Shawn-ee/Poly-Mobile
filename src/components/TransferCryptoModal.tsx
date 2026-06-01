"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";

type DepositAddressInfo = {
  network: string;
  token: string;
  address: string;
  minimumDeposit: string;
  confirmationsRequired: number;
  warnings?: string[];
};

type DepositItem = {
  id: string;
  amount: string;
  status: string;
  confirmations: number;
  detectedAt: string;
  creditedAt: string | null;
};

type TransferCryptoModalProps = {
  open: boolean;
  onClose: () => void;
  platformBalance: number;
};

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatTimestamp(value: string | null) {
  if (!value) return "Pending";
  return new Date(value).toLocaleString();
}

export default function TransferCryptoModal({
  open,
  onClose,
  platformBalance,
}: TransferCryptoModalProps) {
  const [addressInfo, setAddressInfo] = useState<DepositAddressInfo | null>(null);
  const [history, setHistory] = useState<DepositItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const footerWarnings = useMemo(() => {
    const baseWarnings = [
      "Deposits are credited automatically after confirmations.",
      "Do not send tokens from Ethereum, Base, Arbitrum, Solana, Tron, or other networks.",
      "Sending the wrong token or wrong chain may result in lost funds.",
      "No transaction hash is required.",
    ];

    const merged = [...(addressInfo?.warnings ?? []), ...baseWarnings];
    return [...new Set(merged)];
  }, [addressInfo?.warnings]);

  useEffect(() => {
    if (!open) {
      setCopyStatus("");
      setAddressInfo(null);
      setHistory([]);
      setError("");
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");

      const [addressRes, historyRes] = await Promise.all([
        fetch("/api/deposits/address", { credentials: "include" }),
        fetch("/api/deposits", { credentials: "include" }),
      ]);
      const addressData = await addressRes.json().catch(() => null);
      const historyData = await historyRes.json().catch(() => null);

      if (!active) return;

      if (addressRes.ok) {
        setAddressInfo(addressData as DepositAddressInfo);
      } else {
        setAddressInfo(null);
        setError(
          addressRes.status === 401
            ? "Please log in to view your deposit address."
            : addressData?.code === "DEPOSIT_CONFIG_MISSING"
              ? "Deposit system is not configured. Please set DEPOSIT_WALLET_ENCRYPTION_KEY and Polygon deposit environment variables."
              : addressData?.error ?? "Deposit details are unavailable.",
        );
      }

      if (historyRes.ok) {
        setHistory((historyData?.items ?? []) as DepositItem[]);
      } else {
        setHistory([]);
        if (addressRes.ok) {
          setError(
            historyRes.status === 401
              ? "Please log in to view your deposit address."
              : historyData?.error ?? "Deposit history is unavailable.",
          );
        }
      }

      setLoading(false);
    };

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [open]);

  if (!open) return null;

  const handleCopy = async () => {
    if (!addressInfo?.address) return;
    try {
      await navigator.clipboard.writeText(addressInfo.address);
      setCopyStatus("Address copied.");
    } catch {
      setCopyStatus("Could not copy address.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="border-b border-neutral-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-950">Transfer Crypto</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Platform Balance: {formatUsd(platformBalance)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
              type="button"
            >
              Close
            </button>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">Token</div>
              <div className="mt-2 text-sm font-medium text-neutral-900">
                {addressInfo?.token ?? "USDC"}
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">Chain</div>
              <div className="mt-2 text-sm font-medium text-neutral-900">
                {addressInfo?.network ?? "Polygon"}
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">Minimum</div>
              <div className="mt-2 text-sm font-medium text-neutral-900">
                {addressInfo ? `$${addressInfo.minimumDeposit}` : "$2.00"}
              </div>
            </div>
          </div>

          {loading && !addressInfo ? (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-600">
              Loading deposit details...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : addressInfo ? (
            <>
              <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-6 py-8">
                <div className="flex justify-center">
                  <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
                    <QRCodeSVG value={addressInfo.address} size={220} bgColor="#ffffff" fgColor="#111111" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 p-4">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-neutral-900">Your deposit address</div>
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-neutral-300 text-[11px] text-neutral-500"
                    title="Only send USDC on Polygon to this address."
                  >
                    i
                  </span>
                </div>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex-1 break-all rounded-2xl bg-neutral-100 px-4 py-3 font-mono text-sm text-neutral-900">
                    {addressInfo.address}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800"
                    type="button"
                  >
                    Copy address
                  </button>
                </div>
                {copyStatus ? (
                  <div className="mt-2 text-sm text-neutral-600">{copyStatus}</div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-neutral-200 p-4">
                <div className="text-sm font-medium text-neutral-900">Deposit history</div>
                <div className="mt-3 space-y-3">
                  {history.length === 0 ? (
                    <div className="rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                      No deposits detected yet.
                    </div>
                  ) : (
                    history.slice(0, 8).map((deposit) => (
                      <div key={deposit.id} className="rounded-2xl bg-neutral-50 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-medium text-neutral-900">
                            {formatUsd(Number(deposit.amount))}
                          </div>
                          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                            {deposit.status}
                          </div>
                        </div>
                        <div className="mt-2 grid gap-1 text-xs text-neutral-600 sm:grid-cols-2">
                          <div>Confirmations: {deposit.confirmations}</div>
                          <div>Detected: {formatTimestamp(deposit.detectedAt)}</div>
                          <div>Credited: {formatTimestamp(deposit.creditedAt)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
                <div className="space-y-1">
                  {footerWarnings.map((warning) => (
                    <div key={warning}>{warning}</div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-amber-800">
                  Confirmations required: {addressInfo.confirmationsRequired}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
