import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const OPEN_STATUSES: OrderStatus[] = ["OPEN", "PARTIAL"];
const PROVIDER_SNAPSHOT_STALE_AFTER_SECONDS = 90;
const PROVIDER_SNAPSHOT_REFRESH_TTL_SECONDS = 60;
type ProviderDepthSizeSource = "liquidityClob" | "liquidity" | "volume24hr" | "volume" | null;

type LevelRow = {
  outcomeId: string;
  price: Prisma.Decimal;
  _sum: {
    remaining: Prisma.Decimal | null;
  };
};

type DiagnosticOrderRow = {
  id: string;
  outcomeId: string;
  side: "BUY" | "SELL";
  price: Prisma.Decimal;
  remaining: Prisma.Decimal;
  status: OrderStatus;
  updatedAt: Date;
};

type ProviderSnapshotRow = {
  outcomeId: string;
  source: string;
  fetchedAt: Date;
  updatedAt: Date;
  acceptingOrders: boolean;
  outcomePrice: Prisma.Decimal | null;
  bestBid: Prisma.Decimal | null;
  bestAsk: Prisma.Decimal | null;
  liquidity: Prisma.Decimal | null;
  liquidityClob: Prisma.Decimal | null;
  volume: Prisma.Decimal | null;
  volume24hr: Prisma.Decimal | null;
};

type ProviderOrderbookDepthRow = {
  outcomeId: string;
  source: string;
  side: string;
  price: Prisma.Decimal;
  size: Prisma.Decimal;
  levelIndex: number;
  fetchedAt: Date;
  updatedAt: Date;
};

export type PublicOrderbookSnapshot = {
  bids: Array<{
    outcomeId: string;
    price: number;
    size: number;
  }>;
  asks: Array<{
    outcomeId: string;
    price: number;
    size: number;
  }>;
  depthSource: "local-orderbook" | "provider-orderbook-depth" | "provider-quote-snapshot" | "empty";
  depthReason: string;
  providerOrderbookDepth: {
    source: "reference-orderbook-depth-snapshot";
    status: "ready" | "stale" | "unavailable";
    levelCount: number;
    snapshotCount: number;
    latestFetchedAt: string | null;
    latestUpdatedAt: string | null;
    stalenessSeconds: number | null;
    staleAfterSeconds: number;
    refreshTtlSeconds: number;
    nextRefreshAt: string | null;
    shouldRefresh: boolean;
    isStale: boolean;
    sources: string[];
    reason: string;
  };
  providerQuoteDepth: {
    source: "reference-quote-snapshot";
    levelCount: number;
    sizeSource: ProviderDepthSizeSource;
    isEstimatedSize: boolean;
    reason: string;
  };
  providerQuoteOutcomes: Array<{
    outcomeId: string;
    source: string;
    outcomePrice: number | null;
    bestBid: number | null;
    bestAsk: number | null;
    acceptingOrders: boolean;
    fetchedAt: string;
    updatedAt: string;
  }>;
  providerQuoteSnapshot: {
    source: "reference-quote-snapshot";
    status: "ready" | "stale" | "unavailable";
    snapshotCount: number;
    latestFetchedAt: string | null;
    latestUpdatedAt: string | null;
    stalenessSeconds: number | null;
    staleAfterSeconds: number;
    refreshTtlSeconds: number;
    nextRefreshAt: string | null;
    shouldRefresh: boolean;
    refreshKey: string | null;
    isStale: boolean;
    acceptingOrders: boolean;
    outcomeIds: string[];
    sources: string[];
    reason: string;
  };
};

