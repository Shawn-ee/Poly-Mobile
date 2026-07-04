import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { assertMarketVisibleToUser } from "@/lib/marketAccess";
import { assertMarketMechanism, toGuardResponse } from "@/lib/marketGuards";
import { buildPublicOrderbookSnapshot } from "@/server/services/orderbookSnapshot";

type Ctx = { params: Promise<{ marketId: string }> };
type OrderbookAvailabilityStatus = "ready" | "stale" | "suspended" | "delayed" | "unavailable";

const ORDERBOOK_STALE_AFTER_SECONDS = 90;

const marketFamilyForSelector = (market: {
  marketType: string;
  marketGroupKey: string | null;
  marketGroupTitle: string | null;
  title: string;
}) => {
  const key = `${market.marketType} ${market.marketGroupKey ?? ""} ${market.marketGroupTitle ?? ""} ${market.title}`.toLowerCase();
  if (key.includes("spread") || key.includes("handicap")) return "spread";
  if (key.includes("total")) return "total";
  if (key.includes("winner") || key.includes("moneyline") || key.includes("match_winner")) return "moneyline";
  return market.marketType;
};

const marketIdentityForSelector = (market: {
  id: string;
  title: string;
  marketType: string;
  marketGroupKey: string | null;
  marketGroupTitle: string | null;
  displayOrder: number;
  line: { toString(): string } | null;
  unit: string | null;
  period: string | null;
  outcomes: Array<{
    id: string;
    name: string;
    label: string | null;
    side: string | null;
    displayOrder: number;
    isTradable: boolean;
    referenceTokenId: string | null;
    referenceOutcomeLabel: string | null;
  }>;
}) => {
  const marketFamily = marketFamilyForSelector(market);
  return {
    source: "market-route-contract",
    marketId: market.id,
    title: market.title,
    selectorKey: [
      market.marketGroupKey ?? marketFamily,
      market.period ?? "full-game",
      market.line?.toString() ?? "default",
    ].join(":"),
    marketFamily,
    marketType: market.marketType,
    marketGroupKey: market.marketGroupKey,
    marketGroupId: market.marketGroupKey,
    marketGroupTitle: market.marketGroupTitle,
    displayOrder: market.displayOrder,
    period: market.period,
    line: market.line?.toString() ?? null,
    unit: market.unit,
    displayUnits: {
      price: "probability",
      priceFormat: "cents",
      shares: "shares",
      total: "notional",
      line: market.unit,
    },
    outcomeCount: market.outcomes.length,
    tradableOutcomeCount: market.outcomes.filter((outcome) => outcome.isTradable).length,
    outcomes: market.outcomes.map((outcome) => ({
      id: outcome.id,
      name: outcome.name,
      label: outcome.label ?? outcome.name,
      side: outcome.side,
      displayOrder: outcome.displayOrder,
      isTradable: outcome.isTradable,
      outcomeId: outcome.id,
      tokenId: outcome.referenceTokenId ?? null,
      referenceOutcomeLabel: outcome.referenceOutcomeLabel ?? null,
    })),
  };
};

const asDepthLevels = (
  levels: Array<{ outcomeId: string; price: number; size: number }>,
  side: "bid" | "ask",
) =>
  levels.map((level) => {
    const notionalValue = Number((level.price * level.size).toFixed(6));
    return {
      outcomeId: level.outcomeId,
      side,
      price: level.price,
      shares: level.size,
      total: notionalValue,
      value: notionalValue,
    };
  });

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

const availabilityFromProviderSnapshot = (
  market: {
    status: string;
    sourceUpdatedAt: Date | null;
    updatedAt: Date;
  },
  snapshot: Awaited<ReturnType<typeof buildPublicOrderbookSnapshot>>,
) => {
  const marketAvailability = availabilityForMarket(market);
  if (marketAvailability.status === "ready") return marketAvailability;

  const providerReady =
    snapshot.providerQuoteSnapshot?.status === "ready" &&
    snapshot.providerQuoteSnapshot?.shouldRefresh === false &&
    snapshot.providerOrderbookDepth?.status === "ready" &&
    snapshot.providerOrderbookDepth?.shouldRefresh === false;

  if (!providerReady) return marketAvailability;

  const lastUpdated =
    snapshot.providerOrderbookDepth.latestFetchedAt ??
    snapshot.providerQuoteSnapshot.latestFetchedAt ??
    marketAvailability.lastUpdated;
  const stalenessSeconds = lastUpdated
    ? Math.max(0, Math.round((Date.now() - new Date(lastUpdated).getTime()) / 1000))
    : marketAvailability.stalenessSeconds;

  return {
    ...marketAvailability,
    source: "provider-lifecycle",
    status: "ready" as const,
    lastUpdated,
    stalenessSeconds,
    isStale: false,
    isSuspended: false,
    isDelayed: false,
    reason: "Provider quote and orderbook depth snapshots are fresh.",
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
    select: {
      id: true,
      title: true,
      mechanism: true,
      visibility: true,
      ownerId: true,
      status: true,
      sourceUpdatedAt: true,
      updatedAt: true,
      marketType: true,
      marketGroupKey: true,
      marketGroupTitle: true,
      displayOrder: true,
      line: true,
      unit: true,
      period: true,
      outcomes: {
        where: { isActive: true },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          label: true,
          side: true,
          displayOrder: true,
          isTradable: true,
          referenceTokenId: true,
          referenceOutcomeLabel: true,
        },
      },
    },
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
      marketIdentity: marketIdentityForSelector(market),
      availability: availabilityFromProviderSnapshot(market, snapshot),
      emptyState: levels.length === 0 ? "no-depth" : null,
      levels,
      ...snapshot,
    });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
