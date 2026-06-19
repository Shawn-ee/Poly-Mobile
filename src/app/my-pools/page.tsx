"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import PageContainer from "@/components/ui/PageContainer";
import { BetaNotice, PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState } from "@/components/ui/States";

type PoolMarketItem = {
  id: string;
  title: string;
  status: string;
  betCloseTime: string | null;
  resolveTime: string | null;
  resolvedOutcomeId: string | null;
  outcomes: { id: string; name: string }[];
  totalPot: number;
  participants: number;
};

type JoinedMarketItem = PoolMarketItem & {
  myBet: {
    outcomeId: string;
    outcomeName: string;
    amount: number;
  };
  isOwner: boolean;
};

export default function MyPoolsPage() {
  const [owned, setOwned] = useState<PoolMarketItem[]>([]);
  const [joined, setJoined] = useState<JoinedMarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [nowMs] = useState(() => Date.now());

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/pool-markets/mine");
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(data?.error ?? "Failed to load private markets.");
      return;
    }
    setOwned(data.owned ?? []);
    setJoined(data.joined ?? []);
  };

  useEffect(() => {
    let canceled = false;

    const loadInitial = async () => {
      const res = await fetch("/api/pool-markets/mine");
      const data = await res.json().catch(() => null);
      if (canceled) return;
      setLoading(false);
      if (!res.ok) {
        setError(data?.error ?? "Failed to load private markets.");
        return;
      }
      setOwned(data.owned ?? []);
      setJoined(data.joined ?? []);
    };

    void loadInitial();

    return () => {
      canceled = true;
    };
  }, []);

  const cancelMarket = async (marketId: string) => {
    setMessage("");
    const ok = window.confirm("Cancel this market and refund all participants?");
    if (!ok) return;
    const res = await fetch(`/api/pool-markets/${marketId}/cancel`, {
      method: "POST",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.error ?? "Failed to cancel market.");
      return;
    }
    setMessage("Market canceled and refunded.");
    await load();
  };

  const resolveLabel = (market: PoolMarketItem) => {
    if (!market.resolveTime) return "Resolve";
    const resolveAt = new Date(market.resolveTime).getTime();
    return nowMs >= resolveAt ? "Resolve now" : "Resolve";
  };

  const formatDateTime = (value: string | null) =>
    value ? new Date(value).toLocaleString() : "Not set";

  if (loading) {
    return (
      <PageContainer size="default">
        <Card className="p-5 text-sm text-[var(--poly-muted)]">Loading private markets...</Card>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer size="default">
        <ErrorState>{error}</ErrorState>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="default">
      <PageHeader
        eyebrow="Private pools"
        title="My private markets"
        description="Track pools you created or joined. Private pool actions remain separate from public sports markets."
        actions={<Link
          href="/create"
          className="inline-flex min-h-10 w-fit items-center rounded-lg border border-[var(--poly-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--poly-text)] transition hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
        >
          Create new
        </Link>}
      >
        <BetaNotice tone="info">
          Private pools are separate from the main sports orderbook experience and should stay review-gated before public launch.
        </BetaNotice>
      </PageHeader>
      {message ? (
        <div className="mt-4 rounded-lg border border-[var(--poly-border)] bg-[var(--poly-surface-muted)] px-3 py-2 text-sm text-[var(--poly-muted)]">
          {message}
        </div>
      ) : null}

      <section className="mt-6">
        <SectionHeader title="Owned by you" description="Pools where you can manage owner actions." />
        {owned.length === 0 ? (
          <EmptyState
            title="No owned private markets yet"
            description="Create a pool only when you are ready to manage participants and resolution timing."
          />
        ) : (
          <div className="space-y-3">
            {owned.map((market) => (
              <Card
                key={market.id}
                className="p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-base font-semibold text-[var(--poly-text)]">{market.title}</div>
                      <Badge>{market.status}</Badge>
                    </div>
                    <div className="mt-2 grid gap-1 text-xs text-[var(--poly-muted)] sm:grid-cols-2">
                      <div>Pot {market.totalPot.toFixed(2)} U</div>
                      <div>{market.participants} participants</div>
                      <div>Bet close: {formatDateTime(market.betCloseTime)}</div>
                      <div>Resolve: {formatDateTime(market.resolveTime)}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Link
                      href={`/markets/${market.id}`}
                      className="rounded-lg border border-[var(--poly-border)] px-3 py-1 text-[var(--poly-muted)] hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
                    >
                      Open
                    </Link>
                    {market.status !== "RESOLVED" ? (
                      <>
                        <Link
                          href={`/markets/${market.id}`}
                          className="rounded-lg border border-[var(--poly-border)] px-3 py-1 text-[var(--poly-muted)] hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
                        >
                          {resolveLabel(market)}
                        </Link>
                        <button
                          onClick={() => cancelMarket(market.id)}
                          className="rounded-lg border border-[var(--poly-border)] px-3 py-1 text-[var(--poly-muted)] hover:border-red-300 hover:text-red-700"
                          type="button"
                        >
                          Cancel
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <SectionHeader title="You joined" description="Pools where you already have a recorded bet." />
        {joined.length === 0 ? (
          <EmptyState title="No joined private markets yet" description="Markets you join will appear here." />
        ) : (
          <div className="space-y-3">
            {joined.map((market) => (
              <Card
                key={`${market.id}-${market.myBet.outcomeId}`}
                className="p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-base font-semibold text-[var(--poly-text)]">{market.title}</div>
                      <Badge>{market.status}</Badge>
                    </div>
                    <div className="mt-2 grid gap-1 text-xs text-[var(--poly-muted)] sm:grid-cols-2">
                      <div>
                        My bet: {market.myBet.outcomeName} for {market.myBet.amount.toFixed(2)} U
                      </div>
                      <div>Pot {market.totalPot.toFixed(2)} U</div>
                      <div>{market.participants} participants</div>
                    </div>
                  </div>
                  <Link
                    href={`/markets/${market.id}`}
                    className="rounded-lg border border-[var(--poly-border)] px-3 py-1 text-xs text-[var(--poly-muted)] hover:border-[var(--poly-primary)] hover:text-[var(--poly-primary)]"
                  >
                    Open
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}