export async function buildPublicOrderbookSnapshot(params: {
  marketId: string;
  outcomeId?: string | null;
  maxLevels?: number;
}) {
  const outcomeId = params.outcomeId ?? null;
  const maxLevels = params.maxLevels ?? 200;
  const whereBase = {
    marketId: params.marketId,
    status: { in: OPEN_STATUSES },
    remaining: { gt: new Prisma.Decimal(0) },
    ...(outcomeId ? { outcomeId } : {}),
  };

  return prisma.$transaction(async (tx) => {
    const [bids, asks, topOrders, providerSnapshots, providerDepthRows] = await Promise.all([
      tx.order.groupBy({
        by: ["outcomeId", "price"],
        where: { ...whereBase, side: "BUY" },
        _sum: { remaining: true },
        orderBy: [{ price: "desc" }],
        take: maxLevels,
      }),
      tx.order.groupBy({
        by: ["outcomeId", "price"],
        where: { ...whereBase, side: "SELL" },
        _sum: { remaining: true },
        orderBy: [{ price: "asc" }],
        take: maxLevels,
      }),
      tx.order.findMany({
        where: whereBase,
        select: {
          id: true,
          outcomeId: true,
          side: true,
          price: true,
          remaining: true,
          status: true,
          updatedAt: true,
        },
        orderBy: [{ outcomeId: "asc" }, { side: "asc" }, { price: "asc" }, { createdAt: "asc" }],
      }),
      tx.referenceQuoteSnapshot.findMany({
        where: {
          marketId: params.marketId,
          ...(outcomeId ? { outcomeId } : {}),
        },
        select: {
          outcomeId: true,
          source: true,
          fetchedAt: true,
          updatedAt: true,
          acceptingOrders: true,
          outcomePrice: true,
          bestBid: true,
          bestAsk: true,
          liquidity: true,
          liquidityClob: true,
          volume: true,
          volume24hr: true,
        },
        orderBy: [{ fetchedAt: "desc" }, { updatedAt: "desc" }],
      }),
      tx.referenceOrderbookDepthSnapshot.findMany({
        where: {
          marketId: params.marketId,
          ...(outcomeId ? { outcomeId } : {}),
        },
        select: {
          outcomeId: true,
          source: true,
          side: true,
          price: true,
          size: true,
          levelIndex: true,
          fetchedAt: true,
          updatedAt: true,
        },
        orderBy: [{ fetchedAt: "desc" }, { levelIndex: "asc" }, { price: "asc" }],
        take: maxLevels * 2,
      }),
    ]);

    logCrossedOutcomeDiagnostics(params.marketId, bids, asks, topOrders);
    const providerQuoteSnapshot = summarizeProviderSnapshots(providerSnapshots);
    const providerOrderbookDepth = buildProviderOrderbookDepth(providerDepthRows);
    const localBids = bids.map((row) => ({
      outcomeId: row.outcomeId,
      price: Number(row.price),
      size: Number(row._sum.remaining ?? 0),
    }));
    const localAsks = asks.map((row) => ({
      outcomeId: row.outcomeId,
      price: Number(row.price),
      size: Number(row._sum.remaining ?? 0),
    }));
    const providerDepth = buildProviderQuoteDepth(providerSnapshots, providerQuoteSnapshot.status);
    const hasLocalDepth = localBids.length > 0 || localAsks.length > 0;
    const useProviderOrderbookDepth = !hasLocalDepth && providerOrderbookDepth.levelCount > 0;
    const useProviderQuoteDepth = !hasLocalDepth && !useProviderOrderbookDepth && providerDepth.levelCount > 0;

    return {
      bids: useProviderOrderbookDepth ? providerOrderbookDepth.bids : useProviderQuoteDepth ? providerDepth.bids : localBids,
      asks: useProviderOrderbookDepth ? providerOrderbookDepth.asks : useProviderQuoteDepth ? providerDepth.asks : localAsks,
      depthSource: hasLocalDepth
        ? "local-orderbook"
        : useProviderOrderbookDepth
          ? "provider-orderbook-depth"
          : useProviderQuoteDepth
          ? "provider-quote-snapshot"
          : "empty",
      depthReason: hasLocalDepth
        ? "Depth comes from local open orderbook orders."
        : useProviderOrderbookDepth
          ? "Depth comes from provider orderbook ladder snapshots."
          : useProviderQuoteDepth
          ? "Depth comes from provider quote snapshot top-of-book prices and estimated size."
          : "No local depth, provider orderbook ladder depth, or provider top-of-book depth is available.",
      providerOrderbookDepth: providerOrderbookDepth.summary,
      providerQuoteDepth: {
        source: "reference-quote-snapshot",
        levelCount: providerDepth.levelCount,
        sizeSource: providerDepth.sizeSource,
        isEstimatedSize: providerDepth.levelCount > 0,
        reason: providerDepth.reason,
      },
      providerQuoteOutcomes: buildProviderQuoteOutcomes(providerSnapshots),
      providerQuoteSnapshot,
    } satisfies PublicOrderbookSnapshot;
  });
}

