import { NextRequest } from "next/server";
import { runCanonicalRoute } from "@/lib/canonicalRoute";
import { estimateCashOut } from "@/server/services/cashOut";

export async function GET(request: NextRequest) {
  return runCanonicalRoute({
    request,
    scopes: ["account:read"],
    routeId: "portfolio:cash-out-estimate",
    fallbackMessage: "Failed to estimate cash-out.",
    handler: async (actor) => {
      const marketId = request.nextUrl.searchParams.get("marketId");
      const outcomeId = request.nextUrl.searchParams.get("outcomeId");
      const comboOrderId = request.nextUrl.searchParams.get("comboOrderId");

      return {
        body: await estimateCashOut({
          userId: actor.userId,
          marketId,
          outcomeId,
          comboOrderId,
        }),
      };
    },
  });
}
