import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { Locale, Event, Market, Outcome } from "../mocks/worldCup";
import { label, money } from "../presentation/formatters";

export type Ticket = {
  event?: Event;
  market: Market;
  outcome: Outcome;
  side: "buy" | "sell";
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
    setAmountState(defaultAmount);
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
  const numericAmount = Number(amount) || 0;
  const averagePrice = ticket.outcome.probability / 100;
  const impliedOdds = ticket.outcome.probability > 0 ? 100 / ticket.outcome.probability : 0;
  const estimatedShares = averagePrice > 0 ? numericAmount / averagePrice : 0;
  const estimatedPayout = ticket.outcome.probability > 0 ? numericAmount * (100 / ticket.outcome.probability) : 0;
  const potentialProfit = Math.max(estimatedPayout - Math.min(numericAmount, balance), 0);
  const primaryLabel = side === "buy" ? t.placeBuyOrder : t.placeSellOrder;
  const swipeLabel = side === "buy" ? t.swipeBuyOrder : t.swipeSellOrder;
  const costLabel = side === "buy" ? t.estimatedCost : t.estimatedProceeds;
  const amountPresets = [100, 500, 1000];
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
              <View style={styles.ticketHeading}>
                <Text style={styles.ticketTitle}>{label(locale, ticket.outcome)}</Text>
                <Text style={styles.ticketSub}>{label(locale, ticket.event ?? ticket.market)}</Text>
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
              <Pressable onPress={close} style={styles.closeButton}>
                <Ionicons name="close" color="#f8fafc" size={22} />
              </Pressable>
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
                  <Text style={[styles.sideText, side === option && styles.sideTextActive]}>{option === "buy" ? t.buy : t.sell}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.amountHeader}>
              <Text style={styles.inputLabel}>{t.amount}</Text>
              <Pressable accessibilityLabel="ticket-max-amount" testID="ticket-max-amount" onPress={() => setAmount(String(Math.floor(balance)))}>
                <Text style={styles.maxText}>{t.max}</Text>
              </Pressable>
            </View>
            <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={styles.amountInput} />
            <View style={styles.presetRow}>
              {amountPresets.map((preset) => (
                <Pressable
                  accessibilityLabel={`ticket-preset-${preset}`}
                  key={preset}
                  onPress={() => setAmount(String(preset))}
                  style={styles.presetButton}
                  testID={`ticket-preset-${preset}`}
                >
                  <Text style={styles.presetText}>{money(preset)}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.estimateGrid}>
              <View style={styles.estimateLineCompact}>
                <Text style={styles.estimateLabel}>{costLabel}</Text>
                <Text style={styles.estimateValue}>{money(Math.min(numericAmount, balance))}</Text>
              </View>
              <View style={styles.estimateLineCompact}>
                <Text style={styles.estimateLabel}>{t.estimatedPayout}</Text>
                <Text style={styles.estimateValue}>{money(estimatedPayout)}</Text>
              </View>
              <View style={styles.estimateLineCompact}>
                <Text style={styles.estimateLabel}>{t.estimatedShares}</Text>
                <Text style={styles.estimateValue}>{estimatedShares.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
              </View>
              <View style={styles.estimateLineCompact}>
                <Text style={styles.estimateLabel}>{t.balance}</Text>
                <Text style={styles.estimateValue}>{money(balance)}</Text>
              </View>
            </View>
            <View style={styles.estimateLine}>
              <Text style={styles.estimateLabel}>{t.averagePrice}</Text>
              <Text style={styles.estimateValue}>{averagePrice.toFixed(2)} USDT</Text>
            </View>
            <View style={styles.estimateLine}>
              <Text style={styles.estimateLabel}>{t.impliedOdds}</Text>
              <Text style={styles.estimateValue}>{impliedOdds.toFixed(1)}x</Text>
            </View>
            <View style={styles.estimateLine}>
              <Text style={styles.estimateLabel}>{t.potentialProfit}</Text>
              <Text style={styles.estimateValue}>{money(potentialProfit)}</Text>
            </View>
            <View accessibilityLabel="ticket-estimated-fee" testID="ticket-estimated-fee" style={styles.estimateLine}>
              <Text style={styles.estimateLabel}>{t.estimatedFee}</Text>
              <Text style={styles.estimateValue}>{money(0)}</Text>
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
              label={swipeLabel || primaryLabel}
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
  ticket: { maxHeight: "92%", borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", overflow: "hidden" },
  ticketContent: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10 },
  ticketTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  ticketHeading: { flex: 1 },
  ticketTitle: { color: "#f8fafc", fontSize: 21, fontWeight: "900" },
  ticketSub: { color: "#94a3b8", fontWeight: "800", marginTop: 4 },
  modePill: { alignSelf: "flex-start", marginTop: 8, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, backgroundColor: "#172033", borderWidth: 1, borderColor: "#2d3a50" },
  modePillText: { color: "#dbeafe", fontSize: 12, fontWeight: "900" },
  depthPill: { alignSelf: "flex-start", maxWidth: "100%", marginTop: 6, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  depthPillText: { color: "#e0f2fe", fontSize: 11, fontWeight: "900" },
  liveBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: "#451a1a", borderWidth: 1, borderColor: "#7f1d1d" },
  liveBadgeText: { color: "#fecaca", fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  liveClock: { marginTop: 6, color: "#fca5a5", fontSize: 13, fontWeight: "900" },
  closeButton: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#1f2937" },
  ticketSideRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  sideButton: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 12, backgroundColor: "#1f2937" },
  sideButtonActive: { backgroundColor: "#1d6dff" },
  sideText: { color: "#94a3b8", fontWeight: "900" },
  sideTextActive: { color: "#ffffff" },
  amountHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, marginBottom: 6 },
  inputLabel: { color: "#94a3b8", fontWeight: "800" },
  maxText: { color: "#93c5fd", fontWeight: "900" },
  amountInput: { height: 48, borderRadius: 12, paddingHorizontal: 14, backgroundColor: "#070c14", borderWidth: 1, borderColor: "#263247", color: "#f8fafc", fontSize: 22, fontWeight: "900" },
  presetRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  presetButton: { flex: 1, minHeight: 36, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#1f2937", borderWidth: 1, borderColor: "#334155" },
  presetText: { color: "#dbeafe", fontWeight: "900" },
  estimateGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  estimateLineCompact: { width: "48%", padding: 9, borderRadius: 10, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  estimateLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: "#263247" },
  estimateLabel: { color: "#94a3b8", fontWeight: "800" },
  estimateValue: { color: "#f8fafc", fontWeight: "900" },
  slippageSection: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8 },
  slippageControls: { flexDirection: "row", gap: 6 },
  slippageButton: { minWidth: 54, minHeight: 32, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#1f2937", borderWidth: 1, borderColor: "#334155" },
  slippageButtonActive: { backgroundColor: "#1d6dff", borderColor: "#60a5fa" },
  slippageText: { color: "#cbd5e1", fontSize: 12, fontWeight: "900" },
  slippageTextActive: { color: "#ffffff" },
  errorCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, backgroundColor: "#1f1a0b", borderWidth: 1, borderColor: "#854d0e", marginTop: 12 },
  errorTextBlock: { flex: 1, gap: 3 },
  errorText: { color: "#fde68a", fontWeight: "800" },
  errorDetailText: { color: "#fcd34d", fontSize: 12, fontWeight: "700" },
  ticketFooter: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 28, backgroundColor: "#101827", borderTopWidth: 1, borderTopColor: "#263247" },
  swipeSubmit: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, borderRadius: 16, backgroundColor: "#1d6dff" },
  swipeSubmitArmed: { backgroundColor: "#16a34a" },
  swipeSubmitDisabled: { opacity: 0.55 },
  swipeIcon: { width: 42, height: 42, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.18)" },
  swipeTextBlock: { flex: 1 },
  swipeLabel: { color: "#ffffff", fontSize: 17, fontWeight: "900" },
  swipeHelper: { color: "#dbeafe", fontSize: 12, fontWeight: "800", marginTop: 2 },
});
