import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { selectCompactLiveMarkets } from "@/server/services/mobileLiveEventDetail";

const GAMMA_BASE_URL = "https://gamma-api.polymarket.com";
const DEFAULT_LIMIT_PER_QUERY = 20;
const MAX_MARKETS = 14;
const DEFAULT_PROVIDER_SEARCH_MODE: ProviderSearchMode = "combined";
const SPORTS_EVENT_TAG_SLUGS = ["fifa-world-cup", "2026-fifa-world-cup", "soccer"];
const DEFAULT_SPORTS_EVENT_LIMIT = 12;
const MIN_RELEVANT_TOKEN_MATCHES = 2;
const PROVIDER_MARKET_SLUG_CODE_BY_NAME: Record<string, string> = {
  argentina: "arg",
  australia: "aus",
  belgium: "bel",
  brazil: "bra",
  canada: "can",
  chile: "chi",
  colombia: "col",
  croatia: "cro",
  denmark: "den",
  ecuador: "ecu",
  england: "eng",
  france: "fra",
  germany: "ger",
  ghana: "gha",
  italy: "ita",
  japan: "jpn",
  mexico: "mex",
  morocco: "mar",
  netherlands: "ned",
  portugal: "por",
  qatar: "qat",
  senegal: "sen",
  spain: "esp",
  switzerland: "sui",
  uruguay: "uru",
  usa: "usa",
  "united states": "usa",
  "united states of america": "usa",
};
const GENERIC_RELEVANCE_TOKENS = new Set([
  "and",
  "bet",
  "both",
  "draw",
  "first",
  "goals",
  "half",
  "match",
  "no",
  "over",
  "score",
  "second",
  "team",
  "the",
  "total",
  "under",
  "winner",
  "will",
  "yes",
]);

type GammaWire = Record<string, unknown>;
export type ProviderSearchMode = "market-search" | "sports-events" | "combined";

type CompactMarketForCandidates = {
  id: string;
  title: string;
  eventTitle?: string | null;
  marketType: string;
  period: string | null;
  line: Prisma.Decimal | null;
  unit: string | null;
  marketGroupKey: string | null;
  marketGroupTitle: string | null;
  outcomes: Array<{
    id: string;
    name: string;
    side: string | null;
    displayOrder: number;
    referenceOutcomeLabel?: string | null;
  }>;
};

export type ProviderCandidateDiscoveryOptions = {
  eventSlug: string;
  marketId?: string | null;
  maxCandidatesPerMarket?: number | null;
  fetchProvider?: boolean;
  providerSearchMode?: ProviderSearchMode | null;
  providerEventSlugs?: string[] | null;
  fetchImpl?: typeof fetch;
};

export type ProviderCandidateSlugPreviewOptions = {
  eventSlug: string;
  marketId: string;
  slugs: string[];
  fetchImpl?: typeof fetch;
};

export type ProviderCandidateBulkSlugPreviewOptions = {
  eventSlug: string;
  reviews: Array<{
    marketId: string;
    slugs: string[];
  }>;
  fetchImpl?: typeof fetch;
};

export type ProviderMarketCandidate = NonNullable<ReturnType<typeof normalizeProviderCandidate>>;
export type ProviderMarketFamily =
  | "match_winner"
  | "spread"
  | "total_goals"
  | "team_total_goals"
  | "corners"
  | "first_half"
  | "second_half"
  | "correct_score"
  | "other";

export async function discoverMobileLiveProviderCandidates(options: ProviderCandidateDiscoveryOptions) {
  const compactEvent = await loadCompactLiveEvent(options.eventSlug);
  const compactMarkets = compactEvent.markets;
  const selectedMarkets = options.marketId
    ? compactMarkets.filter((market) => market.id === options.marketId)
    : compactMarkets.slice(0, MAX_MARKETS);

  if (options.marketId && selectedMarkets.length === 0) {
    throw new Error(`Market ${options.marketId} is not in compact live event ${options.eventSlug}.`);
  }

  const fetchProvider = options.fetchProvider !== false;
  const providerSearchMode = options.providerSearchMode ?? DEFAULT_PROVIDER_SEARCH_MODE;
  const maxCandidatesPerMarket = Math.max(1, Math.min(options.maxCandidatesPerMarket ?? 5, 10));
  const providerEventSlugs = deriveProviderEventSlugHints(compactEvent.event, options.providerEventSlugs);
  let providerSportsEventErrorGlobal: string | null = null;
  let sportsEventCandidates: ProviderMarketCandidate[] = [];
  let manualSlugFallbackCandidates: ProviderMarketCandidate[] = [];
  if (fetchProvider && providerSearchMode !== "market-search") {
    try {
      sportsEventCandidates = await fetchProviderCandidatesFromSportsEvents({
        eventSlugs: providerEventSlugs.length ? providerEventSlugs : undefined,
        tagSlugs: providerEventSlugs.length ? [] : undefined,
        fetchImpl: options.fetchImpl ?? fetch,
      });
      const manualSlugs = Array.from(new Set(selectedMarkets.flatMap((market) =>
        buildProviderCandidateManualSlugFallbacks(market, providerEventSlugs)
      )));
      if (manualSlugs.length > 0) {
        manualSlugFallbackCandidates = await fetchProviderCandidatesForSlugs(manualSlugs, {
          fetchImpl: options.fetchImpl ?? fetch,
        });
      }
    } catch (error) {
      providerSportsEventErrorGlobal = error instanceof Error ? error.message : String(error);
    }
  }
  const providerTargets = [];

  for (const market of selectedMarkets) {
    const queries = buildProviderCandidateSearchQueries(market);
    let providerError: string | null = null;
    let providerSportsEventError: string | null = providerSportsEventErrorGlobal;
    let candidates: ProviderMarketCandidate[] = [];

    if (fetchProvider) {
      try {
        const raw = mergeProviderCandidates([
          ...(providerSearchMode !== "sports-events"
            ? await fetchProviderCandidatesForQueries(queries, {
                limitPerQuery: DEFAULT_LIMIT_PER_QUERY,
                fetchImpl: options.fetchImpl ?? fetch,
              })
            : []),
          ...sportsEventCandidates,
          ...manualSlugFallbackCandidates,
        ]);
        candidates = rankProviderCandidates(market, raw).slice(0, maxCandidatesPerMarket);
      } catch (error) {
        providerError = error instanceof Error ? error.message : String(error);
      }
    }

    const bestCandidate = candidates[0] ?? null;
    providerTargets.push({
      marketId: market.id,
      title: market.title,
      marketType: market.marketType,
      period: market.period,
      line: market.line?.toString() ?? null,
      unit: market.unit,
      outcomeCount: market.outcomes.length,
      queries,
      providerSearchMode,
      providerFetchAttempted: fetchProvider,
      expectedProviderFamily: expectedProviderMarketFamily(market),
      providerError,
      providerSportsEventError,
      candidateCount: candidates.length,
      bestCandidate,
      attachProposal: bestCandidate ? buildAttachProposal(market, bestCandidate) : null,
      candidates,
    });
  }

  return {
    eventSlug: options.eventSlug,
    generatedAt: new Date().toISOString(),
    provider: "polymarket-gamma",
    fetchProvider,
    providerSearchMode,
    providerEventSlugs,
    providerEventSlugSource:
      providerEventSlugs.length > 0
        ? options.providerEventSlugs?.length
          ? "request"
          : "event"
        : "none",
    manualSlugFallbacks: providerEventSlugs.length > 0
      ? Array.from(new Set(selectedMarkets.flatMap((market) => buildProviderCandidateManualSlugFallbacks(market, providerEventSlugs))))
      : [],
    manualSlugFallbackCandidateCount: manualSlugFallbackCandidates.length,
    providerCandidateFamilySummary: summarizeProviderCandidateFamilies(sportsEventCandidates),
    targetMarketCount: providerTargets.length,
    attachReadyCandidateCount: providerTargets.filter((target) => target.attachProposal?.attachReady).length,
    providerErrorCount: providerTargets.filter((target) => target.providerError || target.providerSportsEventError).length,
    nextRequiredAction:
      providerTargets.some((target) => target.attachProposal?.attachReady)
        ? "review_and_attach_provider_identity_candidates"
        : fetchProvider
          ? "expand_provider_search_or_use_manual_polymarket_slugs"
          : "run_provider_candidate_discovery_with_fetch_enabled",
    targets: providerTargets,
  };
}

