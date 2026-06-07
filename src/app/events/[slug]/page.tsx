"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import MarketCard from "@/components/MarketCard";
import GroupedTradeTicket, { type SelectedTrade } from "@/components/GroupedTradeTicket";

type EventSummary = {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  category: string | null;
  status: string | null;
  source: string | null;
  externalEventId: string | null;
  externalSlug: string | null;
  image: string | null;
  icon: string | null;
  marketCount: number;
  activeMarketCount: number;
  closedMarketCount: number;
  hasGroupedMarkets?: boolean;
  metadata?: unknown;
  createdAt: string;
  updatedAt: string;
};

type EventMarket = {
  id: string;
  title: string;
  description: string;
  status: string;
  visibility: "PUBLIC" | "PRIVATE";
  mechanism: "ORDERBOOK" | "POOL";
  prices: { YES: number; NO: number } | null;
  referenceOnly?: boolean | null;
  tradable?: boolean | null;
  outcomes: { id: string; name: string }[];
  resolveTime: string | null;
  referenceSummary?: {
    source: string;
    referenceBid: number | null;
    referenceAsk: number | null;
    plannedBotBid: number | null;
    plannedBotAsk: number | null;
    qualityStatus: string | null;
    isFresh: boolean;
    mmEligible: boolean;
    dryRun: boolean;
    quotePlanEnabled: boolean;
  } | null;
};

type GroupedEventResponse = {
  event: EventSummary;
  marketGroup: {
    title: string;
    slug: string;
    groupType: string;
    resolutionMode: string;
    source: string;
    externalSlug: string | null;
    expectedSumYesAround: number | null;
    negativeRiskLike: boolean;
    note: string | null;
  };
  rows: Array<{
    marketId: string;
    yesOutcomeId: string | null;
    noOutcomeId: string | null;
    outcomeLabel: string;
    icon: string | null;
    question: string;
    probability: number | null;
    bestBid: number | null;
    bestAsk: number | null;
    buyYesPrice: number | null;
    buyNoPrice: number | null;
    plannedBotBid: number | null;
    plannedBotAsk: number | null;
    mmEligible: boolean;
    botInitializationStatus: string | null;
    tradable: boolean;
    referenceOnly: boolean;
    volume24hr: number | null;
    liquidity: number | null;
    isFresh: boolean;
    qualityStatus: string | null;
    teamSlug: string;
    externalSlug: string | null;
  }>;
  sumYes: number;
  importedOutcomeCount: number;
  allOutcomesImported: boolean;
  freshnessSummary: {
    freshCount: number;
    staleCount: number;
    averageAgeMs: number | null;
  };
  groupStatus: "healthy" | "incomplete" | "stale" | "overpriced" | "underpriced";
};

