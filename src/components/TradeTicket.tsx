import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
  marketType: "spread" | "totals" | "team-total" | "winner" | "prop" | "future" | "live";
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
  finalCostMayVary: string;
};

function SwipeSubmitControl({
  disabled,
  label,
  helper,
  onSubmit,
}: {
  disabled: boolean;
  label: string;
  helper: string;
  onSubmit: () => void | Promise<void>;
}) {
  const [isArmed, setIsArmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const triggerSubmit = async () => {
    if (disabled || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
      setIsArmed(false);
      setSwipeProgress(0);
    }
  };
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled && !isSubmitting,
        onStartShouldSetPanResponderCapture: () => !disabled && !isSubmitting,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dy) > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderGrant: () => {
          setIsArmed(false);
          setSwipeProgress(0);
        },
        onPanResponderMove: (_, gesture) => {
          const progress = gesture.dy < 0 ? Math.min(Math.abs(gesture.dy) / 90, 1) : 0;
          setSwipeProgress(progress);
          setIsArmed(progress >= 0.58);
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy < -70) {
            void triggerSubmit();
            return;
          }
          setIsArmed(false);
          setSwipeProgress(0);
        },
        onPanResponderTerminate: () => {
          setIsArmed(false);
          setSwipeProgress(0);
        },
      }),
    [disabled, isSubmitting, onSubmit],
  );
  const progressBucket = disabled ? "disabled" : isSubmitting ? "submitting" : isArmed ? "armed" : swipeProgress > 0 ? "dragging" : "idle";
  const handleLift = -58 * swipeProgress;

  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || isSubmitting }}
      accessibilityHint={helper}
      accessibilityLabel={`swipe-to-submit-order swipe-submit-gesture-required swipe-submit-tap-disabled swipe-submit-state-${progressBucket} swipe-submit-progress-${Math.round(swipeProgress * 100)}`}
      style={[styles.swipeSubmit, isArmed && styles.swipeSubmitArmed, disabled && styles.swipeSubmitDisabled]}
      testID="place-mock-order"
      {...panResponder.panHandlers}
    >
      <View
        accessibilityLabel={`swipe-submit-handle swipe-submit-state-${progressBucket} swipe-submit-handle-translate-y-${Math.round(handleLift)}`}
        style={[styles.swipeIcon, isArmed && styles.swipeIconArmed, { transform: [{ translateY: handleLift }] }]}
        testID="swipe-submit-handle"
      >
        <Ionicons name={isSubmitting ? "hourglass-outline" : "chevron-up"} color="#ffffff" size={22} />
      </View>
      <View style={styles.swipeTextBlock}>
        <Text style={styles.swipeLabel}>{isSubmitting ? label : label}</Text>
        <Text style={styles.swipeHelper}>{helper}</Text>
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
  const [showOrderSettings, setShowOrderSettings] = useState(false);

  useEffect(() => {
    if (!ticket) return;
    const opensFromRetailFlow = Boolean(ticket.event || ticket.sourcePositionId);
    setAmountState(opensFromRetailFlow ? "0" : defaultAmount);
    setSideState(ticket.side);
    setActiveContractSide(ticket.contractSide ?? ticket.selection?.contractSide ?? "yes");
    setSlippageState(defaultSlippage);
    setShowOrderSettings(false);
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
  const eventLabel = label(locale, ticket.event ?? ticket.market);
  const outcomeLabel = label(locale, ticket.outcome);
  const sideLabel = contractSide === "yes" ? "Yes" : "No";
  const selectionLabel = ticket.selection?.displayLabel ?? outcomeLabel;
  const marketLabel = ticket.selection?.displayLabel ?? label(locale, ticket.market);
  const teamCode = teamCodeForTicket(ticket);
  const teamFlag = teamCode ? teamFlags[teamCode] : undefined;
  const amountDisplay = numericAmount > 0 ? compactCash(numericAmount) : "$0";
  const availabilityLabel = marketAvailabilityLabel(ticket.market);
  const availabilityTone = marketAvailabilityTone(ticket.market);
  const availabilityStatus = ticket.market.availability?.status ?? "unknown";
  const marketTradable = availabilityTone !== "blocked";
  const submitLabel = !marketTradable ? availabilityLabel ?? "Market unavailable" : numericAmount <= 0 ? "Choose an amount" : swipeLabel;
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
    <Modal visible transparent animationType="slide" statusBarTranslucent>
      <View style={styles.modalShade}>
        <View style={styles.ticket}>
          <ScrollView
            accessibilityLabel="trade-ticket"
            contentContainerStyle={styles.ticketContent}
            keyboardShouldPersistTaps="handled"
            style={styles.ticketBodyPanel}
            testID="trade-ticket"
          >
            <View accessibilityLabel="ticket-drag-handle" testID="ticket-drag-handle" style={styles.dragHandle} />
            <View accessibilityLabel={`ticket-selection-summary ticket-retail-order-header ${providerIdentityLabel}`} testID="ticket-selection-summary" style={styles.ticketHeader}>
              <Pressable accessibilityLabel="ticket-close" onPress={close} style={styles.closeButton} testID="ticket-close">
                <Ionicons name="close" color="#f8fafc" size={24} />
              </Pressable>
              <View
                accessibilityLabel={`ticket-outcome-flag ${teamCode ? `ticket-outcome-flag-${teamCode}` : "ticket-outcome-flag-generic"}`}
                testID="ticket-outcome-flag"
                style={[styles.outcomeFlag, !teamFlag && { backgroundColor: ticket.outcome.color }]}
              >
                {teamFlag && <Text style={styles.outcomeFlagEmoji}>{teamFlag}</Text>}
              </View>
              <View style={styles.selectionTextBlock}>
                <Text numberOfLines={1} style={styles.ticketTitle}>{eventLabel}</Text>
                <Text accessibilityLabel="ticket-selection-line" testID="ticket-selection-line" numberOfLines={1} style={styles.ticketOutcome}>
                  <Text style={styles.ticketOutcomeSide}>{sideLabel}</Text> <Text style={styles.ticketOutcomeDot}>-</Text> {selectionLabel}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={`ticket-settings ticket-order-filter-local-mvp ticket-settings-state-${showOrderSettings ? "open" : "closed"}`}
                onPress={() => setShowOrderSettings((current) => !current)}
                style={styles.ticketSettingsButton}
                testID="ticket-settings"
              >
                <Ionicons name="options-outline" color="#dbe4f0" size={22} />
              </Pressable>
            </View>
            <View accessibilityLabel="ticket-side-pill ticket-advanced-hidden-local-mvp" testID="ticket-side-pill" style={styles.orderReviewA11y}>
              <Text>ticket-advanced-hidden-local-mvp</Text>
            </View>
            {showOrderSettings && (
              <View accessibilityLabel={`ticket-settings-panel ticket-settings-state-open ${providerIdentityLabel}`} style={styles.settingsPanel} testID="ticket-settings-panel">
                <View style={styles.settingsPanelRow}>
                  <Text style={styles.settingsPanelLabel}>Order type</Text>
                  <Text style={styles.settingsPanelValue}>Market</Text>
                </View>
                <View style={styles.settingsPanelRow}>
                  <Text style={styles.settingsPanelLabel}>Odds</Text>
                  <Text style={styles.settingsPanelValue}>{contractProbability}%</Text>
                </View>
                <View style={styles.settingsPanelRow}>
                  <Text style={styles.settingsPanelLabel}>Available</Text>
                  <Text style={styles.settingsPanelValue}>{money(balance)}</Text>
                </View>
              </View>
            )}
            {availabilityLabel && availabilityTone !== "ready" && (
              <View
                accessibilityLabel={`ticket-market-status ticket-availability-${availabilityStatus} ticket-market-status-${ticket.market.availability?.marketStatus ?? "unknown"} ${providerIdentityLabel} ${availabilityLabel}`}
                style={[styles.marketStatusPill, availabilityTone === "warning" && styles.marketStatusPillWarning, availabilityTone === "blocked" && styles.marketStatusPillBlocked]}
                testID="ticket-market-status"
              >
                <Ionicons
                  name={availabilityTone === "blocked" ? "alert-circle-outline" : availabilityTone === "warning" ? "time-outline" : "checkmark-circle-outline"}
                  color={availabilityTone === "blocked" ? "#fecaca" : availabilityTone === "warning" ? "#fde68a" : "#bbf7d0"}
                  size={15}
                />
                <Text style={[styles.marketStatusText, availabilityTone === "warning" && styles.marketStatusTextWarning, availabilityTone === "blocked" && styles.marketStatusTextBlocked]}>
                  {availabilityLabel}
                </Text>
              </View>
            )}
            <View
              accessibilityLabel={`ticket-advanced-hidden-local-mvp internal-price-context-hidden mode-${tradingModeValue} bid-${depth.bid} ask-${depth.ask} width-${depth.spread} ${isLiveTicket ? "live-context-hidden" : "live-context-none"} ${liveClockText ?? ""}`}
              style={styles.orderReviewA11y}
              testID="ticket-advanced-proof-hidden"
            >
              <Text>ticket-advanced-hidden-local-mvp</Text>
            </View>
            <View accessibilityLabel="ticket-amount-display" testID="ticket-amount-display" style={styles.amountDisplayBlock}>
              <Text style={[styles.amountDisplayText, numericAmount <= 0 && styles.amountDisplayTextEmpty]}>{amountDisplay}</Text>
            </View>
            <View accessibilityLabel={`${sideLabel} - ${outcomeLabel}`} testID="ticket-contract-outcome-row" style={styles.orderReviewA11y}>
              <Text accessibilityLabel="ticket-selected-outcome-choice" testID="ticket-selected-outcome-choice">
                {outcomeLabel}
              </Text>
            </View>
            {numericAmount > 0 && (
              <View accessibilityLabel="ticket-to-win-line" testID="ticket-to-win-line" style={styles.toWinBlock}>
                <Text style={styles.toWinText}>To win <Text style={styles.toWinValue}>{compactCash(estimatedPayout)}</Text></Text>
                <Text accessibilityLabel="ticket-price-line" testID="ticket-price-line" style={styles.priceText}>{priceDisplay}</Text>
              </View>
            )}
            <View
              accessibilityLabel={`ticket-order-review market-${reviewMarketType} line-${reviewLine} period-${reviewPeriod} price-${contractProbability} shares-${reviewShares} payout-${reviewPayout} ${providerIdentityLabel}`}
              style={styles.orderReviewA11y}
              testID="ticket-order-review"
            >
              <Text>ticket-identity-preserved</Text>
              <Text accessibilityLabel="ticket-order-review-price" testID="ticket-order-review-price">{priceDisplay}</Text>
              <Text accessibilityLabel="ticket-order-review-payout" testID="ticket-order-review-payout">{reviewPayout}</Text>
            </View>
            <View style={styles.ticketSideRow}>
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
              style={styles.oddsAvailableLine}
            >
              <Text style={styles.oddsAvailableText}>Odds {contractProbability}% | {money(balance)} available</Text>
            </View>
            <View style={styles.presetRow}>
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
            <View accessibilityLabel="ticket-amount-keypad" testID="ticket-amount-keypad" style={styles.keypadGrid}>
              {keypadKeys.map((key) => (
                <Pressable
                  accessibilityLabel={`ticket-keypad-${key}`}
                  key={key}
                  onPress={() => applyKeypadInput(key)}
                  style={styles.keypadButton}
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
          </ScrollView>
          <View style={styles.ticketFooter}>
            <View style={styles.ticketFooterLightBand} />
            <View style={styles.ticketFooterDarkBand} />
            <SwipeSubmitControl
              disabled={numericAmount <= 0 || !marketTradable}
              helper={t.finalCostMayVary}
              label={submitLabel}
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
  ticket: { flex: 1, height: "100%", backgroundColor: "#fb2f6f", overflow: "hidden" },
  ticketBodyPanel: { flex: 1, backgroundColor: "#070b12", borderBottomLeftRadius: 34, borderBottomRightRadius: 34 },
  ticketContent: { flexGrow: 1, width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 24, paddingTop: 28, paddingBottom: 10 },
  dragHandle: { alignSelf: "center", width: 92, height: 1, borderRadius: 999, backgroundColor: "#293141", marginBottom: 2, opacity: 0.01 },
  ticketTop: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  ticketHeading: { flex: 1, alignItems: "center" },
  ticketTitle: { color: "#cbd5e1", fontSize: 16, fontWeight: "700" },
  ticketOutcome: { color: "#f8fafc", fontSize: 19, fontWeight: "800", marginTop: 4 },
  ticketOutcomeSide: { color: "#22c55e" },
  ticketOutcomeDot: { color: "#64748b" },
  ticketSub: { color: "#64748b", fontSize: 12, fontWeight: "900", marginTop: 4 },
  closeButton: { width: 42, height: 56, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  tradeSidePill: { minWidth: 42, minHeight: 42 },
  tradeSideText: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  ticketHeader: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 62 },
  outcomeFlag: { width: 56, height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", overflow: "hidden" },
  outcomeFlagEmoji: { fontSize: 34, lineHeight: 42 },
  selectionTextBlock: { flex: 1 },
  ticketSettingsButton: { width: 42, height: 56, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  settingsPanel: { marginTop: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: "#0d1420", borderWidth: 1, borderColor: "#222d40", gap: 8 },
  settingsPanelRow: { minHeight: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  settingsPanelLabel: { color: "#8b94a5", fontSize: 13, fontWeight: "700" },
  settingsPanelValue: { color: "#f8fafc", fontSize: 13, fontWeight: "900" },
  marketStatusPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: "#052e1b", borderWidth: 1, borderColor: "#166534" },
  marketStatusPillWarning: { backgroundColor: "#2b2106", borderColor: "#854d0e" },
  marketStatusPillBlocked: { backgroundColor: "#2a0d0d", borderColor: "#7f1d1d" },
  marketStatusText: { color: "#bbf7d0", fontSize: 12, fontWeight: "900" },
  marketStatusTextWarning: { color: "#fde68a" },
  marketStatusTextBlocked: { color: "#fecaca" },
  amountDisplayBlock: { minHeight: 112, alignItems: "center", justifyContent: "center", marginTop: 0 },
  amountDisplayText: { color: "#f8fafc", fontSize: 70, fontWeight: "500" },
  amountDisplayTextEmpty: { color: "#1b2230" },
  ticketOutcomeRow: { alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 4, minHeight: 56, padding: 5, borderRadius: 999, backgroundColor: "#1c2330" },
  outcomeChoiceMuted: { minWidth: 86, textAlign: "center", color: "#8b94a5", fontSize: 17, fontWeight: "700", paddingHorizontal: 14 },
  outcomeChoiceActive: { minWidth: 86, textAlign: "center", overflow: "hidden", color: "#f8fafc", fontSize: 17, fontWeight: "800", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 999, backgroundColor: "#0d1422" },
  toWinBlock: { alignItems: "center", justifyContent: "center", minHeight: 40, marginTop: -6 },
  toWinText: { color: "#d1d5db", fontSize: 20, fontWeight: "800" },
  toWinValue: { color: "#22c55e", fontSize: 22, fontWeight: "900" },
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
  ticketSideRow: { alignSelf: "center", width: 142, flexDirection: "row", gap: 3, marginTop: 5, padding: 4, borderRadius: 999, backgroundColor: "#1d2431" },
  sideButton: { flex: 1, minHeight: 34, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "transparent" },
  sideButtonActive: { backgroundColor: "#0b111d" },
  sideText: { color: "#8b94a5", fontSize: 15, fontWeight: "700" },
  sideTextActive: { color: "#ffffff" },
  oddsAvailableLine: { alignItems: "center", justifyContent: "center", minHeight: 26, marginTop: 6 },
  oddsAvailableText: { color: "#a8b0bf", fontSize: 15, fontWeight: "500" },
  amountHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 6, marginBottom: 3 },
  amountMeta: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  inputLabel: { color: "#94a3b8", fontWeight: "800" },
  balanceText: { color: "#cbd5e1", fontSize: 12, fontWeight: "900", flexShrink: 1 },
  maxText: { color: "#93c5fd", fontWeight: "900" },
  amountInput: { height: 42, borderRadius: 12, paddingHorizontal: 12, backgroundColor: "#070c14", borderWidth: 1, borderColor: "#263247", color: "#f8fafc", fontSize: 21, fontWeight: "900" },
  presetRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 8 },
  presetButton: { flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center" },
  presetText: { color: "#d7dce6", fontSize: 23, fontWeight: "500" },
  keypadGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 6, marginTop: 8, paddingBottom: 4 },
  keypadButton: { width: "31.5%", minHeight: 42, alignItems: "center", justifyContent: "center" },
  keypadText: { color: "#f8fafc", fontSize: 28, fontWeight: "500" },
  errorCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, backgroundColor: "#1f1a0b", borderWidth: 1, borderColor: "#854d0e", marginTop: 12 },
  errorTextBlock: { flex: 1, gap: 3 },
  errorText: { color: "#fde68a", fontWeight: "800" },
  errorDetailText: { color: "#fcd34d", fontSize: 12, fontWeight: "700" },
  ticketFooter: { minHeight: 148, paddingHorizontal: 18, paddingTop: 4, paddingBottom: 18, backgroundColor: "#fb2f6f", position: "relative", overflow: "hidden" },
  ticketFooterLightBand: { position: "absolute", top: -18, left: -70, right: -20, height: 92, backgroundColor: "#ff79a5", opacity: 0.5, transform: [{ rotate: "-8deg" }] },
  ticketFooterDarkBand: { position: "absolute", left: -40, right: -40, bottom: -52, height: 118, backgroundColor: "#d4145f", opacity: 0.78, transform: [{ rotate: "7deg" }] },
  swipeSubmit: { flex: 1, minHeight: 108, alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 14, borderRadius: 24, backgroundColor: "transparent" },
  swipeSubmitArmed: { backgroundColor: "rgba(255,255,255,0.08)" },
  swipeSubmitDisabled: { opacity: 0.55 },
  swipeIcon: { width: 56, height: 42, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "transparent" },
  swipeIconArmed: { backgroundColor: "rgba(255,255,255,0.16)" },
  swipeTextBlock: { alignItems: "center", transform: [{ translateY: -18 }] },
  swipeLabel: { color: "#ffffff", fontSize: 24, fontWeight: "500" },
  swipeHelper: { color: "rgba(255,255,255,0.58)", fontSize: 12, fontWeight: "700", marginTop: 6 },
});
