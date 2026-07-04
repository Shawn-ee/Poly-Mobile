import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const CLOB_BASE_URL = "https://clob.polymarket.com";
const DEFAULT_INTERVAL = "1d";
const DEFAULT_FIDELITY_MINUTES = 5;

type PricesHistoryWire = {
  history?: unknown;
};

type PricesHistoryPointWire = {
  t?: unknown;
  p?: unknown;
};

export type RefreshPolymarketPriceHistoryOptions = {
  marketIds: string[];
  interval?: "1h" | "6h" | "1d" | "1w" | "1m" | "max" | "all";
  fidelityMinutes?: number;
  fetchImpl?: typeof fetch;
};

export async function refreshPolymarketPriceHistorySnapshots(options: RefreshPolymarketPriceHistoryOptions) {
  const interval = options.interval ?? DEFAULT_INTERVAL;
  const fidelityMinutes = Math.max(1, Math.min(options.fidelityMinutes ?? DEFAULT_FIDELITY_MINUTES, 24 * 60));
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
    let marketRowsCreated = 0;
    const outcomeReports = [];
    for (const outcome of market.outcomes) {
      if (!outcome.referenceTokenId) {
        skipped.push({ marketId: market.id, outcomeId: outcome.id, reason: "missing_reference_token_id" });
        continue;
      }

      const history = await fetchClobPricesHistory({
        tokenId: outcome.referenceTokenId,
        interval,
        fidelityMinutes,
        fetchImpl,
      }).catch((error) => ({
        error: error instanceof Error ? error.message : String(error),
      }));
      if ("error" in history) {
        skipped.push({
          marketId: market.id,
          outcomeId: outcome.id,
          tokenId: outcome.referenceTokenId,
          reason: history.error,
        });
        continue;
      }

      if (history.points.length === 0) {
        skipped.push({
          marketId: market.id,
          outcomeId: outcome.id,
          tokenId: outcome.referenceTokenId,
          reason: "empty_prices_history",
        });
        outcomeReports.push({
          outcomeId: outcome.id,
          tokenId: outcome.referenceTokenId,
          historyPointCount: 0,
          createdSnapshots: 0,
          firstTimestamp: null,
          lastTimestamp: null,
        });
        continue;
      }

      const firstTimestamp = history.points[0].timestamp;
      const lastTimestamp = history.points.at(-1)?.timestamp ?? firstTimestamp;
      await prisma.marketOutcomeSnapshot.deleteMany({
        where: {
          marketId: market.id,
          outcomeId: outcome.id,
          ts: { gte: firstTimestamp, lte: lastTimestamp },
        },
      });
      const created = await prisma.marketOutcomeSnapshot.createMany({
        data: history.points.map((point) => ({
          marketId: market.id,
          outcomeId: outcome.id,
          ts: point.timestamp,
          price: new Prisma.Decimal(point.price),
        })),
      });
      marketRowsCreated += created.count;
      outcomeReports.push({
        outcomeId: outcome.id,
        tokenId: outcome.referenceTokenId,
        historyPointCount: history.points.length,
        createdSnapshots: created.count,
        firstTimestamp: firstTimestamp.toISOString(),
        lastTimestamp: lastTimestamp.toISOString(),
      });
    }

    refreshed.push({
      marketId: market.id,
      title: market.title,
      slug: market.externalSlug,
      outcomeCount: market.outcomes.length,
      snapshotsCreated: marketRowsCreated,
      outcomes: outcomeReports,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    source: "polymarket-clob-prices-history",
    interval,
    fidelityMinutes,
    requestedMarketCount: options.marketIds.length,
    refreshedCount: refreshed.length,
    snapshotsCreated: refreshed.reduce((sum, market) => sum + (typeof market.snapshotsCreated === "number" ? market.snapshotsCreated : 0), 0),
    skippedCount: skipped.length,
    refreshed,
    skipped,
  };
}

async function fetchClobPricesHistory(params: {
  tokenId: string;
  interval: string;
  fidelityMinutes: number;
  fetchImpl: typeof fetch;
}) {
  const url = new URL("/prices-history", CLOB_BASE_URL);
  url.searchParams.set("market", params.tokenId);
  url.searchParams.set("interval", params.interval);
  url.searchParams.set("fidelity", String(params.fidelityMinutes));
  const response = await params.fetchImpl(url.toString(), { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`CLOB prices-history request failed: ${response.status} ${response.statusText}`);
  }
  const payload = (await response.json()) as PricesHistoryWire;
  return { points: parseHistoryPoints(payload.history) };
}

function parseHistoryPoints(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): Array<{ timestamp: Date; price: number }> => {
    if (!entry || typeof entry !== "object") return [];
    const timestamp = parseTimestamp((entry as PricesHistoryPointWire).t);
    const price = asNumber((entry as PricesHistoryPointWire).p);
    if (!timestamp || price == null || price <= 0 || price >= 1) return [];
    return [{ timestamp, price }];
  }).sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime());
}

function parseTimestamp(value: unknown) {
  const numeric = asNumber(value);
  if (numeric == null || numeric <= 0) return null;
  const millis = numeric > 10_000_000_000 ? numeric : numeric * 1000;
  const parsed = new Date(millis);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
