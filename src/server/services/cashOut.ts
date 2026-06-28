import { Prisma } from "@prisma/client";
import { CanonicalApiError, serializeForApi } from "@/lib/canonicalApi";
import { getOutcomeQuotes } from "@/lib/orderbookPricing";
import { prisma } from "@/lib/db";

const ZERO = new Prisma.Decimal(0);
const DEFAULT_STALE_MS = 5 * 60 * 1000;

export const estimateSingleLegCashOutValue = (params: {
  quantity: Prisma.Decimal;
  entryCost: Prisma.Decimal;
  exitPrice: Prisma.Decimal;
}) => {
  if (params.quantity.lte(ZERO)) {
    throw new CanonicalApiError("CASH_OUT_UNSUPPORTED_POSITION", "Cash-out requires a positive single-leg position.", 400);
  }
  if (params.exitPrice.lte(ZERO) || params.exitPrice.gt(1)) {
    throw new CanonicalApiError("CASH_OUT_QUOTE_MISSING", "Cash-out estimate requires a valid exit quote.", 409);
  }
  const estimatedExitValue = params.quantity.mul(params.exitPrice).toDecimalPlaces(6, Prisma.Decimal.ROUND_DOWN);
  const estimatedPnl = estimatedExitValue.sub(params.entryCost).toDecimalPlaces(6, Prisma.Decimal.ROUND_HALF_UP);
  return {
    estimatedExitValue,
    estimatedPnl,
  };
};

export const estimateCashOut = async (params: {
  userId: string;
  marketId?: string | null;
  outcomeId?: string | null;
  comboOrderId?: string | null;
  now?: Date;
  staleMs?: number;
}) => {
  if (params.comboOrderId) {
    throw new CanonicalApiError("CASH_OUT_COMBO_UNSUPPORTED", "Combo cash-out is unsupported in v1.", 400);
  }
  if (!params.marketId || !params.outcomeId) {
    throw new CanonicalApiError("INVALID_REQUEST", "marketId and outcomeId are required.", 400);
  }

  const position = await prisma.position.findUnique({
    where: {
      userId_marketId_outcomeId: {
        userId: params.userId,
        marketId: params.marketId,
        outcomeId: params.outcomeId,
      },
    },
    include: {
      market: { select: { id: true, title: true, status: true, sourceUpdatedAt: true } },
      outcome: { select: { id: true, name: true, label: true } },
    },
  });
  if (!position || position.shares.lte(ZERO)) {
    throw new CanonicalApiError("CASH_OUT_UNSUPPORTED_POSITION", "Cash-out requires a positive single-leg position.", 404);
  }
  if (!["LIVE", "UPCOMING", "OPEN"].includes(position.market.status.toUpperCase())) {
    throw new CanonicalApiError("CASH_OUT_MARKET_CLOSED", "Cash-out estimate is unavailable for closed markets.", 409);
  }
  const now = params.now ?? new Date();
  if (
    position.market.sourceUpdatedAt &&
    now.getTime() - position.market.sourceUpdatedAt.getTime() > (params.staleMs ?? DEFAULT_STALE_MS)
  ) {
    throw new CanonicalApiError("CASH_OUT_QUOTE_STALE", "Cash-out estimate is unavailable because the market quote is stale.", 409);
  }

  const quote = (await getOutcomeQuotes(position.marketId, [position.outcomeId])).get(position.outcomeId);
  if (!quote?.hasQuote || quote.bestBid === null) {
    throw new CanonicalApiError("CASH_OUT_QUOTE_MISSING", "Cash-out estimate requires a current bid quote.", 409);
  }

  const exitPrice = new Prisma.Decimal(quote.bestBid).toDecimalPlaces(8, Prisma.Decimal.ROUND_HALF_UP);
  const entryCost = position.shares.mul(position.avgCost).toDecimalPlaces(6, Prisma.Decimal.ROUND_HALF_UP);
  const estimate = estimateSingleLegCashOutValue({
    quantity: position.shares,
    entryCost,
    exitPrice,
  });

  return serializeForApi({
    supported: true,
    positionType: "single_leg",
    marketId: position.marketId,
    marketTitle: position.market.title,
    outcomeId: position.outcomeId,
    outcomeName: position.outcome.label ?? position.outcome.name,
    quantity: position.shares,
    entryCost,
    exitPrice,
    estimatedExitValue: estimate.estimatedExitValue,
    estimatedPnl: estimate.estimatedPnl,
  });
};
