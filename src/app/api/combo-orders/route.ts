import { NextRequest } from "next/server";
import { parseLimitParam, CanonicalApiError } from "@/lib/canonicalApi";
import { runCanonicalRoute } from "@/lib/canonicalRoute";
import { requireInternalTradingUserById } from "@/lib/internalTradingBeta";
import { listComboOrders, submitComboOrder } from "@/server/services/comboOrders";

export async function POST(request: NextRequest) {
  return runCanonicalRoute({
    request,
    scopes: ["orders:write"],
    routeId: "combo-orders:create",
    fallbackMessage: "Failed to place combo order.",
    handler: async (actor) => {
      await requireInternalTradingUserById(actor.userId);
      const body = await request.json().catch(() => null);
      const result = await submitComboOrder({
        userId: actor.userId,
        body,
        idempotencyKeyHeader: request.headers.get("Idempotency-Key"),
      });
      return {
        body: result,
        status: 200,
        orderId: typeof result.comboOrder === "object" && result.comboOrder && "id" in result.comboOrder
          ? String(result.comboOrder.id)
          : null,
      };
    },
  });
}

export async function GET(request: NextRequest) {
  return runCanonicalRoute({
    request,
    scopes: ["orders:read"],
    routeId: "combo-orders:list",
    fallbackMessage: "Failed to load combo orders.",
    handler: async (actor) => {
      const limit = parseLimitParam(request.nextUrl.searchParams.get("limit"), 20, 100);
      if (limit === null) {
        throw new CanonicalApiError("INVALID_REQUEST", "Invalid limit.", 400);
      }
      return {
        body: await listComboOrders({ userId: actor.userId, limit }),
      };
    },
  });
}
