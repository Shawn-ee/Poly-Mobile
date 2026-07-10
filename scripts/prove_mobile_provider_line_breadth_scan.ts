import fs from "node:fs/promises";
import path from "node:path";
import { classifyProviderMarketFamily, type ProviderMarketFamily } from "@/server/services/mobileLiveProviderCandidates";

const GAMMA_BASE_URL = "https://gamma-api.polymarket.com";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-QE-provider-line-breadth-scan/cycle-QE-provider-line-breadth-scan.json";
const DEFAULT_LIMIT = 100;
const SEARCH_QUERIES = [
  "world cup spread",
  "world cup handicap",
  "world cup total goals",
  "world cup over under",
  "world cup team total",
  "world cup corners",
  "world cup correct score",
  "world cup first half",
  "world cup 1h",
  "world cup goals over 2.5",
  "world cup both teams score",
  "fifa world cup spread",
  "fifa world cup total goals",
  "fifa world cup first half",
  "fifa world cup goals over",
  "fifwc spread",
  "fifwc total goals",
];
const EVENT_TAG_SLUGS = ["fifa-world-cup", "2026-fifa-world-cup", "soccer"];
const LINE_FAMILIES = new Set<ProviderMarketFamily>([
  "spread",
  "total_goals",
  "team_total_goals",
  "corners",
  "first_half",
  "second_half",
  "correct_score",
]);

type GammaWire = Record<string, unknown>;

type ScanCandidate = {
  source: "market-search" | "event-tag";
  queryOrTag: string;
  slug: string;
  question: string;
  eventTitle: string | null;
  family: ProviderMarketFamily;
  active: boolean;
  closed: boolean;
  archived: boolean;
  acceptingOrders: boolean;
  conditionId: string | null;
  externalMarketId: string | null;
  outcomeCount: number;
  tokenCount: number;
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
  volume24hr: number | null;
  liquidity: number | null;
  worldCupRelevant: boolean;
  attachIdentityComplete: boolean;
};

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.filter((arg) => arg.startsWith(prefix)).at(-1)?.slice(prefix.length);
};