export function buildProviderCandidateManualSlugFallbacks(
  market: Pick<CompactMarketForCandidates, "title" | "marketType" | "outcomes">,
  providerEventSlugs: string[],
) {
  const exactEventSlugs = Array.from(new Set(providerEventSlugs.map(sanitizeSlug).filter(Boolean)));
  if (exactEventSlugs.length === 0) return [];
  const family = expectedProviderMarketFamily({
    title: market.title,
    marketType: market.marketType,
    period: null,
    marketGroupKey: null,
    marketGroupTitle: null,
  });
  if (family !== "match_winner") {
    return exactEventSlugs.flatMap((eventSlug) => buildLineMarketSlugFallbacks(eventSlug, market, family));
  }

  const suffix = inferMatchWinnerSlugSuffix(market);
  if (!suffix) return [];
  return exactEventSlugs.map((eventSlug) => `${eventSlug}-${suffix}`);
}

function buildLineMarketSlugFallbacks(
  eventSlug: string,
  market: Pick<CompactMarketForCandidates, "title" | "marketType" | "outcomes">,
  family: ProviderMarketFamily,
) {
  const suffixes = new Set<string>();
  const line = inferLineSlugFragments(market.title);
  const teamCodes = inferTeamCodes(market);

  if (family === "spread") {
    suffixes.add("spread");
    suffixes.add("handicap");
    for (const code of teamCodes) {
      suffixes.add(`${code}-spread`);
      suffixes.add(`${code}-handicap`);
    }
    for (const fragment of line) {
      suffixes.add(`spread-${fragment}`);
      suffixes.add(`handicap-${fragment}`);
      for (const code of teamCodes) {
        suffixes.add(`${code}-spread-${fragment}`);
        suffixes.add(`${code}-handicap-${fragment}`);
      }
    }
  } else if (family === "total_goals") {
    suffixes.add("total-goals");
    suffixes.add("over-under");
    suffixes.add("goals");
    for (const fragment of line) {
      suffixes.add(`total-goals-${fragment}`);
      suffixes.add(`over-${fragment}`);
      suffixes.add(`under-${fragment}`);
    }
  } else if (family === "team_total_goals") {
    suffixes.add("team-total");
    suffixes.add("team-goals");
    for (const code of teamCodes) {
      suffixes.add(`${code}-team-total`);
      suffixes.add(`team-total-${code}`);
      suffixes.add(`${code}-team-goals`);
      suffixes.add(`${code}-total-goals`);
    }
    for (const fragment of line) {
      suffixes.add(`team-total-${fragment}`);
      for (const code of teamCodes) {
        suffixes.add(`${code}-team-total-${fragment}`);
        suffixes.add(`${code}-team-goals-${fragment}`);
      }
    }
  } else if (family === "first_half") {
    suffixes.add("first-half");
    suffixes.add("1h");
    suffixes.add("first-half-winner");
    suffixes.add("1h-winner");
    for (const fragment of line) {
      suffixes.add(`first-half-total-goals-${fragment}`);
      suffixes.add(`1h-total-goals-${fragment}`);
    }
  } else if (family === "second_half") {
    suffixes.add("second-half");
    suffixes.add("2h");
    suffixes.add("second-half-winner");
    suffixes.add("2h-winner");
    for (const fragment of line) {
      suffixes.add(`second-half-total-goals-${fragment}`);
      suffixes.add(`2h-total-goals-${fragment}`);
    }
  } else if (family === "corners") {
    suffixes.add("corners");
    suffixes.add("total-corners");
    for (const fragment of line) {
      suffixes.add(`corners-${fragment}`);
      suffixes.add(`total-corners-${fragment}`);
    }
  } else if (family === "correct_score") {
    suffixes.add("correct-score");
    suffixes.add("final-score");
  } else {
    return [];
  }

  return Array.from(suffixes).map((suffix) => `${eventSlug}-${suffix}`);
}

