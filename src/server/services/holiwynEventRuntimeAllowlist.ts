export type RuntimeOwnershipMode = "disabled" | "operator-triggered" | "supervisor-loop";

export type RuntimeAllowlistEventInput = {
  id: string;
  slug: string | null;
  title: string;
  source: string | null;
  externalEventId: string | null;
  status: string | null;
  liveStatus: string | null;
  startTime: Date | string | null;
  providerMarketCount: number;
  listedMarketCount: number;
  acceptingSnapshotCount: number;
  openOrderCount: number;
  latestSnapshotAt: Date | string | null;
};

export type RuntimeAllowlistEntry = {
  id: string;
  slug: string | null;
  title: string;
  source: string | null;
  externalEventId: string | null;
  status: string | null;
  liveStatus: string | null;
  startTime: string | null;
  identityComplete: boolean;
  archived: boolean;
  archiveFailsClosed: boolean;
  allowlisted: boolean;
  runtimeEligible: boolean;
  readiness: {
    providerMarketCount: number;
    listedMarketCount: number;
    acceptingSnapshotCount: number;
    openOrderCount: number;
    latestSnapshotAt: string | null;
  };
  ownership: {
    providerRefresh: RuntimeOwnershipMode;
    marketMaker: RuntimeOwnershipMode;
    staleGuard: RuntimeOwnershipMode;
    lifecycleScheduler: RuntimeOwnershipMode;
    resultPoller: RuntimeOwnershipMode;
  };
};

const normalizedIso = (value: Date | string | null) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
};

export function buildHoliwynEventRuntimeAllowlist(params: {
  events: RuntimeAllowlistEventInput[];
  requestedSlugs?: string[];
}) {
  const requestedSlugs = Array.from(
    new Set((params.requestedSlugs ?? []).map((slug) => slug.trim()).filter(Boolean)),
  );
  const requested = new Set(requestedSlugs);
  const slugCounts = new Map<string, number>();
  const providerIdentityCounts = new Map<string, number>();

  for (const event of params.events) {
    if (event.slug) slugCounts.set(event.slug, (slugCounts.get(event.slug) ?? 0) + 1);
    if (event.source && event.externalEventId) {
      const identity = `${event.source}:${event.externalEventId}`;
      providerIdentityCounts.set(identity, (providerIdentityCounts.get(identity) ?? 0) + 1);
    }
  }

  const duplicateSlugs = Array.from(slugCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([slug]) => slug);
  const duplicateProviderIdentities = Array.from(providerIdentityCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([identity]) => identity);
  const foundSlugs = new Set(params.events.flatMap((event) => (event.slug ? [event.slug] : [])));
  const missingRequestedSlugs = requestedSlugs.filter((slug) => !foundSlugs.has(slug));

  const entries: RuntimeAllowlistEntry[] = params.events.map((event) => {
    const identityComplete = Boolean(event.slug && event.source && event.externalEventId);
    const archived = event.status?.toLowerCase() === "closed";
    const archiveFailsClosed = !archived || (event.listedMarketCount === 0 && event.acceptingSnapshotCount === 0);
    const runtimeEligible = Boolean(
      identityComplete &&
        !archived &&
        event.providerMarketCount > 0 &&
        event.listedMarketCount > 0 &&
        event.acceptingSnapshotCount > 0,
    );
    const allowlisted = event.slug
      ? requested.size > 0
        ? requested.has(event.slug)
        : runtimeEligible
      : false;
    const activeOwnership: RuntimeOwnershipMode = allowlisted && runtimeEligible ? "supervisor-loop" : "disabled";

    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      source: event.source,
      externalEventId: event.externalEventId,
      status: event.status,
      liveStatus: event.liveStatus,
      startTime: normalizedIso(event.startTime),
      identityComplete,
      archived,
      archiveFailsClosed,
      allowlisted,
      runtimeEligible,
      readiness: {
        providerMarketCount: event.providerMarketCount,
        listedMarketCount: event.listedMarketCount,
        acceptingSnapshotCount: event.acceptingSnapshotCount,
        openOrderCount: event.openOrderCount,
        latestSnapshotAt: normalizedIso(event.latestSnapshotAt),
      },
      ownership: {
        providerRefresh: allowlisted && runtimeEligible ? "operator-triggered" : "disabled",
        marketMaker: activeOwnership,
        staleGuard: activeOwnership,
        lifecycleScheduler: activeOwnership,
        resultPoller: activeOwnership,
      },
    };
  });

  const allowlistedEntries = entries.filter((entry) => entry.allowlisted);
  const checks = {
    providerCatalogHasMultipleEvents: entries.length >= 2,
    providerIdentitiesComplete: entries.every((entry) => entry.identityComplete),
    providerSlugsUnique: duplicateSlugs.length === 0,
    providerIdentitiesUnique: duplicateProviderIdentities.length === 0,
    requestedSlugsExist: missingRequestedSlugs.length === 0,
    allowlistHasRuntimeOwner: allowlistedEntries.some((entry) => entry.runtimeEligible),
    allAllowlistedEventsRuntimeEligible: allowlistedEntries.every((entry) => entry.runtimeEligible),
    archivedEventsFailClosed: entries.every((entry) => entry.archiveFailsClosed),
  };

  return {
    entries,
    checks,
    pass: Object.values(checks).every(Boolean),
    requestedSlugs,
    missingRequestedSlugs,
    duplicateSlugs,
    duplicateProviderIdentities,
  };
}
