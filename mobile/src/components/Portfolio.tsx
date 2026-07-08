import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { activityPnl, activityShares, decimalOdds } from "../domain/portfolioActivityMetrics";
import {
  estimatedPositionPnl,
  portfolioPositionValue,
} from "../domain/portfolioPositionMetrics";
import type { Locale } from "../mocks/worldCup";
import { money } from "../presentation/formatters";
import { deterministicPortfolioValueHistory } from "../services/portfolioValueHistoryService";
import {
  openOrderPotentialCopyKey,
  openOrderPotentialValue,
  openOrderRemainingShares,
  openOrderValue,
} from "../services/openOrderEconomicsService";
import type { OrderMode } from "../services/orderService";
import { canCashOutPosition } from "../services/positionCloseService";
import type { PortfolioValueHistory, PortfolioValueHistoryPoint, PortfolioValueHistoryRange } from "../types";
import type { BinaryContractSide, TicketSelection } from "./TradeTicket";

export type Position = {
  id: string;
  mode: OrderMode;
  marketId?: string;
  outcomeId?: string;
  title: string;
  outcome: string;
  selection?: TicketSelection;
  contractSide?: BinaryContractSide;
  side: "buy" | "sell";
  amount: number;
  probability: number;
  shares?: number;
  currentPrice?: number;
  bestBid?: number | null;
  bestAsk?: number | null;
  bestBidSize?: number | null;
  bestAskSize?: number | null;
  currentValue?: number;
  pnl?: number;
  isLive?: boolean;
  liveClock?: string;
};

export type PortfolioActivity = {
  id: string;
  action: "opened" | "sold" | "closed" | "canceled";
  title: string;
  outcome: string;
  selection?: TicketSelection;
  contractSide?: BinaryContractSide;
  amount: number;
  entryAmount?: number;
  shares?: number;
  side?: "buy" | "sell";
  probability?: number;
  fillCount?: number;
  isLive?: boolean;
  liveClock?: string;
  timestamp?: string;
};

export type OpenOrder = {
  id: string;
  title: string;
  outcome: string;
  selection?: TicketSelection;
  contractSide?: BinaryContractSide;
  side: "buy" | "sell";
  status: string;
  price: number;
  remaining: number;
  originalShares?: number;
  remainingShares?: number;
  orderValue?: number;
  placedAt?: string;
};

export type OrderConfirmation = {
  id: string;
  mode: OrderMode;
  title: string;
  outcome: string;
  selection?: TicketSelection;
  contractSide?: BinaryContractSide;
  side: "buy" | "sell";
  amount: number;
  probability?: number;
  status?: string;
  size?: number;
  filledSize?: number;
  remainingSize?: number;
  isLive?: boolean;
  liveClock?: string;
};

export type PortfolioSyncStatus = "hidden" | "syncing" | "synced" | "error";

type PortfolioCopy = {
  balance: string;
  noPositions: string;
  noPositionsBody: string;
  buy: string;
  sell: string;
  invested: string;
  entry: string;
  currentValue: string;
  currentPrice: string;
  estimatedPnl: string;
  closePosition: string;
  recentActivity: string;
  openedPosition: string;
  soldPosition: string;
  closedPosition: string;
  canceledOrder: string;
  openOrders: string;
  remaining: string;
  remainingValue: string;
  limitPrice: string;
  orderValue: string;
  potentialPayout: string;
  potentialProceeds: string;
  placed: string;
  size: string;
  filled: string;
  shares: string;
  impliedOdds: string;
  filledShares: string;
  executionPrice: string;
  cancelOrder: string;
  portfolioSyncing: string;
  portfolioSynced: string;
  portfolioSyncError: string;
  portfolioSyncFallback: string;
  orderPlaced: string;
  openPositions: string;
  activityCount: string;
  closedTrades: string;
  liveNow: string;
  justNow: string;
};

export { portfolioPositionValue };

const estimatedPnl = estimatedPositionPnl;

const displayOutcome = (item: { outcome: string; selection?: TicketSelection; contractSide?: BinaryContractSide }) => {
  const contractSide = item.contractSide ?? item.selection?.contractSide;
  const display = item.selection?.displayLabel ?? item.outcome;
  return contractSide === "no" ? `No - ${display}` : display;
};

const compactVisibleOutcomeLabel = (item: { outcome: string; selection?: TicketSelection }) => {
  const display = item.selection?.displayLabel ?? item.outcome;
  return display.replace(/\s+(RT|1H|2H)$/i, "");
};

const displayPositionChoice = (item: { outcome: string; selection?: TicketSelection }) => {
  const compact = compactVisibleOutcomeLabel(item);
  const line = item.selection?.line;
  if (item.selection?.marketType === "totals" && line) {
    const side = /^under\b/i.test(compact) ? "Under" : "Over";
    return `${side} ${line} total goals`;
  }
  if (item.selection?.marketType === "team-total" && line) {
    return `${compact} team goals`;
  }
  return compact;
};

const teamAbbrev = (team: string) => {
  const clean = team
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-zA-Z\s]/g, " ")
    .trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "TBD";
  if (words.length > 1 && words[0].length <= 3) return words[0].slice(0, 3).toUpperCase();
  return words[words.length - 1].slice(0, 3).toUpperCase();
};

const scoreLineForTitle = (title: string) => {
  const [home, away] = title.split(/\s+v(?:s\.?|\.?)\s+/i).map((value) => value.trim());
  if (!home || !away) return title;
  return `${teamAbbrev(home)} 0 - ${teamAbbrev(away)} 0`;
};

const providerBreadthCodes = (item: { title: string; outcome: string; selection?: TicketSelection }) => {
  const source = [
    item.title,
    item.outcome,
    item.selection?.displayLabel,
    item.selection?.referenceOutcomeLabel,
  ].filter(Boolean).join(" ").toUpperCase();
  const hasHome = source.includes("BREADTH HOME") || /\bBHO\b/.test(source);
  const hasAway = source.includes("BREADTH AWAY") || /\bBAW\b/.test(source);
  const isProviderBreadth = source.includes("PROVIDER BREADTH") || source.includes("BREADTH WORLD CUP") || hasHome || hasAway;
  return isProviderBreadth ? { home: "BHO", away: "BAW" } : null;
};

const compactPortfolioScoreLine = (item: { title: string; outcome: string; selection?: TicketSelection }) => {
  const breadth = providerBreadthCodes(item);
  if (breadth) return `${breadth.home} 0 - ${breadth.away} 0`;
  return scoreLineForTitle(item.title);
};

const compactPortfolioEventSubline = (item: { title: string; outcome: string; selection?: TicketSelection }) => {
  const breadth = providerBreadthCodes(item);
  if (breadth) return `${breadth.home} vs ${breadth.away}`;
  const [home, away] = item.title.split(/\s+v(?:s\.?|\.?)\s+/i).map((value) => value.trim());
  if (!home || !away) return item.title;
  return `${teamAbbrev(home)} vs ${teamAbbrev(away)}`;
};

const teamFlags: Record<string, string> = {
  ARG: "\ud83c\udde6\ud83c\uddf7",
  AUS: "\ud83c\udde6\ud83c\uddfa",
  BRA: "\ud83c\udde7\ud83c\uddf7",
  CRO: "\ud83c\udded\ud83c\uddf7",
  ECU: "\ud83c\uddea\ud83c\udde8",
  EGY: "\ud83c\uddea\ud83c\uddec",
  ENG: "\ud83c\udff4",
  FRA: "\ud83c\uddeb\ud83c\uddf7",
  MEX: "\ud83c\uddf2\ud83c\uddfd",
  POR: "\ud83c\uddf5\ud83c\uddf9",
  USA: "\ud83c\uddfa\ud83c\uddf8",
};

const codeAliases: Record<string, string> = {
  ARGENTINA: "ARG",
  AUSTRALIA: "AUS",
  BRAZIL: "BRA",
  CROATIA: "CRO",
  ECUADOR: "ECU",
  EGYPT: "EGY",
  ENGLAND: "ENG",
  FRANCE: "FRA",
  MEXICO: "MEX",
  PORTUGAL: "POR",
  USA: "USA",
};

const teamCodeForPortfolioItem = (item: { title: string; outcome: string; selection?: TicketSelection }) => {
  const candidates = [
    item.selection?.displayLabel,
    item.selection?.referenceOutcomeLabel,
    item.outcome,
    item.title,
  ]
    .filter(Boolean)
    .map((value) => String(value).toUpperCase());

  for (const value of candidates) {
    const codeMatch = value.match(/\b(ARG|AUS|BRA|CRO|ECU|EGY|ENG|FRA|MEX|POR|USA)\b/);
    if (codeMatch) return codeMatch[1];
    const alias = Object.keys(codeAliases).find((name) => value.includes(name));
    if (alias) return codeAliases[alias];
  }

  return undefined;
};

function PortfolioAvatar() {
  return (
    <View accessibilityLabel="portfolio-gradient-avatar" style={styles.avatarGradient}>
      <View style={[styles.avatarColorStop, styles.avatarColorStopPink]} />
      <View style={[styles.avatarColorStop, styles.avatarColorStopYellow]} />
      <View style={[styles.avatarColorStop, styles.avatarColorStopBlue]} />
    </View>
  );
}

const marketIconForPortfolioItem = (item: { selection?: TicketSelection }) => {
  const marketType = item.selection?.marketType;
  if (marketType === "spread") return "+/-";
  if (marketType === "totals" || marketType === "team-total") return "%";
  if (marketType === "winner" || marketType === "live") return "1X2";
  return "%";
};

const marketTypeForPortfolioItem = (item: { selection?: TicketSelection }) => item.selection?.marketType ?? "generic";

