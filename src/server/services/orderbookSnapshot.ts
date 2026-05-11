import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const OPEN_STATUSES: OrderStatus[] = ["OPEN", "PARTIAL"];

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
    const [bids, asks, topOrders] = await Promise.all([
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
    } satisfies PublicOrderbookSnapshot;
  });
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
