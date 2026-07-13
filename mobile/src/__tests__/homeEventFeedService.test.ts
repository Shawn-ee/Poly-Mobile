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
  eventType: input.eventType ?? null,
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
      source: null,
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
      source: null,
      leagueKey: "world_cup",
      mobileMvpMatches: true,
    });
  });

  test("keeps Live empty when the live status route returns no events", async () => {
    const listWorldCupEvents = vi
      .fn()
      .mockResolvedValueOnce({
        events: [],
        page: { limit: 10, nextCursor: null, hasMore: false },
      });

    await expect(
      loadHomeEventFeedPage({
        api: { listWorldCupEvents },
        filter: "live",
        limit: 10,
      }),
    ).resolves.toMatchObject({
      source: "server-route",
      events: [],
      page: { hasMore: false },
    });

    expect(listWorldCupEvents).toHaveBeenCalledTimes(1);
    expect(listWorldCupEvents).toHaveBeenCalledWith({
      limit: 10,
      cursor: null,
      status: "live",
      source: null,
      leagueKey: "world_cup",
      mobileMvpMatches: true,
    });
  });

  test("keeps provider-backed World Cup futures out of the Home Live match feed", async () => {
    const listWorldCupEvents = vi.fn(async () => ({
      events: [
        event({
          id: "future-1",
          slug: "which-continent-will-win-the-world-cup",
          title: "Which continent will win the World Cup?",
          eventType: "future",
          status: "active",
          liveStatus: "LIVE",
          homeTeamName: "World Cup",
          awayTeamName: "Winner",
        }),
        event({
          id: "match-1",
          slug: "argentina-vs-egypt",
          title: "Argentina vs. Egypt",
          eventType: "match",
          status: "active",
          liveStatus: "LIVE",
          homeTeamName: "Argentina",
          awayTeamName: "Egypt",
        }),
      ],
      page: { limit: 10, nextCursor: null, hasMore: false },
    }));

    await expect(
      loadHomeEventFeedPage({
        api: { listWorldCupEvents },
        filter: "live",
        limit: 10,
      }),
    ).resolves.toMatchObject({
      source: "server-route",
      events: [{ slug: "argentina-vs-egypt" }],
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

  test("keeps provider-owned FIFA World Cup soccer matches in the Home feed", async () => {
    const listWorldCupEvents = vi.fn(async () => ({
      events: [
        event({
          id: "match-1",
          slug: "odds-api-single-soccer-test",
          title: "Spain vs. France",
          sportKey: "soccer_fifa_world_cup",
          leagueKey: "soccer_fifa_world_cup",
          eventType: "match",
          homeTeamName: "France",
          awayTeamName: "Spain",
        }),
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
      events: [{ slug: "odds-api-single-soccer-test" }],
    });
  });

  test("keeps Local MVP contract-fixture match rows in the Home feed", async () => {
    const listWorldCupEvents = vi.fn(async () => ({
      events: [
        event({
          id: "match-1",
          slug: "argentina-vs-egypt",
          title: "Argentina vs. Egypt",
          eventType: "match",
        }),
        event({
          id: "match-2",
          slug: "holiwyn-local-mexico-vs-ecuador",
          title: "Mexico vs. Ecuador",
          eventType: "match",
          homeTeamName: "Mexico",
          awayTeamName: "Ecuador",
        }),
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
      events: [
        { slug: "argentina-vs-egypt" },
        { slug: "holiwyn-local-mexico-vs-ecuador" },
      ],
    });

    expect(listWorldCupEvents).toHaveBeenCalledWith({
      limit: 10,
      cursor: null,
      status: null,
      source: null,
      leagueKey: "world_cup",
      mobileMvpMatches: true,
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
