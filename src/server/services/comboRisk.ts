import { Prisma } from "@prisma/client";
import type { OutcomeQuote } from "@/lib/orderbookPricing";

export const COMBO_RISK_LIMITS = {
  maxLegs: 6,
  maxStakeUSDC: new Prisma.Decimal("100"),
  maxPayoutUSDC: new Prisma.Decimal("5000"),
  quoteStaleMs: 5 * 60 * 1000,
};

export type ComboRiskReasonCode =
  | "COMBO_TOO_MANY_LEGS"
  | "COMBO_STAKE_EXCEEDS_LIMIT"
  | "COMBO_PAYOUT_EXCEEDS_LIMIT"
  | "COMBO_DUPLICATE_MARKET"
  | "COMBO_DUPLICATE_OUTCOME"
  | "COMBO_SAME_EVENT_UNSUPPORTED"
  | "COMBO_MUTUALLY_EXCLUSIVE_OUTCOMES"
  | "COMBO_YES_NO_CONFLICT"
  | "COMBO_TOTAL_LINE_CONFLICT"
  | "COMBO_SPREAD_SIDE_CONFLICT"
  | "COMBO_CORRELATED_LINE_LADDER_UNSUPPORTED"
  | "COMBO_EQUIVALENT_MARKET_UNSUPPORTED"
  | "COMBO_MARKET_NOT_TRADABLE"
  | "COMBO_MARKET_NOT_PUBLIC"
  | "COMBO_OUTCOME_NOT_TRADABLE"
  | "COMBO_QUOTE_MISSING"
  | "COMBO_QUOTE_STALE";

export type ComboRiskReason = {
  code: ComboRiskReasonCode;
  message: string;
  legIndexes?: number[];
};

export type ComboRiskLeg = {
  marketId: string;
  outcomeId: string;
  line?: string | null;
  market: {
    id: string;
    status: string;
    visibility: string;
    mechanism: string;
    isListed: boolean;
    eventId?: string | null;
    marketType?: string | null;
    marketGroupKey?: string | null;
    line?: Prisma.Decimal | string | number | null;
    period?: string | null;
    participantName?: string | null;
    externalMarketId?: string | null;
    conditionId?: string | null;
    sourceUpdatedAt?: Date | null;
  };
  outcome: {
    id: string;
    marketId: string;
    isActive: boolean;
    isTradable: boolean;
    side?: string | null;
    code?: string | null;
    status?: string | null;
  };
  quote?: OutcomeQuote | null;
};

const addReason = (reasons: ComboRiskReason[], reason: ComboRiskReason) => {
  if (!reasons.some((entry) => entry.code === reason.code && String(entry.legIndexes) === String(reason.legIndexes))) {
    reasons.push(reason);
  }
};

const normalized = (value: unknown) => String(value ?? "").trim().toLowerCase();

const lineKey = (leg: ComboRiskLeg) => {
  const raw = leg.line ?? leg.market.line;
  if (raw === null || raw === undefined || raw === "") return "";
  try {
    return new Prisma.Decimal(raw as Prisma.Decimal.Value).toFixed();
  } catch {
    return String(raw);
  }
};

const marketKind = (leg: ComboRiskLeg) => {
  const parts = [
    leg.market.marketType,
    leg.market.marketGroupKey,
    leg.market.participantName,
    leg.market.period,
  ].map(normalized);
  const joined = parts.join(":");
  if (joined.includes("moneyline") || joined.includes("winner") || joined.includes("main")) return "moneyline";
  if (joined.includes("total")) return "total";
  if (joined.includes("spread") || joined.includes("handicap")) return "spread";
  return joined;
};

const isYesNoConflict = (left: ComboRiskLeg, right: ComboRiskLeg) => {
  const sides = [left.outcome.side, right.outcome.side, left.outcome.code, right.outcome.code].map(normalized);
  return sides.includes("yes") && sides.includes("no");
};

const areOppositeSides = (left: ComboRiskLeg, right: ComboRiskLeg) => {
  const pair = [left.outcome.side, right.outcome.side, left.outcome.code, right.outcome.code].map(normalized);
  return (
    (pair.includes("over") && pair.includes("under")) ||
    (pair.includes("team_a") && pair.includes("team_b")) ||
    (pair.includes("home") && pair.includes("away")) ||
    (pair.includes("yes") && pair.includes("no"))
  );
};

const isTradableStatus = (status: string) => ["LIVE", "UPCOMING", "OPEN"].includes(status.toUpperCase());

