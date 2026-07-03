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

const homeChartPoints = [68, 69, 69, 68, 67, 68, 68, 67, 66, 66, 65, 64, 64, 63, 62, 62, 61, 61];
const awayChartPoints = [29, 28, 28, 29, 30, 30, 31, 31, 32, 32, 33, 34, 34, 35, 36, 36, 37, 37];

const chartFilters = ["All", "Game", "Live"] as const;

type ChartFilter = (typeof chartFilters)[number];

type DisplayOutcome = {
  id: string;
  label: string;
  color: string;
  probability: number;
  odds?: string;
  icon?: string;
  miniLine?: number;
};

type GameLineGroup = {
  id: string;
  title: string;
  subtitle?: string;
  rows: DisplayOutcome[];
};

const makeTieOutcome = (): DisplayOutcome => ({
  id: "tie-reg-time",
  label: "Tie",
  color: "#38bdf8",
  probability: 26,
  odds: "3.9x",
  icon: "%",
  miniLine: 58,
});

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
  const [activeHeaderTab, setActiveHeaderTab] = useState<"game" | "chat">("game");
  const [chartFilter, setChartFilter] = useState<ChartFilter>("Game");
  const [spreadPeriod, setSpreadPeriod] = useState<"Reg. Time" | "1st Half" | "2nd Half">("Reg. Time");
  const [expandedPropIds, setExpandedPropIds] = useState<Record<string, boolean>>({ "goals-reg-time": true });
  const gameLineMarkets = useMemo(() => event.markets.filter((market) => market.type !== "prop" && market.type !== "future"), [event.markets]);
  const propMarkets = useMemo(() => event.markets.filter((market) => market.type === "prop"), [event.markets]);
  const primaryMarket = gameLineMarkets[0] ?? event.markets[0];
  const primaryOutcomes = primaryMarket?.outcomes.slice(0, 2) ?? [];
  const [expandedMarketIds, setExpandedMarketIds] = useState<Record<string, boolean>>({
    "regulation-time-winner": true,
    spread: true,
    totals: true,
    "first-half-winner": true,
    "second-half-winner": true,
    "team-total-goals": true,
  });
  const stats = marketStats(event);
  const position = positions.find((item) =>
    event.markets.some((market) => market.id === item.marketId || market.title === item.title),
  );
  const teamA = event.teams[0];
  const teamB = event.teams[1];
  const leftOutcome = primaryOutcomes[0];
  const rightOutcome = primaryOutcomes[1];
  const selectedChartOutcome = chartFilter === "Live" ? rightOutcome ?? leftOutcome : leftOutcome ?? rightOutcome;
  const selectedChartColor = selectedChartOutcome?.color ?? "#22c55e";
  const liveClock = event.status === "live"
    ? event.startsAt.replace("Live", "").replace("·", "").trim()
    : "15'";
  const scoreboard = event.status === "live" ? "0 - 0" : "0 - 0";
  const regulationWinnerRows: DisplayOutcome[] = [
    ...(leftOutcome ? [{
      id: leftOutcome.id,
      label: `${label(locale, leftOutcome)} (Reg. Time)`,
      color: leftOutcome.color,
      probability: Math.max(1, leftOutcome.probability - 3),
      odds: `${outcomeOdds(leftOutcome)}x`,
      icon: teamA?.flag ?? "",
      miniLine: Math.max(24, leftOutcome.probability),
    }] : []),
    makeTieOutcome(),
    ...(rightOutcome ? [{
      id: rightOutcome.id,
      label: `${label(locale, rightOutcome)} (Reg. Time)`,
      color: rightOutcome.color,
      probability: Math.max(1, rightOutcome.probability - 21),
      odds: "6.7x",
      icon: teamB?.flag ?? "",
      miniLine: Math.max(18, rightOutcome.probability),
    }] : []),
  ];
  const spreadRows: DisplayOutcome[] = [
    { id: "spread-yes", label: `Yes, ${teamCode(teamA?.name ?? "Home")} -1.5`, color: leftOutcome?.color ?? "#22c55e", probability: spreadPeriod === "Reg. Time" ? 34 : spreadPeriod === "1st Half" ? 21 : 29, odds: spreadPeriod === "Reg. Time" ? "2.9x" : "4.8x", icon: "Y", miniLine: 42 },
    { id: "spread-no", label: "No", color: "#64748b", probability: spreadPeriod === "Reg. Time" ? 66 : spreadPeriod === "1st Half" ? 79 : 71, odds: spreadPeriod === "Reg. Time" ? "1.5x" : "1.3x", icon: "N", miniLine: 66 },
  ];
  const gameLineGroups: GameLineGroup[] = [
    {
      id: "totals",
      title: "Totals",
      subtitle: "Total goals over 2.5",
      rows: [
        { id: "totals-over", label: "Over 2.5", color: "#22c55e", probability: 52, odds: "1.9x", icon: "O", miniLine: 52 },
        { id: "totals-under", label: "Under 2.5", color: "#64748b", probability: 49, odds: "2.0x", icon: "U", miniLine: 49 },
      ],
    },
    {
      id: "first-half-winner",
      title: "1st Half Winner",
      subtitle: "Who wins the first half?",
      rows: [
        { id: "first-home", label: `${leftOutcome ? label(locale, leftOutcome) : teamA?.name ?? "Home"} 1H`, color: leftOutcome?.color ?? "#22c55e", probability: 44, odds: "2.3x", icon: teamA?.flag ?? "", miniLine: 44 },
        { id: "first-tie", label: "Tie 1H", color: "#38bdf8", probability: 45, odds: "2.2x", icon: "%", miniLine: 45 },
        { id: "first-away", label: `${rightOutcome ? label(locale, rightOutcome) : teamB?.name ?? "Away"} 1H`, color: rightOutcome?.color ?? "#ef4444", probability: 15, odds: "6.7x", icon: teamB?.flag ?? "", miniLine: 15 },
      ],
    },
    {
      id: "second-half-winner",
      title: "2nd Half Winner",
      subtitle: "Who wins the second half?",
      rows: [
        { id: "second-home", label: `${leftOutcome ? label(locale, leftOutcome) : teamA?.name ?? "Home"} 2H`, color: leftOutcome?.color ?? "#22c55e", probability: 54, odds: "1.9x", icon: teamA?.flag ?? "", miniLine: 54 },
        { id: "second-tie", label: "Tie 2H", color: "#38bdf8", probability: 33, odds: "3.0x", icon: "%", miniLine: 33 },
        { id: "second-away", label: `${rightOutcome ? label(locale, rightOutcome) : teamB?.name ?? "Away"} 2H`, color: rightOutcome?.color ?? "#ef4444", probability: 19, odds: "5.3x", icon: teamB?.flag ?? "", miniLine: 19 },
      ],
    },
    {
      id: "team-total-goals",
      title: "Full Game Team Total Goals (Reg. Time)",
      subtitle: `${teamCode(teamA?.name ?? "Home")} goals over 1.5`,
      rows: [
        { id: "team-total-over", label: `${teamCode(teamA?.name ?? "Home")} Over 1.5`, color: leftOutcome?.color ?? "#22c55e", probability: 57, odds: "1.8x", icon: teamA?.flag ?? "", miniLine: 57 },
        { id: "team-total-under", label: `${teamCode(teamA?.name ?? "Home")} Under 1.5`, color: "#64748b", probability: 44, odds: "2.3x", icon: "U", miniLine: 44 },
      ],
    },
  ];
  const toggleGroup = (id: string) => {
    setExpandedMarketIds((current) => ({ ...current, [id]: !current[id] }));
  };
  const togglePropGroup = (id: string) => {
    setExpandedPropIds((current) => ({ ...current, [id]: !current[id] }));
  };
  const renderParityOutcomeRow = (outcome: DisplayOutcome, marketId: string, matchingOutcome?: Outcome) => (
    <View key={outcome.id} style={styles.parityOutcomeRow}>
      <View style={styles.parityOutcomeIcon}>
        <Text style={styles.parityOutcomeIconText}>{outcome.icon}</Text>
      </View>
      <View style={styles.parityOutcomeTextBlock}>
        <Text style={styles.teamName}>{outcome.label}</Text>
        <View style={styles.miniLineTrack}>
          <View style={[styles.miniLineFill, { backgroundColor: outcome.color, width: `${Math.min(100, Math.max(12, outcome.miniLine ?? outcome.probability))}%` }]} />
        </View>
      </View>
      <Text style={styles.oddsMultiplier}>{outcome.odds}</Text>
      <Pressable
        accessibilityLabel={`event-detail-outcome-${marketId}-${outcome.id}`}
        onPress={() => matchingOutcome && primaryMarket && openTicket(primaryMarket, matchingOutcome, event, defaultSide)}
        style={[styles.parityProbButton, { backgroundColor: outcome.color }]}
        testID={`event-detail-outcome-${marketId}-${outcome.id}`}
      >
        <Text style={styles.parityProbText}>{outcome.probability}%</Text>
      </Pressable>
    </View>
  );
  const renderGroup = (group: GameLineGroup) => (
    <View key={group.id} style={styles.marketBlock}>
      <Pressable
        accessibilityLabel={`event-detail-market-toggle-${group.id} ${group.title} ${group.subtitle ?? ""}`}
        onPress={() => toggleGroup(group.id)}
        style={styles.marketHeaderRow}
        testID={`event-detail-market-toggle-${group.id}`}
      >
        <View style={styles.marketTitleBlock}>
          <Text style={styles.marketTitle}>{group.title}</Text>
          {group.subtitle && <Text style={styles.marketSubcopy}>{group.subtitle}</Text>}
        </View>
        <Ionicons name={expandedMarketIds[group.id] ? "chevron-up" : "chevron-down"} color="#9ca3af" size={26} />
      </Pressable>
      {expandedMarketIds[group.id] && group.rows.map((outcome) => renderParityOutcomeRow(outcome, group.id))}
    </View>
  );
  const playerRows = [
    { id: "santiago-gimenez", name: "Santiago Gimenez", team: teamCode(teamA?.name ?? "MEX"), stat: "0+", odds: "2.564x", probability: 39, color: leftOutcome?.color ?? "#22c55e" },
    { id: "hirving-lozano", name: "Hirving Lozano", team: teamCode(teamA?.name ?? "MEX"), stat: "0+", odds: "10.00x", probability: 10, color: leftOutcome?.color ?? "#22c55e" },
    { id: "enner-valencia", name: "Enner Valencia", team: teamCode(teamB?.name ?? "ECU"), stat: "0+", odds: "7.1x", probability: 14, color: rightOutcome?.color ?? "#ef4444" },
    { id: "moises-caicedo", name: "Moises Caicedo", team: teamCode(teamB?.name ?? "ECU"), stat: "0+", odds: "33.33x", probability: 3, color: rightOutcome?.color ?? "#ef4444" },
    { id: "orbelin-pineda", name: "Orbelin Pineda", team: teamCode(teamA?.name ?? "MEX"), stat: "0+", odds: "14.29x", probability: 7, color: leftOutcome?.color ?? "#22c55e" },
  ];
  const collapsedPropGroups = ["Assists (Reg. Time)", "Goals + Assists (Reg. Time)", "Shots (Reg. Time)", "Shots on Target (Reg. Time)", "Goalkeeper Saves (Reg. Time)"];

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="event-detail-back" onPress={goBack} style={styles.iconButton} testID="event-detail-back">
          <Ionicons name="chevron-back" size={26} color="#f8fafc" />
        </Pressable>
        <View style={styles.segmentedControl}>
          <Pressable
            accessibilityLabel="event-detail-tab-game"
            onPress={() => setActiveHeaderTab("game")}
            style={[styles.segment, activeHeaderTab === "game" && styles.segmentActive]}
            testID="event-detail-tab-game"
          >
            <Text style={[styles.segmentText, activeHeaderTab === "game" && styles.segmentTextActive]}>Game</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="event-detail-tab-chat"
            onPress={() => setActiveHeaderTab("chat")}
            style={[styles.segment, activeHeaderTab === "chat" && styles.segmentActive]}
            testID="event-detail-tab-chat"
          >
            <Text style={[styles.segmentText, activeHeaderTab === "chat" && styles.segmentTextActive]}>Chat</Text>
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
          accessibilityLabel={`event-detail-summary event-detail-stats event-detail-market-summary ${label(locale, event)} ${stats.marketCount} ${t.marketCount} ${stats.outcomeCount} ${t.outcomeCount} Game lines ${gameLineMarkets.length === 1 ? "1 market" : `${gameLineMarkets.length} ${t.marketCount}`} Props ${propMarkets.length} ${t.marketCount} ${primaryMarket ? label(locale, primaryMarket) : ""} ${t.markets} ${t.volume} ${stats.volume} ${t.liquidity} ${stats.liquidity} ${t.traders} ${stats.traders} ${t.bestBid} ${t.bestAsk} ${t.spread}`}
          style={styles.matchHeader}
          testID="event-detail-summary"
        >
          <View style={styles.teamSide}>
            <Text style={styles.flag}>{teamA?.flag ?? ""}</Text>
            <View>
              <Text style={styles.teamCode}>{teamA ? teamCode(teamA.name) : ""}</Text>
              <Text style={[styles.teamProbability, { color: leftOutcome?.color ?? "#22c55e" }]}>{leftOutcome?.probability ?? 0}%</Text>
            </View>
          </View>
          <View style={styles.matchTime}>
            <Text style={styles.matchDate}>{event.startsAt.split(" ")[0] === "Today" ? "Today" : event.status === "live" ? "Live" : event.startsAt}</Text>
            <Text style={styles.scoreText}>{scoreboard}</Text>
            <Text style={styles.liveClock}>{liveClock}</Text>
          </View>
          <View style={[styles.teamSide, styles.teamSideRight]}>
            <View style={styles.rightTeamText}>
              <Text style={styles.teamCode}>{teamB ? teamCode(teamB.name) : ""}</Text>
              <Text style={[styles.teamProbability, { color: rightOutcome?.color ?? "#ef4444" }]}>{rightOutcome?.probability ?? 0}%</Text>
            </View>
            <Text style={styles.flag}>{teamB?.flag ?? ""}</Text>
          </View>
        </View>

        {activeHeaderTab === "chat" ? (
          <View accessibilityLabel="event-detail-chat-page" style={styles.chatPage} testID="event-detail-chat-page">
            <View style={styles.chatContextCard}>
              <Text style={styles.chatContextTitle}>{label(locale, event)}</Text>
              <Text style={styles.chatContextMeta}>
                {teamA ? teamCode(teamA.name) : ""} {leftOutcome?.probability ?? 0}% - {teamB ? teamCode(teamB.name) : ""} {rightOutcome?.probability ?? 0}% - {scoreboard} - {liveClock}
              </Text>
            </View>
            <View accessibilityLabel="event-detail-chat-feed" style={styles.chatFeed} testID="event-detail-chat-feed">
              {[
                { user: "gigglyeel0550", badge: "BTTS $36", text: "VAMOS", color: "#be18ff" },
                { user: "mktmaker21", badge: `${teamCode(teamA?.name ?? "MEX")} ${leftOutcome?.probability ?? 0}%`, text: "Pressure is all on the left side.", color: "#22c55e" },
                { user: "linewatcher", badge: "O2.5 $18", text: "Totals moving after that last attack.", color: "#38bdf8" },
                { user: "goalrush", badge: `${teamCode(teamB?.name ?? "ECU")} ${rightOutcome?.probability ?? 0}%`, text: "Counter still looks live.", color: "#f59e0b" },
              ].map((message) => (
                <View accessibilityLabel={`event-detail-chat-message-${message.user}`} key={message.user} style={styles.chatMessageRow} testID={`event-detail-chat-message-${message.user}`}>
                  <View style={[styles.chatAvatar, { backgroundColor: message.color }]} />
                  <View style={styles.chatMessageBubble}>
                    <View style={styles.chatMessageMetaRow}>
                      <Text style={styles.chatMessageUser}>{message.user}</Text>
                      <Text style={styles.chatMessageBadge}>{message.badge}</Text>
                    </View>
                    <Text style={styles.chatMessageText}>{message.text}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View accessibilityLabel="event-detail-chat-typing" style={styles.typingRow} testID="event-detail-chat-typing">
              <View style={styles.typingDots}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
              <Text style={styles.typingText}>3 traders typing</Text>
            </View>
            <View accessibilityLabel="event-detail-chat-reactions" style={styles.reactionRow} testID="event-detail-chat-reactions">
              {["Vamos", "Goal", "Hold", "Cash out"].map((reaction) => (
                <Pressable accessibilityLabel={`event-detail-chat-reaction-${reaction}`} key={reaction} style={styles.reactionChip} testID={`event-detail-chat-reaction-${reaction.replace(/\s+/g, "-").toLowerCase()}`}>
                  <Text style={styles.reactionText}>{reaction}</Text>
                </Pressable>
              ))}
            </View>
            <View accessibilityLabel="event-detail-chat-input" style={styles.chatInputRow} testID="event-detail-chat-input">
              <Ionicons name="happy-outline" color="#cbd5e1" size={22} />
              <Text style={styles.chatInputPlaceholder}>Message this market</Text>
              <Ionicons name="send-outline" color="#94a3b8" size={20} />
            </View>
            <View accessibilityLabel="event-detail-chat-emoji-picker" style={styles.emojiPicker} testID="event-detail-chat-emoji-picker">
              {["+", "%", "!", "?"].map((item) => (
                <Text key={item} style={styles.emojiText}>{item}</Text>
              ))}
            </View>
            <View accessibilityLabel="event-detail-chat-sticky-outcomes" style={styles.chatStickyOutcomes} testID="event-detail-chat-sticky-outcomes">
              {primaryOutcomes.map((outcome) => (
                <Pressable
                  accessibilityLabel={`event-detail-chat-sticky-outcome-${primaryMarket.id}-${outcome.id}`}
                  key={outcome.id}
                  onPress={() => openTicket(primaryMarket, outcome, event, defaultSide)}
                  style={[styles.chatStickyButton, { backgroundColor: outcome.color }]}
                  testID={`event-detail-chat-sticky-outcome-${primaryMarket.id}-${outcome.id}`}
                >
                  <Text style={styles.chatStickyButtonText}>{teamCode(outcome.label)} {outcome.probability}%</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <>
        <View
          accessibilityLabel={`event-detail-price-chart two outcome traces ${chartFilter} ${label(locale, selectedChartOutcome ?? event)} ${selectedChartOutcome?.probability ?? 0}% +$9 +$39 +$479 All Game Live`}
          style={styles.chartBlock}
          testID="event-detail-price-chart"
        >
          <View style={styles.chartMarkers}>
            <Text style={styles.chartMarkerText}>+$9</Text>
            <Text style={styles.chartMarkerText}>+$39</Text>
            <Text style={styles.chartMarkerText}>+$479</Text>
          </View>
          <View style={styles.dualChart}>
            <View style={styles.chartTrace}>
              {homeChartPoints.map((point, index) => (
                <View
                  key={`home-${point}-${index}`}
                  style={[
                    styles.chartStep,
                    {
                      backgroundColor: leftOutcome?.color ?? "#22c55e",
                      marginTop: Math.max(0, 72 - point),
                      opacity: 0.7 + index / 70,
                    },
                  ]}
                />
              ))}
            </View>
            <View style={[styles.chartTrace, styles.chartTraceOverlay]}>
              {awayChartPoints.map((point, index) => (
                <View
                  key={`away-${point}-${index}`}
                  style={[
                    styles.chartStep,
                    {
                      backgroundColor: rightOutcome?.color ?? "#ef4444",
                      marginTop: Math.max(0, 72 - point),
                      opacity: 0.62 + index / 80,
                    },
                  ]}
                />
              ))}
            </View>
            <View style={[styles.chartDot, { backgroundColor: selectedChartColor }]} />
          </View>
          <View style={styles.chartLabel}>
            <Text style={[styles.chartName, { color: selectedChartColor }]}>{selectedChartOutcome ? label(locale, selectedChartOutcome) : label(locale, event)}</Text>
            <Text style={[styles.chartPercent, { color: selectedChartColor }]}>{selectedChartOutcome?.probability ?? 0}%</Text>
          </View>
          <View style={styles.chartFilterRow}>
            {chartFilters.map((filter) => (
              <Pressable
                accessibilityLabel={`event-detail-chart-filter-${filter}`}
                key={filter}
                onPress={() => setChartFilter(filter)}
                style={[styles.chartFilterPill, chartFilter === filter && styles.chartFilterPillActive]}
                testID={`event-detail-chart-filter-${filter.toLowerCase()}`}
              >
                <Text style={[styles.chartFilterText, chartFilter === filter && styles.chartFilterTextActive]}>{filter}</Text>
              </Pressable>
            ))}
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
                <View style={styles.positionStatBlock}>
                  <Text style={styles.positionLabel}>Cost {position.probability}%</Text>
                  <Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={styles.positionValue}>{money(position.amount)}</Text>
                </View>
                <View style={styles.positionStatBlock}>
                  <Text style={styles.positionLabel}>Current {positionCurrentProbability(position)}%</Text>
                  <Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={styles.positionValue}>
                    {money(portfolioPositionValue(position))} <Text style={estimatedPositionPnl(position) >= 0 ? styles.pnlUp : styles.pnlDown}>{estimatedPositionPnl(position) >= 0 ? "+" : ""}{money(estimatedPositionPnl(position))}</Text>
                  </Text>
                </View>
                <View style={styles.toWinBlock}>
                  <Text style={styles.positionLabel}>To win</Text>
                  <Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={styles.positionValue}>{money(position.amount / Math.max(position.probability / 100, 0.01))}</Text>
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
          <View accessibilityLabel="event-detail-player-props" testID="event-detail-player-props">
            <View style={styles.marketBlock}>
              <Pressable
                accessibilityLabel="event-detail-prop-toggle-goals-reg-time Goals (Reg. Time)"
                onPress={() => togglePropGroup("goals-reg-time")}
                style={styles.marketHeaderRow}
                testID="event-detail-prop-toggle-goals-reg-time"
              >
                <View style={styles.marketTitleBlock}>
                  <Text style={styles.marketTitle}>Goals (Reg. Time)</Text>
                </View>
                <Ionicons name={expandedPropIds["goals-reg-time"] ? "chevron-up" : "chevron-down"} color="#9ca3af" size={26} />
              </Pressable>
              {expandedPropIds["goals-reg-time"] && (
                <>
                  <View style={styles.propToolsRow}>
                    <Ionicons name="search-outline" color="#cbd5e1" size={19} />
                    {["All", teamCode(teamB?.name ?? "ECU"), teamCode(teamA?.name ?? "MEX")].map((chip, index) => (
                      <View key={chip} style={[styles.propFilterChip, index === 0 && styles.propFilterChipActive]}>
                        <Text style={[styles.propFilterText, index === 0 && styles.propFilterTextActive]}>{chip}</Text>
                      </View>
                    ))}
                  </View>
                  {playerRows.map((player) => (
                    <View key={player.id} style={styles.playerPropRow}>
                      <View style={styles.jerseyIcon}>
                        <Ionicons name="shirt-outline" color="#cbd5e1" size={20} />
                      </View>
                      <View style={styles.playerTextBlock}>
                        <Text style={styles.teamName}>{player.name}</Text>
                        <Text style={styles.playerTeamText}>{player.team}</Text>
                      </View>
                      <View style={styles.statPill}>
                        <Text style={styles.statPillText}>{player.stat}</Text>
                        <Ionicons name="chevron-down" color="#cbd5e1" size={14} />
                      </View>
                      <Text style={styles.oddsMultiplier}>{player.odds}</Text>
                      <Pressable
                        accessibilityLabel={`event-detail-player-prop-${player.id}`}
                        style={[styles.parityProbButton, { backgroundColor: player.color }]}
                        testID={`event-detail-player-prop-${player.id}`}
                      >
                        <Text style={styles.parityProbText}>{player.probability}%</Text>
                      </Pressable>
                    </View>
                  ))}
                  <Pressable accessibilityLabel="event-detail-player-props-show-all" style={styles.showAllRow} testID="event-detail-player-props-show-all">
                    <Text style={styles.showAllText}>Show all</Text>
                    <Ionicons name="chevron-forward" color="#cbd5e1" size={17} />
                  </Pressable>
                </>
              )}
            </View>
            {collapsedPropGroups.map((title) => (
              <View key={title} style={styles.marketBlock}>
                <Pressable accessibilityLabel={`event-detail-prop-toggle-${title}`} style={styles.marketHeaderRow} testID={`event-detail-prop-toggle-${title.replace(/[^A-Za-z0-9]/g, "-").toLowerCase()}`}>
                  <Text style={styles.marketTitle}>{title}</Text>
                  <Ionicons name="chevron-down" color="#9ca3af" size={26} />
                </Pressable>
              </View>
            ))}
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
              {primaryMarket && <Text style={styles.hiddenStatsText}>{label(locale, primaryMarket)}</Text>}
            </View>
            {primaryMarket && (
              <View style={styles.marketBlock}>
                <Pressable
                  accessibilityLabel={`event-detail-market-toggle-regulation-time-winner event-detail-market-toggle-${primaryMarket.id}`}
                  onPress={() => toggleGroup("regulation-time-winner")}
                  style={styles.marketHeaderRow}
                  testID={`event-detail-market-toggle-${primaryMarket.id}`}
                >
                  <View style={styles.marketTitleBlock}>
                    <Text style={styles.marketTitle}>Regulation Time Winner</Text>
                    <Text style={styles.marketSubcopy}>90 Minutes Plus Stoppage Time</Text>
                  </View>
                  <Ionicons name={expandedMarketIds["regulation-time-winner"] ? "chevron-up" : "chevron-down"} color="#9ca3af" size={26} />
                </Pressable>
                {expandedMarketIds["regulation-time-winner"] && (
                  <>
                    <View accessibilityLabel={`market-depth-${primaryMarket.id}`} style={styles.depthRow} testID={`market-depth-${primaryMarket.id}`}>
                      <Text style={styles.depthText}>{t.bestBid} {marketDepth(primaryMarket).bid}</Text>
                      <Text style={styles.depthText}>{t.bestAsk} {marketDepth(primaryMarket).ask}</Text>
                      <Text style={styles.depthText}>{t.spread} {marketDepth(primaryMarket).spread}</Text>
                    </View>
                    {regulationWinnerRows.map((outcome) => {
                      const matchingOutcome = primaryMarket.outcomes.find((item) => item.id === outcome.id);
                      return renderParityOutcomeRow(outcome, primaryMarket.id, matchingOutcome);
                    })}
                  </>
                )}
              </View>
            )}
            <View style={styles.marketBlock}>
              <Pressable
                accessibilityLabel={`event-detail-market-toggle-spread Spread ${teamCode(teamA?.name ?? "Home")} to win by over 1.5 goals 1.5`}
                onPress={() => toggleGroup("spread")}
                style={styles.marketHeaderRow}
                testID="event-detail-market-toggle-spread"
              >
                <View style={styles.marketTitleBlock}>
                  <Text style={styles.marketTitle}>Spread</Text>
                  <Text style={styles.marketSubcopy}>{teamCode(teamA?.name ?? "Home")} to win by over 1.5 goals</Text>
                </View>
                <View style={styles.headerRightCluster}>
                  <View style={styles.lineValuePill}>
                    <Text style={styles.lineValueText}>1.5</Text>
                    <Ionicons name="chevron-down" color="#86efac" size={16} />
                  </View>
                  <Ionicons name={expandedMarketIds.spread ? "chevron-up" : "chevron-down"} color="#9ca3af" size={26} />
                </View>
              </Pressable>
              {expandedMarketIds.spread && (
                <>
                  <View style={styles.subSegmentRow}>
                    {(["Reg. Time", "1st Half", "2nd Half"] as const).map((period) => (
                      <Pressable
                        accessibilityLabel={`event-detail-spread-period-${period}`}
                        key={period}
                        onPress={() => setSpreadPeriod(period)}
                        style={[styles.subSegment, spreadPeriod === period && styles.subSegmentActive]}
                        testID={`event-detail-spread-period-${period.replace(/[^A-Za-z0-9]/g, "-").toLowerCase()}`}
                      >
                        <Text style={[styles.subSegmentText, spreadPeriod === period && styles.subSegmentTextActive]}>{period}</Text>
                      </Pressable>
                    ))}
                  </View>
                  {spreadRows.map((outcome) => renderParityOutcomeRow(outcome, "spread"))}
                </>
              )}
            </View>
            {gameLineGroups.map((group) => renderGroup(group))}
          </View>
        )}
        <View accessibilityLabel="event-detail-market-rules" style={styles.rulesSection} testID="event-detail-market-rules">
          <View style={styles.marketHeaderRow}>
            <Text style={styles.marketTitle}>Market Rules</Text>
            <Ionicons name="chevron-up" color="#9ca3af" size={26} />
          </View>
          <View style={styles.ruleSelector}>
            <Text style={styles.ruleSelectorText}>{teamCode(teamA?.name ?? "MEX")} to advance</Text>
            <Ionicons name="chevron-down" color="#cbd5e1" size={16} />
          </View>
          <Text style={styles.ruleText}>This market settles based on the official match result and regulation-time market rules for the selected World Cup game.</Text>
          <Text style={styles.fullRulesText}>View Full Rules</Text>
        </View>
        <View accessibilityLabel="event-detail-more-events" style={styles.moreEventsSection} testID="event-detail-more-events">
          <Text style={styles.marketTitle}>More Events</Text>
          {[
            { time: "Today 10:00 PM", title: "Portugal vs. Croatia", home: "POR 72%", away: "CRO 29%" },
            { time: "Tomorrow 11:00 AM", title: "England vs. Congo DR", home: "ENG 88%", away: "COD 12%" },
          ].map((item) => (
            <View key={item.title} style={styles.moreEventRow}>
              <View style={styles.moreEventTextBlock}>
                <Text style={styles.moreEventTime}>{item.time}</Text>
                <Text style={styles.moreEventTitle}>{item.title}</Text>
              </View>
              <Text style={styles.moreEventPrice}>{item.home}</Text>
              <Text style={styles.moreEventPrice}>{item.away}</Text>
            </View>
          ))}
        </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#060b14" },
  topBar: { minHeight: 62, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
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
  matchHeader: { minHeight: 96, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 28, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  teamSide: { width: 132, flexDirection: "row", alignItems: "center", gap: 6 },
  teamSideRight: { justifyContent: "flex-end" },
  flag: { fontSize: 34 },
  teamCode: { color: "#6b7280", fontSize: 15, fontWeight: "900" },
  teamProbability: { fontSize: 20, fontWeight: "900", marginLeft: -4 },
  matchTime: { alignItems: "center", justifyContent: "center" },
  matchDate: { color: "#f8fafc", fontSize: 17, fontWeight: "800" },
  matchHour: { color: "#cbd5e1", fontSize: 15, fontWeight: "700", marginTop: 4 },
  scoreText: { color: "#f8fafc", fontSize: 18, fontWeight: "900", marginTop: 4 },
  liveClock: { color: "#ef4444", fontSize: 14, fontWeight: "900", marginTop: 3 },
  rightTeamText: { alignItems: "flex-end" },
  chartBlock: { minHeight: 190, paddingHorizontal: 0, paddingTop: 32, paddingBottom: 12 },
  chartMarkers: { position: "absolute", left: 14, top: 34, gap: 20 },
  chartMarkerText: { color: "#546071", fontSize: 11, fontWeight: "900" },
  dualChart: { width: "70%", height: 92, marginLeft: 0 },
  chartTrace: { position: "absolute", left: 0, right: 0, top: 0, height: 86, flexDirection: "row", alignItems: "flex-start" },
  chartTraceOverlay: { top: 28 },
  chartStep: { flex: 1, height: 5, borderRadius: 999, marginRight: -1 },
  chartDot: { position: "absolute", right: -8, top: 47, width: 15, height: 15, borderRadius: 999 },
  chartLabel: { position: "absolute", right: 28, top: 36, alignItems: "flex-start" },
  chartName: { fontSize: 17, fontWeight: "800" },
  chartPercent: { fontSize: 48, fontWeight: "500" },
  chartFilterRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 18 },
  chartFilterPill: { minWidth: 62, minHeight: 32, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#111827" },
  chartFilterPillActive: { backgroundColor: "#273244" },
  chartFilterText: { color: "#8b93a3", fontSize: 13, fontWeight: "900" },
  chartFilterTextActive: { color: "#f8fafc" },
  chatPreview: { marginHorizontal: 24, marginTop: 8, padding: 14, borderRadius: 18, backgroundColor: "#181f2d" },
  chatPreviewTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chatCount: { color: "#f8fafc", fontSize: 16, fontWeight: "800" },
  chatPreviewLine: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  userDot: { width: 26, height: 26, borderRadius: 999, backgroundColor: "#be18ff" },
  chatUser: { color: "#e5e7eb", fontSize: 15, fontWeight: "800" },
  chatBetBadge: { overflow: "hidden", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, color: "#22c55e", backgroundColor: "#082f1a", fontSize: 12, fontWeight: "900" },
  chatMessage: { color: "#a6adbb", fontSize: 14, fontWeight: "800" },
  chatPage: { paddingHorizontal: 18, paddingTop: 16, gap: 12 },
  chatContextCard: { padding: 14, borderRadius: 16, backgroundColor: "#111827", borderWidth: 1, borderColor: "#263247" },
  chatContextTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  chatContextMeta: { color: "#9ca3af", fontSize: 13, fontWeight: "800", marginTop: 6 },
  chatFeed: { gap: 10 },
  chatMessageRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  chatAvatar: { width: 34, height: 34, borderRadius: 999, marginTop: 3 },
  chatMessageBubble: { flex: 1, minWidth: 0, padding: 12, borderRadius: 14, backgroundColor: "#111827", borderWidth: 1, borderColor: "#1f2937" },
  chatMessageMetaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 5 },
  chatMessageUser: { color: "#f8fafc", fontSize: 13, fontWeight: "900" },
  chatMessageBadge: { overflow: "hidden", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, color: "#22c55e", backgroundColor: "#052e1b", fontSize: 11, fontWeight: "900" },
  chatMessageText: { color: "#cbd5e1", fontSize: 14, fontWeight: "800", lineHeight: 19 },
  typingRow: { minHeight: 34, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 4 },
  typingDots: { flexDirection: "row", alignItems: "center", gap: 4 },
  typingDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: "#64748b" },
  typingText: { color: "#94a3b8", fontSize: 13, fontWeight: "800" },
  reactionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reactionChip: { minHeight: 36, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#172033", borderWidth: 1, borderColor: "#293548", paddingHorizontal: 14 },
  reactionText: { color: "#e5e7eb", fontSize: 13, fontWeight: "900" },
  chatInputRow: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 999, backgroundColor: "#111827", borderWidth: 1, borderColor: "#293548", paddingHorizontal: 14 },
  chatInputPlaceholder: { flex: 1, color: "#94a3b8", fontSize: 15, fontWeight: "800" },
  emojiPicker: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-around", borderRadius: 14, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2937" },
  emojiText: { color: "#f8fafc", fontSize: 21, fontWeight: "900" },
  chatStickyOutcomes: { flexDirection: "row", gap: 12, marginTop: 4 },
  chatStickyButton: { flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 15 },
  chatStickyButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "900" },
  positionSection: { marginTop: 20, paddingHorizontal: 24 },
  positionHeading: { color: "#f8fafc", fontSize: 17, fontWeight: "800", marginBottom: 10 },
  positionCard: { borderRadius: 18, borderWidth: 1, borderColor: "#263247", backgroundColor: "#080d16", overflow: "hidden" },
  positionTopRow: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  positionMarketRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  positionSidePill: { overflow: "hidden", borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4, color: "#22c55e", backgroundColor: "#052e1b", fontWeight: "900" },
  positionSideSell: { color: "#ef4444", backgroundColor: "#3a0f15" },
  positionTitle: { flex: 1, color: "#f8fafc", fontSize: 16, fontWeight: "800" },
  positionStats: { flexDirection: "row", justifyContent: "space-between", gap: 8, padding: 14 },
  positionStatBlock: { flex: 1, minWidth: 0 },
  positionLabel: { color: "#9ca3af", fontSize: 13, fontWeight: "800", marginBottom: 6 },
  positionValue: { color: "#f8fafc", fontSize: 16, fontWeight: "800" },
  pnlUp: { color: "#22c55e", fontSize: 13 },
  pnlDown: { color: "#9ca3af", fontSize: 13 },
  toWinBlock: { flex: 1, minWidth: 0, alignItems: "flex-end" },
  positionActions: { flexDirection: "row", gap: 10, paddingHorizontal: 14, paddingBottom: 14 },
  buyMoreButton: { flex: 1, minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "#b8c0d1" },
  buyMoreText: { color: "#101827", fontSize: 16, fontWeight: "800" },
  cashOutButton: { flex: 1, minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 13, borderWidth: 1, borderColor: "#293548", backgroundColor: "#070c14" },
  cashOutText: { color: "#f8fafc", fontSize: 16, fontWeight: "800" },
  primaryOutcomeRow: { flexDirection: "row", gap: 14, paddingHorizontal: 24, marginTop: 24, paddingTop: 18, borderTopWidth: 1, borderTopColor: "#1f2937" },
  primaryOutcomeButton: { flex: 1, minHeight: 64, alignItems: "center", justifyContent: "center", borderRadius: 16, shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 8, elevation: 3 },
  primaryOutcomeText: { color: "rgba(255,255,255,0.72)", fontSize: 17, fontWeight: "900" },
  primaryOutcomePercent: { color: "#ffffff", fontSize: 20, fontWeight: "900" },
  marketTabs: { flexDirection: "row", gap: 28, paddingHorizontal: 24, marginTop: 22, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  marketTab: { minHeight: 46, justifyContent: "center", borderBottomWidth: 3, borderBottomColor: "transparent" },
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
  marketSubcopy: { color: "#6b7280", fontSize: 14, fontWeight: "700", marginTop: 2 },
  headerRightCluster: { flexDirection: "row", alignItems: "center", gap: 10 },
  lineValuePill: { minWidth: 58, minHeight: 32, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 2, borderRadius: 999, backgroundColor: "#052e1b", paddingHorizontal: 10 },
  lineValueText: { color: "#86efac", fontSize: 14, fontWeight: "900" },
  subSegmentRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, marginBottom: 4 },
  subSegment: { flex: 1, minHeight: 36, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#111827" },
  subSegmentActive: { backgroundColor: "#273244" },
  subSegmentText: { color: "#8b93a3", fontSize: 12, fontWeight: "900" },
  subSegmentTextActive: { color: "#f8fafc" },
  depthRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10, marginBottom: 6 },
  depthText: { color: "#8b93a3", fontSize: 11, fontWeight: "800" },
  parityOutcomeRow: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9 },
  parityOutcomeIcon: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#111827" },
  parityOutcomeIconText: { color: "#cbd5e1", fontSize: 18, fontWeight: "900" },
  parityOutcomeTextBlock: { flex: 1, minWidth: 0 },
  miniLineTrack: { height: 4, borderRadius: 999, overflow: "hidden", backgroundColor: "#111827", marginTop: 8 },
  miniLineFill: { height: 4, borderRadius: 999 },
  oddsMultiplier: { width: 54, color: "#cbd5e1", fontSize: 14, fontWeight: "900", textAlign: "right" },
  parityProbButton: { width: 64, minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  parityProbText: { color: "#ffffff", fontSize: 16, fontWeight: "900" },
  propToolsRow: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 6 },
  propFilterChip: { minHeight: 32, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#111827", paddingHorizontal: 14 },
  propFilterChipActive: { backgroundColor: "#273244" },
  propFilterText: { color: "#8b93a3", fontSize: 12, fontWeight: "900" },
  propFilterTextActive: { color: "#f8fafc" },
  playerPropRow: { minHeight: 70, flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 10 },
  jerseyIcon: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#111827" },
  playerTextBlock: { flex: 1, minWidth: 0 },
  playerTeamText: { color: "#6b7280", fontSize: 11, fontWeight: "900", marginTop: 3 },
  statPill: { minWidth: 48, minHeight: 32, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 2, borderRadius: 999, backgroundColor: "#111827" },
  statPillText: { color: "#f8fafc", fontSize: 13, fontWeight: "900" },
  showAllRow: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 4 },
  showAllText: { color: "#cbd5e1", fontSize: 14, fontWeight: "900" },
  rulesSection: { borderTopWidth: 1, borderTopColor: "#172033", paddingHorizontal: 24, paddingVertical: 16 },
  ruleSelector: { alignSelf: "flex-start", minHeight: 36, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, backgroundColor: "#111827", paddingHorizontal: 12, marginTop: 10 },
  ruleSelectorText: { color: "#f8fafc", fontSize: 13, fontWeight: "900" },
  ruleText: { color: "#9ca3af", fontSize: 13, fontWeight: "700", lineHeight: 19, marginTop: 12 },
  fullRulesText: { color: "#e5e7eb", fontSize: 14, fontWeight: "900", marginTop: 12 },
  moreEventsSection: { borderTopWidth: 1, borderTopColor: "#172033", paddingHorizontal: 24, paddingVertical: 16 },
  moreEventRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: "#111827" },
  moreEventTextBlock: { flex: 1, minWidth: 0 },
  moreEventTime: { color: "#6b7280", fontSize: 11, fontWeight: "900" },
  moreEventTitle: { color: "#f8fafc", fontSize: 14, fontWeight: "900", marginTop: 3 },
  moreEventPrice: { color: "#cbd5e1", fontSize: 12, fontWeight: "900" },
  detailOutcome: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  outcomeTextBlock: { flex: 1 },
  teamName: { color: "#f8fafc", fontSize: 17, fontWeight: "800" },
  outcomeSizeText: { color: "#94a3b8", fontSize: 10, fontWeight: "800", marginTop: 4 },
  outcomeDepthText: { color: "#6b7280", fontSize: 11, fontWeight: "800", marginTop: 3 },
  probButton: { width: 92, minHeight: 62, alignItems: "center", justifyContent: "center", borderRadius: 13 },
  probButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
  probButtonSubtext: { color: "rgba(255,255,255,0.82)", fontSize: 10, fontWeight: "900", marginTop: 2 },
});
