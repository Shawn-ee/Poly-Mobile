import { prisma } from "@/lib/db";
import {
  ReferenceOrderbookDepthSnapshotInput,
  upsertReferenceOrderbookDepthSnapshots,
} from "@/server/services/referenceOrderbookDepthSnapshots";

const CLOB_BASE_URL = "https://clob.polymarket.com";
const DEFAULT_MAX_LEVELS = 24;

type ClobBookWire = {
  market?: unknown;
  asset_id?: unknown;
  timestamp?: unknown;
  bids?: unknown;
  asks?: unknown;
};

type BookLevelWire = {
  price?: unknown;
  size?: unknown;
};

export type RefreshPolymarketOrderbookDepthOptions = {
  marketIds: string[];
  maxLevels?: number;
  fetchImpl?: typeof fetch;
};

export async function refreshPolymarketOrderbookDepthSnapshots(options: RefreshPolymarketOrderbookDepthOptions) {
  const maxLevels = Math.max(1, Math.min(options.maxLevels ?? DEFAULT_MAX_LEVELS, 200));
  const fetchImpl = options.fetchImpl ?? fetch;
  const markets = await prisma.market.findMany({
    where: {
      id: { in: options.marketIds },
      referenceSource: "polymarket",
      externalSlug: { not: null },
      isListed: true,
    },
    include: {
      outcomes: {
        where: { isActive: true, referenceTokenId: { not: null } },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: { title: "asc" },
  });

  const refreshed: Array<Record<string, unknown>> = [];
  const skipped: Array<Record<string, unknown>> = [];

  for (const market of markets) {
    const rows: ReferenceOrderbookDepthSnapshotInput[] = [];
    const outcomeReports = [];
    for (const outcome of market.outcomes) {
      if (!outcome.referenceTokenId) {
        skipped.push({ marketId: market.id, outcomeId: outcome.id, reason: "missing_reference_token_id" });
        continue;
      }

      const book = await fetchClobBook(outcome.referenceTokenId, fetchImpl).catch((error) => ({
        error: error instanceof Error ? error.message : String(error),
      }));
      if ("error" in book) {
        skipped.push({
          marketId: market.id,
          outcomeId: outcome.id,
          tokenId: outcome.referenceTokenId,
          reason: book.error,
        });
        continue;
      }

      const fetchedAt = new Date();
      const providerTimestamp = book.timestamp?.toISOString() ?? null;
      const bidRows = book.bids.slice(0, maxLevels).map((level, index) => ({
        marketId: market.id,
        outcomeId: outcome.id,
        source: "polymarket-clob",
        externalSlug: market.externalSlug,
        externalMarketId: market.externalMarketId,
        conditionId: market.conditionId,
        tokenId: outcome.referenceTokenId,
        side: "bid" as const,
        price: level.price,
        size: level.size,
        levelIndex: index,
        fetchedAt,
      }));
      const askRows = book.asks.slice(0, maxLevels).map((level, index) => ({
        marketId: market.id,
        outcomeId: outcome.id,
        source: "polymarket-clob",
        externalSlug: market.externalSlug,
        externalMarketId: market.externalMarketId,
        conditionId: market.conditionId,
        tokenId: outcome.referenceTokenId,
        side: "ask" as const,
        price: level.price,
        size: level.size,
        levelIndex: index,
        fetchedAt,
      }));
      rows.push(...bidRows, ...askRows);
      outcomeReports.push({
        outcomeId: outcome.id,
        tokenId: outcome.referenceTokenId,
        bidCount: bidRows.length,
        askCount: askRows.length,
        fetchedAt: fetchedAt.toISOString(),
        providerTimestamp,
      });
    }

    const upserted = await upsertReferenceOrderbookDepthSnapshots(rows);
    refreshed.push({
      marketId: market.id,
      title: market.title,
      slug: market.externalSlug,
      outcomeCount: market.outcomes.length,
      depthRowsUpdated: upserted.length,
      outcomes: outcomeReports,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    source: "polymarket-clob",
    maxLevels,
    requestedMarketCount: options.marketIds.length,
    refreshedCount: refreshed.length,
    depthRowsUpdated: refreshed.reduce((sum, market) => sum + (typeof market.depthRowsUpdated === "number" ? market.depthRowsUpdated : 0), 0),
    skippedCount: skipped.length,
    refreshed,
    skipped,
  };
}

async function fetchClobBook(tokenId: string, fetchImpl: typeof fetch) {
  const url = new URL("/book", CLOB_BASE_URL);
  url.searchParams.set("token_id", tokenId);
  const response = await fetchImpl(url.toString(), { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`CLOB book request failed: ${response.status} ${response.statusText}`);
  }
  const payload = (await response.json()) as ClobBookWire;
  const bids = parseBookLevels(payload.bids);
  const asks = parseBookLevels(payload.asks);
  const timestamp = parseTimestamp(payload.timestamp);
  return { bids, asks, timestamp };
}

function parseBookLevels(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): Array<{ price: number; size: number }> => {
    if (!entry || typeof entry !== "object") return [];
    const price = asNumber((entry as BookLevelWire).price);
    const size = asNumber((entry as BookLevelWire).size);
    if (price == null || size == null || price <= 0 || price >= 1 || size <= 0) return [];
    return [{ price, size }];
  });
}

function parseTimestamp(value: unknown) {
  const raw = asString(value);
  if (!raw) return new Date();
  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric > 0) {
    const millis = numeric > 10_000_000_000 ? numeric : numeric * 1000;
    const parsed = new Date(millis);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
