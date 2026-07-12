import { EventEmitter } from "events";
import { CanonicalEventStream, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { serializeForApi } from "@/lib/canonicalApi";
import { buildPublicOrderbookSnapshot } from "@/server/services/orderbookSnapshot";
import { getPublicTradeTape } from "@/server/services/publicTradeTape";

const bus = new EventEmitter();
bus.setMaxListeners(0);

const OPEN_STATUSES: OrderStatus[] = ["OPEN", "PARTIAL"];
const MAX_LEVELS = 20;
const MAX_TRADES = 100;
const MAX_USER_FILLS = 50;
const MAX_REPLAY_EVENTS = 500;
const POLL_INTERVAL_MS = 1_000;
const EVENT_RETENTION_DAYS = 7;

type MarketTopic = `market:${string}`;
type UserTopic = `user:${string}`;
type Topic = MarketTopic | UserTopic;

export type CanonicalStreamEnvelope<TPayload> = {
  id: string;
  sequence: string;
  type: string;
  ts: string;
  stream: "market" | "account";
  marketId: string | null;
  outcomeId: string | null;
  userId: string | null;
  payload: TPayload;
};

export type MarketStreamPayload = {
  topLevels: {
    bids: Array<{
      outcomeId: string;
      price: string;
      size: string;
    }>;
    asks: Array<{
      outcomeId: string;
      price: string;
      size: string;
    }>;
  };
  recentTrades: Array<{
    id: string;
    executionId: string;
    marketId: string;
    outcomeId: string;
    outcomeName: string;
    outcome: string;
    side: "BUY" | "SELL";
    price: string;
    quantity: string;
    shares: string;
    cost: string;
    createdAt: string;
  }>;
};

export type UserStreamPayload = {
  balance: {
    availableUSDC: string;
    lockedUSDC: string;
    totalUSDC: string;
  } | null;
  orders: Array<{
    id: string;
    clientOrderId: string | null;
    apiKeyId: string | null;
    marketId: string;
    outcomeId: string;
    outcomeName: string;
    side: "BUY" | "SELL";
    price: string;
    amount: string;
    remaining: string;
    status: string;
    createdAt: string;
  }>;
  fills: Array<{
    id: string;
    marketId: string;
    outcomeId: string;
    side: "BUY" | "SELL";
    price: string;
    size: string;
    feeUSDC: string;
    createdAt: string;
  }>;
};

export type MarketUpdateEvent = CanonicalStreamEnvelope<MarketStreamPayload>;
export type UserUpdateEvent = CanonicalStreamEnvelope<UserStreamPayload>;

type MarketListener = (payload: MarketUpdateEvent) => void;
type UserListener = (payload: UserUpdateEvent) => void;

const marketTopic = (marketId: string) => `market:${marketId}` as const;
const userTopic = (userId: string) => `user:${userId}` as const;

const toTopicKey = (stream: "market" | "account", id: string) =>
  stream === "market" ? marketTopic(id) : userTopic(id);

const parseEventId = (value: string | number | bigint | null | undefined) => {
  if (value === null || value === undefined) {
    return null;
  }

  try {
    return BigInt(value);
  } catch {
    return null;
  }
};

const normalizeRowToEnvelope = <TPayload>(row: {
  id: bigint;
  eventType: string;
  marketId: string | null;
  outcomeId: string | null;
  userId: string | null;
  createdAt: Date;
  stream: CanonicalEventStream;
  payload: unknown;
}) =>
  ({
    id: row.id.toString(),
    sequence: row.id.toString(),
    type: row.eventType,
    ts: row.createdAt.toISOString(),
    stream: row.stream === "MARKET" ? "market" : "account",
    marketId: row.marketId ?? null,
    outcomeId: row.outcomeId ?? null,
    userId: row.userId ?? null,
    payload: row.payload as TPayload,
  }) satisfies CanonicalStreamEnvelope<TPayload>;

const subscribeToTopic = <T>(topic: Topic, listener: (payload: T) => void) => {
  bus.on(topic, listener);
  return () => {
    bus.off(topic, listener);
  };
};

const createEvent = async <TPayload>(params: {
  stream: "market" | "account";
  topicId: string;
  type: string;
  marketId?: string | null;
  outcomeId?: string | null;
  userId?: string | null;
  payload: TPayload;
}) => {
  const stream = params.stream === "market" ? CanonicalEventStream.MARKET : CanonicalEventStream.ACCOUNT;
  const topicKey = toTopicKey(params.stream, params.topicId);
  const storedPayload = serializeForApi(params.payload);
  const row = await prisma.canonicalEvent.create({
    data: {
      stream,
      topicKey,
      eventType: params.type,
      marketId: params.marketId ?? null,
      outcomeId: params.outcomeId ?? null,
      userId: params.userId ?? null,
      payload: storedPayload as object,
    },
  });

  const envelope = normalizeRowToEnvelope<TPayload>({
    ...row,
    payload: storedPayload,
  });

  bus.emit(topicKey, envelope);
  return envelope;
};

const buildMarketPayload = async (params: { marketId: string; outcomeId?: string | null }) => {
  const outcomeId = params.outcomeId ?? null;
  const [book, trades] = await Promise.all([
    buildPublicOrderbookSnapshot({
      marketId: params.marketId,
      outcomeId,
      maxLevels: MAX_LEVELS,
    }),
    getPublicTradeTape({
      marketId: params.marketId,
      outcomeId,
      limit: MAX_TRADES,
    }),
  ]);

  return {
    topLevels: {
      bids: book.bids.map((row) => ({
        outcomeId: row.outcomeId,
        price: row.price.toString(),
        size: row.size.toString(),
      })),
      asks: book.asks.map((row) => ({
        outcomeId: row.outcomeId,
        price: row.price.toString(),
        size: row.size.toString(),
      })),
    },
    recentTrades: trades.map((item) => ({
      id: item.id,
      executionId: item.executionId,
      marketId: item.marketId,
      outcomeId: item.outcomeId,
      outcomeName: item.outcomeName,
      outcome: item.outcome,
      side: item.side,
      price: item.price.toString(),
      quantity: item.quantity.toString(),
      shares: item.shares.toString(),
      cost: item.cost.toString(),
      createdAt: item.createdAt.toISOString(),
    })),
  } satisfies MarketStreamPayload;
};

const buildUserPayload = async (params: { userId: string; marketId?: string | null }) => {
  const marketId = params.marketId ?? null;
  const whereMarket = marketId ? { marketId } : {};

  const [balance, orders, fills] = await Promise.all([
    prisma.userBalance.findUnique({
      where: { userId: params.userId },
      select: { availableUSDC: true, lockedUSDC: true },
    }),
    prisma.order.findMany({
      where: {
        userId: params.userId,
        status: { in: OPEN_STATUSES },
        ...whereMarket,
      },
      orderBy: [{ createdAt: "desc" }],
      include: {
        outcome: { select: { name: true } },
        apiOrderRequest: { select: { clientOrderId: true } },
        createdApiCredential: { select: { keyId: true } },
      },
    }),
    prisma.fill.findMany({
      where: {
        OR: [{ takerUserId: params.userId }, { makerUserId: params.userId }],
        ...whereMarket,
      },
      orderBy: [{ createdAt: "desc" }],
      take: MAX_USER_FILLS,
    }),
  ]);

  return {
    balance: balance
      ? {
          availableUSDC: balance.availableUSDC.toString(),
          lockedUSDC: balance.lockedUSDC.toString(),
          totalUSDC: balance.availableUSDC.add(balance.lockedUSDC).toString(),
        }
      : null,
    orders: orders.map((item) => ({
      id: item.id,
      clientOrderId: item.apiOrderRequest?.clientOrderId ?? null,
      apiKeyId: item.createdApiCredential?.keyId ?? null,
      marketId: item.marketId,
      outcomeId: item.outcomeId,
      outcomeName: item.outcome.name,
      side: item.side,
      price: item.price.toString(),
      amount: item.amount.toString(),
      remaining: item.remaining.toString(),
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    })),
    fills: fills.map((fill) => ({
      id: fill.id,
      marketId: fill.marketId,
      outcomeId: fill.outcomeId,
      side: fill.side,
      price: fill.price.toString(),
      size: fill.size.toString(),
      feeUSDC: fill.feeUSDC.toString(),
      createdAt: fill.createdAt.toISOString(),
    })),
  } satisfies UserStreamPayload;
};

const buildBootstrapEvent = async (
  params:
    | { stream: "market"; marketId: string; outcomeId?: string | null }
    | { stream: "account"; userId: string; marketId?: string | null }
) => {
  if (params.stream === "market") {
    return {
      id: null,
      sequence: null,
      type: "quote.snapshot",
      ts: new Date().toISOString(),
      stream: "market" as const,
      marketId: params.marketId,
      outcomeId: params.outcomeId ?? null,
      userId: null,
      payload: await buildMarketPayload({
        marketId: params.marketId,
        outcomeId: params.outcomeId ?? null,
      }),
    };
  }

  return {
    id: null,
    sequence: null,
    type: "account.snapshot",
    ts: new Date().toISOString(),
    stream: "account" as const,
    marketId: params.marketId ?? null,
    outcomeId: null,
    userId: params.userId,
    payload: await buildUserPayload({
      userId: params.userId,
      marketId: params.marketId ?? null,
    }),
  };
};

export const subscribeToMarketUpdates = (marketId: string, listener: MarketListener) =>
  subscribeToTopic(marketTopic(marketId), listener);

export const subscribeToUserUpdates = (userId: string, listener: UserListener) =>
  subscribeToTopic(userTopic(userId), listener);

export const getMarketEventsSince = async (params: {
  marketId: string;
  lastSequence: string | number | bigint;
  outcomeId?: string | null;
}) => {
  const lastId = parseEventId(params.lastSequence);
  if (lastId === null) {
    return [] as MarketUpdateEvent[];
  }

  const rows = await prisma.canonicalEvent.findMany({
    where: {
      stream: "MARKET",
      topicKey: marketTopic(params.marketId),
      id: { gt: lastId },
      ...(params.outcomeId ? { outcomeId: params.outcomeId } : {}),
    },
    orderBy: [{ id: "asc" }],
    take: MAX_REPLAY_EVENTS,
  });

  return rows.map((row) => normalizeRowToEnvelope<MarketStreamPayload>(row));
};

export const getUserEventsSince = async (params: {
  userId: string;
  lastSequence: string | number | bigint;
  marketId?: string | null;
}) => {
  const lastId = parseEventId(params.lastSequence);
  if (lastId === null) {
    return [] as UserUpdateEvent[];
  }

  const rows = await prisma.canonicalEvent.findMany({
    where: {
      stream: "ACCOUNT",
      topicKey: userTopic(params.userId),
      id: { gt: lastId },
      ...(params.marketId ? { marketId: params.marketId } : {}),
    },
    orderBy: [{ id: "asc" }],
    take: MAX_REPLAY_EVENTS,
  });

  return rows.map((row) => normalizeRowToEnvelope<UserStreamPayload>(row));
};

export const emitMarketUpdate = async (params: { marketId: string; outcomeId?: string | null }) =>
  createEvent({
    stream: "market",
    topicId: params.marketId,
    type: "quote.updated",
    marketId: params.marketId,
    outcomeId: params.outcomeId ?? null,
    userId: null,
    payload: await buildMarketPayload(params),
  });

export const emitUserUpdate = async (params: { userId: string; marketId?: string | null }) =>
  createEvent({
    stream: "account",
    topicId: params.userId,
    type: "account.updated",
    marketId: params.marketId ?? null,
    outcomeId: null,
    userId: params.userId,
    payload: await buildUserPayload(params),
  });

export const emitMarketSettlementAuditEvent = async (params: {
  marketId: string;
  outcomeId?: string | null;
  type: "settlement.trusted_result.preflight" | "settlement.trusted_result.blocked" | "settlement.trusted_result.executed";
  payload: Record<string, unknown>;
}) =>
  createEvent({
    stream: "market",
    topicId: params.marketId,
    type: params.type,
    marketId: params.marketId,
    outcomeId: params.outcomeId ?? null,
    userId: null,
    payload: params.payload,
  });

export const getMarketBootstrapEvent = (params: { marketId: string; outcomeId?: string | null }) =>
  buildBootstrapEvent({
    stream: "market",
    marketId: params.marketId,
    outcomeId: params.outcomeId ?? null,
  });

export const getUserBootstrapEvent = (params: { userId: string; marketId?: string | null }) =>
  buildBootstrapEvent({
    stream: "account",
    userId: params.userId,
    marketId: params.marketId ?? null,
  });

export const getStreamPollIntervalMs = () => POLL_INTERVAL_MS;
export const getStreamReplayLimit = () => MAX_REPLAY_EVENTS;
export const getCanonicalEventRetentionDays = () => EVENT_RETENTION_DAYS;

export const pruneExpiredCanonicalEvents = async (retentionDays = EVENT_RETENTION_DAYS) => {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  return prisma.canonicalEvent.deleteMany({
    where: {
      createdAt: { lt: cutoff },
    },
  });
};

export const __emitMarketUpdateForTest = (payload: MarketUpdateEvent) => {
  bus.emit(marketTopic(payload.marketId ?? ""), payload);
};

export const __emitUserUpdateForTest = (payload: UserUpdateEvent) => {
  bus.emit(userTopic(payload.userId ?? ""), payload);
};

export const __clearOrderbookEventStateForTest = () => {
  bus.removeAllListeners();
};
