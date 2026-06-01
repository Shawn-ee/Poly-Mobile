"use client";

import { useEffect, useState } from "react";
import EventCard from "@/components/EventCard";

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
  activeMarketCount?: number | null;
  groupedSummary?: { title: string; slug: string } | null;
  topOutcomes?: string[] | null;
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/events");
      const data = await res.json().catch(() => null);
      setEvents((data?.events ?? []).filter((event: EventSummary) => Boolean(event.slug)));
      setLoading(false);
    };
    load();
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Events</h1>
        <p className="text-sm text-neutral-600">
          Browse grouped market events and jump into their related markets.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`event-skeleton-${index}`}
              className="h-40 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-600">
          No events yet.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {events.map((event) =>
            event.slug ? (
              <EventCard
                key={event.id}
                slug={event.slug}
                title={event.title}
                description={event.description}
                category={event.category}
                source={event.source}
                marketCount={event.marketCount}
                activeMarketCount={event.activeMarketCount ?? null}
                image={event.image}
                icon={event.icon}
                groupedLabel={event.groupedSummary?.title ?? null}
                topOutcomes={event.topOutcomes ?? null}
              />
            ) : null,
          )}
        </div>
      )}
    </main>
  );
}
