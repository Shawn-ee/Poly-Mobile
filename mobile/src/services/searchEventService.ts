import type { PolyApi } from "../api";
import type { EventSummary, Market, Outcome } from "../types";

export type SearchEventPage = {
  source: "server-route" | "local-fallback";
  query: string;
  events: EventSummary[];
  nextCursor: string | null;
  page: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
};

export type LoadSearchEventPageInput = {
  api?: Pick<PolyApi, "listWorldCupEvents"> | null;
  query: string;
  limit: number;
  cursor?: string | null;
  fallbackEvents?: EventSummary[];
};

const compactText = (value: unknown) => String(value ?? "").trim().toLowerCase();

const outcomeSearchText = (outcome: Outcome) => [
  outcome.name,
  outcome.label,
  outcome.side,
  outcome.referenceOutcomeLabel,
].map(compactText).join(" ");

const marketSearchText = (market: Market) => [
  market.title,
  market.description,
  market.marketGroupTitle,
  market.marketType,
  market.period,
  market.line,
  ...market.outcomes.map(outcomeSearchText),
].map(compactText).join(" ");

const eventSearchText = (event: EventSummary) => [
  event.title,
  event.description,
  event.category,
  event.sportKey,
  event.leagueKey,
  event.homeTeamName,
  event.awayTeamName,
  ...(event.topOutcomes ?? []),
  ...(event.markets ?? []).map(marketSearchText),
].map(compactText).join(" ");

export const filterSearchFallbackEvents = (events: EventSummary[], query: string) => {
  const normalized = compactText(query);
  if (!normalized) return events;
  return events.filter((event) => eventSearchText(event).includes(normalized));
};

export const loadSearchEventPage = async ({
  api,
  query,
  limit,
  cursor = null,
  fallbackEvents = [],
}: LoadSearchEventPageInput): Promise<SearchEventPage> => {
  const safeLimit = Math.max(1, Math.floor(limit));
  const trimmedQuery = query.trim();

  if (api) {
    try {
      const payload = await api.listWorldCupEvents({
        search: trimmedQuery,
        limit: safeLimit,
        cursor,
      });
      const nextCursor = payload.nextCursor ?? payload.page?.nextCursor ?? null;
      return {
        source: "server-route",
        query: trimmedQuery,
        events: payload.events,
        nextCursor,
        page: {
          limit: payload.page?.limit ?? safeLimit,
          nextCursor,
          hasMore: payload.page?.hasMore ?? Boolean(nextCursor),
        },
      };
    } catch {
      // Fall through to local filtering only when the backend route is unavailable.
    }
  }

  const filtered = filterSearchFallbackEvents(fallbackEvents, trimmedQuery);
  const start = cursor ? Math.max(0, filtered.findIndex((event) => event.id === cursor) + 1) : 0;
  const events = filtered.slice(start, start + safeLimit);
  const next = filtered[start + safeLimit] ? events.at(-1)?.id ?? null : null;

  return {
    source: "local-fallback",
    query: trimmedQuery,
    events,
    nextCursor: next,
    page: {
      limit: safeLimit,
      nextCursor: next,
      hasMore: Boolean(next),
    },
  };
};
