import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { Locale } from "../mocks/worldCup";
import { money } from "../presentation/formatters";
import type { OrderMode } from "../services/orderService";

export type Position = {
  id: string;
  mode: OrderMode;
  title: string;
  outcome: string;
  side: "buy" | "sell";
  amount: number;
  probability: number;
};

type PortfolioCopy = {
  balance: string;
  noPositions: string;
  noPositionsBody: string;
  buy: string;
  sell: string;
  invested: string;
  entry: string;
  currentValue: string;
  estimatedPnl: string;
};

const currentProbability = (position: Position) => {
  const movement = position.side === "buy" ? 3 : -3;
  return Math.max(1, Math.min(99, position.probability + movement));
};

const positionValue = (position: Position) => {
  const entry = Math.max(1, position.probability);
  return position.amount * (currentProbability(position) / entry);
};

const estimatedPnl = (position: Position) => {
  const value = positionValue(position);
  return position.side === "buy" ? value - position.amount : position.amount - value;
};

const investedTotal = (positions: Position[]) => positions.reduce((total, position) => total + position.amount, 0);

const currentValueTotal = (positions: Position[]) =>
  positions.reduce((total, position) => total + positionValue(position), 0);

const pnlTotal = (positions: Position[]) =>
  positions.reduce((total, position) => total + estimatedPnl(position), 0);

export function Portfolio({
  t,
  balance,
  positions,
}: {
  locale: Locale;
  t: PortfolioCopy;
  balance: number;
  positions: Position[];
}) {
  return (
    <ScrollView accessibilityLabel="portfolio-screen" testID="portfolio-screen" style={styles.content} contentContainerStyle={styles.scrollPad}>
      <View accessibilityLabel="fake-balance-card" testID="fake-balance-card" style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{t.balance}</Text>
        <Text style={styles.balanceValue}>{money(balance)}</Text>
      </View>
      {positions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="wallet-outline" size={34} color="#64748b" />
          <Text style={styles.emptyTitle}>{t.noPositions}</Text>
          <Text style={styles.emptyText}>{t.noPositionsBody}</Text>
        </View>
      ) : (
        <>
          <View style={styles.summaryGrid}>
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
            <View key={position.id} style={styles.positionCard}>
              <Text style={styles.positionTitle}>{position.title}</Text>
              <Text style={styles.positionMeta}>
                {position.mode.toUpperCase()} - {position.side === "buy" ? t.buy : t.sell} - {position.outcome} - {position.probability}%
              </Text>
              <Text style={styles.positionValue}>{money(position.amount)}</Text>
              <View style={styles.positionDetailGrid}>
                <View style={styles.positionDetailItem}>
                  <Text style={styles.positionDetailLabel}>{t.entry}</Text>
                  <Text style={styles.positionDetailValue}>{position.probability}%</Text>
                </View>
                <View style={styles.positionDetailItem}>
                  <Text style={styles.positionDetailLabel}>{t.currentValue}</Text>
                  <Text style={styles.positionDetailValue}>{money(positionValue(position))}</Text>
                </View>
                <View style={styles.positionDetailItem}>
                  <Text style={styles.positionDetailLabel}>{t.estimatedPnl}</Text>
                  <Text style={[styles.positionDetailValue, estimatedPnl(position) >= 0 ? styles.pnlPositive : styles.pnlNegative]}>
                    {estimatedPnl(position) >= 0 ? "+" : ""}
                    {money(estimatedPnl(position))}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollPad: { paddingHorizontal: 16, paddingBottom: 110 },
  balanceCard: { padding: 18, borderRadius: 16, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginTop: 10 },
  balanceLabel: { color: "#94a3b8", fontWeight: "800" },
  balanceValue: { color: "#f8fafc", fontSize: 34, fontWeight: "900", marginTop: 6 },
  emptyCard: { alignItems: "center", padding: 28, borderRadius: 16, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginTop: 16 },
  emptyTitle: { color: "#f8fafc", fontSize: 20, fontWeight: "900", marginTop: 10 },
  emptyText: { color: "#94a3b8", textAlign: "center", marginTop: 6, fontWeight: "700" },
  summaryGrid: { flexDirection: "row", gap: 8, marginTop: 12 },
  summaryItem: { flex: 1, minHeight: 92, padding: 10, borderRadius: 10, backgroundColor: "#111b2d", borderWidth: 1, borderColor: "#2b3b55" },
  summaryLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "800" },
  summaryValue: { color: "#f8fafc", fontSize: 13, fontWeight: "900", marginTop: 8 },
  positionCard: { padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginTop: 12 },
  positionTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  positionMeta: { color: "#94a3b8", marginTop: 5, fontWeight: "800" },
  positionValue: { color: "#22c55e", fontSize: 22, fontWeight: "900", marginTop: 8 },
  positionDetailGrid: { flexDirection: "row", gap: 8, marginTop: 12 },
  positionDetailItem: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  positionDetailLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "800" },
  positionDetailValue: { color: "#f8fafc", fontSize: 13, fontWeight: "900", marginTop: 5 },
  pnlPositive: { color: "#22c55e" },
  pnlNegative: { color: "#ef4444" },
});
