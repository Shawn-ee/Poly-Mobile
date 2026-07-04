import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const OPEN_STATUSES: OrderStatus[] = ["OPEN", "PARTIAL"];
const PROVIDER_SNAPSHOT_STALE_AFTER_SECONDS = 90;
const PROVIDER_SNAPSHOT_REFRESH_TTL_SECONDS = 60;

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
    const [bids, asks, topOrders, providerSnapshots] = await Promise.all([
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
        },
        orderBy: [{ fetchedAt: "desc" }, { updatedAt: "desc" }],
      }),
    ]);

    logCrossedOutcomeDiagnostics(params.marketId, bids, asks, topOrders);

    return {
      bids: bids.map((row) => ({
        outcomeId: row.outcomeId,
        price: Number(row.price),
        size: Number(row._sum.remaining ?? 0),
      })),
      asks: asks.map((row) => ({
        outcomeId: row.outcomeId,
        price: Number(row.price),
        size: Number(row._sum.remaining ?? 0),
      })),
      providerQuoteSnapshot: summarizeProviderSnapshots(providerSnapshots),
    } satisfies PublicOrderbookSnapshot;
  });
}

function summarizeProviderSnapshots(snapshots: Array<{
  outcomeId: string;
  source: string;
  fetchedAt: Date;
  updatedAt: Date;
  acceptingOrders: boolean;
}>): PublicOrderbookSnapshot["providerQuoteSnapshot"] {
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
