import {
  buildOrderTicketSubmission,
  estimateBuyMarketShares,
  getMarketExecutablePrice,
} from "@/components/market/orderbook/orderTicketLogic";

describe("orderTicketLogic", () => {
  test("Market BUY with bestAsk=0.19 submits price=0.19", () => {
    const result = buildOrderTicketSubmission({
      side: "BUY",
      orderType: "MARKET",
      outcomeId: "yes-id",
      bestBid: 0.15,
      bestAsk: 0.19,
      parsedAmountUsd: 10,
      parsedShares: 0,
      parsedLimitPrice: 0,
      buyLimitInputMode: "amount",
    });

    expect(result.payload).toEqual({
      side: "BUY",
      type: "MARKET",
      outcomeId: "yes-id",
      size: "52.631579",
      maxSpend: "10.000000",
      timeInForce: "IOC",
      executionMode: "MARKET",
    });
    expect(result.debug.effectivePrice).toBe(0.19);
  });

  test("Market BUY with missing bestAsk disables button path", () => {
    const result = buildOrderTicketSubmission({
      side: "BUY",
      orderType: "MARKET",
      outcomeId: "yes-id",
      bestBid: 0.15,
      bestAsk: null,
      parsedAmountUsd: 10,
      parsedShares: 0,
      parsedLimitPrice: 0,
      buyLimitInputMode: "amount",
    });

    expect(result.payload).toBeNull();
    expect(result.error).toBe("No ask liquidity available");
  });

  test("Market SELL with bestBid=0.15 submits price=0.15", () => {
    const result = buildOrderTicketSubmission({
      side: "SELL",
      orderType: "MARKET",
      outcomeId: "yes-id",
      bestBid: 0.15,
      bestAsk: 0.19,
      parsedAmountUsd: 0,
      parsedShares: 10,
      parsedLimitPrice: 0,
      buyLimitInputMode: "amount",
    });

    expect(result.payload).toEqual({
      side: "SELL",
      type: "MARKET",
      outcomeId: "yes-id",
      size: "10.000000",
      timeInForce: "IOC",
      executionMode: "MARKET",
    });
    expect(result.debug.effectivePrice).toBe(0.15);
  });

  test("Limit BUY uses user price", () => {
    const result = buildOrderTicketSubmission({
      side: "BUY",
      orderType: "LIMIT",
      outcomeId: "yes-id",
      bestBid: 0.15,
      bestAsk: 0.19,
      parsedAmountUsd: 10,
      parsedShares: 0,
      parsedLimitPrice: 0.17,
      buyLimitInputMode: "amount",
    });

    expect(result.payload?.price).toBe("0.17000000");
  });

  test("Limit SELL uses user price", () => {
    const result = buildOrderTicketSubmission({
      side: "SELL",
      orderType: "LIMIT",
      outcomeId: "yes-id",
      bestBid: 0.15,
      bestAsk: 0.19,
      parsedAmountUsd: 0,
      parsedShares: 10,
      parsedLimitPrice: 0.18,
      buyLimitInputMode: "amount",
    });

    expect(result.payload?.price).toBe("0.18000000");
  });

  test("price 0 is never submitted for market order", () => {
    const result = buildOrderTicketSubmission({
      side: "BUY",
      orderType: "MARKET",
      outcomeId: "yes-id",
      bestBid: 0.15,
      bestAsk: 0.19,
      parsedAmountUsd: 10,
      parsedShares: 0,
      parsedLimitPrice: 0,
      buyLimitInputMode: "amount",
    });

    expect("price" in (result.payload ?? {})).toBe(false);
    expect(result.debug.effectivePrice).toBeGreaterThan(0);
  });

  test("estimated shares uses same effectivePrice as submit payload", () => {
    const executable = getMarketExecutablePrice({
      side: "BUY",
      bestBid: 0.15,
      bestAsk: 0.19,
    });
    const estimatedShares = estimateBuyMarketShares(10, executable.effectivePrice);
    const result = buildOrderTicketSubmission({
      side: "BUY",
      orderType: "MARKET",
      outcomeId: "yes-id",
      bestBid: 0.15,
      bestAsk: 0.19,
      parsedAmountUsd: 10,
      parsedShares: 0,
      parsedLimitPrice: 0,
      buyLimitInputMode: "amount",
    });

    expect(executable.effectivePrice).toBe(0.19);
    expect(estimatedShares.toFixed(6)).toBe(result.payload?.size);
    expect(result.debug.effectivePrice).toBe(executable.effectivePrice);
  });
});
