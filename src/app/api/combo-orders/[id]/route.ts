import { NextRequest } from "next/server";
import { runCanonicalRoute } from "@/lib/canonicalRoute";
import { cancelComboOrder, getComboOrder } from "@/server/services/comboOrders";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Ctx) {
  return runCanonicalRoute({
    request,
    scopes: ["orders:read"],
    routeId: "combo-orders:get",
    fallbackMessage: "Failed to load combo order.",
    handler: async (actor) => {
      const { id } = await context.params;
      return { body: await getComboOrder({ userId: actor.userId, id }) };
    },
  });
}

export async function DELETE(request: NextRequest, context: Ctx) {
  return runCanonicalRoute({
    request,
    scopes: ["orders:write"],
    routeId: "combo-orders:cancel",
    fallbackMessage: "Failed to cancel combo order.",
    handler: async (actor) => {
      const { id } = await context.params;
      return { body: await cancelComboOrder({ userId: actor.userId, id }) };
    },
  });
}
