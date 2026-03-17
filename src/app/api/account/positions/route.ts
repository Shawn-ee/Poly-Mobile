import { NextRequest } from "next/server";
import { runCanonicalRoute } from "@/lib/canonicalRoute";
import { listCanonicalPositions } from "@/server/services/canonicalApi";

export async function GET(request: NextRequest) {
  return runCanonicalRoute({
    request,
    scopes: ["account:read"],
    routeId: "account:positions",
    fallbackMessage: "Failed to load account positions.",
    handler: async (actor) => ({
      body: await listCanonicalPositions({
        userId: actor.userId,
        marketId: request.nextUrl.searchParams.get("marketId"),
      }),
    }),
  });
}
