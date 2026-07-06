import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Event, Locale, Market, Outcome } from "../mocks/worldCup";
import { label } from "../presentation/formatters";

const isAdvanceMarket = (market: Market) => {
  const key = `${market.marketType ?? ""} ${market.marketGroupId ?? ""} ${market.title}`.toLowerCase();
  return key.includes("advance") || key.includes("qualify") || key.includes("to_qualify");
};

const isRegulationMarket = (market: Market) => {
  const key = `${market.marketType ?? ""} ${market.marketGroupId ?? ""} ${market.title}`.toLowerCase();
  return (
    !isAdvanceMarket(market) &&
    (market.outcomes.some((outcome) => outcome.side === "draw" || /^draw|tie$/i.test(outcome.label)) ||
      market.marketType === "moneyline" ||
      key.includes("winner") ||
      key.includes("regulation") ||
      key.includes("90"))
  );
};

const hasDrawOutcome = (market: Market) =>
  market.outcomes.some((outcome) => outcome.side === "draw" || /^draw|tie$/i.test(outcome.label));

const usesAdvanceDisplay = (event: Event, market: Market) =>
  isAdvanceMarket(market) ||
  (event.marketProfile === "full_match_with_overtime" && event.resultMode === "no_draw") ||
  (isRegulationMarket(market) && market.outcomes.length === 2 && !hasDrawOutcome(market));

const homeCardMarket = (event: Event) => {
  const gameLineMarkets = event.markets.filter((market) => market.type !== "prop" && market.type !== "future");
  const advanceMarket = gameLineMarkets.find(isAdvanceMarket);
  const regulationMarket = gameLineMarkets.find(isRegulationMarket);
  const shouldShowAdvance =
    Boolean(advanceMarket) &&
    (event.marketProfile === "to_advance" ||
      event.marketProfile === "full_match_with_overtime" ||
      event.gameRules?.includesOvertime ||
      event.supportedMarketTypes?.includes("to_advance"));
  return shouldShowAdvance ? advanceMarket : regulationMarket ?? advanceMarket ?? gameLineMarkets[0] ?? event.markets[0];
};

export function MarketList({
  locale,
  events,
  empty,
  openEvent,
  openTicket,
  savedEventIds,
  toggleSavedEvent,
}: {
  locale: Locale;
  events: Event[];
  empty: string;
  openEvent: (event: Event) => void;
  openTicket: (market: Market, outcome: Outcome, event?: Event) => void;
  savedEventIds?: Set<string>;
  toggleSavedEvent?: (event: Event) => void;
}) {
  if (events.length === 0) return <Text style={styles.empty}>{empty}</Text>;
  return (
    <View style={styles.eventList}>
      {events.map((event) => {
        const winner = homeCardMarket(event);
        const displayAsAdvance = Boolean(winner && usesAdvanceDisplay(event, winner));
        const cardOutcomes = winner && displayAsAdvance ? winner.outcomes.slice(0, 2) : winner?.outcomes.slice(0, 3) ?? [];
        const isSaved = savedEventIds?.has(event.id) ?? false;
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
                <Text style={[styles.eventTag, event.status === "live" && styles.liveTag]}>
                  {label(locale, { label: event.tag, zhLabel: event.zhTag })}
                </Text>
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
            {winner && (
              <View
                accessibilityLabel={`event-card-retail-outcome-rail ${event.id} ${displayAsAdvance ? "home-card-advance-market" : "home-card-regulation-market"} ${cardOutcomes.map((outcome) => label(locale, outcome)).join(" ")}`}
                style={styles.eventOutcomeRail}
                testID={`event-card-retail-outcome-rail-${event.id}`}
              >
                {cardOutcomes.map((outcome, index) => (
                  <Pressable
                    accessibilityLabel={`event-outcome-retail-${event.id}-${winner.id}-${outcome.id} event-card-retail-outcome ${label(locale, outcome)} ${outcome.probability}%`}
                    key={outcome.id}
                    onPress={(pressEvent) => {
                      pressEvent.stopPropagation();
                      openTicket(winner, outcome, event);
                    }}
                    style={[
                      styles.retailOutcomeButton,
                      outcome.side === "draw" || /^draw|tie$/i.test(outcome.label)
                        ? styles.retailOutcomeButtonDraw
                        : index === 0
                          ? styles.retailOutcomeButtonHome
                          : styles.retailOutcomeButtonAway,
                      { backgroundColor: outcome.color },
                    ]}
                    testID={`event-outcome-retail-${event.id}-${winner.id}-${outcome.id}`}
                  >
                    <Text numberOfLines={1} style={styles.retailOutcomeName}>{label(locale, outcome)}</Text>
                    <Text style={styles.retailOutcomeProb}>{outcome.probability}%</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {winner && winner.outcomes.map((outcome) => (
              <View key={outcome.id} style={styles.teamRow}>
                <Text style={styles.teamName}>
                  {outcome.label === "Draw" ? "🤝" : event.teams.find((team) => team.name === outcome.label)?.flag ?? "•"} {label(locale, outcome)}
                </Text>
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

const styles = StyleSheet.create({
  eventList: { gap: 12 },
  eventCard: { padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
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
  teamRow: { display: "none", height: 0, opacity: 0, overflow: "hidden", flexDirection: "row", alignItems: "center", gap: 10, marginTop: 0 },
  teamName: { flex: 1, color: "#f8fafc", fontSize: 18, fontWeight: "800" },
  oddsText: { color: "#a7b1c2", width: 48, textAlign: "right", fontSize: 17, fontWeight: "800" },
  probButton: { minWidth: 86, alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 },
  probButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
  eventOutcomeRail: { flexDirection: "row", gap: 8, marginTop: 12 },
  retailOutcomeButton: { flex: 1, minHeight: 64, alignItems: "center", justifyContent: "center", borderRadius: 12, paddingHorizontal: 6, shadowColor: "#000000", shadowOpacity: 0.18, shadowRadius: 8 },
  retailOutcomeButtonHome: { backgroundColor: "#008000" },
  retailOutcomeButtonAway: { backgroundColor: "#ef4444" },
  retailOutcomeButtonDraw: { backgroundColor: "#3b82f6" },
  retailOutcomeName: { color: "#dbeafe", fontSize: 12, fontWeight: "800", opacity: 0.9 },
  retailOutcomeProb: { color: "#ffffff", fontSize: 20, fontWeight: "900", marginTop: 2 },
  empty: { color: "#94a3b8", textAlign: "center", marginTop: 30, fontWeight: "800" },
});
