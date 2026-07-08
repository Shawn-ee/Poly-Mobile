import { NextRequest } from "next/server";
import { runCanonicalRoute } from "@/lib/canonicalRoute";
import { getProfileSummary } from "@/server/services/profileSummary";

export async function GET(request: NextRequest) {
  return runCanonicalRoute({
    request,
    scopes: ["account:read"],
    routeId: "account:summary",
    fallbackMessage: "Failed to load profile summary.",
    handler: async (actor) => ({ body: await getProfileSummary({ userId: actor.userId }) }),
  });
}
