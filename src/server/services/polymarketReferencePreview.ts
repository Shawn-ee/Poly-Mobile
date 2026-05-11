import { Prisma } from "@prisma/client";
import { PolymarketImportRequest } from "@/server/services/polymarketReferenceImport";

const GAMMA_BASE_URL = "https://gamma-api.polymarket.com";

type GammaWire = Record<string, unknown>;

export type PolymarketMarketPreview = {
  slug: string;
  question: string;
  externalMarketId: string;
  conditionId: string | null;
  description: string | null;
  category: string | null;
  active: boolean;
  closed: boolean;
  archived: boolean;
  acceptingOrders: boolean;
  endDate: string | null;
  volume: number | null;
  volume24hr: number | null;
  liquidity: number | null;
  liquidityClob: number | null;
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
  lastTradePrice: number | null;
  outcomePrices: number[];
  event: {
    title: string;
    slug: string | null;
    description: string | null;
    category: string | null;
    status: string | null;
    source: "polymarket";
    externalEventId: string | null;
    externalSlug: string | null;
    image: string | null;
    icon: string | null;
    metadata: unknown;
  } | null;
  outcomes: Array<{
    name: string;
    tokenId: string | null;
    outcomePrice: number | null;
    displayOrder: number;
  }>;
  rawSummary: {
    image: string | null;
    icon: string | null;
    resolutionSource: string | null;
    tags: string[];
    competitive: boolean | null;
  };
  qualityWarning: string | null;
  marketType: "binary" | "multi-outcome";
};

export async function fetchPolymarketMarketPreview(
  slugOrUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PolymarketMarketPreview> {
  const slug = extractPolymarketSlug(slugOrUrl);
  if (!slug) {
    throw new Error("Invalid Polymarket slug or URL.");
  }

  const wire = await fetchGammaMarketBySlug(slug, fetchImpl);
  if (!wire) {
    throw new Error(`Polymarket market not found for slug: ${slug}`);
  }

  return normalizeGammaPreview(wire);
}

export function buildPolymarketImportRequestFromPreview(
  preview: PolymarketMarketPreview,
  options: {
    createEvents?: boolean;
    notes?: string | null;
  } = {},
): PolymarketImportRequest {
  return {
    createEvents: options.createEvents !== false,
    event: preview.event
      ? {
          title: preview.event.title,
          slug: preview.event.slug,
          description: preview.event.description,
          category: preview.event.category,
          status: preview.event.status,
          source: preview.event.source,
          externalEventId: preview.event.externalEventId,
          externalSlug: preview.event.externalSlug,
          image: preview.event.image,
          icon: preview.event.icon,
          metadata: preview.event.metadata as Prisma.InputJsonValue,
        }
      : null,
    market: {
      title: preview.question,
      description: preview.description,
      category: preview.category,
      resolveTime: preview.endDate,
      type: preview.outcomes.length > 2 ? "MULTI_WINNER" : "BINARY",
      desiredStatus: "draft",
      externalMarketId: preview.externalMarketId,
      conditionId: preview.conditionId,
      externalSlug: preview.slug,
      referenceSource: "polymarket",
      referenceMetadata: {
        volume: preview.volume,
        volume24hr: preview.volume24hr,
        liquidity: preview.liquidity,
        liquidityClob: preview.liquidityClob,
        bestBid: preview.bestBid,
        bestAsk: preview.bestAsk,
        spread: preview.spread,
        lastTradePrice: preview.lastTradePrice,
        acceptingOrders: preview.acceptingOrders,
        outcomePrices: preview.outcomePrices,
        image: preview.rawSummary.image,
        icon: preview.rawSummary.icon,
        selectedRawFields: {
          active: preview.active,
          closed: preview.closed,
          archived: preview.archived,
          resolutionSource: preview.rawSummary.resolutionSource,
          tags: preview.rawSummary.tags,
          competitive: preview.rawSummary.competitive,
          qualityWarning: preview.qualityWarning,
        },
        importedFrom: "polymarket",
        importStatus: "pending_review",
        referenceOnly: true,
        tradable: false,
        mmEnabled: false,
        reviewedAt: null,
        reviewedBy: null,
        reviewNotes: options.notes?.trim() || null,
      },
      outcomes: preview.outcomes.map((outcome) => ({
        name: outcome.name,
        displayOrder: outcome.displayOrder,
        isTradable: false,
        referenceTokenId: outcome.tokenId,
        referenceOutcomeLabel: outcome.name,
        referenceMetadata: {
          outcomePrice: outcome.outcomePrice,
          tokenId: outcome.tokenId,
        },
      })),
    },
  };
}

export function extractPolymarketSlug(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  if (!trimmed.includes("://")) {
    return sanitizeSlug(trimmed);
  }

  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split("/").filter(Boolean);
    return sanitizeSlug(segments[segments.length - 1] ?? "");
  } catch {
    return null;
  }
}

