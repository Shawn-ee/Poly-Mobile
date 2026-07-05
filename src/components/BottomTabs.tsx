import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type PrimaryTab = "home" | "live" | "portfolio" | "search";
export type MainTab = PrimaryTab | "account";

type BottomTabCopy = {
  home: string;
  live: string;
  portfolio: string;
  search: string;
  account: string;
};

export function BottomTabs({
  tab,
  setTab,
  t,
  portfolioValue,
}: {
  tab: MainTab;
  setTab: (tab: MainTab) => void;
  t: BottomTabCopy;
  portfolioValue?: number;
}) {
  const portfolioValueLabel =
    typeof portfolioValue === "number" && Number.isFinite(portfolioValue)
      ? portfolioValue >= 1000
        ? `$${Math.round(portfolioValue / 1000)}K`
        : `$${Math.round(portfolioValue)}`
      : t.portfolio;
  const items: Array<[PrimaryTab, keyof typeof Ionicons.glyphMap, string, string?]> = [
    ["home", "compass", t.home],
    ["live", "radio", t.live],
    ["portfolio", "person-circle-outline", portfolioValueLabel, t.portfolio],
    ["search", "search", t.search],
  ];

  return (
    <View style={styles.tabs}>
      {items.map(([key, icon, text, subText]) => (
        <Pressable
          key={key}
          accessibilityLabel={key === "portfolio" ? `holiwyn-${key}-tab ${t.portfolio} portfolio-tab-value-${portfolioValueLabel} portfolio-tab-label-visible` : `holiwyn-${key}-tab`}
          testID={`holiwyn-${key}-tab`}
          style={styles.tabButton}
          onPress={() => setTab(key)}
        >
          <Ionicons name={icon} size={26} color={tab === key ? "#1d6dff" : "#64748b"} />
          <View style={styles.labelStack}>
            <Text adjustsFontSizeToFit minimumFontScale={0.78} numberOfLines={1} style={[styles.tabText, tab === key && styles.tabTextActive]}>{text}</Text>
            {subText && <Text adjustsFontSizeToFit minimumFontScale={0.78} numberOfLines={1} style={[styles.tabSubText, tab === key && styles.tabTextActive]}>{subText}</Text>}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { height: 74, flexDirection: "row", backgroundColor: "#080d16", borderTopWidth: 1, borderTopColor: "#1f2937" },
  tabButton: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  labelStack: { alignItems: "center", justifyContent: "center", minHeight: 28 },
  tabText: { color: "#64748b", fontWeight: "800", fontSize: 12, maxWidth: 76 },
  tabSubText: { color: "#64748b", fontWeight: "800", fontSize: 11, maxWidth: 76, marginTop: -1 },
  tabTextActive: { color: "#1d6dff" },
});
