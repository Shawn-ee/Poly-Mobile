import { enforceSensitiveRateLimit } from "@/server/services/orderRateLimiter";

describe("sensitive endpoint rate limits", () => {
  test("withdraw_request over limit returns 429 guard error", () => {
    const userId = `rate_sensitive_${Date.now()}`;
    for (let i = 0; i < 6; i += 1) {
      enforceSensitiveRateLimit(userId, "withdraw_request");
    }
    expect(() => enforceSensitiveRateLimit(userId, "withdraw_request")).toThrow(
      /Rate limit exceeded/
    );
  });
});

