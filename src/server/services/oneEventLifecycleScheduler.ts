import { MarketStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { cancelOpenOrderbookOrdersTx } from "@/server/services/settlement";

const DEFAULT_SUSPEND_BEFORE_START_SECONDS = 5 * 60;

type SchedulerMarket = {
  id: string;
  title: string;
  status: MarketStatus;
  closeTime: Date | null;
};

export type OneEventLifecycleSchedulerOptions = {
  eventSlug: string;
  now?: Date;
  suspendBeforeStartSeconds?: number;
  dryRun?: boolean;
  referenceSource?: string;
};

export async function runOneEventLifecycleScheduler(options: OneEventLifecycleSchedulerOptions) {
  const now = options.now ?? new Date();
  const suspendBeforeStartSeconds =
    options.suspendBeforeStartSeconds ?? DEFAULT_SUSPEND_BEFORE_START_SECONDS;
  const referenceSource = options.referenceSource ?? "sportsbook-odds";
  const event = await prisma.event.findUnique({
    where: { slug: options.eventSlug },
    select: {
      id: true,
      slug: true,
      title: true,
      startTime: true,
      markets: {
        where: {
          visibility: "PUBLIC",
          mechanism: "ORDERBOOK",
          referenceSource,
          isCanceled: false,
          status: { in: ["UPCOMING", "LIVE", "PAUSED"] },
        },
        select: {
          id: true,
          title: true,
          status: true,
          closeTime: true,
        },
        orderBy: [{ marketGroupKey: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!event) {
    return {
      generatedAt: new Date().toISOString(),
      eventSlug: options.eventSlug,
      status: "event_not_found" as const,
      dryRun: options.dryRun === true,
      now: now.toISOString(),
      action: "none" as const,
      reason: "Event was not found.",
      candidateMarketCount: 0,
      changedMarketCount: 0,
      canceledOrderCount: 0,
      changes: [],
    };
  }

  const decision = decideEventLifecycleAction({
    startTime: event.startTime,
    now,
    suspendBeforeStartSeconds,
  });
  const changes = event.markets
    .map((market) => buildMarketLifecycleChange({ market, action: decision.action, now }))
    .filter((change): change is NonNullable<typeof change> => change != null);

  let canceledOrderCount = 0;
  if (!options.dryRun && changes.length > 0) {
    const closeTime = now;
    await prisma.$transaction(async (tx) => {
      for (const change of changes) {
        if (change.toStatus === "CLOSED") {
          const canceled = await cancelOpenOrderbookOrdersTx(tx, change.marketId);
          canceledOrderCount += canceled.canceledOrderCount;
        }
        await tx.market.update({
          where: { id: change.marketId },
          data: {
            status: change.toStatus,
            ...(change.toStatus === "CLOSED" ? { closeTime } : {}),
          },
        });
      }
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    eventSlug: event.slug,
    eventTitle: event.title,
    eventStartTime: event.startTime?.toISOString() ?? null,
    status: "completed" as const,
    dryRun: options.dryRun === true,
    now: now.toISOString(),
    suspendBeforeStartSeconds,
    referenceSource,
    action: decision.action,
    reason: decision.reason,
    candidateMarketCount: event.markets.length,
    changedMarketCount: changes.length,
    canceledOrderCount,
    changes,
  };
}

function decideEventLifecycleAction(params: {
  startTime: Date | null;
  now: Date;
  suspendBeforeStartSeconds: number;
}) {
  if (!params.startTime) {
    return {
      action: "none" as const,
      reason: "Event has no startTime, so scheduler cannot infer lifecycle timing.",
    };
  }
  const msUntilStart = params.startTime.getTime() - params.now.getTime();
  if (msUntilStart <= 0) {
    return {
      action: "close" as const,
      reason: "Event startTime has passed or is now; close mobile-tradable markets.",
    };
  }
  if (msUntilStart <= params.suspendBeforeStartSeconds * 1000) {
    return {
      action: "pause" as const,
      reason: "Event is inside the pre-start suspend window; pause trading.",
    };
  }
  return {
    action: "none" as const,
    reason: "Event is not inside the suspend/close window.",
  };
}

function buildMarketLifecycleChange(params: {
  market: SchedulerMarket;
  action: "none" | "pause" | "close";
  now: Date;
}) {
  if (params.action === "none") return null;
  if (params.action === "pause") {
    if (params.market.status === "PAUSED") return null;
    return {
      marketId: params.market.id,
      title: params.market.title,
      fromStatus: params.market.status,
      toStatus: "PAUSED" as MarketStatus,
      closeTimeBefore: params.market.closeTime?.toISOString() ?? null,
      closeTimeAfter: null,
    };
  }
  if (params.market.status === "CLOSED") return null;
  return {
    marketId: params.market.id,
    title: params.market.title,
    fromStatus: params.market.status,
    toStatus: "CLOSED" as MarketStatus,
    closeTimeBefore: params.market.closeTime?.toISOString() ?? null,
    closeTimeAfter: params.now.toISOString(),
  };
}

export type OneEventLifecycleSchedulerResult = Awaited<
  ReturnType<typeof runOneEventLifecycleScheduler>
>;
