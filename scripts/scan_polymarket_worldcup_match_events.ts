import fs from "node:fs/promises";
import path from "node:path";

const GAMMA_BASE_URL = "https://gamma-api.polymarket.com";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/batch-provider-match-breadth/worldcup-match-event-scan.json";
const DEFAULT_LIMIT = 50;
const DEFAULT_PAGES = 12;
const DEFAULT_MATCH_EVENT_EVIDENCE_LIMIT = 60;
const MAX_SPREAD = 0.1;

type GammaWire = Record<string, unknown>;

type Args = {
  output: string;
  limit: number;
  pages: number;
  matchEventEvidenceLimit: number;
  tagSlugs: string[];
  eventSlugs: string[];
};

type MarketSummary = {
  slug: string;
  question: string;
  acceptingOrders: boolean;
  active: boolean;
  closed: boolean;
  archived: boolean;
  outcomeCount: number;
  tokenCount: number;
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
  usableBook: boolean;
  rejectionReasons: string[];
};

type EventSummary = {
  slug: string;
  title: string;
  category: string | null;
  tags: string[];
  active: boolean;
  closed: boolean;
  archived: boolean;
  startDate: string | null;
  endDate: string | null;
  ended: boolean;
  upcomingOrLive: boolean;
  matchLike: boolean;
  worldCupRelevant: boolean;
  playerPropLike: boolean;
  futuresLike: boolean;
  marketCount: number;
  usableMarketCount: number;
  acceptingOrderMarketCount: number;
  usableMarkets: MarketSummary[];
  sampleRejectedMarkets: MarketSummary[];
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const events = await scanEvents(args);
  const matchEvents = events.filter((event) => event.matchLike && event.worldCupRelevant && !event.playerPropLike && !event.futuresLike);
  const usableMatchEvents = matchEvents.filter((event) => event.usableMarketCount > 0);
  const openWorldCupEvents = events.filter((event) => event.worldCupRelevant && event.upcomingOrLive && !event.closed && !event.archived);
  const usableOpenWorldCupEvents = openWorldCupEvents.filter((event) => event.usableMarketCount > 0);
  const usableOpenNonMatchWorldCupEvents = usableOpenWorldCupEvents.filter((event) => !matchEvents.includes(event));
  const futuresEvents = events.filter((event) => event.futuresLike);

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "gamma-api.polymarket.com/events",
    readOnly: true,
    scope: "world-cup-match-only-provider-breadth",
    inputs: {
      tagSlugs: args.tagSlugs,
      eventSlugs: args.eventSlugs,
      limit: args.limit,
      pages: args.pages,
      matchEventEvidenceLimit: args.matchEventEvidenceLimit,
    },
    summary: {
      eventsInspected: events.length,
      matchEventCount: matchEvents.length,
      usableMatchEventCount: usableMatchEvents.length,
      openMatchEventCount: matchEvents.filter((event) => event.upcomingOrLive && !event.closed && !event.archived).length,
      closedOrEndedMatchEventCount: matchEvents.filter((event) => event.closed || event.ended).length,
      openWorldCupEventCount: openWorldCupEvents.length,
      usableOpenWorldCupEventCount: usableOpenWorldCupEvents.length,
      usableOpenNonMatchWorldCupEventCount: usableOpenNonMatchWorldCupEvents.length,
      futuresEventCount: futuresEvents.length,
      nonWorldCupOrPropUsableCount: events.filter((event) => event.usableMarketCount > 0 && !matchEvents.includes(event)).length,
      pass: usableMatchEvents.length > 0,
    },
    usableMatchEvents,
    matchEventEvidence: matchEvents.slice(0, args.matchEventEvidenceLimit),
    diagnostics: {
      matchEventEvidenceOmittedCount: Math.max(0, matchEvents.length - args.matchEventEvidenceLimit),
      usableOpenNonMatchWorldCupEvents: usableOpenNonMatchWorldCupEvents.slice(0, 10).map(toCompactEvent),
      futuresEvents: futuresEvents.slice(0, 10).map(toCompactEvent),
      usableNonMatchEvents: events
        .filter((event) => event.usableMarketCount > 0 && !matchEvents.includes(event))
        .slice(0, 10)
        .map(toCompactEvent),
    },
    nextAction:
      usableMatchEvents.length > 0
        ? "Import the highest-volume usable match event, refresh snapshots, and rerun internal exchange readiness."
        : "Do not import futures to fake match breadth. Continue Local MVP fixture-line testing and expand provider discovery queries.",
  };

  await fs.mkdir(path.dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

async function scanEvents(args: Args) {
  const bySlug = new Map<string, EventSummary>();

  for (const tagSlug of args.tagSlugs) {
    const events = await fetchEventsByTag(tagSlug, args.limit, args.pages);
    for (const event of events) {
      const summary = normalizeEvent(event);
      if (summary) bySlug.set(summary.slug, summary);
    }
  }

  for (const eventSlug of args.eventSlugs) {
    const events = await fetchEventsBySlug(eventSlug);
    for (const event of events) {
      const summary = normalizeEvent(event);
      if (summary) bySlug.set(summary.slug, summary);
    }
  }

  return Array.from(bySlug.values()).sort(compareEvents);
}

async function fetchEventsByTag(tagSlug: string, limit: number, pages: number) {
  const normalizedLimit = Math.min(Math.max(limit, 1), 50);
  const results: GammaWire[] = [];
  for (let page = 0; page < Math.max(1, pages); page += 1) {
    const url = new URL("/events", GAMMA_BASE_URL);
    url.searchParams.set("active", "true");
    url.searchParams.set("archived", "false");
    url.searchParams.set("limit", String(normalizedLimit));
    url.searchParams.set("offset", String(page * normalizedLimit));
    url.searchParams.set("tag_slug", tagSlug);
    const events = await fetchEventArray(url, `Gamma events tag fetch failed for ${tagSlug} page ${page}`);
    results.push(...events);
    if (events.length < normalizedLimit) break;
  }
  return results;
}

async function fetchEventsBySlug(eventSlug: string) {
  const url = new URL("/events", GAMMA_BASE_URL);
  url.searchParams.set("slug", eventSlug);
  return fetchEventArray(url, `Gamma events slug fetch failed for ${eventSlug}`);
}

async function fetchEventArray(url: URL, errorPrefix: string) {
  const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`${errorPrefix}: ${response.status} ${response.statusText}`);
  const payload = await response.json() as unknown;
  if (!Array.isArray(payload)) throw new Error(`${errorPrefix}: response was not an array`);
  return payload.filter((entry): entry is GammaWire => Boolean(entry) && typeof entry === "object");
}

