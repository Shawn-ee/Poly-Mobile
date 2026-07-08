import { prisma } from "@/lib/db";
import { refreshMobileLiveProviderQuoteSnapshots } from "@/server/services/mobileLiveProviderRefresh";
import { buildMobileLiveProviderRefreshCachePaths } from "@/server/services/mobileLiveProviderRefreshCache";

const DEFAULT_REFRESH_TTL_SECONDS = 60;
const DEFAULT_MAX_EVENTS = 5;

type SchedulerCandidate = {
  slug: string | null;
  title: string;
  markets: Array<{
    id: string;
    title: string;
    outcomes: Array<{ id: string }>;
  }>;
};

export type ScheduledMobileLiveProviderRefreshOptions = {
  eventSlugs?: string[];
  maxEvents?: number;
  refreshTtlSeconds?: number;
  dryRun?: boolean;
};

export async function runScheduledMobileLiveProviderRefresh(
  options: ScheduledMobileLiveProviderRefreshOptions = {},
) {
  const generatedAt = new Date();
  const runId = `mobile-live-provider-scheduler:${generatedAt.toISOString()}`;
  const refreshTtlSeconds = options.refreshTtlSeconds ?? DEFAULT_REFRESH_TTL_SECONDS;
  const candidates = await loadProviderRefreshCandidates({
    eventSlugs: options.eventSlugs,
    maxCandidates: Math.max(options.maxEvents ?? DEFAULT_MAX_EVENTS, DEFAULT_MAX_EVENTS),
  });
  const assessed = await Promise.all(
    candidates.map((candidate) => assessProviderRefreshCandidate(candidate, generatedAt, refreshTtlSeconds)),
  );
  const due = assessed
    .filter((candidate) => candidate.eventSlug && candidate.shouldRefresh)
    .slice(0, options.maxEvents ?? DEFAULT_MAX_EVENTS);

  const refreshed = [];
  for (const candidate of due) {
    if (options.dryRun) {
      refreshed.push({
        eventSlug: candidate.eventSlug,
        status: "dry_run",
        dryRun: true,
        dueMarketCount: candidate.dueMarketIds.length,
        refresh: null,
        cacheInvalidationContract: buildMobileLiveProviderRefreshCachePaths({
          eventSlug: candidate.eventSlug,
          marketIds: candidate.dueMarketIds,
        }),
      });
      continue;
    }

    try {
      const refresh = await refreshMobileLiveProviderQuoteSnapshots({
        eventSlug: candidate.eventSlug,
        allowContractProofFallback: false,
      });
      const refreshedMarketIds = refresh.mappingReadiness.markets.map((market) => market.marketId);
      refreshed.push({
        eventSlug: candidate.eventSlug,
        status: "completed",
        dryRun: false,
        dueMarketCount: candidate.dueMarketIds.length,
        refresh,
        cacheInvalidationContract: buildMobileLiveProviderRefreshCachePaths({
          eventSlug: candidate.eventSlug,
          marketIds: refreshedMarketIds,
        }),
      });
    } catch (error) {
      refreshed.push({
        eventSlug: candidate.eventSlug,
        status: "failed",
        dryRun: false,
        dueMarketCount: candidate.dueMarketIds.length,
        refresh: null,
        error: {
          name: error instanceof Error ? error.name : "Error",
          message: error instanceof Error ? error.message : String(error),
        },
        cacheInvalidationContract: buildMobileLiveProviderRefreshCachePaths({
          eventSlug: candidate.eventSlug,
          marketIds: candidate.dueMarketIds,
        }),
      });
    }
  }

  const completedAt = new Date();
  const successfulEventCount = refreshed.filter((item) => item.status === "completed").length;
  const failedEventCount = refreshed.filter((item) => item.status === "failed").length;
  const dryRunEventCount = refreshed.filter((item) => item.status === "dry_run").length;

  return {
    runId,
    generatedAt: generatedAt.toISOString(),
    startedAt: generatedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMs: Math.max(0, completedAt.getTime() - generatedAt.getTime()),
    source: "mobile-live-provider-scheduler",
    status: options.dryRun
      ? "dry_run"
      : failedEventCount > 0
        ? "completed_with_errors"
        : "completed",
    refreshTtlSeconds,
    dryRun: options.dryRun === true,
    candidateCount: assessed.length,
    dueEventCount: due.length,
    attemptedEventCount: refreshed.length,
    refreshedEventCount: successfulEventCount,
    successfulEventCount,
    failedEventCount,
    dryRunEventCount,
    candidates: assessed,
    refreshed,
  };
}

