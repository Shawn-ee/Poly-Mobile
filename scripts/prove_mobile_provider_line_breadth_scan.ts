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
const EVENT_SPECIFIC_PROBES = [
  { eventSlug: "fifwc-arg-egy-2026-07-07", homeTeam: "Argentina", awayTeam: "Egypt", homeCode: "arg", awayCode: "egy" },
  { eventSlug: "fifwc-par-fra-2026-07-04", homeTeam: "Paraguay", awayTeam: "France", homeCode: "par", awayCode: "fra" },
  { eventSlug: "fifwc-bra-nor-2026-07-05", homeTeam: "Brazil", awayTeam: "Norway", homeCode: "bra", awayCode: "nor" },
] as const;
type EventSpecificProbe = {
  eventSlug: string;
  homeTeam: string;
  awayTeam: string;
  homeCode: string;
  awayCode: string;
  source?: "static" | "gamma-event" | "local-fixture";
};
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
  source: "market-search" | "event-tag" | "event-specific-search" | "exact-slug";
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
  const rawSourceHits = {
    marketSearch: 0,
    eventTag: 0,
    eventSpecificSearch: 0,
    exactSlug: 0,
  };
  const rawLineSourceHits = {
    marketSearch: 0,
    eventTag: 0,
    eventSpecificSearch: 0,
    exactSlug: 0,
  };
  const dynamicEventProbeBySlug = new Map<string, EventSpecificProbe>();
  const localFixtureProbes = await buildLocalFixtureEventProbes();

  for (const query of SEARCH_QUERIES) {
    try {
      const markets = await fetchGammaMarketsBySearch(query, limit);
      for (const market of markets) {
        const candidate = normalizeCandidate(market, "market-search", query);
        if (candidate?.worldCupRelevant) {
          rawSourceHits.marketSearch += 1;
          if (LINE_FAMILIES.has(candidate.family)) rawLineSourceHits.marketSearch += 1;
        }
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
        const dynamicProbe = buildEventProbeFromGammaEvent(event);
        if (dynamicProbe && !dynamicEventProbeBySlug.has(dynamicProbe.eventSlug)) {
          dynamicEventProbeBySlug.set(dynamicProbe.eventSlug, dynamicProbe);
        }
        const eventTitle = asString(event.title) ?? asString(event.name);
        const tags = parseTags(event.tags);
        const category = asString(event.category);
        const markets = Array.isArray(event.markets) ? event.markets : [];
        for (const market of markets) {
          if (!market || typeof market !== "object") continue;
          const candidate = normalizeCandidate(market as GammaWire, "event-tag", tagSlug, { eventTitle, tags, category });
          if (candidate?.worldCupRelevant) {
            rawSourceHits.eventTag += 1;
            if (LINE_FAMILIES.has(candidate.family)) rawLineSourceHits.eventTag += 1;
          }
          if (candidate && !bySlug.has(candidate.slug)) {
            bySlug.set(candidate.slug, candidate);
          }
        }
      }
    } catch (error) {
      errors.push({ source: "event-tag", queryOrTag: tagSlug, error: error instanceof Error ? error.message : String(error) });
    }
  }

  const eventSpecificProbes = mergeEventSpecificProbes([
    ...EVENT_SPECIFIC_PROBES.map((probe) => ({ ...probe, source: "static" as const })),
    ...localFixtureProbes,
    ...dynamicEventProbeBySlug.values(),
  ]);
  const eventSpecificSearchQueries = eventSpecificProbes.flatMap(buildEventSpecificSearchQueries);
  const exactSlugGuesses = eventSpecificProbes.flatMap(buildEventSpecificSlugGuesses);

  for (const probe of eventSpecificProbes) {
    for (const query of buildEventSpecificSearchQueries(probe)) {
      try {
        const markets = await fetchGammaMarketsBySearch(query, Math.min(limit, 50));
        for (const market of markets) {
          const candidate = normalizeCandidate(market, "event-specific-search", `${probe.eventSlug}:${query}`);
          if (candidate?.worldCupRelevant) {
            rawSourceHits.eventSpecificSearch += 1;
            if (LINE_FAMILIES.has(candidate.family)) rawLineSourceHits.eventSpecificSearch += 1;
          }
          if (candidate && !bySlug.has(candidate.slug)) {
            bySlug.set(candidate.slug, candidate);
          }
        }
      } catch (error) {
        errors.push({ source: "event-specific-search", queryOrTag: `${probe.eventSlug}:${query}`, error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  for (const slug of exactSlugGuesses) {
    try {
      const markets = await fetchGammaMarketsBySlug(slug);
      for (const market of markets) {
        const candidate = normalizeCandidate(market, "exact-slug", slug);
        if (candidate?.worldCupRelevant) {
          rawSourceHits.exactSlug += 1;
          if (LINE_FAMILIES.has(candidate.family)) rawLineSourceHits.exactSlug += 1;
        }
        if (candidate && !bySlug.has(candidate.slug)) {
          bySlug.set(candidate.slug, candidate);
        }
      }
    } catch (error) {
      errors.push({ source: "exact-slug", queryOrTag: slug, error: error instanceof Error ? error.message : String(error) });
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
  const lineQueryOtherCandidateSamples = worldCupCandidates
    .filter((candidate) => candidate.source === "market-search" && SEARCH_QUERIES.includes(candidate.queryOrTag) && candidate.family === "other")
    .sort((left, right) => (Number(right.attachIdentityComplete) - Number(left.attachIdentityComplete)) || ((right.volume24hr ?? 0) - (left.volume24hr ?? 0)))
    .slice(0, 25)
    .map(candidateDiagnostic);
  const topLineCandidates = lineCandidates
    .sort((left, right) => (Number(right.acceptingOrders) - Number(left.acceptingOrders)) || ((right.volume24hr ?? 0) - (left.volume24hr ?? 0)))
    .slice(0, 20);
  const lineQueryFamilySummary = summarizeFamilies(
    worldCupCandidates.filter((candidate) => candidate.source === "market-search" && SEARCH_QUERIES.includes(candidate.queryOrTag)),
  );
  const realProviderProbeCount = eventSpecificProbes.filter((probe) => probe.source !== "local-fixture").length;
  const syntheticLocalFixtureProbeCount = eventSpecificProbes.filter((probe) => probe.source === "local-fixture").length;
  const eventSpecificProbeSummary = summarizeProbeSources(eventSpecificProbes);
  const providerLineDiscoveryBlockers = [
    lineCandidates.length === 0 ? "no_world_cup_line_family_markets_found" : null,
    attachReadyLineCandidates.length === 0 ? "no_attach_ready_line_market_identity" : null,
    rawLineSourceHits.exactSlug === 0 ? "exact_slug_line_guesses_returned_zero" : null,
    rawLineSourceHits.eventSpecificSearch === 0 ? "event_specific_line_search_returned_zero" : null,
    syntheticLocalFixtureProbeCount > 0 ? "local_fixture_probes_are_search_only_not_attachable_provider_slugs" : null,
  ].filter((blocker): blocker is string => Boolean(blocker));
  const decision = {
    providerLineParityReady: attachReadyLineCandidates.length > 0,
    keepLocalContractFixtures: attachReadyLineCandidates.length === 0,
    realProviderProbeCount,
    syntheticLocalFixtureProbeCount,
    providerLineDiscoveryBlockers,
    nextSafeAction:
      attachReadyLineCandidates.length > 0
        ? "Review attach-ready provider line candidates against the Holiwyn event/market/outcome contract before replacing local fixtures."
        : "Keep Local MVP spread/totals/team-total rows as contract fixtures; do not attach synthetic local fixture probes or unrelated match-winner candidates as provider-backed line markets.",
  };

  const summary = {
    cycle,
    result: "pass",
    generatedAt: new Date().toISOString(),
    provider: "polymarket-gamma",
    scope: "world-cup-provider-line-breadth-scan",
    sources: {
      searchQueries: SEARCH_QUERIES,
      eventTagSlugs: EVENT_TAG_SLUGS,
      eventSpecificProbes,
      staticEventSpecificProbeCount: EVENT_SPECIFIC_PROBES.length,
      dynamicEventSpecificProbeCount: dynamicEventProbeBySlug.size,
      localFixtureEventSpecificProbeCount: localFixtureProbes.length,
      eventSpecificSearchQueries,
      exactSlugGuesses,
      limit,
      eventSpecificProbeSummary,
    },
    errors,
    totals: {
      rawCandidateCount: allCandidates.length,
      worldCupRelevantCandidateCount: worldCupCandidates.length,
      rawSourceHits,
      rawLineSourceHits,
      providerLineCandidateCount: lineCandidates.length,
      attachReadyProviderLineCandidateCount: attachReadyLineCandidates.length,
      providerLineCandidateFamilies: Array.from(new Set(lineCandidates.map((candidate) => candidate.family))),
      eventSpecificSearchCandidateCount: worldCupCandidates.filter((candidate) => candidate.source === "event-specific-search").length,
      exactSlugCandidateCount: worldCupCandidates.filter((candidate) => candidate.source === "exact-slug").length,
      eventSpecificLineCandidateCount: lineCandidates.filter((candidate) => candidate.source === "event-specific-search").length,
      exactSlugLineCandidateCount: lineCandidates.filter((candidate) => candidate.source === "exact-slug").length,
      lineLikeRejectedCandidateCount: lineLikeRejectedCandidates.length,
      lineQueryOtherCandidateSampleCount: lineQueryOtherCandidateSamples.length,
    },
    familySummary,
    lineFamilySummary,
    lineQueryFamilySummary,
    decision,
    currentMvpInterpretation:
      attachReadyLineCandidates.length > 0
        ? "review_attach_ready_provider_line_candidates_before_replacing_local_fixtures"
        : "no_attach_ready_world_cup_line_markets_found_keep_local_contract_fixtures_for_mvp",
    topLineCandidates,
    lineLikeRejectedCandidates,
    lineQueryOtherCandidateSamples,
    limitations: [
      "Read-only scan. No local events, markets, mappings, orders, or fixtures are created or modified.",
      "Event-specific search queries and exact slug guesses are diagnostic only; they do not attach provider identities.",
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

async function fetchGammaMarketsBySlug(slug: string) {
  const url = new URL("/markets", GAMMA_BASE_URL);
  url.searchParams.set("active", "true");
  url.searchParams.set("closed", "false");
  url.searchParams.set("archived", "false");
  url.searchParams.set("limit", "20");
  url.searchParams.set("slug", slug);
  const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Gamma market slug lookup failed: ${response.status} ${response.statusText}`);
  const payload = await response.json() as unknown;
  if (!Array.isArray(payload)) throw new Error("Gamma market slug response was not an array.");
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

function candidateDiagnostic(candidate: ScanCandidate) {
  return {
    slug: candidate.slug,
    question: candidate.question,
    eventTitle: candidate.eventTitle,
    family: candidate.family,
    source: candidate.source,
    queryOrTag: candidate.queryOrTag,
    acceptingOrders: candidate.acceptingOrders,
    attachIdentityComplete: candidate.attachIdentityComplete,
    conditionIdPresent: Boolean(candidate.conditionId),
    tokenCount: candidate.tokenCount,
    outcomeCount: candidate.outcomeCount,
    volume24hr: candidate.volume24hr,
    liquidity: candidate.liquidity,
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

function summarizeProbeSources(probes: EventSpecificProbe[]) {
  return probes.reduce<Record<NonNullable<EventSpecificProbe["source"]>, number>>((summary, probe) => {
    const source = probe.source ?? "static";
    summary[source] = (summary[source] ?? 0) + 1;
    return summary;
  }, {
    static: 0,
    "gamma-event": 0,
    "local-fixture": 0,
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

function buildEventSpecificSearchQueries(probe: EventSpecificProbe) {
  const teamPair = `${probe.homeTeam} ${probe.awayTeam}`;
  return [
    `${teamPair} spread`,
    `${teamPair} handicap`,
    `${teamPair} total goals`,
    `${teamPair} over under`,
    `${teamPair} over 2.5`,
    `${probe.homeTeam} team total ${probe.awayTeam}`,
    `${probe.awayTeam} team total ${probe.homeTeam}`,
    `${teamPair} first half`,
    `${teamPair} 1h`,
    `${teamPair} corners`,
    `${teamPair} correct score`,
  ];
}

function buildEventSpecificSlugGuesses(probe: EventSpecificProbe) {
  if (probe.source === "local-fixture") return [];
  const teams = [probe.homeCode, probe.awayCode];
  const lineValues = ["1-5", "2-5", "3-5"];
  const baseGuesses = [
    `${probe.eventSlug}-spread`,
    `${probe.eventSlug}-handicap`,
    `${probe.eventSlug}-total-goals`,
    `${probe.eventSlug}-over-under`,
    `${probe.eventSlug}-team-total`,
    `${probe.eventSlug}-team-goals`,
    `${probe.eventSlug}-first-half`,
    `${probe.eventSlug}-1h`,
    `${probe.eventSlug}-corners`,
    `${probe.eventSlug}-correct-score`,
  ];
  const teamGuesses = teams.flatMap((team) => [
    `${probe.eventSlug}-${team}-spread`,
    `${probe.eventSlug}-${team}-handicap`,
    `${probe.eventSlug}-spread-${team}`,
    `${probe.eventSlug}-${team}-team-total`,
    `${probe.eventSlug}-team-total-${team}`,
    `${probe.eventSlug}-${team}-team-goals`,
  ]);
  const lineGuesses = lineValues.flatMap((line) => [
    `${probe.eventSlug}-spread-${line}`,
    `${probe.eventSlug}-handicap-${line}`,
    `${probe.eventSlug}-total-goals-${line}`,
    `${probe.eventSlug}-over-${line}`,
    `${probe.eventSlug}-under-${line}`,
    ...teams.flatMap((team) => [
      `${probe.eventSlug}-${team}-spread-${line}`,
      `${probe.eventSlug}-${team}-handicap-${line}`,
      `${probe.eventSlug}-${team}-team-goals-${line}`,
      `${probe.eventSlug}-${team}-team-total-${line}`,
    ]),
  ]);
  return Array.from(new Set([...baseGuesses, ...teamGuesses, ...lineGuesses]));
}

function mergeEventSpecificProbes(probes: EventSpecificProbe[]) {
  const bySlug = new Map<string, EventSpecificProbe>();
  for (const probe of probes) {
    const existing = bySlug.get(probe.eventSlug);
    if (!existing || existing.source !== "static") {
      bySlug.set(probe.eventSlug, probe);
    }
  }
  return Array.from(bySlug.values());
}

async function buildLocalFixtureEventProbes() {
  const fixturePath = path.join(process.cwd(), "mobile", "src", "mocks", "worldCup.ts");
  let source = "";
  try {
    source = await fs.readFile(fixturePath, "utf8");
  } catch {
    return [];
  }
  const probes = new Map<string, EventSpecificProbe>();
  const titlePattern = /title:\s*"([^"]+\s+vs\.?\s+[^"]+)"/g;
  for (const match of source.matchAll(titlePattern)) {
    const teams = parseTeamsFromTitle(match[1]);
    if (!teams) continue;
    const homeCode = providerCodeForTeam(teams.homeTeam);
    const awayCode = providerCodeForTeam(teams.awayTeam);
    const eventSlug = `fifwc-${homeCode}-${awayCode}-local-fixture`;
    if (!probes.has(eventSlug)) {
      probes.set(eventSlug, {
        eventSlug,
        homeTeam: teams.homeTeam,
        awayTeam: teams.awayTeam,
        homeCode,
        awayCode,
        source: "local-fixture",
      });
    }
  }
  return Array.from(probes.values());
}

function buildEventProbeFromGammaEvent(event: GammaWire): EventSpecificProbe | null {
  const eventSlug = asString(event.slug);
  if (!eventSlug || !/^fifwc-[a-z0-9-]+-\d{4}-\d{2}-\d{2}$/i.test(eventSlug)) return null;
  const title = asString(event.title) ?? asString(event.name) ?? "";
  const teamsFromTitle = parseTeamsFromTitle(title);
  const codeMatch = eventSlug.match(/^fifwc-([a-z0-9]+)-([a-z0-9]+)-\d{4}-\d{2}-\d{2}$/i);
  if (!teamsFromTitle || !codeMatch) return null;
  return {
    eventSlug,
    homeTeam: teamsFromTitle.homeTeam,
    awayTeam: teamsFromTitle.awayTeam,
    homeCode: codeMatch[1].toLowerCase(),
    awayCode: codeMatch[2].toLowerCase(),
    source: "gamma-event",
  };
}

function parseTeamsFromTitle(title: string) {
  const normalized = title.replace(/\s+/g, " ").trim();
  const match = normalized.match(/^(.+?)\s+(?:vs\.?|v\.?|versus)\s+(.+?)$/i);
  if (!match) return null;
  const homeTeam = match[1].trim();
  const awayTeam = match[2].trim();
  if (!homeTeam || !awayTeam) return null;
  return { homeTeam, awayTeam };
}

function providerCodeForTeam(team: string) {
  const normalized = team.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  const known: Record<string, string> = {
    argentina: "arg",
    australia: "aus",
    brazil: "bra",
    "congo dr": "cod",
    croatia: "cro",
    ecuador: "ecu",
    egypt: "egy",
    england: "eng",
    france: "fra",
    mexico: "mex",
    norway: "nor",
    paraguay: "par",
    portugal: "por",
  };
  return known[normalized] ?? normalized.replace(/[^a-z0-9]+/g, "").slice(0, 3);
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
