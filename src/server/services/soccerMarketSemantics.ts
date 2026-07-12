export type SoccerResultMode = "one_winner" | "can_draw_90" | "must_advance";
export type SoccerPrimaryMarketProfile = "outright" | "advance" | "regulation_90";

export type SoccerMobileMarketSemantics = {
  visible: boolean;
  reason: string;
  normalizedLine: number | null;
  providerMarketType?: string | null;
};

const CLEAN_SPREAD_LINES = new Set([0.5, 1.5, 2.5, 3.5]);
const CLEAN_TOTAL_LINES = new Set([0.5, 1.5, 2.5, 3.5]);

export function normalizeSoccerResultMode(value: unknown, fallback: SoccerResultMode = "can_draw_90"): SoccerResultMode {
  const normalized = `${value ?? ""}`.trim().toLowerCase();
  if (normalized === "one_winner") return "one_winner";
  if (normalized === "must_advance" || normalized === "no_draw") return "must_advance";
  if (normalized === "can_draw_90" || normalized === "can_draw") return "can_draw_90";
  return fallback;
}

export function primaryMarketProfileForResultMode(resultMode: SoccerResultMode): SoccerPrimaryMarketProfile {
  if (resultMode === "one_winner") return "outright";
  if (resultMode === "must_advance") return "advance";
  return "regulation_90";
}

export function legacyResultModeAlias(resultMode: SoccerResultMode) {
  if (resultMode === "can_draw_90") return "can_draw";
  if (resultMode === "must_advance") return "no_draw";
  return resultMode;
}

export function isCleanHalfGoalLine(value: number | string | null | undefined) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && Math.abs(parsed % 1) === 0.5;
}

export function isCleanSoccerSpreadLine(value: number | string | null | undefined) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && CLEAN_SPREAD_LINES.has(Math.abs(parsed));
}

export function isCleanSoccerTotalLine(value: number | string | null | undefined) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && CLEAN_TOTAL_LINES.has(Math.abs(parsed));
}

export function sportsbookLineMarketSemantics(params: {
  marketType?: string | null;
  marketGroupKey?: string | null;
  marketGroupTitle?: string | null;
  providerMarketType?: string | null;
  line?: number | string | null;
}): SoccerMobileMarketSemantics {
  const marketKey = `${params.marketType ?? ""} ${params.marketGroupKey ?? ""} ${params.marketGroupTitle ?? ""} ${params.providerMarketType ?? ""}`.toLowerCase();
  const line = params.line == null ? null : Number(params.line);
  const normalizedLine = typeof line === "number" && Number.isFinite(line) ? Math.abs(line) : null;

  if (marketKey.includes("spread") || marketKey.includes("handicap")) {
    if (normalizedLine == null) {
      return { visible: false, reason: "spread_line_missing", normalizedLine, providerMarketType: params.providerMarketType };
    }
    if (normalizedLine == null || !isCleanSoccerSpreadLine(normalizedLine)) {
      return { visible: false, reason: "raw_asian_handicap_line_hidden", normalizedLine, providerMarketType: params.providerMarketType };
    }
    return { visible: true, reason: "clean_half_goal_spread", normalizedLine, providerMarketType: params.providerMarketType };
  }

  if (marketKey.includes("total")) {
    if (normalizedLine == null) {
      return { visible: false, reason: "total_line_missing", normalizedLine, providerMarketType: params.providerMarketType };
    }
    if (normalizedLine == null || !isCleanSoccerTotalLine(normalizedLine)) {
      return { visible: false, reason: "raw_asian_total_line_hidden", normalizedLine, providerMarketType: params.providerMarketType };
    }
    return { visible: true, reason: "clean_half_goal_total", normalizedLine, providerMarketType: params.providerMarketType };
  }

  return { visible: true, reason: "not_line_market", normalizedLine, providerMarketType: params.providerMarketType };
}

export function isMobileFacingSoccerPredictionMarket(params: {
  marketType?: string | null;
  marketGroupKey?: string | null;
  marketGroupTitle?: string | null;
  providerMarketType?: string | null;
  line?: number | string | null;
}) {
  return sportsbookLineMarketSemantics(params).visible;
}