async function fetchGammaMarketBySlug(
  slug: string,
  fetchImpl: typeof fetch,
): Promise<GammaWire | null> {
  const directUrl = new URL("/markets", GAMMA_BASE_URL);
  directUrl.searchParams.set("slug", slug);
  let response = await fetchImpl(directUrl.toString(), {
    headers: { Accept: "application/json" },
  });
  if (response.ok) {
    const parsed = (await response.json()) as unknown;
    if (Array.isArray(parsed)) {
      const exact = parsed.find(
        (item) => item && typeof item === "object" && asString((item as GammaWire).slug) === slug,
      );
      if (exact && typeof exact === "object") {
        return exact as GammaWire;
      }
    }
  }

  const searchUrl = new URL("/markets", GAMMA_BASE_URL);
  searchUrl.searchParams.set("search", slug);
  searchUrl.searchParams.set("limit", "50");
  response = await fetchImpl(searchUrl.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Gamma API request failed: ${response.status} ${response.statusText}`);
  }

  const parsed = (await response.json()) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Gamma API returned unexpected payload.");
  }
  const exact = parsed.find(
    (item) => item && typeof item === "object" && asString((item as GammaWire).slug) === slug,
  );
  return exact && typeof exact === "object" ? (exact as GammaWire) : null;
}

function normalizeGammaPreview(input: GammaWire): PolymarketMarketPreview {
  const slug = asString(input.slug);
  const question = asString(input.question) ?? asString(input.title) ?? asString(input.name);
  const externalMarketId = asString(input.id) ?? asString(input.marketId) ?? asString(input.questionID);
  if (!slug || !question || !externalMarketId) {
    throw new Error("Polymarket payload is missing required market fields.");
  }

  const tokenIds = parseStringArray(input.clobTokenIds);
  const outcomeNames = parseStringArray(input.outcomes);
  const outcomePrices = parseNumberArray(input.outcomePrices);
  const outcomes = (outcomeNames.length > 0 ? outcomeNames : tokenIds.map((_tokenId, index) => `Outcome ${index + 1}`)).map(
    (name, index) => ({
      name,
      tokenId: tokenIds[index] ?? null,
      outcomePrice: outcomePrices[index] ?? null,
      displayOrder: index,
    }),
  );

  const event = parseEvent(input);
  const bestBid = asNumber(input.bestBid);
  const bestAsk = asNumber(input.bestAsk);
  const spread = asNumber(input.spread);
  const marketType: "binary" | "multi-outcome" =
    outcomes.length === 2 && outcomes.every((outcome) => /^(yes|no)$/i.test(outcome.name))
      ? "binary"
      : "multi-outcome";

  return {
    slug,
    question,
    externalMarketId,
    conditionId: asString(input.conditionId),
    description: asString(input.description),
    category: asString(input.category),
    active: asBoolean(input.active),
    closed: asBoolean(input.closed),
    archived: asBoolean(input.archived),
    acceptingOrders: asBoolean(input.acceptingOrders),
    endDate: asIsoString(input.endDate ?? input.endDateIso ?? input.resolveBy),
    volume: asNumber(input.volume ?? input.volumeNum),
    volume24hr: asNumber(input.volume24hr ?? input.volume24Hour ?? input.volume24h),
    liquidity: asNumber(input.liquidity ?? input.liquidityNum),
    liquidityClob: asNumber(input.liquidityClob),
    bestBid,
    bestAsk,
    spread,
    lastTradePrice: asNumber(input.lastTradePrice),
    outcomePrices,
    event,
    outcomes,
    rawSummary: {
      image: asString(input.image),
      icon: asString(input.icon),
      resolutionSource: asString(input.resolutionSource),
      tags: parseTags(input.tags),
      competitive: asNullableBoolean(input.competitive),
    },
    qualityWarning: describeQualityWarning(bestBid, bestAsk, spread, outcomePrices),
    marketType,
  };
}

function parseEvent(input: GammaWire): PolymarketMarketPreview["event"] {
  const events = input.events;
  const series = input.series;
  const eventWire =
    Array.isArray(events) && events.length > 0 && events[0] && typeof events[0] === "object"
      ? (events[0] as GammaWire)
      : series && typeof series === "object"
        ? (series as GammaWire)
        : null;
  if (!eventWire) {
    return null;
  }

  const title =
    asString(eventWire.title) ??
    asString(eventWire.name) ??
    asString(eventWire.slug);
  if (!title) {
    return null;
  }

  return {
    title,
    slug: asString(eventWire.slug),
    description: asString(eventWire.description),
    category: asString(eventWire.category),
    status: asString(eventWire.status),
    source: "polymarket",
    externalEventId: asString(eventWire.id),
    externalSlug: asString(eventWire.slug),
    image: asString(eventWire.image),
    icon: asString(eventWire.icon),
    metadata: {
      event: Array.isArray(events) ? events[0] ?? null : null,
      series: series ?? null,
    },
  };
}

function describeQualityWarning(
  bestBid: number | null,
  bestAsk: number | null,
  spread: number | null,
  outcomePrices: number[],
) {
  if (
    bestBid != null &&
    bestAsk != null &&
    bestBid <= 0.0011 &&
    bestAsk >= 0.9989
  ) {
    return "Stub book detected (0.001 / 0.999 style prices).";
  }
  if (spread != null && spread > 0.12) {
    return `Wide spread detected (${spread}).`;
  }
  if (outcomePrices.length > 1 && outcomePrices.every((price) => price <= 0 || price >= 1)) {
    return "Outcome prices do not look usable for reference.";
  }
  return null;
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parseStringArray(parsed);
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
      const parsed = JSON.parse(value) as unknown;
      return parseNumberArray(parsed);
    } catch {
      return value
        .split(",")
        .map((part) => asNumber(part.trim()))
        .filter((item): item is number => item != null);
    }
  }
  return [];
}

function parseTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => {
      if (typeof entry === "string") {
        return entry;
      }
      if (entry && typeof entry === "object") {
        const wire = entry as GammaWire;
        return asString(wire.label) ?? asString(wire.name);
      }
      return null;
    })
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function sanitizeSlug(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.replace(/^\/+|\/+$/g, "") : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asBoolean(value: unknown): boolean {
  return value === true || value === "true";
}

function asNullableBoolean(value: unknown): boolean | null {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asIsoString(value: unknown): string | null {
  const text = asString(value);
  if (!text) {
    return null;
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
