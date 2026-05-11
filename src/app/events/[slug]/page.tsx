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
  outcomes: { id: string; name: string }[];
  resolveTime: string | null;
};

export default function EventPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [markets, setMarkets] = useState<EventMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      const [eventRes, marketsRes] = await Promise.all([
        fetch(`/api/events/${encodeURIComponent(slug)}`),
        fetch(`/api/events/${encodeURIComponent(slug)}/markets`),
      ]);

      const eventData = await eventRes.json().catch(() => null);
      const marketsData = await marketsRes.json().catch(() => null);

      if (!eventRes.ok) {
        setError(eventData?.error ?? "Failed to load event.");
        setLoading(false);
        return;
      }

      if (!marketsRes.ok) {
        setError(marketsData?.error ?? "Failed to load event markets.");
        setLoading(false);
        return;
      }

      setEvent(eventData.event ?? null);
      setMarkets(marketsData.markets ?? []);
      setLoading(false);
    };

    load();
  }, [slug]);

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
    return [binary, other];
  }, [markets]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="text-sm text-neutral-600">Loading event...</div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-600">
          {error ?? "Event not found."}
        </div>
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
            <img
              src={event.image ?? event.icon ?? ""}
              alt={event.title}
              className="h-16 w-16 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-neutral-100 text-xs font-semibold text-neutral-500">
              EVT
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold text-neutral-900">{event.title}</h1>
            {event.description ? (
              <p className="mt-2 text-sm text-neutral-600">{event.description}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-600">
              {event.category ? (
                <span className="rounded-full border border-neutral-200 px-2 py-1">{event.category}</span>
              ) : null}
              {event.source ? (
                <span className="rounded-full border border-neutral-200 px-2 py-1">{event.source}</span>
              ) : null}
              {event.status ? (
                <span className="rounded-full border border-neutral-200 px-2 py-1">{event.status}</span>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-neutral-500">
              <span>{event.marketCount} markets</span>
              <span>{event.activeMarketCount} active</span>
              <span>{event.closedMarketCount} closed/resolved</span>
            </div>
            {event.externalSlug ? (
              <div className="mt-3 text-xs text-neutral-500">External slug: {event.externalSlug}</div>
            ) : null}
          </div>
        </div>
      </div>

      {markets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-600">
          This event has no markets yet.
        </div>
      ) : (
        <>
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
                />
              ))}
            </div>
          ) : null}

          {nonBinaryMarkets.length ? (
            <div className="mt-8 space-y-4">
              <h2 className="text-lg font-semibold">Other Event Markets</h2>
              {nonBinaryMarkets.map((market) => (
                <Link
                  key={market.id}
                  href={`/markets/${market.id}`}
                  className="block rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900">{market.title}</h3>
                      <p className="mt-1 text-sm text-neutral-600">{market.description}</p>
                    </div>
                    <div className="text-xs text-neutral-500">{market.status}</div>
                  </div>
                  <div className="mt-3 text-xs text-neutral-500">
                    Outcomes: {market.outcomes.map((outcome) => outcome.name).join(" / ")}
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}
