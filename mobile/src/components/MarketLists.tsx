import { Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import type { Event, Locale, Market, Outcome } from "../mocks/worldCup";
import { label, money } from "../presentation/formatters";

type MarketStatsCopy = {
  volume: string;
  liquidity: string;
};

const futureCardStats = (market: Market) => ({
  volume: 12200 + market.outcomes.length * 2400,
  liquidity: 7600 + market.outcomes.length * 1350,
});

const futureOutcomeFlags: Record<string, string> = {
  argentina: "🇦🇷",
  australia: "🇦🇺",
  belgium: "🇧🇪",
  brazil: "🇧🇷",
  colombia: "🇨🇴",
  croatia: "🇭🇷",
  denmark: "🇩🇰",
  england: "🏴",
  france: "🇫🇷",
  germany: "🇩🇪",
  italy: "🇮🇹",
  japan: "🇯🇵",
  mexico: "🇲🇽",
  morocco: "🇲🇦",
  netherlands: "🇳🇱",
  portugal: "🇵🇹",
  senegal: "🇸🇳",
  spain: "🇪🇸",
  switzerland: "🇨🇭",
  uruguay: "🇺🇾",
  usa: "🇺🇸",
};

const futureOutcomeVolume = (market: Market, outcome: Outcome) => {
  const rank = market.outcomes.findIndex((candidate) => candidate.id === outcome.id);
  return Math.round(72000000 + outcome.probability * 520000 + Math.max(0, 4 - rank) * 3600000);
};

const cents = (probability: number) => `${probability.toFixed(1)}¢`;
const futureChartRanges = ["1H", "1D", "1W", "1M", "MAX"] as const;
type FutureChartRange = typeof futureChartRanges[number];

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
            {winner && (
              <View accessibilityLabel={`event-card-retail-outcome-rail ${event.id} ${displayAsAdvance ? "home-card-advance-market" : "home-card-regulation-market"} ${cardOutcomes.map((outcome) => label(locale, outcome)).join(" ")}`} style={styles.eventOutcomeRail} testID={`event-card-retail-outcome-rail-${event.id}`}>
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
                        : index === 0 ? styles.retailOutcomeButtonHome : styles.retailOutcomeButtonAway,
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
  openTicket: (market: Market, outcome: Outcome, event?: Event, side?: "buy" | "sell", selection?: { marketType: "future"; displayLabel: string; contractSide: "yes" | "no" }) => void;
  statsCopy?: MarketStatsCopy;
}) {
  const [selectedRange, setSelectedRange] = useState<FutureChartRange>("MAX");
  const [expandedMarketIds, setExpandedMarketIds] = useState<Record<string, boolean>>({});
  return (
    <View style={styles.eventList}>
      {futures.map((market) => {
        const stats = futureCardStats(market);
        const isExpanded = expandedMarketIds[market.id] ?? false;
        const hiddenOutcomeCount = Math.max(0, market.outcomes.length - 3);
        const visibleOutcomes = isExpanded ? market.outcomes : market.outcomes.slice(0, 3);
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
            <View accessibilityLabel={`future-market-chart ${selectedRange}`} style={styles.futureChart} testID="future-market-chart">
              <View style={styles.futureLegend}>
                {market.outcomes.slice(0, 4).map((outcome) => (
                  <Text key={outcome.id} style={styles.futureLegendText}>
                    <Text style={{ color: outcome.color }}>●</Text> {label(locale, outcome)} {outcome.probability}%
                  </Text>
                ))}
              </View>
              <View style={styles.futureChartCanvas}>
                {market.outcomes.slice(0, 4).map((outcome, index) => (
                  <View
                    key={outcome.id}
                    style={[
                      styles.futureChartLine,
                      {
                        backgroundColor: outcome.color,
                        left: `${8 + index * 6}%`,
                        right: `${10 + (3 - index) * 5}%`,
                        top: `${22 + index * 16}%`,
                      },
                    ]}
                  />
                ))}
                <Text style={styles.futureChartWatermark}>Holiwyn</Text>
              </View>
              <View style={styles.futureChartMeta}>
                <Text style={styles.futureChartVolume}>🏆 {money(stats.volume)} Vol.</Text>
                <View style={styles.futureRangeRow}>
                  {futureChartRanges.map((range) => (
                    <Pressable
                      accessibilityLabel={`future-chart-range-${range.toLowerCase()}`}
                      key={range}
                      onPress={() => setSelectedRange(range)}
                      style={[styles.futureRangeButton, selectedRange === range && styles.futureRangeButtonActive]}
                      testID={`future-chart-range-${range.toLowerCase()}`}
                    >
                      <Text style={[styles.futureRangeText, selectedRange === range && styles.futureRangeTextActive]}>{range}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
            {visibleOutcomes.map((outcome) => (
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
                    onPress={() => openTicket(market, outcome, undefined, "buy", { marketType: "future", displayLabel: label(locale, outcome), contractSide: "yes" })}
                >
                    <Text style={styles.futureYesText}>Buy Yes {cents(outcome.probability)}</Text>
                </Pressable>
                  <Pressable
                    accessibilityLabel={`future-outcome-no-${market.id}-${outcome.id}`}
                    style={styles.futureNoButton}
                    testID={`future-outcome-no-${market.id}-${outcome.id}`}
                    onPress={() => openTicket(market, outcome, undefined, "buy", { marketType: "future", displayLabel: label(locale, outcome), contractSide: "no" })}
                  >
                    <Text style={styles.futureNoText}>Buy No {cents(100 - outcome.probability)}</Text>
                  </Pressable>
                </View>
              </View>
            ))}
            {hiddenOutcomeCount > 0 && (
              <Pressable
                accessibilityLabel={`future-more-${market.id}`}
                onPress={() => setExpandedMarketIds((current) => ({ ...current, [market.id]: !isExpanded }))}
                style={styles.futureMoreRow}
                testID={`future-more-${market.id}`}
              >
                <Text style={styles.futureMoreText}>{isExpanded ? "Show less" : `${hiddenOutcomeCount} more`}</Text>
              </Pressable>
            )}
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
  futureChart: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 12 },
  futureLegend: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  futureLegendText: { color: "#94a3b8", fontSize: 12, fontWeight: "900" },
  futureChartCanvas: { height: 136, borderRadius: 10, backgroundColor: "#0b1220", overflow: "hidden", borderWidth: 1, borderColor: "#1f2937" },
  futureChartLine: { position: "absolute", height: 4, borderRadius: 4, opacity: 0.9 },
  futureChartWatermark: { position: "absolute", right: 16, top: 50, color: "rgba(148, 163, 184, 0.14)", fontSize: 28, fontWeight: "900" },
  futureChartMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 10 },
  futureChartVolume: { flex: 1, color: "#cbd5e1", fontSize: 13, fontWeight: "900" },
  futureRangeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  futureRangeButton: { minWidth: 34, minHeight: 32, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  futureRangeButtonActive: { backgroundColor: "#1f2937" },
  futureRangeText: { color: "#94a3b8", fontSize: 14, fontWeight: "900" },
  futureRangeTextActive: { color: "#f8fafc" },
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
  a11yOnly: { height: 1, opacity: 0.01, overflow: "hidden" },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  statsText: { color: "#93c5fd", fontSize: 12, fontWeight: "900" },
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
  futureMoreRow: { minHeight: 56, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: "#263247", alignItems: "center", justifyContent: "center" },
  futureMoreText: { color: "#94a3b8", fontSize: 17, fontWeight: "900" },
  empty: { color: "#94a3b8", textAlign: "center", marginTop: 30, fontWeight: "800" },
});
