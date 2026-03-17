"use client";

import { useEffect, useMemo, useState } from "react";

type Snapshot = {
  generatedAt: string;
  overview: {
    activeBots: number;
    totalOpenOrders: number;
    totalFillsToday: number;
    totalNotionalSubmittedToday: string;
    totalNotionalFilledToday: string;
    totalApiErrorsToday: number;
    totalRateLimitHitsToday: number;
    totalIdempotencyConflictsToday: number;
  };
  bots: BotRow[];
  feed: FeedItem[];
  marketActivity: MarketActivityRow[];
  riskSummary: RiskSummaryRow[];
};

type BotRow = {
  id: string;
  userId: string;
  botName: string;
  userLabel: string;
  keyId: string;
  status: "ACTIVE" | "REVOKED";
  isDisabled: boolean;
  readOnly: boolean;
  scopes: string[];
  openOrders: number;
  ordersSubmittedToday: number;
  fillsToday: number;
  errorsToday: number;
  rateLimitHitsToday: number;
  idempotencyConflictsToday: number;
  lastUsedAt: string | null;
  lastEventTime: string | null;
  balance: {
    availableUSDC: string;
    lockedUSDC: string;
    totalUSDC: string;
  } | null;
  exposure: {
    openPositions: number;
    totalShares: string;
    reservedShares: string;
  };
  limits: {
    maxOrderSize: string | null;
    maxOrderNotional: string | null;
    maxOpenOrders: number | null;
    maxDailySubmittedNotional: string | null;
    allowedMarketIds: string[];
  };
  healthScore: number;
  healthLabel: string;
};

type FeedItem = {
  id: string;
  ts: string;
  botId: string | null;
  botName: string;
  userLabel: string;
  keyId: string | null;
  eventType: string;
  marketLabel: string | null;
  orderId: string | null;
  resultCode: string;
  details: string;
};

type MarketActivityRow = {
  marketId: string;
  marketTitle: string;
  recentOrders: number;
  recentFills: number;
  activeBots: number;
  lastOrderAt: string | null;
  lastFillAt: string | null;
};

type RiskSummaryRow = {
  code: string;
  count: number;
};

