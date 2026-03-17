import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { assertMarketVisibleToUser } from "@/lib/marketAccess";
import { toGuardResponse } from "@/lib/marketGuards";
import { createCanonicalSseStream } from "@/lib/sse";
import {
  getMarketEventsSince,
  getMarketBootstrapEvent,
  getStreamPollIntervalMs,
  subscribeToMarketUpdates,
} from "@/server/services/orderbookEvents";

type Ctx = { params: Promise<{ marketId: string }> };

export async function GET(request: NextRequest, context: Ctx) {
  const { marketId } = await context.params;
  const outcomeId = request.nextUrl.searchParams.get("outcomeId");
  const userId = await getUserId();
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    select: { id: true, visibility: true, ownerId: true, mechanism: true },
  });

  if (!market) {
    return new Response(JSON.stringify({ error: "Market not found." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await assertMarketVisibleToUser({ market, userId });
  } catch (error) {
    const response = toGuardResponse(error);
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = createCanonicalSseStream({
    request,
    pollIntervalMs: getStreamPollIntervalMs(),
    getBootstrapEvent: () => getMarketBootstrapEvent({ marketId, outcomeId }),
    getReplayEvents: (lastEventId) =>
      getMarketEventsSince({
        marketId,
        outcomeId,
        lastSequence: lastEventId,
      }),
    subscribe: (listener) => subscribeToMarketUpdates(marketId, listener),
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
