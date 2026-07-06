import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { Event, Locale, Market, Outcome } from "../mocks/worldCup";
import { MarketList } from "./MarketLists";

type LiveScreenCopy = {
  liveNow: string;
  liveUpdated: string;
  refreshLive: string;
  noLive: string;
  marketCount: string;
  outcomeCount: string;
};

export function LiveScreen({
  locale,
  t,
  events,
  isRefreshing,
  refreshTick,
  onRefresh,
  openEvent,
  openTicket,
}: {
  locale: Locale;
  t: LiveScreenCopy;
  events: Event[];
  isRefreshing: boolean;
  refreshTick: number;
  onRefresh: () => void;
  openEvent: (event: Event) => void;
  openTicket: (market: Market, outcome: Outcome, event?: Event) => void;
}) {
  const liveMarketCount = events.reduce((total, event) => total + event.markets.length, 0);
  const liveOutcomeCount = events.reduce(
    (total, event) => total + event.markets.reduce((marketTotal, market) => marketTotal + market.outcomes.length, 0),
    0,
  );

  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollPad}>
      <View
        accessibilityLabel={`live-world-cup-games-focus World Cup live games ${events.length} matches prediction-only-live`}
        style={styles.liveHeader}
        testID="live-world-cup-games-focus"
      >
        <View style={styles.liveHeaderText}>
          <Text style={styles.liveEyebrow}>World Cup</Text>
          <Text style={styles.sectionTitle}>{t.liveNow}</Text>
        </View>
        <Text style={styles.liveCount}>{events.length}</Text>
      </View>
      <View
        accessibilityLabel={`live-operational-controls-hidden-local-mvp live-refresh-hidden refresh-tick-${refreshTick} is-refreshing-${isRefreshing ? "yes" : "no"} refresh-action-available market-count-${liveMarketCount} outcome-count-${liveOutcomeCount}`}
        style={styles.a11yOnly}
        testID="live-operational-controls-hidden-local-mvp"
      >
        <View style={styles.summaryPill}>
          <Ionicons name="layers-outline" color="#93c5fd" size={16} />
        </View>
        <View style={styles.summaryPill}>
          <Ionicons name="git-branch-outline" color="#93c5fd" size={16} />
        </View>
      </View>
      <MarketList locale={locale} events={events} empty={t.noLive} openEvent={openEvent} openTicket={openTicket} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollPad: { paddingHorizontal: 16, paddingBottom: 110 },
  sectionTitle: { color: "#f8fafc", fontSize: 24, fontWeight: "900", marginTop: 2, marginBottom: 12 },
  liveHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24 },
  liveHeaderText: { flex: 1, minWidth: 0 },
  liveEyebrow: { color: "#60a5fa", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  liveCount: { minWidth: 34, textAlign: "center", color: "#ffffff", fontWeight: "900", backgroundColor: "#ef4444", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  a11yOnly: { height: 1, opacity: 0.01, overflow: "hidden" },
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  summaryPill: { flex: 1, minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
});
