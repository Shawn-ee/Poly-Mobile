import { NextRequest } from "next/server";
import { runCanonicalRoute } from "@/lib/canonicalRoute";
import { getCanonicalAccountBalance } from "@/server/services/canonicalApi";

export async function GET(request: NextRequest) {
  return runCanonicalRoute({
    request,
    scopes: ["account:read"],
    routeId: "account:balance",
    fallbackMessage: "Failed to load account balance.",
    handler: async (actor) => ({
      body: await getCanonicalAccountBalance(actor.userId),
    }),
  });
}
