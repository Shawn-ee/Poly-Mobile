import type { Market } from "../mocks/worldCup";

export type LinePeriod = "Reg. Time" | "1st Half" | "2nd Half";

export const linePeriods: LinePeriod[] = ["Reg. Time", "1st Half", "2nd Half"];

export const equivalentMarketPeriod = (value?: Market["period"] | null) => value === "full-game" ? "regulation" : value;

export const marketPeriodForLinePeriod = (period: LinePeriod): Market["period"] =>
  period === "Reg. Time" ? "regulation" : period === "1st Half" ? "first-half" : "second-half";

export const linePeriodForMarketPeriod = (period?: Market["period"] | null): LinePeriod =>
  equivalentMarketPeriod(period) === "first-half" ? "1st Half" : equivalentMarketPeriod(period) === "second-half" ? "2nd Half" : "Reg. Time";

const lineAsNumber = (value: string | null | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isCleanHalfGoalLine = (value: string | null | undefined) => {
  const parsed = lineAsNumber(value);
  return parsed !== null && Math.abs(parsed % 1) === 0.5;
};

const lineTypeAliases = (type: string) => type === "totals"
  ? ["totals", "total_goals"]
  : type === "team-total"
    ? ["team-total", "team_total", "team_totals", "team_total_goals"]
    : [type];

export const marketMatchesLineType = (market: Market, type: string) => lineTypeAliases(type).includes(market.marketType ?? "");

export const marketsForLineType = (markets: Market[], type: string) =>
  markets.filter((market) => marketMatchesLineType(market, type) && isCleanHalfGoalLine(market.line));

export const lineOptionsFor = (markets: Market[], type: string, period: LinePeriod) =>
  Array.from(new Set(
    marketsForLineType(markets, type)
      .filter((market) => equivalentMarketPeriod(market.period) === equivalentMarketPeriod(marketPeriodForLinePeriod(period)))
      .map((market) => market.line)
      .filter((line): line is string => Boolean(line)),
  )).sort((left, right) => Number(left) - Number(right));

export const periodOptionsFor = (markets: Market[], type: string) => linePeriods.filter((period) =>
  marketsForLineType(markets, type).some((market) => equivalentMarketPeriod(market.period) === equivalentMarketPeriod(marketPeriodForLinePeriod(period))),
);

export const matchingBackendLineMarket = (markets: Market[], type: string, line: string, period: LinePeriod) => {
  const target = Number(line);
  if (!Number.isFinite(target)) return undefined;
  const targetPeriod = marketPeriodForLinePeriod(period);
  return markets.find((market) => {
    const marketLine = lineAsNumber(market.line);
    return (
      marketMatchesLineType(market, type) &&
      marketLine !== null &&
      isCleanHalfGoalLine(market.line) &&
      Math.abs(marketLine - target) < Number.EPSILON &&
      (!market.period || equivalentMarketPeriod(market.period) === equivalentMarketPeriod(targetPeriod))
    );
  });
};
