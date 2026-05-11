import { MarketGuardError } from "@/lib/marketGuards";

type Action =
  | "place"
  | "cancel"
  | "mint"
  | "withdraw_request"
  | "admin_withdraw_complete"
  | "admin_withdraw_reject"
  | "admin_market_resolve"
  | "admin_market_mutation";

const LIMITS: Record<Action, { limit: number; windowMs: number }> = {
  place: { limit: 1, windowMs: 1_000 },
  cancel: { limit: 1, windowMs: 1_000 },
  mint: { limit: 20, windowMs: 60_000 },
  withdraw_request: { limit: 6, windowMs: 60 * 60 * 1_000 },
  admin_withdraw_complete: { limit: 60, windowMs: 60_000 },
  admin_withdraw_reject: { limit: 60, windowMs: 60_000 },
  admin_market_resolve: { limit: 30, windowMs: 60_000 },
  admin_market_mutation: { limit: 60, windowMs: 60_000 },
};

const buckets = new Map<string, number[]>();

const enforceRateLimit = (userId: string, action: Action) => {
  const now = Date.now();
  const key = `${userId}:${action}`;
  const existing = buckets.get(key) ?? [];
  const policy = LIMITS[action];
  const fresh = existing.filter((ts) => now - ts < policy.windowMs);

  if (fresh.length >= policy.limit) {
    if (action === "place" || action === "cancel") {
      throw new MarketGuardError(
        `Rate limit exceeded for ${action} orders. Limit is ${policy.limit}/second.`,
        429
      );
    }
    throw new MarketGuardError(
      `Rate limit exceeded for ${action}. Limit is ${policy.limit} per ${Math.round(
        policy.windowMs / 1000
      )}s.`,
      429
    );
  }

  fresh.push(now);
  buckets.set(key, fresh);
};

export const enforceOrderRateLimit = (userId: string, action: "place" | "cancel") => {
  enforceRateLimit(userId, action);
};

export const enforceSensitiveRateLimit = (
  userId: string,
  action:
    | "mint"
    | "withdraw_request"
    | "admin_withdraw_complete"
    | "admin_withdraw_reject"
    | "admin_market_resolve"
    | "admin_market_mutation"
) => {
  enforceRateLimit(userId, action);
};
