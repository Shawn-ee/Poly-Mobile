"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AuthModal from "@/components/AuthModal";

function LoginPageInner() {
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("error");
    if (!code) return;
    setError(code.replaceAll("_", " "));
  }, [searchParams]);

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Continue with Google or your wallet.
      </p>
      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <div className="mt-6">
        <AuthModal
          open
          onClose={() => {
            window.location.href = "/";
          }}
          onSuccess={() => {
            window.location.href = "/";
          }}
        />
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-4 py-12">
          <p className="text-sm text-neutral-600">Loading sign-in...</p>
        </main>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
