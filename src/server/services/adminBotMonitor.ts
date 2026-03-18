import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getBotRunStartDate } from "@/server/services/botRunState";

const OPEN_ORDER_STATUSES = ["OPEN", "PARTIAL"] as const;
const DEFAULT_FEED_LIMIT = 40;
const DEFAULT_DETAIL_LIMIT = 20;
const ACTIVE_BOT_WINDOW_MS = 15 * 60 * 1000;

const startOfUtcDay = (now = new Date()) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

const toDecimalString = (value: Prisma.Decimal | string | number | null | undefined) => {
  if (value === null || value === undefined) return "0";
  if (value instanceof Prisma.Decimal) return value.toString();
  return String(value);
};

const toIsoString = (value: Date | string | null | undefined) => {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
};

const toDisplayUser = (user: { username: string; displayName: string | null }) =>
  user.displayName?.trim() || user.username;

const healthScore = (params: {
  isDisabled: boolean;
  readOnly: boolean;
  errorsToday: number;
  rateLimitHitsToday: number;
  fillsToday: number;
  ordersSubmittedToday: number;
  lastUsedAt: Date | null;
}) => {
  if (params.isDisabled) return 0;

  let score = 100;
  score -= Math.min(params.errorsToday * 8, 40);
  score -= Math.min(params.rateLimitHitsToday * 12, 36);

  if (params.readOnly) score -= 8;
  if (!params.lastUsedAt) score -= 12;
  if (params.ordersSubmittedToday === 0 && params.fillsToday === 0) score -= 10;

  return Math.max(0, Math.min(100, score));
};

const healthLabel = (score: number, isDisabled: boolean) => {
  if (isDisabled) return "Disabled";
  if (score >= 85) return "Healthy";
  if (score >= 65) return "Watch";
  if (score >= 40) return "Noisy";
  return "At Risk";
};

export type BotMonitorOverview = {
  activeBots: number;
  totalOpenOrders: number;
  totalFillsToday: number;
  totalNotionalSubmittedToday: string;
  totalNotionalFilledToday: string;
  totalApiErrorsToday: number;
  totalRateLimitHitsToday: number;
  totalIdempotencyConflictsToday: number;
};

export type BotMonitorRow = {
  id: string;
  userId: string;
  botName: string;
  userLabel: string;
  keyId: string;
  status: "ACTIVE" | "REVOKED";
  isDisabled: boolean;
  readOnly: boolean;
  scopes: string[];
  openOrders: number;
  ordersSubmittedToday: number;
  fillsToday: number;
  errorsToday: number;
  rateLimitHitsToday: number;
  idempotencyConflictsToday: number;
  pausedReason: string | null;
  lastUsedAt: string | null;
  lastEventTime: string | null;
  balance: {
    availableUSDC: string;
    lockedUSDC: string;
    totalUSDC: string;
  } | null;
  exposure: {
    openPositions: number;
    totalShares: string;
    reservedShares: string;
  };
  limits: {
    maxOrderSize: string | null;
    maxOrderNotional: string | null;
    maxOpenOrders: number | null;
    maxDailySubmittedNotional: string | null;
    allowedMarketIds: string[];
  };
  submittedNotionalUsed: string;
  healthScore: number;
  healthLabel: string;
};

export type BotMonitorFeedItem = {
  id: string;
  ts: string;
  botId: string | null;
  botName: string;
  userLabel: string;
  keyId: string | null;
  eventType: string;
  marketLabel: string | null;
  orderId: string | null;
  resultCode: string;
  details: string;
};

export type MarketActivityRow = {
  marketId: string;
  marketTitle: string;
  recentOrders: number;
  recentFills: number;
  activeBots: number;
  lastOrderAt: string | null;
  lastFillAt: string | null;
};

export type RiskSummaryRow = {
  code: string;
  count: number;
};

export type BotMonitorSnapshot = {
  generatedAt: string;
  overview: BotMonitorOverview;
  bots: BotMonitorRow[];
  feed: BotMonitorFeedItem[];
  marketActivity: MarketActivityRow[];
  riskSummary: RiskSummaryRow[];
};