export function summarizeProviderCandidateFamilies(candidates: ProviderMarketCandidate[]) {
  const summary = emptyProviderCandidateFamilySummary();
  for (const candidate of candidates) {
    const family = classifyProviderMarketFamily(candidate);
    summary[family] += 1;
  }
  return summary;
}

export function classifyProviderMarketFamily(candidate: Pick<ProviderMarketCandidate, "question" | "slug" | "eventTitle" | "tags">): ProviderMarketFamily {
  const text = normalizeText(`${candidate.question} ${candidate.slug} ${candidate.eventTitle ?? ""} ${candidate.tags.join(" ")}`);
  if (/\b(correct score|final score|score exact)\b/.test(text)) return "correct_score";
  if (/\b(corner|corners)\b/.test(text)) return "corners";
  if (/\b(second half|2nd half|2h)\b/.test(text)) return "second_half";
  if (/\b(first half|1st half|1h)\b/.test(text)) return "first_half";
  if (/\b(team total|team goals|team goal)\b/.test(text)) return "team_total_goals";
  if (/\b(total goals|over under|over \d|under \d|goals over|goals under)\b/.test(text)) return "total_goals";
  if (/\b(spread|handicap|cover|covers|asian handicap)\b/.test(text)) return "spread";
  if (/\b(win on|winner|match winner|draw|end in a draw)\b/.test(text)) return "match_winner";
  return "other";
}

export function expectedProviderMarketFamily(
  market: Pick<CompactMarketForCandidates, "marketType" | "title" | "period" | "marketGroupKey" | "marketGroupTitle">,
): ProviderMarketFamily {
  const text = normalizeText(`${market.marketType} ${market.title} ${market.period ?? ""} ${market.marketGroupKey ?? ""} ${market.marketGroupTitle ?? ""}`);
  if (/\bcorner|corners\b/.test(text)) return "corners";
  if (/\bcorrect score|final score\b/.test(text)) return "correct_score";
  if (market.marketType === "team_total_goals" || /\bteam total|team goals\b/.test(text)) return "team_total_goals";
  if (market.marketType === "total_goals" || /\btotal goals|over under\b/.test(text)) return "total_goals";
  if (market.marketType === "spread" || /\bspread|handicap\b/.test(text)) return "spread";
  if (/\bsecond half|2nd half|2h\b/.test(text)) return "second_half";
  if (/\bfirst half|1st half|1h\b/.test(text)) return "first_half";
  if (market.marketType === "match_winner_1x2" || market.marketType === "moneyline" || market.marketType === "draw_no_bet") {
    return "match_winner";
  }
  return "other";
}

function emptyProviderCandidateFamilySummary(): Record<ProviderMarketFamily, number> {
  return {
    match_winner: 0,
    spread: 0,
    total_goals: 0,
    team_total_goals: 0,
    corners: 0,
    first_half: 0,
    second_half: 0,
    correct_score: 0,
    other: 0,
  };
}

export async function previewMobileLiveProviderCandidatesBySlug(options: ProviderCandidateSlugPreviewOptions) {
  const compactMarkets = (await loadCompactLiveEvent(options.eventSlug)).markets;
  const market = compactMarkets.find((candidate) => candidate.id === options.marketId);
  if (!market) {
    throw new Error(`Market ${options.marketId} is not in compact live event ${options.eventSlug}.`);
  }

  const requestedSlugs = Array.from(new Set(options.slugs.map(sanitizeSlug).filter(Boolean))).slice(0, 10);
  if (requestedSlugs.length === 0) {
    throw new Error("At least one Polymarket slug is required.");
  }

  let providerError: string | null = null;
  let candidates: ProviderMarketCandidate[] = [];
  try {
    candidates = rankProviderCandidates(
      market,
      await fetchProviderCandidatesForSlugs(requestedSlugs, {
        fetchImpl: options.fetchImpl ?? fetch,
      }),
    );
  } catch (error) {
    providerError = error instanceof Error ? error.message : String(error);
  }

  const bestCandidate = candidates[0] ?? null;
  const attachProposal = bestCandidate ? buildAttachProposal(market, bestCandidate) : null;

  return {
    eventSlug: options.eventSlug,
    generatedAt: new Date().toISOString(),
    provider: "polymarket-gamma",
    mode: "manual-slug-preview",
    marketId: market.id,
    title: market.title,
    expectedProviderFamily: expectedProviderMarketFamily(market),
    requestedSlugs,
    providerError,
    candidateCount: candidates.length,
    bestCandidate,
    attachProposal,
    attachReadyCandidateCount: candidates.filter((candidate) => candidate.attachReadiness.attachReady).length,
    nextRequiredAction:
      attachProposal?.attachReady
        ? "review_and_attach_provider_identity_candidate"
        : providerError
          ? "fix_provider_fetch_or_retry_manual_slug_preview"
          : "supply_better_polymarket_slug_for_compact_market",
    candidates,
  };
}

export async function previewMobileLiveProviderCandidatesBulkBySlug(options: ProviderCandidateBulkSlugPreviewOptions) {
  const reviews = options.reviews
    .map((review) => ({
      marketId: review.marketId.trim(),
      slugs: Array.from(new Set(review.slugs.map(sanitizeSlug).filter(Boolean))).slice(0, 10),
    }))
    .filter((review) => review.marketId && review.slugs.length > 0)
    .slice(0, 20);

  if (reviews.length === 0) {
    throw new Error("At least one provider slug review is required.");
  }

  const results = [];
  for (const review of reviews) {
    results.push(await previewMobileLiveProviderCandidatesBySlug({
      eventSlug: options.eventSlug,
      marketId: review.marketId,
      slugs: review.slugs,
      fetchImpl: options.fetchImpl,
    }));
  }

  const attachReadyResults = results.filter((result) => result.attachProposal?.attachReady);
  const mappings = attachReadyResults.flatMap((result) => {
    const mapping = result.attachProposal?.mapping;
    return mapping ? [mapping] : [];
  });
  return {
    eventSlug: options.eventSlug,
    generatedAt: new Date().toISOString(),
    provider: "polymarket-gamma",
    mode: "bulk-manual-slug-preview",
    reviewCount: results.length,
    attachReadyReviewCount: attachReadyResults.length,
    candidateCount: results.reduce((sum, result) => sum + result.candidateCount, 0),
    attachReadyCandidateCount: results.reduce((sum, result) => sum + result.attachReadyCandidateCount, 0),
    mappings,
    nextRequiredAction:
      attachReadyResults.length === results.length
        ? "review_and_apply_bulk_provider_identity_mappings"
        : attachReadyResults.length > 0
          ? "fix_failed_slug_reviews_before_bulk_apply"
          : "supply_better_polymarket_slugs_for_bulk_review",
    results,
  };
}

