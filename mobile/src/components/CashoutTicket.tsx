import { Ionicons } from "@expo/vector-icons";
import { useMemo, useRef, useState } from "react";
import { Modal, PanResponder, Pressable, StyleSheet, Text, View, Vibration } from "react-native";
import { portfolioPositionValue } from "../domain/portfolioPositionMetrics";
import { money } from "../presentation/formatters";
import { canCashOutPosition } from "../services/positionCloseService";
import type { Position } from "./Portfolio";

const SWIPE_THRESHOLD = 124;
const HANDLE_TRAVEL = 92;

type CashoutTicketProps = {
  position: Position | null;
  close: () => void;
  cashOut: (position: Position) => void | Promise<void>;
  error?: string | null;
};

function currentPrice(position: Position) {
  return typeof position.currentPrice === "number" ? position.currentPrice : position.probability / 100;
}

function SwipeToCashout({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: () => void | Promise<void>;
}) {
  const [isArmed, setIsArmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const armedRef = useRef(false);

  const submit = async () => {
    if (disabled || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
      setIsArmed(false);
      setProgress(0);
      armedRef.current = false;
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
          armedRef.current = false;
          setProgress(0);
        },
        onPanResponderMove: (_, gesture) => {
          const nextProgress = gesture.dy < 0 ? Math.min(Math.abs(gesture.dy) / SWIPE_THRESHOLD, 1) : 0;
          const nextArmed = nextProgress >= 0.72;
          setProgress(nextProgress);
          setIsArmed(nextArmed);
          if (nextArmed && !armedRef.current) Vibration.vibrate(18);
          armedRef.current = nextArmed;
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy < -SWIPE_THRESHOLD) {
            void submit();
            return;
          }
          setIsArmed(false);
          armedRef.current = false;
          setProgress(0);
        },
        onPanResponderTerminate: () => {
          setIsArmed(false);
          armedRef.current = false;
          setProgress(0);
        },
      }),
    [disabled, isSubmitting, onSubmit],
  );

  const progressBucket = disabled ? "disabled" : isSubmitting ? "submitting" : isArmed ? "armed" : progress > 0 ? "dragging" : "idle";
  const handleLift = -HANDLE_TRAVEL * progress;

  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || isSubmitting }}
      accessibilityLabel={`swipe-to-cashout cashout-swipe-submit cashout-red-swipe-area-fixed-bottom swipe-submit-gesture-required swipe-submit-state-${progressBucket} swipe-submit-progress-${Math.round(progress * 100)}`}
      style={[styles.swipe, disabled && styles.swipeDisabled]}
      testID="swipe-to-cashout"
      {...panResponder.panHandlers}
    >
      <View style={[styles.threshold, isArmed && styles.thresholdArmed]} testID="cashout-swipe-threshold" />
      <View
        accessibilityLabel={`cashout-swipe-handle swipe-submit-handle-translate-y-${Math.round(handleLift)}`}
        style={[styles.swipeIcon, isArmed && styles.swipeIconArmed, { transform: [{ translateY: handleLift }] }]}
        testID="cashout-swipe-handle"
      >
        <Ionicons name={isSubmitting ? "hourglass-outline" : "chevron-up"} color="#ffffff" size={22} />
      </View>
      <View style={styles.swipeCopy}>
        <Text style={styles.swipeLabel}>Swipe up to cash out</Text>
        <Text style={styles.swipeHelper}>Cash out your full position at the current price.</Text>
      </View>
    </View>
  );
}

