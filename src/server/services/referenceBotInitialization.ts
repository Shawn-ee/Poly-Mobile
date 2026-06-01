import { Prisma } from "@prisma/client";

export type BotInitializationStatus =
  | "not_started"
  | "reference_verified"
  | "dry_run_ready"
  | "dry_run_running"
  | "live_ready"
  | "live_enabled"
  | "paused"
  | "blocked";

export type BotCapitalMetadata = {
  budgetCents: number | null;
  mintBudgetCents: number | null;
  mintedCompleteSets: number | null;
  cashReserveCents: number | null;
  autoReplenish: boolean;
  initializedAt: string | null;
  initializedBy: string | null;
  botUserId: string | null;
  botUsername: string | null;
  botApiCredentialId: string | null;
  botApiKeyId: string | null;
  maxSingleOrderNotionalCents: number | null;
  maxOpenOrderNotionalCents: number | null;
  maxDailyLossCents: number | null;
};

export type BotRuntimeMetadata = {
  liveOrdersEnabled: boolean;
  emergencyStop: boolean;
  cancelRequestedAt: string | null;
  lastSeededAt: string | null;
  lastLiveRunAt: string | null;
  lastRuntimeSyncAt: string | null;
};

export type BotInitializationMetadata = {
  status: BotInitializationStatus;
  lastCheckedAt: string | null;
  reason: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  riskProfile: string | null;
  capital?: BotCapitalMetadata | null;
  runtime?: BotRuntimeMetadata | null;
  readiness?: {
    ready: boolean;
    dryRun: boolean;
    liveRequested: boolean;
    reasons: string[];
    referenceBid: number | null;
    referenceAsk: number | null;
    plannedBotBid: number | null;
    plannedBotAsk: number | null;
    riskProfile: string | null;
    checkedAt: string | null;
  } | null;
};

export type BotInitializationMetadataPatch = Partial<Omit<BotInitializationMetadata, "capital" | "runtime" | "readiness">> & {
  capital?: Partial<BotCapitalMetadata> | null;
  runtime?: Partial<BotRuntimeMetadata> | null;
  readiness?: Partial<NonNullable<BotInitializationMetadata["readiness"]>> | null;
};

