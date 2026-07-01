import type {
  EventDetail as BackendEventDetail,
  EventSummary as BackendEventSummary,
  Market as BackendMarket,
  Outcome as BackendOutcome,
} from "../types";
import type { Event, Market, Outcome } from "../mocks/worldCup";

const COLORS = ["#2563eb", "#60a5fa", "#ef4444", "#0a8f61", "#f4c20d", "#7c3aed", "#94a3b8"];

const fallbackProbability = (index: number, total: number) => {
  if (total <= 0) return 50;
  return Math.max(1, Math.round(100 / total - index));
};

const asProbability = (value: string | number | null | undefined, index: number, total: number) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallbackProbability(index, total);
  if (parsed > 1) return Math.max(1, Math.min(99, Math.round(parsed)));
  return Math.max(1, Math.min(99, Math.round(parsed * 100)));
};

const asTitleCase = (value: string | null | undefined, fallback: string) => {
  const clean = (value || fallback).replace(/[_-]+/g, " ").trim();
  if (!clean) return fallback;
  return clean.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
};

const eventStatus = (event: BackendEventSummary): Event["status"] => {
  const status = `${event.liveStatus ?? event.status ?? ""}`.toLowerCase();
  if (status.includes("live") || status === "in_progress") return "live";
  if (!event.startTime) return "future";
  const start = new Date(event.startTime);
  if (Number.isNaN(start.getTime())) return "future";
  const now = new Date();
  const startDay = start.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (startDay === now.toDateString()) return "today";
  if (startDay === tomorrow.toDateString()) return "tomorrow";
  return "future";
};

const startsAt = (event: BackendEventSummary) => {
  if (event.liveStatus || event.clock) {
    return ["Live", event.period, event.clock].filter(Boolean).join(" · ");
  }
  if (!event.startTime) return "Time TBD";
  const start = new Date(event.startTime);
  if (Number.isNaN(start.getTime())) return "Time TBD";
  const prefix = eventStatus(event) === "tomorrow" ? "Tomorrow" : eventStatus(event) === "today" ? "Today" : "";
  const time = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return [prefix, time].filter(Boolean).join(" ");
};

const zhPassthrough = (value: string) => value;

const normalizeOutcome = (outcome: BackendOutcome, index: number, total: number): Outcome => ({
  id: outcome.id,
  label: outcome.label || outcome.name || `Outcome ${index + 1}`,
  zhLabel: zhPassthrough(outcome.label || outcome.name || `选项 ${index + 1}`),
  probability: asProbability(outcome.price ?? outcome.bestAsk ?? outcome.bestBid, index, total),
  color: COLORS[index % COLORS.length],
});

const marketType = (market: BackendMarket): Market["type"] => {
  const key = `${market.marketGroupTitle ?? ""} ${market.propCategory ?? ""} ${market.title}`.toLowerCase();
  if (key.includes("winner") || key.includes("moneyline") || key.includes("match")) return "game-line";
  if (key.includes("live")) return "live";
  if (key.includes("future") || key.includes("cup")) return "future";
  return "prop";
};

export const normalizeMarket = (market: BackendMarket): Market => ({
  id: market.id,
  title: market.marketGroupTitle || market.title,
  zhTitle: zhPassthrough(market.marketGroupTitle || market.title),
  type: marketType(market),
  outcomes: market.outcomes.map((outcome, index) => normalizeOutcome(outcome, index, market.outcomes.length)),
});

export const normalizeEventSummary = (event: BackendEventSummary, markets: BackendMarket[] = []): Event => {
  const home = event.homeTeamName || event.title.split(/\s+vs\.?\s+/i)[0] || "Home";
  const away = event.awayTeamName || event.title.split(/\s+vs\.?\s+/i)[1] || "Away";
  const status = eventStatus(event);
  return {
    id: event.slug || event.id,
    title: event.title,
    zhTitle: zhPassthrough(event.title),
    league: asTitleCase(event.leagueKey, "World Cup"),
    startsAt: startsAt(event),
    status,
    tag: status === "live" ? "Live" : asTitleCase(event.status, "World Cup"),
    zhTag: status === "live" ? "滚球" : asTitleCase(event.status, "世界杯"),
    teams: [
      { name: home, zhName: zhPassthrough(home), flag: "•" },
      { name: away, zhName: zhPassthrough(away), flag: "•" },
    ],
    markets: markets.map(normalizeMarket).filter((market) => market.outcomes.length > 0),
  };
};

export const normalizeEventDetail = (detail: BackendEventDetail): Event | null => {
  const event = normalizeEventSummary(detail.event, detail.markets);
  if (event.markets.length === 0) return null;
  return event;
};
