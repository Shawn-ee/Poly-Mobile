export type TicketSide = "BUY" | "SELL";
export type TicketOrderType = "MARKET" | "LIMIT";
export type BuyLimitInputMode = "amount" | "shares";

export type SubmitLimitOrderPayload = {
  side: TicketSide;
  type: "LIMIT";
  outcomeId: string;
  price: string;
  size: string;
};

export type SubmitMarketOrderPayload = {
  side: TicketSide;
  type: "MARKET";
  outcomeId: string;
  size: string;
  maxSpend?: string;
  timeInForce: "IOC";
  executionMode: "MARKET";
};

export type SubmitOrderPayload = SubmitLimitOrderPayload | SubmitMarketOrderPayload;

export type SubmitOrderDebug = {
  orderType: TicketOrderType;
  side: TicketSide;
  outcomeId: string;
  bestBid: number | null;
  bestAsk: number | null;
  effectivePrice: number | null;
  amount: number;
  shares: number;
  payload: SubmitOrderPayload | null;
};

export function getMarketExecutablePrice(params: {
  side: TicketSide;
  bestBid: number | null;
  bestAsk: number | null;
}) {
  if (params.side === "BUY") {
    return {
      effectivePrice: params.bestAsk,
      unavailableReason: params.bestAsk == null ? "No ask liquidity available" : null,
    };
  }

  return {
    effectivePrice: params.bestBid,
    unavailableReason: params.bestBid == null ? "No bid liquidity available" : null,
  };
}

export function estimateBuyMarketShares(amountUsd: number, bestAsk: number | null) {
  return bestAsk != null && bestAsk > 0 ? amountUsd / bestAsk : 0;
}

export function estimateSellMarketReceive(shares: number, bestBid: number | null) {
  return bestBid != null && bestBid > 0 ? shares * bestBid : 0;
}

export function buildOrderTicketSubmission(params: {
  side: TicketSide;
  orderType: TicketOrderType;
  outcomeId: string;
  bestBid: number | null;
  bestAsk: number | null;
  parsedAmountUsd: number;
  parsedShares: number;
  parsedLimitPrice: number;
  buyLimitInputMode: BuyLimitInputMode;
}) {
  if (params.orderType === "MARKET") {
    const executable = getMarketExecutablePrice({
      side: params.side,
      bestBid: params.bestBid,
      bestAsk: params.bestAsk,
    });

    if (executable.effectivePrice == null || executable.effectivePrice <= 0 || executable.effectivePrice >= 1) {
      return {
        payload: null,
        debug: {
          orderType: params.orderType,
          side: params.side,
          outcomeId: params.outcomeId,
          bestBid: params.bestBid,
          bestAsk: params.bestAsk,
          effectivePrice: executable.effectivePrice,
          amount: params.parsedAmountUsd,
          shares: params.parsedShares,
          payload: null,
        } satisfies SubmitOrderDebug,
        error: executable.unavailableReason ?? "Executable price unavailable",
      };
    }

    const size =
      params.side === "BUY"
        ? estimateBuyMarketShares(params.parsedAmountUsd, executable.effectivePrice)
        : params.parsedShares;

    const payload: SubmitOrderPayload = {
      side: params.side,
      type: "MARKET",
      outcomeId: params.outcomeId,
      size: size.toFixed(6),
      ...(params.side === "BUY" ? { maxSpend: params.parsedAmountUsd.toFixed(6) } : {}),
      timeInForce: "IOC",
      executionMode: "MARKET",
    };

    return {
      payload,
      debug: {
        orderType: params.orderType,
        side: params.side,
        outcomeId: params.outcomeId,
        bestBid: params.bestBid,
        bestAsk: params.bestAsk,
        effectivePrice: executable.effectivePrice,
        amount: params.parsedAmountUsd,
        shares: size,
        payload,
      } satisfies SubmitOrderDebug,
      error: null,
    };
  }

  const size =
    params.side === "BUY"
      ? params.buyLimitInputMode === "amount"
        ? params.parsedLimitPrice > 0
          ? params.parsedAmountUsd / params.parsedLimitPrice
          : 0
        : params.parsedShares
      : params.parsedShares;

  const payload: SubmitOrderPayload = {
    side: params.side,
    type: "LIMIT",
    outcomeId: params.outcomeId,
    price: params.parsedLimitPrice.toFixed(8),
    size: size.toFixed(6),
  };

  return {
    payload,
    debug: {
      orderType: params.orderType,
      side: params.side,
      outcomeId: params.outcomeId,
      bestBid: params.bestBid,
      bestAsk: params.bestAsk,
      effectivePrice: params.parsedLimitPrice,
      amount: params.parsedAmountUsd,
      shares: size,
      payload,
    } satisfies SubmitOrderDebug,
    error: null,
  };
}
