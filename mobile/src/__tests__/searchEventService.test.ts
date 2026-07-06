import { describe, expect, test, vi } from "vitest";
import { filterSearchFallbackEvents, loadSearchEventPage } from "../services/searchEventService";
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
  marketCount: input.marketCount ?? input.markets?.length ?? 0,
  activeMarketCount: input.activeMarketCount ?? input.markets?.length ?? 0,
  topOutcomes: input.topOutcomes,
  markets: input.markets,
});

describe("searchEventService", () => {
  test("loads Search pages through the backend event route when available", async () => {
    const listWorldCupEvents = vi.fn(async () => ({
      events: [event({ id: "event-1", slug: "mex-eng", title: "Mexico vs England" })],
      nextCursor: "event-1",
      page: { limit: 2, nextCursor: "event-1", hasMore: true },
    }));

    await expect(
      loadSearchEventPage({
        api: { listWorldCupEvents },
        query: " mexico ",
        limit: 2,
        cursor: null,
      }),
    ).resolves.toMatchObject({
      source: "server-route",
      query: "mexico",
      nextCursor: "event-1",
      page: { limit: 2, hasMore: true },
      events: [{ slug: "mex-eng" }],
    });

    expect(listWorldCupEvents).toHaveBeenCalledWith({
      search: "mexico",
      limit: 2,
      cursor: null,
    });
  });

  test("filters local fallback by event, team, market, and outcome text only when the route is unavailable", async () => {
    const fallbackEvents = [
      event({
        id: "event-1",
        slug: "fallback-market",
        title: "Fallback One",
        markets: [{
          id: "market-1",
          title: "Over 3.5 total goals",
          description: null,
          status: "LIVE",
          outcomes: [{
            id: "outcome-1",
            name: "Yes",
            label: "Yes",
            price: 0.52,
            bestBid: 0.51,
            bestAsk: 0.53,
            isTradable: true,
          }],
          event: null,
          rulesText: null,
          marketGroupTitle: "Game Lines",
          marketType: "totals",
          period: "regulation",
          line: "3.5",
          propCategory: null,
        }],
      }),
      event({
        id: "event-2",
        slug: "fallback-team",
        title: "Fallback Two",
        homeTeamName: "Argentina",
        awayTeamName: "Canada",
      }),
    ];

    const api = {
      listWorldCupEvents: vi.fn(async () => {
        throw new Error("offline");
      }),
    };

    await expect(
      loadSearchEventPage({
        api,
        query: "total goals",
        limit: 1,
        fallbackEvents,
      }),
    ).resolves.toMatchObject({
      source: "local-fallback",
      events: [{ slug: "fallback-market" }],
      page: { hasMore: false },
    });

    expect(filterSearchFallbackEvents(fallbackEvents, "Argentina")).toMatchObject([
      { slug: "fallback-team" },
    ]);
  });

  test("paginates local fallback with the same cursor shape as the backend route", async () => {
    const fallbackEvents = [
      event({ id: "event-1", slug: "one", title: "World Cup" }),
      event({ id: "event-2", slug: "two", title: "World Cup" }),
      event({ id: "event-3", slug: "three", title: "World Cup" }),
    ];

    const firstPage = await loadSearchEventPage({ query: "world", limit: 2, fallbackEvents });
    expect(firstPage).toMatchObject({
      source: "local-fallback",
      nextCursor: "event-2",
      page: { hasMore: true },
      events: [{ slug: "one" }, { slug: "two" }],
    });

    await expect(
      loadSearchEventPage({
        query: "world",
        limit: 2,
        cursor: firstPage.nextCursor,
        fallbackEvents,
      }),
    ).resolves.toMatchObject({
      nextCursor: null,
      page: { hasMore: false },
      events: [{ slug: "three" }],
    });
  });
});