export function deriveProviderEventSlugHints(
  event: {
    externalSlug?: string | null;
    externalEventId?: string | null;
    source?: string | null;
    metadata?: Prisma.JsonValue | null;
  },
  requestedSlugs?: string[] | null,
) {
  const hints = new Set<string>();
  for (const value of requestedSlugs ?? []) {
    const slug = sanitizeSlug(value);
    if (slug) hints.add(slug);
  }
  if (hints.size > 0) {
    return Array.from(hints);
  }

  for (const value of [
    event.externalSlug,
    event.externalEventId,
    ...providerSlugHintsFromMetadata(event.metadata),
  ]) {
    const slug = sanitizeSlug(value);
    if (slug && looksLikePolymarketEventSlug(slug, event.source)) {
      hints.add(slug);
    }
  }
  return Array.from(hints);
}

export function buildProviderCandidateSearchQueries(market: CompactMarketForCandidates) {
  const title = market.title.replace(/[:]/g, " ").replace(/\s+/g, " ").trim();
  const eventTitle = market.eventTitle?.replace(/[:]/g, " ").replace(/\s+/g, " ").trim();
  const withoutLine = title.replace(/[+-]?\d+(\.\d+)?/g, " ").replace(/\s+/g, " ").trim();
  const normalizedTitle = normalizeProviderSearchPhrase(title);
  const normalizedEventTitle = eventTitle ? normalizeProviderSearchPhrase(eventTitle) : null;
  const normalizedWithoutLine = normalizeProviderSearchPhrase(withoutLine);
  const outcomeTeams = market.outcomes
    .map((outcome) => normalizeProviderSearchPhrase(outcome.name))
    .filter((name) => name.length > 2 && !GENERIC_RELEVANCE_TOKENS.has(name));
  const teamPair = outcomeTeams.length >= 2 ? `${outcomeTeams[0]} ${outcomeTeams[outcomeTeams.length - 1]}` : null;
  const eventSearchPhrases = buildProviderEventSearchPhrases(market);
  const terms = [
    title,
    normalizedTitle,
    withoutLine,
    normalizedWithoutLine,
    eventTitle,
    normalizedEventTitle,
    eventTitle ? `${eventTitle} ${marketTypeSearchAlias(market.marketType)}` : null,
    normalizedEventTitle ? `${normalizedEventTitle} ${marketTypeSearchAlias(market.marketType)}` : null,
    teamPair,
    teamPair ? `${teamPair} ${marketTypeSearchAlias(market.marketType)}` : null,
    ...eventSearchPhrases,
    `${withoutLine} ${market.marketType.replace(/_/g, " ")}`,
    `${normalizedWithoutLine} ${marketTypeSearchAlias(market.marketType)}`,
    market.marketGroupTitle ? `${withoutLine} ${market.marketGroupTitle}` : null,
    market.marketGroupTitle ? `${normalizedWithoutLine} ${normalizeProviderSearchPhrase(market.marketGroupTitle)}` : null,
    market.period ? `${withoutLine} ${market.period.replace(/-/g, " ")}` : null,
    market.period ? `${normalizedWithoutLine} ${market.period.replace(/-/g, " ")}` : null,
  ].filter((query): query is string => Boolean(query && query.length > 2));
  return Array.from(new Set(terms)).slice(0, 12);
}

export async function fetchProviderCandidatesForQueries(
  queries: string[],
  options: {
    limitPerQuery?: number;
    fetchImpl?: typeof fetch;
  } = {},
) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const limitPerQuery = Math.max(1, Math.min(options.limitPerQuery ?? DEFAULT_LIMIT_PER_QUERY, 50));
  const bySlug = new Map<string, ProviderMarketCandidate>();

  for (const query of queries) {
    const url = new URL("/markets", GAMMA_BASE_URL);
    url.searchParams.set("active", "true");
    url.searchParams.set("closed", "false");
    url.searchParams.set("archived", "false");
    url.searchParams.set("limit", String(limitPerQuery));
    url.searchParams.set("search", query);
    const response = await fetchImpl(url.toString(), { headers: { Accept: "application/json" } });
    if (!response.ok) {
      throw new Error(`Gamma candidate request failed: ${response.status} ${response.statusText}`);
    }
    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      throw new Error("Gamma candidate response was not an array.");
    }
    for (const entry of payload) {
      if (!entry || typeof entry !== "object") continue;
      const candidate = normalizeProviderCandidate(entry as GammaWire);
      if (candidate && !bySlug.has(candidate.slug)) {
        bySlug.set(candidate.slug, candidate);
      }
    }
  }

  return Array.from(bySlug.values());
}

export async function fetchProviderCandidatesForSlugs(
  slugs: string[],
  options: {
    fetchImpl?: typeof fetch;
  } = {},
) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const bySlug = new Map<string, ProviderMarketCandidate>();

  for (const slug of slugs.map(sanitizeSlug).filter(Boolean)) {
    const url = new URL("/markets", GAMMA_BASE_URL);
    url.searchParams.set("slug", slug);
    const response = await fetchImpl(url.toString(), { headers: { Accept: "application/json" } });
    if (!response.ok) {
      throw new Error(`Gamma slug preview request failed: ${response.status} ${response.statusText}`);
    }
    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      throw new Error("Gamma slug preview response was not an array.");
    }
    const exact = payload.find((entry) => entry && typeof entry === "object" && asString((entry as GammaWire).slug) === slug);
    if (!exact || typeof exact !== "object") {
      continue;
    }
    const candidate = normalizeProviderCandidate(exact as GammaWire);
    if (candidate && !bySlug.has(candidate.slug)) {
      bySlug.set(candidate.slug, candidate);
    }
  }

  return Array.from(bySlug.values());
}

