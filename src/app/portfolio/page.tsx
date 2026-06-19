"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import PageContainer from "@/components/ui/PageContainer";
import { BetaNotice, PageHeader, StatCard } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";

type PortfolioItem = {
  market: {
    id: string;
    title: string;
    status: string;
    resolveTime: string | null;
    createdAt?: string | null;
  };
  outcome: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  valueTokens: number;
  costBasisTokens: number;
  totalCostBasisTokens: number;
  pnlTokens: number;
};

type HistoryItem = {
  market: {
    id: string;
    title: string;
    status: string;
    resolveTime: string | null;
    resolvedOutcomeId: string | null;
    createdAt?: string | null;
  };
  resolvedOutcomeName: string | null;
  totalBuyCostTokens: number;
  totalSellProceedsTokens: number;
  netInvestedTokens: number;
  winningsTokens: number;
  refundsTokens: number;
  realizedPnLTokens: number;
};

export default function PortfolioPage() {
  const router = useRouter();
  const [walletAvailable, setWalletAvailable] = useState<number | null>(null);
  const [walletLocked, setWalletLocked] = useState<number | null>(null);
  const [walletTotal, setWalletTotal] = useState<number | null>(null);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [totalCostBasis, setTotalCostBasis] = useState<number>(0);
  const [totalRealizedPnl, setTotalRealizedPnl] = useState<number>(0);
  const [totalPnl, setTotalPnl] = useState<number>(0);
  const [positions, setPositions] = useState<PortfolioItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "resolved">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/portfolio");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setWalletAvailable(
        typeof data.walletAvailableUSDC === "number" ? data.walletAvailableUSDC : 0
      );
      setWalletLocked(typeof data.walletLockedUSDC === "number" ? data.walletLockedUSDC : 0);
      setWalletTotal(typeof data.walletTotalUSDC === "number" ? data.walletTotalUSDC : 0);
      setTotalValue(data.totalValue ?? 0);
      setTotalCostBasis(data.totalCostBasis ?? 0);
      setTotalRealizedPnl(data.totalRealizedPnl ?? 0);
      setTotalPnl(data.totalPnl ?? 0);
      setPositions(data.positions ?? []);
      setLoading(false);
    };
    load();

    const loadHistory = async () => {
      const res = await fetch("/api/portfolio/history");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setHistory(data.history ?? []);
      setHistoryLoading(false);
    };
    loadHistory();
  }, [router]);

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return positions.filter((item) => {
      if (
        filterStatus === "active" &&
        item.market.status !== "LIVE" &&
        item.market.status !== "ACTIVE"
      ) {
        return false;
      }
      if (filterStatus === "resolved" && item.market.status !== "RESOLVED") return false;
      if (normalized && !item.market.title.toLowerCase().includes(normalized)) return false;
      return true;
    });
  }, [positions, filterStatus, search]);

  const filteredHistory = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return history.filter((item) => {
      if (normalized && !item.market.title.toLowerCase().includes(normalized)) return false;
      return true;
    });
  }, [history, search]);

  const allItems = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const openItems = positions
      .filter((item) => {
        if (normalized && !item.market.title.toLowerCase().includes(normalized)) return false;
        return true;
      })
      .map((item) => ({
        type: "OPEN_POSITION" as const,
        market: item.market,
        data: item,
      }));

    const historyItems = history
      .filter((item) => {
        if (normalized && !item.market.title.toLowerCase().includes(normalized)) return false;
        return true;
      })
      .map((item) => ({
        type: "RESOLVED_HISTORY" as const,
        market: item.market,
        data: item,
      }));

    const merged = [...openItems, ...historyItems];
    merged.sort((a, b) => {
      const aResolved = a.market.status === "RESOLVED";
      const bResolved = b.market.status === "RESOLVED";
      const aTime = aResolved
        ? new Date(a.market.resolveTime ?? a.market.createdAt ?? 0).getTime()
        : new Date(a.market.resolveTime ?? a.market.createdAt ?? 0).getTime();
      const bTime = bResolved
        ? new Date(b.market.resolveTime ?? b.market.createdAt ?? 0).getTime()
        : new Date(b.market.resolveTime ?? b.market.createdAt ?? 0).getTime();
      return bTime - aTime;
    });
    return merged;
  }, [positions, history, search]);

  if (loading) {
    return (
      <PageContainer size="default">
        <Card className="p-6 text-sm text-[var(--poly-muted)]">Loading portfolio...</Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Account"
        title="Portfolio"
        description="Track balances, open positions, and resolved market history from one account view."
      >
        <BetaNotice tone="info">
          Portfolio values use the data already returned by the app. This page does not change balance, position, ledger, or settlement calculations.
        </BetaNotice>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-7">
        <StatCard label="Available" value={`${walletAvailable === null ? "--" : walletAvailable.toFixed(2)} U`} helper="Test-credit balance" />
        <StatCard label="Locked" value={`${walletLocked === null ? "--" : walletLocked.toFixed(2)} U`} helper="Reserved by open activity" tone="warning" />
        <StatCard label="Total" value={`${walletTotal === null ? "--" : walletTotal.toFixed(2)} U`} helper="Available plus locked" />
        <StatCard label="Position value" value={`${totalValue.toFixed(2)} U`} helper="Open positions" />
        <StatCard label="Cost basis" value={`${totalCostBasis.toFixed(2)} U`} helper="Position cost" />
        <StatCard label="Realized PnL" value={`${totalRealizedPnl.toFixed(2)} U`} helper="Closed markets" tone={totalRealizedPnl >= 0 ? "positive" : "negative"} />
        <StatCard label="Unrealized PnL" value={`${totalPnl.toFixed(2)} U`} helper="Open market estimate" tone={totalPnl >= 0 ? "positive" : "negative"} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-2 text-sm">
          <button
            onClick={() => setFilterStatus("all")}
            className={`rounded-full border px-3 py-1 ${
              filterStatus === "all"
                ? "border-[var(--poly-primary)] bg-[var(--poly-primary)] text-white"
                : "border-[var(--poly-border)] bg-white text-[var(--poly-muted)] hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
            }`}
            type="button"
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus("active")}
            className={`rounded-full border px-3 py-1 ${
              filterStatus === "active"
                ? "border-[var(--poly-primary)] bg-[var(--poly-primary)] text-white"
                : "border-[var(--poly-border)] bg-white text-[var(--poly-muted)] hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
            }`}
            type="button"
          >
            Active
          </button>
          <button
            onClick={() => setFilterStatus("resolved")}
            className={`rounded-full border px-3 py-1 ${
              filterStatus === "resolved"
                ? "border-[var(--poly-primary)] bg-[var(--poly-primary)] text-white"
                : "border-[var(--poly-border)] bg-white text-[var(--poly-muted)] hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
            }`}
            type="button"
          >
            Resolved
          </button>
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search markets"
          className="w-full max-w-xs rounded-lg border border-[var(--poly-border)] bg-white px-3 py-2 text-sm text-[var(--poly-text)] focus:border-[var(--poly-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--poly-ring)]"
        />
      </div>

      {filterStatus === "all" ? (
        allItems.length === 0 ? (
          <EmptyState title="No portfolio activity yet" description="Browse markets to start building positions." />
        ) : (
          <Card className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--poly-border)] bg-[var(--poly-surface-muted)] text-xs uppercase text-[var(--poly-muted)]">
                <tr>
                  <th className="px-4 py-3">Market</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Outcome</th>
                  <th className="px-4 py-3 text-right">Value / Net Invested</th>
                  <th className="px-4 py-3 text-right">Cost / Payout</th>
                  <th className="px-4 py-3 text-right">Avg cost</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">PnL</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Resolve</th>
                </tr>
              </thead>
              <tbody>
                {allItems.map((item) => {
                  if (item.type === "OPEN_POSITION") {
                    const row = item.data as PortfolioItem;
                    return (
                      <tr key={`open-${row.market.id}-${row.outcome}`} className="border-b border-[var(--poly-border)]">
                        <td className="px-4 py-3">
                          <Link
                            href={`/markets/${row.market.id}`}
                            className="font-medium text-[var(--poly-text)] underline"
                          >
                            {row.market.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone="teal">Open</Badge>
                        </td>
                        <td className="px-4 py-3">{row.outcome}</td>
                        <td className="px-4 py-3 text-right">
                          {row.valueTokens.toFixed(2)} U
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.totalCostBasisTokens.toFixed(2)} U
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.avgCost.toFixed(2)} / share
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.currentPrice.toFixed(2)} / share
                        </td>
                        <td className={`px-4 py-3 text-right ${row.pnlTokens >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {row.pnlTokens.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">{row.market.status}</td>
                        <td className="px-4 py-3">
                          {row.market.resolveTime
                            ? new Date(row.market.resolveTime).toLocaleDateString()
                            : "--"}
                        </td>
                      </tr>
                    );
                  }

                  const row = item.data as HistoryItem;
                  return (
                      <tr key={`resolved-${row.market.id}`} className="border-b border-[var(--poly-border)]">
                        <td className="px-4 py-3">
                          <Link
                            href={`/markets/${row.market.id}`}
                            className="font-medium text-[var(--poly-text)] underline"
                          >
                            {row.market.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                        <Badge>Resolved</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {row.resolvedOutcomeName ?? "--"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.netInvestedTokens.toFixed(2)} U
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(row.winningsTokens + row.refundsTokens).toFixed(2)} U
                      </td>
                      <td className="px-4 py-3 text-right">--</td>
                      <td className="px-4 py-3 text-right">--</td>
                      <td className={`px-4 py-3 text-right ${row.realizedPnLTokens >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {row.realizedPnLTokens.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">{row.market.status}</td>
                      <td className="px-4 py-3">
                        {row.market.resolveTime
                          ? new Date(row.market.resolveTime).toLocaleDateString()
                          : "--"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )
      ) : filterStatus === "resolved" ? (
        historyLoading ? (
          <Card className="mt-8 p-6 text-sm text-[var(--poly-muted)]">
            Loading resolved history...
          </Card>
        ) : filteredHistory.length === 0 ? (
          <EmptyState title="No resolved history yet" description="Resolved markets will appear here." />
        ) : (
          <Card className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--poly-border)] bg-[var(--poly-surface-muted)] text-xs uppercase text-[var(--poly-muted)]">
                <tr>
                  <th className="px-4 py-3">Market</th>
                  <th className="px-4 py-3">Resolved</th>
                  <th className="px-4 py-3 text-right">Net invested</th>
                  <th className="px-4 py-3 text-right">Payout</th>
                  <th className="px-4 py-3 text-right">Realized PnL</th>
                  <th className="px-4 py-3">Resolved date</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.market.id} className="border-b border-[var(--poly-border)]">
                    <td className="px-4 py-3">
                      <Link
                        href={`/markets/${item.market.id}`}
                        className="font-medium text-[var(--poly-text)] underline"
                      >
                        {item.market.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {item.resolvedOutcomeName ?? "--"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.netInvestedTokens.toFixed(2)} U
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(item.winningsTokens + item.refundsTokens).toFixed(2)} U
                    </td>
                    <td
                      className={`px-4 py-3 text-right ${
                        item.realizedPnLTokens >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {item.realizedPnLTokens.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      {item.market.resolveTime
                        ? new Date(item.market.resolveTime).toLocaleDateString()
                        : "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      ) : filtered.length === 0 ? (
        <EmptyState title="No positions yet" description="Active positions will appear after orders fill." />
      ) : (
        <Card className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--poly-border)] bg-[var(--poly-surface-muted)] text-xs uppercase text-[var(--poly-muted)]">
              <tr>
                <th className="px-4 py-3">Market</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3 text-right">Value</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-right">Avg cost</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">PnL</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Resolve</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={`${item.market.id}-${item.outcome}`} className="border-b border-[var(--poly-border)]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/markets/${item.market.id}`}
                      className="font-medium text-[var(--poly-text)] underline"
                    >
                      {item.market.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{item.outcome}</td>
                  <td className="px-4 py-3 text-right">
                    {item.valueTokens.toFixed(2)} U{" "}
                    <span className="text-[var(--poly-muted)]">
                      ({item.shares.toFixed(2)} shares)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.totalCostBasisTokens.toFixed(2)} U
                    <div className="text-xs text-[var(--poly-muted)]">
                      ({item.shares.toFixed(2)} shares)
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.avgCost.toFixed(2)} / share
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.currentPrice.toFixed(2)} / share
                  </td>
                  <td className={`px-4 py-3 text-right ${item.pnlTokens >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {item.pnlTokens.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">{item.market.status}</td>
                  <td className="px-4 py-3">
                    {item.market.resolveTime
                      ? new Date(item.market.resolveTime).toLocaleDateString()
                      : "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </PageContainer>
  );
}

