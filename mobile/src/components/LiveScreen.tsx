import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Event, Locale, Market, Outcome } from "../mocks/worldCup";
import { MarketList } from "./MarketLists";

type LiveScreenCopy = {
  liveNow: string;
  liveUpdated: string;
  refreshLive: string;
  noLive: string;
};

export function LiveScreen({
  locale,
  t,
  events,
  openEvent,
  openTicket,
}: {
  locale: Locale;
  t: LiveScreenCopy;
  events: Event[];
  openEvent: (event: Event) => void;
  openTicket: (market: Market, outcome: Outcome, event?: Event) => void;
}) {
  const [refreshCount, setRefreshCount] = useState(0);

  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollPad}>
      <View style={styles.liveHeader}>
        <Text style={styles.sectionTitle}>{t.liveNow}</Text>
        <Text style={styles.liveCount}>{events.length}</Text>
      </View>
      <View style={styles.liveStatusRow}>
        <Text style={styles.liveStatusText}>{refreshCount === 0 ? t.liveUpdated : `${t.liveUpdated} · refreshed`}</Text>
        <Pressable accessibilityLabel="refresh-live-markets" testID="refresh-live-markets" style={styles.refreshButton} onPress={() => setRefreshCount((count) => count + 1)}>
          <Ionicons name="refresh" color="#dbeafe" size={16} />
          <Text style={styles.refreshText}>{t.refreshLive}</Text>
        </Pressable>
      </View>
      <MarketList locale={locale} events={events} empty={t.noLive} openEvent={openEvent} openTicket={openTicket} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollPad: { paddingHorizontal: 16, paddingBottom: 110 },
  sectionTitle: { color: "#f8fafc", fontSize: 24, fontWeight: "900", marginTop: 24, marginBottom: 12 },
  liveHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  liveCount: { minWidth: 34, textAlign: "center", color: "#ffffff", fontWeight: "900", backgroundColor: "#ef4444", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  liveStatusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  liveStatusText: { color: "#8ea0b8", fontWeight: "800" },
  refreshButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "#1f2937" },
  refreshText: { color: "#dbeafe", fontWeight: "900" },
});
