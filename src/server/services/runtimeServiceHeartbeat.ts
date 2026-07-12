import { prisma } from "@/lib/db";

type JsonObject = Record<string, unknown>;

export type RuntimeHeartbeatInput = {
  serviceName: string;
  serviceKind: string;
  status: string;
  pid?: number | null;
  running?: boolean;
  continuous?: boolean | null;
  usesProviderQuota?: boolean;
  installedOsService?: boolean;
  statePath?: string | null;
  startedAt?: Date | string | null;
  heartbeatAt?: Date;
  source: string;
  metadata?: JsonObject;
};

const dateValue = (value: Date | string | null | undefined) => {
  if (value instanceof Date) return value;
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed) : null;
};

const objectValue = (value: unknown): JsonObject => (value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {});

const stringValue = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : null);

export const compactRuntimeHeartbeatRow = (row: Awaited<ReturnType<typeof prisma.runtimeServiceHeartbeat.upsert>>) => ({
  serviceKey: row.serviceKey,
  serviceName: row.serviceName,
  serviceKind: row.serviceKind,
  status: row.status,
  pid: row.pid,
  running: row.running,
  continuous: row.continuous,
  usesProviderQuota: row.usesProviderQuota,
  installedOsService: row.installedOsService,
  statePath: row.statePath,
  startedAt: row.startedAt?.toISOString() ?? null,
  heartbeatAt: row.heartbeatAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  metadata: {
    source: stringValue(objectValue(row.metadata).source),
    workerOwned: objectValue(row.metadata).workerOwned === true,
    workerHeartbeatAt: stringValue(objectValue(row.metadata).workerHeartbeatAt),
    workerSource: stringValue(objectValue(row.metadata).workerSource),
  },
});

export async function writeRuntimeServiceHeartbeat(input: RuntimeHeartbeatInput) {
  const heartbeatAt = input.heartbeatAt ?? new Date();
  const serviceKey = `local:${input.serviceName}`;
  const existing = await prisma.runtimeServiceHeartbeat.findUnique({
    where: { serviceKey },
    select: { metadata: true },
  });
  const existingMetadata = objectValue(existing?.metadata);
  const workerMetadata =
    input.source === "local-runtime-worker"
      ? {
          workerOwned: true,
          workerHeartbeatAt: heartbeatAt.toISOString(),
          workerSource: input.source,
        }
      : existingMetadata.workerOwned === true
        ? {
            workerOwned: true,
            workerHeartbeatAt: stringValue(existingMetadata.workerHeartbeatAt),
            workerSource: stringValue(existingMetadata.workerSource),
          }
        : {};
  const payload = {
    serviceName: input.serviceName,
    serviceKind: input.serviceKind,
    status: input.status,
    pid: input.pid ?? null,
    running: input.running ?? input.status === "running",
    continuous: input.continuous ?? null,
    usesProviderQuota: input.usesProviderQuota ?? false,
    installedOsService: input.installedOsService ?? false,
    statePath: input.statePath ?? null,
    startedAt: dateValue(input.startedAt ?? null),
    heartbeatAt,
    metadata: {
      ...workerMetadata,
      ...(input.metadata ?? {}),
      source: input.source,
    },
  };

  const row = await prisma.runtimeServiceHeartbeat.upsert({
    where: { serviceKey },
    create: {
      serviceKey,
      ...payload,
    },
    update: payload,
  });

  return compactRuntimeHeartbeatRow(row);
}
