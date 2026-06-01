import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertAdmin, toGuardResponse } from "@/lib/marketGuards";
import { parseReferenceReview } from "@/server/services/polymarketReferenceImport";
import { parseBotInitializationMetadata } from "@/server/services/referenceBotInitialization";
import { getReferenceSummaryForMarket } from "@/server/services/referenceQuoteSnapshots";

export async function GET(request: NextRequest) {
  try {
    await assertAdmin();
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const url = new URL(request.url);
  const source = url.searchParams.get("source")?.trim() ?? "polymarket";
  const importStatus = url.searchParams.get("importStatus")?.trim() ?? "";
  const search = url.searchParams.get("search")?.trim() ?? "";

  const markets = await prisma.market.findMany({
    where: {
      referenceSource: source,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { externalSlug: { contains: search, mode: "insensitive" } },
              { conditionId: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    include: {
      event: true,
      outcomes: {
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  const items = await Promise.all(
    markets.map(async (market) => {
      const review = parseReferenceReview(market.referenceMetadata);
      const metadata =
        market.referenceMetadata &&
        typeof market.referenceMetadata === "object" &&
        !Array.isArray(market.referenceMetadata)
          ? (market.referenceMetadata as Record<string, unknown>)
          : {};
      const botInitialization = parseBotInitializationMetadata(metadata);
      return {
        id: market.id,
        title: market.title,
        description: market.description,
        status: market.status,
        isListed: market.isListed,
        event: market.event
          ? {
              id: market.event.id,
              slug: market.event.slug,
              title: market.event.title,
              category: market.event.category,
              source: market.event.source,
              externalEventId: market.event.externalEventId,
              externalSlug: market.event.externalSlug,
            }
          : null,
        externalMarketId: market.externalMarketId,
        externalSlug: market.externalSlug,
        conditionId: market.conditionId,
        referenceSource: market.referenceSource,
        importStatus: review.importStatus ?? null,
        referenceOnly: review.referenceOnly ?? null,
        tradable: review.tradable ?? null,
        mmEnabled: review.mmEnabled ?? null,
        reviewedAt: review.reviewedAt ?? null,
        reviewedBy: review.reviewedBy ?? null,
        reviewNotes: review.reviewNotes ?? null,
        outcomePrices: metadata.outcomePrices ?? null,
        bestBid: metadata.bestBid ?? null,
        bestAsk: metadata.bestAsk ?? null,
        spread: metadata.spread ?? null,
        lastTradePrice: metadata.lastTradePrice ?? null,
        volume24hr: metadata.volume24hr ?? null,
        liquidity: metadata.liquidity ?? null,
        acceptingOrders: metadata.acceptingOrders ?? null,
        snapshotSummary: await getReferenceSummaryForMarket(market.id),
        botInitialization,
        referenceMetadata: market.referenceMetadata,
        outcomes: market.outcomes.map((outcome) => ({
          id: outcome.id,
          name: outcome.name,
          displayOrder: outcome.displayOrder,
          isTradable: outcome.isTradable,
          referenceTokenId: outcome.referenceTokenId,
          referenceOutcomeLabel: outcome.referenceOutcomeLabel,
          referenceMetadata: outcome.referenceMetadata,
        })),
      };
    }),
  );

  const filteredItems = items.filter((market) => !importStatus || market.importStatus === importStatus);

  return NextResponse.json({ items: filteredItems });
}