export function parseBotInitializationMetadata(
  value: Prisma.JsonValue | Prisma.InputJsonValue | Record<string, unknown> | null | undefined,
): BotInitializationMetadata | null {
  const object = asJsonObject(value);
  const nested =
    object.botInitialization && typeof object.botInitialization === "object" && !Array.isArray(object.botInitialization)
      ? (object.botInitialization as Record<string, unknown>)
      : object;
  const status = parseStatus(nested.status);
  if (!status) {
    return null;
  }
  const readinessObject =
    nested.readiness && typeof nested.readiness === "object" && !Array.isArray(nested.readiness)
      ? (nested.readiness as Record<string, unknown>)
      : null;
  const capitalObject =
    nested.capital && typeof nested.capital === "object" && !Array.isArray(nested.capital)
      ? (nested.capital as Record<string, unknown>)
      : null;
  const runtimeObject =
    nested.runtime && typeof nested.runtime === "object" && !Array.isArray(nested.runtime)
      ? (nested.runtime as Record<string, unknown>)
      : null;

  return {
    status,
    lastCheckedAt: asStringOrNull(nested.lastCheckedAt),
    reason: asStringOrNull(nested.reason),
    approvedBy: asStringOrNull(nested.approvedBy),
    approvedAt: asStringOrNull(nested.approvedAt),
    riskProfile: asStringOrNull(nested.riskProfile),
    capital: capitalObject
      ? {
          budgetCents: asNumberOrNull(capitalObject.budgetCents),
          mintBudgetCents: asNumberOrNull(capitalObject.mintBudgetCents),
          mintedCompleteSets: asNumberOrNull(capitalObject.mintedCompleteSets),
          cashReserveCents: asNumberOrNull(capitalObject.cashReserveCents),
          autoReplenish: capitalObject.autoReplenish === true,
          initializedAt: asStringOrNull(capitalObject.initializedAt),
          initializedBy: asStringOrNull(capitalObject.initializedBy),
          botUserId: asStringOrNull(capitalObject.botUserId),
          botUsername: asStringOrNull(capitalObject.botUsername),
          botApiCredentialId: asStringOrNull(capitalObject.botApiCredentialId),
          botApiKeyId: asStringOrNull(capitalObject.botApiKeyId),
          maxSingleOrderNotionalCents: asNumberOrNull(capitalObject.maxSingleOrderNotionalCents),
          maxOpenOrderNotionalCents: asNumberOrNull(capitalObject.maxOpenOrderNotionalCents),
          maxDailyLossCents: asNumberOrNull(capitalObject.maxDailyLossCents),
        }
      : null,
    runtime: runtimeObject
      ? {
          liveOrdersEnabled: runtimeObject.liveOrdersEnabled === true,
          emergencyStop: runtimeObject.emergencyStop === true,
          cancelRequestedAt: asStringOrNull(runtimeObject.cancelRequestedAt),
          lastSeededAt: asStringOrNull(runtimeObject.lastSeededAt),
          lastLiveRunAt: asStringOrNull(runtimeObject.lastLiveRunAt),
          lastRuntimeSyncAt: asStringOrNull(runtimeObject.lastRuntimeSyncAt),
        }
      : null,
    readiness: readinessObject
      ? {
          ready: readinessObject.ready === true,
          dryRun: readinessObject.dryRun === true,
          liveRequested: readinessObject.liveRequested === true,
          reasons: Array.isArray(readinessObject.reasons)
            ? readinessObject.reasons.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
            : [],
          referenceBid: asNumberOrNull(readinessObject.referenceBid),
          referenceAsk: asNumberOrNull(readinessObject.referenceAsk),
          plannedBotBid: asNumberOrNull(readinessObject.plannedBotBid),
          plannedBotAsk: asNumberOrNull(readinessObject.plannedBotAsk),
          riskProfile: asStringOrNull(readinessObject.riskProfile),
          checkedAt: asStringOrNull(readinessObject.checkedAt),
        }
      : null,
  };
}

