import { NextRequest } from "next/server";
import {
  parseLimitParam,
  CanonicalApiError,
} from "@/lib/canonicalApi";
import { runCanonicalRoute } from "@/lib/canonicalRoute";
import { requireInternalTradingUserById } from "@/lib/internalTradingBeta";
import { listCanonicalOrders } from "@/server/services/canonicalApi";
import { submitCanonicalOrder } from "@/server/services/canonicalOrderSubmission";
import { emitMarketUpdate, emitUserUpdate } from "@/server/services/orderbookEvents";

export async function POST(request: NextRequest) {
  return runCanonicalRoute({
    request,
    scopes: ["orders:write"],
    routeId: "orders:create",
    fallbackMessage: "Failed to place order.",
    handler: async (actor) => {
      await requireInternalTradingUserById(actor.userId);
      const body = await request.json().catch(() => null);
      const result = await submitCanonicalOrder({
        userId: actor.userId,
        apiCredentialId: actor.apiCredentialId,
        apiKeyId: actor.apiKeyId,
        body,
        idempotencyKeyHeader: request.headers.get("Idempotency-Key"),
      });
      if ("order" in result.body) {
        await Promise.allSettled([
          emitMarketUpdate({
            marketId: result.body.order.marketId,
            outcomeId: result.body.order.outcomeId,
          }),
          emitUserUpdate({
            userId: actor.userId,
            marketId: result.body.order.marketId,
          }),
        ]);
      }
      return {
        body: result.body,
        status: result.status,
        orderId: "order" in result.body ? result.body.order.id : null,
      };
    },
  });
}

export async function GET(request: NextRequest) {
  return runCanonicalRoute({
    request,
    scopes: ["orders:read"],
    routeId: "orders:list",
    fallbackMessage: "Failed to load orders.",
    handler: async (actor) => {
      const marketId = request.nextUrl.searchParams.get("marketId");
      const status = request.nextUrl.searchParams.get("status");
      const cursor = request.nextUrl.searchParams.get("cursor");
      const limit = parseLimitParam(request.nextUrl.searchParams.get("limit"), 50, 100);

      if (limit === null) {
        throw new CanonicalApiError("INVALID_REQUEST", "Invalid limit.", 400);
      }

      const result = await listCanonicalOrders({
        userId: actor.userId,
        marketId,
        status,
        cursor,
        limit,
      });
      return { body: result };
    },
  });
}
