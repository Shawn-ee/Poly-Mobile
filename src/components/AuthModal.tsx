"use client";

import { useState } from "react";
import { BrowserProvider } from "ethers";
import Button from "@/components/ui/Button";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: "login" | "link";
};

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, cb: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, cb: (...args: unknown[]) => void) => void;
    };
  }
}

export default function AuthModal({
  open,
  onClose,
  onSuccess,
  mode = "login",
}: AuthModalProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"google" | "wallet" | null>(null);

  if (!open) return null;

  const handleGoogle = () => {
    setLoading("google");
    window.location.href =
      mode === "link" ? "/api/auth/link/google/start" : "/api/auth/google/start";
  };

  const handleWallet = async () => {
    setError("");
    setLoading("wallet");
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not detected.");
      }
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const address = accounts?.[0];
      if (!address) throw new Error("No wallet address found.");

      const nonceEndpoint =
        mode === "link" ? "/api/auth/link/wallet/start" : "/api/auth/wallet/nonce";
      const nonceRes = await fetch(nonceEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const nonceData = await nonceRes.json();
      if (!nonceRes.ok) throw new Error(nonceData.error ?? "Failed to get nonce.");

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(nonceData.message);

      const verifyEndpoint =
        mode === "link" ? "/api/auth/link/wallet/verify" : "/api/auth/wallet/verify";
      const verifyRes = await fetch(verifyEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          message: nonceData.message,
          signature,
          mode,
        }),
      });
      const verifyData = await verifyRes.json().catch(() => null);
      if (!verifyRes.ok) {
        throw new Error(verifyData?.error ?? "Wallet verification failed.");
      }
      onSuccess?.();
      onClose();
    } catch (walletError) {
      setError(walletError instanceof Error ? walletError.message : "Wallet sign-in failed.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="w-full max-w-md rounded-lg border border-[var(--poly-border)] bg-white p-5 shadow-[var(--poly-shadow-md)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase text-[var(--poly-teal)]">
              {mode === "link" ? "Account" : "Welcome"}
            </div>
            <h2 className="mt-1 text-xl font-semibold text-[var(--poly-text)]">
              {mode === "link" ? "Link account" : "Sign in"}
            </h2>
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
        <p className="mt-3 text-sm text-[var(--poly-muted)]">
          {mode === "link"
            ? "Link Google or wallet to your current account."
            : "Continue with Google or connect your wallet."}
        </p>
        <div className="mt-4 space-y-3">
          <Button
            onClick={handleGoogle}
            disabled={loading !== null}
            variant="outline"
            className="w-full"
            type="button"
          >
            {loading === "google" ? "Redirecting..." : "Continue with Google"}
          </Button>
          <Button
            onClick={handleWallet}
            disabled={loading !== null}
            variant="primary"
            className="w-full"
            type="button"
          >
            {loading === "wallet" ? "Connecting..." : "Continue with MetaMask"}
          </Button>
        </div>
        {error ? (
          <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
