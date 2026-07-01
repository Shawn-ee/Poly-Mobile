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
};

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
        positions.map((position) => (
          <View key={position.id} style={styles.positionCard}>
            <Text style={styles.positionTitle}>{position.title}</Text>
            <Text style={styles.positionMeta}>
              {position.mode.toUpperCase()} · {position.side === "buy" ? t.buy : t.sell} · {position.outcome} · {position.probability}%
            </Text>
            <Text style={styles.positionValue}>{money(position.amount)}</Text>
          </View>
        ))
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
  positionCard: { padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginTop: 12 },
  positionTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  positionMeta: { color: "#94a3b8", marginTop: 5, fontWeight: "800" },
  positionValue: { color: "#22c55e", fontSize: 22, fontWeight: "900", marginTop: 8 },
});