export function mergeBotInitializationMetadata(
  existing: Prisma.JsonValue | Prisma.InputJsonValue | Record<string, unknown> | null | undefined,
  next: BotInitializationMetadataPatch | null | undefined,
): Prisma.InputJsonValue {
  const object = asJsonObject(existing);
  const current = parseBotInitializationMetadata(object);
  const mergedReadiness =
    next?.readiness === undefined
      ? current?.readiness ?? null
      : next.readiness
        ? {
            ready: next.readiness.ready ?? current?.readiness?.ready ?? false,
            dryRun: next.readiness.dryRun ?? current?.readiness?.dryRun ?? true,
            liveRequested: next.readiness.liveRequested ?? current?.readiness?.liveRequested ?? false,
            reasons: next.readiness.reasons ?? current?.readiness?.reasons ?? [],
            referenceBid: next.readiness.referenceBid ?? current?.readiness?.referenceBid ?? null,
            referenceAsk: next.readiness.referenceAsk ?? current?.readiness?.referenceAsk ?? null,
            plannedBotBid: next.readiness.plannedBotBid ?? current?.readiness?.plannedBotBid ?? null,
            plannedBotAsk: next.readiness.plannedBotAsk ?? current?.readiness?.plannedBotAsk ?? null,
            riskProfile: next.readiness.riskProfile ?? current?.readiness?.riskProfile ?? null,
            checkedAt: next.readiness.checkedAt ?? current?.readiness?.checkedAt ?? null,
          }
        : null;
  const mergedCapital =
    next?.capital === undefined
      ? current?.capital ?? null
      : next.capital
        ? {
            budgetCents: next.capital.budgetCents ?? current?.capital?.budgetCents ?? null,
            mintBudgetCents: next.capital.mintBudgetCents ?? current?.capital?.mintBudgetCents ?? null,
            mintedCompleteSets: next.capital.mintedCompleteSets ?? current?.capital?.mintedCompleteSets ?? null,
            cashReserveCents: next.capital.cashReserveCents ?? current?.capital?.cashReserveCents ?? null,
            autoReplenish: next.capital.autoReplenish ?? current?.capital?.autoReplenish ?? false,
            initializedAt: next.capital.initializedAt ?? current?.capital?.initializedAt ?? null,
            initializedBy: next.capital.initializedBy ?? current?.capital?.initializedBy ?? null,
            botUserId: next.capital.botUserId ?? current?.capital?.botUserId ?? null,
            botUsername: next.capital.botUsername ?? current?.capital?.botUsername ?? null,
            botApiCredentialId: next.capital.botApiCredentialId ?? current?.capital?.botApiCredentialId ?? null,
            botApiKeyId: next.capital.botApiKeyId ?? current?.capital?.botApiKeyId ?? null,
            maxSingleOrderNotionalCents:
              next.capital.maxSingleOrderNotionalCents ?? current?.capital?.maxSingleOrderNotionalCents ?? null,
            maxOpenOrderNotionalCents:
              next.capital.maxOpenOrderNotionalCents ?? current?.capital?.maxOpenOrderNotionalCents ?? null,
            maxDailyLossCents: next.capital.maxDailyLossCents ?? current?.capital?.maxDailyLossCents ?? null,
          }
        : null;
  const mergedRuntime =
    next?.runtime === undefined
      ? current?.runtime ?? null
      : next.runtime
        ? {
            liveOrdersEnabled: next.runtime.liveOrdersEnabled ?? current?.runtime?.liveOrdersEnabled ?? false,
            emergencyStop: next.runtime.emergencyStop ?? current?.runtime?.emergencyStop ?? false,
            cancelRequestedAt: next.runtime.cancelRequestedAt ?? current?.runtime?.cancelRequestedAt ?? null,
            lastSeededAt: next.runtime.lastSeededAt ?? current?.runtime?.lastSeededAt ?? null,
            lastLiveRunAt: next.runtime.lastLiveRunAt ?? current?.runtime?.lastLiveRunAt ?? null,
            lastRuntimeSyncAt: next.runtime.lastRuntimeSyncAt ?? current?.runtime?.lastRuntimeSyncAt ?? null,
          }
        : null;

  return {
    ...object,
    botInitialization: {
      status: hasOwn(next, "status") ? next?.status ?? "not_started" : current?.status ?? "not_started",
      lastCheckedAt: hasOwn(next, "lastCheckedAt") ? next?.lastCheckedAt ?? null : current?.lastCheckedAt ?? null,
      reason: hasOwn(next, "reason") ? next?.reason ?? null : current?.reason ?? null,
      approvedBy: hasOwn(next, "approvedBy") ? next?.approvedBy ?? null : current?.approvedBy ?? null,
      approvedAt: hasOwn(next, "approvedAt") ? next?.approvedAt ?? null : current?.approvedAt ?? null,
      riskProfile: hasOwn(next, "riskProfile") ? next?.riskProfile ?? null : current?.riskProfile ?? null,
      capital: mergedCapital,
      runtime: mergedRuntime,
      readiness: mergedReadiness,
    },
  };
}

function parseStatus(value: unknown): BotInitializationStatus | null {
  return value === "not_started" ||
    value === "reference_verified" ||
    value === "dry_run_ready" ||
    value === "dry_run_running" ||
    value === "live_ready" ||
    value === "live_enabled" ||
    value === "paused" ||
    value === "blocked"
    ? value
    : null;
}

function asJsonObject(
  value: Prisma.JsonValue | Prisma.InputJsonValue | Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return {};
  }
  return value as Record<string, unknown>;
}

function asStringOrNull(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asNumberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function hasOwn(value: object | null | undefined, key: string) {
  return !!value && Object.prototype.hasOwnProperty.call(value, key);
}
