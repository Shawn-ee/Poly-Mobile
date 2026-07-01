import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { Locale } from "../mocks/worldCup";

export function SportNav({ locale }: { locale: Locale }) {
  const items = [
    ["🧭", locale === "zh" ? "首页" : "Home"],
    ["🏆", locale === "zh" ? "世界杯" : "World Cup"],
    ["⚾", "MLB"],
    ["🎾", locale === "zh" ? "网球" : "Tennis"],
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sportRow}>
      {items.map(([icon, text], index) => (
        <View key={text} style={[styles.sportItem, index === 1 && styles.sportItemActive]}>
          <Text style={styles.sportIcon}>{icon}</Text>
          <Text style={[styles.sportLabel, index === 1 && styles.sportLabelActive]}>{text}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sportRow: { gap: 16, paddingVertical: 8 },
  sportItem: { alignItems: "center", gap: 6, opacity: 0.66 },
  sportItemActive: { opacity: 1 },
  sportIcon: { fontSize: 34 },
  sportLabel: { color: "#8ea0b8", fontSize: 14, fontWeight: "800" },
  sportLabelActive: { color: "#f8fafc" },
});