export function buildProviderQuoteOutcomes(snapshots: ProviderSnapshotRow[]): PublicOrderbookSnapshot["providerQuoteOutcomes"] {
  const latestByOutcome = new Map<string, ProviderSnapshotRow>();
  for (const snapshot of snapshots) {
    const existing = latestByOutcome.get(snapshot.outcomeId);
    if (
      !existing ||
      snapshot.fetchedAt > existing.fetchedAt ||
      (snapshot.fetchedAt.getTime() === existing.fetchedAt.getTime() && snapshot.updatedAt > existing.updatedAt)
    ) {
      latestByOutcome.set(snapshot.outcomeId, snapshot);
    }
  }

  return [...latestByOutcome.values()].map((snapshot) => ({
    outcomeId: snapshot.outcomeId,
    source: snapshot.source,
    outcomePrice: decimalToNumber(snapshot.outcomePrice),
    ...normalizeProviderBidAsk({
      outcomePrice: decimalToNumber(snapshot.outcomePrice),
      bestBid: decimalToNumber(snapshot.bestBid),
      bestAsk: decimalToNumber(snapshot.bestAsk),
    }),
    acceptingOrders: snapshot.acceptingOrders,
    fetchedAt: snapshot.fetchedAt.toISOString(),
    updatedAt: snapshot.updatedAt.toISOString(),
  }));
}

function normalizeProviderBidAsk(quote: {
  outcomePrice: number | null;
  bestBid: number | null;
  bestAsk: number | null;
}) {
  const { outcomePrice, bestBid, bestAsk } = quote;
  if (outcomePrice == null || bestBid == null || bestAsk == null) {
    return { bestBid, bestAsk };
  }
  const midpoint = (bestBid + bestAsk) / 2;
  const complementBid = 1 - bestAsk;
  const complementAsk = 1 - bestBid;
  const complementMidpoint = (complementBid + complementAsk) / 2;
  if (Math.abs(outcomePrice - complementMidpoint) + 0.000001 < Math.abs(outcomePrice - midpoint) && Math.abs(outcomePrice - midpoint) > 0.1) {
    return {
      bestBid: Number(complementBid.toFixed(8)),
      bestAsk: Number(complementAsk.toFixed(8)),
    };
  }
  return { bestBid, bestAsk };
}