export default function EventPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [markets, setMarkets] = useState<EventMarket[]>([]);
  const [grouped, setGrouped] = useState<GroupedEventResponse | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string>("");
  const [selectedTrade, setSelectedTrade] = useState<SelectedTrade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      const eventRes = await fetch(`/api/events/${encodeURIComponent(slug)}`);
      const eventData = await eventRes.json().catch(() => null);
      if (!eventRes.ok) {
        setError(eventData?.error ?? "Failed to load event.");
        setLoading(false);
        return;
      }

      const nextEvent = eventData.event as EventSummary;
      setEvent(nextEvent);

      if (nextEvent.hasGroupedMarkets) {
        const groupedRes = await fetch(`/api/events/${encodeURIComponent(slug)}/grouped-markets`);
        const groupedData = await groupedRes.json().catch(() => null);
        if (!groupedRes.ok) {
          setError(groupedData?.error ?? "Failed to load grouped markets.");
          setLoading(false);
          return;
        }
        setGrouped(groupedData as GroupedEventResponse);
        setSelectedRowId((groupedData.rows?.[0]?.marketId as string | undefined) ?? "");
        setSelectedTrade(null);
        setMarkets([]);
      } else {
        const marketsRes = await fetch(`/api/events/${encodeURIComponent(slug)}/markets`);
        const marketsData = await marketsRes.json().catch(() => null);
        if (!marketsRes.ok) {
          setError(marketsData?.error ?? "Failed to load event markets.");
          setLoading(false);
          return;
        }
        setMarkets(marketsData.markets ?? []);
        setGrouped(null);
      }
      setLoading(false);
    };

    load();
  }, [slug]);

  // Auto-refresh grouped data every 10s while viewing a grouped event
  useEffect(() => {
    if (!slug || !grouped) return;
    const timer = setInterval(async () => {
      const groupedRes = await fetch(`/api/events/${encodeURIComponent(slug)}/grouped-markets`);
      const groupedData = await groupedRes.json().catch(() => null);
      if (groupedRes.ok && groupedData) {
        setGrouped(groupedData as GroupedEventResponse);
      }
    }, 10_000);
    return () => clearInterval(timer);
  }, [slug, grouped !== null]);

  const [binaryMarkets, nonBinaryMarkets] = useMemo(() => {
    const binary: EventMarket[] = [];
    const other: EventMarket[] = [];
    for (const market of markets) {
      if (market.prices && market.outcomes.length === 2) {
        binary.push(market);
      } else {
        other.push(market);
      }
    }
    return [binary, nonBinaryMarketsSort(other)];
  }, [markets]);

  if (loading) {
    return <main className="mx-auto max-w-7xl px-6 py-10 text-sm text-neutral-600">Loading event...</main>;
  }

  if (error || !event) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-600">
          {error ?? "Event not found."}
        </div>
      </main>
    );
  }

  if (grouped) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <GroupedEventView
          grouped={grouped}
          selectedRowId={selectedRowId}
          onSelectRow={setSelectedRowId}
          selectedTrade={selectedTrade}
          onSelectTrade={setSelectedTrade}
          onCloseTrade={() => setSelectedTrade(null)}
          onRefreshGrouped={async () => {
            const groupedRes = await fetch(`/api/events/${encodeURIComponent(slug)}/grouped-markets`);
            const groupedData = await groupedRes.json().catch(() => null);
            if (groupedRes.ok && groupedData) {
              setGrouped(groupedData as GroupedEventResponse);
            }
          }}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 text-sm text-neutral-500">
          <Link href="/events" className="hover:text-neutral-700 hover:underline">
            All events
          </Link>
        </div>
        <div className="flex items-start gap-4">
          {event.image || event.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.image ?? event.icon ?? ""} alt={event.title} className="h-16 w-16 rounded-xl object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-neutral-100 text-xs font-semibold text-neutral-500">EVT</div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold text-neutral-900">{event.title}</h1>
            {event.description ? <p className="mt-2 text-sm text-neutral-600">{event.description}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-600">
              {event.category ? <span className="rounded-full border border-neutral-200 px-2 py-1">{event.category}</span> : null}
              {event.source ? <span className="rounded-full border border-neutral-200 px-2 py-1">{event.source}</span> : null}
              {event.status ? <span className="rounded-full border border-neutral-200 px-2 py-1">{event.status}</span> : null}
            </div>
          </div>
        </div>
      </div>

      {binaryMarkets.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {binaryMarkets.map((market) => (
            <MarketCard
              key={market.id}
              id={market.id}
              title={market.title}
              status={market.status}
              resolveTime={market.resolveTime}
              outcomes={market.outcomes}
              prices={market.prices ?? { YES: 0.5, NO: 0.5 }}
              visibility={market.visibility}
              mechanism={market.mechanism}
              referenceOnly={market.referenceOnly}
              tradable={market.tradable}
              referenceSummary={market.referenceSummary}
            />
          ))}
        </div>
      ) : null}

      {nonBinaryMarkets.length ? (
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold">Other Event Markets</h2>
          {nonBinaryMarkets.map((market) => (
            <Link key={market.id} href={`/markets/${market.id}`} className="block rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-300 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900">{market.title}</h3>
                  <p className="mt-1 text-sm text-neutral-600">{market.description}</p>
                </div>
                <div className="text-xs text-neutral-500">{market.referenceOnly && market.tradable === false ? "Coming soon" : market.status}</div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </main>
  );
}

function GroupedEventView({
  grouped,
  selectedRowId,
  onSelectRow,
  selectedTrade,
  onSelectTrade,
  onCloseTrade,
  onRefreshGrouped,
}: {
  grouped: GroupedEventResponse;
  selectedRowId: string;
  onSelectRow: (marketId: string) => void;
  selectedTrade: SelectedTrade | null;
  onSelectTrade: (trade: SelectedTrade) => void;
  onCloseTrade: () => void;
  onRefreshGrouped: () => Promise<void>;
}) {
  return (
    <>
      <div className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 text-sm text-neutral-500">
          <Link href="/events" className="hover:text-neutral-700 hover:underline">
            All events
          </Link>
        </div>
        <div className="flex items-start gap-4">
          {grouped.event.image || grouped.event.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={grouped.event.image ?? grouped.event.icon ?? ""} alt={grouped.event.title} className="h-16 w-16 rounded-xl object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-neutral-100 text-xs font-semibold text-neutral-500">WC</div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold text-neutral-900">{grouped.event.title}</h1>
            {grouped.event.description ? <p className="mt-2 text-sm text-neutral-600">{grouped.event.description}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-600">
              <span className="rounded-full border border-neutral-200 px-2 py-1">{grouped.marketGroup.groupType}</span>
              <span className="rounded-full border border-neutral-200 px-2 py-1">{grouped.marketGroup.resolutionMode}</span>
              <span className="rounded-full border border-neutral-200 px-2 py-1">{grouped.marketGroup.source}</span>
              <span className="rounded-full border border-neutral-200 px-2 py-1">
                Sum YES {(grouped.sumYes * 100).toFixed(1)}%
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-neutral-500">
              <span>{grouped.rows.length} outcomes</span>
              <span>{grouped.freshnessSummary.freshCount} fresh</span>
              <span>Status: {grouped.groupStatus}</span>
              {!grouped.allOutcomesImported ? <span>Partial list</span> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2.2fr_1fr]">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-3 py-2">Outcome</th>
                  <th className="px-3 py-2">Prob</th>
                  <th className="px-3 py-2">Bid / Ask</th>
                  <th className="px-3 py-2 text-right">Trade</th>
                </tr>
              </thead>
              <tbody>
                {grouped.rows.map((row) => (
                  <tr
                    key={row.marketId}
                    className={`border-t border-neutral-100 transition ${
                      selectedRowId === row.marketId ? "bg-neutral-50" : ""
                    }`}
                    onClick={() => onSelectRow(row.marketId)}
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        {row.icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.icon} alt={row.outcomeLabel} className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-500">
                            {row.outcomeLabel.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-neutral-900">{row.outcomeLabel}</div>
                          <div className="text-xs text-neutral-500">
                            {row.referenceOnly && !row.tradable ? "Reference only" : "Tradable"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-medium">{formatPct(row.probability)}</td>
                    <td className="px-3 py-3 text-xs">
                      <div>{formatMaybe(row.bestBid)} / {formatMaybe(row.bestAsk)}</div>
                      <div className="text-neutral-400">{formatCompact(row.volume24hr)} vol</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectRow(row.marketId);
                            onSelectTrade({
                              marketId: row.marketId,
                              yesOutcomeId: row.yesOutcomeId,
                              noOutcomeId: row.noOutcomeId,
                              outcomeLabel: row.outcomeLabel,
                              tradeOutcome: "YES",
                              buyYesPrice: row.buyYesPrice,
                              buyNoPrice: row.buyNoPrice,
                              bestBid: row.bestBid,
                              bestAsk: row.bestAsk,
                              plannedBotBid: row.plannedBotBid,
                              plannedBotAsk: row.plannedBotAsk,
                              probability: row.probability,
                            });
                          }}
                          disabled={!row.tradable}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                            row.tradable
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "cursor-not-allowed bg-neutral-100 text-neutral-400"
                          }`}
                        >
                          Yes {formatPriceShort(row.buyYesPrice ?? row.bestAsk ?? row.plannedBotAsk ?? row.probability)}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectRow(row.marketId);
                            onSelectTrade({
                              marketId: row.marketId,
                              yesOutcomeId: row.yesOutcomeId,
                              noOutcomeId: row.noOutcomeId,
                              outcomeLabel: row.outcomeLabel,
                              tradeOutcome: "NO",
                              buyYesPrice: row.buyYesPrice,
                              buyNoPrice: row.buyNoPrice,
                              bestBid: row.bestBid,
                              bestAsk: row.bestAsk,
                              plannedBotBid: row.plannedBotBid,
                              plannedBotAsk: row.plannedBotAsk,
                              probability: row.probability,
                            });
                          }}
                          disabled={!row.tradable}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                            row.tradable
                              ? "bg-rose-100 text-rose-800 hover:bg-rose-200"
                              : "cursor-not-allowed bg-neutral-100 text-neutral-400"
                          }`}
                        >
                          No {formatPriceShort(row.buyNoPrice ?? (row.bestBid != null ? 1 - row.bestBid : (row.buyYesPrice != null ? 1 - row.buyYesPrice : (row.probability != null ? 1 - row.probability : null))))}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sticky top-6 h-fit">
          {selectedTrade ? (
            <GroupedTradeTicket
              trade={selectedTrade}
              onClose={onCloseTrade}
              onOrderPlaced={onRefreshGrouped}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
              Click <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">Yes</span> or{" "}
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800">No</span>{" "}
              on an outcome to trade.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function formatPct(value: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "--";
}

function formatMaybe(value: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "") : "--";
}

function formatPriceShort(value: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? `${(value * 100).toFixed(0)}¢` : "--";
}

function formatCompact(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function nonBinaryMarketsSort(markets: EventMarket[]) {
  return [...markets].sort((left, right) => right.title.localeCompare(left.title));
}
