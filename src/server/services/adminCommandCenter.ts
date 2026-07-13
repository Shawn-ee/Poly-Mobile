import { prisma } from "@/lib/db";
import { validateConfig } from "@/lib/config";
import { getAdminBotMonitorSnapshot } from "@/server/services/adminBotMonitor";
import { getLocalLiveRuntimeStatus } from "@/server/services/liveRuntimeStatus";

type StatusKind = "healthy" | "degraded" | "stopped" | "unknown" | "blocked" | "planned";
type ServiceMode = "continuous" | "one-shot" | "local-only" | "production" | "unknown";

export type CommandCenterStatusItem = {
  id: string;
  label: string;
  status: StatusKind;
  lastUpdated: string | null;
  blocker: string | null;
  nextAction: string;
  localOnly?: boolean;
  productionSafe?: boolean;
};

export type CommandCenterServiceItem = CommandCenterStatusItem & {
  running: boolean | null;
  mode: ServiceMode;
  lastHeartbeat: string | null;
  lastRun: string | null;
  usesProviderQuota: boolean;
  activeSettlementExecution: boolean;
  installedOsService: boolean;
};

const nowIso = () => new Date().toISOString();

const safeJsonObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const stringValue = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : null);
const booleanValue = (value: unknown) => (typeof value === "boolean" ? value : null);
const numberValue = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);

const latestIso = (...values: Array<string | null | undefined>) =>
  values
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => right.localeCompare(left))[0] ?? null;

const staleByMinutes = (value: string | Date | null | undefined, minutes: number) => {
  if (!value) return true;
  const time = value instanceof Date ? value.getTime() : Date.parse(value);
  if (!Number.isFinite(time)) return true;
  return Date.now() - time > minutes * 60_000;
};

const toIso = (value: Date | string | null | undefined) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
};

