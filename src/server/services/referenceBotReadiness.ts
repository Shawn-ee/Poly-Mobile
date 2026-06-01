import { Market, Outcome } from "@prisma/client";
import {
  BotInitializationMetadata,
  BotInitializationStatus,
  parseBotInitializationMetadata,
} from "@/server/services/referenceBotInitialization";
import { getLatestReferenceQuotePlansForMarket } from "@/server/services/referenceQuoteSnapshots";

export type ReferenceBotReadinessResult = {
  ready: boolean;
  dryRun: boolean;
  liveRequested: boolean;
  reasons: string[];
  referenceBid: number | null;
  referenceAsk: number | null;
  plannedBotBid: number | null;
  plannedBotAsk: number | null;
  mmEligible: boolean;
  riskProfile: string | null;
  checkedAt: string;
  nextStatus: BotInitializationStatus;
};

export type ReferenceBotAdminAction =
  | "mark_dry_run_running"
  | "pause_bot"
  | "reset_bot_initialization"
  | "mark_live_ready"
  | "mark_live_enabled";

export async function evaluateReferenceBotReadiness(params: {
  market: Market & { outcomes: Outcome[] };
  dryRun: boolean;
}) : Promise<ReferenceBotReadinessResult> {
  const checkedAt = new Date().toISOString();
  const metadata = parseBotInitializationMetadata(params.market.referenceMetadata);
  const reasons: string[] = [];
  const plans = await getLatestReferenceQuotePlansForMarket(params.market.id);
  const primary =
    plans.find((plan) => plan.outcomeName.trim().toUpperCase() === "YES") ??
    plans[0] ??
    null;

  const review =
    params.market.referenceMetadata &&
    typeof params.market.referenceMetadata === "object" &&
    !Array.isArray(params.market.referenceMetadata)
      ? (params.market.referenceMetadata as Record<string, unknown>)
      : {};

  if (params.market.referenceSource !== "polymarket") {
    reasons.push("not_polymarket_reference");
  }
  if (review.importStatus !== "approved") {
    reasons.push("market_not_approved");
  }
  if (!params.market.isListed) {
    reasons.push("market_not_listed");
  }
  if (!params.market.externalSlug) {
    reasons.push("missing_external_slug");
  }
  if (params.market.outcomes.length !== 2) {
    reasons.push("market_not_binary");
  }
  if (params.market.outcomes.some((outcome) => !outcome.referenceTokenId)) {
    reasons.push("missing_reference_token_id");
  }
  if (!primary || !primary.hasSnapshot) {
    reasons.push("missing_reference_snapshot");
  } else {
    if (!primary.isFresh) {
      reasons.push("reference_stale");
    }
    if (primary.gammaBestBid == null || primary.gammaBestAsk == null) {
      reasons.push("reference_missing_book");
    }
    if (!primary.acceptingOrders) {
      reasons.push("reference_not_accepting_orders");
    }
    if (primary.gammaSpread == null || primary.gammaSpread > 0.1) {
      reasons.push("reference_spread_too_wide");
    }
    if (primary.qualityStatus !== "high_quality" && primary.qualityStatus !== "available") {
      reasons.push("reference_quality_not_acceptable");
    }
  }

  if (!params.dryRun) {
    if (review.tradable !== true) {
      reasons.push("market_not_tradable");
    }
    if (review.mmEnabled !== true) {
      reasons.push("market_mm_disabled");
    }
    if (params.market.outcomes.some((outcome) => outcome.isTradable !== true)) {
      reasons.push("outcome_not_tradable");
    }
  }

  const ready = reasons.length === 0;
  return {
    ready,
    dryRun: params.dryRun,
    liveRequested: !params.dryRun,
    reasons,
    referenceBid: primary?.referenceBid ?? null,
    referenceAsk: primary?.referenceAsk ?? null,
    plannedBotBid: primary?.plannedBotBid ?? null,
    plannedBotAsk: primary?.plannedBotAsk ?? null,
    mmEligible: primary?.mmEligible ?? false,
    riskProfile: metadata?.riskProfile ?? null,
    checkedAt,
    nextStatus: deriveNextStatus({
      ready,
      dryRun: params.dryRun,
      hasReferenceData: primary?.referenceBid != null || primary?.referenceAsk != null,
    }),
  };
}