export async function fetchProviderCandidatesFromSportsEvents(
  options: {
    tagSlugs?: string[];
    eventSlugs?: string[];
    eventLimitPerTag?: number;
    fetchImpl?: typeof fetch;
  } = {},
) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const tagSlugs = options.tagSlugs ?? SPORTS_EVENT_TAG_SLUGS;
  const eventSlugs = Array.from(new Set((options.eventSlugs ?? []).map(sanitizeSlug).filter(Boolean)));
  const eventLimitPerTag = Math.max(1, Math.min(options.eventLimitPerTag ?? DEFAULT_SPORTS_EVENT_LIMIT, 50));
  const bySlug = new Map<string, ProviderMarketCandidate>();

  for (const eventSlug of eventSlugs) {
    const url = new URL("/events", GAMMA_BASE_URL);
    url.searchParams.set("slug", eventSlug);
    await collectProviderCandidatesFromSportsEventUrl({
      url,
      fetchImpl,
      bySlug,
      errorPrefix: "Gamma exact sports event request failed",
    });
  }

  for (const tagSlug of tagSlugs) {
    const url = new URL("/events", GAMMA_BASE_URL);
    url.searchParams.set("active", "true");
    url.searchParams.set("closed", "false");
    url.searchParams.set("archived", "false");
    url.searchParams.set("limit", String(eventLimitPerTag));
    url.searchParams.set("tag_slug", tagSlug);
    await collectProviderCandidatesFromSportsEventUrl({
      url,
      fetchImpl,
      bySlug,
      errorPrefix: "Gamma sports event request failed",
    });
  }

  return Array.from(bySlug.values());
}

async function collectProviderCandidatesFromSportsEventUrl(params: {
  url: URL;
  fetchImpl: typeof fetch;
  bySlug: Map<string, ProviderMarketCandidate>;
  errorPrefix: string;
}) {
  const response = await params.fetchImpl(params.url.toString(), { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`${params.errorPrefix}: ${response.status} ${response.statusText}`);
  }
  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) {
    throw new Error("Gamma sports event response was not an array.");
  }
  for (const eventEntry of payload) {
    if (!eventEntry || typeof eventEntry !== "object") continue;
    const event = eventEntry as GammaWire;
    const eventTitle = asString(event.title) ?? asString(event.name);
    const tags = parseTags(event.tags);
    const markets = Array.isArray(event.markets) ? event.markets : [];
    for (const marketEntry of markets) {
      if (!marketEntry || typeof marketEntry !== "object") continue;
      const candidate = normalizeProviderCandidate(marketEntry as GammaWire, {
        eventTitle,
        tags,
        category: asString(event.category),
      });
      if (candidate && !params.bySlug.has(candidate.slug)) {
        params.bySlug.set(candidate.slug, candidate);
      }
    }
  }
}

export function rankProviderCandidates(
  market: CompactMarketForCandidates,
  candidates: ProviderMarketCandidate[],
) {
  return candidates
    .map((candidate) => {
      const score = scoreProviderCandidate(market, candidate);
      return {
        ...candidate,
        score,
        attachReadiness: evaluateCandidateAttachReadiness(market, candidate, score),
      };
    })
    .sort((left, right) => {
      const attachReadyRank = Number(right.attachReadiness.attachReady) - Number(left.attachReadiness.attachReady);
      if (attachReadyRank !== 0) return attachReadyRank;
      const relevanceRank = Number(right.attachReadiness.relevance.relevant) - Number(left.attachReadiness.relevance.relevant);
      if (relevanceRank !== 0) return relevanceRank;
      return right.score - left.score;
    });
}

function normalizeProviderCandidate(
  input: GammaWire,
  context: { eventTitle?: string | null; tags?: string[]; category?: string | null } = {},
) {
  const slug = asString(input.slug);
  const question = asString(input.question) ?? asString(input.title) ?? asString(input.name);
  const externalMarketId = asString(input.id) ?? asString(input.marketId) ?? asString(input.questionID);
  if (!slug || !question || !externalMarketId) return null;
  const bestBid = asNumber(input.bestBid);
  const bestAsk = asNumber(input.bestAsk);
  const spread = asNumber(input.spread) ?? computeSpread(bestBid, bestAsk);
  const outcomes = parseStringArray(input.outcomes);
  const tokenIds = parseStringArray(input.clobTokenIds);
  const outcomePrices = parseNumberArray(input.outcomePrices);
  return {
    slug,
    question,
    externalMarketId,
    conditionId: asString(input.conditionId),
    eventTitle: parseEventTitle(input) ?? context.eventTitle ?? null,
    active: asBoolean(input.active),
    closed: asBoolean(input.closed),
    archived: asBoolean(input.archived),
    acceptingOrders: asBoolean(input.acceptingOrders),
    bestBid,
    bestAsk,
    spread,
    lastTradePrice: asNumber(input.lastTradePrice),
    volume: asNumber(input.volume ?? input.volumeNum),
    volume24hr: asNumber(input.volume24hr ?? input.volume24Hour ?? input.volume24h),
    liquidity: asNumber(input.liquidity ?? input.liquidityNum),
    outcomes: outcomes.map((name, index) => ({
      name,
      tokenId: tokenIds[index] ?? null,
      outcomePrice: outcomePrices[index] ?? null,
      displayOrder: index,
    })),
    tags: Array.from(new Set([...parseTags(input.tags), ...(context.tags ?? [])])),
    category: asString(input.category) ?? context.category ?? null,
    score: 0,
    attachReadiness: {
      attachReady: false,
      reasons: ["not_ranked"],
    },
  };
}

