"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import MarketCard from "@/components/MarketCard";

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

  const selectedRow = useMemo(
    () => grouped?.rows.find((row) => row.marketId === selectedRowId) ?? grouped?.rows[0] ?? null,
    [grouped, selectedRowId],
  );

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
          selectedRow={selectedRow}
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
  selectedRow,
}: {
  grouped: GroupedEventResponse;
  selectedRowId: string;
  onSelectRow: (marketId: string) => void;
  selectedRow: GroupedEventResponse["rows"][number] | null;
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
                  <th className="px-3 py-2">Volume</th>
                  <th className="px-3 py-2">Bot Plan</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {grouped.rows.map((row) => (
                  <tr
                    key={row.marketId}
                    className={`cursor-pointer border-t border-neutral-100 ${selectedRowId === row.marketId ? "bg-neutral-50" : ""}`}
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
                          <div className="text-xs text-neutral-500">{row.referenceOnly ? "Reference only" : row.tradable ? "Tradable" : "Coming soon"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-medium">{formatPct(row.probability)}</td>
                    <td className="px-3 py-3">{formatMaybe(row.bestBid)} / {formatMaybe(row.bestAsk)}</td>
                    <td className="px-3 py-3">{formatCompact(row.volume24hr)}</td>
                    <td className="px-3 py-3">{formatMaybe(row.plannedBotBid)} / {formatMaybe(row.plannedBotAsk)}</td>
                    <td className="px-3 py-3">
                      <div className="text-xs">
                        <div>{row.isFresh ? "Fresh" : "Stale"}</div>
                        <div>{row.mmEligible ? "MM ok" : row.botInitializationStatus ?? row.qualityStatus ?? "--"}</div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sticky top-6 h-fit rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          {selectedRow ? (
            <>
              <div className="text-xs uppercase tracking-wide text-neutral-500">{grouped.marketGroup.title}</div>
              <h2 className="mt-1 text-2xl font-semibold text-neutral-900">{selectedRow.outcomeLabel}</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-neutral-50 p-3">
                  <div className="text-xs text-neutral-500">Buy Yes</div>
                  <div className="mt-1 text-lg font-semibold">{formatMaybe(selectedRow.buyYesPrice)}</div>
                </div>
                <div className="rounded-xl bg-neutral-50 p-3">
                  <div className="text-xs text-neutral-500">Buy No</div>
                  <div className="mt-1 text-lg font-semibold">{formatMaybe(selectedRow.buyNoPrice)}</div>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-neutral-700">
                <div className="flex items-center justify-between"><span>Reference</span><span>{formatMaybe(selectedRow.bestBid)} / {formatMaybe(selectedRow.bestAsk)}</span></div>
                <div className="flex items-center justify-between"><span>Bot plan</span><span>{formatMaybe(selectedRow.plannedBotBid)} / {formatMaybe(selectedRow.plannedBotAsk)}</span></div>
                <div className="flex items-center justify-between"><span>Freshness</span><span>{selectedRow.isFresh ? "Fresh" : "Stale"}</span></div>
                <div className="flex items-center justify-between"><span>Liquidity</span><span>{formatCompact(selectedRow.liquidity)}</span></div>
                <div className="flex items-center justify-between"><span>Mode</span><span>{selectedRow.referenceOnly ? "Reference only" : selectedRow.tradable ? "Trading enabled" : "Coming soon"}</span></div>
              </div>
              <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
                {selectedRow.tradable
                  ? "Open the market to place orders using the existing local orderbook flow."
                  : "Trading not enabled for this outcome yet."}
              </div>
              <Link
                href={`/markets/${selectedRow.marketId}`}
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-black px-4 py-3 text-sm font-medium text-white"
              >
                {selectedRow.tradable ? "Open Trading Panel" : "Open Market Detail"}
              </Link>
            </>
          ) : (
            <div className="text-sm text-neutral-500">Select an outcome.</div>
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

function formatCompact(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function nonBinaryMarketsSort(markets: EventMarket[]) {
  return [...markets].sort((left, right) => right.title.localeCompare(left.title));
}