function PositionFlag({
  item,
  context = "position",
}: {
  item: { title: string; outcome: string; selection?: TicketSelection };
  context?: "position" | "history";
}) {
  const code = teamCodeForPortfolioItem(item);
  const flag = code ? teamFlags[code] : undefined;
  const proofPrefix = context === "history" ? "portfolio-history-market-icon" : "portfolio-position-flag";
  if (flag) {
    return (
      <View accessibilityLabel={`${proofPrefix} ${proofPrefix}-${code}`} style={styles.positionFlag}>
        <Text style={styles.positionFlagEmoji}>{flag}</Text>
      </View>
    );
  }

  const marketType = marketTypeForPortfolioItem(item);
  return (
    <View accessibilityLabel={`${proofPrefix} ${proofPrefix}-${marketType}`} style={styles.positionFlag}>
      <Text style={styles.positionFlagGeneric}>{marketIconForPortfolioItem(item)}</Text>
    </View>
  );
}

function ActivityIcon({ activity }: { activity: PortfolioActivity }) {
  if (teamCodeForPortfolioItem(activity) || activity.selection?.marketType) {
    return <PositionFlag context="history" item={activity} />;
  }

  return (
    <View accessibilityLabel={`portfolio-history-action-icon portfolio-history-action-icon-${activity.action}`} style={styles.activityIcon}>
      <Ionicons
        name={activity.action === "opened" ? "arrow-down" : activity.action === "canceled" ? "close" : "checkmark"}
        size={18}
        color="#dbeafe"
      />
    </View>
  );
}

const limitIdentityLabel = (selection?: TicketSelection) =>
  selection?.limitPrice
    ? `portfolio-limit-side-${selection.limitSide ?? "none"} portfolio-limit-price-${Math.round(selection.limitPrice * 100)} portfolio-limit-decimal-${selection.limitPrice.toFixed(2)} portfolio-limit-shares-${selection.limitShares ?? "none"}`
    : "portfolio-limit-side-none portfolio-limit-price-none portfolio-limit-shares-none";

const selectionIdentityLabel = (item: { outcome: string; side?: "buy" | "sell"; selection?: TicketSelection; contractSide?: BinaryContractSide }) => {
  const selection = item.selection;
  const contractSide = item.contractSide ?? selection?.contractSide ?? "yes";
  return selection
    ? `portfolio-snapshot-source-order-time portfolio-market-family-${selection.marketType} portfolio-market-type-${selection.marketType} portfolio-market-id-${selection.marketId ?? "none"} portfolio-outcome-id-${selection.outcomeId ?? "none"} portfolio-market-group-${selection.marketGroupId ?? "none"} portfolio-line-${selection.line ?? "none"} portfolio-period-${selection.period ?? "none"} portfolio-side-${item.side ?? selection.side ?? "none"} portfolio-outcome-${displayOutcome(item)} portfolio-display-label-${selection.displayLabel} portfolio-contract-side-${contractSide} portfolio-provider-source-${selection.referenceSource ?? "none"} portfolio-provider-market-${selection.externalMarketId ?? "none"} portfolio-provider-condition-${selection.conditionId ?? "none"} portfolio-provider-token-${selection.referenceTokenId ?? "none"} portfolio-provider-outcome-${selection.referenceOutcomeLabel ?? "none"} ${limitIdentityLabel(selection)}`
    : `portfolio-market-family-none portfolio-line-none portfolio-period-none portfolio-side-${item.side ?? "none"} portfolio-outcome-${displayOutcome(item)} portfolio-contract-side-${contractSide} portfolio-limit-side-none portfolio-limit-price-none portfolio-limit-shares-none`;
};

const snapshotSourceLabel = (id: string, selection?: TicketSelection) =>
  selection
    ? `snapshot-source-order-time snapshot-display-label-${selection.displayLabel} snapshot-provider-market-${selection.externalMarketId ?? "none"} snapshot-provider-token-${selection.referenceTokenId ?? "none"} snapshot-market-id-${selection.marketId ?? "none"} snapshot-outcome-id-${selection.outcomeId ?? "none"} ${limitIdentityLabel(selection)}`
    : `snapshot-source-current-state snapshot-row-${id} portfolio-limit-side-none portfolio-limit-price-none portfolio-limit-shares-none`;

const portfolioSourceBadge = (selection?: TicketSelection) => {
  const source = selection?.referenceSource ?? "";
  if (source.includes("polymarket")) {
    return {
      label: "Provider",
      tone: "provider" as const,
      accessibility: `portfolio-source-badge-provider portfolio-source-${source}`,
    };
  }
  if (source.includes("contract-fixture")) {
    return {
      label: "Local",
      tone: "fixture" as const,
      accessibility: `portfolio-source-badge-local portfolio-source-${source}`,
    };
  }
  return {
    label: "Checking",
    tone: "unknown" as const,
    accessibility: `portfolio-source-badge-unknown portfolio-source-${source || "unknown"}`,
  };
};

const portfolioSourceNote = (selection?: TicketSelection) => {
  const source = selection?.referenceSource ?? "";
  if (source.includes("contract-fixture")) {
    return {
      text: "Local test pricing",
      accessibility: "portfolio-local-test-pricing",
      tone: "fixture" as const,
    };
  }
  if (source.includes("polymarket")) {
    return {
      text: "Provider market",
      accessibility: "portfolio-provider-backed-pricing",
      tone: "provider" as const,
    };
  }
  return null;
};

const portfolioDetailCopy = {
  en: {
    details: "Details",
    hideDetails: "Hide details",
    actionHint: "Tap row for details",
  },
  zh: {
    details: "\u8be6\u60c5",
    hideDetails: "\u6536\u8d77\u8be6\u60c5",
    actionHint: "\u70b9\u51fb\u67e5\u770b\u8be6\u60c5",
  },
};

const openOrderFilledShares = (order: OpenOrder) =>
  typeof order.originalShares === "number" ? Math.max(order.originalShares - openOrderRemainingShares(order), 0) : undefined;

const openOrderFilledPercent = (order: OpenOrder) => {
  if (typeof order.originalShares !== "number" || order.originalShares <= 0) return undefined;
  return Math.round(((openOrderFilledShares(order) ?? 0) / order.originalShares) * 100);
};

const openOrderFilledText = (order: OpenOrder, t: PortfolioCopy) => {
  const filledShares = openOrderFilledShares(order);
  const filledPercent = openOrderFilledPercent(order);
  if (typeof filledShares !== "number" || typeof filledPercent !== "number") return undefined;
  return `${t.filled}: ${filledShares.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${t.shares} (${filledPercent}%)`;
};

const investedTotal = (positions: Position[]) => positions.reduce((total, position) => total + position.amount, 0);

const currentValueTotal = (positions: Position[]) =>
  positions.reduce((total, position) => total + portfolioPositionValue(position), 0);

const portfolioHeaderMoney = (value: number) => {
  const absolute = Math.abs(value);
  const formatted = absolute.toLocaleString(undefined, {
    maximumFractionDigits: absolute >= 1000 ? 0 : 2,
    minimumFractionDigits: absolute > 0 && absolute < 1000 ? 2 : 0,
  });
  return `${value < 0 ? "-" : ""}$${formatted}`;
};

const portfolioRowMoney = (value: number) => {
  const absolute = Math.abs(value);
  const formatted = absolute.toLocaleString(undefined, {
    maximumFractionDigits: absolute >= 1000 || Number.isInteger(absolute) ? 0 : 2,
  });
  return `${value < 0 ? "-" : ""}$${formatted}`;
};

const positionPotentialPayout = (position: Position) => {
  if (typeof position.shares === "number" && Number.isFinite(position.shares) && position.shares > 0) {
    return position.shares;
  }
  const entryPrice = Math.max(position.probability, 1) / 100;
  return position.amount / entryPrice;
};

const monthIndexByShortName: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

