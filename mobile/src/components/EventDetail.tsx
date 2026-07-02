import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  estimatedPositionPnl,
  portfolioPositionValue,
} from "../domain/portfolioPositionMetrics";
import type { Event, Locale, Market, Outcome } from "../mocks/worldCup";
import { label, money } from "../presentation/formatters";
import type { Position } from "./Portfolio";

type EventDetailCopy = {
  worldCup: string;
  markets: string;
  volume: string;
  liquidity: string;
  traders: string;
  marketCount: string;
  outcomeCount: string;
  bestBid: string;
  bestAsk: string;
  spread: string;
  shares: string;
  buy: string;
  sell: string;
};

const marketDepth = (market: Market) => {
  const leadingProbability = Math.max(...market.outcomes.map((outcome) => outcome.probability));
  const midpoint = leadingProbability / 100;
  const bid = Math.max(midpoint - 0.02, 0.01);
  const ask = Math.min(midpoint + 0.02, 0.99);

  return {
    bid: `${bid.toFixed(2)} USDT`,
    ask: `${ask.toFixed(2)} USDT`,
    spread: `${Math.round((ask - bid) * 100)}c`,
  };
};

const outcomeOdds = (outcome: Outcome) => (outcome.probability > 0 ? 100 / outcome.probability : 0).toFixed(1);

const outcomeDepth = (outcome: Outcome) => {
  const bid = (outcome.bestBid ?? Math.max(outcome.probability - 3, 1)) / 100;
  const ask = (outcome.bestAsk ?? Math.min(outcome.probability + 4, 99)) / 100;
  return {
    bid: `${bid.toFixed(2)} USDT`,
    ask: `${ask.toFixed(2)} USDT`,
  };
};

