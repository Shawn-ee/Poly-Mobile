import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Event, Locale, Market, Outcome } from "../mocks/worldCup";
import { label, money } from "../presentation/formatters";

type MarketStatsCopy = {
  volume: string;
  liquidity: string;
};

const marketCardStats = (event: Event) => {
  const outcomeCount = event.markets.reduce((total, market) => total + market.outcomes.length, 0);
  return {
    volume: 8200 + outcomeCount * 1150,
    liquidity: 4200 + event.markets.length * 950,
  };
};

const futureCardStats = (market: Market) => ({
  volume: 12200 + market.outcomes.length * 2400,
  liquidity: 7600 + market.outcomes.length * 1350,
});

const futureOutcomeFlags: Record<string, string> = {
  argentina: "🇦🇷",
  england: "🏴",
  france: "🇫🇷",
  spain: "🇪🇸",
};

const futureOutcomeVolume = (market: Market, outcome: Outcome) => {
  const rank = market.outcomes.findIndex((candidate) => candidate.id === outcome.id);
  return Math.round(72000000 + outcome.probability * 520000 + Math.max(0, 4 - rank) * 3600000);
};

const cents = (probability: number) => `${probability.toFixed(1)}¢`;

export function MarketList({
  locale,
  events,
  empty,
  openEvent,
  openTicket,
  savedEventIds,
  toggleSavedEvent,
  statsCopy,
}: {
  locale: Locale;
  events: Event[];
  empty: string;
  openEvent: (event: Event) => void;
  openTicket: (market: Market, outcome: Outcome, event?: Event) => void;
  savedEventIds?: Set<string>;
  toggleSavedEvent?: (event: Event) => void;
  statsCopy?: MarketStatsCopy;
}) {
  if (events.length === 0) return <Text style={styles.empty}>{empty}</Text>;
  return (
    <View style={styles.eventList}>
      {events.map((event) => {
        const winner = event.markets[0];
        const isSaved = savedEventIds?.has(event.id) ?? false;
        const stats = marketCardStats(event);
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
              <View style={styles.eventMetaRight}>
                <Text style={[styles.eventTag, event.status === "live" && styles.liveTag]}>{label(locale, { label: event.tag, zhLabel: event.zhTag })}</Text>
                {toggleSavedEvent && (
                  <Pressable
                    accessibilityLabel={`save-event-${event.id}`}
                    testID={`save-event-${event.id}`}
                    onPress={(pressEvent) => {
                      pressEvent.stopPropagation();
                      toggleSavedEvent(event);
                    }}
                    style={[styles.saveButton, isSaved && styles.saveButtonActive]}
                  >
                    <Text style={[styles.saveText, isSaved && styles.saveTextActive]}>{isSaved ? "★" : "☆"}</Text>
                  </Pressable>
                )}
              </View>
            </View>
            <Text style={styles.eventTitle}>{label(locale, event)}</Text>
            {statsCopy && (
              <View style={styles.statsRow}>
                <Text style={styles.statsText}>
                  {statsCopy.volume}: {money(stats.volume)}
                </Text>
                <Text style={styles.statsText}>
                  {statsCopy.liquidity}: {money(stats.liquidity)}
                </Text>
              </View>
            )}
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
  statsCopy,
}: {
  locale: Locale;
  futures: Market[];
  openTicket: (market: Market, outcome: Outcome, event?: Event, side?: "buy" | "sell") => void;
  statsCopy?: MarketStatsCopy;
}) {
  return (
    <View style={styles.eventList}>
      {futures.map((market) => {
        const stats = futureCardStats(market);
        return (
          <View key={market.id} style={styles.futureMarketCard}>
            <View style={styles.futureMarketHeader}>
              <Text style={styles.eventTitle}>{label(locale, market)}</Text>
              <Text style={styles.futureBookmark}>☆</Text>
            </View>
            {statsCopy && (
              <View style={styles.statsRow}>
                <Text style={styles.statsText}>
                  {statsCopy.volume}: {money(stats.volume)}
                </Text>
                <Text style={styles.statsText}>
                  {statsCopy.liquidity}: {money(stats.liquidity)}
                </Text>
              </View>
            )}
            {market.outcomes.map((outcome) => (
              <View accessibilityLabel={`future-row-${market.id}-${outcome.id}`} key={outcome.id} style={styles.futureOutcomeRow} testID={`future-row-${market.id}-${outcome.id}`}>
                <View style={styles.futureOutcomeTop}>
                  <View style={styles.futureOutcomeIdentity}>
                    <Text style={styles.futureFlag}>{futureOutcomeFlags[outcome.id] ?? "🏆"}</Text>
                    <View style={styles.futureOutcomeText}>
                      <Text style={styles.futureOutcomeName}>{label(locale, outcome)}</Text>
                      <Text style={styles.futureOutcomeVolume}>{money(futureOutcomeVolume(market, outcome))} Vol.</Text>
                    </View>
                  </View>
                  <Text style={styles.futureOutcomeProbability}>{outcome.probability}%</Text>
                </View>
                <View style={styles.futureTradeRow}>
                <Pressable
                  accessibilityLabel={`future-outcome-${market.id}-${outcome.id}`}
                    style={styles.futureYesButton}
                  testID={`future-outcome-${market.id}-${outcome.id}`}
                    onPress={() => openTicket(market, outcome, undefined, "buy")}
                >
                    <Text style={styles.futureYesText}>Buy Yes {cents(outcome.probability)}</Text>
                </Pressable>
                  <Pressable
                    accessibilityLabel={`future-outcome-no-${market.id}-${outcome.id}`}
                    style={styles.futureNoButton}
                    testID={`future-outcome-no-${market.id}-${outcome.id}`}
                    onPress={() => openTicket(market, outcome, undefined, "sell")}
                  >
                    <Text style={styles.futureNoText}>Buy No {cents(100 - outcome.probability)}</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  eventList: { gap: 12 },
  eventCard: { padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  futureMarketCard: { padding: 0, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", overflow: "hidden" },
  futureMarketHeader: { padding: 14, paddingBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  futureBookmark: { color: "#94a3b8", fontSize: 24, fontWeight: "900" },
  eventMetaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  eventMetaRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeText: { color: "#94a3b8", fontWeight: "800" },
  eventTag: { color: "#94a3b8", fontWeight: "800" },
  liveTag: { color: "#ff4d4f" },
  saveButton: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  saveButtonActive: { backgroundColor: "#fbbf24", borderColor: "#fbbf24" },
  saveText: { color: "#94a3b8", fontSize: 19, fontWeight: "900" },
  saveTextActive: { color: "#101827" },
  eventTitle: { color: "#f8fafc", fontSize: 20, fontWeight: "900", marginBottom: 8 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  statsText: { color: "#93c5fd", fontSize: 12, fontWeight: "900" },
  teamRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 9 },
  teamName: { flex: 1, color: "#f8fafc", fontSize: 18, fontWeight: "800" },
  oddsText: { color: "#a7b1c2", width: 48, textAlign: "right", fontSize: 17, fontWeight: "800" },
  probButton: { minWidth: 86, alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 },
  probButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
  futureOutcomeRow: { paddingHorizontal: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: "#263247" },
  futureOutcomeTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  futureOutcomeIdentity: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  futureFlag: { width: 52, height: 52, borderRadius: 14, overflow: "hidden", textAlign: "center", textAlignVertical: "center", fontSize: 34, backgroundColor: "#1f2937" },
  futureOutcomeText: { flex: 1, minWidth: 0 },
  futureOutcomeName: { color: "#f8fafc", fontSize: 24, fontWeight: "900" },
  futureOutcomeVolume: { color: "#94a3b8", fontSize: 15, fontWeight: "800", marginTop: 3 },
  futureOutcomeProbability: { color: "#f8fafc", fontSize: 34, fontWeight: "900" },
  futureTradeRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  futureYesButton: { flex: 1, minHeight: 56, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "rgba(34, 197, 94, 0.18)" },
  futureNoButton: { flex: 1, minHeight: 56, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "rgba(239, 68, 68, 0.18)" },
  futureYesText: { color: "#4ade80", fontSize: 18, fontWeight: "900" },
  futureNoText: { color: "#ef4444", fontSize: 18, fontWeight: "900" },
  empty: { color: "#94a3b8", textAlign: "center", marginTop: 30, fontWeight: "800" },
});