const parseActivityTimestamp = (timestamp: string) => {
  const match = timestamp.match(/^([A-Z][a-z]{2})\s+(\d{1,2}),\s+(\d{1,2}):(\d{2})\s+(AM|PM)$/);
  if (!match) return null;
  const [, monthName, dayText, hourText, minuteText, meridiem] = match;
  const month = monthIndexByShortName[monthName];
  if (typeof month !== "number") return null;
  const now = new Date();
  let hour = Number(hourText);
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  const parsed = new Date(now.getFullYear(), month, Number(dayText), hour, Number(minuteText));
  if (parsed.getTime() - now.getTime() > 12 * 60 * 60 * 1000) {
    parsed.setFullYear(parsed.getFullYear() - 1);
  }
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const activityRelativeTime = (timestamp?: string) => {
  if (!timestamp) return "";
  if (/ago$/i.test(timestamp) || /^Just now$/i.test(timestamp)) return timestamp;
  const parsed = parseActivityTimestamp(timestamp);
  if (!parsed) return timestamp;
  const elapsedMs = Math.max(0, Date.now() - parsed.getTime());
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  if (elapsedMinutes < 2) return "Just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes} min. ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} hr. ago`;
  return `${Math.floor(elapsedHours / 24)} d. ago`;
};

const pnlTotal = (positions: Position[]) =>
  positions.reduce((total, position) => total + estimatedPnl(position), 0);

const activityActionLabel = (activity: PortfolioActivity, t: PortfolioCopy) =>
  activity.action === "opened"
    ? t.openedPosition
    : activity.action === "sold"
      ? t.soldPosition
      : activity.action === "canceled"
        ? t.canceledOrder
        : t.closedPosition;

const activitySidePrefix = (activity: PortfolioActivity, t: PortfolioCopy) =>
  activity.side ? `${activity.side === "sell" ? t.sell : t.buy} - ` : "";

const activityExecutionText = (activity: PortfolioActivity, t: PortfolioCopy) =>
  activity.action === "closed"
    ? `${t.entry} ${typeof activity.probability === "number" ? `${activity.probability}%` : money(activity.entryAmount ?? activity.amount)} - ${t.currentValue} ${money(activity.amount)} - ${t.estimatedPnl} ${
        activityPnl(activity) >= 0 ? "+" : ""
      }${money(activityPnl(activity))}`
    : activity.action === "canceled"
      ? `${activitySidePrefix(activity, t)}${t.canceledOrder} ${(activity.shares ?? activityShares(activity)).toFixed(2)} ${t.shares} - ${t.limitPrice} ${activity.probability ?? 0}%`
    : `${activitySidePrefix(activity, t)}${t.filledShares} ${activityShares(activity).toFixed(2)} - ${t.executionPrice} ${activity.probability ?? 0}% - ${
        t.impliedOdds
      } ${decimalOdds((activity.probability ?? 0) / 100)}`;

const hasActivityExecutionDetails = (activity: PortfolioActivity) =>
  typeof activity.probability === "number" ||
  (activity.action === "closed" && typeof activity.entryAmount === "number") ||
  (activity.action === "canceled" && typeof activity.shares === "number");

const lifecycleStatusLabel = (status?: string) => (status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : "Filled");

const activityStatusLabel = (activity: PortfolioActivity) =>
  activity.action === "canceled" ? "Canceled" : activity.action === "opened" || activity.action === "sold" ? "Filled" : "Closed";

const activitySideLabel = (activity: PortfolioActivity) =>
  (activity.contractSide ?? activity.selection?.contractSide) === "no" || activity.side === "sell" ? "No" : "Yes";

const activityDisplayTitle = (activity: PortfolioActivity) =>
  displayPositionChoice(activity).replace(/^(Yes|No)\s*-\s*/i, "");

const activityMarketSubline = (activity: PortfolioActivity) => {
  const line = activity.selection?.line;
  if (activity.selection?.marketType === "totals" && line) return `Total Goals ${line}`;
  if (activity.selection?.marketType === "spread" && line) return `Spread ${line}`;
  if (activity.selection?.marketType === "team-total" && line) return `Team Total ${line}`;
  return activity.outcome;
};

const activityEventSubline = (activity: PortfolioActivity) => {
  return compactPortfolioEventSubline(activity);
};

type PortfolioTab = "positions" | "orders" | "history";

const portfolioPageCopy = {
  en: {
    profile: "holiwynplayer7067",
    cash: "cash",
    deposit: "Deposit",
    withdraw: "Withdraw",
    positions: "Positions",
    orders: "Orders",
    history: "History",
    noOpenOrders: "No open orders",
    noHistory: "No history",
    chance: "chance",
    cashOut: "Cash out",
  },
  zh: {
    profile: "liyunplayer7067",
    cash: "\u73b0\u91d1",
    deposit: "\u5145\u503c",
    withdraw: "\u63d0\u73b0",
    positions: "\u6301\u4ed3",
    orders: "\u8ba2\u5355",
    history: "\u5386\u53f2",
    noOpenOrders: "\u6682\u65e0\u672a\u5b8c\u6210\u8ba2\u5355",
    noHistory: "\u6682\u65e0\u5386\u53f2",
    chance: "\u6982\u7387",
    cashOut: "\u5151\u73b0",
  },
};

const PORTFOLIO_CHART_TOP = 14;
const PORTFOLIO_CHART_HEIGHT = 92;

function PortfolioSparkline({
  range,
  source,
  status,
  points,
}: {
  range: PortfolioValueHistoryRange;
  source: string;
  status: string;
  points: PortfolioValueHistoryPoint[];
}) {
  const [selectedIndexOverride, setSelectedIndexOverride] = useState<number | null>(null);
  const values = points.map((point) => point.value);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const spread = Math.max(max - min, 1);
  const rangeSpread = Math.round(spread);
  const plotted = points.map((point, index) => ({
    key: `${point.timestamp}-${index}`,
    left: points.length <= 1 ? 0 : (index / (points.length - 1)) * 100,
    top: PORTFOLIO_CHART_TOP + (1 - (point.value - min) / spread) * PORTFOLIO_CHART_HEIGHT,
    value: point.value,
  }));
  const trend = points.length >= 2 && points[points.length - 1].value >= points[0].value ? "up" : "down";
  const pointCount = points.length;
  const selectedIndex = Math.min(selectedIndexOverride ?? Math.max(pointCount - 1, 0), Math.max(pointCount - 1, 0));
  const selectedPoint = points[selectedIndex];
  const selectedValue = selectedPoint?.value ?? 0;

  useEffect(() => {
    setSelectedIndexOverride(null);
  }, [range, source, status, pointCount]);

  return (
    <Pressable
      accessibilityLabel={`portfolio-performance-chart portfolio-chart-contained-above-range portfolio-chart-data-driven portfolio-chart-scaled-account-range portfolio-chart-touchable portfolio-performance-chart-range-${range} portfolio-chart-source-${source} portfolio-chart-status-${status} portfolio-chart-point-count-${pointCount} portfolio-chart-trend-${trend} portfolio-chart-value-spread-${rangeSpread} portfolio-chart-selected-index-${selectedIndex} portfolio-chart-selected-value-${Math.round(selectedValue)}`}
      onPress={() => setSelectedIndexOverride(pointCount > 2 ? Math.floor(pointCount / 2) : Math.max(pointCount - 1, 0))}
      testID="portfolio-performance-chart"
      style={styles.chartArea}
    >
      {selectedIndexOverride !== null && (
        <View
          accessibilityLabel={`portfolio-chart-readout portfolio-chart-selected-index-${selectedIndex} portfolio-chart-selected-value-${Math.round(selectedValue)}`}
          style={styles.chartReadout}
          testID="portfolio-chart-readout"
        >
          <Text style={styles.chartReadoutValue}>{money(selectedValue)}</Text>
          <Text style={styles.chartReadoutLabel}>{range}</Text>
        </View>
      )}
      {plotted.slice(0, -1).map((point, index) => {
        const next = plotted[index + 1];
        return (
          <View
            key={`segment-${point.key}`}
            style={[
              styles.chartSegment,
              {
                left: `${point.left}%`,
                top: (point.top + next.top) / 2,
                width: `${Math.max(next.left - point.left, 4)}%`,
                transform: [{ rotate: `${Math.atan2(next.top - point.top, 68) * (180 / Math.PI)}deg` }],
              },
            ]}
          />
        );
      })}
      {plotted.map((point, index) => (
        <View
          key={`point-${point.key}`}
          style={[
            styles.chartPoint,
            index === selectedIndex && styles.chartPointSelected,
            {
              left: `${point.left}%`,
              top: point.top - 5,
              opacity: index === selectedIndex || index === plotted.length - 1 ? 1 : 0.55,
            },
          ]}
        />
      ))}
    </Pressable>
  );
}

export function Portfolio({
  locale,
  t,
  balance,
  positions,
  latestOrder,
  openOrders,
  activities,
  syncStatus,
  openCashoutPosition,
  openPositionTrade,
  cancelOpenOrder,
  loadValueHistory,
  openAccount,
}: {
  locale: Locale;
  t: PortfolioCopy;
  balance: number;
  positions: Position[];
  latestOrder: OrderConfirmation | null;
  openOrders: OpenOrder[];
  activities: PortfolioActivity[];
  syncStatus: PortfolioSyncStatus;
  openCashoutPosition: (position: Position) => void;
  openPositionTrade: (position: Position, side: "buy" | "sell") => void;
  cancelOpenOrder: (order: OpenOrder) => void;
  loadValueHistory?: (range: PortfolioValueHistoryRange) => Promise<PortfolioValueHistory>;
  openAccount: () => void;
}) {
  const scrollRef = useRef<ScrollView | null>(null);
  const [expandedPositionId, setExpandedPositionId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PortfolioTab>("positions");
  const [activeRange, setActiveRange] = useState<PortfolioValueHistoryRange>("1D");
  const [serverValueHistory, setServerValueHistory] = useState<PortfolioValueHistory | null>(null);
  const closedActivityCount = activities.filter((activity) => activity.action === "closed").length;
  const latestActivity = activities[0];
  const detailCopy = portfolioDetailCopy[locale];
  const pageCopy = portfolioPageCopy[locale];
  const portfolioValue = balance + currentValueTotal(positions);
  const portfolioPnl = pnlTotal(positions);
  const portfolioPnlPercent = investedTotal(positions) > 0 ? (portfolioPnl / investedTotal(positions)) * 100 : 0;
  const valueHistory = deterministicPortfolioValueHistory({
    range: activeRange,
    cash: balance,
    positionsValue: currentValueTotal(positions),
    pnl: portfolioPnl,
  });
  const routeErrorValueHistory: PortfolioValueHistory = {
    range: activeRange,
    ranges: valueHistory.ranges,
    source: "portfolio-value-history-route",
    status: "error",
    generatedAt: new Date(0).toISOString(),
    lastUpdated: null,
    emptyState: "no-history",
    points: [],
  };
  const displayedValueHistory =
    serverValueHistory?.range === activeRange
      ? serverValueHistory
      : loadValueHistory
        ? routeErrorValueHistory
      : valueHistory;

  useEffect(() => {
    if (!loadValueHistory) {
      setServerValueHistory(null);
      return undefined;
    }
    let cancelled = false;
    loadValueHistory(activeRange)
      .then((history) => {
        if (!cancelled) setServerValueHistory(history);
      })
      .catch(() => {
        if (!cancelled) setServerValueHistory({
          range: activeRange,
          ranges: valueHistory.ranges,
          source: "portfolio-value-history-route",
          status: "error",
          generatedAt: new Date().toISOString(),
          lastUpdated: null,
          emptyState: "no-history",
          points: [],
        });
      });
    return () => {
      cancelled = true;
    };
  }, [activeRange, loadValueHistory]);

  useEffect(() => {
    if (latestOrder?.status?.toLowerCase() === "open" && openOrders.length > 0 && positions.length === 0) {
      setActiveTab("orders");
    }
  }, [latestOrder?.id, latestOrder?.status, openOrders.length, positions.length]);

  useEffect(() => {
    if (!latestOrder) return undefined;
    const hasVisibleResult =
      positions.length > 0 ||
      openOrders.length > 0 ||
      activities.length > 0;
    if (!hasVisibleResult) return undefined;
    const handle = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }, 650);
    return () => clearTimeout(handle);
  }, [latestOrder?.id, latestOrder?.status, positions.length, openOrders.length, activities.length]);

  const syncTitle =
    syncStatus === "syncing"
      ? t.portfolioSyncing
      : syncStatus === "synced"
        ? t.portfolioSynced
        : syncStatus === "error"
          ? t.portfolioSyncError
          : "";
  const openOrdersSection =
    openOrders.length > 0 ? (
      <View style={styles.openOrdersBlock}>
        <Text style={styles.openOrdersTitle}>{t.openOrders}</Text>
        {openOrders.slice(0, 5).map((order) => (
          <Pressable
            accessibilityLabel={`open-order-row-${order.id} open-order-row-retail-simple ${selectionIdentityLabel(order)}`}
            key={order.id}
            onPress={() => setExpandedOrderId((current) => (current === order.id ? null : order.id))}
            style={[styles.openOrderItem, expandedOrderId === order.id && styles.rowExpanded]}
            testID={`open-order-row-${order.id}`}
          >
            <View style={styles.openOrderHeader}>
              <View style={styles.openOrderMain}>
                <Text style={styles.openOrderTitle}>{order.title}</Text>
                <Text style={styles.openOrderMeta}>
                  {order.side === "buy" ? t.buy : t.sell} - {displayOutcome(order)} - {order.status}
                </Text>
                <View
                  accessibilityLabel={`open-order-status-${order.id} fake-token-test order-status-${order.status.toLowerCase()} ${order.selection ? snapshotSourceLabel(order.id, order.selection) : ""}`}
                  style={styles.a11yOnly}
                  testID={`open-order-status-${order.id}`}
                />
              </View>
              <Pressable
                accessibilityLabel={`cancel-open-order-${order.id}`}
                onPress={() => cancelOpenOrder(order)}
                style={styles.cancelOrderButton}
                testID={`cancel-open-order-${order.id}`}
              >
                <Text style={styles.cancelOrderText}>{t.cancelOrder}</Text>
              </Pressable>
            </View>
            <View style={styles.openOrderMetricGrid}>
              <View style={styles.openOrderMetricBox}>
                <Text style={styles.openOrderMetricLabel}>{t.limitPrice}</Text>
                <Text style={styles.openOrderPrice}>{Math.round(order.price * 100)}%</Text>
              </View>
              <View style={styles.openOrderMetricBox}>
                <Text style={styles.openOrderMetricLabel}>{t.orderValue}</Text>
                <Text style={styles.openOrderMetricValue}>{money(openOrderValue(order))}</Text>
              </View>
            </View>
            <Text accessibilityLabel={`open-order-remaining-value-${order.id}`} style={styles.openOrderRemaining}>
              {openOrderRemainingShares(order).toLocaleString(undefined, { maximumFractionDigits: 2 })} {t.shares} {t.remaining.toLowerCase()}
            </Text>
            <Text accessibilityLabel={`open-order-potential-payout-${order.id}`} style={styles.openOrderRemaining}>
              {t[openOrderPotentialCopyKey(order)]}: {money(openOrderPotentialValue(order))}
            </Text>
            {typeof order.originalShares === "number" && (
              <Text accessibilityLabel={`open-order-size-${order.id}`} style={[styles.openOrderPlaced, styles.a11yOnly]}>
                {t.size}: {order.originalShares.toLocaleString(undefined, { maximumFractionDigits: 2 })} {t.shares}
              </Text>
            )}
            {openOrderFilledText(order, t) && (
              <Text accessibilityLabel={`open-order-filled-${order.id}`} style={[styles.openOrderPlaced, styles.a11yOnly]}>
                {openOrderFilledText(order, t)}
              </Text>
            )}
            {order.placedAt && (
              <Text accessibilityLabel={`open-order-placed-${order.id}`} style={[styles.openOrderPlaced, styles.a11yOnly]}>
                {t.placed}: {order.placedAt}
              </Text>
            )}
            {expandedOrderId === order.id && (
              <View accessibilityLabel={`open-order-detail-${order.id}`} testID={`open-order-detail-${order.id}`} style={styles.detailPanel}>
                <Text style={styles.detailPanelTitle}>{detailCopy.details}</Text>
                <Text style={styles.detailPanelText}>{order.side === "buy" ? t.potentialPayout : t.potentialProceeds}: {money(openOrderPotentialValue(order))}</Text>
                <Text style={styles.detailPanelText}>{t.remaining}: {openOrderRemainingShares(order).toLocaleString(undefined, { maximumFractionDigits: 2 })} {t.shares}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    ) : null;

  const tabs: Array<{ key: PortfolioTab; label: string }> = [
    { key: "positions", label: pageCopy.positions },
    { key: "orders", label: pageCopy.orders },
    { key: "history", label: pageCopy.history },
  ];

  return (
    <ScrollView ref={scrollRef} accessibilityLabel={`portfolio-screen ${latestOrder ? "portfolio-result-content-landing portfolio-result-lands-at-account-header" : "portfolio-normal-browse"}`} testID="portfolio-screen" style={styles.content} contentContainerStyle={styles.scrollPad}>
      <View accessibilityLabel="portfolio-profile-header portfolio-header-retail-density" testID="portfolio-profile-header" style={styles.profileHeader}>
        <Pressable
          accessibilityLabel="portfolio-account-entry-top-left portfolio-account-entry-opens-account"
          accessibilityRole="button"
          onPress={openAccount}
          style={styles.profileLeft}
          testID="portfolio-account-entry-top-left"
        >
          <PortfolioAvatar />
          <Text style={styles.profileName}>{pageCopy.profile}</Text>
        </Pressable>
      </View>
      <View accessibilityLabel="fake-balance-card portfolio-value-retail-density portfolio-header-dollar-value" testID="fake-balance-card" style={styles.valueBlock}>
        <Text style={styles.portfolioValue}>{portfolioHeaderMoney(portfolioValue)}</Text>
        <Text style={[styles.portfolioPnlLine, portfolioPnl >= 0 ? styles.pnlPositive : styles.pnlNegative]}>
          {portfolioPnl >= 0 ? "+" : ""}
          {portfolioHeaderMoney(portfolioPnl)} ({portfolioPnlPercent >= 0 ? "+" : ""}{portfolioPnlPercent.toFixed(1)}%) <Text style={styles.cashText}>{portfolioHeaderMoney(balance)} {pageCopy.cash}</Text>
        </Text>
      </View>
      <PortfolioSparkline
        points={displayedValueHistory.points}
        range={displayedValueHistory.range}
        source={displayedValueHistory.source}
        status={displayedValueHistory.status}
      />
      <View accessibilityLabel="portfolio-range-brand-row portfolio-range-tabs-first-screen-fit portfolio-range-watermark-s23-fit portfolio-brand-watermark-no-clip" testID="portfolio-range-brand-row" style={styles.rangeBrandRow}>
        <View accessibilityLabel="portfolio-range-selector" testID="portfolio-range-selector" style={styles.rangeRow}>
          {(["1D", "1W", "1M", "All"] as const).map((range) => (
            <Pressable
              accessibilityLabel={`portfolio-range-${range} ${activeRange === range ? "portfolio-range-selected" : "portfolio-range-inactive"}`}
              accessibilityState={{ selected: activeRange === range }}
              key={range}
              onPress={() => setActiveRange(range)}
              style={[styles.rangePill, activeRange === range && styles.rangePillActive]}
              testID={`portfolio-range-${range.toLowerCase()}`}
            >
              <Text style={[styles.rangeText, activeRange === range && styles.rangeTextActive]}>{range}</Text>
            </Pressable>
          ))}
        </View>
        <View accessibilityLabel="portfolio-brand-watermark portfolio-brand-watermark-no-clip" testID="portfolio-brand-watermark" style={styles.brandWatermark}>
          <Ionicons name="cube-outline" color="#334155" size={21} />
          <Text numberOfLines={1} style={styles.brandWatermarkText}>Holiwyn</Text>
        </View>
      </View>
      <View accessibilityLabel="portfolio-funding-hidden-local-mvp" testID="portfolio-funding-hidden-local-mvp" style={styles.a11yOnly}>
        <Text>funding-hidden-local-mvp</Text>
      </View>
      <View accessibilityLabel="portfolio-section-tabs" testID="portfolio-section-tabs" style={styles.portfolioTabs}>
        {tabs.map((item) => (
          <Pressable
            accessibilityLabel={`portfolio-tab-${item.key} ${activeTab === item.key ? "portfolio-tab-selected" : "portfolio-tab-inactive"}`}
            key={item.key}
            onPress={() => setActiveTab(item.key)}
            style={[styles.portfolioTabButton, activeTab === item.key && styles.portfolioTabButtonActive]}
            testID={`portfolio-tab-${item.key}`}
          >
            <Text style={[styles.portfolioTabText, activeTab === item.key && styles.portfolioTabTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      {false && latestActivity && (
        <View accessibilityLabel={`latest-activity-card ${selectionIdentityLabel(latestActivity)}`} testID="latest-activity-card" style={styles.latestActivityCard}>
          <View style={styles.latestActivityTop}>
            <Text style={styles.latestActivityLabel}>{t.recentActivity}</Text>
            <Text style={styles.latestActivityAmount}>{money(latestActivity.amount)}</Text>
          </View>
          <Text style={styles.latestActivityAction}>{activityActionLabel(latestActivity, t)}</Text>
          <View
            accessibilityLabel={`latest-activity-status-${latestActivity.id} fake-token-test activity-${latestActivity.action} status-${activityStatusLabel(latestActivity).toLowerCase()}`}
            style={styles.statusPillRow}
            testID={`latest-activity-status-${latestActivity.id}`}
          >
            <Text style={styles.statusPill}>Fake-token test</Text>
            <Text style={styles.statusPill}>{activityStatusLabel(latestActivity)}</Text>
            {latestActivity.selection && <Text accessibilityLabel={`latest-activity-snapshot-${latestActivity.id} ${snapshotSourceLabel(latestActivity.id, latestActivity.selection)}`} style={styles.statusPill}>Order-time snapshot</Text>}
          </View>
          {latestActivity.timestamp && (
            <Text accessibilityLabel={`latest-activity-time-${latestActivity.id}`} style={styles.activityTime}>
              {latestActivity.timestamp}
            </Text>
          )}
          <Text style={styles.latestActivityMeta}>
            {latestActivity.title} - {displayOutcome(latestActivity)}
          </Text>
          {hasActivityExecutionDetails(latestActivity) && (
              <Text accessibilityLabel={`latest-activity-execution-${latestActivity.id}`} style={styles.activityExecution}>
                {activityExecutionText(latestActivity, t)}
              </Text>
            )}
        </View>
      )}
      {false && openOrdersSection}
      {activeTab === "positions" && (positions.length === 0 ? (
        <View style={styles.emptyStatePlain}>
          <Ionicons name="wallet-outline" size={34} color="#64748b" />
          <Text style={styles.emptyTitle}>{t.noPositions}</Text>
          <Text style={styles.emptyText}>{t.noPositionsBody}</Text>
        </View>
      ) : (
        <>
          <View style={styles.a11yOnly}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t.invested}</Text>
              <Text style={styles.summaryValue}>{money(investedTotal(positions))}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t.currentValue}</Text>
              <Text style={styles.summaryValue}>{money(currentValueTotal(positions))}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t.estimatedPnl}</Text>
              <Text style={[styles.summaryValue, pnlTotal(positions) >= 0 ? styles.pnlPositive : styles.pnlNegative]}>
                {pnlTotal(positions) >= 0 ? "+" : ""}
                {money(pnlTotal(positions))}
              </Text>
            </View>
          </View>
          {positions.map((position) => (
            <View accessibilityLabel={`position-card-${position.id} portfolio-position-retail-density-fit portfolio-position-tabs-gap-closed-s23 portfolio-first-position-first-screen-fit portfolio-row-dollar-amounts portfolio-position-to-win-payout portfolio-position-outcome-compact-label portfolio-position-market-context-readable portfolio-outcome-compact-${compactVisibleOutcomeLabel(position)} portfolio-position-visible-label-${displayPositionChoice(position)} ${portfolioSourceNote(position.selection)?.accessibility ?? ""} ${providerBreadthCodes(position) ? "portfolio-event-title-compact-provider" : ""} ${selectionIdentityLabel(position)}`} key={position.id} style={styles.positionCard}>
              <View style={styles.positionEventLine}>
                <Text style={styles.positionScoreLine}>{compactPortfolioScoreLine(position)}</Text>
                {(position.isLive || position.liveClock) && (
                  <View style={styles.positionLiveInline}>
                    <View style={styles.liveDot} />
                    {position.isLive && (
                      <Text accessibilityLabel="portfolio-position-live-badge" testID="portfolio-position-live-badge" style={styles.positionLiveText}>{t.liveNow}</Text>
                    )}
                    {position.liveClock && (
                      <Text accessibilityLabel="portfolio-position-live-clock" testID="portfolio-position-live-clock" style={styles.positionLiveClock}>{position.liveClock}</Text>
                    )}
                  </View>
                )}
              </View>
              <View style={styles.positionRowTop}>
                <PositionFlag item={position} />
                <View style={styles.positionTextColumn}>
                  <View style={styles.positionTitleRow}>
                    <Text numberOfLines={1} style={styles.positionTitle}><Text style={styles.yesBadge}>{position.contractSide === "no" ? "No" : "Yes"}</Text> {displayPositionChoice(position)}</Text>
                    {position.selection && (
                      <View
                        accessibilityLabel={`portfolio-position-source-badge-${position.id} ${portfolioSourceBadge(position.selection).accessibility}`}
                        style={[
                          styles.portfolioSourcePill,
                          portfolioSourceBadge(position.selection).tone === "provider" && styles.portfolioSourcePillProvider,
                          portfolioSourceBadge(position.selection).tone === "fixture" && styles.portfolioSourcePillFixture,
                        ]}
                        testID={`portfolio-position-source-badge-${position.id}`}
                      >
                        <Text
                          style={[
                            styles.portfolioSourcePillText,
                            portfolioSourceBadge(position.selection).tone === "provider" && styles.portfolioSourcePillTextProvider,
                            portfolioSourceBadge(position.selection).tone === "fixture" && styles.portfolioSourcePillTextFixture,
                          ]}
                        >
                          {portfolioSourceBadge(position.selection).label}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.positionMeta}>
                    Cost {portfolioRowMoney(position.amount)} | To win {portfolioRowMoney(positionPotentialPayout(position))} | Entry {position.probability}%
                  </Text>
                  {portfolioSourceNote(position.selection) && (
                    <Text
                      accessibilityLabel={`portfolio-position-source-note-${position.id} ${portfolioSourceNote(position.selection)?.accessibility}`}
                      style={[
                        styles.portfolioSourceNote,
                        portfolioSourceNote(position.selection)?.tone === "provider" && styles.portfolioSourceNoteProvider,
                        portfolioSourceNote(position.selection)?.tone === "fixture" && styles.portfolioSourceNoteFixture,
                      ]}
                      testID={`portfolio-position-source-note-${position.id}`}
                    >
                      {portfolioSourceNote(position.selection)?.text}
                    </Text>
                  )}
                </View>
              </View>
              {position.selection && (
                <Text accessibilityLabel={`position-snapshot-${position.id} ${snapshotSourceLabel(position.id, position.selection)}`} style={[styles.snapshotText, styles.a11yOnly]}>
                  Order-time snapshot
                </Text>
              )}
              <Text
                accessibilityLabel={`portfolio-result-route-proof portfolio-chart-source-${displayedValueHistory.source} portfolio-chart-status-${displayedValueHistory.status}`}
                style={styles.a11yOnly}
                testID={`portfolio-result-route-proof-${position.id}`}
              >
                Portfolio route proof
              </Text>
              <Pressable
                accessibilityLabel={`position-detail-toggle-${position.id}`}
                onPress={() => setExpandedPositionId((current) => (current === position.id ? null : position.id))}
                style={[styles.detailToggle, styles.a11yOnly]}
                testID={`position-detail-toggle-${position.id}`}
              >
                <Ionicons name={expandedPositionId === position.id ? "chevron-up" : "chevron-down"} color="#93c5fd" size={16} />
                <Text style={styles.detailToggleText}>{expandedPositionId === position.id ? detailCopy.hideDetails : detailCopy.actionHint}</Text>
              </Pressable>
              <View accessibilityLabel="portfolio-position-actions-fit-phone" testID="portfolio-position-actions-fit-phone" style={styles.positionValueRow}>
                <View style={styles.positionValueBlock}>
                  <Text adjustsFontSizeToFit minimumFontScale={0.78} numberOfLines={1} style={styles.positionValue}>{portfolioRowMoney(portfolioPositionValue(position))} <Text style={estimatedPnl(position) >= 0 ? styles.pnlPositive : styles.pnlNegative}>{estimatedPnl(position) >= 0 ? "+" : ""}{portfolioRowMoney(estimatedPnl(position))}</Text></Text>
                  <Text style={styles.positionChance}>{Math.round(position.currentPrice ? position.currentPrice * 100 : position.probability)}% {pageCopy.chance}</Text>
                </View>
                <View style={styles.positionQuickActions}>
                  {canCashOutPosition(position) && (
                    <Pressable
                      accessibilityLabel={`portfolio-position-cash-out-${position.id}`}
                      onPress={() => openCashoutPosition(position)}
                      style={styles.cashOutButton}
                      testID={`portfolio-position-cash-out-${position.id}`}
                    >
                      <Text style={styles.cashOutText}>{pageCopy.cashOut}</Text>
                    </Pressable>
                  )}
                  <Pressable
                    accessibilityLabel={`position-trade-buy-${position.id}`}
                    onPress={() => openPositionTrade(position, "buy")}
                    style={styles.addPositionButton}
                    testID={`position-trade-buy-${position.id}`}
                  >
                    <Ionicons name="add" color="#ffffff" size={24} />
                  </Pressable>
                </View>
              </View>
              <View style={[styles.positionDetailGrid, styles.a11yOnly]}>
                <View style={styles.positionDetailItem}>
                  <Text style={styles.positionDetailLabel}>{t.entry}</Text>
                  <Text style={styles.positionDetailValue}>{position.probability}%</Text>
                </View>
                <View style={styles.positionDetailItem}>
                  <Text style={styles.positionDetailLabel}>{t.currentValue}</Text>
                  <Text style={styles.positionDetailValue}>{money(portfolioPositionValue(position))}</Text>
                </View>
                <View style={styles.positionDetailItem}>
                  <Text style={styles.positionDetailLabel}>{t.estimatedPnl}</Text>
                  <Text style={[styles.positionDetailValue, estimatedPnl(position) >= 0 ? styles.pnlPositive : styles.pnlNegative]}>
                    {estimatedPnl(position) >= 0 ? "+" : ""}
                    {money(estimatedPnl(position))}
                  </Text>
                </View>
              </View>
              {typeof position.shares === "number" && (
                <Text accessibilityLabel={`position-shares-${position.id}`} style={[styles.positionServerMeta, styles.a11yOnly]}>
                  {t.filledShares}: {position.shares.toFixed(2)}
                  {typeof position.currentPrice === "number" ? ` - ${t.currentPrice} ${Math.round(position.currentPrice * 100)}%` : ""}
                </Text>
              )}
              {(typeof position.shares === "number" || typeof position.currentPrice === "number") && (
                <View style={[styles.positionServerDetailGrid, styles.a11yOnly]}>
                  {typeof position.shares === "number" && (
                    <View
                      accessibilityLabel={`position-filled-shares-${position.id}`}
                      style={styles.positionServerDetailItem}
                      testID={`position-filled-shares-${position.id}`}
                    >
                      <Text style={styles.positionServerDetailLabel}>{t.filledShares}</Text>
                      <Text style={styles.positionServerDetailValue}>{position.shares.toFixed(2)}</Text>
                    </View>
                  )}
                  {typeof position.currentPrice === "number" && (
                    <View
                      accessibilityLabel={`position-current-price-${position.id}`}
                      style={styles.positionServerDetailItem}
                      testID={`position-current-price-${position.id}`}
                    >
                      <Text style={styles.positionServerDetailLabel}>{t.currentPrice}</Text>
                      <Text style={styles.positionServerDetailValue}>{Math.round(position.currentPrice * 100)}%</Text>
                    </View>
                  )}
                </View>
              )}
              {expandedPositionId === position.id && (
                <View accessibilityLabel={`position-detail-${position.id}`} testID={`position-detail-${position.id}`} style={styles.detailPanel}>
                  <Text style={styles.detailPanelTitle}>{detailCopy.details}</Text>
                  <Text style={styles.detailPanelText}>{t.currentValue}: {money(portfolioPositionValue(position))}</Text>
                  <Text style={styles.detailPanelText}>{t.estimatedPnl}: {estimatedPnl(position) >= 0 ? "+" : ""}{money(estimatedPnl(position))}</Text>
                  <Text style={styles.detailPanelText}>{t.currentPrice}: {typeof position.currentPrice === "number" ? `${Math.round(position.currentPrice * 100)}%` : `${position.probability}%`}</Text>
                </View>
              )}
              <View style={styles.a11yOnly}>
                <Pressable
                  accessibilityLabel={`position-trade-buy-${position.id}`}
                  onPress={() => openPositionTrade(position, "buy")}
                  style={styles.positionTradeButton}
                  testID={`position-trade-buy-${position.id}`}
                >
                  <Text style={styles.positionTradeButtonText}>{t.buy}</Text>
                </Pressable>
                {canCashOutPosition(position) && (
                  <Pressable
                    accessibilityLabel={`position-trade-sell-${position.id}`}
                    onPress={() => openCashoutPosition(position)}
                    style={styles.positionTradeButton}
                    testID={`position-trade-sell-${position.id}`}
                  >
                    <Text style={styles.positionTradeButtonText}>{t.sell}</Text>
                  </Pressable>
                )}
                {canCashOutPosition(position) && (
                  <Pressable
                    accessibilityLabel={`close-position-${position.id}`}
                    onPress={() => openCashoutPosition(position)}
                    style={styles.closeButton}
                    testID={`close-position-${position.id}`}
                  >
                    <Text style={styles.closeButtonText}>{t.closePosition}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </>
      ))}
      {activeTab === "orders" && (openOrders.length > 0 ? openOrdersSection : (
        <View
          accessibilityLabel="portfolio-no-open-orders portfolio-orders-empty-state-centered portfolio-orders-empty-state-route-proof"
          testID="portfolio-no-open-orders"
          style={styles.ordersEmptyState}
        >
          <Text style={styles.ordersEmptyText}>{pageCopy.noOpenOrders}</Text>
        </View>
      ))}
      {activeTab === "history" && (activities.length > 0 ? (
        <View style={styles.activityBlock}>
          {activities.slice(0, 5).map((activity) => (
            <Pressable
              accessibilityLabel={`activity-row-${activity.id} portfolio-history-retail-row-parity portfolio-history-dollar-amounts portfolio-history-outcome-compact-label portfolio-history-market-context-readable portfolio-history-outcome-compact-${compactVisibleOutcomeLabel(activity)} portfolio-history-visible-label-${activityDisplayTitle(activity)} portfolio-history-fill-count-${activity.fillCount ?? 1} ${portfolioSourceNote(activity.selection)?.accessibility ?? ""} ${providerBreadthCodes(activity) ? "portfolio-history-event-title-compact-provider" : ""} ${selectionIdentityLabel(activity)}`}
              key={activity.id}
              onPress={() => setExpandedActivityId((current) => (current === activity.id ? null : activity.id))}
              style={[styles.activityItem, expandedActivityId === activity.id && styles.rowExpanded]}
              testID={`activity-row-${activity.id}`}
            >
              <ActivityIcon activity={activity} />
              <View style={styles.activityMain}>
                <View style={styles.activityTitleRow}>
                  <Text style={styles.activityActionVerb}>{activityActionLabel(activity, t)}</Text>
                  <Text style={[styles.activitySidePill, activitySideLabel(activity) === "No" && styles.activitySidePillNo]}>{activitySideLabel(activity)}</Text>
                  <Text numberOfLines={1} style={styles.activityAction}>{activityDisplayTitle(activity)}</Text>
                  {activity.selection && (
                    <View
                      accessibilityLabel={`portfolio-history-source-badge-${activity.id} ${portfolioSourceBadge(activity.selection).accessibility}`}
                      style={[
                        styles.portfolioSourcePill,
                        portfolioSourceBadge(activity.selection).tone === "provider" && styles.portfolioSourcePillProvider,
                        portfolioSourceBadge(activity.selection).tone === "fixture" && styles.portfolioSourcePillFixture,
                      ]}
                      testID={`portfolio-history-source-badge-${activity.id}`}
                    >
                      <Text
                        style={[
                          styles.portfolioSourcePillText,
                          portfolioSourceBadge(activity.selection).tone === "provider" && styles.portfolioSourcePillTextProvider,
                          portfolioSourceBadge(activity.selection).tone === "fixture" && styles.portfolioSourcePillTextFixture,
                        ]}
                      >
                        {portfolioSourceBadge(activity.selection).label}
                      </Text>
                    </View>
                  )}
                </View>
                <View
                  accessibilityLabel={`activity-status-${activity.id} fake-token-test activity-${activity.action} status-${activityStatusLabel(activity).toLowerCase()}`}
                  style={[styles.statusPillRow, styles.a11yOnly]}
                  testID={`activity-status-${activity.id}`}
                >
                  <Text style={styles.statusPill}>Fake-token test</Text>
                  <Text style={styles.statusPill}>{activityStatusLabel(activity)}</Text>
                  {activity.selection && <Text accessibilityLabel={`activity-snapshot-${activity.id} ${snapshotSourceLabel(activity.id, activity.selection)}`} style={styles.statusPill}>Order-time snapshot</Text>}
                </View>
                {activity.isLive && (
                  <Text accessibilityLabel="portfolio-activity-live-badge" style={styles.activityLiveText}>
                    {t.liveNow}
                  </Text>
                )}
                {portfolioSourceNote(activity.selection) && (
                  <Text
                    accessibilityLabel={`portfolio-history-source-note-${activity.id} ${portfolioSourceNote(activity.selection)?.accessibility}`}
                    style={[
                      styles.portfolioSourceNote,
                      portfolioSourceNote(activity.selection)?.tone === "provider" && styles.portfolioSourceNoteProvider,
                      portfolioSourceNote(activity.selection)?.tone === "fixture" && styles.portfolioSourceNoteFixture,
                    ]}
                    testID={`portfolio-history-source-note-${activity.id}`}
                  >
                    {portfolioSourceNote(activity.selection)?.text}
                  </Text>
                )}
                {activity.liveClock && (
                  <Text accessibilityLabel="portfolio-activity-live-clock" style={styles.activityLiveClock}>
                    {activity.liveClock}
                  </Text>
                )}
                <Text numberOfLines={1} style={styles.activityMeta}>
                  {activityEventSubline(activity)}
                </Text>
                <Text numberOfLines={1} style={styles.activityMarketMeta}>
                  {activityMarketSubline(activity)}
                </Text>
                {hasActivityExecutionDetails(activity) && (
                  <Text accessibilityLabel={`activity-execution-${activity.id}`} style={[styles.activityExecution, styles.a11yOnly]}>
                    {activityExecutionText(activity, t)}
                  </Text>
                )}
              </View>
              <View
                accessibilityLabel={`portfolio-history-side-meta ${activity.timestamp ? "portfolio-history-time portfolio-history-relative-time" : "portfolio-history-time-none"} ${activity.timestamp ?? ""} ${activityRelativeTime(activity.timestamp)}`}
                style={styles.activitySideMeta}
                testID={`portfolio-history-side-meta-${activity.id}`}
              >
                <Text style={styles.activityAmount}>{portfolioRowMoney(activity.amount)}</Text>
                {activity.timestamp && (
                  <Text accessibilityLabel={`activity-time-${activity.id} activity-time-relative portfolio-history-relative-time-format activity-time-raw-${activity.timestamp}`} style={styles.activityTime}>
                    {activityRelativeTime(activity.timestamp)}
                  </Text>
                )}
              </View>
              {expandedActivityId === activity.id && (
                <View accessibilityLabel={`activity-detail-${activity.id}`} testID={`activity-detail-${activity.id}`} style={styles.activityDetailPanel}>
                  <Text style={styles.detailPanelTitle}>{detailCopy.details}</Text>
                  <Text style={styles.detailPanelText}>{activity.title} - {displayOutcome(activity)}</Text>
                  <Text style={styles.detailPanelText}>{activityExecutionText(activity, t)}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      ) : (
        <View accessibilityLabel="portfolio-no-history" testID="portfolio-no-history" style={styles.emptyStatePlain}>
          <Text style={styles.emptyPlainText}>{pageCopy.noHistory}</Text>
        </View>
      ))}
      {syncStatus !== "hidden" && (
        <View accessibilityLabel="portfolio-sync-status" testID="portfolio-sync-status" style={[styles.syncCard, styles.a11yOnly]}>
          <Ionicons
            name={syncStatus === "error" ? "cloud-offline-outline" : "cloud-done-outline"}
            size={20}
            color={syncStatus === "error" ? "#fbbf24" : "#93c5fd"}
          />
          <View style={styles.syncTextBlock}>
            <Text style={styles.syncTitle}>{syncTitle}</Text>
            {syncStatus === "error" && <Text style={styles.syncBody}>{t.portfolioSyncFallback}</Text>}
          </View>
        </View>
      )}
      <View style={styles.a11yOnly}>
        <View accessibilityLabel="portfolio-position-count" testID="portfolio-position-count" style={styles.countTile}>
          <Text style={styles.positionCountLabel}>{t.openPositions}</Text>
          <Text style={styles.positionCountValue}>{positions.length}</Text>
        </View>
        <View accessibilityLabel="portfolio-open-order-count" testID="portfolio-open-order-count" style={styles.countTile}>
          <Text style={styles.positionCountLabel}>{t.openOrders}</Text>
          <Text style={styles.positionCountValue}>{openOrders.length}</Text>
        </View>
        <View accessibilityLabel="portfolio-activity-count" testID="portfolio-activity-count" style={styles.countTile}>
          <Text style={styles.positionCountLabel}>{t.activityCount}</Text>
          <Text style={styles.positionCountValue}>{activities.length}</Text>
        </View>
        <View accessibilityLabel="portfolio-closed-count" testID="portfolio-closed-count" style={styles.countTile}>
          <Text style={styles.positionCountLabel}>{t.closedTrades}</Text>
          <Text style={styles.positionCountValue}>{closedActivityCount}</Text>
        </View>
      </View>
      {latestOrder && (
        <View accessibilityLabel={`latest-order-card ${selectionIdentityLabel(latestOrder)}`} testID="latest-order-card" style={[styles.confirmationCard, styles.a11yOnly]}>
          {latestOrder.isLive && (
            <View accessibilityLabel="latest-order-live-badge" testID="latest-order-live-badge" style={styles.liveBadge}>
              <Ionicons name="radio" color="#fecaca" size={13} />
              <Text style={styles.liveBadgeText}>{t.liveNow}</Text>
            </View>
          )}
          {latestOrder.liveClock && (
            <Text accessibilityLabel="latest-order-live-clock" testID="latest-order-live-clock" style={styles.liveClock}>
              {latestOrder.liveClock}
            </Text>
          )}
          <View style={styles.confirmationTop}>
            <Text style={styles.confirmationTitle}>{t.orderPlaced}</Text>
            <Text style={styles.confirmationAmount}>{money(latestOrder.amount)}</Text>
          </View>
          <Text style={styles.confirmationMeta}>
            {latestOrder.mode.toUpperCase()} - {latestOrder.side === "buy" ? t.buy : t.sell} - {displayOutcome(latestOrder)}
            {latestOrder.status ? ` - ${latestOrder.status}` : ""}
          </Text>
          <View
            accessibilityLabel={`latest-order-status fake-token-test order-status-${(latestOrder.status ?? "filled").toLowerCase()}`}
            style={styles.statusPillRow}
            testID="latest-order-status"
          >
            <Text style={styles.statusPill}>Fake-token test</Text>
            <Text style={styles.statusPill}>{lifecycleStatusLabel(latestOrder.status)}</Text>
            {latestOrder.selection && <Text accessibilityLabel={`latest-order-snapshot ${snapshotSourceLabel(latestOrder.id, latestOrder.selection)}`} style={styles.statusPill}>Order-time snapshot</Text>}
          </View>
          <Text style={styles.confirmationMarket}>{latestOrder.title}</Text>
          {typeof latestOrder.probability === "number" && (
            <View accessibilityLabel="latest-order-execution-details" testID="latest-order-execution-details" style={styles.confirmationDetailGrid}>
              <View style={styles.confirmationDetailItem}>
                <Text style={styles.confirmationDetailLabel}>{t.filledShares}</Text>
                <Text style={styles.confirmationDetailValue}>
                  {(latestOrder.filledSize ?? activityShares(latestOrder)).toFixed(2)}
                </Text>
              </View>
              <View style={styles.confirmationDetailItem}>
                <Text style={styles.confirmationDetailLabel}>{t.executionPrice}</Text>
                <Text style={styles.confirmationDetailValue}>{latestOrder.probability}%</Text>
              </View>
              <View style={styles.confirmationDetailItem}>
                <Text style={styles.confirmationDetailLabel}>
                  {typeof latestOrder.remainingSize === "number" ? t.remaining : t.impliedOdds}
                </Text>
                <Text style={styles.confirmationDetailValue}>
                  {typeof latestOrder.remainingSize === "number"
                    ? latestOrder.remainingSize.toFixed(2)
                    : decimalOdds(latestOrder.probability / 100)}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollPad: { width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 0, paddingBottom: 110 },
  profileHeader: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 4 },
  profileLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  avatarGradient: { width: 46, height: 46, borderRadius: 999, overflow: "hidden", backgroundColor: "#f43f5e", position: "relative" },
  avatarColorStop: { position: "absolute", borderRadius: 999 },
  avatarColorStopPink: { left: -8, top: -5, width: 48, height: 48, backgroundColor: "#f43f5e" },
  avatarColorStopYellow: { right: -4, top: 2, width: 44, height: 44, backgroundColor: "#facc15" },
  avatarColorStopBlue: { left: 4, bottom: -12, width: 42, height: 42, backgroundColor: "#7c3aed" },
  profileName: { color: "#e5e7eb", fontSize: 20, fontWeight: "500", flexShrink: 1 },
  valueBlock: { paddingHorizontal: 24, paddingTop: 4 },
  portfolioValue: { color: "#f8fafc", fontSize: 50, fontWeight: "300" },
  portfolioPnlLine: { fontSize: 17, fontWeight: "500", marginTop: 0 },
  cashText: { color: "#a8b0bf" },
  chartArea: { height: 118, marginTop: 6, marginHorizontal: 22, marginBottom: 6, position: "relative", overflow: "hidden" },
  chartSegment: { position: "absolute", height: 6, borderRadius: 999, backgroundColor: "#22c55e" },
  chartSegmentOne: { left: "0%", top: 68, width: "17%" },
  chartSegmentTwo: { left: "16%", top: 72, width: "15%", transform: [{ rotate: "7deg" }] },
  chartSegmentThree: { left: "29%", top: 80, width: "7%", transform: [{ rotate: "70deg" }] },
  chartSegmentFour: { left: "35%", top: 108, width: "48%" },
  chartRangeWeek: { top: 92, transform: [{ rotate: "-2deg" }] },
  chartRangeMonth: { top: 116, transform: [{ rotate: "1deg" }] },
  chartRangeAll: { top: 82, transform: [{ rotate: "-4deg" }] },
  chartSegmentFive: { left: "82%", top: 84, width: "11%", transform: [{ rotate: "-30deg" }] },
  chartSegmentSix: { left: "91%", top: 66, width: "9%", transform: [{ rotate: "-10deg" }] },
  chartDot: { position: "absolute", right: 2, top: 58, width: 14, height: 14, borderRadius: 999, backgroundColor: "#22c55e", shadowColor: "#22c55e", shadowOpacity: 0.45, shadowRadius: 8 },
  chartPoint: { position: "absolute", width: 13, height: 13, marginLeft: -6, borderRadius: 999, backgroundColor: "#22c55e", shadowColor: "#22c55e", shadowOpacity: 0.45, shadowRadius: 8 },
  chartPointSelected: { width: 19, height: 19, marginLeft: -9, borderWidth: 3, borderColor: "#bbf7d0" },
  chartReadout: { position: "absolute", top: 0, left: 0, minWidth: 124, minHeight: 58, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2937", zIndex: 2 },
  chartReadoutValue: { color: "#f8fafc", fontSize: 17, fontWeight: "700" },
  chartReadoutLabel: { color: "#22c55e", fontSize: 12, fontWeight: "700", marginTop: 2 },
  rangeBrandRow: { minHeight: 48, marginTop: 2, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  rangeRow: { flexDirection: "row", padding: 4, borderRadius: 999, backgroundColor: "#202633" },
  rangePill: { minWidth: 45, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 999 },
  rangePillActive: { backgroundColor: "#0c111d" },
  rangeText: { color: "#a8b0bf", fontSize: 16, fontWeight: "500" },
  rangeTextActive: { color: "#f8fafc" },
  brandWatermark: { flexShrink: 1, maxWidth: 112, minWidth: 92, minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 5, opacity: 0.55 },
  brandWatermarkText: { color: "#334155", fontSize: 14, fontWeight: "700", flexShrink: 1 },
  walletActionRow: { flexDirection: "row", gap: 12, paddingHorizontal: 24, marginTop: 26 },
  depositButton: { flex: 1, minHeight: 80, borderRadius: 22, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10, backgroundColor: "#f1f5f9" },
  withdrawButton: { flex: 1, minHeight: 80, borderRadius: 22, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10, borderWidth: 1, borderColor: "#263247", backgroundColor: "#080d16" },
  depositText: { color: "#080d16", fontSize: 20, fontWeight: "500" },
  withdrawText: { color: "#f8fafc", fontSize: 20, fontWeight: "500" },
  portfolioTabs: { flexDirection: "row", alignItems: "flex-end", marginTop: 10, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  portfolioTabButton: { flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center", borderBottomWidth: 3, borderBottomColor: "transparent" },
  portfolioTabButtonActive: { borderBottomColor: "#e5e7eb" },
  portfolioTabText: { color: "#8b94a5", fontSize: 21, fontWeight: "500" },
  portfolioTabTextActive: { color: "#f8fafc" },
  a11yOnly: { height: 1, opacity: 0.01, overflow: "hidden" },
  balanceCard: { padding: 18, borderRadius: 16, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginTop: 10 },
  balanceLabel: { color: "#94a3b8", fontWeight: "800" },
  balanceValue: { color: "#f8fafc", fontSize: 34, fontWeight: "900", marginTop: 6 },
  syncCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247", marginTop: 12 },
  syncTextBlock: { flex: 1 },
  syncTitle: { color: "#f8fafc", fontWeight: "900" },
  syncBody: { color: "#94a3b8", fontSize: 12, fontWeight: "700", marginTop: 3 },
  countGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  countTile: { flexGrow: 1, flexBasis: "48%", minHeight: 72, justifyContent: "space-between", paddingHorizontal: 10, paddingVertical: 10, borderRadius: 12, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  positionCountLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "900" },
  positionCountValue: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  latestActivityCard: { marginTop: 12, padding: 14, borderRadius: 14, backgroundColor: "#0f1f1d", borderWidth: 1, borderColor: "#155e75" },
  latestActivityTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  latestActivityLabel: { color: "#99f6e4", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  latestActivityAmount: { color: "#dbeafe", fontWeight: "900" },
  latestActivityAction: { color: "#f8fafc", fontSize: 18, fontWeight: "900", marginTop: 8 },
  latestActivityMeta: { color: "#94a3b8", fontSize: 12, fontWeight: "800", marginTop: 4 },
  emptyCard: { alignItems: "center", padding: 28, borderRadius: 16, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginTop: 16 },
  emptyStatePlain: { minHeight: 280, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  ordersEmptyState: { minHeight: 330, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: "#101827" },
  emptyTitle: { color: "#f8fafc", fontSize: 20, fontWeight: "900", marginTop: 10 },
  emptyText: { color: "#94a3b8", textAlign: "center", marginTop: 6, fontWeight: "700" },
  emptyPlainText: { color: "#8b94a5", fontSize: 19, fontWeight: "500" },
  ordersEmptyText: { color: "#8b94a5", fontSize: 19, fontWeight: "500" },
  summaryGrid: { flexDirection: "row", gap: 8, marginTop: 12 },
  summaryItem: { flex: 1, minHeight: 92, padding: 10, borderRadius: 10, backgroundColor: "#111b2d", borderWidth: 1, borderColor: "#2b3b55" },
  summaryLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "800" },
  summaryValue: { color: "#f8fafc", fontSize: 13, fontWeight: "900", marginTop: 8 },
  positionCard: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  detailToggle: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  detailToggleText: { color: "#93c5fd", fontSize: 11, fontWeight: "900" },
  rowHint: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  rowHintText: { color: "#93c5fd", fontSize: 11, fontWeight: "900" },
  rowExpanded: { borderColor: "#3b82f6", backgroundColor: "#12213a" },
  detailPanel: { gap: 4, marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#29476d" },
  detailPanelTitle: { color: "#dbeafe", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  detailPanelText: { color: "#94a3b8", fontSize: 12, fontWeight: "800" },
  liveBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: "#451a1a", borderWidth: 1, borderColor: "#7f1d1d" },
  liveBadgeText: { color: "#fecaca", fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  liveClock: { alignSelf: "flex-start", color: "#fca5a5", fontSize: 12, fontWeight: "900", marginBottom: 8 },
  positionEventLine: { minHeight: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 6 },
  positionLiveInline: { flexDirection: "row", alignItems: "center", gap: 7 },
  liveDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: "#dc2626" },
  positionLiveText: { color: "#ef4444", fontSize: 13, fontWeight: "700" },
  positionLiveClock: { color: "#ef4444", fontSize: 15, fontWeight: "700" },
  positionRowTop: { flexDirection: "row", gap: 12, alignItems: "center" },
  positionFlag: { width: 54, height: 54, borderRadius: 12, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  positionFlagEmoji: { fontSize: 31, lineHeight: 38 },
  positionFlagGeneric: { color: "#dbeafe", fontSize: 28, fontWeight: "700" },
  positionTextColumn: { flex: 1 },
  positionScoreLine: { color: "#a8b0bf", fontSize: 14, fontWeight: "500" },
  yesBadge: { color: "#22c55e", backgroundColor: "#052e16" },
  positionTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  positionTitle: { flex: 1, minWidth: 0, color: "#f8fafc", fontSize: 18, fontWeight: "500" },
  positionMeta: { color: "#a8b0bf", marginTop: 4, fontSize: 14, fontWeight: "500" },
  portfolioSourcePill: { minHeight: 22, justifyContent: "center", borderRadius: 999, paddingHorizontal: 8, backgroundColor: "#1f2937", borderWidth: 1, borderColor: "#334155", flexShrink: 0 },
  portfolioSourcePillProvider: { backgroundColor: "#052e16", borderColor: "#166534" },
  portfolioSourcePillFixture: { backgroundColor: "#33280f", borderColor: "#854d0e" },
  portfolioSourcePillText: { color: "#cbd5e1", fontSize: 9, fontWeight: "900" },
  portfolioSourcePillTextProvider: { color: "#86efac" },
  portfolioSourcePillTextFixture: { color: "#fde68a" },
  portfolioSourceNote: { color: "#94a3b8", fontSize: 11, fontWeight: "900", marginTop: 4 },
  portfolioSourceNoteProvider: { color: "#86efac" },
  portfolioSourceNoteFixture: { color: "#fde68a" },
  positionValueRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 14 },
  positionValueBlock: { flex: 1, minWidth: 0 },
  positionValue: { color: "#f8fafc", fontSize: 18, fontWeight: "500" },
  positionChance: { color: "#a8b0bf", fontSize: 14, fontWeight: "500", marginTop: 3 },
  positionQuickActions: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 0 },
  cashOutButton: { minWidth: 104, minHeight: 54, alignItems: "center", justifyContent: "center", paddingHorizontal: 14, borderRadius: 17, borderWidth: 1, borderColor: "#263247", backgroundColor: "#0b1220" },
  cashOutText: { color: "#f8fafc", fontSize: 16, fontWeight: "500" },
  addPositionButton: { width: 54, height: 54, alignItems: "center", justifyContent: "center", borderRadius: 17, backgroundColor: "#1238ff" },
  positionDetailGrid: { flexDirection: "row", gap: 8, marginTop: 12 },
  positionDetailItem: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  positionDetailLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "800" },
  positionDetailValue: { color: "#f8fafc", fontSize: 13, fontWeight: "900", marginTop: 5 },
  positionServerMeta: { color: "#93c5fd", fontSize: 12, fontWeight: "800", marginTop: 10 },
  positionServerDetailGrid: { flexDirection: "row", gap: 8, marginTop: 10 },
  positionServerDetailItem: { flex: 1, minHeight: 58, padding: 10, borderRadius: 8, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1d4ed8" },
  positionServerDetailLabel: { color: "#93c5fd", fontSize: 11, fontWeight: "900" },
  positionServerDetailValue: { color: "#f8fafc", fontSize: 13, fontWeight: "900", marginTop: 5 },
  pnlPositive: { color: "#22c55e" },
  pnlNegative: { color: "#ef4444" },
  positionActionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  positionTradeButton: { flex: 1, minHeight: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#0f766e", borderWidth: 1, borderColor: "#14b8a6" },
  positionTradeButtonText: { color: "#ecfeff", fontSize: 14, fontWeight: "900" },
  closeButton: { flex: 1.35, minHeight: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#1f2937", borderWidth: 1, borderColor: "#334155" },
  closeButtonText: { color: "#dbeafe", fontSize: 14, fontWeight: "900" },
  confirmationCard: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: "#12213a", borderWidth: 1, borderColor: "#2b5ca8" },
  confirmationTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  confirmationTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  confirmationAmount: { color: "#dbeafe", fontWeight: "900" },
  confirmationMeta: { color: "#93c5fd", fontSize: 12, fontWeight: "900", marginTop: 8 },
  confirmationMarket: { color: "#94a3b8", fontSize: 12, fontWeight: "700", marginTop: 4 },
  confirmationDetailGrid: { flexDirection: "row", gap: 8, marginTop: 12 },
  confirmationDetailItem: { flex: 1, minHeight: 54, padding: 8, borderRadius: 8, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#2b5ca8" },
  confirmationDetailLabel: { color: "#93c5fd", fontSize: 10, fontWeight: "900" },
  confirmationDetailValue: { color: "#f8fafc", fontSize: 12, fontWeight: "900", marginTop: 5 },
  openOrdersBlock: { paddingTop: 0 },
  openOrdersTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900", marginBottom: 10, display: "none" },
  openOrderItem: { gap: 8, paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  openOrderHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  openOrderMain: { flex: 1 },
  openOrderTitle: { color: "#f8fafc", fontWeight: "900" },
  openOrderMeta: { color: "#94a3b8", fontSize: 12, fontWeight: "700", marginTop: 3 },
  statusPillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  statusPill: { alignSelf: "flex-start", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, overflow: "hidden", backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#29476d", color: "#bfdbfe", fontSize: 10, fontWeight: "900" },
  snapshotText: { alignSelf: "flex-start", marginTop: 6, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, overflow: "hidden", backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#29476d", color: "#bfdbfe", fontSize: 10, fontWeight: "900" },
  openOrderPrice: { color: "#dbeafe", fontWeight: "900" },
  openOrderMetricGrid: { flexDirection: "row", gap: 6 },
  openOrderMetricBox: { flex: 1, minHeight: 50, padding: 8, borderRadius: 8, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  openOrderMetricLabel: { color: "#64748b", fontSize: 10, fontWeight: "900" },
  openOrderMetricValue: { color: "#dbeafe", fontSize: 11, fontWeight: "900", marginTop: 5 },
  openOrderRemaining: { color: "#94a3b8", fontSize: 11, fontWeight: "800" },
  openOrderPlaced: { color: "#64748b", fontSize: 11, fontWeight: "800" },
  cancelOrderButton: { minHeight: 36, minWidth: 92, paddingHorizontal: 10, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#1f2937", borderWidth: 1, borderColor: "#334155" },
  cancelOrderText: { color: "#dbeafe", fontSize: 12, fontWeight: "900" },
  activityBlock: { paddingTop: 6 },
  activityTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900", marginBottom: 10 },
  activityItem: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10, paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  activityIcon: { width: 50, height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#1f2937" },
  activityMain: { flex: 1, minWidth: 0 },
  activityTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  activityActionVerb: { color: "#f8fafc", fontSize: 16, fontWeight: "500" },
  activitySidePill: { overflow: "hidden", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, color: "#22c55e", backgroundColor: "#052e16", fontSize: 13, fontWeight: "700" },
  activitySidePillNo: { color: "#ef4444", backgroundColor: "#3a0f15" },
  activityAction: { flex: 1, minWidth: 0, color: "#f8fafc", fontSize: 17, fontWeight: "500" },
  activitySideMeta: { minWidth: 82, alignItems: "flex-end", gap: 6 },
  activityTime: { color: "#8b94a5", fontSize: 14, fontWeight: "500", textAlign: "right" },
  activityLiveText: { alignSelf: "flex-start", color: "#fecaca", fontSize: 11, fontWeight: "900", marginTop: 3, textTransform: "uppercase" },
  activityLiveClock: { alignSelf: "flex-start", color: "#fca5a5", fontSize: 11, fontWeight: "900", marginTop: 2 },
  activityMeta: { color: "#94a3b8", fontSize: 15, fontWeight: "500", marginTop: 6 },
  activityMarketMeta: { color: "#6f7a8d", fontSize: 14, fontWeight: "500", marginTop: 2 },
  activityExecution: { color: "#93c5fd", fontSize: 11, fontWeight: "900", marginTop: 4 },
  activityAmount: { color: "#dbeafe", fontSize: 18, fontWeight: "500", textAlign: "right" },
  activityDetailPanel: { width: "100%", gap: 4, marginTop: 2, marginLeft: 38, padding: 10, borderRadius: 10, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#29476d" },
});
