import { describe, expect, test, vi } from "vitest";
import { loadHomeEventFeedPage } from "../services/homeEventFeedService";
import type { EventSummary } from "../types";

const event = (input: Partial<EventSummary> & Pick<EventSummary, "id" | "slug" | "title">): EventSummary => ({
  id: input.id,
  slug: input.slug,
  title: input.title,
  description: input.description ?? null,
  category: input.category ?? "Sports / Soccer",
  sportKey: input.sportKey ?? "soccer",
  leagueKey: input.leagueKey ?? "world_cup",
  homeTeamName: input.homeTeamName ?? null,
  awayTeamName: input.awayTeamName ?? null,
  startTime: input.startTime ?? "2026-07-04T12:00:00.000Z",
  status: input.status ?? "upcoming",
  liveStatus: input.liveStatus ?? null,
  period: input.period ?? null,
  clock: input.clock ?? null,
  homeScore: input.homeScore ?? null,
  awayScore: input.awayScore ?? null,
  marketCount: input.marketCount ?? 1,
  activeMarketCount: input.activeMarketCount ?? 1,
  markets: input.markets,
});

describe("homeEventFeedService", () => {
  test("loads filtered Home pages through the backend event route when available", async () => {
    const listWorldCupEvents = vi.fn(async () => ({
      events: [event({ id: "event-1", slug: "live-match", title: "Live Match", status: "live" })],
      nextCursor: "event-1",
      page: { limit: 2, nextCursor: "event-1", hasMore: true },
    }));

    await expect(
      loadHomeEventFeedPage({
        api: { listWorldCupEvents },
        filter: "live",
        limit: 2,
        cursor: null,
      }),
    ).resolves.toMatchObject({
      source: "server-route",
      filter: "live",
      status: "live",
      nextCursor: "event-1",
      page: { limit: 2, hasMore: true },
      events: [{ slug: "live-match" }],
    });

    expect(listWorldCupEvents).toHaveBeenCalledWith({
      limit: 2,
      cursor: null,
      status: "live",
      source: "polymarket",
      leagueKey: "world_cup",
      mobileMvpMatches: true,
    });
  });

  test("does not send a status filter for the all-events Home feed", async () => {
    const listWorldCupEvents = vi.fn(async () => ({
      events: [event({ id: "event-1", slug: "all-match", title: "All Match" })],
      page: { limit: 10, nextCursor: null, hasMore: false },
    }));

    await loadHomeEventFeedPage({ api: { listWorldCupEvents }, filter: "all", limit: 10 });

    expect(listWorldCupEvents).toHaveBeenCalledWith({
      limit: 10,
      cursor: null,
      status: null,
      source: "polymarket",
      leagueKey: "world_cup",
      mobileMvpMatches: true,
    });
  });

  test("keeps server-mode Home focused on World Cup soccer matches only", async () => {
    const listWorldCupEvents = vi.fn(async () => ({
      events: [
        event({ id: "match-1", slug: "switzerland-vs-colombia", title: "Switzerland vs. Colombia", eventType: "match" }),
        event({ id: "future-1", slug: "world-cup-winner", title: "World Cup Winner", eventType: "future" }),
        event({ id: "future-2", slug: "ballon-dor-winner-2026", title: "Ballon d'Or Winner 2026", eventType: "future", leagueKey: "ballon_dor" }),
      ],
      page: { limit: 10, nextCursor: null, hasMore: false },
    }));

    await expect(
      loadHomeEventFeedPage({
        api: { listWorldCupEvents },
        filter: "all",
        limit: 10,
      }),
    ).resolves.toMatchObject({
      source: "server-route",
      events: [{ slug: "switzerland-vs-colombia" }],
    });
  });

  test("uses local fallback filtering and cursor pagination only when the route is unavailable", async () => {
    const fallbackEvents = [
      event({ id: "event-1", slug: "live-one", title: "Live One", status: "live" }),
      event({ id: "event-2", slug: "upcoming-one", title: "Upcoming One", status: "upcoming" }),
      event({ id: "event-3", slug: "live-two", title: "Live Two", status: "live" }),
    ];
    const api = {
      listWorldCupEvents: vi.fn(async () => {
        throw new Error("offline");
      }),
    };

    const firstPage = await loadHomeEventFeedPage({
      api,
      filter: "live",
      limit: 1,
      fallbackEvents,
    });

    expect(firstPage).toMatchObject({
      source: "local-fallback",
      events: [{ slug: "live-one" }],
      nextCursor: "event-1",
      page: { hasMore: true },
    });

    await expect(
      loadHomeEventFeedPage({
        filter: "live",
        limit: 1,
        cursor: firstPage.nextCursor,
        fallbackEvents,
      }),
    ).resolves.toMatchObject({
      source: "local-fallback",
      events: [{ slug: "live-two" }],
      nextCursor: null,
      page: { hasMore: false },
    });
  });
});
