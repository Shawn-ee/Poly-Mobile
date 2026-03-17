import { requireAdmin } from "@/lib/admin";

export class MarketGuardError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "MarketGuardError";
    this.status = status;
  }
}

export const assertAdmin = async () => {
  const result = await requireAdmin();
  if ("error" in result) {
    throw new MarketGuardError(result.error ?? "Forbidden", result.status);
  }
  return result.user;
};

export const assertOwner = (params: { ownerId: string | null; userId: string | null }) => {
  if (!params.userId) {
    throw new MarketGuardError("Unauthorized", 401);
  }
  if (!params.ownerId || params.ownerId !== params.userId) {
    throw new MarketGuardError("Forbidden", 403);
  }
};

export const assertMarketMechanism = (
  mechanism: string,
  expected: string | string[]
) => {
  const expectedValues = Array.isArray(expected) ? expected : [expected];
  if (!expectedValues.includes(mechanism)) {
    throw new MarketGuardError(
      `Invalid market mechanism. Expected ${expectedValues.join(" or ")}.`,
      400
    );
  }
};

const ORDERBOOK_ALLOWED: Record<string, string[]> = {
  ACTIVE: ["RESOLVED", "PAUSED", "CLOSED", "LIVE"],
  PAUSED: ["ACTIVE", "RESOLVED", "LIVE", "CLOSED"],
  UPCOMING: ["LIVE"],
  LIVE: ["CLOSED", "RESOLVED"],
  CLOSED: ["LIVE", "RESOLVED"],
  RESOLVED: [],
  CANCELED: [],
};

const POOL_ALLOWED: Record<string, string[]> = {
  ACTIVE: ["RESOLVED", "PAUSED", "CANCELED", "CLOSED"],
  PAUSED: ["RESOLVED", "CANCELED", "CLOSED"],
  UPCOMING: ["LIVE", "CLOSED"],
  LIVE: ["CLOSED", "RESOLVED"],
  CLOSED: ["RESOLVED"],
  RESOLVED: [],
  CANCELED: [],
};

export const assertMarketStatusTransition = (params: {
  mechanism: string;
  current: string;
  next: string;
}) => {
  if (params.current === params.next) {
    return;
  }

  const allowedByCurrent =
    params.mechanism === "POOL"
      ? POOL_ALLOWED[params.current]
      : ORDERBOOK_ALLOWED[params.current];

  if (!allowedByCurrent?.includes(params.next)) {
    throw new MarketGuardError(
      `Invalid status transition for ${params.mechanism}: ${params.current} -> ${params.next}`,
      400
    );
  }
};

export const toGuardResponse = (error: unknown) => {
  if (error instanceof MarketGuardError) {
    return {
      body: { error: error.message },
      status: error.status,
    };
  }

  return {
    body: { error: "Internal server error" },
    status: 500,
  };
};
