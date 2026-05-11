"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MarketCard from "@/components/MarketCard";
import EventCard from "@/components/EventCard";

type Market = {
  id: string;
  title: string;
  description: string;
  status: string;
  visibility: "PUBLIC" | "PRIVATE";
  mechanism: "ORDERBOOK" | "POOL";
  prices: { YES: number; NO: number } | null;
  category: { id: string; name: string; slug: string } | null;
  tags: { id: string; name: string; slug: string; group: string | null }[];
  outcomes: { id: string; name: string }[];
  resolveTime: string | null;
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
};

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [topTags, setTopTags] = useState<
    { id: string; name: string; slug: string }[]
  >([]);
  const [sportsTags, setSportsTags] = useState<
    { id: string; name: string; slug: string }[]
  >([]);
  const [activeTopTag, setActiveTopTag] = useState<string>("sports");
  const [activeSportsTag, setActiveSportsTag] = useState<string>("nba");

  useEffect(() => {
    const loadWallet = async () => {
      const res = await fetch("/api/wallet/balance");
      if (!res.ok) {
        setWalletBalance(null);
        return;
      }
      const data = await res.json();
      setWalletBalance(typeof data.balance === "number" ? data.balance : 0);
    };
    loadWallet();

    const loadUser = async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        setIsAdmin(false);
        return;
      }
      const data = await res.json();
      setIsAdmin(Boolean(data.user?.isAdmin));
    };
    loadUser();

    const loadTags = async () => {
      const [topRes, sportsRes] = await Promise.all([
        fetch("/api/tags?group=top-nav"),
        fetch("/api/tags?group=sports"),
      ]);
      if (topRes.ok) {
        const data = await topRes.json();
        const base = data.tags ?? [];
        const sportsFirst = base.find((tag: any) => tag.slug === "sports");
        const rest = base.filter((tag: any) => tag.slug !== "sports");
        setTopTags(sportsFirst ? [sportsFirst, ...rest] : rest);
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
      setEvents((data.events ?? []).filter((event: EventSummary) => Boolean(event.slug)).slice(0, 4));
    };
    loadEvents();
  }, []);

  useEffect(() => {
    const load = async () => {
      const params = new URLSearchParams();
      if (activeTopTag !== "all") {
        params.set("category", activeTopTag);
      }
      if (activeTopTag === "sports" && activeSportsTag) {
        params.set("tags", activeSportsTag);
      }
      const res = await fetch(`/api/markets?${params.toString()}`);
      const data = await res.json();
      setMarkets(data.markets ?? []);
    };
    load();
  }, [activeTopTag, activeSportsTag]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Live Markets</h1>
          <p className="text-sm text-neutral-600">
            Trade with U and cash out before resolution.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-neutral-600">
          <div>
            Wallet:{" "}
            {walletBalance === null ? "--" : walletBalance.toFixed(2)} U
          </div>
          {isAdmin ? (
            <Link
              href="/admin"
              className="rounded-md border border-neutral-300 px-3 py-1 text-sm text-neutral-700 hover:border-neutral-400"
            >
              Admin tools
            </Link>
          ) : null}
        </div>
      </div>

      {events.length ? (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Featured Events</h2>
              <p className="text-sm text-neutral-600">Grouped markets with shared event context.</p>
            </div>
            <Link href="/events" className="text-sm text-neutral-600 hover:text-neutral-900">
              View all events
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                />
              ) : null,
            )}
          </div>
        </section>
      ) : null}

      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setActiveTopTag("all");
            setActiveSportsTag("");
          }}
          className={`rounded-full border px-3 py-1 text-sm ${
            activeTopTag === "all"
              ? "border-black bg-black text-white"
              : "border-neutral-300 text-neutral-700"
          }`}
          type="button"
        >
          All
        </button>
        {topTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => {
              setActiveTopTag(tag.slug);
              if (tag.slug !== "sports") {
                setActiveSportsTag("");
              }
            }}
            className={`rounded-full border px-3 py-1 text-sm ${
              activeTopTag === tag.slug
                ? "border-black bg-black text-white"
                : "border-neutral-300 text-neutral-700"
            }`}
            type="button"
          >
            {tag.name}
          </button>
        ))}
      </div>

      {activeTopTag === "sports" && sportsTags.length > 0 ? (
        <div className="mb-8 flex flex-wrap gap-2">
          {sportsTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() =>
                setActiveSportsTag((current) =>
                  current === tag.slug ? "" : tag.slug
                )
              }
              className={`rounded-full border px-3 py-1 text-xs ${
                activeSportsTag === tag.slug
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

      {markets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-600">
          No markets yet. Create one in the admin panel.
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
              />
            ) : (
              <Link
                key={market.id}
                href={`/markets/${market.id}`}
                className="group flex h-full flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
              >
                <div>
                  <h3 className="line-clamp-2 text-base font-semibold text-neutral-900">{market.title}</h3>
                  <div className="mt-2 text-xs text-neutral-500">{market.status}</div>
                </div>
                <div className="mt-6 text-xs text-neutral-500">
                  Outcomes: {market.outcomes.map((outcome) => outcome.name).join(" / ")}
                </div>
              </Link>
            )
          ))}
        </div>
      )}
    </main>
  );
}