async function main() {
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const cycle = argValue("cycle") ?? "QE";
  const limit = parsePositiveInt(argValue("limit"), DEFAULT_LIMIT);
  const bySlug = new Map<string, ScanCandidate>();
  const errors: Array<{ source: string; queryOrTag: string; error: string }> = [];

  for (const query of SEARCH_QUERIES) {
    try {
      const markets = await fetchGammaMarketsBySearch(query, limit);
      for (const market of markets) {
        const candidate = normalizeCandidate(market, "market-search", query);
        if (candidate && !bySlug.has(candidate.slug)) {
          bySlug.set(candidate.slug, candidate);
        }
      }
    } catch (error) {
      errors.push({ source: "market-search", queryOrTag: query, error: error instanceof Error ? error.message : String(error) });
    }
  }

  for (const tagSlug of EVENT_TAG_SLUGS) {
    try {
      const events = await fetchGammaEventsByTag(tagSlug, Math.min(limit, 50));
      for (const event of events) {
        const eventTitle = asString(event.title) ?? asString(event.name);
        const tags = parseTags(event.tags);
        const category = asString(event.category);
        const markets = Array.isArray(event.markets) ? event.markets : [];
        for (const market of markets) {
          if (!market || typeof market !== "object") continue;
          const candidate = normalizeCandidate(market as GammaWire, "event-tag", tagSlug, { eventTitle, tags, category });
          if (candidate && !bySlug.has(candidate.slug)) {
            bySlug.set(candidate.slug, candidate);
          }
        }
      }
    } catch (error) {
      errors.push({ source: "event-tag", queryOrTag: tagSlug, error: error instanceof Error ? error.message : String(error) });
    }
  }

  const allCandidates = Array.from(bySlug.values());
  const worldCupCandidates = allCandidates.filter((candidate) => candidate.worldCupRelevant);
  const lineCandidates = worldCupCandidates.filter((candidate) => LINE_FAMILIES.has(candidate.family));
  const attachReadyLineCandidates = lineCandidates.filter((candidate) => candidate.attachIdentityComplete);
  const familySummary = summarizeFamilies(worldCupCandidates);
  const lineFamilySummary = summarizeFamilies(lineCandidates);
  const lineLikeRejectedCandidates = worldCupCandidates
    .filter((candidate) => !LINE_FAMILIES.has(candidate.family) && isLineLikeRejectedCandidate(candidate))
    .sort((left, right) => (Number(right.attachIdentityComplete) - Number(left.attachIdentityComplete)) || ((right.volume24hr ?? 0) - (left.volume24hr ?? 0)))
    .slice(0, 25)
    .map((candidate) => ({
      slug: candidate.slug,
      question: candidate.question,
      eventTitle: candidate.eventTitle,
      family: candidate.family,
      lineLikeReason: classifyLineLikeRejectedCandidate(candidate),
      source: candidate.source,
      queryOrTag: candidate.queryOrTag,
      acceptingOrders: candidate.acceptingOrders,
      attachIdentityComplete: candidate.attachIdentityComplete,
      conditionIdPresent: Boolean(candidate.conditionId),
      tokenCount: candidate.tokenCount,
      outcomeCount: candidate.outcomeCount,
      volume24hr: candidate.volume24hr,
      liquidity: candidate.liquidity,
    }));
  const topLineCandidates = lineCandidates
    .sort((left, right) => (Number(right.acceptingOrders) - Number(left.acceptingOrders)) || ((right.volume24hr ?? 0) - (left.volume24hr ?? 0)))
    .slice(0, 20);

  const summary = {
    cycle,
    result: "pass",
    generatedAt: new Date().toISOString(),
    provider: "polymarket-gamma",
    scope: "world-cup-provider-line-breadth-scan",
    sources: {
      searchQueries: SEARCH_QUERIES,
      eventTagSlugs: EVENT_TAG_SLUGS,
      limit,
    },
    errors,
    totals: {
      rawCandidateCount: allCandidates.length,
      worldCupRelevantCandidateCount: worldCupCandidates.length,
      providerLineCandidateCount: lineCandidates.length,
      attachReadyProviderLineCandidateCount: attachReadyLineCandidates.length,
      providerLineCandidateFamilies: Array.from(new Set(lineCandidates.map((candidate) => candidate.family))),
      lineLikeRejectedCandidateCount: lineLikeRejectedCandidates.length,
    },
    familySummary,
    lineFamilySummary,
    currentMvpInterpretation:
      attachReadyLineCandidates.length > 0
        ? "review_attach_ready_provider_line_candidates_before_replacing_local_fixtures"
        : "no_attach_ready_world_cup_line_markets_found_keep_local_contract_fixtures_for_mvp",
    topLineCandidates,
    lineLikeRejectedCandidates,
    limitations: [
      "Read-only scan. No local events, markets, mappings, orders, or fixtures are created or modified.",
      "A provider line candidate here is not enough for parity; it must still be reviewed against a specific Holiwyn event/market/outcome/line identity before attachment.",
      "Line-like rejected candidates are diagnostic only. They are not attach-ready until classifier family, event relevance, outcome identity, and CLOB token identity all match a Holiwyn target market.",
      "If attach-ready line candidates remain zero, Local MVP contract fixtures are still the honest path for spread/totals/team-total UI and fake-token order proof.",
    ],
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

async function fetchGammaMarketsBySearch(query: string, limit: number) {
  const url = new URL("/markets", GAMMA_BASE_URL);
  url.searchParams.set("active", "true");
  url.searchParams.set("closed", "false");
  url.searchParams.set("archived", "false");
  url.searchParams.set("limit", String(Math.min(Math.max(limit, 1), 200)));
  url.searchParams.set("search", query);
  const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Gamma market search failed: ${response.status} ${response.statusText}`);
  const payload = await response.json() as unknown;
  if (!Array.isArray(payload)) throw new Error("Gamma market search response was not an array.");
  return payload.filter((entry): entry is GammaWire => Boolean(entry) && typeof entry === "object");
}

async function fetchGammaEventsByTag(tagSlug: string, limit: number) {
  const url = new URL("/events", GAMMA_BASE_URL);
  url.searchParams.set("active", "true");
  url.searchParams.set("closed", "false");
  url.searchParams.set("archived", "false");
  url.searchParams.set("limit", String(Math.min(Math.max(limit, 1), 50)));
  url.searchParams.set("tag_slug", tagSlug);
  const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Gamma event tag fetch failed: ${response.status} ${response.statusText}`);
  const payload = await response.json() as unknown;
  if (!Array.isArray(payload)) throw new Error("Gamma event tag response was not an array.");
  return payload.filter((entry): entry is GammaWire => Boolean(entry) && typeof entry === "object");
}

function normalizeCandidate(
  input: GammaWire,
  source: ScanCandidate["source"],
  queryOrTag: string,
  context: { eventTitle?: string | null; tags?: string[]; category?: string | null } = {},
): ScanCandidate | null {
  const slug = asString(input.slug);
  const question = asString(input.question) ?? asString(input.title) ?? asString(input.name);
  if (!slug || !question) return null;

  const eventTitle = parseEventTitle(input) ?? context.eventTitle ?? null;
  const tags = Array.from(new Set([...parseTags(input.tags), ...(context.tags ?? [])]));
  const family = classifyProviderMarketFamily({
    question,
    slug,
    eventTitle,
    tags,
  });
  const clobTokenIds = parseStringArray(input.clobTokenIds);
  const outcomes = parseStringArray(input.outcomes);
  const haystack = [
    slug,
    question,
    eventTitle,
    context.category,
    asString(input.category),
    ...tags,
    ...outcomes,
  ].filter(Boolean).join(" ").toLowerCase();
  const worldCupRelevant = /\b(world cup|fifa|fifwc)\b/.test(haystack);

  return {
    source,
    queryOrTag,
    slug,
    question,
    eventTitle,
    family,
    active: asBoolean(input.active),
    closed: asBoolean(input.closed),
    archived: asBoolean(input.archived),
    acceptingOrders: asBoolean(input.acceptingOrders),
    conditionId: asString(input.conditionId),
    externalMarketId: asString(input.id) ?? asString(input.marketId) ?? asString(input.questionID),
    outcomeCount: outcomes.length,
    tokenCount: clobTokenIds.length,
    bestBid: asNumber(input.bestBid),
    bestAsk: asNumber(input.bestAsk),
    spread: asNumber(input.spread) ?? computeSpread(asNumber(input.bestBid), asNumber(input.bestAsk)),
    volume24hr: asNumber(input.volume24hr ?? input.volume24Hour ?? input.volume24h),
    liquidity: asNumber(input.liquidity ?? input.liquidityNum),
    worldCupRelevant,
    attachIdentityComplete: Boolean(asString(input.conditionId) && (asString(input.id) ?? asString(input.marketId) ?? asString(input.questionID)) && outcomes.length > 0 && clobTokenIds.length >= outcomes.length),
  };
}

function summarizeFamilies(candidates: ScanCandidate[]) {
  return candidates.reduce<Record<ProviderMarketFamily, number>>((summary, candidate) => {
    summary[candidate.family] = (summary[candidate.family] ?? 0) + 1;
    return summary;
  }, {
    match_winner: 0,
    spread: 0,
    total_goals: 0,
    team_total_goals: 0,
    corners: 0,
    first_half: 0,
    second_half: 0,
    correct_score: 0,
    other: 0,
  });
}

function isLineLikeRejectedCandidate(candidate: ScanCandidate) {
  return classifyLineLikeRejectedCandidate(candidate).length > 0;
}

function classifyLineLikeRejectedCandidate(candidate: ScanCandidate) {
  const text = [
    candidate.slug,
    candidate.question,
    candidate.eventTitle,
  ].filter(Boolean).join(" ").toLowerCase().replaceAll("-", " ");
  const reasons: string[] = [];
  if (/\b(spread|handicap|cover|covers)\b/.test(text)) reasons.push("spread_keyword");
  if (/\b(total goals|goals over|goals under|over under|over \d|under \d)\b/.test(text)) reasons.push("total_goals_keyword");
  if (/\b(team total|team goals|team goal)\b/.test(text)) reasons.push("team_total_keyword");
  if (/\b(first half|1st half|1h)\b/.test(text)) reasons.push("first_half_keyword");
  if (/\b(second half|2nd half|2h)\b/.test(text)) reasons.push("second_half_keyword");
  if (/\b(corner|corners)\b/.test(text)) reasons.push("corners_keyword");
  if (/\b(correct score|final score|exact score)\b/.test(text)) reasons.push("correct_score_keyword");
  if (/\bboth teams (to )?score\b|\bbtts\b/.test(text)) reasons.push("btts_prop_keyword");
  return reasons;
}

function parseEventTitle(input: GammaWire): string | null {
  const events = input.events;
  if (Array.isArray(events)) {
    for (const event of events) {
      if (event && typeof event === "object") {
        const title = asString((event as GammaWire).title) ?? asString((event as GammaWire).name);
        if (title) return title;
      }
    }
  }
  return null;
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  if (typeof value === "string") {
    try {
      return parseStringArray(JSON.parse(value) as unknown);
    } catch {
      return value.split(",").map((entry) => entry.trim()).filter(Boolean);
    }
  }
  return [];
}

function parseTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry === "string") return [entry];
    if (entry && typeof entry === "object") {
      const tag = entry as GammaWire;
      return [asString(tag.slug), asString(tag.label), asString(tag.name)].filter((item): item is string => Boolean(item));
    }
    return [];
  });
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
}

function computeSpread(bestBid: number | null, bestAsk: number | null) {
  return bestBid != null && bestAsk != null ? Math.max(0, bestAsk - bestBid) : null;
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
