import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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
};

export function TradeTicket({
  locale,
  t,
  ticket,
  balance,
  orderError,
  defaultAmount,
  defaultSide,
  onPreferencesChange,
  close,
  placeOrder,
}: {
  locale: Locale;
  t: TradeTicketCopy;
  ticket: Ticket | null;
  balance: number;
  orderError: string | null;
  defaultAmount: string;
  defaultSide: "buy" | "sell";
  onPreferencesChange: (next: { amount: string; side: "buy" | "sell" }) => void;
  close: () => void;
  placeOrder: (amount: number, side: "buy" | "sell") => void | Promise<void>;
}) {
  const [amount, setAmountState] = useState(defaultAmount);
  const [side, setSideState] = useState<"buy" | "sell">(defaultSide);

  useEffect(() => {
    if (!ticket) return;
    setAmountState(defaultAmount);
    setSideState(defaultSide);
  }, [defaultAmount, defaultSide, ticket]);

  if (!ticket) return null;
  const setAmount = (nextAmount: string) => {
    setAmountState(nextAmount);
    onPreferencesChange({ amount: nextAmount, side });
  };
  const setSide = (nextSide: "buy" | "sell") => {
    setSideState(nextSide);
    onPreferencesChange({ amount, side: nextSide });
  };
  const numericAmount = Number(amount) || 0;
  const averagePrice = ticket.outcome.probability / 100;
  const impliedOdds = ticket.outcome.probability > 0 ? 100 / ticket.outcome.probability : 0;
  const estimatedShares = averagePrice > 0 ? numericAmount / averagePrice : 0;
  const estimatedPayout = ticket.outcome.probability > 0 ? numericAmount * (100 / ticket.outcome.probability) : 0;
  const potentialProfit = Math.max(estimatedPayout - Math.min(numericAmount, balance), 0);
  const primaryLabel = side === "buy" ? t.placeBuyOrder : t.placeSellOrder;
  const costLabel = side === "buy" ? t.estimatedCost : t.estimatedProceeds;
  const amountPresets = [100, 500, 1000];
  const isLiveTicket = ticket.event?.status === "live";
  const liveClock = isLiveTicket
    ? ticket.event?.startsAt.replace(/[^\x00-\x7F]+/g, "-").replace(/\s+-\s+/g, " - ")
    : null;

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.modalShade}>
        <View accessibilityLabel="trade-ticket" testID="trade-ticket" style={styles.ticket}>
          <View style={styles.ticketTop}>
            <View>
              <Text style={styles.ticketTitle}>{label(locale, ticket.outcome)}</Text>
              <Text style={styles.ticketSub}>{label(locale, ticket.event ?? ticket.market)}</Text>
              {isLiveTicket && (
                <View accessibilityLabel="ticket-live-badge" testID="ticket-live-badge" style={styles.liveBadge}>
                  <Ionicons name="radio-outline" color="#fecaca" size={14} />
                  <Text style={styles.liveBadgeText}>{t.liveNow}</Text>
                </View>
              )}
              {liveClock && (
                <Text accessibilityLabel="ticket-live-clock" testID="ticket-live-clock" style={styles.liveClock}>
                  {liveClock}
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
          <View style={styles.estimateLine}>
            <Text style={styles.estimateLabel}>{t.balance}</Text>
            <Text style={styles.estimateValue}>{money(balance)}</Text>
          </View>
          <View style={styles.estimateLine}>
            <Text style={styles.estimateLabel}>{costLabel}</Text>
            <Text style={styles.estimateValue}>{money(Math.min(numericAmount, balance))}</Text>
          </View>
          <View style={styles.estimateLine}>
            <Text style={styles.estimateLabel}>{t.estimatedShares}</Text>
            <Text style={styles.estimateValue}>{estimatedShares.toLocaleString(undefined, { maximumFractionDigits: 2 })} shares</Text>
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
            <Text style={styles.estimateLabel}>{t.estimatedPayout}</Text>
            <Text style={styles.estimateValue}>{money(estimatedPayout)}</Text>
          </View>
          <View style={styles.estimateLine}>
            <Text style={styles.estimateLabel}>{t.potentialProfit}</Text>
            <Text style={styles.estimateValue}>{money(potentialProfit)}</Text>
          </View>
          {orderError && (
            <View accessibilityLabel="ticket-order-error" testID="ticket-order-error" style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" color="#fbbf24" size={18} />
              <Text style={styles.errorText}>{orderError}</Text>
            </View>
          )}
          <Pressable accessibilityLabel="place-mock-order" testID="place-mock-order" style={styles.primaryButton} onPress={() => placeOrder(numericAmount, side)}>
            <Text style={styles.primaryText}>{primaryLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalShade: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  ticket: { padding: 18, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  ticketTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  ticketTitle: { color: "#f8fafc", fontSize: 24, fontWeight: "900" },
  ticketSub: { color: "#94a3b8", fontWeight: "800", marginTop: 4 },
  liveBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: "#451a1a", borderWidth: 1, borderColor: "#7f1d1d" },
  liveBadgeText: { color: "#fecaca", fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  liveClock: { marginTop: 6, color: "#fca5a5", fontSize: 13, fontWeight: "900" },
  closeButton: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#1f2937" },
  ticketSideRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  sideButton: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, backgroundColor: "#1f2937" },
  sideButtonActive: { backgroundColor: "#1d6dff" },
  sideText: { color: "#94a3b8", fontWeight: "900" },
  sideTextActive: { color: "#ffffff" },
  amountHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18, marginBottom: 8 },
  inputLabel: { color: "#94a3b8", fontWeight: "800" },
  maxText: { color: "#93c5fd", fontWeight: "900" },
  amountInput: { height: 54, borderRadius: 12, paddingHorizontal: 14, backgroundColor: "#070c14", borderWidth: 1, borderColor: "#263247", color: "#f8fafc", fontSize: 22, fontWeight: "900" },
  presetRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  presetButton: { flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#1f2937", borderWidth: 1, borderColor: "#334155" },
  presetText: { color: "#dbeafe", fontWeight: "900" },
  estimateLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#263247" },
  estimateLabel: { color: "#94a3b8", fontWeight: "800" },
  estimateValue: { color: "#f8fafc", fontWeight: "900" },
  errorCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, backgroundColor: "#1f1a0b", borderWidth: 1, borderColor: "#854d0e", marginTop: 12 },
  errorText: { flex: 1, color: "#fde68a", fontWeight: "800" },
  primaryButton: { height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#1d6dff", marginTop: 16 },
  primaryText: { color: "#ffffff", fontSize: 17, fontWeight: "900" },
});
