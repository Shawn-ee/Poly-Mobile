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
      status: true,
      liveStatus: true,
      markets: {
        where: {
          visibility: "PUBLIC",
          mechanism: "ORDERBOOK",
          referenceSource,
          isCanceled: false,
          isListed: true,
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
        timing: lifecycleTiming({
          startTime: null,
          now,
          suspendBeforeStartSeconds,
        }),
        candidateMarketCount: 0,
        candidateMarketStatusCounts: {},
        changedMarketCount: 0,
        mutationApplied: false,
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
  const statusCounts = event.markets.reduce<Record<string, number>>((counts, market) => {
    counts[market.status] = (counts[market.status] ?? 0) + 1;
    return counts;
  }, {});

  let canceledOrderCount = 0;
  const mutationApplied = !options.dryRun && changes.length > 0;
  if (mutationApplied) {
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
    eventStatus: event.status,
    eventLiveStatus: event.liveStatus,
    eventStartTime: event.startTime?.toISOString() ?? null,
    status: "completed" as const,
    dryRun: options.dryRun === true,
    now: now.toISOString(),
    suspendBeforeStartSeconds,
    referenceSource,
    action: decision.action,
    reason: decision.reason,
    timing: decision.timing,
    candidateMarketCount: event.markets.length,
    candidateMarketStatusCounts: statusCounts,
    changedMarketCount: changes.length,
    mutationApplied,
    canceledOrderCount,
    changes,
  };
}

function decideEventLifecycleAction(params: {
  startTime: Date | null;
  now: Date;
  suspendBeforeStartSeconds: number;
}) {
  const timing = lifecycleTiming(params);
  if (!params.startTime) {
    return {
      action: "none" as const,
      reason: "Event has no startTime, so scheduler cannot infer lifecycle timing.",
      timing,
    };
  }
  const msUntilStart = params.startTime.getTime() - params.now.getTime();
  if (msUntilStart <= 0) {
    return {
      action: "close" as const,
      reason: "Event startTime has passed or is now; close mobile-tradable markets.",
      timing,
    };
  }
  if (msUntilStart <= params.suspendBeforeStartSeconds * 1000) {
    return {
      action: "pause" as const,
      reason: "Event is inside the pre-start suspend window; pause trading.",
      timing,
    };
  }
  return {
    action: "none" as const,
    reason: "Event is not inside the suspend/close window.",
    timing,
  };
}

function lifecycleTiming(params: {
  startTime: Date | null;
  now: Date;
  suspendBeforeStartSeconds: number;
}) {
  const pauseAt = params.startTime
    ? new Date(params.startTime.getTime() - params.suspendBeforeStartSeconds * 1000)
    : null;
  const closeAt = params.startTime;
  const msUntilStart = params.startTime ? params.startTime.getTime() - params.now.getTime() : null;
  const secondsUntilStart = msUntilStart == null ? null : Math.round(msUntilStart / 1000);
  const startAgeSeconds = msUntilStart == null ? null : Math.max(0, Math.round(-msUntilStart / 1000));
  const msUntilPause = pauseAt ? pauseAt.getTime() - params.now.getTime() : null;
  const secondsUntilPause = msUntilPause == null ? null : Math.round(msUntilPause / 1000);
  const startPassed = typeof secondsUntilStart === "number" && secondsUntilStart <= 0;
  const insideSuspendWindow =
    typeof secondsUntilStart === "number" &&
    secondsUntilStart > 0 &&
    secondsUntilStart <= params.suspendBeforeStartSeconds;
  const tradingWindow = !params.startTime
    ? "unknown"
    : startPassed
      ? "past_start"
      : insideSuspendWindow
        ? "pre_start_suspend_window"
        : "pre_start_open";
  const schedulerActionNow =
    tradingWindow === "past_start" ? "close" : tradingWindow === "pre_start_suspend_window" ? "pause" : "none";
  const nextLifecycleAction =
    tradingWindow === "past_start" ? "close" : tradingWindow === "pre_start_suspend_window" ? "pause" : "pause";
  const nextLifecycleActionAt =
    tradingWindow === "past_start" ? closeAt : tradingWindow === "pre_start_suspend_window" ? pauseAt : pauseAt;
  const secondsUntilNextLifecycleAction =
    schedulerActionNow === "none" ? Math.max(0, secondsUntilPause ?? 0) : 0;
  const operatorNextAction =
    tradingWindow === "past_start"
      ? "close_markets_before_settlement"
      : tradingWindow === "pre_start_suspend_window"
        ? "pause_trading_before_kickoff"
        : tradingWindow === "pre_start_open"
          ? "wait_until_suspend_window"
          : "set_or_import_event_start_time";

  return {
    now: params.now.toISOString(),
    startTime: params.startTime?.toISOString() ?? null,
    pauseAt: pauseAt?.toISOString() ?? null,
    closeAt: closeAt?.toISOString() ?? null,
    secondsUntilStart,
    startAgeSeconds,
    secondsUntilPause,
    suspendBeforeStartSeconds: params.suspendBeforeStartSeconds,
    insideSuspendWindow,
    startPassed,
    tradingWindow,
    schedulerActionNow,
    nextLifecycleAction,
    nextLifecycleActionAt: nextLifecycleActionAt?.toISOString() ?? null,
    secondsUntilNextLifecycleAction,
    operatorNextAction,
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
