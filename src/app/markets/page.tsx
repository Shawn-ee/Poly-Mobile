"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MarketCard from "@/components/MarketCard";
import EventCard from "@/components/EventCard";

type Market = {
  id: string;
  title: string;
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

type EventSummary = {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  category: string | null;
  source: string | null;
  marketCount: number;
  activeMarketCount?: number | null;
  image: string | null;
  icon: string | null;
  groupedSummary?: { title: string; slug: string } | null;
  topOutcomes?: string[] | null;
};

function MarketsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [topTags, setTopTags] = useState<
    { id: string; name: string; slug: string }[]
  >([]);
  const [sportsTags, setSportsTags] = useState<
    { id: string; name: string; slug: string }[]
  >([]);
  const [showAllLeagues, setShowAllLeagues] = useState(false);
  const [view, setView] = useState<string>("live");

  const activeCategory = searchParams.get("category") ?? "";
  const activeLeague = searchParams.get("league") ?? "";
  const activeView = searchParams.get("view") ?? "live";

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.get("view")) {
      params.set("view", "live");
    }
    if (!params.get("category") && !params.get("league")) {
      params.set("category", "sports");
      params.set("league", "nba");
      router.replace(`/markets?${params.toString()}`);
      return;
    }

    if (params.get("category") !== "sports" && params.get("league")) {
      params.delete("league");
      router.replace(`/markets?${params.toString()}`);
      return;
    }

    if (params.get("category") === "sports" && !params.get("league")) {
      params.set("league", "nba");
      router.replace(`/markets?${params.toString()}`);
    }
  }, [router, searchParams]);

  useEffect(() => {
    const load = async () => {
      const params = new URLSearchParams();
      if (activeCategory && activeCategory !== "all") {
        params.set("category", activeCategory);
      }
      if (activeLeague) {
        params.set("tags", activeLeague);
      }
      params.set("view", activeView);
      const res = await fetch(`/api/markets?${params.toString()}`);
      const data = await res.json();
      setMarkets(data.markets ?? []);
      setLoading(false);
    };
    load();
  }, [activeCategory, activeLeague, activeView]);

  useEffect(() => {
    const loadTags = async () => {
      const [topRes, sportsRes] = await Promise.all([
        fetch("/api/tags?group=top-nav"),
        fetch("/api/tags?group=sports"),
      ]);
      if (topRes.ok) {
        const data = await topRes.json();
        const base = data.tags ?? [];
        const ordered = [
          "sports",
          "politics",
          "crypto",
          "finance",
          "tech",
          "world",
          "elections",
        ];
        const bySlug = new Map(base.map((tag: any) => [tag.slug, tag]));
        const list = [
          { id: "all", name: "All", slug: "all" },
          ...ordered.map((slug) => bySlug.get(slug)).filter(Boolean),
        ];
        setTopTags(list as { id: string; name: string; slug: string }[]);
      }
      if (sportsRes.ok) {
        const data = await sportsRes.json();
        setSportsTags(data.tags ?? []);
      }
    };
    loadTags();

    const loadEvents = async () => {
      const res = await fetch("/api/events");
      if (!res.ok) return;
      const data = await res.json();
      setEvents((data.events ?? []).filter((event: EventSummary) => Boolean(event.slug)).slice(0, 3));
    };
    loadEvents();
  }, []);

  const sportsChipOrder = useMemo(() => {
    if (!sportsTags.length) return [];
    const nba = sportsTags.find((tag) => tag.slug === "nba");
    const rest = sportsTags.filter((tag) => tag.slug !== "nba");
    return nba ? [nba, ...rest] : rest;
  }, [sportsTags]);

  const visibleSportsChips = showAllLeagues
    ? sportsChipOrder
    : sportsChipOrder.slice(0, 3);

  const setFilters = (category: string, league: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    if (league) {
      params.set("league", league);
    } else {
      params.delete("league");
    }
    if (!params.get("view")) {
      params.set("view", "live");
    }
    router.replace(`/markets?${params.toString()}`);
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Live Markets</h1>
        <p className="text-sm text-neutral-600">
          Browse markets and trade with U.
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {[
          { key: "live", label: "Live" },
          { key: "resolved", label: "Resolved" },
          { key: "all", label: "All" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("view", tab.key);
              router.replace(`/markets?${params.toString()}`);
              setView(tab.key);
            }}
            className={`rounded-full border px-3 py-1 text-xs ${
              activeView === tab.key
                ? "border-black bg-black text-white"
                : "border-neutral-300 text-neutral-700"
            }`}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-1">
        {topTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => {
              if (tag.slug === "all") {
                setFilters("all", "");
                return;
              }
              if (tag.slug === "sports") {
                setFilters("sports", activeLeague || "nba");
                return;
              }
              setFilters(tag.slug, "");
            }}
            className={`rounded-full border px-3 py-1 text-xs ${
              (tag.slug === "all" && (!activeCategory || activeCategory === "all")) ||
              (tag.slug !== "all" && activeCategory === tag.slug)
                ? "border-black bg-black text-white"
                : "border-neutral-300 text-neutral-700"
            }`}
            type="button"
          >
            {tag.name}
          </button>
        ))}
        {activeCategory === "sports" ? (
          <button
            onClick={() => setShowAllLeagues((prev) => !prev)}
            className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-700"
            type="button"
          >
            {showAllLeagues ? "Less" : "Leagues"}
          </button>
        ) : null}
      </div>

      {activeCategory === "sports" ? (
        <div className="mb-2 flex flex-wrap gap-1">
          {visibleSportsChips.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setFilters("sports", tag.slug)}
              className={`rounded-full border px-3 py-1 text-xs ${
                activeLeague === tag.slug
                  ? "border-black bg-black text-white"
                  : "border-neutral-300 text-neutral-700"
              }`}
              type="button"
            >
              {tag.name}
            </button>
          ))}
        </div>
      ) : null}

      {events.length ? (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Active Events</h2>
              <p className="text-sm text-neutral-600">Explore grouped markets before drilling into individual contracts.</p>
            </div>
            <button
              onClick={() => router.push("/events")}
              className="text-sm text-neutral-600 hover:text-neutral-900"
              type="button"
            >
              All events
            </button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        </section>
      ) : null}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="h-40 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100"
            />
          ))}
        </div>
      ) : markets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-600">
          No markets yet.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {markets.map((market) => (
            market.prices ? (
              <MarketCard
                key={market.id}
                id={market.id}
                title={market.title}
                status={market.status}
                resolveTime={market.resolveTime}
                outcomes={market.outcomes}
                prices={market.prices}
                visibility={market.visibility}
                mechanism={market.mechanism}
                referenceOnly={market.referenceOnly}
                tradable={market.tradable}
                referenceSummary={market.referenceSummary}
              />
            ) : (
              <a
                key={market.id}
                href={`/markets/${market.id}`}
                className="group flex h-full flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
              >
                <div>
                  <h3 className="line-clamp-2 text-base font-semibold text-neutral-900">{market.title}</h3>
                  <div className="mt-2 text-xs text-neutral-500">
                    {market.referenceOnly && market.tradable === false ? "Coming soon" : market.status}
                  </div>
                </div>
                <div className="mt-6 text-xs text-neutral-500">
                  Outcomes: {market.outcomes.map((outcome) => outcome.name).join(" / ")}
                </div>
              </a>
            )
          ))}
        </div>
      )}
    </main>
  );
}

export default function MarketsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-7xl px-6 py-10">
          <div className="text-sm text-neutral-600">Loading markets...</div>
        </main>
      }
    >
      <MarketsPageInner />
    </Suspense>
  );
}

