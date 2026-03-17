import {
  __clearOrderbookEventStateForTest,
  __emitMarketUpdateForTest,
  __emitUserUpdateForTest,
  subscribeToMarketUpdates,
  subscribeToUserUpdates,
} from "@/server/services/orderbookEvents";

describe("orderbook event bus", () => {
  beforeEach(() => {
    __clearOrderbookEventStateForTest();
  });

  test("6.1 supports 1000+ concurrent market subscribers", () => {
    let count = 0;
    const unsubs: Array<() => void> = [];
    for (let i = 0; i < 1000; i += 1) {
      unsubs.push(
        subscribeToMarketUpdates("m1", () => {
          count += 1;
        })
      );
    }
    __emitMarketUpdateForTest({
      type: "market_update",
      sequence: 1,
      ts: Date.now(),
      marketId: "m1",
      outcomeId: "o1",
      topLevels: { bids: [], asks: [] },
      recentTrades: [],
    });
    expect(count).toBe(1000);
    unsubs.forEach((fn) => fn());
  });

  test("7.2 user streams are isolated by userId", () => {
    const user1: unknown[] = [];
    const user2: unknown[] = [];
    const off1 = subscribeToUserUpdates("u1", (payload) => user1.push(payload));
    const off2 = subscribeToUserUpdates("u2", (payload) => user2.push(payload));

    __emitUserUpdateForTest({
      type: "user_update",
      sequence: 1,
      ts: Date.now(),
      userId: "u1",
      marketId: "m1",
      orders: [{ id: "o1", marketId: "m1", outcomeId: "o1", outcomeName: "YES", side: "BUY", price: 0.5, amount: 1, remaining: 1, status: "OPEN", createdAt: new Date().toISOString() }],
      fills: [],
    });
    expect(user1).toHaveLength(1);
    expect(user2).toHaveLength(0);
    off1();
    off2();
  });
});
