import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  CanonicalApiError,
} from "@/lib/canonicalApi";
import { runCanonicalRoute } from "@/lib/canonicalRoute";
import { getCanonicalOrder } from "@/server/services/canonicalApi";
import { assertApiKeyCanCancelOrder } from "@/server/services/canonicalGovernance";
import { cancelOrderAndUnlock } from "@/server/services/matching";
import { emitMarketUpdate, emitUserUpdate } from "@/server/services/orderbookEvents";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Ctx) {
  return runCanonicalRoute({
    request,
    scopes: ["orders:read"],
    routeId: "orders:get",
    fallbackMessage: "Failed to load order.",
    handler: async (actor) => {
      const { id } = await context.params;
      if (!id) {
        throw new CanonicalApiError("INVALID_REQUEST", "Order id is required.", 400);
      }

      const result = await getCanonicalOrder({ userId: actor.userId, orderId: id });
      return { body: result, orderId: id };
    },
  });
}

export async function DELETE(request: NextRequest, context: Ctx) {
  return runCanonicalRoute({
    request,
    scopes: ["orders:write"],
    routeId: "orders:cancel",
    fallbackMessage: "Failed to cancel order.",
    handler: async (actor) => {
      const { id } = await context.params;
      if (!id) {
        throw new CanonicalApiError("INVALID_REQUEST", "Order id is required.", 400);
      }

      const order = await prisma.order.findFirst({
        where: {
          id,
          userId: actor.userId,
        },
        include: {
          market: {
            select: {
              id: true,
              mechanism: true,
              visibility: true,
              status: true,
              isCanceled: true,
            },
          },
        apiOrderRequest: {
          select: { clientOrderId: true },
        },
        createdApiCredential: {
          select: { keyId: true },
        },
      },
    });

      if (!order) {
        throw new CanonicalApiError("ORDER_NOT_FOUND", "Order not found.", 404);
      }
      await assertApiKeyCanCancelOrder({
        actor,
        marketId: order.market.id,
      });
      if (order.market.mechanism !== "ORDERBOOK") {
        throw new CanonicalApiError(
          "INVALID_REQUEST",
          "Only ORDERBOOK orders can be canceled here.",
          400
        );
      }
      if (order.market.visibility !== "PUBLIC") {
        throw new CanonicalApiError(
          "FORBIDDEN",
          "Only PUBLIC orderbook orders can be canceled here.",
          403
        );
      }
      if (order.market.isCanceled || order.market.status !== "LIVE") {
        throw new CanonicalApiError("CONFLICT", "Market is not open for cancel.", 409);
      }

      const result = await cancelOrderAndUnlock({
        orderId: id,
        userId: actor.userId,
        apiCredentialId: actor.apiCredentialId,
      });
      await Promise.allSettled([
        emitMarketUpdate({
          marketId: result.order.marketId,
          outcomeId: result.order.outcomeId,
        }),
        emitUserUpdate({
          userId: actor.userId,
          marketId: result.order.marketId,
        }),
      ]);
      return {
        body: {
          order: {
            ...result.order,
            type: "LIMIT",
            clientOrderId: order.apiOrderRequest?.clientOrderId ?? null,
            apiKeyId: order.createdApiCredential?.keyId ?? null,
            canceledByApiKeyId: actor.apiKeyId,
          },
          balance: result.balance,
          position: result.position,
        },
        orderId: id,
      };
    },
  });
}