export function CashoutTicket({ position, close, cashOut, error }: CashoutTicketProps) {
  if (!position) return null;

  const proceeds = portfolioPositionValue(position);
  const pricePercent = Math.round(currentPrice(position) * 100);
  const canCashOut = canCashOutPosition(position);

  return (
    <Modal animationType="slide" onRequestClose={close} transparent visible={Boolean(position)}>
      <View style={styles.backdrop}>
        <View
          accessibilityLabel={`cashout-ticket cashout-retail-reference-layout cashout-dark-panel-rounded-above-swipe cashout-keypad-swipe-separated cashout-full-position cashout-current-price-${pricePercent} cashout-estimated-proceeds-${proceeds.toFixed(2)}`}
          style={styles.sheet}
          testID="cashout-ticket"
        >
          <View style={styles.panel}>
            <View style={styles.header}>
              <Pressable accessibilityLabel="cashout-ticket-close" onPress={close} style={styles.closeButton} testID="cashout-ticket-close">
                <Ionicons name="close" color="#dbeafe" size={28} />
              </Pressable>
              <View style={styles.headerCopy}>
                <Text numberOfLines={1} style={styles.title}>{position.title}</Text>
                <Text numberOfLines={1} style={styles.subtitle}>{position.outcome}</Text>
              </View>
              <View style={styles.headerSpacer} />
            </View>

            <View accessibilityLabel="cashout-proceeds-large" style={styles.amountBlock} testID="cashout-proceeds-large">
              <Text style={styles.eyebrow}>Cash out</Text>
              <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.proceedsAmount}>
                {money(proceeds)}
              </Text>
              <Text style={styles.toReceive}>estimated proceeds</Text>
            </View>

            <View style={styles.summary}>
              <View accessibilityLabel="cashout-full-position" style={styles.summaryRow} testID="cashout-full-position">
                <Text style={styles.summaryLabel}>Position</Text>
                <Text style={styles.summaryValue}>Full position</Text>
              </View>
              <View accessibilityLabel="cashout-current-price" style={styles.summaryRow} testID="cashout-current-price">
                <Text style={styles.summaryLabel}>Current price</Text>
                <Text style={styles.summaryValue}>{pricePercent}%</Text>
              </View>
              <View accessibilityLabel="cashout-estimated-proceeds" style={styles.summaryRow} testID="cashout-estimated-proceeds">
                <Text style={styles.summaryLabel}>Estimated proceeds</Text>
                <Text style={styles.summaryValue}>{money(proceeds)}</Text>
              </View>
            </View>

            {!canCashOut && (
              <Text accessibilityLabel="cashout-unavailable" style={styles.error} testID="cashout-unavailable">
                No position is available to cash out.
              </Text>
            )}
            {error ? <Text accessibilityLabel="cashout-error" style={styles.error} testID="cashout-error">{error}</Text> : null}

            <View style={styles.panelFiller} />
          </View>

          <SwipeToCashout disabled={!canCashOut} onSubmit={() => cashOut(position)} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "#07111f" },
  sheet: { flex: 1, backgroundColor: "#b91c1c" },
  panel: { flex: 1, paddingHorizontal: 18, paddingTop: 42, paddingBottom: 20, backgroundColor: "#07111f", borderBottomLeftRadius: 42, borderBottomRightRadius: 42, overflow: "hidden" },
  header: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  headerCopy: { flex: 1, minWidth: 0, alignItems: "center" },
  headerSpacer: { width: 48, height: 48 },
  closeButton: { width: 48, height: 48, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  eyebrow: { color: "#94a3b8", fontSize: 13, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  subtitle: { color: "#22c55e", fontSize: 15, fontWeight: "900", marginTop: 3 },
  amountBlock: { flex: 1, minHeight: 170, alignItems: "center", justifyContent: "center", paddingVertical: 24 },
  proceedsAmount: { color: "#f8fafc", fontSize: 64, fontWeight: "300", letterSpacing: 0, marginTop: 8 },
  toReceive: { color: "#cbd5e1", fontSize: 15, fontWeight: "800", marginTop: 4 },
  summary: { borderTopWidth: 1, borderTopColor: "#1f2937", borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  summaryRow: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottomWidth: 1, borderBottomColor: "#162033" },
  summaryLabel: { color: "#94a3b8", fontSize: 14, fontWeight: "800" },
  summaryValue: { color: "#f8fafc", fontSize: 18, fontWeight: "900", flexShrink: 1, textAlign: "right" },
  error: { marginTop: 16, color: "#fecaca", fontSize: 13, fontWeight: "800", textAlign: "center" },
  panelFiller: { minHeight: 16 },
  swipe: { height: 230, alignItems: "center", justifyContent: "flex-start", overflow: "hidden", backgroundColor: "#b91c1c" },
  swipeDisabled: { opacity: 0.52 },
  threshold: { width: 58, height: 3, marginTop: 18, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.34)" },
  thresholdArmed: { backgroundColor: "#ffffff" },
  swipeIcon: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", marginTop: 18, backgroundColor: "rgba(239,68,68,0.74)" },
  swipeIconArmed: { backgroundColor: "#22c55e" },
  swipeCopy: { alignItems: "center", paddingHorizontal: 22, marginTop: 28 },
  swipeLabel: { color: "#ffffff", fontSize: 21, fontWeight: "900" },
  swipeHelper: { color: "#fecaca", fontSize: 12, fontWeight: "800", marginTop: 8, textAlign: "center" },
});
