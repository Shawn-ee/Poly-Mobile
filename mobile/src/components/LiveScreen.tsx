import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { Event, Locale, Market, Outcome } from "../mocks/worldCup";
import { MarketList } from "./MarketLists";

type LiveScreenCopy = {
  liveNow: string;
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
  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollPad}>
      <View style={styles.liveHeader}>
        <Text style={styles.sectionTitle}>{t.liveNow}</Text>
        <Text style={styles.liveCount}>{events.length}</Text>
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
});
