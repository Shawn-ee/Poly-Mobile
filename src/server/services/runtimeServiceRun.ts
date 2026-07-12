import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

type JsonObject = Record<string, unknown>;

export type RuntimeServiceRunInput = {
  serviceName: string;
  serviceKind: string;
  status: string;
  startedAt: Date | string;
  finishedAt?: Date | string | null;
  iterationCount?: number;
  providerQuotaUsed?: boolean;
  activeSettlementExecuted?: boolean;
  installedOsService?: boolean;
  eventSlug?: string | null;
  selectedMarketId?: string | null;
  resultAction?: string | null;
  summaryPath?: string | null;
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

const durationMs = (startedAt: Date, finishedAt: Date | null) =>
  finishedAt ? Math.max(0, finishedAt.getTime() - startedAt.getTime()) : null;

export const compactRuntimeServiceRunRow = (row: Awaited<ReturnType<typeof prisma.runtimeServiceRun.upsert>>) => ({
  runKey: row.runKey,
  serviceKey: row.serviceKey,
  serviceName: row.serviceName,
  serviceKind: row.serviceKind,
  status: row.status,
  startedAt: row.startedAt.toISOString(),
  finishedAt: row.finishedAt?.toISOString() ?? null,
  durationMs: row.durationMs,
  iterationCount: row.iterationCount,
  providerQuotaUsed: row.providerQuotaUsed,
  activeSettlementExecuted: row.activeSettlementExecuted,
  installedOsService: row.installedOsService,
  eventSlug: row.eventSlug,
  selectedMarketId: row.selectedMarketId,
  resultAction: row.resultAction,
  summaryPath: row.summaryPath,
  updatedAt: row.updatedAt.toISOString(),
  metadata: {
    source: stringValue(objectValue(row.metadata).source),
    emittedBy: stringValue(objectValue(row.metadata).emittedBy),
    workerOwned: objectValue(row.metadata).workerOwned === true,
  },
});

export async function writeRuntimeServiceRun(input: RuntimeServiceRunInput) {
  const startedAt = dateValue(input.startedAt);
  if (!startedAt) throw new Error("Runtime service run requires a valid startedAt.");
  const finishedAt = dateValue(input.finishedAt ?? null);
  const serviceKey = `local:${input.serviceName}`;
  const runKey = `${serviceKey}:${startedAt.toISOString()}`;

  const row = await prisma.runtimeServiceRun.upsert({
    where: { runKey },
    create: {
      runKey,
      serviceKey,
      serviceName: input.serviceName,
      serviceKind: input.serviceKind,
      status: input.status,
      startedAt,
      finishedAt,
      durationMs: durationMs(startedAt, finishedAt),
      iterationCount: input.iterationCount ?? 0,
      providerQuotaUsed: input.providerQuotaUsed ?? false,
      activeSettlementExecuted: input.activeSettlementExecuted ?? false,
      installedOsService: input.installedOsService ?? false,
      eventSlug: input.eventSlug ?? null,
      selectedMarketId: input.selectedMarketId ?? null,
      resultAction: input.resultAction ?? null,
      summaryPath: input.summaryPath ?? null,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
    update: {
      status: input.status,
      finishedAt,
      durationMs: durationMs(startedAt, finishedAt),
      iterationCount: input.iterationCount ?? 0,
      providerQuotaUsed: input.providerQuotaUsed ?? false,
      activeSettlementExecuted: input.activeSettlementExecuted ?? false,
      installedOsService: input.installedOsService ?? false,
      eventSlug: input.eventSlug ?? null,
      selectedMarketId: input.selectedMarketId ?? null,
      resultAction: input.resultAction ?? null,
      summaryPath: input.summaryPath ?? null,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });

  return compactRuntimeServiceRunRow(row);
}