export function buildProviderOrderbookDepth(rows: ProviderOrderbookDepthRow[]) {
  if (rows.length === 0) {
    return {
      bids: [] as PublicOrderbookSnapshot["bids"],
      asks: [] as PublicOrderbookSnapshot["asks"],
      levelCount: 0,
      summary: emptyProviderOrderbookDepth("No provider orderbook depth snapshot is available."),
    };
  }

  const latestFetchedAt = rows.reduce(
    (latest, row) => row.fetchedAt > latest ? row.fetchedAt : latest,
    rows[0]!.fetchedAt,
  );
  const latestRows = rows.filter((row) => row.fetchedAt.getTime() === latestFetchedAt.getTime());
  const bids = latestRows
    .filter((row) => row.side.toLowerCase() === "bid")
    .sort((left, right) => Number(right.price) - Number(left.price) || left.levelIndex - right.levelIndex)
    .map((row) => ({ outcomeId: row.outcomeId, price: Number(row.price), size: Number(row.size) }));
  const asks = latestRows
    .filter((row) => row.side.toLowerCase() === "ask")
    .sort((left, right) => Number(left.price) - Number(right.price) || left.levelIndex - right.levelIndex)
    .map((row) => ({ outcomeId: row.outcomeId, price: Number(row.price), size: Number(row.size) }));
  const levelCount = bids.length + asks.length;
  const latestUpdatedAt = latestRows.reduce(
    (latest, row) => row.updatedAt > latest ? row.updatedAt : latest,
    latestRows[0]?.updatedAt ?? latestFetchedAt,
  );
  const stalenessSeconds = Math.max(0, Math.round((Date.now() - latestFetchedAt.getTime()) / 1000));
  const isStale = stalenessSeconds > PROVIDER_SNAPSHOT_STALE_AFTER_SECONDS;
  const shouldRefresh = stalenessSeconds >= PROVIDER_SNAPSHOT_REFRESH_TTL_SECONDS;
  const nextRefreshAt = new Date(latestFetchedAt.getTime() + PROVIDER_SNAPSHOT_REFRESH_TTL_SECONDS * 1000);
  const status: PublicOrderbookSnapshot["providerOrderbookDepth"]["status"] = isStale ? "stale" : "ready";

  return {
    bids,
    asks,
    levelCount,
    summary: {
      source: "reference-orderbook-depth-snapshot" as const,
      status,
      levelCount,
      snapshotCount: latestRows.length,
      latestFetchedAt: latestFetchedAt.toISOString(),
      latestUpdatedAt: latestUpdatedAt.toISOString(),
      stalenessSeconds,
      staleAfterSeconds: PROVIDER_SNAPSHOT_STALE_AFTER_SECONDS,
      refreshTtlSeconds: PROVIDER_SNAPSHOT_REFRESH_TTL_SECONDS,
      nextRefreshAt: nextRefreshAt.toISOString(),
      shouldRefresh,
      isStale,
      sources: [...new Set(latestRows.map((row) => row.source))].sort(),
      reason: status === "ready"
        ? "Provider orderbook depth snapshot is fresh."
        : `Provider orderbook depth snapshot is older than ${PROVIDER_SNAPSHOT_STALE_AFTER_SECONDS} seconds.`,
    },
  };
}

function emptyProviderOrderbookDepth(reason: string): PublicOrderbookSnapshot["providerOrderbookDepth"] {
  return {
    source: "reference-orderbook-depth-snapshot",
    status: "unavailable",
    levelCount: 0,
    snapshotCount: 0,
    latestFetchedAt: null,
    latestUpdatedAt: null,
    stalenessSeconds: null,
    staleAfterSeconds: PROVIDER_SNAPSHOT_STALE_AFTER_SECONDS,
    refreshTtlSeconds: PROVIDER_SNAPSHOT_REFRESH_TTL_SECONDS,
    nextRefreshAt: null,
    shouldRefresh: true,
    isStale: false,
    sources: [],
    reason,
  };
}

