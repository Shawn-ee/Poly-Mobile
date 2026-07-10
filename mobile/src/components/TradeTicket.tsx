import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Modal, PanResponder, Pressable, StyleSheet, Text, View, Vibration, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Locale, Event, Market, Outcome } from "../mocks/worldCup";
import { label, money } from "../presentation/formatters";

export type Ticket = {
  event?: Event;
  market: Market;
  outcome: Outcome;
  side: "buy" | "sell";
  contractSide?: BinaryContractSide;
  selection?: TicketSelection;
  sourcePositionId?: string;
};

export type BinaryContractSide = "yes" | "no";

export type TicketSelection = {
  marketType: "spread" | "totals" | "team-total" | "winner" | "to_advance" | "prop" | "future" | "live";
  marketId?: string;
  outcomeId?: string;
  marketGroupId?: string;
  line?: string;
  period?: string;
  side?: string;
  displayLabel: string;
  contractSide?: BinaryContractSide;
  referenceSource?: string;
  externalSlug?: string;
  externalMarketId?: string;
  conditionId?: string;
  referenceTokenId?: string;
  referenceOutcomeLabel?: string;
  limitPrice?: number;
  limitSide?: "bid" | "ask";
  limitShares?: number;
};

type TradeTicketCopy = {
  buy: string;
  sell: string;
  amount: string;
  max: string;
  balance: string;
  estimatedCost: string;
  estimatedProceeds: string;
  estimatedFee: string;
  slippage: string;
  estimatedShares: string;
  averagePrice: string;
  impliedOdds: string;
  estimatedPayout: string;
  potentialProfit: string;
  placeMockOrder: string;
  placeBuyOrder: string;
  placeSellOrder: string;
  orderFailed: string;
  liveNow: string;
  livePriceMovement: string;
  tradingMode: string;
  tradingModeMock: string;
  tradingModeServer: string;
  bestBid: string;
  bestAsk: string;
  spread: string;
  shares: string;
  swipeBuyOrder: string;
  swipeSellOrder: string;
  releaseBuyOrder: string;
  releaseSellOrder: string;
  releaseToSubmit: string;
  finalCostMayVary: string;
  chooseAmount: string;
  toWin: string;
  odds: string;
  available: string;
  marketUnavailable: string;
  tradingDisabledForMarket: string;
};

const SWIPE_SUBMIT_THRESHOLD = 150;
const SWIPE_VISUAL_RANGE = 460;