function normalizeEvent(input: GammaWire): EventSummary | null {
  const slug = asString(input.slug);
  const title = asString(input.title) ?? asString(input.name);
  if (!slug || !title) return null;

  const tags = parseTags(input.tags);
  const startDate = asString(input.startDate);
  const endDate = asString(input.endDate);
  const ended = isPastDate(endDate);
  const markets = Array.isArray(input.markets)
    ? input.markets.filter((entry): entry is GammaWire => Boolean(entry) && typeof entry === "object").map(normalizeMarket).filter((market): market is MarketSummary => Boolean(market))
    : [];
  const haystack = [slug, title, asString(input.category), ...tags, ...markets.map((market) => market.question)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const worldCupRelevant = /\b(world cup|fifa|fifwc|2026-fifa-world-cup)\b/.test(haystack);
  const playerPropLike = /\b(h2h|player|goal contributions|goals h2h|assists h2h)\b/.test(haystack);
  const matchLike =
    /^fifwc-[a-z]{3}-[a-z]{3}-20\d{2}-\d{2}-\d{2}\b/.test(slug) ||
    (worldCupRelevant && /\b(vs\.?|v)\b/.test(title.toLowerCase()) && !playerPropLike);
  const futuresLike = /winner|win the 20\d{2} fifa world cup|world cup winner|tournament winner/.test(haystack);
  const usableMarkets = markets.filter((market) => market.usableBook);

  return {
    slug,
    title,
    category: asString(input.category),
    tags,
    active: asBoolean(input.active),
    closed: asBoolean(input.closed),
    archived: asBoolean(input.archived),
    startDate,
    endDate,
    ended,
    upcomingOrLive: !ended,
    matchLike,
    worldCupRelevant,
    playerPropLike,
    futuresLike,
    marketCount: markets.length,
    usableMarketCount: usableMarkets.length,
    acceptingOrderMarketCount: markets.filter((market) => market.acceptingOrders).length,
    usableMarkets,
    sampleRejectedMarkets: markets.filter((market) => !market.usableBook).slice(0, 5),
  };
}

function normalizeMarket(input: GammaWire): MarketSummary | null {
  const slug = asString(input.slug);
  const question = asString(input.question) ?? asString(input.title) ?? asString(input.name);
  if (!slug || !question) return null;

  const outcomes = parseStringArray(input.outcomes);
  const tokenIds = parseStringArray(input.clobTokenIds);
  const bestBid = asNumber(input.bestBid);
  const bestAsk = asNumber(input.bestAsk);
  const spread = asNumber(input.spread) ?? computeSpread(bestBid, bestAsk);
  const active = asBoolean(input.active);
  const closed = asBoolean(input.closed);
  const archived = asBoolean(input.archived);
  const acceptingOrders = asBoolean(input.acceptingOrders);
  const rejectionReasons = [
    active ? null : "inactive",
    closed ? "closed" : null,
    archived ? "archived" : null,
    acceptingOrders ? null : "not_accepting_orders",
    outcomes.length >= 2 ? null : "missing_outcomes",
    tokenIds.length >= outcomes.length ? null : "missing_clob_tokens",
    bestBid == null ? "missing_best_bid" : null,
    bestAsk == null ? "missing_best_ask" : null,
    bestBid != null && bestBid < 0.01 ? "best_bid_too_low" : null,
    bestAsk != null && bestAsk > 0.99 ? "best_ask_too_high" : null,
    spread == null ? "missing_spread" : spread > MAX_SPREAD ? "spread_too_wide" : null,
  ].filter((value): value is string => Boolean(value));

  return {
    slug,
    question,
    acceptingOrders,
    active,
    closed,
    archived,
    outcomeCount: outcomes.length,
    tokenCount: tokenIds.length,
    bestBid,
    bestAsk,
    spread,
    usableBook: rejectionReasons.length === 0,
    rejectionReasons,
  };
}

function compareEvents(a: EventSummary, b: EventSummary) {
  return (
    Number(b.matchLike && !b.futuresLike) - Number(a.matchLike && !a.futuresLike) ||
    Number(b.upcomingOrLive && !b.closed && !b.archived) - Number(a.upcomingOrLive && !a.closed && !a.archived) ||
    b.usableMarketCount - a.usableMarketCount ||
    b.acceptingOrderMarketCount - a.acceptingOrderMarketCount ||
    b.marketCount - a.marketCount ||
    a.title.localeCompare(b.title)
  );
}

function toCompactEvent(event: EventSummary) {
  return {
    slug: event.slug,
    title: event.title,
    startDate: event.startDate,
    endDate: event.endDate,
    ended: event.ended,
    upcomingOrLive: event.upcomingOrLive,
    tags: event.tags,
    matchLike: event.matchLike,
    worldCupRelevant: event.worldCupRelevant,
    playerPropLike: event.playerPropLike,
    futuresLike: event.futuresLike,
    marketCount: event.marketCount,
    usableMarketCount: event.usableMarketCount,
    acceptingOrderMarketCount: event.acceptingOrderMarketCount,
    sampleUsableMarket: event.usableMarkets[0] ?? null,
  };
}

function parseArgs(argv: string[]): Args {
  const raw = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key?.startsWith("--")) continue;
    const next = argv[index + 1];
    raw.set(key.slice(2), next && !next.startsWith("--") ? next : "true");
  }
  return {
    output: raw.get("output") ?? DEFAULT_OUTPUT_PATH,
    limit: parsePositiveInt(raw.get("limit"), DEFAULT_LIMIT),
    pages: parsePositiveInt(raw.get("pages"), DEFAULT_PAGES),
    matchEventEvidenceLimit: parsePositiveInt(raw.get("matchEventEvidenceLimit"), DEFAULT_MATCH_EVENT_EVIDENCE_LIMIT),
    tagSlugs: parseList(raw.get("tagSlugs"), ["soccer", "football", "world-cup", "fifa-world-cup", "sports"]),
    eventSlugs: parseList(raw.get("eventSlugs"), [
      "fifwc-arg-egy-2026-07-07",
      "fifwc-col-gha-2026-07-03",
      "fifwc-che-col-2026-07-07",
      "fifwc-bra-nor-2026-07-05",
      "fifwc-par-fra-2026-07-05",
      "fifwc-can-mar-2026-07-05",
    ]),
  };
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseList(value: string | undefined, fallback: string[]) {
  if (!value) return fallback;
  const parsed = value.split(",").map((item) => item.trim()).filter(Boolean);
  return parsed.length > 0 ? parsed : fallback;
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  if (typeof value === "string") {
    try {
      return parseStringArray(JSON.parse(value) as unknown);
    } catch {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

function parseTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry === "string") return entry;
      if (entry && typeof entry === "object") {
        const wire = entry as GammaWire;
        return asString(wire.slug) ?? asString(wire.label) ?? asString(wire.name);
      }
      return null;
    })
    .filter((entry): entry is string => Boolean(entry));
}

function computeSpread(bestBid: number | null, bestAsk: number | null) {
  if (bestBid == null || bestAsk == null) return null;
  return Number((bestAsk - bestBid).toFixed(6));
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
}

function isPastDate(value: string | null) {
  if (!value) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed < Date.now();
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