function mergeProviderCandidates(candidates: ProviderMarketCandidate[]) {
  const bySlug = new Map<string, ProviderMarketCandidate>();
  for (const candidate of candidates) {
    if (!bySlug.has(candidate.slug)) {
      bySlug.set(candidate.slug, candidate);
    }
  }
  return Array.from(bySlug.values());
}


function scoreProviderCandidate(market: CompactMarketForCandidates, candidate: NonNullable<ProviderMarketCandidate>) {
  const marketText = normalizeText(`${market.eventTitle ?? ""} ${market.title} ${market.marketType} ${market.period ?? ""} ${market.line?.toString() ?? ""}`);
  const candidateText = normalizeText(`${candidate.question} ${candidate.eventTitle ?? ""} ${candidate.category ?? ""} ${candidate.tags.join(" ")}`);
  const marketTokens = new Set(marketText.split(" ").filter((token) => token.length > 2));
  const overlap = candidateText.split(" ").filter((token) => marketTokens.has(token)).length;
  const outcomeMatch = Math.min(candidate.outcomes.length, market.outcomes.length) * 6;
  const completeIdentity = candidate.conditionId && candidate.outcomes.every((outcome) => outcome.tokenId) ? 30 : 0;
  const quality =
    candidate.acceptingOrders && candidate.bestBid != null && candidate.bestAsk != null
      ? 15
      : candidate.bestBid != null || candidate.bestAsk != null
        ? 6
        : 0;
  const spreadBonus = candidate.spread != null ? Math.max(0, 10 - candidate.spread * 100) : 0;
  return overlap * 8 + outcomeMatch + completeIdentity + quality + spreadBonus + Math.min(candidate.volume24hr ?? 0, 1000) / 100;
}

function evaluateCandidateAttachReadiness(
  market: CompactMarketForCandidates,
  candidate: NonNullable<ProviderMarketCandidate>,
  candidateScore = candidate.score,
) {
  const reasons: string[] = [];
  if (!candidate.conditionId) reasons.push("missing_condition_id");
  if (!candidate.externalMarketId) reasons.push("missing_external_market_id");
  if (!candidate.slug) reasons.push("missing_external_slug");
  if (candidate.outcomes.length !== market.outcomes.length) reasons.push("outcome_count_mismatch");
  if (candidate.outcomes.some((outcome) => !outcome.tokenId)) reasons.push("missing_reference_token_id");
  const expectedFamily = expectedProviderMarketFamily(market);
  const candidateFamily = classifyProviderMarketFamily(candidate);
  if (expectedFamily !== "other" && candidateFamily !== expectedFamily) {
    reasons.push("provider_family_mismatch");
  }
  const relevance = assessCandidateRelevance(market, candidate, candidateScore);
  if (!relevance.relevant) {
    reasons.push("insufficient_market_relevance");
  }
  return {
    attachReady: reasons.length === 0,
    reasons,
    expectedFamily,
    candidateFamily,
    relevance,
  };
}

function buildAttachProposal(
  market: CompactMarketForCandidates,
  candidate: NonNullable<ProviderMarketCandidate>,
) {
  const attachReadiness = candidate.attachReadiness.reasons.includes("not_ranked")
    ? evaluateCandidateAttachReadiness(market, candidate)
    : candidate.attachReadiness;
  return {
    attachReady: attachReadiness.attachReady,
    reasons: attachReadiness.reasons,
    mapping: attachReadiness.attachReady
      ? {
          marketId: market.id,
          referenceSource: "polymarket",
          externalSlug: candidate.slug,
          externalMarketId: candidate.externalMarketId,
          conditionId: candidate.conditionId ?? "",
          outcomes: market.outcomes.map((outcome, index) => ({
            outcomeId: outcome.id,
            referenceTokenId: candidate.outcomes[index]?.tokenId ?? "",
            referenceOutcomeLabel: candidate.outcomes[index]?.name ?? outcome.referenceOutcomeLabel ?? outcome.name,
          })),
        }
      : null,
  };
}

function assessCandidateRelevance(
  market: CompactMarketForCandidates,
  candidate: NonNullable<ProviderMarketCandidate>,
  candidateScore: number,
) {
  const candidateText = normalizeText(
    `${candidate.question} ${candidate.eventTitle ?? ""} ${candidate.category ?? ""} ${candidate.tags.join(" ")} ${candidate.slug}`,
  );
  const candidateTokens = new Set(candidateText.split(" ").filter(Boolean));
  const marketTokens = relevantMarketTokens(market);
  const matchedImportantTokens = marketTokens.filter((token) => candidateTokens.has(token));
  const outcomeNameMatches = countOutcomeNameMatches(market, candidate, candidateText);
  const requiredOutcomeMatches = market.outcomes.length >= 3 ? 2 : 1;
  const expectedFamily = expectedProviderMarketFamily(market);
  const candidateFamily = classifyProviderMarketFamily(candidate);
  const strictBinaryMatchWinner =
    expectedFamily === "match_winner" &&
    candidateFamily === "match_winner" &&
    market.outcomes.length === 2 &&
    candidate.outcomes.length === 2;
  const lineFamilyRelevant =
    expectedFamily !== "other" &&
    expectedFamily !== "match_winner" &&
    candidateFamily === expectedFamily &&
    matchedImportantTokens.length >= Math.min(2, marketTokens.length) &&
    candidateScore >= 30;
  const binaryQuestionSubjectRelevant = isBinaryQuestionSubjectRelevant(market, candidate);
  const binaryQuestionRelevant =
    (strictBinaryMatchWinner || (isGenericBinaryMarket(market) && isGenericBinaryCandidate(candidate))) &&
    binaryQuestionSubjectRelevant &&
    matchedImportantTokens.length >= Math.min(3, marketTokens.length) &&
    candidateScore >= 30;
  const relevant =
    lineFamilyRelevant ||
    binaryQuestionRelevant ||
    (!strictBinaryMatchWinner &&
      matchedImportantTokens.length >= MIN_RELEVANT_TOKEN_MATCHES &&
      outcomeNameMatches >= requiredOutcomeMatches &&
      candidateScore >= 30
    );

  return {
    relevant,
    lineFamilyRelevant,
    binaryQuestionRelevant,
    binaryQuestionSubjectRelevant,
    expectedFamily,
    candidateFamily,
    matchedImportantTokens,
    importantTokenCount: marketTokens.length,
    outcomeNameMatches,
    requiredOutcomeMatches,
    score: Number(candidateScore.toFixed(2)),
  };
}

