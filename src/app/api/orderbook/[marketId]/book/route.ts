import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { assertMarketVisibleToUser } from "@/lib/marketAccess";
import { assertMarketMechanism, toGuardResponse } from "@/lib/marketGuards";
import { buildPublicOrderbookSnapshot } from "@/server/services/orderbookSnapshot";

type Ctx = { params: Promise<{ marketId: string }> };
type OrderbookAvailabilityStatus = "ready" | "stale" | "suspended" | "delayed" | "unavailable";

const ORDERBOOK_STALE_AFTER_SECONDS = 90;

const asDepthLevels = (
  levels: Array<{ outcomeId: string; price: number; size: number }>,
  side: "bid" | "ask",
) =>
  levels.map((level) => ({
    outcomeId: level.outcomeId,
    side,
    price: level.price,
    shares: level.size,
    total: Number((level.price * level.size).toFixed(6)),
  }));

const availabilityForMarket = (market: {
  status: string;
  sourceUpdatedAt: Date | null;
  updatedAt: Date;
}) => {
  const lastUpdated = market.sourceUpdatedAt ?? market.updatedAt;
  const stalenessSeconds = Math.max(0, Math.round((Date.now() - lastUpdated.getTime()) / 1000));
  const rawStatus = market.status.toUpperCase();
  const status: OrderbookAvailabilityStatus =
    rawStatus === "LIVE"
      ? stalenessSeconds > ORDERBOOK_STALE_AFTER_SECONDS ? "stale" : "ready"
      : rawStatus === "PAUSED"
        ? "suspended"
        : rawStatus === "UPCOMING"
          ? "delayed"
          : "unavailable";
  const reason =
    status === "ready"
      ? "Selected market is live and fresh."
      : status === "stale"
        ? `Selected market source update is older than ${ORDERBOOK_STALE_AFTER_SECONDS} seconds.`
        : status === "suspended"
          ? "Selected market is paused or suspended."
          : status === "delayed"
            ? "Selected market is not live yet."
            : "Selected market is closed, resolved, or unavailable.";

  return {
    source: market.sourceUpdatedAt ? "market-source-updated-at" : "market-updated-at",
    status,
    marketStatus: rawStatus,
    lastUpdated: lastUpdated.toISOString(),
    stalenessSeconds,
    staleAfterSeconds: ORDERBOOK_STALE_AFTER_SECONDS,
    isStale: status === "stale",
    isSuspended: status === "suspended",
    isDelayed: status === "delayed",
    reason,
  };
};

export async function GET(request: NextRequest, context: Ctx) {
  const { marketId } = await context.params;
  const userId = await getUserId();
  const outcomeId = request.nextUrl.searchParams.get("outcomeId");
  const maxLevelsParam = Number(request.nextUrl.searchParams.get("maxLevels"));
  const maxLevels = Number.isFinite(maxLevelsParam) && maxLevelsParam > 0
    ? Math.min(Math.floor(maxLevelsParam), 200)
    : undefined;

  const market = await prisma.market.findUnique({
    where: { id: marketId },
    select: { id: true, mechanism: true, visibility: true, ownerId: true, status: true, sourceUpdatedAt: true, updatedAt: true },
  });
  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }

  try {
    assertMarketMechanism(market.mechanism, "ORDERBOOK");
    await assertMarketVisibleToUser({ market, userId });

    const snapshot = await buildPublicOrderbookSnapshot({
      marketId,
      outcomeId,
      maxLevels,
    });
    const levels = [
      ...asDepthLevels(snapshot.bids, "bid"),
      ...asDepthLevels(snapshot.asks, "ask"),
    ];

    return NextResponse.json({
      marketId,
      outcomeId,
      generatedAt: new Date().toISOString(),
      availability: availabilityForMarket(market),
      emptyState: levels.length === 0 ? "no-depth" : null,
      levels,
      ...snapshot,
    });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
