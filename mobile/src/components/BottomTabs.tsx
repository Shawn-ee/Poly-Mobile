import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type MainTab = "home" | "live" | "portfolio" | "search";

type BottomTabCopy = {
  home: string;
  live: string;
  portfolio: string;
  search: string;
};

export function BottomTabs({
  tab,
  setTab,
  t,
}: {
  tab: MainTab;
  setTab: (tab: MainTab) => void;
  t: BottomTabCopy;
}) {
  const items: Array<[MainTab, keyof typeof Ionicons.glyphMap, string]> = [
    ["home", "compass", t.home],
    ["live", "radio", t.live],
    ["portfolio", "person-circle-outline", t.portfolio],
    ["search", "search", t.search],
  ];

  return (
    <View style={styles.tabs}>
      {items.map(([key, icon, text]) => (
        <Pressable
          key={key}
          accessibilityLabel={`holiwyn-${key}-tab`}
          testID={`holiwyn-${key}-tab`}
          style={styles.tabButton}
          onPress={() => setTab(key)}
        >
          <Ionicons name={icon} size={26} color={tab === key ? "#1d6dff" : "#64748b"} />
          <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{text}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { height: 74, flexDirection: "row", backgroundColor: "#080d16", borderTopWidth: 1, borderTopColor: "#1f2937" },
  tabButton: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  tabText: { color: "#64748b", fontWeight: "800", fontSize: 12 },
  tabTextActive: { color: "#1d6dff" },
});