function isBinaryQuestionSubjectRelevant(
  market: CompactMarketForCandidates,
  candidate: NonNullable<ProviderMarketCandidate>,
) {
  const marketQuestionTokens = normalizeText(market.title)
    .split(" ")
    .filter((token) => token.length > 2 && !GENERIC_RELEVANCE_TOKENS.has(token) && !/^\d+$/.test(token));
  const candidateQuestionTokens = new Set(normalizeText(candidate.question).split(" ").filter(Boolean));
  if (marketQuestionTokens.length === 0) return false;
  const required = marketQuestionTokens.filter((token) => token !== "end");
  if (required.length === 0 || !required.every((token) => candidateQuestionTokens.has(token))) {
    return false;
  }

  const eventContextTokens = matchEventContextTokens(market);
  if (eventContextTokens.length === 0) {
    return true;
  }
  const candidateContextTokens = new Set(
    normalizeText(`${candidate.question} ${candidate.eventTitle ?? ""} ${candidate.slug}`).split(" ").filter(Boolean),
  );
  return eventContextTokens.every((token) => candidateContextTokens.has(token));
}

function isGenericBinaryMarket(market: CompactMarketForCandidates) {
  if (market.outcomes.length !== 2) return false;
  const labels = market.outcomes.map((outcome) => normalizeText(outcome.name)).sort();
  return labels[0] === "no" && labels[1] === "yes";
}

function isGenericBinaryCandidate(candidate: NonNullable<ProviderMarketCandidate>) {
  if (candidate.outcomes.length !== 2) return false;
  const labels = candidate.outcomes.map((outcome) => normalizeText(outcome.name)).sort();
  return labels[0] === "no" && labels[1] === "yes";
}

function relevantMarketTokens(market: CompactMarketForCandidates) {
  const text = normalizeText(`${market.eventTitle ?? ""} ${market.title} ${market.outcomes.map((outcome) => outcome.name).join(" ")}`);
  return Array.from(new Set(text.split(" ").filter((token) =>
    token.length > 2 && !GENERIC_RELEVANCE_TOKENS.has(token) && !/^\d+$/.test(token)
  )));
}

function matchEventContextTokens(market: CompactMarketForCandidates) {
  const text = normalizeText(market.eventTitle ?? "");
  if (!/\bvs\b/.test(text)) return [];
  return text
    .split(" ")
    .filter((token) => token.length > 2 && !GENERIC_RELEVANCE_TOKENS.has(token) && !/^\d+$/.test(token) && token !== "vs");
}

function countOutcomeNameMatches(
  market: CompactMarketForCandidates,
  candidate: NonNullable<ProviderMarketCandidate>,
  candidateText: string,
) {
  const candidateOutcomeText = normalizeText(candidate.outcomes.map((outcome) => outcome.name).join(" "));
  const fullCandidateText = `${candidateText} ${candidateOutcomeText}`;
  return market.outcomes.filter((outcome) => {
    if (GENERIC_RELEVANCE_TOKENS.has(normalizeText(outcome.name))) return false;
    const outcomeTokens = normalizeText(outcome.name)
      .split(" ")
      .filter((token) => token.length > 2 && !GENERIC_RELEVANCE_TOKENS.has(token));
    return outcomeTokens.length > 0 && outcomeTokens.every((token) => fullCandidateText.includes(token));
  }).length;
}

