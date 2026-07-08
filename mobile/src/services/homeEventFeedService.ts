import type { PolyApi } from "../api";
import type { EventSummary } from "../types";

export type HomeEventFeedFilter = "all" | "live" | "upcoming" | "scheduled" | "today";

export type HomeEventFeedPage = {
  source: "server-route" | "local-fallback";
  filter: HomeEventFeedFilter;
  status: string | null;
  events: EventSummary[];
  nextCursor: string | null;
  page: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
};

export type LoadHomeEventFeedPageInput = {
  api?: Pick<PolyApi, "listWorldCupEvents"> | null;
  filter?: HomeEventFeedFilter;
  limit: number;
  cursor?: string | null;
  source?: string | null;
  fallbackEvents?: EventSummary[];
};

const statusForFilter = (filter: HomeEventFeedFilter) => filter === "all" ? null : filter;

const matchesFilter = (event: EventSummary, filter: HomeEventFeedFilter) => {
  if (filter === "all") return true;
  if (filter === "live") {
    return String(event.status ?? "").toLowerCase() === "live" || String(event.liveStatus ?? "").toLowerCase() === "live";
  }
  return String(event.status ?? "").toLowerCase() === filter;
};

const isWorldCupMatchEvent = (event: EventSummary) =>
  event.sportKey === "soccer" &&
  event.leagueKey === "world_cup" &&
  event.eventType !== "future" &&
  (
    event.eventType === "match" ||
    event.status === "live" ||
    Boolean(event.homeTeamName && event.awayTeamName) ||
    Boolean(event.liveStatus || event.clock || event.period) ||
    /\bvs\.?\b|\bv\b/i.test(event.title)
  );

export const loadHomeEventFeedPage = async ({
  api,
  filter = "all",
  limit,
  cursor = null,
  source = "polymarket",
  fallbackEvents = [],
}: LoadHomeEventFeedPageInput): Promise<HomeEventFeedPage> => {
  const safeLimit = Math.max(1, Math.floor(limit));
  const status = statusForFilter(filter);

  if (api) {
    try {
      const payload = await api.listWorldCupEvents({
        limit: safeLimit,
        cursor,
        status,
        source,
        leagueKey: "world_cup",
        mobileMvpMatches: true,
      });
      const nextCursor = payload.nextCursor ?? payload.page?.nextCursor ?? null;
      const events = payload.events.filter(isWorldCupMatchEvent);
      if (filter === "live" && events.length === 0 && !cursor) {
        const unfilteredPayload = await api.listWorldCupEvents({
          limit: safeLimit,
          cursor: null,
          status: null,
          source,
          leagueKey: "world_cup",
          mobileMvpMatches: true,
        });
        const unfilteredNextCursor = unfilteredPayload.nextCursor ?? unfilteredPayload.page?.nextCursor ?? null;
        const liveEvents = unfilteredPayload.events.filter(isWorldCupMatchEvent).filter((event) => matchesFilter(event, "live"));
        if (liveEvents.length > 0) {
          return {
            source: "server-route",
            filter,
            status,
            events: liveEvents,
            nextCursor: unfilteredNextCursor,
            page: {
              limit: unfilteredPayload.page?.limit ?? safeLimit,
              nextCursor: unfilteredNextCursor,
              hasMore: unfilteredPayload.page?.hasMore ?? Boolean(unfilteredNextCursor),
            },
          };
        }
      }
      return {
        source: "server-route",
        filter,
        status,
        events,
        nextCursor,
        page: {
          limit: payload.page?.limit ?? safeLimit,
          nextCursor,
          hasMore: payload.page?.hasMore ?? Boolean(nextCursor),
        },
      };
    } catch {
      // Local fallback is only used when the backend route cannot be reached.
    }
  }

  const filtered = fallbackEvents.filter((event) => matchesFilter(event, filter));
  const start = cursor ? Math.max(0, filtered.findIndex((event) => event.id === cursor) + 1) : 0;
  const events = filtered.slice(start, start + safeLimit);
  const nextCursor = filtered[start + safeLimit] ? events.at(-1)?.id ?? null : null;

  return {
    source: "local-fallback",
    filter,
    status,
    events,
    nextCursor,
    page: {
      limit: safeLimit,
      nextCursor,
      hasMore: Boolean(nextCursor),
    },
  };
};
