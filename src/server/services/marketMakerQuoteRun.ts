import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type JsonObject = Record<string, unknown>;

export type MarketMakerQuoteRunInput = {
  marketId: string;
  outcomeId: string;
  eventSlug?: string | null;
  status: string;
  mode: string;
  startedAt: Date | string;
  finishedAt?: Date | string | null;
  makerUserId?: string | null;
  bidOrderId?: string | null;
  askOrderId?: string | null;
  providerSource: string;
  referenceBid?: Prisma.Decimal.Value | null;
  referenceAsk?: Prisma.Decimal.Value | null;
  outcomePrice?: Prisma.Decimal.Value | null;
  plannedBid?: Prisma.Decimal.Value | null;
  plannedAsk?: Prisma.Decimal.Value | null;
  quoteOffsetTicks?: number;
  size?: Prisma.Decimal.Value | null;
  mintQuantity?: Prisma.Decimal.Value | null;
  canceledOrderCount?: number;
  restingOrderCount?: number;
  quoteRouteStatus?: number | null;
  shiftedBidWorseThanProvider?: boolean;
  shiftedAskWorseThanProvider?: boolean;
  quoteRouteShowsBid?: boolean;
  quoteRouteShowsAsk?: boolean;
  snapshotFresh?: boolean;
  installedOsService?: boolean;
  metadata?: JsonObject;
};

const dateValue = (value: Date | string | null | undefined) => {
  if (value instanceof Date) return value;
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed) : null;
};

const objectValue = (value: unknown): JsonObject =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};

const stringValue = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : null);

const intValue = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

const decimalValue = (value: Prisma.Decimal.Value | null | undefined) =>
  value == null ? null : new Prisma.Decimal(value);

const durationMs = (startedAt: Date, finishedAt: Date | null) =>
  finishedAt ? Math.max(0, finishedAt.getTime() - startedAt.getTime()) : null;

export const compactMarketMakerQuoteRunRow = (row: Awaited<ReturnType<typeof prisma.marketMakerQuoteRun.upsert>>) => ({
  runKey: row.runKey,
  marketId: row.marketId,
  outcomeId: row.outcomeId,
  eventSlug: row.eventSlug,
  status: row.status,
  mode: row.mode,
  startedAt: row.startedAt.toISOString(),
  finishedAt: row.finishedAt?.toISOString() ?? null,
  durationMs: row.durationMs,
  makerUserId: row.makerUserId,
  bidOrderId: row.bidOrderId,
  askOrderId: row.askOrderId,
  providerSource: row.providerSource,
  referenceBid: row.referenceBid?.toString() ?? null,
  referenceAsk: row.referenceAsk?.toString() ?? null,
  outcomePrice: row.outcomePrice?.toString() ?? null,
  plannedBid: row.plannedBid?.toString() ?? null,
  plannedAsk: row.plannedAsk?.toString() ?? null,
  quoteOffsetTicks: row.quoteOffsetTicks,
  size: row.size?.toString() ?? null,
  mintQuantity: row.mintQuantity?.toString() ?? null,
  canceledOrderCount: row.canceledOrderCount,
  restingOrderCount: row.restingOrderCount,
  quoteRouteStatus: row.quoteRouteStatus,
  shiftedBidWorseThanProvider: row.shiftedBidWorseThanProvider,
  shiftedAskWorseThanProvider: row.shiftedAskWorseThanProvider,
  quoteRouteShowsBid: row.quoteRouteShowsBid,
  quoteRouteShowsAsk: row.quoteRouteShowsAsk,
  snapshotFresh: row.snapshotFresh,
  installedOsService: row.installedOsService,
  updatedAt: row.updatedAt.toISOString(),
  metadata: {
    source: stringValue(objectValue(row.metadata).source),
    emittedBy: stringValue(objectValue(row.metadata).emittedBy),
    localOnly: objectValue(row.metadata).localOnly === true,
  },
});

export async function writeMarketMakerQuoteRun(input: MarketMakerQuoteRunInput) {
  const startedAt = dateValue(input.startedAt);
  if (!startedAt) throw new Error("Market-maker quote run requires a valid startedAt.");
  const finishedAt = dateValue(input.finishedAt ?? null);
  const runKey = [
    input.providerSource,
    input.marketId,
    input.outcomeId,
    startedAt.toISOString(),
  ].join(":");
  const payload = {
    marketId: input.marketId,
    outcomeId: input.outcomeId,
    eventSlug: input.eventSlug ?? null,
    status: input.status,
    mode: input.mode,
    startedAt,
    finishedAt,
    durationMs: durationMs(startedAt, finishedAt),
    makerUserId: input.makerUserId ?? null,
    bidOrderId: input.bidOrderId ?? null,
    askOrderId: input.askOrderId ?? null,
    providerSource: input.providerSource,
    referenceBid: decimalValue(input.referenceBid),
    referenceAsk: decimalValue(input.referenceAsk),
    outcomePrice: decimalValue(input.outcomePrice),
    plannedBid: decimalValue(input.plannedBid),
    plannedAsk: decimalValue(input.plannedAsk),
    quoteOffsetTicks: intValue(input.quoteOffsetTicks),
    size: decimalValue(input.size),
    mintQuantity: decimalValue(input.mintQuantity),
    canceledOrderCount: intValue(input.canceledOrderCount),
    restingOrderCount: intValue(input.restingOrderCount),
    quoteRouteStatus: input.quoteRouteStatus ?? null,
    shiftedBidWorseThanProvider: input.shiftedBidWorseThanProvider ?? false,
    shiftedAskWorseThanProvider: input.shiftedAskWorseThanProvider ?? false,
    quoteRouteShowsBid: input.quoteRouteShowsBid ?? false,
    quoteRouteShowsAsk: input.quoteRouteShowsAsk ?? false,
    snapshotFresh: input.snapshotFresh ?? false,
    installedOsService: input.installedOsService ?? false,
    metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
  };

  const row = await prisma.marketMakerQuoteRun.upsert({
    where: { runKey },
    create: { runKey, ...payload },
    update: payload,
  });

  return compactMarketMakerQuoteRunRow(row);
}
