import { enforceOrderRateLimit } from "@/server/services/orderRateLimiter";

describe("order rate limiting", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-03-05T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("3.1 >5 place per second returns 429 error", () => {
    for (let i = 0; i < 5; i += 1) {
      expect(() => enforceOrderRateLimit("u1", "place")).not.toThrow();
    }
    expect(() => enforceOrderRateLimit("u1", "place")).toThrow(
      "Rate limit exceeded for place orders. Limit is 5/second."
    );
  });

  test("3.2 >10 cancel per second returns 429 error", () => {
    for (let i = 0; i < 10; i += 1) {
      expect(() => enforceOrderRateLimit("u1", "cancel")).not.toThrow();
    }
    expect(() => enforceOrderRateLimit("u1", "cancel")).toThrow(
      "Rate limit exceeded for cancel orders. Limit is 10/second."
    );
  });

  test("6.2 rapid place/cancel actions enforce limits independently", () => {
    for (let i = 0; i < 5; i += 1) enforceOrderRateLimit("u2", "place");
    for (let i = 0; i < 10; i += 1) enforceOrderRateLimit("u2", "cancel");
    expect(() => enforceOrderRateLimit("u2", "place")).toThrow();
    expect(() => enforceOrderRateLimit("u2", "cancel")).toThrow();
  });
});
