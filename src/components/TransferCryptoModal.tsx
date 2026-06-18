"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[var(--poly-border)] bg-white shadow-[var(--poly-shadow-md)]">
        <div className="border-b border-[var(--poly-border)] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase text-[var(--poly-teal)]">Wallet</div>
              <h2 className="mt-1 text-2xl font-semibold text-[var(--poly-text)]">Transfer Crypto</h2>
              <p className="mt-1 text-sm text-[var(--poly-muted)]">
                Platform Balance: {formatUsd(platformBalance)}
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              type="button"
            >
              Close
            </Button>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="bg-[var(--poly-surface-muted)] px-4 py-3">
              <div className="text-[11px] font-semibold uppercase text-[var(--poly-muted)]">Token</div>
              <div className="mt-2 text-sm font-semibold text-[var(--poly-text)]">
                {addressInfo?.token ?? "USDC"}
              </div>
            </Card>
            <Card className="bg-[var(--poly-surface-muted)] px-4 py-3">
              <div className="text-[11px] font-semibold uppercase text-[var(--poly-muted)]">Chain</div>
              <div className="mt-2 text-sm font-semibold text-[var(--poly-text)]">
                {addressInfo?.network ?? "Polygon"}
              </div>
            </Card>
            <Card className="bg-[var(--poly-surface-muted)] px-4 py-3">
              <div className="text-[11px] font-semibold uppercase text-[var(--poly-muted)]">Minimum</div>
              <div className="mt-2 text-sm font-semibold text-[var(--poly-text)]">
                {addressInfo ? `$${addressInfo.minimumDeposit}` : "$2.00"}
              </div>
            </Card>
          </div>

          {loading && !addressInfo ? (
            <Card className="bg-[var(--poly-surface-muted)] px-4 py-10 text-center text-sm text-[var(--poly-muted)]">
              Loading deposit details...
            </Card>
          ) : error ? (
            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : addressInfo ? (
            <>
              <Card className="bg-[var(--poly-surface-muted)] px-6 py-8">
                <div className="flex justify-center">
                  <div className="rounded-lg border border-[var(--poly-border)] bg-white p-4 shadow-sm">
                    <QRCodeSVG value={addressInfo.address} size={220} bgColor="#ffffff" fgColor="#111111" />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-[var(--poly-text)]">Your deposit address</div>
                  <Badge tone="warning">Polygon USDC only</Badge>
                </div>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex-1 break-all rounded-lg bg-[var(--poly-surface-muted)] px-4 py-3 font-mono text-sm text-[var(--poly-text)]">
                    {addressInfo.address}
                  </div>
                  <Button
                    onClick={handleCopy}
                    variant="primary"
                    type="button"
                  >
                    Copy address
                  </Button>
                </div>
                {copyStatus ? (
                  <div className="mt-2 text-sm text-[var(--poly-muted)]">{copyStatus}</div>
                ) : null}
              </Card>

              <Card className="p-4">
                <div className="text-sm font-semibold text-[var(--poly-text)]">Deposit history</div>
                <div className="mt-3 space-y-3">
                  {history.length === 0 ? (
                    <div className="rounded-lg bg-[var(--poly-surface-muted)] px-4 py-3 text-sm text-[var(--poly-muted)]">
                      No deposits detected yet.
                    </div>
                  ) : (
                    history.slice(0, 8).map((deposit) => (
                      <div key={deposit.id} className="rounded-lg bg-[var(--poly-surface-muted)] px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-[var(--poly-text)]">
                            {formatUsd(Number(deposit.amount))}
                          </div>
                          <Badge>{deposit.status}</Badge>
                        </div>
                        <div className="mt-2 grid gap-1 text-xs text-[var(--poly-muted)] sm:grid-cols-2">
                          <div>Confirmations: {deposit.confirmations}</div>
                          <div>Detected: {formatTimestamp(deposit.detectedAt)}</div>
                          <div>Credited: {formatTimestamp(deposit.creditedAt)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
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