export type BotMonitorDetail = {
  generatedAt: string;
  bot: BotMonitorRow;
  metadata: {
    createdAt: string;
    revokedAt: string | null;
    lastUsedAt: string | null;
  };
  recentUsage: Array<{
    id: string;
    ts: string;
    method: string;
    routeId: string;
    path: string;
    responseStatus: number;
    resultCode: string;
    orderId: string | null;
  }>;
  recentOrders: Array<{
    id: string;
    marketId: string;
    marketTitle: string;
    outcomeId: string;
    outcomeName: string;
    side: "BUY" | "SELL";
    price: string;
    amount: string;
    remaining: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  recentFills: Array<{
    id: string;
    ts: string;
    role: "TAKER" | "MAKER";
    marketId: string;
    marketTitle: string;
    outcomeId: string;
    outcomeName: string;
    side: "BUY" | "SELL";
    price: string;
    size: string;
    notionalUSDC: string;
    feeUSDC: string;
    orderId: string;
  }>;
  recentLedger: Array<{
    id: string;
    ts: string;
    operation: string;
    reason: string;
    amountDelta: string;
    deltaAvailableUSDC: string | null;
    deltaLockedUSDC: string | null;
    referenceType: string | null;
    referenceId: string | null;
  }>;
  recentEvents: Array<{
    id: string;
    ts: string;
    type: string;
    marketId: string | null;
    payload: unknown;
  }>;
  errorCounts: RiskSummaryRow[];
  openOrdersSummary: {
    count: number;
    reservedNotional: string;
  };
  positions: Array<{
    id: string;
    marketId: string;
    marketTitle: string;
    outcomeId: string;
    outcomeName: string;
    shares: string;
    reservedShares: string;
    avgCost: string;
    realizedPnl: string;
  }>;
};

type FillMetricRow = {
  apiCredentialId: string;
  fillCount: number;
  filledNotional: string;
};

type FillOverviewRow = {
  totalFillsToday: number;
  totalNotionalFilledToday: string;
};

type LatestUsageRow = {
  apiCredentialId: string;
  resultCode: string;
  createdAt: Date;
};

type FeedFillRow = {
  id: string;
  createdAt: Date;
  apiCredentialId: string;
  botName: string;
  keyId: string;
  userLabel: string;
  role: "TAKER" | "MAKER";
  marketId: string;
  marketTitle: string;
  outcomeName: string;
  orderId: string;
  side: "BUY" | "SELL";
  price: string;
  size: string;
  notionalUSDC: string;
};

const getAttributedFillMetrics = async (activityStart: Date) =>
  prisma.$queryRaw<FillMetricRow[]>(Prisma.sql`
    SELECT
      legs."apiCredentialId" AS "apiCredentialId",
      COUNT(*)::int AS "fillCount",
      COALESCE(SUM(legs."notionalUSDC"), 0)::text AS "filledNotional"
    FROM (
      SELECT taker."createdApiCredentialId" AS "apiCredentialId", fill."notionalUSDC"
      FROM "Fill" AS fill
      JOIN "Order" AS taker ON taker.id = fill."takerOrderId"
      WHERE fill."createdAt" >= ${activityStart}
        AND taker."createdApiCredentialId" IS NOT NULL
      UNION ALL
      SELECT maker."createdApiCredentialId" AS "apiCredentialId", fill."notionalUSDC"
      FROM "Fill" AS fill
      JOIN "Order" AS maker ON maker.id = fill."makerOrderId"
      WHERE fill."createdAt" >= ${activityStart}
        AND maker."createdApiCredentialId" IS NOT NULL
    ) AS legs
    GROUP BY legs."apiCredentialId"
  `);

const getFillOverview = async (activityStart: Date) =>
  prisma.$queryRaw<FillOverviewRow[]>(Prisma.sql`
    SELECT
      COUNT(*)::int AS "totalFillsToday",
      COALESCE(SUM(fill."notionalUSDC"), 0)::text AS "totalNotionalFilledToday"
    FROM "Fill" AS fill
    WHERE fill."createdAt" >= ${activityStart}
      AND (
        EXISTS (
          SELECT 1
          FROM "Order" AS taker
          WHERE taker.id = fill."takerOrderId"
            AND taker."createdApiCredentialId" IS NOT NULL
        )
        OR EXISTS (
          SELECT 1
          FROM "Order" AS maker
          WHERE maker.id = fill."makerOrderId"
            AND maker."createdApiCredentialId" IS NOT NULL
        )
      )
  `);

const getRecentAttributedFills = async (limit: number, activityStart?: Date) =>
  prisma.$queryRaw<FeedFillRow[]>(Prisma.sql`
    SELECT *
    FROM (
      SELECT
        fill.id,
        fill."createdAt",
        cred.id AS "apiCredentialId",
        cred.name AS "botName",
        cred."keyId" AS "keyId",
        COALESCE("user"."displayName", "user".username) AS "userLabel",
        'TAKER' AS "role",
        market.id AS "marketId",
        market.title AS "marketTitle",
        outcome.name AS "outcomeName",
        taker.id AS "orderId",
        fill.side,
        fill.price::text AS price,
        fill.size::text AS size,
        fill."notionalUSDC"::text AS "notionalUSDC"
      FROM "Fill" AS fill
      JOIN "Order" AS taker ON taker.id = fill."takerOrderId"
      JOIN "ApiCredential" AS cred ON cred.id = taker."createdApiCredentialId"
      JOIN "User" AS "user" ON "user".id = cred."userId"
      JOIN "Market" AS market ON market.id = fill."marketId"
      JOIN "Outcome" AS outcome ON outcome.id = fill."outcomeId"
      UNION ALL
      SELECT
        fill.id,
        fill."createdAt",
        cred.id AS "apiCredentialId",
        cred.name AS "botName",
        cred."keyId" AS "keyId",
        COALESCE("user"."displayName", "user".username) AS "userLabel",
        'MAKER' AS "role",
        market.id AS "marketId",
        market.title AS "marketTitle",
        outcome.name AS "outcomeName",
        maker.id AS "orderId",
        fill.side,
        fill.price::text AS price,
        fill.size::text AS size,
        fill."notionalUSDC"::text AS "notionalUSDC"
      FROM "Fill" AS fill
      JOIN "Order" AS maker ON maker.id = fill."makerOrderId"
      JOIN "ApiCredential" AS cred ON cred.id = maker."createdApiCredentialId"
      JOIN "User" AS "user" ON "user".id = cred."userId"
      JOIN "Market" AS market ON market.id = fill."marketId"
      JOIN "Outcome" AS outcome ON outcome.id = fill."outcomeId"
    ) AS attributed
    ${activityStart ? Prisma.sql`WHERE attributed."createdAt" >= ${activityStart}` : Prisma.empty}
    ORDER BY attributed."createdAt" DESC
    LIMIT ${limit}
  `);

const getDetailAttributedFills = async (apiCredentialId: string, limit: number, activityStart?: Date) =>
  prisma.$queryRaw<
    Array<{
      id: string;
      createdAt: Date;
      role: "TAKER" | "MAKER";
      marketId: string;
      marketTitle: string;
      outcomeId: string;
      outcomeName: string;
      side: "BUY" | "SELL";
      price: string;
      size: string;
      notionalUSDC: string;
      feeUSDC: string;
      orderId: string;
    }>
  >(Prisma.sql`
    SELECT *
    FROM (
      SELECT
        fill.id,
        fill."createdAt",
        'TAKER' AS role,
        market.id AS "marketId",
        market.title AS "marketTitle",
        outcome.id AS "outcomeId",
        outcome.name AS "outcomeName",
        fill.side,
        fill.price::text AS price,
        fill.size::text AS size,
        fill."notionalUSDC"::text AS "notionalUSDC",
        fill."feeUSDC"::text AS "feeUSDC",
        taker.id AS "orderId"
      FROM "Fill" AS fill
      JOIN "Order" AS taker ON taker.id = fill."takerOrderId"
      JOIN "Market" AS market ON market.id = fill."marketId"
      JOIN "Outcome" AS outcome ON outcome.id = fill."outcomeId"
      WHERE taker."createdApiCredentialId" = ${apiCredentialId}
      UNION ALL
      SELECT
        fill.id,
        fill."createdAt",
        'MAKER' AS role,
        market.id AS "marketId",
        market.title AS "marketTitle",
        outcome.id AS "outcomeId",
        outcome.name AS "outcomeName",
        fill.side,
        fill.price::text AS price,
        fill.size::text AS size,
        fill."notionalUSDC"::text AS "notionalUSDC",
        fill."feeUSDC"::text AS "feeUSDC",
        maker.id AS "orderId"
      FROM "Fill" AS fill
      JOIN "Order" AS maker ON maker.id = fill."makerOrderId"
      JOIN "Market" AS market ON market.id = fill."marketId"
      JOIN "Outcome" AS outcome ON outcome.id = fill."outcomeId"
      WHERE maker."createdApiCredentialId" = ${apiCredentialId}
    ) AS attributed
    ${activityStart ? Prisma.sql`WHERE attributed."createdAt" >= ${activityStart}` : Prisma.empty}
    ORDER BY attributed."createdAt" DESC
    LIMIT ${limit}
  `);

const buildMarketActivity = (params: {
  orderRows: Array<{
    marketId: string;
    marketTitle: string;
    apiCredentialId: string | null;
    createdAt: Date;
  }>;
  fillRows: FeedFillRow[];
}) => {
  const byMarket = new Map<string, MarketActivityRow & { botIds: Set<string> }>();

  for (const item of params.orderRows) {
    const existing = byMarket.get(item.marketId) ?? {
      marketId: item.marketId,
      marketTitle: item.marketTitle,
      recentOrders: 0,
      recentFills: 0,
      activeBots: 0,
      lastOrderAt: null,
      lastFillAt: null,
      botIds: new Set<string>(),
    };
    existing.recentOrders += 1;
    if (!existing.lastOrderAt || item.createdAt.toISOString() > existing.lastOrderAt) {
      existing.lastOrderAt = item.createdAt.toISOString();
    }
    if (item.apiCredentialId) existing.botIds.add(item.apiCredentialId);
    byMarket.set(item.marketId, existing);
  }

  for (const item of params.fillRows) {
    const existing = byMarket.get(item.marketId) ?? {
      marketId: item.marketId,
      marketTitle: item.marketTitle,
      recentOrders: 0,
      recentFills: 0,
      activeBots: 0,
      lastOrderAt: null,
      lastFillAt: null,
      botIds: new Set<string>(),
    };
    existing.recentFills += 1;
    if (!existing.lastFillAt || item.createdAt.toISOString() > existing.lastFillAt) {
      existing.lastFillAt = item.createdAt.toISOString();
    }
    existing.botIds.add(item.apiCredentialId);
    byMarket.set(item.marketId, existing);
  }

  return Array.from(byMarket.values())
    .map((item) => ({
      marketId: item.marketId,
      marketTitle: item.marketTitle,
      recentOrders: item.recentOrders,
      recentFills: item.recentFills,
      activeBots: item.botIds.size,
      lastOrderAt: item.lastOrderAt,
      lastFillAt: item.lastFillAt,
    }))
    .sort((left, right) => {
      const leftScore = left.recentOrders + left.recentFills;
      const rightScore = right.recentOrders + right.recentFills;
      return rightScore - leftScore;
    })
    .slice(0, 10);
};

const buildRiskSummary = (rows: Array<{ resultCode: string; _count: { _all: number } }>) =>
  rows
    .map((row) => ({
      code: row.resultCode,
      count: row._count._all,
    }))
    .sort((left, right) => right.count - left.count);

const PAUSE_REASON_CODES = new Set(["DAILY_NOTIONAL_LIMIT_EXCEEDED"]);

export const getAdminBotMonitorSnapshot = async (): Promise<BotMonitorSnapshot> => {
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const runStart = getBotRunStartDate();
  const activityStart = runStart && runStart.getTime() > todayStart.getTime() ? runStart : todayStart;
  const activeCutoff = new Date(now.getTime() - ACTIVE_BOT_WINDOW_MS);

  const [
    credentials,
    openOrders,
    submittedToday,
    errorTodayByCredential,
    rateLimitTodayByCredential,
    idempotencyConflictByCredential,
    riskSummaryRows,
    fillMetrics,
    fillOverviewRows,
    lastEventByUser,
    nonZeroPositions,
    recentUsage,
    recentRequests,
    recentOrderRows,
    recentFills,
    latestUsageRows,
  ] = await Promise.all([
    prisma.apiCredential.findMany({
      orderBy: [{ createdAt: "desc" }],
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            balance: {
              select: {
                availableUSDC: true,
                lockedUSDC: true,
              },
            },
          },
        },
      },
    }),
    prisma.order.groupBy({
      by: ["createdApiCredentialId"],
      where: {
        createdApiCredentialId: { not: null },
        status: { in: [...OPEN_ORDER_STATUSES] },
      },
      _count: { _all: true },
    }),
    prisma.apiOrderRequest.groupBy({
      by: ["apiCredentialId"],
      where: {
        apiCredentialId: { not: null },
        status: "SUCCEEDED",
        createdAt: { gte: activityStart },
      },
      _count: { _all: true },
      _sum: { submittedNotional: true },
    }),
    prisma.apiCredentialUsageLog.groupBy({
      by: ["apiCredentialId"],
      where: {
        createdAt: { gte: activityStart },
        responseStatus: { gte: 400 },
      },
      _count: { _all: true },
    }),
    prisma.apiCredentialUsageLog.groupBy({
      by: ["apiCredentialId"],
      where: {
        createdAt: { gte: activityStart },
        resultCode: "RATE_LIMIT_EXCEEDED",
      },
      _count: { _all: true },
    }),
    prisma.apiCredentialUsageLog.groupBy({
      by: ["apiCredentialId"],
      where: {
        createdAt: { gte: activityStart },
        resultCode: "IDEMPOTENCY_KEY_CONFLICT",
      },
      _count: { _all: true },
    }),
    prisma.apiCredentialUsageLog.groupBy({
      by: ["resultCode"],
      where: {
        createdAt: { gte: activityStart },
        responseStatus: { gte: 400 },
      },
      _count: { _all: true },
    }),
    getAttributedFillMetrics(activityStart),
    getFillOverview(activityStart),
    prisma.canonicalEvent.groupBy({
      by: ["userId"],
      where: {
        stream: "ACCOUNT",
        userId: { not: null },
        createdAt: { gte: activityStart },
      },
      _max: { createdAt: true },
    }),
    prisma.position.findMany({
      where: {
        OR: [
          { shares: { not: "0" } },
          { reservedShares: { not: "0" } },
        ],
      },
      select: {
        userId: true,
        shares: true,
        reservedShares: true,
      },
    }),
    prisma.apiCredentialUsageLog.findMany({
      where: {
        createdAt: { gte: activityStart },
        OR: [
          { responseStatus: { gte: 400 } },
          { routeId: "orders:delete", resultCode: "OK" },
        ],
      },
      orderBy: [{ createdAt: "desc" }],
      take: DEFAULT_FEED_LIMIT,
      include: {
        apiCredential: {
          select: {
            id: true,
            name: true,
            keyId: true,
            user: {
              select: {
                username: true,
                displayName: true,
              },
            },
          },
        },
        user: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
    }),
    prisma.apiOrderRequest.findMany({
      where: {
        apiCredentialId: { not: null },
        status: "SUCCEEDED",
        createdAt: { gte: activityStart },
      },
      orderBy: [{ createdAt: "desc" }],
      take: DEFAULT_FEED_LIMIT,
      include: {
        apiCredential: {
          select: {
            id: true,
            name: true,
            keyId: true,
            user: {
              select: {
                username: true,
                displayName: true,
              },
            },
          },
        },
        order: {
          select: {
            id: true,
            marketId: true,
            market: { select: { title: true } },
            side: true,
            price: true,
            amount: true,
          },
        },
      },
    }),
    prisma.apiOrderRequest.findMany({
      where: {
        apiCredentialId: { not: null },
        status: "SUCCEEDED",
        createdAt: { gte: activityStart },
        order: { isNot: null },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 200,
      select: {
        apiCredentialId: true,
        createdAt: true,
        order: {
          select: {
            marketId: true,
            market: { select: { title: true } },
          },
        },
      },
    }),
    getRecentAttributedFills(80, activityStart),
    prisma.apiCredentialUsageLog.findMany({
      where: {
        createdAt: { gte: activityStart },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 500,
      select: {
        apiCredentialId: true,
        resultCode: true,
        createdAt: true,
      },
    }),
  ]);

  const openOrderMap = new Map(openOrders.map((row) => [row.createdApiCredentialId ?? "", row._count._all]));
  const submittedMap = new Map(
    submittedToday.map((row) => [
      row.apiCredentialId ?? "",
      {
        count: row._count._all,
        notional: toDecimalString(row._sum.submittedNotional),
      },
    ])
  );
  const errorMap = new Map(errorTodayByCredential.map((row) => [row.apiCredentialId, row._count._all]));
  const rateLimitMap = new Map(rateLimitTodayByCredential.map((row) => [row.apiCredentialId, row._count._all]));
  const idempotencyMap = new Map(
    idempotencyConflictByCredential.map((row) => [row.apiCredentialId, row._count._all])
  );
  const fillMap = new Map(
    fillMetrics.map((row) => [
      row.apiCredentialId,
      {
        count: Number(row.fillCount),
        notional: row.filledNotional,
      },
    ])
  );
  const latestUsageMap = new Map<string, LatestUsageRow>();
  for (const row of latestUsageRows) {
    if (!latestUsageMap.has(row.apiCredentialId)) {
      latestUsageMap.set(row.apiCredentialId, row);
    }
  }
  const lastEventMap = new Map(
    lastEventByUser.map((row) => [row.userId ?? "", toIsoString(row._max.createdAt)])
  );
  const exposureMap = new Map<string, { openPositions: number; totalShares: Prisma.Decimal; reservedShares: Prisma.Decimal }>();
  for (const position of nonZeroPositions) {
    const existing =
      exposureMap.get(position.userId) ??
      {
        openPositions: 0,
        totalShares: new Prisma.Decimal(0),
        reservedShares: new Prisma.Decimal(0),
      };
    existing.openPositions += 1;
    existing.totalShares = existing.totalShares.add(position.shares);
    existing.reservedShares = existing.reservedShares.add(position.reservedShares);
    exposureMap.set(position.userId, existing);
  }

  const bots: BotMonitorRow[] = credentials.map((credential) => {
    const submitted = submittedMap.get(credential.id);
    const fills = fillMap.get(credential.id);
    const exposure = exposureMap.get(credential.userId);
    const availableUSDC = credential.user.balance?.availableUSDC ?? null;
    const lockedUSDC = credential.user.balance?.lockedUSDC ?? null;
    const totalUSDC =
      availableUSDC && lockedUSDC ? availableUSDC.add(lockedUSDC).toString() : null;
    const score = healthScore({
      isDisabled: credential.isDisabled || credential.status === "REVOKED",
      readOnly: credential.readOnly,
      errorsToday: errorMap.get(credential.id) ?? 0,
      rateLimitHitsToday: rateLimitMap.get(credential.id) ?? 0,
      fillsToday: fills?.count ?? 0,
      ordersSubmittedToday: submitted?.count ?? 0,
      lastUsedAt: credential.lastUsedAt,
    });

    return {
      id: credential.id,
      userId: credential.userId,
      botName: credential.name,
      userLabel: toDisplayUser(credential.user),
      keyId: credential.keyId,
      status: credential.status,
      isDisabled: credential.isDisabled,
      readOnly: credential.readOnly,
      scopes: credential.scopes,
      openOrders: openOrderMap.get(credential.id) ?? 0,
      ordersSubmittedToday: submitted?.count ?? 0,
      fillsToday: fills?.count ?? 0,
      errorsToday: errorMap.get(credential.id) ?? 0,
      rateLimitHitsToday: rateLimitMap.get(credential.id) ?? 0,
      idempotencyConflictsToday: idempotencyMap.get(credential.id) ?? 0,
      pausedReason: PAUSE_REASON_CODES.has(latestUsageMap.get(credential.id)?.resultCode ?? "")
        ? latestUsageMap.get(credential.id)?.resultCode ?? null
        : null,
      lastUsedAt: toIsoString(credential.lastUsedAt),
      lastEventTime: lastEventMap.get(credential.userId) ?? null,
      balance:
        availableUSDC && lockedUSDC
          ? {
              availableUSDC: availableUSDC.toString(),
              lockedUSDC: lockedUSDC.toString(),
              totalUSDC: totalUSDC ?? "0",
            }
          : null,
      exposure: {
        openPositions: exposure?.openPositions ?? 0,
        totalShares: exposure ? exposure.totalShares.toString() : "0",
        reservedShares: exposure ? exposure.reservedShares.toString() : "0",
      },
      limits: {
        maxOrderSize: credential.maxOrderSize?.toString() ?? null,
        maxOrderNotional: credential.maxOrderNotional?.toString() ?? null,
        maxOpenOrders: credential.maxOpenOrders ?? null,
        maxDailySubmittedNotional: credential.maxDailySubmittedNotional?.toString() ?? null,
        allowedMarketIds: credential.allowedMarketIds,
      },
      submittedNotionalUsed: submitted?.notional ?? "0",
      healthScore: score,
      healthLabel: healthLabel(score, credential.isDisabled || credential.status === "REVOKED"),
    };
  });

  const feed: BotMonitorFeedItem[] = [];

  for (const item of recentRequests) {
    if (!item.apiCredential || !item.order) continue;
    feed.push({
      id: `req:${item.id}`,
      ts: item.createdAt.toISOString(),
      botId: item.apiCredential.id,
      botName: item.apiCredential.name,
      userLabel: toDisplayUser(item.apiCredential.user),
      keyId: item.apiCredential.keyId,
      eventType: "order.submitted",
      marketLabel: item.order.market.title,
      orderId: item.order.id,
      resultCode: "OK",
      details: `${item.order.side} ${item.order.amount.toString()} @ ${item.order.price.toString()}`,
    });
  }

  for (const item of recentUsage) {
    const apiCredential = item.apiCredential;
    feed.push({
      id: `usage:${item.id}`,
      ts: item.createdAt.toISOString(),
      botId: apiCredential?.id ?? null,
      botName: apiCredential?.name ?? "Unknown key",
      userLabel: apiCredential ? toDisplayUser(apiCredential.user) : toDisplayUser(item.user),
      keyId: apiCredential?.keyId ?? null,
      eventType:
        item.routeId === "orders:delete" && item.resultCode === "OK"
          ? "order.canceled"
          : item.resultCode === "DAILY_NOTIONAL_LIMIT_EXCEEDED"
            ? "policy.daily-notional-exhausted"
          : item.resultCode === "RATE_LIMIT_EXCEEDED"
            ? "rate-limit.rejected"
            : item.resultCode === "IDEMPOTENCY_KEY_CONFLICT"
              ? "idempotency.conflict"
              : item.resultCode === "INSUFFICIENT_SCOPE"
                ? "scope.rejected"
                : item.resultCode === "API_KEY_DISABLED" || item.resultCode === "API_KEY_READ_ONLY"
                  ? "policy.rejected"
                  : "api.error",
      marketLabel: null,
      orderId: item.orderId,
      resultCode: item.resultCode,
      details: `${item.method} ${item.path} -> ${item.responseStatus}`,
    });
  }

  for (const item of recentFills) {
    feed.push({
      id: `fill:${item.apiCredentialId}:${item.id}:${item.role}`,
      ts: item.createdAt.toISOString(),
      botId: item.apiCredentialId,
      botName: item.botName,
      userLabel: item.userLabel,
      keyId: item.keyId,
      eventType: "fill.received",
      marketLabel: item.marketTitle,
      orderId: item.orderId,
      resultCode: "OK",
      details: `${item.role} ${item.side} ${item.size} @ ${item.price}`,
    });
  }

  const recentAccountEvents = await prisma.canonicalEvent.findMany({
    where: {
      stream: "ACCOUNT",
      userId: { in: credentials.map((item) => item.userId) },
      createdAt: { gte: activityStart },
    },
    orderBy: [{ id: "desc" }],
    take: 20,
  });

  const userToPrimaryBot = new Map<string, BotMonitorRow>();
  for (const bot of bots) {
    if (!userToPrimaryBot.has(bot.userId)) {
      userToPrimaryBot.set(bot.userId, bot);
    }
  }

  for (const item of recentAccountEvents) {
    const bot = item.userId ? userToPrimaryBot.get(item.userId) : null;
    feed.push({
      id: `event:${item.id.toString()}`,
      ts: item.createdAt.toISOString(),
      botId: bot?.id ?? null,
      botName: bot?.botName ?? "Shared account stream",
      userLabel: bot?.userLabel ?? "Unknown user",
      keyId: bot?.keyId ?? null,
      eventType: item.eventType,
      marketLabel: null,
      orderId: null,
      resultCode: "OK",
      details: item.eventType,
    });
  }

  const fillOverview = fillOverviewRows[0] ?? {
    totalFillsToday: 0,
    totalNotionalFilledToday: "0",
  };

  return {
    generatedAt: now.toISOString(),
    overview: {
      activeBots: bots.filter(
        (bot) => bot.lastUsedAt && new Date(bot.lastUsedAt).getTime() >= activeCutoff.getTime()
      ).length,
      totalOpenOrders: bots.reduce((sum, bot) => sum + bot.openOrders, 0),
      totalFillsToday: Number(fillOverview.totalFillsToday),
      totalNotionalSubmittedToday: submittedToday
        .reduce((sum, row) => sum.add(row._sum.submittedNotional ?? 0), new Prisma.Decimal(0))
        .toString(),
      totalNotionalFilledToday: fillOverview.totalNotionalFilledToday,
      totalApiErrorsToday: errorTodayByCredential.reduce((sum, row) => sum + row._count._all, 0),
      totalRateLimitHitsToday: rateLimitTodayByCredential.reduce((sum, row) => sum + row._count._all, 0),
      totalIdempotencyConflictsToday: idempotencyConflictByCredential.reduce(
        (sum, row) => sum + row._count._all,
        0
      ),
    },
    bots: bots.sort((left, right) => right.healthScore - left.healthScore),
    feed: feed
      .sort((left, right) => right.ts.localeCompare(left.ts))
      .slice(0, DEFAULT_FEED_LIMIT),
    marketActivity: buildMarketActivity({
      orderRows: recentOrderRows
        .filter((item) => item.order)
        .map((item) => ({
          marketId: item.order!.marketId,
          marketTitle: item.order!.market.title,
          apiCredentialId: item.apiCredentialId,
          createdAt: item.createdAt,
        })),
      fillRows: recentFills,
    }),
    riskSummary: buildRiskSummary(riskSummaryRows),
  };
};

export const getAdminBotMonitorDetail = async (apiCredentialId: string): Promise<BotMonitorDetail | null> => {
  const snapshot = await getAdminBotMonitorSnapshot();
  const activityStart = getBotRunStartDate();
  const bot = snapshot.bots.find((item) => item.id === apiCredentialId);
  if (!bot) return null;

  const credential = await prisma.apiCredential.findUnique({
    where: { id: apiCredentialId },
    include: {
      user: {
        include: {
          balance: true,
        },
      },
    },
  });
  if (!credential) return null;

  const [
    recentUsage,
    recentOrders,
    recentFills,
    recentLedger,
    recentEvents,
    errorCounts,
    openOrdersSummary,
    positions,
  ] = await Promise.all([
    prisma.apiCredentialUsageLog.findMany({
      where: {
        apiCredentialId,
        ...(activityStart ? { createdAt: { gte: activityStart } } : {}),
      },
      orderBy: [{ createdAt: "desc" }],
      take: DEFAULT_DETAIL_LIMIT,
    }),
    prisma.order.findMany({
      where: {
        createdApiCredentialId: apiCredentialId,
        ...(activityStart ? { createdAt: { gte: activityStart } } : {}),
      },
      orderBy: [{ createdAt: "desc" }],
      take: DEFAULT_DETAIL_LIMIT,
      include: {
        market: { select: { title: true } },
        outcome: { select: { name: true } },
      },
    }),
    getDetailAttributedFills(apiCredentialId, DEFAULT_DETAIL_LIMIT, activityStart ?? undefined),
    prisma.ledgerEntry.findMany({
      where: {
        userId: credential.userId,
        ...(activityStart ? { createdAt: { gte: activityStart } } : {}),
      },
      orderBy: [{ createdAt: "desc" }],
      take: DEFAULT_DETAIL_LIMIT,
    }),
    prisma.canonicalEvent.findMany({
      where: {
        stream: "ACCOUNT",
        userId: credential.userId,
        ...(activityStart ? { createdAt: { gte: activityStart } } : {}),
      },
      orderBy: [{ id: "desc" }],
      take: DEFAULT_DETAIL_LIMIT,
    }),
    prisma.apiCredentialUsageLog.groupBy({
      by: ["resultCode"],
      where: {
        apiCredentialId,
        ...(activityStart ? { createdAt: { gte: activityStart } } : {}),
        responseStatus: { gte: 400 },
      },
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: {
        createdApiCredentialId: apiCredentialId,
        status: { in: [...OPEN_ORDER_STATUSES] },
      },
      _count: { _all: true },
      _sum: { reservedNotional: true },
    }),
    prisma.position.findMany({
      where: {
        userId: credential.userId,
        OR: [
          { shares: { not: "0" } },
          { reservedShares: { not: "0" } },
        ],
      },
      orderBy: [{ updatedAt: "desc" }],
      take: DEFAULT_DETAIL_LIMIT,
      include: {
        market: { select: { title: true } },
        outcome: { select: { name: true } },
      },
    }),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    bot,
    metadata: {
      createdAt: credential.createdAt.toISOString(),
      revokedAt: toIsoString(credential.revokedAt),
      lastUsedAt: toIsoString(credential.lastUsedAt),
    },
    recentUsage: recentUsage.map((item) => ({
      id: item.id,
      ts: item.createdAt.toISOString(),
      method: item.method,
      routeId: item.routeId,
      path: item.path,
      responseStatus: item.responseStatus,
      resultCode: item.resultCode,
      orderId: item.orderId ?? null,
    })),
    recentOrders: recentOrders.map((item) => ({
      id: item.id,
      marketId: item.marketId,
      marketTitle: item.market.title,
      outcomeId: item.outcomeId,
      outcomeName: item.outcome.name,
      side: item.side,
      price: item.price.toString(),
      amount: item.amount.toString(),
      remaining: item.remaining.toString(),
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
    recentFills: recentFills.map((item) => ({
      id: item.id,
      ts: item.createdAt.toISOString(),
      role: item.role,
      marketId: item.marketId,
      marketTitle: item.marketTitle,
      outcomeId: item.outcomeId,
      outcomeName: item.outcomeName,
      side: item.side,
      price: item.price,
      size: item.size,
      notionalUSDC: item.notionalUSDC,
      feeUSDC: item.feeUSDC,
      orderId: item.orderId,
    })),
    recentLedger: recentLedger.map((item) => ({
      id: item.id,
      ts: item.createdAt.toISOString(),
      operation: item.operation,
      reason: item.reason,
      amountDelta: item.amountDelta.toString(),
      deltaAvailableUSDC: item.deltaAvailableUSDC?.toString() ?? null,
      deltaLockedUSDC: item.deltaLockedUSDC?.toString() ?? null,
      referenceType: item.referenceType ?? null,
      referenceId: item.referenceId ?? null,
    })),
    recentEvents: recentEvents.map((item) => ({
      id: item.id.toString(),
      ts: item.createdAt.toISOString(),
      type: item.eventType,
      marketId: item.marketId ?? null,
      payload: item.payload,
    })),
    errorCounts: buildRiskSummary(errorCounts),
    openOrdersSummary: {
      count: openOrdersSummary._count._all,
      reservedNotional: toDecimalString(openOrdersSummary._sum.reservedNotional),
    },
    positions: positions.map((item) => ({
      id: item.id,
      marketId: item.marketId,
      marketTitle: item.market.title,
      outcomeId: item.outcomeId,
      outcomeName: item.outcome.name,
      shares: item.shares.toString(),
      reservedShares: item.reservedShares.toString(),
      avgCost: item.avgCost.toString(),
      realizedPnl: item.realizedPnl.toString(),
    })),
  };
};
