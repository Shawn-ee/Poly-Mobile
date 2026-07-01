import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Locale, Market, Outcome } from "../mocks/worldCup";
import { worldCupFutures } from "../mocks/worldCup";
import { label } from "../presentation/formatters";

export function FeaturedFuture({
  locale,
  futures,
  openTicket,
}: {
  locale: Locale;
  futures: Market[];
  openTicket: (market: Market, outcome: Outcome) => void;
}) {
  const market = futures[0] ?? worldCupFutures[0];
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureHeader}>
        <Text style={styles.featureTitle}>{label(locale, market).toUpperCase()}</Text>
        <Ionicons name="trophy" color="#c7d2fe" size={36} />
      </View>
      <View style={styles.futureOutcomes}>
        {market.outcomes.map((outcome) => (
          <Pressable
            accessibilityLabel={`featured-future-${outcome.id}`}
            key={outcome.id}
            onPress={() => openTicket(market, outcome)}
            style={styles.futureOutcome}
            testID={`featured-future-${outcome.id}`}
          >
            <Text style={styles.futureName}>{label(locale, outcome)}</Text>
            <Text style={styles.futureProb}>{outcome.probability}%</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  featureCard: { marginTop: 14, padding: 18, borderRadius: 16, backgroundColor: "#15365f", borderWidth: 1, borderColor: "#2a5f9f" },
  featureHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  featureTitle: { color: "#f8fafc", fontSize: 28, fontWeight: "900", letterSpacing: 0 },
  futureOutcomes: { flexDirection: "row", gap: 10, marginTop: 26 },
  futureOutcome: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.1)" },
  futureName: { color: "#f8fafc", fontWeight: "800" },
  futureProb: { color: "#c7d2fe", fontSize: 20, fontWeight: "900", marginTop: 4 },
});