async function loadProviderRefreshCandidates(params: {
  eventSlugs?: string[];
  maxCandidates: number;
}): Promise<SchedulerCandidate[]> {
  return prisma.event.findMany({
    where: {
      slug: params.eventSlugs?.length ? { in: params.eventSlugs } : { not: null },
      markets: {
        some: {
          status: "LIVE",
          visibility: "PUBLIC",
          mechanism: "ORDERBOOK",
          referenceSource: "polymarket",
          externalSlug: { not: null },
          conditionId: { not: null },
          outcomes: {
            some: {
              isActive: true,
              referenceTokenId: { not: null },
            },
          },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: params.maxCandidates,
    select: {
      slug: true,
      title: true,
      markets: {
        where: {
          status: "LIVE",
          visibility: "PUBLIC",
          mechanism: "ORDERBOOK",
          referenceSource: "polymarket",
          externalSlug: { not: null },
          conditionId: { not: null },
        },
        select: {
          id: true,
          title: true,
          outcomes: {
            where: {
              isActive: true,
              referenceTokenId: { not: null },
            },
            select: { id: true },
          },
        },
      },
    },
  });
}

async function assessProviderRefreshCandidate(
  candidate: SchedulerCandidate,
  now: Date,
  refreshTtlSeconds: number,
) {
  const marketIds = candidate.markets.map((market) => market.id);
  const snapshots = marketIds.length
    ? await prisma.referenceQuoteSnapshot.findMany({
        where: { marketId: { in: marketIds } },
        select: { marketId: true, outcomeId: true, fetchedAt: true },
      })
    : [];
  const latestByOutcome = new Map<string, Date>();
  for (const snapshot of snapshots) {
    const key = `${snapshot.marketId}:${snapshot.outcomeId}`;
    const existing = latestByOutcome.get(key);
    if (!existing || snapshot.fetchedAt > existing) latestByOutcome.set(key, snapshot.fetchedAt);
  }

  const staleBefore = new Date(now.getTime() - refreshTtlSeconds * 1000);
  const dueMarketIds = [];
  const missingOutcomeCountByMarket = new Map<string, number>();
  const staleOutcomeCountByMarket = new Map<string, number>();

  for (const market of candidate.markets) {
    let marketMissing = 0;
    let marketStale = 0;
    for (const outcome of market.outcomes) {
      const fetchedAt = latestByOutcome.get(`${market.id}:${outcome.id}`);
      if (!fetchedAt) {
        marketMissing += 1;
      } else if (fetchedAt <= staleBefore) {
        marketStale += 1;
      }
    }
    if (marketMissing > 0 || marketStale > 0) {
      dueMarketIds.push(market.id);
      missingOutcomeCountByMarket.set(market.id, marketMissing);
      staleOutcomeCountByMarket.set(market.id, marketStale);
    }
  }

  return {
    eventSlug: candidate.slug ?? "",
    title: candidate.title,
    providerMarketCount: candidate.markets.length,
    providerOutcomeCount: candidate.markets.reduce((total, market) => total + market.outcomes.length, 0),
    snapshotCount: snapshots.length,
    dueMarketIds,
    dueMarketCount: dueMarketIds.length,
    missingOutcomeCount: Array.from(missingOutcomeCountByMarket.values()).reduce((total, count) => total + count, 0),
    staleOutcomeCount: Array.from(staleOutcomeCountByMarket.values()).reduce((total, count) => total + count, 0),
    shouldRefresh: dueMarketIds.length > 0,
    nextAction: dueMarketIds.length > 0 ? "refresh_provider_event" : "none",
  };
}