export const validateComboRisk = (params: {
  legs: ComboRiskLeg[];
  stakeUSDC: Prisma.Decimal;
  potentialPayoutUSDC?: Prisma.Decimal | null;
  now?: Date;
  limits?: Partial<typeof COMBO_RISK_LIMITS>;
}) => {
  const limits = { ...COMBO_RISK_LIMITS, ...params.limits };
  const now = params.now ?? new Date();
  const reasons: ComboRiskReason[] = [];

  if (params.legs.length > limits.maxLegs) {
    addReason(reasons, {
      code: "COMBO_TOO_MANY_LEGS",
      message: `Combo supports up to ${limits.maxLegs} legs.`,
    });
  }
  if (params.stakeUSDC.gt(limits.maxStakeUSDC)) {
    addReason(reasons, {
      code: "COMBO_STAKE_EXCEEDS_LIMIT",
      message: `Combo stake exceeds ${limits.maxStakeUSDC.toString()} USDC.`,
    });
  }
  if (params.potentialPayoutUSDC && params.potentialPayoutUSDC.gt(limits.maxPayoutUSDC)) {
    addReason(reasons, {
      code: "COMBO_PAYOUT_EXCEEDS_LIMIT",
      message: `Combo payout exceeds ${limits.maxPayoutUSDC.toString()} USDC.`,
    });
  }

  const marketIndexes = new Map<string, number>();
  const outcomeIndexes = new Map<string, number>();
  params.legs.forEach((leg, index) => {
    const existingMarket = marketIndexes.get(leg.marketId);
    if (existingMarket !== undefined) {
      addReason(reasons, {
        code: "COMBO_DUPLICATE_MARKET",
        message: "Combo allows only one leg per market.",
        legIndexes: [existingMarket, index],
      });
    }
    marketIndexes.set(leg.marketId, index);

    const existingOutcome = outcomeIndexes.get(leg.outcomeId);
    if (existingOutcome !== undefined) {
      addReason(reasons, {
        code: "COMBO_DUPLICATE_OUTCOME",
        message: "Combo cannot include the same outcome more than once.",
        legIndexes: [existingOutcome, index],
      });
    }
    outcomeIndexes.set(leg.outcomeId, index);

    if (leg.market.visibility !== "PUBLIC" || leg.market.mechanism !== "ORDERBOOK" || !leg.market.isListed) {
      addReason(reasons, {
        code: "COMBO_MARKET_NOT_PUBLIC",
        message: "Combo legs must use public listed orderbook markets.",
        legIndexes: [index],
      });
    }
    if (!isTradableStatus(leg.market.status)) {
      addReason(reasons, {
        code: "COMBO_MARKET_NOT_TRADABLE",
        message: "Combo legs must use open or live markets.",
        legIndexes: [index],
      });
    }
    if (!leg.outcome.isActive || !leg.outcome.isTradable || normalized(leg.outcome.status || "active") !== "active") {
      addReason(reasons, {
        code: "COMBO_OUTCOME_NOT_TRADABLE",
        message: "Combo outcomes must be active and tradable.",
        legIndexes: [index],
      });
    }
    if (!leg.quote?.hasQuote) {
      addReason(reasons, {
        code: "COMBO_QUOTE_MISSING",
        message: "Combo legs require a current orderbook quote.",
        legIndexes: [index],
      });
    }
    if (leg.market.sourceUpdatedAt && now.getTime() - leg.market.sourceUpdatedAt.getTime() > limits.quoteStaleMs) {
      addReason(reasons, {
        code: "COMBO_QUOTE_STALE",
        message: "Combo quote is stale.",
        legIndexes: [index],
      });
    }
  });

  for (let i = 0; i < params.legs.length; i += 1) {
    for (let j = i + 1; j < params.legs.length; j += 1) {
      const left = params.legs[i];
      const right = params.legs[j];
      const sameEvent = left.market.eventId && left.market.eventId === right.market.eventId;
      const sameLine = lineKey(left) && lineKey(left) === lineKey(right);
      const leftKind = marketKind(left);
      const rightKind = marketKind(right);
      const equivalentKeyMatch =
        Boolean(left.market.conditionId && left.market.conditionId === right.market.conditionId) ||
        Boolean(left.market.externalMarketId && left.market.externalMarketId === right.market.externalMarketId);

      if (isYesNoConflict(left, right)) {
        addReason(reasons, {
          code: "COMBO_YES_NO_CONFLICT",
          message: "Combo cannot include YES and NO on the same contract family.",
          legIndexes: [i, j],
        });
      }
      if (equivalentKeyMatch) {
        addReason(reasons, {
          code: "COMBO_EQUIVALENT_MARKET_UNSUPPORTED",
          message: "Equivalent markets are not supported in one combo.",
          legIndexes: [i, j],
        });
      }
      if (sameEvent && leftKind === "moneyline" && rightKind === "moneyline") {
        addReason(reasons, {
          code: "COMBO_MUTUALLY_EXCLUSIVE_OUTCOMES",
          message: "Moneyline outcomes from the same event are mutually exclusive.",
          legIndexes: [i, j],
        });
      }
      if (sameEvent && leftKind === "total" && rightKind === "total" && sameLine && areOppositeSides(left, right)) {
        addReason(reasons, {
          code: "COMBO_TOTAL_LINE_CONFLICT",
          message: "Over and under on the same total line conflict.",
          legIndexes: [i, j],
        });
      }
      if (sameEvent && leftKind === "spread" && rightKind === "spread" && sameLine && areOppositeSides(left, right)) {
        addReason(reasons, {
          code: "COMBO_SPREAD_SIDE_CONFLICT",
          message: "Opposite spread sides on the same line conflict.",
          legIndexes: [i, j],
        });
      }
      if (sameEvent && leftKind === rightKind && ["total", "spread"].includes(leftKind) && lineKey(left) !== lineKey(right)) {
        addReason(reasons, {
          code: "COMBO_CORRELATED_LINE_LADDER_UNSUPPORTED",
          message: "Correlated line ladder combinations are not supported in v1.",
          legIndexes: [i, j],
        });
      }
      if (sameEvent) {
        addReason(reasons, {
          code: "COMBO_SAME_EVENT_UNSUPPORTED",
          message: "Same-event multi-leg combos are unsupported in v1.",
          legIndexes: [i, j],
        });
      }
    }
  }

  return {
    allowed: reasons.length === 0,
    status: reasons.length === 0 ? "allowed" as const : "blocked" as const,
    reasonCodes: reasons.map((reason) => reason.code),
    reasons,
    limits: {
      maxLegs: limits.maxLegs,
      maxStakeUSDC: limits.maxStakeUSDC.toString(),
      maxPayoutUSDC: limits.maxPayoutUSDC.toString(),
      quoteStaleMs: limits.quoteStaleMs,
    },
  };
};