export function buildBotInitializationUpdate(params: {
  current: BotInitializationMetadata | null;
  readiness: ReferenceBotReadinessResult;
}) {
  return {
    status: params.readiness.nextStatus,
    lastCheckedAt: params.readiness.checkedAt,
    reason: params.readiness.reasons[0] ?? null,
    riskProfile: params.current?.riskProfile ?? null,
    readiness: {
      ready: params.readiness.ready,
      dryRun: params.readiness.dryRun,
      liveRequested: params.readiness.liveRequested,
      reasons: params.readiness.reasons,
      referenceBid: params.readiness.referenceBid,
      referenceAsk: params.readiness.referenceAsk,
      plannedBotBid: params.readiness.plannedBotBid,
      plannedBotAsk: params.readiness.plannedBotAsk,
      riskProfile: params.current?.riskProfile ?? null,
      checkedAt: params.readiness.checkedAt,
    },
  } satisfies Partial<BotInitializationMetadata>;
}

export function buildAdminLifecycleActionUpdate(params: {
  action: ReferenceBotAdminAction;
  current: BotInitializationMetadata | null;
  readiness?: ReferenceBotReadinessResult | null;
  pauseReason?: string | null;
}) {
  switch (params.action) {
    case "mark_dry_run_running":
      if ((params.current?.status ?? "not_started") !== "dry_run_ready") {
        return {
          ok: false as const,
          error: "Market must be dry_run_ready before marking dry_run_running.",
        };
      }
      return {
        ok: true as const,
        update: {
          status: "dry_run_running" as const,
          lastCheckedAt: new Date().toISOString(),
          reason: null,
          riskProfile: params.current?.riskProfile ?? null,
          readiness: params.current?.readiness ?? null,
        } satisfies Partial<BotInitializationMetadata>,
      };
    case "pause_bot":
      return {
        ok: true as const,
        update: {
          status: "paused" as const,
          lastCheckedAt: new Date().toISOString(),
          reason: params.pauseReason?.trim() || params.current?.reason || "Paused by admin.",
          riskProfile: params.current?.riskProfile ?? null,
          readiness: params.current?.readiness ?? null,
        } satisfies Partial<BotInitializationMetadata>,
      };
    case "reset_bot_initialization":
      return {
        ok: true as const,
        update: {
          status: "not_started" as const,
          lastCheckedAt: null,
          reason: null,
          approvedBy: null,
          approvedAt: null,
          riskProfile: params.current?.riskProfile ?? null,
          readiness: null,
        } satisfies Partial<BotInitializationMetadata>,
      };
    case "mark_live_ready":
      if (!params.readiness) {
        return {
          ok: false as const,
          error: "Live readiness result is required.",
        };
      }
      if (!params.readiness.ready) {
        return {
          ok: false as const,
          error: "Market is not live-ready.",
          reasons: params.readiness.reasons,
        };
      }
      return {
        ok: true as const,
        update: buildBotInitializationUpdate({
          current: params.current,
          readiness: params.readiness,
        }),
      };
    case "mark_live_enabled":
      if (!params.readiness) {
        return {
          ok: false as const,
          error: "Live readiness result is required.",
        };
      }
      if ((params.current?.status ?? "not_started") !== "live_ready" && (params.current?.status ?? "not_started") !== "live_enabled") {
        return {
          ok: false as const,
          error: "Market must be live_ready before enabling live liquidity.",
        };
      }
      if (!params.readiness.ready) {
        return {
          ok: false as const,
          error: "Market is not safe to enable live liquidity.",
          reasons: params.readiness.reasons,
        };
      }
      return {
        ok: true as const,
        update: {
          ...buildBotInitializationUpdate({
            current: params.current,
            readiness: params.readiness,
          }),
          status: "live_enabled" as const,
          reason: "explicit_live_confirmed",
          runtime: {
            liveOrdersEnabled: true,
            emergencyStop: params.current?.runtime?.emergencyStop ?? false,
            cancelRequestedAt: params.current?.runtime?.cancelRequestedAt ?? null,
            lastSeededAt: params.current?.runtime?.lastSeededAt ?? null,
            lastLiveRunAt: new Date().toISOString(),
            lastRuntimeSyncAt: params.readiness.checkedAt,
          },
        } satisfies Partial<BotInitializationMetadata>,
      };
  }
}

function deriveNextStatus(params: {
  ready: boolean;
  dryRun: boolean;
  hasReferenceData: boolean;
}): BotInitializationStatus {
  if (params.ready) {
    return params.dryRun ? "dry_run_ready" : "live_ready";
  }
  if (params.hasReferenceData) {
    return "reference_verified";
  }
  return "blocked";
}
