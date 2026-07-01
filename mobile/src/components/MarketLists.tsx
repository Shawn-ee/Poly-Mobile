import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Event, Locale, Market, Outcome } from "../mocks/worldCup";
import { label } from "../presentation/formatters";

export function MarketList({
  locale,
  events,
  empty,
  openEvent,
  openTicket,
}: {
  locale: Locale;
  events: Event[];
  empty: string;
  openEvent: (event: Event) => void;
  openTicket: (market: Market, outcome: Outcome, event?: Event) => void;
}) {
  if (events.length === 0) return <Text style={styles.empty}>{empty}</Text>;
  return (
    <View style={styles.eventList}>
      {events.map((event) => {
        const winner = event.markets[0];
        return (
          <Pressable
            accessibilityLabel={`event-card-${event.id}`}
            key={event.id}
            style={styles.eventCard}
            testID={`event-card-${event.id}`}
            onPress={() => openEvent(event)}
          >
            <View style={styles.eventMetaRow}>
              <Text style={styles.timeText}>{event.startsAt}</Text>
              <Text style={[styles.eventTag, event.status === "live" && styles.liveTag]}>{label(locale, { label: event.tag, zhLabel: event.zhTag })}</Text>
            </View>
            <Text style={styles.eventTitle}>{label(locale, event)}</Text>
            {winner.outcomes.map((outcome) => (
              <View key={outcome.id} style={styles.teamRow}>
                <Text style={styles.teamName}>{outcome.label === "Draw" ? "🤝" : event.teams.find((team) => team.name === outcome.label)?.flag ?? "•"} {label(locale, outcome)}</Text>
                <Text style={styles.oddsText}>{(100 / outcome.probability).toFixed(1)}x</Text>
                <Pressable
                  accessibilityLabel={`event-outcome-${event.id}-${winner.id}-${outcome.id}`}
                  style={[styles.probButton, { backgroundColor: outcome.color }]}
                  testID={`event-outcome-${event.id}-${winner.id}-${outcome.id}`}
                  onPress={() => openTicket(winner, outcome, event)}
                >
                  <Text style={styles.probButtonText}>{outcome.probability}%</Text>
                </Pressable>
              </View>
            ))}
          </Pressable>
        );
      })}
    </View>
  );
}

export function FutureList({
  locale,
  futures,
  openTicket,
}: {
  locale: Locale;
  futures: Market[];
  openTicket: (market: Market, outcome: Outcome) => void;
}) {
  return (
    <View style={styles.eventList}>
      {futures.map((market) => (
        <View key={market.id} style={styles.eventCard}>
          <Text style={styles.eventTitle}>{label(locale, market)}</Text>
          {market.outcomes.map((outcome) => (
            <View key={outcome.id} style={styles.teamRow}>
              <Text style={styles.teamName}>{label(locale, outcome)}</Text>
              <Text style={styles.oddsText}>{(100 / outcome.probability).toFixed(1)}x</Text>
              <Pressable
                accessibilityLabel={`future-outcome-${market.id}-${outcome.id}`}
                style={[styles.probButton, { backgroundColor: outcome.color }]}
                testID={`future-outcome-${market.id}-${outcome.id}`}
                onPress={() => openTicket(market, outcome)}
              >
                <Text style={styles.probButtonText}>{outcome.probability}%</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  eventList: { gap: 12 },
  eventCard: { padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  eventMetaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  timeText: { color: "#94a3b8", fontWeight: "800" },
  eventTag: { color: "#94a3b8", fontWeight: "800" },
  liveTag: { color: "#ff4d4f" },
  eventTitle: { color: "#f8fafc", fontSize: 20, fontWeight: "900", marginBottom: 8 },
  teamRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 9 },
  teamName: { flex: 1, color: "#f8fafc", fontSize: 18, fontWeight: "800" },
  oddsText: { color: "#a7b1c2", width: 48, textAlign: "right", fontSize: 17, fontWeight: "800" },
  probButton: { minWidth: 86, alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 },
  probButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
  empty: { color: "#94a3b8", textAlign: "center", marginTop: 30, fontWeight: "800" },
});
