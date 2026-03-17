import { NextRequest } from "next/server";
import {
  parseLimitParam,
  CanonicalApiError,
} from "@/lib/canonicalApi";
import { runCanonicalRoute } from "@/lib/canonicalRoute";
import { listCanonicalFills } from "@/server/services/canonicalApi";

export async function GET(request: NextRequest) {
  return runCanonicalRoute({
    request,
    scopes: ["fills:read"],
    routeId: "fills:list",
    fallbackMessage: "Failed to load fills.",
    handler: async (actor) => {
      const marketId = request.nextUrl.searchParams.get("marketId");
      const cursor = request.nextUrl.searchParams.get("cursor");
      const limit = parseLimitParam(request.nextUrl.searchParams.get("limit"), 50, 100);

      if (limit === null) {
        throw new CanonicalApiError("INVALID_REQUEST", "Invalid limit.", 400);
      }

      const result = await listCanonicalFills({
        userId: actor.userId,
        marketId,
        cursor,
        limit,
      });
      return { body: result };
    },
  });
}