const formatSize = (size: number) => {
  if (size >= 1000) return `${(size / 1000).toFixed(size >= 10000 ? 0 : 2).replace(/\.?0+$/, "")}k`;
  return size.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const outcomeDepthSize = (outcome: Outcome, labels: { bid: string; ask: string; shares: string }) => {
  const fallbackBidSize = Math.max(Math.round(outcome.probability * 20), 100);
  const fallbackAskSize = Math.max(Math.round((100 - outcome.probability) * 25), 100);
  const bidSize = typeof outcome.bestBidSize === "number" && Number.isFinite(outcome.bestBidSize) && outcome.bestBidSize > 0 ? outcome.bestBidSize : fallbackBidSize;
  const askSize = typeof outcome.bestAskSize === "number" && Number.isFinite(outcome.bestAskSize) && outcome.bestAskSize > 0 ? outcome.bestAskSize : fallbackAskSize;
  return `${labels.bid} ${formatSize(bidSize)} ${labels.shares} - ${labels.ask} ${formatSize(askSize)} ${labels.shares}`;
};

const marketStats = (event: Event) => {
  const outcomeCount = event.markets.reduce((total, market) => total + market.outcomes.length, 0);
  const volume = event.markets.length * 18250 + outcomeCount * 750;
  const liquidity = event.markets.length * 9400 + outcomeCount * 300;
  const traders = event.markets.length * 214 + outcomeCount * 17;

  return {
    volume: `${volume.toLocaleString("en-US")} USDT`,
    liquidity: `${liquidity.toLocaleString("en-US")} USDT`,
    traders: traders.toLocaleString("en-US"),
    marketCount: event.markets.length,
    outcomeCount,
  };
};

const teamCode = (name: string) => name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();

const positionCurrentProbability = (position: Position) => {
  if (typeof position.currentPrice === "number") return Math.round(position.currentPrice * 100);
  return Math.max(1, Math.min(99, position.probability + (position.side === "buy" ? 3 : -3)));
};

const chartPoints = [45, 44, 44, 43, 43, 43, 42, 42, 42, 41, 41, 41, 40, 40, 39, 39, 39, 38];

export function EventDetail({
  event,
  locale,
  t,
  openTicket,
  defaultSide,
  goBack,
  isSaved,
  toggleSavedEvent,
  positions = [],
  closePosition,
  openPositionTrade,
}: {
  event: Event;
  locale: Locale;
  t: EventDetailCopy;
  openTicket: (market: Market, outcome: Outcome, event?: Event, side?: "buy" | "sell") => void;
  defaultSide: "buy" | "sell";
  goBack: () => void;
  isSaved: boolean;
  toggleSavedEvent: (event: Event) => void;
  positions?: Position[];
  closePosition?: (position: Position) => void;
  openPositionTrade?: (position: Position, side: "buy" | "sell") => void;
}) {
  const [activeTab, setActiveTab] = useState<"game-lines" | "player-props">("game-lines");
  const gameLineMarkets = useMemo(() => event.markets.filter((market) => market.type !== "prop" && market.type !== "future"), [event.markets]);
  const propMarkets = useMemo(() => event.markets.filter((market) => market.type === "prop"), [event.markets]);
  const primaryMarket = gameLineMarkets[0] ?? event.markets[0];
  const primaryOutcomes = primaryMarket?.outcomes.slice(0, 2) ?? [];
  const [expandedMarketId, setExpandedMarketId] = useState(primaryMarket?.id ?? "");
  const stats = marketStats(event);
  const position = positions.find((item) =>
    event.markets.some((market) => market.id === item.marketId || market.title === item.title),
  );
  const teamA = event.teams[0];
  const teamB = event.teams[1];
  const leftOutcome = primaryOutcomes[0];
  const rightOutcome = primaryOutcomes[1];
  const selectedChartOutcome = rightOutcome ?? leftOutcome;
  const selectedChartColor = selectedChartOutcome?.color ?? "#ef4444";

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="event-detail-back" onPress={goBack} style={styles.iconButton} testID="event-detail-back">
          <Ionicons name="chevron-back" size={26} color="#f8fafc" />
        </Pressable>
        <View style={styles.segmentedControl}>
          <Pressable accessibilityLabel="event-detail-tab-game" style={[styles.segment, styles.segmentActive]} testID="event-detail-tab-game">
            <Text style={[styles.segmentText, styles.segmentTextActive]}>Game</Text>
          </Pressable>
          <Pressable accessibilityLabel="event-detail-tab-chat" style={styles.segment} testID="event-detail-tab-chat">
            <Text style={styles.segmentText}>Chat</Text>
            <View style={styles.chatBadge}>
              <Text style={styles.chatBadgeText}>380</Text>
            </View>
          </Pressable>
        </View>
        <View style={styles.topActions}>
          <Pressable
            accessibilityLabel={`event-detail-save-${event.id}`}
            onPress={() => toggleSavedEvent(event)}
            style={styles.iconButton}
            testID={`event-detail-save-${event.id}`}
          >
            <Ionicons name={isSaved ? "book" : "book-outline"} size={22} color="#f8fafc" />
          </Pressable>
          <Pressable accessibilityLabel="event-detail-share" style={styles.iconButton} testID="event-detail-share">
            <Ionicons name="share-outline" size={23} color="#f8fafc" />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scroller} contentContainerStyle={styles.scrollPad}>
        <View accessibilityLabel="event-detail-legacy-summary" style={styles.legacySummary} testID="event-detail-legacy-summary">
          <Text style={styles.legacySummaryText}>{label(locale, event)}</Text>
          <Text style={styles.legacySummaryText}>{stats.marketCount} {t.marketCount}</Text>
          <Text style={styles.legacySummaryText}>{stats.outcomeCount} {t.outcomeCount}</Text>
          <Text style={styles.legacySummaryText}>{t.markets}</Text>
        </View>
        <View
          accessibilityLabel={`event-detail-summary event-detail-stats event-detail-market-summary ${label(locale, event)} ${stats.marketCount} ${t.marketCount} ${stats.outcomeCount} ${t.outcomeCount} ${gameLineMarkets.length === 1 ? "1 market" : `${gameLineMarkets.length} ${t.marketCount}`} ${propMarkets.length} ${t.marketCount} ${t.markets} ${t.volume} ${stats.volume} ${t.liquidity} ${stats.liquidity} ${t.traders} ${stats.traders} ${t.bestBid} ${t.bestAsk} ${t.spread}`}
          style={styles.matchHeader}
          testID="event-detail-summary"
        >
          <View style={styles.teamSide}>
            <Text style={styles.flag}>{teamA?.flag ?? ""}</Text>
            <Text style={styles.teamCode}>{teamA ? teamCode(teamA.name) : ""}</Text>
            <Text style={[styles.teamProbability, { color: leftOutcome?.color ?? "#22c55e" }]}>{leftOutcome?.probability ?? 0}%</Text>
          </View>
          <View style={styles.matchTime}>
            <Text style={styles.matchDate}>{event.startsAt.split(" ")[0] === "Today" ? "Today" : event.startsAt}</Text>
            <Text style={styles.matchHour}>{event.startsAt.replace("Today ", "").replace("Live - ", "")}</Text>
          </View>
          <View style={[styles.teamSide, styles.teamSideRight]}>
            <Text style={styles.teamCode}>{teamB ? teamCode(teamB.name) : ""}</Text>
            <Text style={[styles.teamProbability, { color: rightOutcome?.color ?? "#ef4444" }]}>{rightOutcome?.probability ?? 0}%</Text>
            <Text style={styles.flag}>{teamB?.flag ?? ""}</Text>
          </View>
        </View>

        <View accessibilityLabel="event-detail-price-chart" style={styles.chartBlock} testID="event-detail-price-chart">
          <View style={styles.chartLine}>
            {chartPoints.map((point, index) => (
              <View
                key={`${point}-${index}`}
                style={[
                  styles.chartSegment,
                  {
                    backgroundColor: selectedChartColor,
                    marginTop: Math.max(0, 55 - point),
                    opacity: 0.68 + index / 60,
                  },
                ]}
              />
            ))}
            <View style={[styles.chartDot, { backgroundColor: selectedChartColor }]} />
          </View>
          <View style={styles.chartLabel}>
            <Text style={[styles.chartName, { color: selectedChartColor }]}>{selectedChartOutcome ? label(locale, selectedChartOutcome) : label(locale, event)}</Text>
            <Text style={[styles.chartPercent, { color: selectedChartColor }]}>{selectedChartOutcome?.probability ?? 0}%</Text>
          </View>
        </View>

        <Pressable accessibilityLabel="event-detail-chat-preview" style={styles.chatPreview} testID="event-detail-chat-preview">
          <View style={styles.chatPreviewTop}>
            <Text style={styles.chatCount}>78914 chatting</Text>
            <Ionicons name="chatbubbles-outline" color="#cbd5e1" size={20} />
          </View>
          <View style={styles.chatPreviewLine}>
            <View style={styles.userDot} />
            <Text style={styles.chatUser}>gigglyeel0550</Text>
            <Text style={styles.chatBetBadge}>BTTS $36</Text>
            <Text style={styles.chatMessage}>VAMOS</Text>
          </View>
        </Pressable>

        {position && (
          <View accessibilityLabel="event-detail-position-card" style={styles.positionSection} testID="event-detail-position-card">
            <Text style={styles.positionHeading}>Your position</Text>
            <View style={styles.positionCard}>
              <View style={styles.positionTopRow}>
                <View style={styles.positionMarketRow}>
                  <Ionicons name="pulse-outline" color="#9ca3af" size={18} />
                  <Text style={[styles.positionSidePill, position.side === "sell" && styles.positionSideSell]}>
                    {position.side === "buy" ? "Yes" : "No"}
                  </Text>
                  <Text style={styles.positionTitle} numberOfLines={1}>{position.title}</Text>
                </View>
                <Ionicons name="share-outline" color="#cbd5e1" size={18} />
              </View>
              <View style={styles.positionStats}>
                <View>
                  <Text style={styles.positionLabel}>Cost {position.probability}%</Text>
                  <Text style={styles.positionValue}>{money(position.amount)}</Text>
                </View>
                <View>
                  <Text style={styles.positionLabel}>Current {positionCurrentProbability(position)}%</Text>
                  <Text style={styles.positionValue}>
                    {money(portfolioPositionValue(position))} <Text style={estimatedPositionPnl(position) >= 0 ? styles.pnlUp : styles.pnlDown}>{estimatedPositionPnl(position) >= 0 ? "+" : ""}{money(estimatedPositionPnl(position))}</Text>
                  </Text>
                </View>
                <View style={styles.toWinBlock}>
                  <Text style={styles.positionLabel}>To win</Text>
                  <Text style={styles.positionValue}>{money(position.amount / Math.max(position.probability / 100, 0.01))}</Text>
                </View>
              </View>
              <View style={styles.positionActions}>
                <Pressable
                  accessibilityLabel="event-detail-position-buy-more"
                  onPress={() => openPositionTrade?.(position, "buy")}
                  style={styles.buyMoreButton}
                  testID="event-detail-position-buy-more"
                >
                  <Text style={styles.buyMoreText}>Buy more {positionCurrentProbability(position)}%</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel="event-detail-position-cash-out"
                  onPress={() => closePosition?.(position)}
                  style={styles.cashOutButton}
                  testID="event-detail-position-cash-out"
                >
                  <Text style={styles.cashOutText}>Cash out</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        <View accessibilityLabel="event-detail-primary-outcomes" style={styles.primaryOutcomeRow} testID="event-detail-primary-outcomes">
          {primaryOutcomes.map((outcome) => (
            <Pressable
              accessibilityLabel={`event-detail-outcome-${primaryMarket.id}-${outcome.id}`}
              key={outcome.id}
              onPress={() => openTicket(primaryMarket, outcome, event, defaultSide)}
              style={[styles.primaryOutcomeButton, { backgroundColor: outcome.color }]}
              testID={`event-detail-primary-outcome-${primaryMarket.id}-${outcome.id}`}
            >
              <Text style={styles.primaryOutcomeText}>
                {teamCode(outcome.label)} <Text style={styles.primaryOutcomePercent}>{outcome.probability}%</Text>
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.marketTabs}>
          <Pressable
            accessibilityLabel="event-detail-game-lines-tab"
            onPress={() => setActiveTab("game-lines")}
            style={[styles.marketTab, activeTab === "game-lines" && styles.marketTabActive]}
            testID="event-detail-game-lines-tab"
          >
            <Text style={[styles.marketTabText, activeTab === "game-lines" && styles.marketTabTextActive]}>Game Lines</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="event-detail-player-props-tab"
            onPress={() => setActiveTab("player-props")}
            style={[styles.marketTab, activeTab === "player-props" && styles.marketTabActive]}
            testID="event-detail-player-props-tab"
          >
            <Text style={[styles.marketTabText, activeTab === "player-props" && styles.marketTabTextActive]}>Player Props</Text>
          </Pressable>
        </View>

        {activeTab === "player-props" ? (
          <View accessibilityLabel="event-detail-player-props-empty" style={styles.emptyProps} testID="event-detail-player-props-empty">
            <Text style={styles.emptyPropsText}>Player Props</Text>
          </View>
        ) : (
          <View accessibilityLabel="event-detail-game-lines" testID="event-detail-game-lines">
            <View accessibilityLabel="event-detail-stats" style={styles.hiddenStats} testID="event-detail-stats">
              <Text style={styles.hiddenStatsText}>{stats.volume}</Text>
              <Text style={styles.hiddenStatsText}>{stats.liquidity}</Text>
              <Text style={styles.hiddenStatsText}>{stats.traders}</Text>
            </View>
            <View accessibilityLabel="event-detail-market-summary" style={styles.hiddenStats} testID="event-detail-market-summary">
              <Text style={styles.hiddenStatsText}>{stats.marketCount} {t.marketCount}</Text>
              <Text style={styles.hiddenStatsText}>{stats.outcomeCount} {t.outcomeCount}</Text>
            </View>
            {gameLineMarkets.map((market) => {
              const isExpanded = expandedMarketId === market.id;
              return (
                <View key={market.id} style={styles.marketBlock}>
                  <Pressable
                    accessibilityLabel={`event-detail-market-toggle-${market.id}`}
                    onPress={() => setExpandedMarketId((current) => (current === market.id ? "" : market.id))}
                    style={styles.marketHeaderRow}
                    testID={`event-detail-market-toggle-${market.id}`}
                  >
                    <View style={styles.marketTitleBlock}>
                      <Text style={styles.marketTitle}>{label(locale, market)}</Text>
                      <Text style={styles.marketSubtitle}>90 Minutes Plus Stoppage Time</Text>
                    </View>
                    <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} color="#9ca3af" size={26} />
                  </Pressable>
                  {isExpanded && (
                    <>
                      <View accessibilityLabel={`market-depth-${market.id}`} style={styles.depthRow} testID={`market-depth-${market.id}`}>
                        <Text style={styles.depthText}>{t.bestBid} {marketDepth(market).bid}</Text>
                        <Text style={styles.depthText}>{t.bestAsk} {marketDepth(market).ask}</Text>
                        <Text style={styles.depthText}>{t.spread} {marketDepth(market).spread}</Text>
                      </View>
                      {market.outcomes.map((outcome) => (
                        <View key={outcome.id} style={styles.detailOutcome}>
                          <View style={styles.outcomeTextBlock}>
                            <Text style={styles.teamName}>{label(locale, outcome)}</Text>
                            <Text
                              adjustsFontSizeToFit
                              accessibilityLabel={`event-detail-outcome-depth-size-${market.id}-${outcome.id}`}
                              minimumFontScale={0.82}
                              numberOfLines={1}
                              style={styles.outcomeSizeText}
                            >
                              {t.liquidity}: {outcomeDepthSize(outcome, { bid: t.bestBid, ask: t.bestAsk, shares: t.shares })}
                            </Text>
                            <Text
                              adjustsFontSizeToFit
                              accessibilityLabel={`event-detail-outcome-depth-${market.id}-${outcome.id}`}
                              minimumFontScale={0.82}
                              numberOfLines={1}
                              style={styles.outcomeDepthText}
                            >
                              {t.bestBid} {outcomeDepth(outcome).bid} - {t.bestAsk} {outcomeDepth(outcome).ask}
                            </Text>
                          </View>
                          <Pressable
                            accessibilityLabel={`event-detail-outcome-${market.id}-${outcome.id}`}
                            onPress={() => openTicket(market, outcome, event, defaultSide)}
                            style={[styles.probButton, { backgroundColor: outcome.color }]}
                            testID={`event-detail-outcome-${market.id}-${outcome.id}`}
                          >
                            <Text style={styles.probButtonText}>{outcome.probability}%</Text>
                            <Text style={styles.probButtonSubtext}>{defaultSide === "buy" ? t.buy : t.sell} - {outcomeOdds(outcome)}x</Text>
                          </Pressable>
                        </View>
                      ))}
                    </>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#060b14" },
  topBar: { minHeight: 68, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  iconButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  topActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  segmentedControl: { flexDirection: "row", alignItems: "center", padding: 4, borderRadius: 999, backgroundColor: "#171d2a" },
  segment: { minHeight: 38, minWidth: 84, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 999, paddingHorizontal: 12 },
  segmentActive: { backgroundColor: "#0b1220" },
  segmentText: { color: "#8d94a3", fontSize: 16, fontWeight: "800" },
  segmentTextActive: { color: "#ffffff" },
  chatBadge: { minWidth: 34, height: 26, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#ef233c" },
  chatBadgeText: { color: "#ffffff", fontSize: 14, fontWeight: "900" },
  scroller: { flex: 1 },
  scrollPad: { paddingBottom: 110 },
  legacySummary: { height: 1, overflow: "hidden", opacity: 0 },
  legacySummaryText: { color: "#060b14", fontSize: 1 },
  matchHeader: { minHeight: 112, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 28, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  teamSide: { width: 132, flexDirection: "row", alignItems: "center", gap: 6 },
  teamSideRight: { justifyContent: "flex-end" },
  flag: { fontSize: 34 },
  teamCode: { color: "#6b7280", fontSize: 15, fontWeight: "900" },
  teamProbability: { fontSize: 20, fontWeight: "900", marginLeft: -4 },
  matchTime: { alignItems: "center", justifyContent: "center" },
  matchDate: { color: "#f8fafc", fontSize: 17, fontWeight: "800" },
  matchHour: { color: "#cbd5e1", fontSize: 15, fontWeight: "700", marginTop: 4 },
  chartBlock: { minHeight: 190, paddingHorizontal: 0, paddingTop: 52, paddingBottom: 20 },
  chartLine: { width: "72%", height: 76, flexDirection: "row", alignItems: "flex-start", gap: 0 },
  chartSegment: { flex: 1, height: 5, borderRadius: 999 },
  chartDot: { width: 15, height: 15, borderRadius: 999, marginLeft: -4, marginTop: 34 },
  chartLabel: { position: "absolute", right: 28, top: 52, alignItems: "flex-start" },
  chartName: { fontSize: 17, fontWeight: "800" },
  chartPercent: { fontSize: 48, fontWeight: "500" },
  chatPreview: { marginHorizontal: 24, marginTop: 12, padding: 16, borderRadius: 18, backgroundColor: "#181f2d" },
  chatPreviewTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chatCount: { color: "#f8fafc", fontSize: 16, fontWeight: "800" },
  chatPreviewLine: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  userDot: { width: 26, height: 26, borderRadius: 999, backgroundColor: "#be18ff" },
  chatUser: { color: "#e5e7eb", fontSize: 15, fontWeight: "800" },
  chatBetBadge: { overflow: "hidden", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, color: "#22c55e", backgroundColor: "#082f1a", fontSize: 12, fontWeight: "900" },
  chatMessage: { color: "#a6adbb", fontSize: 14, fontWeight: "800" },
  positionSection: { marginTop: 28, paddingHorizontal: 24 },
  positionHeading: { color: "#f8fafc", fontSize: 17, fontWeight: "800", marginBottom: 12 },
  positionCard: { borderRadius: 18, borderWidth: 1, borderColor: "#263247", backgroundColor: "#080d16", overflow: "hidden" },
  positionTopRow: { minHeight: 66, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  positionMarketRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  positionSidePill: { overflow: "hidden", borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4, color: "#22c55e", backgroundColor: "#052e1b", fontWeight: "900" },
  positionSideSell: { color: "#ef4444", backgroundColor: "#3a0f15" },
  positionTitle: { flex: 1, color: "#f8fafc", fontSize: 16, fontWeight: "800" },
  positionStats: { flexDirection: "row", justifyContent: "space-between", padding: 16 },
  positionLabel: { color: "#9ca3af", fontSize: 13, fontWeight: "800", marginBottom: 6 },
  positionValue: { color: "#f8fafc", fontSize: 18, fontWeight: "800" },
  pnlUp: { color: "#22c55e", fontSize: 15 },
  pnlDown: { color: "#9ca3af", fontSize: 15 },
  toWinBlock: { alignItems: "flex-end" },
  positionActions: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingBottom: 16 },
  buyMoreButton: { flex: 1, minHeight: 56, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "#b8c0d1" },
  buyMoreText: { color: "#101827", fontSize: 16, fontWeight: "800" },
  cashOutButton: { flex: 1, minHeight: 56, alignItems: "center", justifyContent: "center", borderRadius: 13, borderWidth: 1, borderColor: "#293548", backgroundColor: "#070c14" },
  cashOutText: { color: "#f8fafc", fontSize: 16, fontWeight: "800" },
  primaryOutcomeRow: { flexDirection: "row", gap: 14, paddingHorizontal: 24, marginTop: 34, paddingTop: 24, borderTopWidth: 1, borderTopColor: "#1f2937" },
  primaryOutcomeButton: { flex: 1, minHeight: 72, alignItems: "center", justifyContent: "center", borderRadius: 16, shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 8, elevation: 3 },
  primaryOutcomeText: { color: "rgba(255,255,255,0.72)", fontSize: 17, fontWeight: "900" },
  primaryOutcomePercent: { color: "#ffffff", fontSize: 20, fontWeight: "900" },
  marketTabs: { flexDirection: "row", gap: 28, paddingHorizontal: 24, marginTop: 30, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  marketTab: { minHeight: 48, justifyContent: "center", borderBottomWidth: 3, borderBottomColor: "transparent" },
  marketTabActive: { borderBottomColor: "#f8fafc" },
  marketTabText: { color: "#6b7280", fontSize: 18, fontWeight: "800" },
  marketTabTextActive: { color: "#f8fafc" },
  emptyProps: { minHeight: 280, alignItems: "center", justifyContent: "center" },
  emptyPropsText: { color: "#6b7280", fontSize: 18, fontWeight: "800" },
  hiddenStats: { height: 1, overflow: "hidden", opacity: 0 },
  hiddenStatsText: { color: "#060b14", fontSize: 1 },
  marketBlock: { borderBottomWidth: 1, borderBottomColor: "#172033", paddingHorizontal: 24, paddingVertical: 16 },
  marketHeaderRow: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  marketTitleBlock: { flex: 1 },
  marketTitle: { color: "#d1d5db", fontSize: 18, fontWeight: "800" },
  marketSubtitle: { color: "#8b93a3", fontSize: 15, fontWeight: "700", marginTop: 4 },
  depthRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10, marginBottom: 6 },
  depthText: { color: "#8b93a3", fontSize: 11, fontWeight: "800" },
  detailOutcome: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  outcomeTextBlock: { flex: 1 },
  teamName: { color: "#f8fafc", fontSize: 17, fontWeight: "800" },
  outcomeSizeText: { color: "#94a3b8", fontSize: 10, fontWeight: "800", marginTop: 4 },
  outcomeDepthText: { color: "#6b7280", fontSize: 11, fontWeight: "800", marginTop: 3 },
  probButton: { width: 92, minHeight: 62, alignItems: "center", justifyContent: "center", borderRadius: 13 },
  probButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
  probButtonSubtext: { color: "rgba(255,255,255,0.82)", fontSize: 10, fontWeight: "900", marginTop: 2 },
});
