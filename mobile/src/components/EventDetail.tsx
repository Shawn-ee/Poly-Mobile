import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Event, Locale, Market, Outcome } from "../mocks/worldCup";
import { label } from "../presentation/formatters";

type EventDetailCopy = {
  worldCup: string;
  markets: string;
};

export function EventDetail({
  event,
  locale,
  t,
  openTicket,
  goBack,
}: {
  event: Event;
  locale: Locale;
  t: EventDetailCopy;
  openTicket: (market: Market, outcome: Outcome, event?: Event) => void;
  goBack: () => void;
}) {
  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollPad}>
      <Pressable style={styles.backButton} onPress={goBack}>
        <Ionicons name="chevron-back" size={18} color="#f8fafc" />
        <Text style={styles.backText}>{t.worldCup}</Text>
      </Pressable>
      <View style={styles.detailHero}>
        <Text style={styles.detailMeta}>{event.startsAt} · {label(locale, { label: event.tag, zhLabel: event.zhTag })}</Text>
        <Text style={styles.detailTitle}>{label(locale, event)}</Text>
      </View>
      <Text style={styles.sectionTitle}>{t.markets}</Text>
      {event.markets.map((market) => (
        <View key={market.id} style={styles.marketBlock}>
          <Text style={styles.marketTitle}>{label(locale, market)}</Text>
          {market.outcomes.map((outcome) => (
            <View key={outcome.id} style={styles.detailOutcome}>
              <Text style={styles.teamName}>{label(locale, outcome)}</Text>
              <Pressable style={[styles.probButton, { backgroundColor: outcome.color }]} onPress={() => openTicket(market, outcome, event)}>
                <Text style={styles.probButtonText}>{outcome.probability}%</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollPad: { paddingHorizontal: 16, paddingBottom: 110 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingVertical: 8, paddingRight: 12 },
  backText: { color: "#f8fafc", fontWeight: "900" },
  detailHero: { padding: 18, borderRadius: 16, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginBottom: 4 },
  detailMeta: { color: "#94a3b8", fontWeight: "800", marginBottom: 8 },
  detailTitle: { color: "#f8fafc", fontSize: 26, fontWeight: "900" },
  sectionTitle: { color: "#f8fafc", fontSize: 24, fontWeight: "900", marginTop: 24, marginBottom: 12 },
  marketBlock: { padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginBottom: 12 },
  marketTitle: { color: "#f8fafc", fontSize: 19, fontWeight: "900", marginBottom: 8 },
  detailOutcome: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  teamName: { flex: 1, color: "#f8fafc", fontSize: 18, fontWeight: "800" },
  probButton: { minWidth: 86, alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 },
  probButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
});