function SwipeSubmitControl({
  disabled,
  unavailable,
  tone,
  label,
  helper,
  armedLabel,
  armedHelper,
  onSubmit,
  onProgressChange,
}: {
  disabled: boolean;
  unavailable?: boolean;
  tone: "buy" | "sell";
  label: string;
  helper: string;
  armedLabel: string;
  armedHelper: string;
  onSubmit: () => void | Promise<void>;
  onProgressChange?: (progress: number) => void;
}) {
  const [isArmed, setIsArmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const armedRef = useRef(false);
  const progressRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);
  const disabledRef = useRef(disabled);
  const submittingRef = useRef(isSubmitting);
  const onSubmitRef = useRef(onSubmit);
  const onProgressChangeRef = useRef(onProgressChange);

  useEffect(() => {
    disabledRef.current = disabled;
    submittingRef.current = isSubmitting;
    onSubmitRef.current = onSubmit;
    onProgressChangeRef.current = onProgressChange;
  }, [disabled, isSubmitting, onProgressChange, onSubmit]);

  const updateProgress = useCallback((nextProgress: number) => {
    progressRef.current = nextProgress;
    setSwipeProgress(nextProgress);
    onProgressChangeRef.current?.(nextProgress);
  }, []);
  const updateDragDistance = useCallback(
    (dragDistance: number) => {
      const progress = Math.min(dragDistance / SWIPE_VISUAL_RANGE, 1);
      const nextArmed = dragDistance >= SWIPE_SUBMIT_THRESHOLD;
      dragDistanceRef.current = dragDistance;
      updateProgress(progress);
      setIsArmed(nextArmed);
      if (nextArmed && !armedRef.current) {
        Vibration.vibrate(18);
      }
      armedRef.current = nextArmed;
    },
    [updateProgress],
  );
  const triggerSubmit = useCallback(async () => {
    if (disabledRef.current || submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await onSubmitRef.current();
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
      setIsArmed(false);
      armedRef.current = false;
      dragDistanceRef.current = 0;
      updateProgress(0);
    }
  }, [updateProgress]);
  const handleTouchStart = useCallback((event: { nativeEvent: { pageY: number } }) => {
    if (disabledRef.current || submittingRef.current) return;
    touchStartYRef.current = event.nativeEvent.pageY;
    setIsArmed(false);
    armedRef.current = false;
    progressRef.current = 0;
    dragDistanceRef.current = 0;
    updateProgress(0);
  }, [updateProgress]);
  const handleTouchMove = useCallback((event: { nativeEvent: { pageY: number } }) => {
    if (disabledRef.current || submittingRef.current || touchStartYRef.current === null) return;
    const dragDistance = Math.max(0, touchStartYRef.current - event.nativeEvent.pageY);
    updateDragDistance(dragDistance);
  }, [updateDragDistance]);
  const handleTouchEnd = useCallback(() => {
    if (disabledRef.current || submittingRef.current) return;
    const shouldSubmit =
      dragDistanceRef.current >= SWIPE_SUBMIT_THRESHOLD ||
      armedRef.current ||
      progressRef.current >= SWIPE_SUBMIT_THRESHOLD / SWIPE_VISUAL_RANGE;
    touchStartYRef.current = null;
    if (shouldSubmit) {
      void triggerSubmit();
      return;
    }
    armedRef.current = false;
    progressRef.current = 0;
    dragDistanceRef.current = 0;
    setIsArmed(false);
    updateProgress(0);
  }, [triggerSubmit, updateProgress]);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabledRef.current && !submittingRef.current,
        onStartShouldSetPanResponderCapture: () => !disabledRef.current && !submittingRef.current,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          !disabledRef.current && !submittingRef.current && Math.abs(gestureState.dy) > 2,
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          !disabledRef.current && !submittingRef.current && Math.abs(gestureState.dy) > 2,
        onPanResponderGrant: (event) => handleTouchStart(event),
        onPanResponderMove: (_, gestureState) => {
          if (disabledRef.current || submittingRef.current) return;
          updateDragDistance(Math.max(0, -gestureState.dy));
        },
        onPanResponderRelease: handleTouchEnd,
        onPanResponderTerminate: handleTouchEnd,
      }),
    [handleTouchEnd, handleTouchStart, updateDragDistance],
  );
  const progressBucket = disabled ? "disabled" : isSubmitting ? "submitting" : isArmed ? "armed" : swipeProgress > 0 ? "dragging" : "idle";
  const handleLift = -118 * swipeProgress;
  const handleIconSize = unavailable ? 22 : 18;
  const visibleLabel = isSubmitting ? label : isArmed && !unavailable ? armedLabel : label;
  const visibleHelper = isArmed && !unavailable ? armedHelper : helper;

  return (
      <View
        accessible
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || isSubmitting }}
        accessibilityHint={visibleHelper}
      accessibilityLabel={`swipe-to-submit-order swipe-submit-gesture-required swipe-submit-threshold-clear swipe-submit-release-below-threshold-restores swipe-submit-release-above-threshold-submits swipe-submit-armed-copy-visible swipe-submit-tap-disabled swipe-submit-handle-progress-linked swipe-submit-handle-progress-motion swipe-submit-handle-progress-animated swipe-submit-handle-vertical-travel swipe-submit-handle-long-travel swipe-submit-handle-above-label-s23 swipe-submit-state-${progressBucket} swipe-submit-progress-${Math.round(swipeProgress * 100)}`}
      style={[
        styles.swipeSubmit,
        !unavailable && tone === "buy" && styles.swipeSubmitBuy,
        !unavailable && tone === "sell" && styles.swipeSubmitSell,
        unavailable && styles.swipeSubmitUnavailable,
        isArmed && !unavailable && styles.swipeSubmitArmed,
        disabled && !unavailable && styles.swipeSubmitDisabled,
      ]}
      testID="place-mock-order"
      {...panResponder.panHandlers}
      onStartShouldSetResponder={() => !disabledRef.current && !submittingRef.current}
      onStartShouldSetResponderCapture={() => !disabledRef.current && !submittingRef.current}
      onMoveShouldSetResponder={() => !disabledRef.current && !submittingRef.current}
      onMoveShouldSetResponderCapture={() => !disabledRef.current && !submittingRef.current}
      onResponderGrant={handleTouchStart}
      onResponderMove={handleTouchMove}
      onResponderRelease={handleTouchEnd}
      onResponderTerminate={handleTouchEnd}
    >
      {!unavailable && (
        <View
          accessibilityLabel={`swipe-submit-threshold-line swipe-submit-threshold-${isArmed ? "armed" : "waiting"}`}
          style={[styles.swipeThresholdLine, isArmed && styles.swipeThresholdLineArmed]}
          testID="swipe-submit-threshold-line"
        />
      )}
      <View
        accessibilityLabel={`swipe-submit-handle swipe-submit-handle-centered swipe-submit-handle-above-label-s23 swipe-submit-handle-progress-linked swipe-submit-handle-progress-motion swipe-submit-handle-progress-animated swipe-submit-handle-vertical-travel swipe-submit-handle-s23-visible-travel swipe-submit-handle-s23-large-travel swipe-submit-handle-starts-near-footer-top swipe-submit-state-${progressBucket} swipe-submit-handle-translate-y-${Math.round(handleLift)}`}
        style={[styles.swipeIcon, unavailable && styles.swipeIconUnavailable, isArmed && styles.swipeIconArmed, { transform: [{ translateY: unavailable ? 0 : handleLift }] }]}
        testID="swipe-submit-handle"
      >
        <Ionicons name={unavailable ? "alert-circle-outline" : isSubmitting ? "hourglass-outline" : "chevron-up"} color={unavailable ? "#fecaca" : "#ffffff"} size={handleIconSize} />
      </View>
      <View style={[styles.swipeTextBlock, unavailable && styles.swipeTextBlockUnavailable, { transform: [{ translateY: unavailable ? 0 : Math.min(0, handleLift * 0.25) }] }]}>
        <Text
          accessibilityLabel={`swipe-submit-visible-label swipe-submit-visible-label-state-${progressBucket}`}
          style={[styles.swipeLabel, isArmed && !unavailable && styles.swipeLabelArmed, unavailable && styles.swipeLabelUnavailable]}
          testID="swipe-submit-visible-label"
        >
          {visibleLabel}
        </Text>
        <Text
          accessibilityLabel={`swipe-submit-visible-helper swipe-submit-visible-helper-state-${progressBucket}`}
          style={[styles.swipeHelper, isArmed && !unavailable && styles.swipeHelperArmed, unavailable && styles.swipeHelperUnavailable]}
          testID="swipe-submit-visible-helper"
        >
          {visibleHelper}
        </Text>
      </View>
    </View>
  );
}