export function buildProviderQuoteDepth(
  snapshots: ProviderSnapshotRow[],
  snapshotStatus: PublicOrderbookSnapshot["providerQuoteSnapshot"]["status"],
) {
  if (snapshotStatus === "unavailable") {
    return emptyProviderQuoteDepth("No provider quote snapshot is available.");
  }
  const latestByOutcome = new Map<string, ProviderSnapshotRow>();
  for (const snapshot of snapshots) {
    const existing = latestByOutcome.get(snapshot.outcomeId);
    if (!existing || snapshot.fetchedAt > existing.fetchedAt) {
      latestByOutcome.set(snapshot.outcomeId, snapshot);
    }
  }
  const latestSnapshots = [...latestByOutcome.values()];
  const bids: PublicOrderbookSnapshot["bids"] = [];
  const asks: PublicOrderbookSnapshot["asks"] = [];
  let sizeSource: ProviderDepthSizeSource = null;

  for (const snapshot of latestSnapshots) {
    const bid = decimalToNumber(snapshot.bestBid);
    const ask = decimalToNumber(snapshot.bestAsk);
    const bidSize = bid == null ? null : providerQuoteSize(snapshot, bid, latestSnapshots.length);
    const askSize = ask == null ? null : providerQuoteSize(snapshot, ask, latestSnapshots.length);
    sizeSource ??= bidSize?.source ?? askSize?.source ?? null;
    if (bid != null && bidSize != null) {
      bids.push({ outcomeId: snapshot.outcomeId, price: bid, size: bidSize.size });
    }
    if (ask != null && askSize != null) {
      asks.push({ outcomeId: snapshot.outcomeId, price: ask, size: askSize.size });
    }
  }

  const levelCount = bids.length + asks.length;
  return {
    bids,
    asks,
    levelCount,
    sizeSource,
    reason: levelCount > 0
      ? "Provider quote snapshots expose top-of-book prices; sizes are estimated from provider liquidity fields."
      : "Provider quote snapshots do not include enough price/liquidity data to build top-of-book depth.",
  };
}

function emptyProviderQuoteDepth(reason: string) {
  return {
    bids: [] as PublicOrderbookSnapshot["bids"],
    asks: [] as PublicOrderbookSnapshot["asks"],
    levelCount: 0,
    sizeSource: null as ProviderDepthSizeSource,
    reason,
  };
}

function providerQuoteSize(snapshot: ProviderSnapshotRow, price: number, outcomeCount: number) {
  const notional = providerNotional(snapshot);
  if (!notional || price <= 0) return null;
  const size = Number((notional.value / Math.max(price, 0.01) / Math.max(1, outcomeCount * 2)).toFixed(6));
  return size > 0 ? { size, source: notional.source } : null;
}

function providerNotional(snapshot: ProviderSnapshotRow) {
  const candidates = [
    ["liquidityClob", snapshot.liquidityClob],
    ["liquidity", snapshot.liquidity],
    ["volume24hr", snapshot.volume24hr],
    ["volume", snapshot.volume],
  ] as const;
  for (const [source, value] of candidates) {
    const parsed = decimalToNumber(value);
    if (parsed != null && parsed > 0) return { source, value: parsed };
  }
  return null;
}

function summarizeProviderSnapshots(snapshots: ProviderSnapshotRow[]): PublicOrderbookSnapshot["providerQuoteSnapshot"] {
  if (snapshots.length === 0) {
    return {
      source: "reference-quote-snapshot",
      status: "unavailable",
      snapshotCount: 0,
      latestFetchedAt: null,
      latestUpdatedAt: null,
      stalenessSeconds: null,
      staleAfterSeconds: PROVIDER_SNAPSHOT_STALE_AFTER_SECONDS,
      refreshTtlSeconds: PROVIDER_SNAPSHOT_REFRESH_TTL_SECONDS,
      nextRefreshAt: null,
      shouldRefresh: true,
      refreshKey: null,
      isStale: false,
      acceptingOrders: false,
      outcomeIds: [],
      sources: [],
      reason: "No provider quote snapshot is available for this market.",
    };
  }

  const latestFetchedAt = snapshots.reduce(
    (latest, snapshot) => snapshot.fetchedAt > latest ? snapshot.fetchedAt : latest,
    snapshots[0]!.fetchedAt,
  );
  const latestUpdatedAt = snapshots.reduce(
    (latest, snapshot) => snapshot.updatedAt > latest ? snapshot.updatedAt : latest,
    snapshots[0]!.updatedAt,
  );
  const stalenessSeconds = Math.max(0, Math.round((Date.now() - latestFetchedAt.getTime()) / 1000));
  const isStale = stalenessSeconds > PROVIDER_SNAPSHOT_STALE_AFTER_SECONDS;
  const shouldRefresh = stalenessSeconds >= PROVIDER_SNAPSHOT_REFRESH_TTL_SECONDS;
  const nextRefreshAt = new Date(latestFetchedAt.getTime() + PROVIDER_SNAPSHOT_REFRESH_TTL_SECONDS * 1000);
  const acceptingOrders = snapshots.some((snapshot) => snapshot.acceptingOrders);
  const status = isStale ? "stale" : "ready";

  return {
    source: "reference-quote-snapshot",
    status,
    snapshotCount: snapshots.length,
    latestFetchedAt: latestFetchedAt.toISOString(),
    latestUpdatedAt: latestUpdatedAt.toISOString(),
    stalenessSeconds,
    staleAfterSeconds: PROVIDER_SNAPSHOT_STALE_AFTER_SECONDS,
    refreshTtlSeconds: PROVIDER_SNAPSHOT_REFRESH_TTL_SECONDS,
    nextRefreshAt: nextRefreshAt.toISOString(),
    shouldRefresh,
    refreshKey: `${[...new Set(snapshots.map((snapshot) => snapshot.source))].sort().join("+")}:${latestFetchedAt.toISOString()}`,
    isStale,
    acceptingOrders,
    outcomeIds: [...new Set(snapshots.map((snapshot) => snapshot.outcomeId))].sort(),
    sources: [...new Set(snapshots.map((snapshot) => snapshot.source))].sort(),
    reason: status === "ready"
      ? "Provider quote snapshot is fresh."
      : `Provider quote snapshot is older than ${PROVIDER_SNAPSHOT_STALE_AFTER_SECONDS} seconds.`,
  };
}

