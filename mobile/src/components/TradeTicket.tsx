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
  selection?: TicketSelection;
};

export type TicketSelection = {
  marketType: "spread" | "totals" | "team-total" | "winner" | "prop" | "future" | "live";
  line?: string;
  period?: string;
  displayLabel: string;
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
  const triggerSubmit = async () => {
    if (disabled || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
      setIsArmed(false);
    }
  };
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled && !isSubmitting,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderGrant: () => setIsArmed(false),
        onPanResponderMove: (_, gesture) => setIsArmed(gesture.dy < -42),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy < -70) {
            void triggerSubmit();
            return;
          }
          setIsArmed(false);
        },
        onPanResponderTerminate: () => setIsArmed(false),
      }),
    [disabled, isSubmitting, onSubmit],
  );

  return (
    <Pressable
      accessibilityHint={helper}
      accessibilityLabel="swipe-to-submit-order"
      disabled={disabled || isSubmitting}
      onPress={() => void triggerSubmit()}
      style={[styles.swipeSubmit, isArmed && styles.swipeSubmitArmed, disabled && styles.swipeSubmitDisabled]}
      testID="place-mock-order"
      {...panResponder.panHandlers}
    >
      <View style={styles.swipeIcon}>
        <Ionicons name={isSubmitting ? "hourglass-outline" : "chevron-up"} color="#ffffff" size={22} />
      </View>
      <View style={styles.swipeTextBlock}>
        <Text style={styles.swipeLabel}>{isSubmitting ? label : label}</Text>
        <Text style={styles.swipeHelper}>{helper}</Text>
      </View>
    </Pressable>
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
  placeOrder: (amount: number, side: "buy" | "sell") => void | Promise<void>;
}) {
  const [amount, setAmountState] = useState(defaultAmount);
  const [side, setSideState] = useState<"buy" | "sell">(defaultSide);
  const [slippage, setSlippageState] = useState(defaultSlippage);

  useEffect(() => {
    if (!ticket) return;
    setAmountState(ticket.event ? "0" : defaultAmount);
    setSideState(ticket.side);
    setSlippageState(defaultSlippage);
  }, [defaultAmount, defaultSlippage, ticket]);

  if (!ticket) return null;
  const setAmount = (nextAmount: string) => {
    setAmountState(nextAmount);
    onPreferencesChange({ amount: nextAmount, side, slippage });
  };
  const setSide = (nextSide: "buy" | "sell") => {
    setSideState(nextSide);
    onPreferencesChange({ amount, side: nextSide, slippage });
  };
  const setSlippage = (nextSlippage: string) => {
    setSlippageState(nextSlippage);
    onPreferencesChange({ amount, side, slippage: nextSlippage });
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
  const averagePrice = ticket.outcome.probability / 100;
  const impliedOdds = ticket.outcome.probability > 0 ? 100 / ticket.outcome.probability : 0;
  const estimatedShares = averagePrice > 0 ? numericAmount / averagePrice : 0;
  const estimatedPayout = ticket.outcome.probability > 0 ? numericAmount * (100 / ticket.outcome.probability) : 0;
  const potentialProfit = Math.max(estimatedPayout - Math.min(numericAmount, balance), 0);
  const primaryLabel = side === "buy" ? t.placeBuyOrder : t.placeSellOrder;
  const swipeLabel = side === "buy" ? t.swipeBuyOrder : t.swipeSellOrder;
  const costLabel = side === "buy" ? t.estimatedCost : t.estimatedProceeds;
  const amountPresets = [5, 10, 25];
  const keypadKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"];
  const slippageOptions = [
    { key: "half", value: "0.5%" },
    { key: "one", value: "1%" },
    { key: "two", value: "2%" },
  ];
  const isLiveTicket = ticket.event?.status === "live";
  const tradingModeValue = tradingMode === "server" ? t.tradingModeServer : t.tradingModeMock;
  const depth = marketDepth(ticket.outcome, t.shares);
  const liveClock = isLiveTicket
    ? ticket.event?.startsAt.replace(/[^\x00-\x7F]+/g, "-").replace(/\s+-\s+/g, " - ")
    : null;
  const liveClockText = liveClock ? `${liveClock} - ${t.livePriceMovement}` : null;
  const eventLabel = label(locale, ticket.event ?? ticket.market);
  const outcomeLabel = label(locale, ticket.outcome);
  const sideLabel = side === "buy" ? "Yes" : "No";
  const selectionLabel = ticket.selection?.displayLabel ?? outcomeLabel;
  const amountDisplay = numericAmount > 0 ? money(numericAmount) : "$0";
  const submitLabel = numericAmount <= 0 ? "Choose an amount" : swipeLabel || primaryLabel;

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.modalShade}>
        <View style={styles.ticket}>
          <ScrollView
            accessibilityLabel="trade-ticket"
            contentContainerStyle={styles.ticketContent}
            keyboardShouldPersistTaps="handled"
            testID="trade-ticket"
          >
            <View style={styles.ticketTop}>
              <Pressable accessibilityLabel="ticket-close" onPress={close} style={styles.closeButton} testID="ticket-close">
                <Ionicons name="close" color="#f8fafc" size={24} />
              </Pressable>
              <View style={styles.ticketHeading}>
                <Text style={styles.ticketTitle}>{eventLabel}</Text>
                <Text accessibilityLabel="ticket-selection-line" testID="ticket-selection-line" style={styles.ticketSub}>
                  {sideLabel} - {selectionLabel}
                </Text>
              </View>
              <Pressable accessibilityLabel="ticket-settings" style={styles.settingsButton} testID="ticket-settings">
                <Ionicons name="options-outline" color="#f8fafc" size={22} />
              </Pressable>
            </View>
            <View style={styles.ticketMetaBlock}>
                <View accessibilityLabel="ticket-trading-mode" testID="ticket-trading-mode" style={styles.modePill}>
                  <Text style={styles.modePillText}>{t.tradingMode}: {tradingModeValue}</Text>
                </View>
                <View accessibilityLabel="ticket-market-depth" testID="ticket-market-depth" style={styles.depthPill}>
                  <Text style={styles.depthPillText}>
                    {t.bestBid} {depth.bid} - {t.bestAsk} {depth.ask} - {t.spread} {depth.spread}
                  </Text>
                </View>
                {isLiveTicket && (
                  <View accessibilityLabel="ticket-live-badge" testID="ticket-live-badge" style={styles.liveBadge}>
                    <Ionicons name="radio-outline" color="#fecaca" size={14} />
                    <Text style={styles.liveBadgeText}>{t.liveNow}</Text>
                  </View>
                )}
                {liveClockText && (
                  <Text accessibilityLabel="ticket-live-clock" testID="ticket-live-clock" style={styles.liveClock}>
                    {liveClockText}
                  </Text>
                )}
            </View>
            <View accessibilityLabel="ticket-amount-display" testID="ticket-amount-display" style={styles.amountDisplayBlock}>
              <Text style={styles.amountDisplayText}>{amountDisplay}</Text>
            </View>
            <View style={styles.ticketSideRow}>
              {(["buy", "sell"] as const).map((option) => (
                <Pressable
                  accessibilityLabel={`ticket-side-${option}`}
                  key={option}
                  style={[styles.sideButton, side === option && styles.sideButtonActive]}
                  onPress={() => setSide(option)}
                  testID={`ticket-side-${option}`}
                >
                  <Text style={[styles.sideText, side === option && styles.sideTextActive]}>{option === "buy" ? "Yes" : "No"}</Text>
                </Pressable>
              ))}
            </View>
            <View accessibilityLabel="ticket-odds-available" testID="ticket-odds-available" style={styles.oddsAvailableLine}>
              <Text style={styles.oddsAvailableText}>Odds {ticket.outcome.probability}% | {money(balance)} available</Text>
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
            </View>
            <View style={styles.amountHeader}>
              <Text accessibilityLabel="ticket-balance-inline" testID="ticket-balance-inline" style={styles.balanceText}>
                {t.balance} {money(balance)}
              </Text>
              <Pressable accessibilityLabel="ticket-max-amount" testID="ticket-max-amount" onPress={() => setAmount(String(Math.floor(balance)))}>
                <Text style={styles.maxText}>{t.max}</Text>
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
            <View accessibilityLabel="ticket-slippage" testID="ticket-slippage" style={styles.slippageSection}>
              <Text style={styles.estimateLabel}>{t.slippage}</Text>
              <View style={styles.slippageControls}>
                {slippageOptions.map((option) => (
                  <Pressable
                    accessibilityLabel={`ticket-slippage-${option.key}${slippage === option.value ? "-selected" : ""}`}
                    key={option.key}
                    onPress={() => setSlippage(option.value)}
                    style={[styles.slippageButton, slippage === option.value && styles.slippageButtonActive]}
                    testID={`ticket-slippage-${option.key}${slippage === option.value ? "-selected" : ""}`}
                  >
                    <Text style={[styles.slippageText, slippage === option.value && styles.slippageTextActive]}>{option.value}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.estimateGrid}>
              <View style={styles.estimateLineCompact}>
                <Text style={styles.estimateLabel}>{costLabel}</Text>
                <Text style={styles.estimateValue}>{money(Math.min(numericAmount, balance))}</Text>
              </View>
              <View style={styles.estimateLineCompact}>
                <Text style={styles.estimateLabel}>{t.estimatedShares}</Text>
                <Text style={styles.estimateValue}>{estimatedShares.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
              </View>
              <View style={styles.estimateLineCompact}>
                <Text style={styles.estimateLabel}>{t.averagePrice}</Text>
                <Text style={styles.estimateValue}>{averagePrice.toFixed(2)} USDT</Text>
              </View>
              <View accessibilityLabel="ticket-estimated-fee" testID="ticket-estimated-fee" style={styles.estimateLineCompact}>
                <Text style={styles.estimateLabel}>{t.estimatedFee}</Text>
                <Text style={styles.estimateValue}>{money(0)}</Text>
              </View>
              <View style={styles.estimateLineCompact}>
                <Text style={styles.estimateLabel}>{t.impliedOdds}</Text>
                <Text style={styles.estimateValue}>{impliedOdds.toFixed(1)}x</Text>
              </View>
              <View style={styles.estimateLineCompact}>
                <Text style={styles.estimateLabel}>{t.estimatedPayout}</Text>
                <Text style={styles.estimateValue}>{money(estimatedPayout)}</Text>
              </View>
              <View style={styles.estimateLineCompact}>
                <Text style={styles.estimateLabel}>{t.potentialProfit}</Text>
                <Text style={styles.estimateValue}>{money(potentialProfit)}</Text>
              </View>
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
            <SwipeSubmitControl
              disabled={numericAmount <= 0}
              helper={t.finalCostMayVary}
              label={submitLabel}
              onSubmit={() => placeOrder(numericAmount, side)}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalShade: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  ticket: { maxHeight: "94%", borderTopLeftRadius: 22, borderTopRightRadius: 22, backgroundColor: "#080d16", borderWidth: 1, borderColor: "#263247", overflow: "hidden" },
  ticketContent: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8 },
  ticketTop: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  ticketHeading: { flex: 1, alignItems: "center" },
  ticketTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "900", textAlign: "center" },
  ticketSub: { color: "#cbd5e1", fontSize: 13, fontWeight: "900", marginTop: 3, textAlign: "center" },
  ticketMetaBlock: { height: 1, overflow: "hidden", opacity: 0 },
  modePill: { alignSelf: "center", marginTop: 0, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: "#172033", borderWidth: 1, borderColor: "#2d3a50" },
  modePillText: { color: "#dbeafe", fontSize: 12, fontWeight: "900" },
  depthPill: { alignSelf: "center", maxWidth: "100%", marginTop: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  depthPillText: { color: "#e0f2fe", fontSize: 11, fontWeight: "900" },
  liveBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: "#451a1a", borderWidth: 1, borderColor: "#7f1d1d" },
  liveBadgeText: { color: "#fecaca", fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  liveClock: { marginTop: 4, color: "#fca5a5", fontSize: 12, fontWeight: "900" },
  closeButton: { width: 38, height: 38, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "#111827" },
  settingsButton: { width: 38, height: 38, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "#111827" },
  amountDisplayBlock: { minHeight: 58, alignItems: "center", justifyContent: "center", marginTop: 6 },
  amountDisplayText: { color: "#f8fafc", fontSize: 34, fontWeight: "900" },
  ticketSideRow: { flexDirection: "row", gap: 8, marginTop: 4, padding: 4, borderRadius: 14, backgroundColor: "#111827" },
  sideButton: { flex: 1, minHeight: 34, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: "transparent" },
  sideButtonActive: { backgroundColor: "#273244" },
  sideText: { color: "#94a3b8", fontWeight: "900" },
  sideTextActive: { color: "#ffffff" },
  oddsAvailableLine: { alignItems: "center", justifyContent: "center", minHeight: 28 },
  oddsAvailableText: { color: "#9ca3af", fontSize: 13, fontWeight: "900" },
  amountHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 6, marginBottom: 3 },
  amountMeta: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  inputLabel: { color: "#94a3b8", fontWeight: "800" },
  balanceText: { color: "#cbd5e1", fontSize: 12, fontWeight: "900", flexShrink: 1 },
  maxText: { color: "#93c5fd", fontWeight: "900" },
  amountInput: { height: 42, borderRadius: 12, paddingHorizontal: 12, backgroundColor: "#070c14", borderWidth: 1, borderColor: "#263247", color: "#f8fafc", fontSize: 21, fontWeight: "900" },
  presetRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  presetButton: { flex: 1, minHeight: 36, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#111827", borderWidth: 1, borderColor: "#293548" },
  presetText: { color: "#f8fafc", fontSize: 15, fontWeight: "900" },
  keypadGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  keypadButton: { width: "31.5%", minHeight: 34, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  keypadText: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  estimateGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 8 },
  estimateLineCompact: { width: "31.8%", minHeight: 45, paddingHorizontal: 6, paddingVertical: 5, borderRadius: 10, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  estimateLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: "#263247" },
  estimateLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "800" },
  estimateValue: { color: "#f8fafc", fontSize: 12, fontWeight: "900" },
  slippageSection: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 6 },
  slippageControls: { flexDirection: "row", gap: 6 },
  slippageButton: { minWidth: 52, minHeight: 30, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#1f2937", borderWidth: 1, borderColor: "#334155" },
  slippageButtonActive: { backgroundColor: "#1d6dff", borderColor: "#60a5fa" },
  slippageText: { color: "#cbd5e1", fontSize: 12, fontWeight: "900" },
  slippageTextActive: { color: "#ffffff" },
  errorCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, backgroundColor: "#1f1a0b", borderWidth: 1, borderColor: "#854d0e", marginTop: 12 },
  errorTextBlock: { flex: 1, gap: 3 },
  errorText: { color: "#fde68a", fontWeight: "800" },
  errorDetailText: { color: "#fcd34d", fontSize: 12, fontWeight: "700" },
  ticketFooter: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 24, backgroundColor: "#080d16", borderTopWidth: 1, borderTopColor: "#263247" },
  swipeSubmit: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, borderRadius: 16, backgroundColor: "#1d6dff" },
  swipeSubmitArmed: { backgroundColor: "#16a34a" },
  swipeSubmitDisabled: { opacity: 0.55 },
  swipeIcon: { width: 42, height: 42, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.18)" },
  swipeTextBlock: { flex: 1 },
  swipeLabel: { color: "#ffffff", fontSize: 17, fontWeight: "900" },
  swipeHelper: { color: "#dbeafe", fontSize: 12, fontWeight: "800", marginTop: 2 },
});