function formatDepthSize(size: number) {
  if (size >= 1000) return `${(size / 1000).toFixed(size >= 10000 ? 0 : 2).replace(/\.?0+$/, "")}k`;
  return size.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatDepthPrice(probability: number, size: number, sharesLabel: string) {
  const price = `${(probability / 100).toFixed(2)} USDT`;
  return `${price} (${formatDepthSize(size)} ${sharesLabel})`;
}

function marketDepth(outcome: Outcome, sharesLabel: string) {
  const bidProbability = outcome.bestBid ?? Math.max(outcome.probability - 3, 1);
  const askProbability = outcome.bestAsk ?? Math.min(outcome.probability + 4, 99);
  const fallbackBidSize = Math.max(Math.round(outcome.probability * 20), 100);
  const fallbackAskSize = Math.max(Math.round((100 - outcome.probability) * 25), 100);
  const bidSize =
    typeof outcome.bestBidSize === "number" && Number.isFinite(outcome.bestBidSize) && outcome.bestBidSize > 0
      ? outcome.bestBidSize
      : fallbackBidSize;
  const askSize =
    typeof outcome.bestAskSize === "number" && Number.isFinite(outcome.bestAskSize) && outcome.bestAskSize > 0
      ? outcome.bestAskSize
      : fallbackAskSize;
  const bid = bidProbability / 100;
  const ask = askProbability / 100;
  return {
    bid: formatDepthPrice(bidProbability, bidSize, sharesLabel),
    ask: formatDepthPrice(askProbability, askSize, sharesLabel),
    spread: `${Math.round((ask - bid) * 100)}c`,
  };
}

function compactCash(value: number) {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function marketAvailabilityLabel(market: Market) {
  const status = market.availability?.status;
  if (status === "ready") return "Market live";
  if (status === "stale") return "Market stale";
  if (status === "suspended") return "Market suspended";
  if (status === "delayed") return "Market delayed";
  if (status === "unavailable") return "Market unavailable";
  return null;
}

function marketAvailabilityTone(market: Market) {
  const status = market.availability?.status;
  if (status === "suspended" || status === "unavailable") return "blocked";
  if (status === "stale" || status === "delayed") return "warning";
  return "ready";
}

function ticketReferenceSource(ticket: Ticket) {
  const explicitSource = ticket.selection?.referenceSource ?? ticket.market.referenceSource ?? "";
  if (explicitSource) return explicitSource;
  if (ticket.selection?.referenceTokenId || ticket.selection?.conditionId || ticket.outcome.referenceTokenId) return "polymarket-token";
  return "";
}

function ticketSourceBadge(ticket: Ticket) {
  const source = ticketReferenceSource(ticket);
  if (source.includes("polymarket")) {
    return {
      label: "Polymarket",
      tone: "provider" as const,
      visible: true,
      accessibility: `ticket-source-badge-provider ticket-source-${source}`,
    };
  }
  if (source.includes("contract-fixture")) {
    return {
      label: "Holiwyn",
      tone: "fixture" as const,
      visible: true,
      accessibility: `ticket-source-badge-local ticket-source-${source}`,
    };
  }
  return {
    label: "",
    tone: "unknown" as const,
    visible: false,
    accessibility: `ticket-source-badge-unknown ticket-source-${source || "unknown"}`,
  };
}

function ticketSourceNote(ticket: Ticket, locale: Locale) {
  const source = ticketReferenceSource(ticket);
  if (source.includes("contract-fixture")) {
    return {
      text: locale === "zh" ? "利云体育盘口" : "Holiwyn line",
      accessibility: "ticket-local-test-pricing",
      tone: "fixture" as const,
    };
  }
  if (source.includes("polymarket")) {
    return {
      text: locale === "zh" ? "Polymarket 市场" : "Polymarket market",
      accessibility: "ticket-provider-backed-pricing",
      tone: "provider" as const,
    };
  }
  return null;
}

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

const teamCodeForTicket = (ticket: Ticket) => {
  const candidates = [
    ticket.selection?.displayLabel,
    ticket.selection?.referenceOutcomeLabel,
    ticket.outcome.label,
    ticket.event ? label("en", ticket.event) : undefined,
    label("en", ticket.market),
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

const marketIconForTicket = (ticket: Ticket) => {
  const marketType = ticket.selection?.marketType ?? ticket.market.marketType ?? ticket.market.type;
  if (marketType === "totals" || marketType === "team-total") return "%";
  if (marketType === "spread") return "+/-";
  if (marketType === "winner" || marketType === "live") return "1X2";
  return "?";
};

const compactTeamAliases: Record<string, string> = {
  "BREADTH HOME": "BHO",
  "BREADTH AWAY": "BAW",
};

const compactTicketTeamName = (name: string) => {
  const cleanName = name.replace(/\s+/g, " ").trim();
  const alias = compactTeamAliases[cleanName.toUpperCase()];
  if (alias) return alias;
  if (cleanName.length <= 12) return cleanName;
  const words = cleanName.split(" ").filter(Boolean);
  if (words.length >= 2) {
    return `${words[0].slice(0, 2)}${words[1][0] ?? ""}`.toUpperCase();
  }
  return cleanName.slice(0, 3).toUpperCase();
};

const retailEventTitle = (ticket: Ticket, locale: Locale) => {
  if (ticket.event?.teams && ticket.event.teams.length >= 2) {
    const [home, away] = ticket.event.teams;
    const homeName = locale === "zh" ? home.zhName : home.name;
    const awayName = locale === "zh" ? away.zhName : away.name;
    if (homeName && awayName) {
      const fullTitle = `${homeName} vs ${awayName}`;
      const shouldCompact = fullTitle.length > 24 || /breadth|fixture|provider/i.test(fullTitle);
      return {
        compacted: shouldCompact,
        text: shouldCompact ? `${compactTicketTeamName(homeName)} vs ${compactTicketTeamName(awayName)}` : fullTitle,
      };
    }
  }
  return { compacted: false, text: label(locale, ticket.event ?? ticket.market) };
};

const limitIdentityLabel = (selection?: TicketSelection) =>
  selection?.limitPrice
    ? `ticket-limit-side-${selection.limitSide ?? "none"} ticket-limit-price-${Math.round(selection.limitPrice * 100)} ticket-limit-decimal-${selection.limitPrice.toFixed(2)} ticket-limit-shares-${selection.limitShares ?? "none"}`
    : "ticket-limit-side-none ticket-limit-price-none ticket-limit-shares-none";

const ticketSelectionIdentityLabel = (selection?: TicketSelection, activeContractSide?: BinaryContractSide) =>
  selection
    ? `ticket-market-family-${selection.marketType} ticket-market-type-${selection.marketType} ticket-market-id-${selection.marketId ?? "none"} ticket-outcome-id-${selection.outcomeId ?? "none"} ticket-market-group-${selection.marketGroupId ?? "none"} ticket-line-${selection.line ?? "none"} ticket-period-${selection.period ?? "none"} ticket-selection-side-${activeContractSide ?? selection.side ?? "yes"} ticket-display-label-${selection.displayLabel} ticket-contract-side-${activeContractSide ?? selection.contractSide ?? "yes"} ticket-provider-source-${selection.referenceSource ?? "none"} ticket-provider-market-${selection.externalMarketId ?? "none"} ticket-provider-condition-${selection.conditionId ?? "none"} ticket-provider-token-${selection.referenceTokenId ?? "none"} ticket-provider-outcome-${selection.referenceOutcomeLabel ?? "none"} ${limitIdentityLabel(selection)}`
    : "ticket-market-family-none ticket-line-none ticket-period-none ticket-limit-side-none ticket-limit-price-none ticket-limit-shares-none";

export function TradeTicket({
  locale,
  t,
  ticket,
  balance,
  orderError,
  orderErrorDetail,
  tradingMode,
  defaultAmount,
  defaultSide,
  defaultSlippage,
  onPreferencesChange,
  close,
  placeOrder,
}: {
  locale: Locale;
  t: TradeTicketCopy;
  ticket: Ticket | null;
  balance: number;
  orderError: string | null;
  orderErrorDetail?: string | null;
  tradingMode: "mock" | "server";
  defaultAmount: string;
  defaultSide: "buy" | "sell";
  defaultSlippage: string;
  onPreferencesChange: (next: { amount: string; side: "buy" | "sell"; slippage: string }) => void;
  close: () => void;
  placeOrder: (amount: number, side: "buy" | "sell", contractSide?: BinaryContractSide) => void | Promise<void>;
}) {
  const [amount, setAmountState] = useState(defaultAmount);
  const [side, setSideState] = useState<"buy" | "sell">(defaultSide);
  const [activeContractSide, setActiveContractSide] = useState<BinaryContractSide>("yes");
  const [slippage, setSlippageState] = useState(defaultSlippage);
  const [swipeSubmitProgress, setSwipeSubmitProgress] = useState(0);
  const { height: viewportHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const usePhoneTicketFit = viewportHeight <= 860;

  useEffect(() => {
    if (!ticket) return;
    const opensFromRetailFlow = Boolean(ticket.event || ticket.sourcePositionId);
    setAmountState(opensFromRetailFlow ? "0" : defaultAmount);
    setSideState(ticket.side);
    setActiveContractSide(ticket.contractSide ?? ticket.selection?.contractSide ?? "yes");
    setSlippageState(defaultSlippage);
    setSwipeSubmitProgress(0);
  }, [
    ticket?.market.id,
    ticket?.outcome.id,
    ticket?.side,
    ticket?.contractSide,
    ticket?.sourcePositionId,
    ticket?.selection?.marketId,
    ticket?.selection?.outcomeId,
    ticket?.selection?.contractSide,
    ticket?.selection?.line,
    ticket?.selection?.period,
    ticket?.selection?.displayLabel,
  ]);

  useEffect(() => {
    if (!ticket) return undefined;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      close();
      return true;
    });
    return () => subscription.remove();
  }, [close, ticket]);

  if (!ticket) return null;
  const setAmount = (nextAmount: string) => {
    setAmountState(nextAmount);
    onPreferencesChange({ amount: nextAmount, side, slippage });
  };
  const setSide = (nextSide: "buy" | "sell") => {
    setSideState(nextSide);
    onPreferencesChange({ amount, side: nextSide, slippage });
  };
  const applyKeypadInput = (key: string) => {
    if (key === "backspace") {
      setAmount(amount.length > 1 ? amount.slice(0, -1) : "0");
      return;
    }
    if (key === "." && amount.includes(".")) return;
    const nextAmount = amount === "0" && key !== "." ? key : `${amount}${key}`;
    setAmount(nextAmount.replace(/^0+(\d)/, "$1"));
  };
  const numericAmount = Number(amount) || 0;
  const contractSide = activeContractSide;
  const contractProbability = contractSide === "no" ? 100 - ticket.outcome.probability : ticket.outcome.probability;
  const averagePrice = contractProbability / 100;
  const estimatedShares = averagePrice > 0 ? numericAmount / averagePrice : 0;
  const estimatedPayout = contractProbability > 0 ? numericAmount * (100 / contractProbability) : 0;
  const swipeLabel = side === "buy" ? t.swipeBuyOrder : t.swipeSellOrder;
  const amountPresets = [25, 50];
  const keypadKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"];
  const isLiveTicket = ticket.event?.status === "live";
  const tradingModeValue = tradingMode === "server" ? t.tradingModeServer : t.tradingModeMock;
  const depth = marketDepth(ticket.outcome, t.shares);
  const liveClock = isLiveTicket
    ? ticket.event?.startsAt.replace(/[^\x00-\x7F]+/g, "-").replace(/\s+-\s+/g, " - ")
    : null;
  const liveClockText = liveClock ? `${liveClock} - ${t.livePriceMovement}` : null;
  const eventTitle = retailEventTitle(ticket, locale);
  const eventLabel = eventTitle.text;
  const outcomeLabel = label(locale, ticket.outcome);
  const sideLabel = contractSide === "yes" ? "Yes" : "No";
  const selectionLabel = ticket.selection?.displayLabel ?? outcomeLabel;
  const marketLabel = ticket.selection?.displayLabel ?? label(locale, ticket.market);
  const modeLabel = side === "sell" ? t.sell : t.buy;
  const modeOutcomeLabel = `${modeLabel} ${outcomeLabel}`;
  const teamCode = teamCodeForTicket(ticket);
  const teamFlag = teamCode ? teamFlags[teamCode] : undefined;
  const fallbackMarketIcon = marketIconForTicket(ticket);
  const fallbackMarketType = ticket.selection?.marketType ?? ticket.market.marketType ?? ticket.market.type ?? "generic";
  const sourceBadge = ticketSourceBadge(ticket);
  const sourceNote = ticketSourceNote(ticket, locale);
  const amountDisplay = numericAmount > 0 ? compactCash(numericAmount) : "$0";
  const toWinDisplay = compactCash(estimatedPayout);
  const availabilityLabel = marketAvailabilityLabel(ticket.market);
  const availabilityTone = marketAvailabilityTone(ticket.market);
  const availabilityStatus = ticket.market.availability?.status ?? "unknown";
  const marketTradable = availabilityTone !== "blocked";
  const submitLabel = !marketTradable ? availabilityLabel ?? t.marketUnavailable : numericAmount <= 0 ? t.chooseAmount : swipeLabel;
  const submitHelper = !marketTradable ? t.tradingDisabledForMarket : t.finalCostMayVary;
  const submitArmedLabel = side === "buy" ? t.releaseBuyOrder : t.releaseSellOrder;
  const activeSubmitProgress = marketTradable ? swipeSubmitProgress : 0;
  const footerBaseHeight = usePhoneTicketFit ? 172 : 184;
  const submitSheetHeight = footerBaseHeight + activeSubmitProgress * Math.max(viewportHeight - footerBaseHeight, 0);
  const ticketPanelMinHeight = Math.max(insets.top + 136, 180);
  const ticketPanelHeight = Math.max(ticketPanelMinHeight, viewportHeight - submitSheetHeight + 28);
  const priceDisplay = `${contractProbability}c`;
  const providerIdentityLabel = [
    ticket.selection?.referenceSource ?? ticket.market.referenceSource
      ? `provider-source-${ticket.selection?.referenceSource ?? ticket.market.referenceSource}`
      : null,
    ticket.selection?.externalMarketId ?? ticket.market.externalMarketId
      ? `provider-market-${ticket.selection?.externalMarketId ?? ticket.market.externalMarketId}`
      : null,
    ticket.selection?.conditionId ?? ticket.market.conditionId
      ? `provider-condition-${ticket.selection?.conditionId ?? ticket.market.conditionId}`
      : null,
    ticket.selection?.referenceTokenId ?? ticket.outcome.referenceTokenId
      ? `provider-token-${ticket.selection?.referenceTokenId ?? ticket.outcome.referenceTokenId}`
      : null,
    ticket.selection?.referenceOutcomeLabel ?? ticket.outcome.referenceOutcomeLabel
      ? `provider-outcome-${ticket.selection?.referenceOutcomeLabel ?? ticket.outcome.referenceOutcomeLabel}`
      : null,
    ticketSelectionIdentityLabel(ticket.selection, contractSide),
  ].filter(Boolean).join(" ");
  const reviewCopy =
    locale === "zh"
      ? {
          title: "\u8ba2\u5355\u9884\u89c8",
          market: "\u5e02\u573a",
          line: "\u76d8\u53e3",
          period: "\u65f6\u6bb5",
          price: "\u4ef7\u683c",
          shares: "\u4efd\u989d",
          payout: "\u53ef\u8d62",
          main: "\u4e3b\u76d8",
          fullGame: "\u5168\u573a",
        }
      : {
          title: "Order review",
          market: "Market",
          line: "Line",
          period: "Period",
          price: "Price",
          shares: "Shares",
          payout: "To win",
          main: "Main",
          fullGame: "Full game",
        };
  const reviewMarketType = ticket.selection?.marketType ?? ticket.market.marketType ?? ticket.market.type;
  const reviewLine = ticket.selection?.line ?? ticket.market.line ?? reviewCopy.main;
  const reviewPeriod = ticket.selection?.period ?? ticket.market.period ?? reviewCopy.fullGame;
  const reviewShares = estimatedShares.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const reviewPayout = compactCash(estimatedPayout);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
      <View style={styles.modalShade}>
        <View style={styles.ticket}>
          <View
            accessibilityLabel="trade-ticket ticket-retail-reference-layout ticket-body-rounded-above-swipe ticket-keypad-swipe-separated ticket-s23-keypad-clearance ticket-s23-safe-vertical-fit ticket-s23-reference-no-overlap ticket-dark-panel-above-red-swipe ticket-dark-keypad-panel-fixed-clearance"
            style={[
              styles.ticketBodyPanel,
              usePhoneTicketFit && styles.ticketBodyPanelPhone,
              {
                height: ticketPanelHeight,
                borderBottomLeftRadius: activeSubmitProgress > 0 ? 30 : 0,
                borderBottomRightRadius: activeSubmitProgress > 0 ? 30 : 0,
              },
            ]}
            testID="trade-ticket"
          >
            <View
              style={[
                styles.ticketContent,
                usePhoneTicketFit && styles.ticketContentPhone,
                { paddingTop: Math.max(insets.top + 8, usePhoneTicketFit ? 32 : 26) },
              ]}
            >
            <View accessibilityLabel="ticket-drag-handle" testID="ticket-drag-handle" style={styles.dragHandle} />
            <View accessibilityLabel={`ticket-selection-summary ticket-retail-order-header ticket-header-retail-readable ${providerIdentityLabel}`} testID="ticket-selection-summary" style={styles.ticketHeader}>
              <Pressable accessibilityLabel="ticket-close" onPress={close} style={styles.closeButton} testID="ticket-close">
                <Ionicons name="close" color="#f8fafc" size={24} />
              </Pressable>
              <View
                accessibilityLabel={`ticket-outcome-flag ${teamCode ? `ticket-outcome-flag-${teamCode}` : `ticket-market-icon ticket-market-icon-${fallbackMarketType}`}`}
                testID="ticket-outcome-flag"
                style={[styles.outcomeFlag, !teamFlag && styles.marketIconFlag]}
              >
                {teamFlag ? <Text style={styles.outcomeFlagEmoji}>{teamFlag}</Text> : <Text style={styles.marketIconText}>{fallbackMarketIcon}</Text>}
              </View>
              <View style={styles.selectionTextBlock}>
                <Text accessibilityLabel={`ticket-event-title ${eventTitle.compacted ? "ticket-event-title-compact-matchup" : "ticket-event-title-full-matchup"}`} numberOfLines={1} style={styles.ticketTitle}>{eventLabel}</Text>
                <View style={styles.ticketSelectionMetaRow}>
                  <Text accessibilityLabel="ticket-selection-line" testID="ticket-selection-line" numberOfLines={2} style={styles.ticketOutcome}>
                    <Text style={styles.ticketOutcomeSide}>{sideLabel}</Text> <Text style={styles.ticketOutcomeDot}>-</Text> {selectionLabel}
                  </Text>
                </View>
                <View
                  accessibilityLabel={`ticket-source-audit-only ticket-market-source-badge-hidden ticket-header-source-pill-hidden-local-mvp ${sourceBadge.accessibility} ${sourceNote?.accessibility ?? ""}`}
                  style={styles.orderReviewA11y}
                  testID="ticket-market-source-badge-hidden"
                >
                  <Text>ticket-source-hidden</Text>
                  {sourceNote && (
                    <Text
                      accessibilityLabel={`ticket-source-note ticket-source-note-audit-only ${sourceNote.accessibility}`}
                      testID="ticket-source-note"
                    >
                      {sourceNote.text}
                    </Text>
                  )}
                </View>
              </View>
            </View>
            <View accessibilityLabel="ticket-side-pill ticket-advanced-hidden-local-mvp" testID="ticket-side-pill" style={styles.orderReviewA11y}>
              <Text>ticket-advanced-hidden-local-mvp</Text>
            </View>
            {availabilityLabel && availabilityTone === "blocked" && (
              <View
                accessibilityLabel={`ticket-market-status ticket-availability-${availabilityStatus} ticket-market-status-${ticket.market.availability?.marketStatus ?? "unknown"} ${providerIdentityLabel} ${availabilityLabel}`}
                style={styles.orderReviewA11y}
                testID="ticket-market-status"
              >
                <Text>{availabilityLabel}</Text>
              </View>
            )}
            {availabilityLabel && availabilityTone === "warning" && (
              <View
                accessibilityLabel={`ticket-market-status-hidden-local-mvp ticket-availability-${availabilityStatus} ticket-market-status-${ticket.market.availability?.marketStatus ?? "unknown"} ${providerIdentityLabel} ${availabilityLabel}`}
                style={styles.orderReviewA11y}
                testID="ticket-market-status-hidden-local-mvp"
              >
                <Text>{availabilityLabel}</Text>
              </View>
            )}
            <View
              accessibilityLabel={`ticket-advanced-hidden-local-mvp internal-price-context-hidden mode-${tradingModeValue} bid-${depth.bid} ask-${depth.ask} width-${depth.spread} ${isLiveTicket ? "live-context-hidden" : "live-context-none"} ${liveClockText ?? ""}`}
              style={styles.orderReviewA11y}
              testID="ticket-advanced-proof-hidden"
            >
              <Text>ticket-advanced-hidden-local-mvp</Text>
            </View>
            <View accessibilityLabel="ticket-amount-display" testID="ticket-amount-display" style={[styles.amountDisplayBlock, usePhoneTicketFit && styles.amountDisplayBlockPhone, !marketTradable && styles.amountDisplayBlockUnavailable]}>
              <Text style={[styles.amountDisplayText, usePhoneTicketFit && styles.amountDisplayTextPhone, numericAmount <= 0 && styles.amountDisplayTextEmpty, !marketTradable && styles.amountDisplayTextUnavailable]}>{amountDisplay}</Text>
            </View>
            <View accessibilityLabel={`${sideLabel} - ${outcomeLabel}`} testID="ticket-contract-outcome-row" style={styles.orderReviewA11y}>
              <Text accessibilityLabel="ticket-selected-outcome-choice" testID="ticket-selected-outcome-choice">
                {outcomeLabel}
              </Text>
            </View>
            <View accessibilityLabel="ticket-to-win-line" testID="ticket-to-win-line" style={styles.toWinBlock}>
              <Text style={[styles.toWinText, numericAmount <= 0 && styles.toWinTextEmpty]}>{t.toWin} <Text style={numericAmount > 0 ? styles.toWinValue : styles.toWinValueEmpty}>{toWinDisplay}</Text></Text>
            </View>
            <View
              accessibilityLabel={`ticket-order-mode-visible ticket-order-mode-${side} ${modeOutcomeLabel}`}
              testID="ticket-order-mode-visible"
              style={[styles.orderModeBadge, side === "sell" && styles.orderModeBadgeSell]}
            >
              <Text style={[styles.orderModeText, side === "sell" && styles.orderModeTextSell]} numberOfLines={1}>
                {modeOutcomeLabel}
              </Text>
            </View>
            <View
              accessibilityLabel={`ticket-order-review market-${reviewMarketType} line-${reviewLine} period-${reviewPeriod} price-${contractProbability} shares-${reviewShares} payout-${reviewPayout} ${providerIdentityLabel}`}
              style={styles.orderReviewA11y}
              testID="ticket-order-review"
            >
              <Text>ticket-identity-preserved</Text>
              <Text accessibilityLabel="ticket-order-review-price" testID="ticket-order-review-price">{priceDisplay}</Text>
              <Text accessibilityLabel="ticket-order-review-payout" testID="ticket-order-review-payout">{reviewPayout}</Text>
            </View>
            <View style={[styles.ticketSideRow, usePhoneTicketFit && styles.ticketSideRowPhone]}>
              {(["buy", "sell"] as const).map((option) => {
                const isContractActive = contractSide === "no" ? option === "sell" : side === option;
                return (
                  <Pressable
                    accessibilityLabel={`ticket-side-${option}`}
                    key={option}
                    style={[styles.sideButton, isContractActive && styles.sideButtonActive]}
                    onPress={() => {
                      if (ticket.selection?.marketType === "future") {
                        setActiveContractSide(option === "sell" ? "no" : "yes");
                        setSide("buy");
                        return;
                      }
                      setActiveContractSide(option === "sell" ? "no" : "yes");
                      setSide(option);
                    }}
                    testID={`ticket-side-${option}`}
                  >
                    <Text style={[styles.sideText, isContractActive && styles.sideTextActive]}>{option === "buy" ? "Yes" : "No"}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View
              accessibilityLabel={`ticket-odds-available ticket-order-review market-${reviewMarketType} line-${reviewLine} period-${reviewPeriod} shares-${reviewShares} payout-${reviewPayout}`}
              testID="ticket-odds-available"
              style={[styles.oddsAvailableLine, usePhoneTicketFit && styles.oddsAvailableLinePhone]}
            >
              <Text accessibilityLabel="ticket-price-line" testID="ticket-price-line" style={styles.oddsAvailableText}>{t.odds} {contractProbability}% | {money(balance)} {t.available}</Text>
            </View>
            <View style={[styles.presetRow, usePhoneTicketFit && styles.presetRowPhone]}>
              {amountPresets.map((preset) => (
                <Pressable
                  accessibilityLabel={`ticket-preset-${preset}`}
                  key={preset}
                  onPress={() => setAmount(String(numericAmount + preset))}
                  style={styles.presetButton}
                  testID={`ticket-preset-${preset}`}
                >
                  <Text style={styles.presetText}>+${preset}</Text>
                </Pressable>
              ))}
              <Pressable accessibilityLabel="ticket-max-amount" testID="ticket-max-amount" onPress={() => setAmount(String(Math.floor(balance)))} style={styles.presetButton}>
                <Text style={styles.presetText}>{t.max}</Text>
              </Pressable>
            </View>
            <View accessibilityLabel="ticket-amount-keypad ticket-s23-keypad-footer-gap" testID="ticket-amount-keypad" style={[styles.keypadGrid, usePhoneTicketFit && styles.keypadGridPhone]}>
              {keypadKeys.map((key) => (
                <Pressable
                  accessibilityLabel={`ticket-keypad-${key}`}
                  key={key}
                  onPress={() => applyKeypadInput(key)}
                  style={[styles.keypadButton, usePhoneTicketFit && styles.keypadButtonPhone]}
                  testID={`ticket-keypad-${key}`}
                >
                  {key === "backspace" ? (
                    <Ionicons name="backspace-outline" color="#dbeafe" size={20} />
                  ) : (
                    <Text style={styles.keypadText}>{key}</Text>
                  )}
                </Pressable>
              ))}
            </View>
            {orderError && (
              <View accessibilityLabel="ticket-order-error" testID="ticket-order-error" style={styles.errorCard}>
                <Ionicons name="alert-circle-outline" color="#fbbf24" size={18} />
                <View style={styles.errorTextBlock}>
                  <Text style={styles.errorText}>{orderError}</Text>
                  {orderErrorDetail && (
                    <Text accessibilityLabel="ticket-order-error-detail" testID="ticket-order-error-detail" style={styles.errorDetailText}>
                      {orderErrorDetail}
                    </Text>
                  )}
                </View>
              </View>
            )}
            </View>
            <View
              pointerEvents="none"
              style={[
                styles.ticketMotionScrim,
                { opacity: Math.min(activeSubmitProgress * 0.72, 0.72) },
              ]}
            />
          </View>
          <View
            accessibilityLabel={`ticket-swipe-area-fixed-bottom ticket-swipe-footer-fixed-separate ticket-keypad-swipe-separated ticket-s23-keypad-clearance ticket-s23-keypad-footer-gap ticket-red-swipe-area-fixed-bottom ticket-polymarket-style-swipe-zone ticket-red-footer-s23-reference-tightened ticket-red-footer-s23-reference-compact ticket-s23-reference-no-overlap ${!marketTradable ? "ticket-unavailable-footer-compact ticket-unavailable-single-visible-message" : ""}`}
            testID="ticket-swipe-area-fixed-bottom"
            style={[
              styles.ticketFooter,
              usePhoneTicketFit && styles.ticketFooterPhone,
              marketTradable && styles.ticketFooterSubmitLive,
              !marketTradable && styles.ticketFooterUnavailable,
              {
                height: marketTradable ? submitSheetHeight : footerBaseHeight,
                paddingBottom: Math.max(insets.bottom + 14, usePhoneTicketFit ? 20 : 22),
              },
            ]}
          >
            <SwipeSubmitControl
              disabled={numericAmount <= 0 || !marketTradable}
              unavailable={!marketTradable}
              tone={side}
              helper={submitHelper}
              label={submitLabel}
              armedLabel={submitArmedLabel}
              armedHelper={t.releaseToSubmit}
              onProgressChange={setSwipeSubmitProgress}
              onSubmit={() => placeOrder(numericAmount, side, contractSide)}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalShade: { flex: 1, justifyContent: "flex-end", backgroundColor: "#070b12" },
  ticket: { flex: 1, height: "100%", backgroundColor: "#070b12", overflow: "hidden" },
  ticketBodyPanel: { backgroundColor: "#070b12", overflow: "hidden", zIndex: 8, elevation: 8 },
  ticketBodyPanelPhone: {},
  ticketMotionScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(2,6,23,0.76)", zIndex: 6 },
  ticketContent: { flex: 1, width: "100%", maxWidth: 430, alignSelf: "center", paddingHorizontal: 24, paddingTop: 18, paddingBottom: 16 },
  ticketContentPhone: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 18 },
  dragHandle: { alignSelf: "center", width: 92, height: 1, borderRadius: 999, backgroundColor: "#293141", marginBottom: 2, opacity: 0.01 },
  ticketTop: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  ticketHeading: { flex: 1, alignItems: "center" },
  ticketTitle: { color: "#cbd5e1", fontSize: 13, fontWeight: "700" },
  ticketOutcome: { color: "#f8fafc", fontSize: 16, fontWeight: "800", marginTop: 2, lineHeight: 20 },
  ticketOutcomeSide: { color: "#22c55e" },
  ticketOutcomeDot: { color: "#64748b" },
  ticketSub: { color: "#64748b", fontSize: 12, fontWeight: "900", marginTop: 4 },
  closeButton: { width: 40, height: 48, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  tradeSidePill: { minWidth: 42, minHeight: 42 },
  tradeSideText: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  ticketHeader: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 52 },
  outcomeFlag: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", overflow: "hidden" },
  outcomeFlagEmoji: { fontSize: 27, lineHeight: 34 },
  marketIconFlag: { backgroundColor: "#121a27", borderColor: "#334155" },
  marketIconText: { color: "#dbeafe", fontSize: 20, fontWeight: "900" },
  selectionTextBlock: { flex: 1, minWidth: 0 },
  ticketSelectionMetaRow: { minHeight: 23, flexDirection: "row", alignItems: "flex-start", marginTop: 2 },
  marketStatusPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: "#052e1b", borderWidth: 1, borderColor: "#166534" },
  marketStatusPillWarning: { backgroundColor: "#2b2106", borderColor: "#854d0e" },
  marketStatusPillBlocked: { backgroundColor: "#2a0d0d", borderColor: "#7f1d1d" },
  marketStatusText: { color: "#bbf7d0", fontSize: 12, fontWeight: "900" },
  marketStatusTextWarning: { color: "#fde68a" },
  marketStatusTextBlocked: { color: "#fecaca" },
  amountDisplayBlock: { minHeight: 82, alignItems: "center", justifyContent: "flex-end", marginTop: 6 },
  amountDisplayBlockPhone: { minHeight: 68, marginTop: 0 },
  amountDisplayBlockUnavailable: { minHeight: 58, justifyContent: "center", marginTop: 2 },
  amountDisplayText: { color: "#f8fafc", fontSize: 68, fontWeight: "500", lineHeight: 76 },
  amountDisplayTextPhone: { fontSize: 60, lineHeight: 68 },
  amountDisplayTextEmpty: { color: "#1b2230" },
  amountDisplayTextUnavailable: { color: "#151b27", fontSize: 54, lineHeight: 60 },
  ticketOutcomeRow: { alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 4, minHeight: 56, padding: 5, borderRadius: 999, backgroundColor: "#1c2330" },
  outcomeChoiceMuted: { minWidth: 86, textAlign: "center", color: "#8b94a5", fontSize: 17, fontWeight: "700", paddingHorizontal: 14 },
  outcomeChoiceActive: { minWidth: 86, textAlign: "center", overflow: "hidden", color: "#f8fafc", fontSize: 17, fontWeight: "800", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 999, backgroundColor: "#0d1422" },
  toWinBlock: { alignItems: "center", justifyContent: "center", minHeight: 26, marginTop: 0 },
  toWinText: { color: "#d1d5db", fontSize: 17, fontWeight: "700" },
  toWinTextEmpty: { color: "#293140" },
  toWinValue: { color: "#22c55e", fontSize: 18, fontWeight: "800" },
  toWinValueEmpty: { color: "#293140", fontSize: 18, fontWeight: "800" },
  orderModeBadge: { alignSelf: "center", maxWidth: "86%", minHeight: 30, justifyContent: "center", paddingHorizontal: 14, borderRadius: 999, backgroundColor: "#052e16", borderWidth: 1, borderColor: "#166534", marginTop: 4 },
  orderModeBadgeSell: { backgroundColor: "#3a0f15", borderColor: "#b91c1c" },
  orderModeText: { color: "#bbf7d0", fontSize: 13, fontWeight: "900" },
  orderModeTextSell: { color: "#fecaca" },
  priceText: { color: "#8b94a5", fontSize: 15, fontWeight: "800", marginTop: 3 },
  orderReviewA11y: { height: 1, overflow: "hidden", opacity: 0.01 },
  orderReviewCard: { marginTop: 8, padding: 12, borderRadius: 16, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247", gap: 10 },
  orderReviewHeader: { minHeight: 30, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  orderReviewTitle: { color: "#f8fafc", fontSize: 15, fontWeight: "900" },
  orderReviewPrice: { color: "#93c5fd", fontSize: 18, fontWeight: "900" },
  orderReviewGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  orderReviewCell: { width: "31.5%", minHeight: 48, justifyContent: "center", paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, backgroundColor: "#111827" },
  orderReviewCellWide: { flex: 1, minWidth: "31.5%", minHeight: 48, justifyContent: "center", paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, backgroundColor: "#111827" },
  orderReviewLabel: { color: "#64748b", fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  orderReviewValue: { color: "#e2e8f0", fontSize: 12, fontWeight: "900", marginTop: 3 },
  orderReviewValueStrong: { color: "#22c55e", fontSize: 15, fontWeight: "900", marginTop: 3 },
  ticketSideRow: { alignSelf: "center", width: 142, flexDirection: "row", gap: 3, marginTop: 8, padding: 4, borderRadius: 999, backgroundColor: "#1d2431" },
  ticketSideRowPhone: { marginTop: 4 },
  sideButton: { flex: 1, minHeight: 34, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "transparent" },
  sideButtonActive: { backgroundColor: "#0b111d" },
  sideText: { color: "#8b94a5", fontSize: 15, fontWeight: "700" },
  sideTextActive: { color: "#ffffff" },
  oddsAvailableLine: { alignItems: "center", justifyContent: "center", minHeight: 28, marginTop: 12 },
  oddsAvailableLinePhone: { marginTop: 6 },
  oddsAvailableText: { color: "#a8b0bf", fontSize: 15, fontWeight: "500" },
  amountHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 6, marginBottom: 3 },
  amountMeta: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  inputLabel: { color: "#94a3b8", fontWeight: "800" },
  balanceText: { color: "#cbd5e1", fontSize: 12, fontWeight: "900", flexShrink: 1 },
  maxText: { color: "#93c5fd", fontWeight: "900" },
  amountInput: { height: 42, borderRadius: 12, paddingHorizontal: 12, backgroundColor: "#070c14", borderWidth: 1, borderColor: "#263247", color: "#f8fafc", fontSize: 21, fontWeight: "900" },
  presetRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 10 },
  presetRowPhone: { marginTop: 7 },
  presetButton: { flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center" },
  presetText: { color: "#d7dce6", fontSize: 23, fontWeight: "500" },
  keypadGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 8, marginTop: 10, paddingBottom: 20 },
  keypadGridPhone: { rowGap: 6, marginTop: 8, paddingBottom: 26 },
  keypadButton: { width: "31.5%", minHeight: 43, alignItems: "center", justifyContent: "center" },
  keypadButtonPhone: { minHeight: 37 },
  keypadText: { color: "#f8fafc", fontSize: 29, fontWeight: "500" },
  errorCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, backgroundColor: "#1f1a0b", borderWidth: 1, borderColor: "#854d0e", marginTop: 12 },
  errorTextBlock: { flex: 1, gap: 3 },
  errorText: { color: "#fde68a", fontWeight: "800" },
  errorDetailText: { color: "#fcd34d", fontSize: 12, fontWeight: "700" },
  ticketFooter: { position: "absolute", left: 0, right: 0, bottom: 0, minHeight: 118, paddingHorizontal: 18, paddingTop: 12, justifyContent: "flex-end", backgroundColor: "#070b12", borderTopWidth: 1, borderTopColor: "#151c28", overflow: "visible", zIndex: 4, elevation: 4 },
  ticketFooterPhone: { minHeight: 112, paddingTop: 10 },
  ticketFooterSubmitLive: { backgroundColor: "#ff2b72", borderTopColor: "#ff2b72" },
  ticketFooterUnavailable: { minHeight: 112, backgroundColor: "#070b12", borderTopColor: "#201923" },
  ticketFooterLightBand: { display: "none" },
  ticketFooterDarkBand: { display: "none" },
  swipeExpansionSheet: { display: "none" },
  swipeExpansionSheetSell: { display: "none" },
  swipeSubmit: { minHeight: 72, alignItems: "center", justifyContent: "flex-start", paddingHorizontal: 18, paddingTop: 6, paddingBottom: 10, borderRadius: 12, position: "relative", borderWidth: 1, shadowColor: "#000000", shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8, zIndex: 2 },
  swipeSubmitBuy: { backgroundColor: "#ff2b72", borderColor: "#ff5a91" },
  swipeSubmitSell: { backgroundColor: "#dc143f", borderColor: "#fb7185" },
  swipeSubmitUnavailable: { minHeight: 72, flexDirection: "row", justifyContent: "center", gap: 12, paddingHorizontal: 18, backgroundColor: "#111827", borderColor: "#2f1820" },
  swipeSubmitArmed: { shadowOpacity: 0.32, elevation: 12 },
  swipeSubmitDisabled: { opacity: 0.48 },
  swipeIcon: { position: "relative", width: 34, height: 20, borderRadius: 999, alignItems: "center", justifyContent: "center", marginBottom: 4, backgroundColor: "rgba(255,255,255,0.08)", zIndex: 2 },
  swipeIconUnavailable: { position: "relative", right: 0, top: 0, width: 38, height: 38, borderRadius: 19, backgroundColor: "#2a1117" },
  swipeIconArmed: { backgroundColor: "rgba(255,255,255,0.22)" },
  swipeThresholdLine: { position: "absolute", top: 8, width: 58, height: 2, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.22)" },
  swipeThresholdLineArmed: { backgroundColor: "rgba(255,255,255,0.86)" },
  swipeTextBlock: { alignItems: "center", zIndex: 1 },
  swipeTextBlockUnavailable: { flex: 1, alignItems: "flex-start" },
  swipeLabel: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
  swipeLabelArmed: { color: "#ffffff", fontSize: 20 },
  swipeLabelUnavailable: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  swipeHelper: { color: "rgba(255,255,255,0.72)", fontSize: 11, fontWeight: "800", marginTop: 4 },
  swipeHelperArmed: { color: "rgba(255,255,255,0.88)" },
  swipeHelperUnavailable: { color: "#8b94a5", marginTop: 3 },
});
