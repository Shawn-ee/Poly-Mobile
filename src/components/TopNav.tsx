"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AuthModal from "@/components/AuthModal";
import { CURRENCY_SYMBOL } from "@/lib/currency";
import TransferCryptoModal from "@/components/TransferCryptoModal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

type User = {
  id: string;
  username: string;
  displayName: string | null;
  image: string | null;
  walletAddress: string | null;
  pendingDeposits?: number | null;
  pendingBalance?: number | null;
  uBalance?: number | null;
  tokenBalance?: number | null;
  isAdmin: boolean;
};

export default function TopNav() {
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [toast, setToast] = useState("");

  const menuRef = useRef<HTMLDivElement | null>(null);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const loadUser = async () => {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    setUser(data.user ?? null);
  };

  useEffect(() => {
    queueMicrotask(() => {
      void loadUser();
    });
    const onWalletUpdated = () => {
      void loadUser();
    };
    window.addEventListener("wallet:balance-updated", onWalletUpdated as EventListener);
    return () => {
      window.removeEventListener("wallet:balance-updated", onWalletUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setIsDesktop(window.matchMedia("(min-width: 1024px)").matches);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const clearTimers = () => {
    if (openTimerRef.current) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMenuOpen(false);
    window.location.href = "/";
  };

  const openMenuByHover = () => {
    if (!isDesktop) return;
    clearTimers();
    openTimerRef.current = window.setTimeout(() => setMenuOpen(true), 100);
  };

  const closeMenuByHover = () => {
    if (!isDesktop) return;
    clearTimers();
    closeTimerRef.current = window.setTimeout(() => setMenuOpen(false), 140);
  };

  const toggleMenuByClick = () => {
    if (isDesktop) return;
    setMenuOpen((value) => !value);
  };

  const uBalance = Number(user?.uBalance ?? user?.tokenBalance ?? 0);
  const pendingBalance = Number(user?.pendingBalance ?? user?.pendingDeposits ?? 0);
  const initials = (user?.displayName || user?.username || "U").slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--poly-border)] bg-white/95 backdrop-blur">
      <div className="border-b border-amber-100 bg-amber-50">
        <div className="mx-auto max-w-7xl px-4 py-2 text-center text-xs font-semibold text-amber-800 sm:px-6">
          Internal Beta: test credits only. Deposits and withdrawals are disabled.
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-5">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-[var(--poly-text)]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--poly-primary)] text-sm text-white">
              P
            </span>
            <span className="hidden sm:inline">Poly Market</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm font-medium text-[var(--poly-muted)] md:flex">
            <NavLink href="/sports">Sports</NavLink>
            <NavLink href="/events">Events</NavLink>
            <NavLink href="/markets">Markets</NavLink>
            {user ? <NavLink href="/portfolio">Portfolio</NavLink> : null}
            <NavLink href="/create">Create</NavLink>
            {user?.isAdmin ? (
              <>
                <NavLink href="/admin">Admin</NavLink>
                <NavLink href="/admin/bots">Bots</NavLink>
              </>
            ) : null}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <BalancePill label="Portfolio" value={`${uBalance.toFixed(2)} ${CURRENCY_SYMBOL}`} className="hidden sm:block" />
              <BalancePill label="Pending" value={`${pendingBalance.toFixed(2)} ${CURRENCY_SYMBOL}`} className="hidden lg:block" />
              <Button disabled title="Coming soon. Internal beta uses test credits only." variant="outline" size="sm" type="button">
                Deposit
              </Button>
              <button
                className="hidden h-9 w-9 items-center justify-center rounded-lg border border-[var(--poly-border)] bg-white text-sm text-[var(--poly-muted)] shadow-[var(--poly-shadow-sm)] transition hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)] lg:flex"
                type="button"
                aria-label="Notifications"
                title="Notifications"
              >
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--poly-teal)]" />
              </button>
              <div ref={menuRef} className="relative" onMouseEnter={openMenuByHover} onMouseLeave={closeMenuByHover}>
                <button
                  onClick={toggleMenuByClick}
                  className="flex items-center gap-2 rounded-full border border-[var(--poly-border)] bg-white px-2 py-1 shadow-[var(--poly-shadow-sm)] transition hover:border-[var(--poly-primary)]"
                  type="button"
                >
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.image} alt="avatar" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-[var(--poly-primary)]">
                      {initials}
                    </span>
                  )}
                  <span className="hidden max-w-28 truncate text-sm font-semibold text-[var(--poly-text)] sm:inline">
                    {user.displayName || user.username}
                  </span>
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-[var(--poly-border)] bg-white py-1 shadow-[var(--poly-shadow-md)]">
                <MenuLink href="/portfolio" onClick={() => setMenuOpen(false)}>Portfolio</MenuLink>
                    <MenuLink href="/wallet" onClick={() => setMenuOpen(false)}>Wallet</MenuLink>
                    <MenuLink href="/my-pools" onClick={() => setMenuOpen(false)}>My private markets</MenuLink>
                    <div className="my-1 border-t border-[var(--poly-border)]" />
                    <button
                      disabled
                      title="Coming soon. Internal beta uses test credits only."
                      className="block w-full cursor-not-allowed px-4 py-2 text-left text-sm text-[var(--poly-muted)] opacity-60"
                      type="button"
                    >
                      Withdraw
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-left text-sm text-[var(--poly-muted)] hover:bg-[var(--poly-surface-muted)] hover:text-[var(--poly-text)]"
                      type="button"
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <Button onClick={() => setAuthOpen(true)} variant="primary" size="sm" type="button">
              Log in
            </Button>
          )}
        </div>
      </div>

      {toast ? (
        <div className="mx-auto max-w-7xl px-4 pb-2 sm:px-6">
          <Badge tone="teal">{toast}</Badge>
        </div>
      ) : null}

      <AuthModal
        open={authOpen}
        mode="login"
        onClose={() => setAuthOpen(false)}
        onSuccess={async () => {
          setAuthOpen(false);
          await loadUser();
          setToast("Logged in.");
        }}
      />

      <TransferCryptoModal open={depositOpen} onClose={() => setDepositOpen(false)} platformBalance={uBalance} />
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link className="rounded-lg px-3 py-2 transition hover:bg-[var(--poly-surface-muted)] hover:text-[var(--poly-text)]" href={href}>
      {children}
    </Link>
  );
}

function MenuLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-2 text-sm text-[var(--poly-muted)] hover:bg-[var(--poly-surface-muted)] hover:text-[var(--poly-text)]"
    >
      {children}
    </Link>
  );
}

function BalancePill({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-lg border border-[var(--poly-border)] bg-white px-3 py-1.5 text-right shadow-[var(--poly-shadow-sm)] ${className ?? ""}`}>
      <div className="text-[11px] font-semibold uppercase text-[var(--poly-muted)]">{label}</div>
      <div className="text-xs font-semibold text-[var(--poly-text)]">{value}</div>
    </div>
  );
}
