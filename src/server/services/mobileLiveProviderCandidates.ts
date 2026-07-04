import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { selectCompactLiveMarkets } from "@/server/services/mobileLiveEventDetail";

const GAMMA_BASE_URL = "https://gamma-api.polymarket.com";
const DEFAULT_LIMIT_PER_QUERY = 20;
const MAX_MARKETS = 14;

type GammaWire = Record<string, unknown>;

type CompactMarketForCandidates = {
  id: string;
  title: string;
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
  fetchImpl?: typeof fetch;
};

export type ProviderMarketCandidate = NonNullable<ReturnType<typeof normalizeProviderCandidate>>;

export async function discoverMobileLiveProviderCandidates(options: ProviderCandidateDiscoveryOptions) {
  const compactMarkets = await loadCompactLiveMarkets(options.eventSlug);
  const selectedMarkets = options.marketId
    ? compactMarkets.filter((market) => market.id === options.marketId)
    : compactMarkets.slice(0, MAX_MARKETS);

  if (options.marketId && selectedMarkets.length === 0) {
    throw new Error(`Market ${options.marketId} is not in compact live event ${options.eventSlug}.`);
  }

  const fetchProvider = options.fetchProvider !== false;
  const maxCandidatesPerMarket = Math.max(1, Math.min(options.maxCandidatesPerMarket ?? 5, 10));
  const providerTargets = [];

  for (const market of selectedMarkets) {
    const queries = buildProviderCandidateSearchQueries(market);
    let providerError: string | null = null;
    let candidates: ProviderMarketCandidate[] = [];

    if (fetchProvider) {
      try {
        const raw = await fetchProviderCandidatesForQueries(queries, {
          limitPerQuery: DEFAULT_LIMIT_PER_QUERY,
          fetchImpl: options.fetchImpl ?? fetch,
        });
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
      providerFetchAttempted: fetchProvider,
      providerError,
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
    targetMarketCount: providerTargets.length,
    attachReadyCandidateCount: providerTargets.filter((target) => target.attachProposal?.attachReady).length,
    providerErrorCount: providerTargets.filter((target) => target.providerError).length,
    nextRequiredAction:
      providerTargets.some((target) => target.attachProposal?.attachReady)
        ? "review_and_attach_provider_identity_candidates"
        : fetchProvider
          ? "expand_provider_search_or_use_manual_polymarket_slugs"
          : "run_provider_candidate_discovery_with_fetch_enabled",
    targets: providerTargets,
  };
}

export function buildProviderCandidateSearchQueries(market: CompactMarketForCandidates) {
  const title = market.title.replace(/[:]/g, " ").replace(/\s+/g, " ").trim();
  const withoutLine = title.replace(/[+-]?\d+(\.\d+)?/g, " ").replace(/\s+/g, " ").trim();
  const terms = [
    title,
    withoutLine,
    `${withoutLine} ${market.marketType.replace(/_/g, " ")}`,
    market.marketGroupTitle ? `${withoutLine} ${market.marketGroupTitle}` : null,
    market.period ? `${withoutLine} ${market.period.replace(/-/g, " ")}` : null,
  ].filter((query): query is string => Boolean(query && query.length > 2));
  return Array.from(new Set(terms)).slice(0, 5);
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

export function rankProviderCandidates(
  market: CompactMarketForCandidates,
  candidates: ProviderMarketCandidate[],
) {
  return candidates
    .map((candidate) => ({
      ...candidate,
      score: scoreProviderCandidate(market, candidate),
      attachReadiness: evaluateCandidateAttachReadiness(market, candidate),
    }))
    .sort((left, right) => right.score - left.score);
}

function normalizeProviderCandidate(input: GammaWire) {
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
    eventTitle: parseEventTitle(input),
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
    tags: parseTags(input.tags),
    category: asString(input.category),
    score: 0,
    attachReadiness: {
      attachReady: false,
      reasons: ["not_ranked"],
    },
  };
}

function scoreProviderCandidate(market: CompactMarketForCandidates, candidate: NonNullable<ProviderMarketCandidate>) {
  const marketText = normalizeText(`${market.title} ${market.marketType} ${market.period ?? ""} ${market.line?.toString() ?? ""}`);
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
) {
  const reasons: string[] = [];
  if (!candidate.conditionId) reasons.push("missing_condition_id");
  if (!candidate.externalMarketId) reasons.push("missing_external_market_id");
  if (!candidate.slug) reasons.push("missing_external_slug");
  if (candidate.outcomes.length !== market.outcomes.length) reasons.push("outcome_count_mismatch");
  if (candidate.outcomes.some((outcome) => !outcome.tokenId)) reasons.push("missing_reference_token_id");
  return {
    attachReady: reasons.length === 0,
    reasons,
  };
}

function buildAttachProposal(
  market: CompactMarketForCandidates,
  candidate: NonNullable<ProviderMarketCandidate>,
) {
  const attachReadiness = evaluateCandidateAttachReadiness(market, candidate);
  return {
    attachReady: attachReadiness.attachReady,
    reasons: attachReadiness.reasons,
    mapping: attachReadiness.attachReady
      ? {
          marketId: market.id,
          referenceSource: "polymarket",
          externalSlug: candidate.slug,
          externalMarketId: candidate.externalMarketId,
          conditionId: candidate.conditionId,
          outcomes: market.outcomes.map((outcome, index) => ({
            outcomeId: outcome.id,
            referenceTokenId: candidate.outcomes[index]?.tokenId ?? "",
            referenceOutcomeLabel: candidate.outcomes[index]?.name ?? outcome.referenceOutcomeLabel ?? outcome.name,
          })),
        }
      : null,
  };
}

async function loadCompactLiveMarkets(eventSlug: string) {
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

  return selectCompactLiveMarkets(event.markets);
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
        return asString((item as GammaWire).label) ?? asString((item as GammaWire).name);
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