type BotDetail = {
  generatedAt: string;
  bot: BotRow;
  metadata: {
    createdAt: string;
    revokedAt: string | null;
    lastUsedAt: string | null;
  };
  recentUsage: Array<{
    id: string;
    ts: string;
    method: string;
    routeId: string;
    path: string;
    responseStatus: number;
    resultCode: string;
    orderId: string | null;
  }>;
  recentOrders: Array<{
    id: string;
    marketId: string;
    marketTitle: string;
    outcomeId: string;
    outcomeName: string;
    side: "BUY" | "SELL";
    price: string;
    amount: string;
    remaining: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  recentFills: Array<{
    id: string;
    ts: string;
    role: "TAKER" | "MAKER";
    marketId: string;
    marketTitle: string;
    outcomeId: string;
    outcomeName: string;
    side: "BUY" | "SELL";
    price: string;
    size: string;
    notionalUSDC: string;
    feeUSDC: string;
    orderId: string;
  }>;
  recentLedger: Array<{
    id: string;
    ts: string;
    operation: string;
    reason: string;
    amountDelta: string;
    deltaAvailableUSDC: string | null;
    deltaLockedUSDC: string | null;
    referenceType: string | null;
    referenceId: string | null;
  }>;
  recentEvents: Array<{
    id: string;
    ts: string;
    type: string;
    marketId: string | null;
    payload: unknown;
  }>;
  errorCounts: RiskSummaryRow[];
  openOrdersSummary: {
    count: number;
    reservedNotional: string;
  };
  positions: Array<{
    id: string;
    marketId: string;
    marketTitle: string;
    outcomeId: string;
    outcomeName: string;
    shares: string;
    reservedShares: string;
    avgCost: string;
    realizedPnl: string;
  }>;
};

const POLL_MS = 5000;

const formatTs = (value: string | null) => (value ? new Date(value).toLocaleString() : "--");

const shortDecimal = (value: string | null | undefined) => {
  if (!value) return "--";
  const [whole, frac = ""] = value.split(".");
  if (!frac) return value;
  return `${whole}.${frac.slice(0, 4)}`;
};

const badgeClass = (tone: "neutral" | "green" | "red" | "amber" | "blue") => {
  switch (tone) {
    case "green":
      return "border-green-200 bg-green-50 text-green-700";
    case "red":
      return "border-red-200 bg-red-50 text-red-700";
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "blue":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-neutral-200 bg-neutral-50 text-neutral-700";
  }
};

const botStatusTone = (bot: BotRow) => {
  if (bot.isDisabled || bot.status === "REVOKED") return "red";
  if (bot.readOnly) return "amber";
  if (bot.healthScore >= 85) return "green";
  if (bot.healthScore >= 65) return "blue";
  return "amber";
};

export default function BotMonitorDashboard() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [detail, setDetail] = useState<BotDetail | null>(null);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("MOST_ACTIVE");

  const loadSnapshot = async (keepLoading = false) => {
    if (!keepLoading) setLoading(true);
    const res = await fetch("/api/admin/bots", { cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Failed to load bot monitor.");
      setLoading(false);
      return;
    }
    setSnapshot(data as Snapshot);
    setError("");
    setLoading(false);
  };

  const loadDetail = async (botId: string) => {
    setDetailLoading(true);
    const res = await fetch(`/api/admin/bots/${botId}`, { cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setDetail(null);
      setDetailLoading(false);
      return;
    }
    setDetail(data as BotDetail);
    setDetailLoading(false);
  };

  useEffect(() => {
    void loadSnapshot();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadSnapshot(true);
      if (selectedBotId) {
        void loadDetail(selectedBotId);
      }
    }, POLL_MS);
    return () => window.clearInterval(interval);
  }, [selectedBotId]);

  useEffect(() => {
    if (!selectedBotId) {
      setDetail(null);
      return;
    }
    void loadDetail(selectedBotId);
  }, [selectedBotId]);

  const bots = useMemo(() => {
    if (!snapshot) return [];
    let rows = [...snapshot.bots];

    if (filter === "ENABLED") {
      rows = rows.filter((bot) => !bot.isDisabled && bot.status === "ACTIVE");
    }
    if (filter === "DISABLED") {
      rows = rows.filter((bot) => bot.isDisabled || bot.status === "REVOKED");
    }
    if (filter === "READ_ONLY") {
      rows = rows.filter((bot) => bot.readOnly);
    }
    if (filter === "ERRORING") {
      rows = rows.filter((bot) => bot.errorsToday > 0 || bot.rateLimitHitsToday > 0);
    }

    rows.sort((left, right) => {
      if (sortBy === "MOST_ERRORS") {
        return (right.errorsToday + right.rateLimitHitsToday) - (left.errorsToday + left.rateLimitHitsToday);
      }
      if (sortBy === "MOST_RECENT") {
        return (right.lastUsedAt ?? "").localeCompare(left.lastUsedAt ?? "");
      }
      if (sortBy === "HEALTH") {
        return right.healthScore - left.healthScore;
      }
      return (right.ordersSubmittedToday + right.fillsToday) - (left.ordersSubmittedToday + left.fillsToday);
    });

    return rows;
  }, [filter, snapshot, sortBy]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Shadow Mode Bot Monitor</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Internal read-only monitor for canonical bot activity. Refreshes every {POLL_MS / 1000}s.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadSnapshot()}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
        >
          Refresh now
        </button>
      </div>

      {loading ? <p className="mt-4 text-sm text-neutral-600">Loading bot monitor...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {snapshot ? (
        <div className="mt-6 space-y-6">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Active bots", String(snapshot.overview.activeBots)],
              ["Open orders", String(snapshot.overview.totalOpenOrders)],
              ["Fills today", String(snapshot.overview.totalFillsToday)],
              ["Submitted notional", shortDecimal(snapshot.overview.totalNotionalSubmittedToday)],
              ["Filled notional", shortDecimal(snapshot.overview.totalNotionalFilledToday)],
              ["API errors", String(snapshot.overview.totalApiErrorsToday)],
              ["Rate-limit hits", String(snapshot.overview.totalRateLimitHitsToday)],
              ["Idempotency conflicts", String(snapshot.overview.totalIdempotencyConflictsToday)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-neutral-200 bg-white p-4">
                <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
                <div className="mt-2 text-2xl font-semibold">{value}</div>
              </div>
            ))}
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Bots</h2>
              <div className="flex flex-wrap gap-2 text-sm">
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className="rounded-md border border-neutral-300 px-3 py-2"
                >
                  <option value="ALL">All bots</option>
                  <option value="ENABLED">Enabled</option>
                  <option value="DISABLED">Disabled</option>
                  <option value="READ_ONLY">Read-only</option>
                  <option value="ERRORING">Erroring</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="rounded-md border border-neutral-300 px-3 py-2"
                >
                  <option value="MOST_ACTIVE">Most active</option>
                  <option value="MOST_ERRORS">Most errors</option>
                  <option value="MOST_RECENT">Most recent</option>
                  <option value="HEALTH">Health score</option>
                </select>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-2 py-2">Bot</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Scopes</th>
                    <th className="px-2 py-2">Open</th>
                    <th className="px-2 py-2">Orders</th>
                    <th className="px-2 py-2">Fills</th>
                    <th className="px-2 py-2">Errors</th>
                    <th className="px-2 py-2">Balance</th>
                    <th className="px-2 py-2">Exposure</th>
                    <th className="px-2 py-2">Last used</th>
                  </tr>
                </thead>
                <tbody>
                  {bots.map((bot) => (
                    <tr
                      key={bot.id}
                      onClick={() => setSelectedBotId(bot.id)}
                      className="cursor-pointer border-t border-neutral-100 hover:bg-neutral-50"
                    >
                      <td className="px-2 py-3">
                        <div className="font-medium">{bot.botName}</div>
                        <div className="text-xs text-neutral-500">{bot.userLabel}</div>
                        <div className="text-xs text-neutral-400">{bot.keyId}</div>
                      </td>
                      <td className="px-2 py-3">
                        <span className={`inline-flex rounded-full border px-2 py-1 text-xs ${badgeClass(botStatusTone(bot))}`}>
                          {bot.healthLabel}
                        </span>
                        <div className="mt-1 text-xs text-neutral-500">
                          {bot.isDisabled ? "Disabled" : bot.readOnly ? "Read-only" : bot.status}
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex max-w-[220px] flex-wrap gap-1">
                          {bot.scopes.map((scope) => (
                            <span key={scope} className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px]">
                              {scope}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-2 py-3">{bot.openOrders}</td>
                      <td className="px-2 py-3">{bot.ordersSubmittedToday}</td>
                      <td className="px-2 py-3">{bot.fillsToday}</td>
                      <td className="px-2 py-3">
                        <div>{bot.errorsToday}</div>
                        <div className="text-xs text-neutral-500">RL {bot.rateLimitHitsToday}</div>
                      </td>
                      <td className="px-2 py-3 text-xs">
                        <div>Avail {shortDecimal(bot.balance?.availableUSDC)}</div>
                        <div>Locked {shortDecimal(bot.balance?.lockedUSDC)}</div>
                      </td>
                      <td className="px-2 py-3 text-xs">
                        <div>{bot.exposure.openPositions} positions</div>
                        <div>Reserved {shortDecimal(bot.exposure.reservedShares)}</div>
                      </td>
                      <td className="px-2 py-3 text-xs">
                        <div>{formatTs(bot.lastUsedAt)}</div>
                        <div className="text-neutral-500">Evt {formatTs(bot.lastEventTime)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <h2 className="text-lg font-semibold">Live Activity Feed</h2>
              <div className="mt-4 space-y-3">
                {snapshot.feed.map((item) => (
                  <div key={item.id} className="rounded-md border border-neutral-100 bg-neutral-50 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-medium">{item.botName}</div>
                      <div className="text-xs text-neutral-500">{formatTs(item.ts)}</div>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      <span className={`rounded-full border px-2 py-0.5 ${badgeClass(item.resultCode === "OK" ? "green" : "red")}`}>
                        {item.eventType}
                      </span>
                      <span className="rounded-full border border-neutral-200 px-2 py-0.5">{item.resultCode}</span>
                      {item.marketLabel ? (
                        <span className="rounded-full border border-neutral-200 px-2 py-0.5">{item.marketLabel}</span>
                      ) : null}
                    </div>
                    <div className="mt-2 text-xs text-neutral-600">{item.details}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <section className="rounded-lg border border-neutral-200 bg-white p-4">
                <h2 className="text-lg font-semibold">Risk / Error Codes</h2>
                <div className="mt-4 space-y-2 text-sm">
                  {snapshot.riskSummary.map((item) => (
                    <div key={item.code} className="flex items-center justify-between rounded-md border border-neutral-100 px-3 py-2">
                      <span>{item.code}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-neutral-200 bg-white p-4">
                <h2 className="text-lg font-semibold">Market Activity</h2>
                <div className="mt-4 space-y-2 text-sm">
                  {snapshot.marketActivity.map((item) => (
                    <div key={item.marketId} className="rounded-md border border-neutral-100 px-3 py-2">
                      <div className="font-medium">{item.marketTitle}</div>
                      <div className="mt-1 text-xs text-neutral-600">
                        Orders {item.recentOrders} · Fills {item.recentFills} · Bots {item.activeBots}
                      </div>
                      <div className="mt-1 text-xs text-neutral-500">
                        Last order {formatTs(item.lastOrderAt)} · Last fill {formatTs(item.lastFillAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </div>
      ) : null}

      {selectedBotId ? (
        <div className="fixed inset-y-0 right-0 z-40 w-full max-w-2xl overflow-y-auto border-l border-neutral-200 bg-white shadow-2xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold">Bot Detail</h2>
              <p className="text-xs text-neutral-500">
                {detail ? detail.bot.botName : "Loading..."} · {detail ? detail.bot.keyId : selectedBotId}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedBotId(null)}
              className="rounded-md border border-neutral-300 px-3 py-1 text-sm"
            >
              Close
            </button>
          </div>
          <div className="px-5 py-4">
            {detailLoading && !detail ? <p className="text-sm text-neutral-600">Loading bot detail...</p> : null}
            {detail ? (
              <div className="space-y-6">
                <section className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
                    <div className="font-medium">{detail.bot.botName}</div>
                    <div className="mt-1 text-neutral-600">{detail.bot.userLabel}</div>
                    <div className="mt-2 text-xs text-neutral-500">Created {formatTs(detail.metadata.createdAt)}</div>
                    <div className="text-xs text-neutral-500">Last used {formatTs(detail.metadata.lastUsedAt)}</div>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
                    <div>Health {detail.bot.healthScore}</div>
                    <div>Open orders {detail.openOrdersSummary.count}</div>
                    <div>Reserved notional {shortDecimal(detail.openOrdersSummary.reservedNotional)}</div>
                    <div>Error codes {detail.errorCounts.reduce((sum, item) => sum + item.count, 0)}</div>
                  </div>
                </section>

                <section className="rounded-lg border border-neutral-200 bg-white p-4">
                  <h3 className="text-base font-semibold">Policies</h3>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <div>Read-only: {String(detail.bot.readOnly)}</div>
                    <div>Disabled: {String(detail.bot.isDisabled)}</div>
                    <div>Max order size: {detail.bot.limits.maxOrderSize ?? "--"}</div>
                    <div>Max order notional: {detail.bot.limits.maxOrderNotional ?? "--"}</div>
                    <div>Max open orders: {detail.bot.limits.maxOpenOrders ?? "--"}</div>
                    <div>Max daily notional: {detail.bot.limits.maxDailySubmittedNotional ?? "--"}</div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {detail.bot.scopes.map((scope) => (
                      <span key={scope} className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px]">
                        {scope}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-neutral-200 bg-white p-4">
                  <h3 className="text-base font-semibold">Recent API Usage</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    {detail.recentUsage.map((item) => (
                      <div key={item.id} className="rounded-md border border-neutral-100 px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <div>{item.method} {item.path}</div>
                          <div className="text-xs text-neutral-500">{formatTs(item.ts)}</div>
                        </div>
                        <div className="mt-1 text-xs text-neutral-600">
                          {item.routeId} · {item.resultCode} · HTTP {item.responseStatus}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-neutral-200 bg-white p-4">
                  <h3 className="text-base font-semibold">Recent Orders</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    {detail.recentOrders.map((item) => (
                      <div key={item.id} className="rounded-md border border-neutral-100 px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium">{item.marketTitle}</div>
                          <div className="text-xs text-neutral-500">{formatTs(item.createdAt)}</div>
                        </div>
                        <div className="mt-1 text-xs text-neutral-600">
                          {item.side} {item.amount} {item.outcomeName} @ {item.price} · {item.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-neutral-200 bg-white p-4">
                  <h3 className="text-base font-semibold">Recent Fills</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    {detail.recentFills.map((item) => (
                      <div key={`${item.id}-${item.role}`} className="rounded-md border border-neutral-100 px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium">{item.marketTitle}</div>
                          <div className="text-xs text-neutral-500">{formatTs(item.ts)}</div>
                        </div>
                        <div className="mt-1 text-xs text-neutral-600">
                          {item.role} {item.side} {item.size} {item.outcomeName} @ {item.price} · Notional {item.notionalUSDC}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-neutral-200 bg-white p-4">
                  <h3 className="text-base font-semibold">Recent Ledger / Account Activity</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    {detail.recentLedger.map((item) => (
                      <div key={item.id} className="rounded-md border border-neutral-100 px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <div>{item.operation} / {item.reason}</div>
                          <div className="text-xs text-neutral-500">{formatTs(item.ts)}</div>
                        </div>
                        <div className="mt-1 text-xs text-neutral-600">
                          Available {item.deltaAvailableUSDC ?? "--"} · Locked {item.deltaLockedUSDC ?? "--"} · Ref {item.referenceType ?? "--"}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-neutral-200 bg-white p-4">
                  <h3 className="text-base font-semibold">Recent Event Stream Activity</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    {detail.recentEvents.map((item) => (
                      <div key={item.id} className="rounded-md border border-neutral-100 px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <div>{item.type}</div>
                          <div className="text-xs text-neutral-500">{formatTs(item.ts)}</div>
                        </div>
                        <div className="mt-1 text-xs text-neutral-600">
                          Market {item.marketId ?? "--"}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-neutral-200 bg-white p-4">
                  <h3 className="text-base font-semibold">Open Positions Summary</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    {detail.positions.map((item) => (
                      <div key={item.id} className="rounded-md border border-neutral-100 px-3 py-2">
                        <div className="font-medium">{item.marketTitle}</div>
                        <div className="mt-1 text-xs text-neutral-600">
                          {item.outcomeName} · Shares {item.shares} · Reserved {item.reservedShares} · Avg cost {item.avgCost}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
