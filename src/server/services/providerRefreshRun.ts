import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type JsonObject = Record<string, unknown>;

export type ProviderRefreshRunInput = {
  providerSource: string;
  referenceSource: string;
  status: string;
  mode: string;
  startedAt: Date | string;
  finishedAt?: Date | string | null;
  eventSlug?: string | null;
  providerEventId?: string | null;
  sportKey?: string | null;
  selectedMarketId?: string | null;
  selectedOutcomeId?: string | null;
  refreshIterations?: number;
  providerCallCount?: number;
  quotaCost?: number;
  requestsRemaining?: string | null;
  maxCredits?: number | null;
  minRemaining?: number | null;
  marketCount?: number;
  outcomeCount?: number;
  snapshotCount?: number;
  staleBeforeRefresh?: boolean;
  readyAfterRefresh?: boolean;
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

const durationMs = (startedAt: Date, finishedAt: Date | null) =>
  finishedAt ? Math.max(0, finishedAt.getTime() - startedAt.getTime()) : null;

export const compactProviderRefreshRunRow = (row: Awaited<ReturnType<typeof prisma.providerRefreshRun.upsert>>) => ({
  runKey: row.runKey,
  providerSource: row.providerSource,
  referenceSource: row.referenceSource,
  status: row.status,
  mode: row.mode,
  startedAt: row.startedAt.toISOString(),
  finishedAt: row.finishedAt?.toISOString() ?? null,
  durationMs: row.durationMs,
  eventSlug: row.eventSlug,
  providerEventId: row.providerEventId,
  sportKey: row.sportKey,
  selectedMarketId: row.selectedMarketId,
  selectedOutcomeId: row.selectedOutcomeId,
  refreshIterations: row.refreshIterations,
  providerCallCount: row.providerCallCount,
  quotaCost: row.quotaCost,
  requestsRemaining: row.requestsRemaining,
  maxCredits: row.maxCredits,
  minRemaining: row.minRemaining,
  marketCount: row.marketCount,
  outcomeCount: row.outcomeCount,
  snapshotCount: row.snapshotCount,
  staleBeforeRefresh: row.staleBeforeRefresh,
  readyAfterRefresh: row.readyAfterRefresh,
  updatedAt: row.updatedAt.toISOString(),
  metadata: {
    source: stringValue(objectValue(row.metadata).source),
    emittedBy: stringValue(objectValue(row.metadata).emittedBy),
    quotaProtected: objectValue(row.metadata).quotaProtected === true,
  },
});

export async function writeProviderRefreshRun(input: ProviderRefreshRunInput) {
  const startedAt = dateValue(input.startedAt);
  if (!startedAt) throw new Error("Provider refresh run requires a valid startedAt.");
  const finishedAt = dateValue(input.finishedAt ?? null);
  const runKey = [
    input.providerSource,
    input.referenceSource,
    input.eventSlug ?? input.providerEventId ?? "unknown-event",
    startedAt.toISOString(),
  ].join(":");
  const payload = {
    providerSource: input.providerSource,
    referenceSource: input.referenceSource,
    status: input.status,
    mode: input.mode,
    startedAt,
    finishedAt,
    durationMs: durationMs(startedAt, finishedAt),
    eventSlug: input.eventSlug ?? null,
    providerEventId: input.providerEventId ?? null,
    sportKey: input.sportKey ?? null,
    selectedMarketId: input.selectedMarketId ?? null,
    selectedOutcomeId: input.selectedOutcomeId ?? null,
    refreshIterations: intValue(input.refreshIterations),
    providerCallCount: intValue(input.providerCallCount),
    quotaCost: intValue(input.quotaCost),
    requestsRemaining: input.requestsRemaining ?? null,
    maxCredits: input.maxCredits ?? null,
    minRemaining: input.minRemaining ?? null,
    marketCount: intValue(input.marketCount),
    outcomeCount: intValue(input.outcomeCount),
    snapshotCount: intValue(input.snapshotCount),
    staleBeforeRefresh: input.staleBeforeRefresh ?? false,
    readyAfterRefresh: input.readyAfterRefresh ?? false,
    metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
  };

  const row = await prisma.providerRefreshRun.upsert({
    where: { runKey },
    create: { runKey, ...payload },
    update: payload,
  });

  return compactProviderRefreshRunRow(row);
}