const serviceLabel = (serviceName: string) => {
  if (serviceName === "one-event-live-supervisor") return "Live supervisor";
  if (serviceName === "one-event-result-poller") return "Result poller";
  return serviceName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const statusFromRuntimeStatus = (status: string | null, stale = false): StatusKind => {
  if (stale) return "degraded";
  if (status === "running" || status === "passed" || status === "ready" || status === "ok") return "healthy";
  if (status === "stopped") return "stopped";
  if (status === "needs_attention" || status === "failed" || status === "error") return "blocked";
  if (status === "degraded") return "degraded";
  return "unknown";
};

async function getLocalRuntimeStatusSafe() {
  if (process.env.NODE_ENV === "production" || process.env.HOLIWYN_DISABLE_INTERNAL_RUNTIME_STATUS === "1") {
    return null;
  }
  try {
    return await getLocalLiveRuntimeStatus();
  } catch (error) {
    console.error("[admin.command-center] local runtime status failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function getDbOk() {
  return prisma.$queryRaw`SELECT 1`
    .then(() => true)
    .catch((error) => {
      console.error("[admin.command-center] db health check failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    });
}

async function getLatestRuntimeRuns(serviceKeys: string[]) {
  const rows = await prisma.runtimeServiceRun.findMany({
    where: { serviceKey: { in: serviceKeys } },
    orderBy: { startedAt: "desc" },
    take: serviceKeys.length * 4,
  });
  const byService = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!byService.has(row.serviceKey)) byService.set(row.serviceKey, row);
  }
  return byService;
}

function runtimeServiceRows(params: {
  heartbeats: Awaited<ReturnType<typeof prisma.runtimeServiceHeartbeat.findMany>>;
  latestRuns: Map<string, Awaited<ReturnType<typeof prisma.runtimeServiceRun.findMany>>[number]>;
  localRuntimeStatus: Awaited<ReturnType<typeof getLocalRuntimeStatusSafe>>;
}): CommandCenterServiceItem[] {
  const expected = [
    {
      serviceKey: "local:one-event-live-supervisor",
      serviceName: "one-event-live-supervisor",
      serviceKind: "supervisor",
      mode: "local-only" as const,
      nextAction: "Start cached internal tester runtime when warm loops are needed.",
    },
    {
      serviceKey: "local:one-event-result-poller",
      serviceName: "one-event-result-poller",
      serviceKind: "result-poller",
      mode: "local-only" as const,
      nextAction: "Start result poller through the internal tester runtime manager.",
    },
  ];

  return expected.map((expectedService) => {
    const heartbeat = params.heartbeats.find((row) => row.serviceKey === expectedService.serviceKey) ?? null;
    const run = params.latestRuns.get(expectedService.serviceKey) ?? null;
    const heartbeatAt = toIso(heartbeat?.heartbeatAt);
    const runUpdatedAt = toIso(run?.updatedAt);
    const heartbeatStale = staleByMinutes(heartbeatAt, 5);
    const status = statusFromRuntimeStatus(heartbeat?.status ?? run?.status ?? null, heartbeat ? heartbeatStale : false);
    const blocker =
      status === "healthy"
        ? null
        : heartbeat
          ? heartbeatStale
            ? "heartbeat_stale"
            : heartbeat.status
          : "heartbeat_missing";
    return {
      id: expectedService.serviceKey,
      label: serviceLabel(expectedService.serviceName),
      status,
      running: heartbeat?.running ?? null,
      mode: heartbeat?.continuous ? "continuous" : expectedService.mode,
      lastUpdated: latestIso(heartbeatAt, runUpdatedAt),
      lastHeartbeat: heartbeatAt,
      lastRun: toIso(run?.startedAt),
      usesProviderQuota: heartbeat?.usesProviderQuota === true || run?.providerQuotaUsed === true,
      activeSettlementExecution: run?.activeSettlementExecuted === true,
      installedOsService: heartbeat?.installedOsService === true || run?.installedOsService === true,
      blocker,
      nextAction: status === "healthy" ? "Monitor heartbeat and latest run outcome." : expectedService.nextAction,
      localOnly: true,
      productionSafe: false,
    };
  });
}

function deriveLocalRuntimeCards(localRuntimeStatus: Awaited<ReturnType<typeof getLocalRuntimeStatusSafe>>) {
  const statusRecord = safeJsonObject(localRuntimeStatus);
  const providerSnapshots = safeJsonObject(statusRecord.providerSnapshots);
  const settlementAutomation = safeJsonObject(statusRecord.settlementAutomation);
  const activeEvent = safeJsonObject(settlementAutomation.activeEvent);
  const marketMakerQuoteRuns = safeJsonObject(statusRecord.marketMakerQuoteRuns);
  const providerRefreshRuns = safeJsonObject(statusRecord.providerRefreshRuns);
  const providerRefreshLoop = safeJsonObject(statusRecord.providerRefreshLoop);
  const productionReadiness = safeJsonObject(statusRecord.productionReadinessBoundary);
  const currentRuntimeState = safeJsonObject(statusRecord.currentRuntimeState);
  const operatorNextActions = safeJsonObject(statusRecord.operatorNextActions);
  const phaseCompletion = safeJsonObject(statusRecord.phaseCompletion);

  const runtimeStatus = stringValue(statusRecord.status);
  const localStatus = runtimeStatus === "ready" ? "healthy" : runtimeStatus ? "blocked" : "unknown";
  const providerFresh = booleanValue(providerSnapshots.fresh);
  const mobileLifecycleStatus = stringValue(providerSnapshots.mobileLifecycleStatus);
  const settlementBlocked = Array.isArray(activeEvent.blockers) && activeEvent.blockers.length > 0;
  const marketMakerPassed = booleanValue(marketMakerQuoteRuns.latestRunPassed);
  const providerRunPassed = booleanValue(providerRefreshRuns.latestRunPassed);
  const productionReady = booleanValue(productionReadiness.productionReady) === true;

  return {
    localRuntimeStatus,
    cards: {
      localRuntime: {
        id: "local-runtime",
        label: "Local/internal tester runtime",
        status: localStatus as StatusKind,
        lastUpdated: stringValue(statusRecord.generatedAt),
        blocker: localStatus === "healthy" ? null : "local_runtime_needs_attention_or_unavailable",
        nextAction: stringValue(operatorNextActions.recommendedFirstAction) ?? "Inspect local runtime status.",
        localOnly: true,
        productionSafe: false,
      },
      providerFreshness: {
        id: "provider-freshness",
        label: "Provider data freshness",
        status: providerFresh === true ? "healthy" : providerFresh === false ? "degraded" : "unknown",
        lastUpdated: stringValue(providerSnapshots.latestFetchedAt),
        blocker: providerFresh === false ? stringValue(providerSnapshots.reason) ?? "provider_snapshots_not_fresh" : null,
        nextAction:
          stringValue(providerSnapshots.nextProviderAction) ??
          (providerFresh ? "Monitor provider snapshot age." : "Refresh provider snapshots when quota policy allows."),
        localOnly: true,
        productionSafe: false,
      } satisfies CommandCenterStatusItem,
      mobileProof: {
        id: "mobile-proof",
        label: "Mobile/S23 proof",
        status: booleanValue(phaseCompletion.pass) === true ? "healthy" : phaseCompletion.checked === false ? "unknown" : "blocked",
        lastUpdated: stringValue(phaseCompletion.generatedAt),
        blocker: booleanValue(phaseCompletion.pass) === true ? null : "proof_missing_or_stale",
        nextAction: "Refresh S23/local proof only after current mobile trading work is clear.",
        localOnly: true,
        productionSafe: false,
      } satisfies CommandCenterStatusItem,
      marketMaker: {
        id: "market-maker",
        label: "Market maker / quote seeding",
        status: marketMakerPassed === true ? "healthy" : marketMakerPassed === false ? "blocked" : "unknown",
        lastUpdated: stringValue(safeJsonObject(marketMakerQuoteRuns.latest).updatedAt),
        blocker: marketMakerPassed === true ? null : "latest_market_maker_quote_run_not_passing",
        nextAction: marketMakerPassed === true ? "Monitor shifted quote visibility." : "Run local maker quote proof before tester trading.",
        localOnly: true,
        productionSafe: false,
      } satisfies CommandCenterStatusItem,
      providerRefresh: {
        id: "provider-refresh",
        label: "Provider refresh",
        status: providerRunPassed === true ? "healthy" : providerRunPassed === false ? "blocked" : "unknown",
        lastUpdated: stringValue(safeJsonObject(providerRefreshRuns.latest).updatedAt),
        blocker: providerRunPassed === true ? null : "latest_provider_refresh_run_not_passing",
        nextAction:
          stringValue(safeJsonObject(providerRefreshLoop.mobileFreshness).nextProviderAction) ??
          "Use explicit quota-gated provider refresh when needed.",
        localOnly: true,
        productionSafe: false,
      } satisfies CommandCenterStatusItem,
      settlement: {
        id: "settlement",
        label: "Settlement readiness",
        status: settlementBlocked ? "blocked" : booleanValue(activeEvent.executionAllowedNow) ? "healthy" : "degraded",
        lastUpdated: stringValue(statusRecord.generatedAt),
        blocker: settlementBlocked
          ? (Array.isArray(activeEvent.blockers) ? activeEvent.blockers.filter((item) => typeof item === "string")[0] : null) ??
            "settlement_blocked"
          : null,
        nextAction: stringValue(activeEvent.nextSafeAction) ?? "Keep settlement read-only until guard requirements pass.",
        localOnly: true,
        productionSafe: false,
      } satisfies CommandCenterStatusItem,
      productionReadiness: {
        id: "production-readiness",
        label: "Production readiness",
        status: productionReady ? "healthy" : "blocked",
        lastUpdated: stringValue(statusRecord.generatedAt),
        blocker: productionReady ? null : "production_runtime_not_complete",
        nextAction: "Keep Phase 1 dashboard read-only; do not expose production controls yet.",
        localOnly: false,
        productionSafe: productionReady,
      } satisfies CommandCenterStatusItem,
      currentRuntimeState: stringValue(currentRuntimeState.mode) ?? mobileLifecycleStatus ?? "unknown",
    },
  };
}

export async function getAdminCommandCenterSnapshot() {
  const generatedAt = nowIso();
  const configSummary = validateConfig(process.env);

  const [
    dbOk,
    botSnapshot,
    localRuntimeStatus,
    runtimeHeartbeats,
    activePublicMarkets,
    totalPublicMarkets,
    importedMarketCount,
    importedOutcomeCount,
    latestEvent,
    providerSnapshotLatest,
    providerSnapshotCount,
    latestProviderRun,
    latestMakerRun,
    pendingWithdrawals,
    pendingSettlementReviews,
    blockedSettlementReviews,
    operatorAuditCount,
    userCount,
    walletCount,
  ] = await Promise.all([
    getDbOk(),
    getAdminBotMonitorSnapshot().catch((error) => {
      console.error("[admin.command-center] bot monitor failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }),
    getLocalRuntimeStatusSafe(),
    prisma.runtimeServiceHeartbeat.findMany({ orderBy: { updatedAt: "desc" }, take: 20 }),
    prisma.market.count({ where: { visibility: "PUBLIC", isListed: true, status: "LIVE", isCanceled: false } }),
    prisma.market.count({ where: { visibility: "PUBLIC", isListed: true, isCanceled: false } }),
    prisma.market.count({ where: { referenceSource: { not: null } } }),
    prisma.outcome.count({ where: { market: { referenceSource: { not: null } } } }),
    prisma.event.findFirst({
      where: {
        OR: [{ status: "LIVE" }, { liveStatus: { not: null } }, { slug: "odds-api-single-soccer-test" }],
      },
      orderBy: [{ startTime: "asc" }, { updatedAt: "desc" }],
      select: { id: true, slug: true, title: true, status: true, liveStatus: true, startTime: true, sourceUpdatedAt: true, updatedAt: true },
    }),
    prisma.referenceQuoteSnapshot.findFirst({ orderBy: { fetchedAt: "desc" }, select: { fetchedAt: true, source: true, qualityStatus: true } }),
    prisma.referenceQuoteSnapshot.count(),
    prisma.providerRefreshRun.findFirst({ orderBy: { startedAt: "desc" } }),
    prisma.marketMakerQuoteRun.findFirst({ orderBy: { startedAt: "desc" } }),
    prisma.withdrawalRequest.count({ where: { status: "PENDING" } }),
    prisma.officialResultReview.count({ where: { settlementExecutedCanonicalId: null } }),
    prisma.officialResultReview.count({
      where: {
        settlementExecutedCanonicalId: null,
        OR: [{ executionEligibleNow: false }, { activeMarketExecutionAttempted: true }, { exactConfirmationStored: true }],
      },
    }),
    prisma.operatorAuditEvent.count(),
    prisma.user.count(),
    prisma.userBalance.count(),
  ]);

  const latestRuns = await getLatestRuntimeRuns(runtimeHeartbeats.map((row) => row.serviceKey));
  const localCards = deriveLocalRuntimeCards(localRuntimeStatus);
  const dbStatus: CommandCenterStatusItem = {
    id: "db",
    label: "Postgres",
    status: dbOk ? "healthy" : "blocked",
    lastUpdated: generatedAt,
    blocker: dbOk ? null : "db_health_check_failed",
    nextAction: dbOk ? "Monitor DB-backed service rows." : "Restore database connectivity before operating runtime services.",
    localOnly: false,
    productionSafe: dbOk,
  };
  const backendStatus: CommandCenterStatusItem = {
    id: "backend-api",
    label: "Backend API",
    status: dbOk ? "healthy" : "degraded",
    lastUpdated: generatedAt,
    blocker: dbOk ? null : "backend_db_dependency_degraded",
    nextAction: dbOk ? "Monitor admin API health." : "Check backend logs and database connectivity.",
    localOnly: process.env.NODE_ENV !== "production",
    productionSafe: process.env.NODE_ENV === "production" ? dbOk : false,
  };
  const envStatus: CommandCenterStatusItem = {
    id: "environment",
    label: "Environment",
    status: configSummary.ok ? "healthy" : "degraded",
    lastUpdated: generatedAt,
    blocker: configSummary.ok ? null : "config_validation_warnings_or_errors",
    nextAction: configSummary.ok ? "Keep secret values hidden; monitor present/missing flags." : "Resolve missing required config before production use.",
    localOnly: configSummary.env !== "production",
    productionSafe: configSummary.env === "production" && configSummary.ok,
  };
  const botStatus: CommandCenterStatusItem = {
    id: "bots",
    label: "Bots & liquidity",
    status: botSnapshot
      ? botSnapshot.overview.totalApiErrorsToday > 0 || botSnapshot.overview.totalRateLimitHitsToday > 0
        ? "degraded"
        : "healthy"
      : "unknown",
    lastUpdated: botSnapshot?.generatedAt ?? null,
    blocker: botSnapshot ? null : "bot_monitor_unavailable",
    nextAction: botSnapshot ? "Review noisy bot rows and rate-limit events." : "Open bot monitor after DB/API recovery.",
    localOnly: false,
    productionSafe: true,
  };

  const serviceRows: CommandCenterServiceItem[] = [
    {
      ...backendStatus,
      running: true,
      mode: configSummary.env === "production" ? "production" : "local-only",
      lastHeartbeat: generatedAt,
      lastRun: null,
      usesProviderQuota: false,
      activeSettlementExecution: false,
      installedOsService: configSummary.env === "production",
    },
    {
      ...dbStatus,
      running: dbOk,
      mode: configSummary.env === "production" ? "production" : "local-only",
      lastHeartbeat: generatedAt,
      lastRun: null,
      usesProviderQuota: false,
      activeSettlementExecution: false,
      installedOsService: configSummary.env === "production",
    },
    ...runtimeServiceRows({ heartbeats: runtimeHeartbeats, latestRuns, localRuntimeStatus }),
    {
      id: "expo-local-mobile-runtime",
      label: "Expo/local mobile runtime",
      status: "unknown",
      running: null,
      mode: "local-only",
      lastUpdated: null,
      lastHeartbeat: null,
      lastRun: null,
      usesProviderQuota: false,
      activeSettlementExecution: false,
      installedOsService: false,
      blocker: "not_connected_to_admin_status",
      nextAction: "Use local internal tester runtime manager status until an admin-safe heartbeat exists.",
      localOnly: true,
      productionSafe: false,
    },
    {
      id: "provider-refresh",
      label: "Provider refresh",
      status: latestProviderRun?.status === "passed" ? "healthy" : latestProviderRun ? "degraded" : "unknown",
      running: null,
      mode: "one-shot",
      lastUpdated: toIso(latestProviderRun?.updatedAt),
      lastHeartbeat: null,
      lastRun: toIso(latestProviderRun?.startedAt),
      usesProviderQuota: (latestProviderRun?.quotaCost ?? 0) > 0,
      activeSettlementExecution: false,
      installedOsService: false,
      blocker: latestProviderRun?.status === "passed" ? null : latestProviderRun?.status ?? "provider_refresh_run_missing",
      nextAction: "Refresh provider data only through explicit quota-gated proof/runner.",
      localOnly: true,
      productionSafe: false,
    },
    {
      id: "market-maker",
      label: "Market maker / quote seeding",
      status: latestMakerRun?.status === "passed" ? "healthy" : latestMakerRun ? "degraded" : "unknown",
      running: null,
      mode: "one-shot",
      lastUpdated: toIso(latestMakerRun?.updatedAt),
      lastHeartbeat: null,
      lastRun: toIso(latestMakerRun?.startedAt),
      usesProviderQuota: false,
      activeSettlementExecution: false,
      installedOsService: latestMakerRun?.installedOsService === true,
      blocker: latestMakerRun?.status === "passed" ? null : latestMakerRun?.status ?? "market_maker_run_missing",
      nextAction: "Seed or inspect shifted local maker quotes before tester trading.",
      localOnly: true,
      productionSafe: false,
    },
    {
      id: "lifecycle-scheduler",
      label: "Lifecycle scheduler",
      status:
        safeJsonObject(safeJsonObject(safeJsonObject(localRuntimeStatus).runtimeCapabilities).provenCapabilities)
          .lifecycleSchedulerWhileSupervisorRuns === true
          ? "healthy"
          : "degraded",
      running: null,
      mode: "local-only",
      lastUpdated: stringValue(safeJsonObject(localRuntimeStatus).generatedAt),
      lastHeartbeat: null,
      lastRun: null,
      usesProviderQuota: false,
      activeSettlementExecution: false,
      installedOsService: false,
      blocker: "installed_lifecycle_service_not_present",
      nextAction: "Keep lifecycle automation in local supervisor until production service ownership exists.",
      localOnly: true,
      productionSafe: false,
    },
    {
      id: "settlement-preflight",
      label: "Settlement preflight",
      status: localCards.cards.settlement.status,
      running: null,
      mode: "one-shot",
      lastUpdated: localCards.cards.settlement.lastUpdated,
      lastHeartbeat: null,
      lastRun: null,
      usesProviderQuota: false,
      activeSettlementExecution: false,
      installedOsService: false,
      blocker: localCards.cards.settlement.blocker,
      nextAction: localCards.cards.settlement.nextAction,
      localOnly: true,
      productionSafe: false,
    },
    {
      id: "settlement-execution-boundary",
      label: "Settlement approval/execution boundary",
      status: pendingSettlementReviews > 0 ? "blocked" : "planned",
      running: false,
      mode: "unknown",
      lastUpdated: generatedAt,
      lastHeartbeat: null,
      lastRun: null,
      usesProviderQuota: false,
      activeSettlementExecution: false,
      installedOsService: false,
      blocker: pendingSettlementReviews > 0 ? "settlement_reviews_pending_or_blocked" : "production_operator_ui_not_present",
      nextAction: "Keep execution controls off this dashboard until production auth, confirmation, and audit workflow are complete.",
      localOnly: true,
      productionSafe: false,
    },
  ];

  const statuses = [
    backendStatus,
    dbStatus,
    envStatus,
    localCards.cards.localRuntime,
    localCards.cards.providerFreshness,
    localCards.cards.providerRefresh,
    localCards.cards.marketMaker,
    localCards.cards.settlement,
    botStatus,
    localCards.cards.mobileProof,
    localCards.cards.productionReadiness,
  ];

  const blockers = statuses
    .filter((item) => item.blocker)
    .map((item) => ({ id: item.id, label: item.label, blocker: item.blocker, nextAction: item.nextAction }));

  return {
    generatedAt,
    status: blockers.length === 0 ? "healthy" : blockers.some((item) => item.blocker?.includes("production") || item.blocker?.includes("settlement")) ? "blocked" : "degraded",
    environment: {
      env: configSummary.env,
      nodeEnv: process.env.NODE_ENV ?? "unknown",
      strict: configSummary.strict,
      valid: configSummary.ok,
      warnings: configSummary.warnings,
      errors: configSummary.strict ? configSummary.errors : [],
      envPresence: {
        DATABASE_URL: Boolean(process.env.DATABASE_URL),
        ADMIN_EMAILS: Boolean(process.env.ADMIN_EMAILS),
        NEXTAUTH_SECRET: Boolean(process.env.NEXTAUTH_SECRET),
        THE_ODDS_API_KEY: Boolean(process.env.THE_ODDS_API_KEY),
      },
    },
    overview: {
      statuses,
      blockers,
      nextAction:
        blockers[0]?.nextAction ??
        "Monitor runtime heartbeats, provider freshness, bot risk, and settlement blockers from the command center.",
    },
    metrics: {
      activePublicMarkets,
      totalPublicMarkets,
      importedMarketCount,
      importedOutcomeCount,
      providerSnapshotCount,
      pendingWithdrawals,
      pendingSettlementReviews,
      blockedSettlementReviews,
      operatorAuditCount,
      userCount,
      walletCount,
      botOverview: botSnapshot?.overview ?? null,
    },
    event: latestEvent
      ? {
          id: latestEvent.id,
          slug: latestEvent.slug,
          title: latestEvent.title,
          status: latestEvent.status,
          liveStatus: latestEvent.liveStatus,
          startTime: toIso(latestEvent.startTime),
          lastUpdated: toIso(latestEvent.sourceUpdatedAt ?? latestEvent.updatedAt),
        }
      : null,
    providerData: {
      latestSnapshot: providerSnapshotLatest
        ? {
            fetchedAt: providerSnapshotLatest.fetchedAt.toISOString(),
            source: providerSnapshotLatest.source,
            qualityStatus: providerSnapshotLatest.qualityStatus,
            stale: staleByMinutes(providerSnapshotLatest.fetchedAt, 2),
          }
        : null,
      latestProviderRun: latestProviderRun
        ? {
            status: latestProviderRun.status,
            mode: latestProviderRun.mode,
            startedAt: latestProviderRun.startedAt.toISOString(),
            finishedAt: toIso(latestProviderRun.finishedAt),
            eventSlug: latestProviderRun.eventSlug,
            marketCount: latestProviderRun.marketCount,
            outcomeCount: latestProviderRun.outcomeCount,
            snapshotCount: latestProviderRun.snapshotCount,
            providerCallCount: latestProviderRun.providerCallCount,
            quotaCost: latestProviderRun.quotaCost,
          }
        : null,
    },
    marketMaker: latestMakerRun
      ? {
          status: latestMakerRun.status,
          mode: latestMakerRun.mode,
          startedAt: latestMakerRun.startedAt.toISOString(),
          finishedAt: toIso(latestMakerRun.finishedAt),
          eventSlug: latestMakerRun.eventSlug,
          marketId: latestMakerRun.marketId,
          quoteRouteStatus: latestMakerRun.quoteRouteStatus,
          snapshotFresh: latestMakerRun.snapshotFresh,
          localOnly: safeJsonObject(latestMakerRun.metadata).localOnly === true,
          installedOsService: latestMakerRun.installedOsService,
        }
      : null,
    localRuntime: {
      available: localRuntimeStatus != null,
      status: stringValue(safeJsonObject(localRuntimeStatus).status),
      currentState: localCards.cards.currentRuntimeState,
      generatedAt: stringValue(safeJsonObject(localRuntimeStatus).generatedAt),
    },
    services: serviceRows,
    sections: [
      { id: "overview", label: "Overview", href: "/admin", implemented: true },
      { id: "events", label: "Events & Markets", href: "/admin/events", implemented: true },
      { id: "services", label: "Runtime Services", href: "/admin/system", implemented: true },
      { id: "bots", label: "Bots & Liquidity", href: "/admin/bots", implemented: true },
      { id: "trading-risk", label: "Trading & Risk", href: "/admin#trading-risk", implemented: false },
      { id: "settlement", label: "Settlement", href: "/admin#settlement", implemented: false },
      { id: "users-wallets", label: "Users & Wallets", href: "/admin#users-wallets", implemented: false },
      { id: "provider-data", label: "Provider Data", href: "/admin/reference-markets", implemented: true },
      { id: "mobile-app", label: "Mobile App", href: "/admin/mobile-provider-mapping", implemented: true },
      { id: "agents-proof", label: "Agents & Proof", href: "/admin/agents", implemented: true },
      { id: "settings", label: "System Settings", href: "/admin/system", implemented: true },
      { id: "audit-logs", label: "Audit Logs", href: "/admin#audit-logs", implemented: false },
    ],
  };
}