async function loadCompactLiveEvent(eventSlug: string) {
  const event = await prisma.event.findFirst({
    where: { slug: eventSlug },
    include: {
      markets: {
        where: { status: "LIVE", visibility: "PUBLIC", mechanism: "ORDERBOOK" },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        include: {
          outcomes: {
            where: { isActive: true },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });

  if (!event) {
    throw new Error(`No live event found for ${eventSlug}.`);
  }

  return {
    event: {
      title: event.title,
      externalSlug: event.externalSlug,
      externalEventId: event.externalEventId,
      source: event.source,
      metadata: event.metadata,
    },
    markets: selectCompactLiveMarkets(event.markets).map((market) => ({
      ...market,
      eventTitle: event.title,
    })),
  };
}

function providerSlugHintsFromMetadata(metadata: Prisma.JsonValue | null | undefined) {
  const hints: string[] = [];
  collectProviderSlugHints(metadata, hints, 0);
  return hints;
}

function collectProviderSlugHints(value: Prisma.JsonValue | null | undefined, hints: string[], depth: number) {
  if (depth > 4 || value == null) return;
  if (typeof value === "string") {
    const slug = sanitizeSlug(value);
    if (slug) hints.push(slug);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectProviderSlugHints(item, hints, depth + 1);
    return;
  }
  if (typeof value !== "object") return;
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string" && /polymarket|provider.*event|event.*slug|external.*slug|source.*url|url/i.test(key)) {
      const slug = sanitizeSlug(entry);
      if (slug) hints.push(slug);
    } else if (/polymarket|provider|external|source|event/i.test(key)) {
      collectProviderSlugHints(entry, hints, depth + 1);
    }
  }
}

function looksLikePolymarketEventSlug(slug: string, source?: string | null) {
  if (source === "polymarket") return true;
  if (/^fifwc-[a-z0-9-]+-\d{4}-\d{2}-\d{2}$/i.test(slug)) return true;
  if (/world-cup/i.test(slug) && /\d{4}-\d{2}-\d{2}/.test(slug)) return true;
  return false;
}

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeProviderSearchPhrase(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9\s.+-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function marketTypeSearchAlias(marketType: string) {
  if (marketType === "match_winner_1x2") return "match winner";
  if (marketType === "total_goals") return "over under";
  if (marketType === "team_total_goals") return "team total";
  if (marketType === "spread") return "spread";
  if (marketType === "draw_no_bet") return "draw no bet";
  return marketType.replace(/_/g, " ");
}

function buildProviderEventSearchPhrases(market: CompactMarketForCandidates) {
  const normalizedTitle = normalizeText(`${market.eventTitle ?? ""} ${market.title}`);
  const family = expectedProviderMarketFamily(market);
  const lineFragments = inferLineSlugFragments(market.title);
  const providerTeams = Object.keys(PROVIDER_MARKET_SLUG_CODE_BY_NAME).filter((name) => normalizedTitle.includes(name));
  const outcomeTeams = market.outcomes.map((outcome) => outcome.name);
  const teams = Array.from(new Set((providerTeams.length >= 2 ? providerTeams : [...providerTeams, ...outcomeTeams])
    .map((name) => normalizeProviderSearchPhrase(name))
    .filter((name) => name.length > 2 && !GENERIC_RELEVANCE_TOKENS.has(normalizeText(name)))));
  if (teams.length < 2) return [];
  const pair = `${teams[0]} ${teams[teams.length - 1]}`;
  const familyPhrases = [
    ...(family === "spread" ? [
      `${pair} spread`,
      `${pair} handicap`,
      `${pair} asian handicap`,
      `world cup ${pair} spread`,
      `world cup ${pair} handicap`,
      ...lineFragments.flatMap((fragment) => [
        `${pair} spread ${fragment}`,
        `${pair} handicap ${fragment}`,
      ]),
    ] : []),
    ...(family === "total_goals" ? [
      `${pair} total goals`,
      `${pair} over under`,
      ...lineFragments.flatMap((fragment) => [
        `${pair} total goals ${fragment}`,
      ]),
      `world cup ${pair} total goals`,
      `world cup ${pair} over under`,
      `${pair} goals over under`,
      ...lineFragments.flatMap((fragment) => [
        `${pair} over ${fragment}`,
        `${pair} under ${fragment}`,
      ]),
    ] : []),
    ...(family === "team_total_goals" ? [
      `${pair} team total`,
      `${pair} team goals`,
      `world cup ${pair} team total`,
      `world cup ${pair} team goals`,
      ...lineFragments.flatMap((fragment) => [
        `${pair} team total ${fragment}`,
        `${pair} team goals ${fragment}`,
      ]),
    ] : []),
  ];
  return [
    pair,
    ...familyPhrases,
    `${pair} soccer`,
    `${pair} world cup`,
    `${pair} ${marketTypeSearchAlias(market.marketType)}`,
    `world cup ${pair} ${marketTypeSearchAlias(market.marketType)}`,
    `fifa world cup ${pair} ${marketTypeSearchAlias(market.marketType)}`,
  ];
}

function inferMatchWinnerSlugSuffix(market: Pick<CompactMarketForCandidates, "title" | "outcomes">) {
  const text = normalizeText(`${market.title} ${market.outcomes.map((outcome) => outcome.name).join(" ")}`);
  if (/\bdraw\b|end in a draw/.test(text)) return "draw";
  for (const [name, code] of Object.entries(PROVIDER_MARKET_SLUG_CODE_BY_NAME)) {
    if (new RegExp(`\\b${escapeRegExp(name)}\\b`).test(text)) {
      return code;
    }
  }
  return null;
}

function inferTeamCodes(market: Pick<CompactMarketForCandidates, "title" | "outcomes">) {
  const text = normalizeText(`${market.title} ${market.outcomes.map((outcome) => outcome.name).join(" ")}`);
  const codes = new Set<string>();
  for (const [name, code] of Object.entries(PROVIDER_MARKET_SLUG_CODE_BY_NAME)) {
    if (new RegExp(`\\b${escapeRegExp(name)}\\b`).test(text)) {
      codes.add(code);
    }
  }
  return Array.from(codes);
}

function inferLineSlugFragments(title: string) {
  const fragments = new Set<string>();
  const matches = title.match(/[+-]?\d+(?:\.\d+)?/g) ?? [];
  for (const match of matches) {
    const unsigned = match.replace(/^[+-]/, "");
    if (!unsigned) continue;
    fragments.add(unsigned.replace(".", "-"));
    fragments.add(unsigned.replace(".", ""));
  }
  return Array.from(fragments);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeSlug(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  if (!trimmed.includes("://")) return trimmed;
  try {
    const url = new URL(trimmed);
    return url.pathname.split("/").filter(Boolean).pop() ?? "";
  } catch {
    return "";
  }
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof value === "string") {
    try {
      return parseStringArray(JSON.parse(value) as unknown);
    } catch {
      return value.split(",").map((part) => part.trim()).filter(Boolean);
    }
  }
  return [];
}

function parseNumberArray(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map((item) => asNumber(item)).filter((item): item is number => item != null);
  }
  if (typeof value === "string") {
    try {
      return parseNumberArray(JSON.parse(value) as unknown);
    } catch {
      return value.split(",").map((part) => asNumber(part.trim())).filter((item): item is number => item != null);
    }
  }
  return [];
}

function parseTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        return asString((item as GammaWire).slug) ?? asString((item as GammaWire).label) ?? asString((item as GammaWire).name);
      }
      return null;
    })
    .filter((item): item is string => Boolean(item));
}

function parseEventTitle(input: GammaWire) {
  const events = input.events;
  if (Array.isArray(events)) {
    for (const event of events) {
      if (event && typeof event === "object") {
        const title = asString((event as GammaWire).title) ?? asString((event as GammaWire).name);
        if (title) return title;
      }
    }
  }
  const series = input.series;
  if (series && typeof series === "object") {
    return asString((series as GammaWire).title) ?? asString((series as GammaWire).name);
  }
  return null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asBoolean(value: unknown) {
  return value === true || value === "true";
}

function computeSpread(bestBid: number | null, bestAsk: number | null) {
  if (bestBid == null || bestAsk == null) return null;
  return Number((bestAsk - bestBid).toFixed(6));
}
