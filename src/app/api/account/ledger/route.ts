import { NextRequest } from "next/server";
import {
  parseLimitParam,
  CanonicalApiError,
} from "@/lib/canonicalApi";
import { runCanonicalRoute } from "@/lib/canonicalRoute";
import { listCanonicalLedger } from "@/server/services/canonicalApi";

export async function GET(request: NextRequest) {
  return runCanonicalRoute({
    request,
    scopes: ["account:read"],
    routeId: "account:ledger",
    fallbackMessage: "Failed to load account ledger.",
    handler: async (actor) => {
      const cursor = request.nextUrl.searchParams.get("cursor");
      const limit = parseLimitParam(request.nextUrl.searchParams.get("limit"), 50, 100);

      if (limit === null) {
        throw new CanonicalApiError("INVALID_REQUEST", "Invalid limit.", 400);
      }

      const result = await listCanonicalLedger({
        userId: actor.userId,
        cursor,
        limit,
      });
      return { body: result };
    },
  });
}