function decimalToNumber(value: Prisma.Decimal | null | undefined) {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function logCrossedOutcomeDiagnostics(
  marketId: string,
  bids: LevelRow[],
  asks: LevelRow[],
  orders: DiagnosticOrderRow[],
) {
  const bidMap = new Map<string, LevelRow>();
  const askMap = new Map<string, LevelRow>();

  for (const row of bids) {
    if (!bidMap.has(row.outcomeId)) {
      bidMap.set(row.outcomeId, row);
    }
  }

  for (const row of asks) {
    if (!askMap.has(row.outcomeId)) {
      askMap.set(row.outcomeId, row);
    }
  }

  const outcomeIds = new Set([...bidMap.keys(), ...askMap.keys()]);
  for (const outcomeId of outcomeIds) {
    const bestBid = bidMap.get(outcomeId);
    const bestAsk = askMap.get(outcomeId);
    if (!bestBid || !bestAsk || bestBid.price.lte(bestAsk.price)) {
      continue;
    }

    const bestBidOrder = findTopOrder(orders, outcomeId, "BUY", "desc");
    const bestAskOrder = findTopOrder(orders, outcomeId, "SELL", "asc");

    console.error("[orderbookSnapshot] crossed outcome detected", {
      marketId,
      outcomeId,
      queryTs: new Date().toISOString(),
      bestBid: bestBid.price.toString(),
      bestAsk: bestAsk.price.toString(),
      bestBidOrder: serializeDiagnosticOrder(bestBidOrder),
      bestAskOrder: serializeDiagnosticOrder(bestAskOrder),
    });
  }
}

function findTopOrder(
  orders: DiagnosticOrderRow[],
  outcomeId: string,
  side: "BUY" | "SELL",
  direction: "asc" | "desc",
) {
  const filtered = orders.filter((order) => order.outcomeId === outcomeId && order.side === side);
  if (filtered.length === 0) {
    return null;
  }

  return filtered.sort((a, b) => {
    const priceCmp = a.price.comparedTo(b.price);
    if (priceCmp !== 0) {
      return direction === "asc" ? priceCmp : -priceCmp;
    }
    return a.updatedAt.getTime() - b.updatedAt.getTime();
  })[0] ?? null;
}

function serializeDiagnosticOrder(order: DiagnosticOrderRow | null) {
  if (!order) {
    return null;
  }

  return {
    id: order.id,
    price: order.price.toString(),
    remaining: order.remaining.toString(),
    status: order.status,
    updatedAt: order.updatedAt.toISOString(),
  };
}
