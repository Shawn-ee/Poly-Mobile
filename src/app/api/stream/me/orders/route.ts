import { NextRequest } from "next/server";
import { apiErrorFromUnknown } from "@/lib/canonicalApi";
import { requireCanonicalActor } from "@/lib/canonicalAuth";
import { createCanonicalSseStream } from "@/lib/sse";
import {
  getUserEventsSince,
  getStreamPollIntervalMs,
  getUserBootstrapEvent,
  subscribeToUserUpdates,
} from "@/server/services/orderbookEvents";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireCanonicalActor(request, ["orders:read", "fills:read"]);
    const marketId = request.nextUrl.searchParams.get("marketId");
    const stream = createCanonicalSseStream({
      request,
      pollIntervalMs: getStreamPollIntervalMs(),
      getBootstrapEvent: () =>
        getUserBootstrapEvent({
          userId: actor.userId,
          marketId,
        }),
      getReplayEvents: (lastEventId) =>
        getUserEventsSince({
          userId: actor.userId,
          marketId,
          lastSequence: lastEventId,
        }),
      subscribe: (listener) => subscribeToUserUpdates(actor.userId, listener),
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to open account stream.");
  }
}
