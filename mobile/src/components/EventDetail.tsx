import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import {
  estimatedPositionPnl,
  portfolioPositionValue,
} from "../domain/portfolioPositionMetrics";
import type { Event, Locale, Market, Outcome } from "../mocks/worldCup";
import { label, money } from "../presentation/formatters";
import type { Position } from "./Portfolio";
import type { TicketSelection } from "./TradeTicket";

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
  ticketOutcome?: Outcome;
  ticketSelection?: TicketSelection;
};

type GameLineGroup = {
  id: string;
  title: string;
  subtitle?: string;
  rows: DisplayOutcome[];
  lineValue?: string;
  lineOptions?: string[];
  selectedPeriod?: LinePeriod;
  onSelectPeriod?: (period: LinePeriod) => void;
  onSelectLine?: (line: string) => void;
};

type LinePeriod = "Reg. Time" | "1st Half" | "2nd Half";

const linePeriods: LinePeriod[] = ["Reg. Time", "1st Half", "2nd Half"];

const linePeriodCode = (period: LinePeriod) => period === "Reg. Time" ? "RT" : period === "1st Half" ? "1H" : "2H";

const boundedProbability = (value: number) => Math.max(1, Math.min(99, Math.round(value)));

const withLineOutcome = (base: Omit<Outcome, "zhLabel"> & Partial<Pick<Outcome, "zhLabel">>): Outcome => ({
  ...base,
  zhLabel: base.zhLabel ?? base.label,
});

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
  openTicket: (market: Market, outcome: Outcome, event?: Event, side?: "buy" | "sell", selection?: TicketSelection) => void;
  defaultSide: "buy" | "sell";
  goBack: () => void;
  isSaved: boolean;
  toggleSavedEvent: (event: Event) => void;
  positions?: Position[];
  closePosition?: (position: Position) => void;
  openPositionTrade?: (position: Position, side: "buy" | "sell") => void;
}) {
  const [activeTab, setActiveTab] = useState<"game-lines" | "exact-score" | "halves" | "player-props">("game-lines");
  const [activeLineDetailTab, setActiveLineDetailTab] = useState<"order-book" | "graph" | "about">("order-book");
  const [activeHeaderTab, setActiveHeaderTab] = useState<"game" | "chat">("game");
  const [activeBodyTab, setActiveBodyTab] = useState<"market" | "live-stats">("market");
  const [chartFilter, setChartFilter] = useState<ChartFilter>("Game");
  const [selectedChartPoint, setSelectedChartPoint] = useState<"latest" | "mid" | "target">("latest");
  const [spreadPeriod, setSpreadPeriod] = useState<LinePeriod>("Reg. Time");
  const [spreadLine, setSpreadLine] = useState("1.5");
  const [totalsPeriod, setTotalsPeriod] = useState<LinePeriod>("Reg. Time");
  const [totalsLine, setTotalsLine] = useState("2.5");
  const [savedNoticeVisible, setSavedNoticeVisible] = useState(false);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [orderBookVisible, setOrderBookVisible] = useState(false);
  const [compactHeaderVisible, setCompactHeaderVisible] = useState(false);
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
  const selectedChartProbability = selectedChartOutcome?.probability ?? 0;
  const chartPointMeta = selectedChartPoint === "target"
    ? { label: "Target", value: `${Math.max(1, selectedChartProbability + 4)}%`, time: "Target line" }
    : selectedChartPoint === "mid"
      ? { label: "2H", value: `${Math.max(1, selectedChartProbability - 2)}%`, time: "Mid chart" }
      : { label: "Current", value: `${selectedChartProbability}%`, time: event.status === "live" ? "Live now" : event.startsAt };
  const liveClock = event.status === "live"
    ? event.startsAt.replace("Live", "").replace("·", "").trim()
    : "15'";
  const scoreboard = event.status === "live" ? "0 - 0" : "0 - 0";
  const handleScroll = (eventScroll: NativeSyntheticEvent<NativeScrollEvent>) => {
    const shouldShow = eventScroll.nativeEvent.contentOffset.y > 500;
    setCompactHeaderVisible((visible) => visible === shouldShow ? visible : shouldShow);
  };
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
  const spreadLineOptions = ["0.5", "1.5", "2.5"];
  const totalsLineOptions = ["1.5", "2.5", "3.5"];
  const homeCode = teamCode(teamA?.name ?? "Home");
  const spreadProbability = boundedProbability(
    34
    - (spreadLine === "0.5" ? -14 : spreadLine === "2.5" ? 18 : 0)
    - (spreadPeriod === "1st Half" ? 13 : spreadPeriod === "2nd Half" ? 5 : 0),
  );
  const totalsOverProbability = boundedProbability(
    52
    + (totalsLine === "1.5" ? 18 : totalsLine === "3.5" ? -17 : 0)
    + (totalsPeriod === "1st Half" ? -20 : totalsPeriod === "2nd Half" ? -13 : 0),
  );
  const makeLineMarket = (id: string, title: string, outcomes: Outcome[]): Market => ({
    id,
    title,
    zhTitle: title,
    type: "game-line",
    outcomes,
  });
  const spreadMarket = makeLineMarket(`${event.id}-spread-${spreadLine}-${linePeriodCode(spreadPeriod)}`, `Spread ${homeCode} -${spreadLine} ${linePeriodCode(spreadPeriod)}`, []);
  const spreadYesOutcome = withLineOutcome({
    id: `${spreadMarket.id}-yes`,
    label: `${homeCode} -${spreadLine} ${linePeriodCode(spreadPeriod)}`,
    probability: spreadProbability,
    bestBid: Math.max(spreadProbability - 3, 1),
    bestAsk: Math.min(spreadProbability + 4, 99),
    color: leftOutcome?.color ?? "#22c55e",
  });
  const spreadNoOutcome = withLineOutcome({
    id: `${spreadMarket.id}-no`,
    label: `No ${homeCode} -${spreadLine} ${linePeriodCode(spreadPeriod)}`,
    probability: boundedProbability(100 - spreadProbability),
    bestBid: Math.max(100 - spreadProbability - 3, 1),
    bestAsk: Math.min(100 - spreadProbability + 4, 99),
    color: "#64748b",
  });
  spreadMarket.outcomes = [spreadYesOutcome, spreadNoOutcome];
  const spreadRows: DisplayOutcome[] = [
    {
      id: "spread-yes",
      label: `Yes, ${homeCode} -${spreadLine}`,
      color: leftOutcome?.color ?? "#22c55e",
      probability: spreadYesOutcome.probability,
      odds: `${outcomeOdds(spreadYesOutcome)}x`,
      icon: "Y",
      miniLine: spreadYesOutcome.probability,
      ticketOutcome: spreadYesOutcome,
      ticketSelection: { marketType: "spread", line: spreadLine, period: spreadPeriod, displayLabel: `${homeCode} -${spreadLine} ${linePeriodCode(spreadPeriod)}` },
    },
    {
      id: "spread-no",
      label: "No",
      color: "#64748b",
      probability: spreadNoOutcome.probability,
      odds: `${outcomeOdds(spreadNoOutcome)}x`,
      icon: "N",
      miniLine: spreadNoOutcome.probability,
      ticketOutcome: spreadNoOutcome,
      ticketSelection: { marketType: "spread", line: spreadLine, period: spreadPeriod, displayLabel: `No ${homeCode} -${spreadLine} ${linePeriodCode(spreadPeriod)}` },
    },
  ];
  const totalsMarket = makeLineMarket(`${event.id}-totals-${totalsLine}-${linePeriodCode(totalsPeriod)}`, `Totals ${totalsLine} ${linePeriodCode(totalsPeriod)}`, []);
  const totalsOverOutcome = withLineOutcome({
    id: `${totalsMarket.id}-over`,
    label: `Over ${totalsLine} ${linePeriodCode(totalsPeriod)}`,
    probability: totalsOverProbability,
    bestBid: Math.max(totalsOverProbability - 3, 1),
    bestAsk: Math.min(totalsOverProbability + 4, 99),
    color: "#22c55e",
  });
  const totalsUnderOutcome = withLineOutcome({
    id: `${totalsMarket.id}-under`,
    label: `Under ${totalsLine} ${linePeriodCode(totalsPeriod)}`,
    probability: boundedProbability(100 - totalsOverProbability),
    bestBid: Math.max(100 - totalsOverProbability - 3, 1),
    bestAsk: Math.min(100 - totalsOverProbability + 4, 99),
    color: "#64748b",
  });
  totalsMarket.outcomes = [totalsOverOutcome, totalsUnderOutcome];
  const gameLineGroups: GameLineGroup[] = [
    {
      id: "totals",
      title: "Totals",
      subtitle: `Total goals over ${totalsLine}`,
      lineValue: totalsLine,
      lineOptions: totalsLineOptions,
      selectedPeriod: totalsPeriod,
      onSelectPeriod: setTotalsPeriod,
      onSelectLine: setTotalsLine,
      rows: [
        {
          id: "totals-over",
          label: `Over ${totalsLine}`,
          color: "#22c55e",
          probability: totalsOverOutcome.probability,
          odds: `${outcomeOdds(totalsOverOutcome)}x`,
          icon: "O",
          miniLine: totalsOverOutcome.probability,
          ticketOutcome: totalsOverOutcome,
          ticketSelection: { marketType: "totals", line: totalsLine, period: totalsPeriod, displayLabel: `Over ${totalsLine} ${linePeriodCode(totalsPeriod)}` },
        },
        {
          id: "totals-under",
          label: `Under ${totalsLine}`,
          color: "#64748b",
          probability: totalsUnderOutcome.probability,
          odds: `${outcomeOdds(totalsUnderOutcome)}x`,
          icon: "U",
          miniLine: totalsUnderOutcome.probability,
          ticketOutcome: totalsUnderOutcome,
          ticketSelection: { marketType: "totals", line: totalsLine, period: totalsPeriod, displayLabel: `Under ${totalsLine} ${linePeriodCode(totalsPeriod)}` },
        },
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

  const renderMarketTabs = (mode: "inline" | "sticky" = "inline") => {
    const tabs =
      mode === "sticky"
        ? [
            { id: "game-lines", label: "Game Lines" },
            { id: "player-props", label: "Player Props" },
          ]
        : [
            { id: "game-lines", label: "Game Lines" },
            { id: "exact-score", label: "Exact Score" },
            { id: "halves", label: "Halves" },
            { id: "player-props", label: "Player Props" },
          ];

    return (
      <View
        accessibilityLabel={mode === "sticky" ? "event-detail-sticky-market-tabs Game Lines Player Props" : "event-detail-market-tabs"}
        style={[styles.marketTabs, mode === "sticky" && styles.stickyMarketTabs]}
        testID={mode === "sticky" ? "event-detail-sticky-market-tabs" : "event-detail-market-tabs"}
      >
        {tabs.map((tab) => (
          <Pressable
            accessibilityLabel={`event-detail-${tab.id}-tab`}
            key={tab.id}
            onPress={() => setActiveTab(tab.id as typeof activeTab)}
            style={[styles.marketTab, activeTab === tab.id && styles.marketTabActive]}
            testID={mode === "sticky" ? `event-detail-sticky-${tab.id}-tab` : `event-detail-${tab.id}-tab`}
          >
            <Text style={[styles.marketTabText, activeTab === tab.id && styles.marketTabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
    );
  };

  const renderTeamToAdvanceCard = () => {
    if (!primaryMarket) return null;
    return (
      <View accessibilityLabel="event-detail-team-to-advance-card" style={styles.polymarketLineCard} testID="event-detail-team-to-advance-card">
        <View style={styles.marketTitleBlock}>
          <View style={styles.lineCardTitleRow}>
            <Text style={styles.marketTitle}>Team to Advance</Text>
            <Ionicons name="information-circle-outline" color="#64748b" size={19} />
          </View>
          <Text style={styles.marketSubcopy}>$60.9K Vol.</Text>
        </View>
        <View style={styles.lineOutcomeButtonRow}>
          {primaryOutcomes.map((outcome, index) => (
            <Pressable
              accessibilityLabel={`event-detail-team-advance-${outcome.id}`}
              key={outcome.id}
              onPress={() => openTicket(primaryMarket, outcome, event, defaultSide, { marketType: "winner", displayLabel: "Team to Advance" })}
              style={styles.lineOutcomeButton}
              testID={`event-detail-team-advance-${outcome.id}`}
            >
              <Text style={styles.lineOutcomeButtonText}>{teamCode(outcome.label)} {index === 0 ? "52¢" : "49¢"}</Text>
            </Pressable>
          ))}
        </View>
        <View accessibilityLabel="event-detail-line-detail-tabs" style={styles.lineDetailTabs} testID="event-detail-line-detail-tabs">
          {[
            { id: "order-book", label: "Order Book" },
            { id: "graph", label: "Graph" },
            { id: "about", label: "About" },
          ].map((tab) => (
            <Pressable
              accessibilityLabel={`event-detail-line-detail-${tab.id}`}
              key={tab.id}
              onPress={() => setActiveLineDetailTab(tab.id as typeof activeLineDetailTab)}
              style={styles.lineDetailTab}
              testID={`event-detail-line-detail-${tab.id}`}
            >
              <Text style={[styles.lineDetailTabText, activeLineDetailTab === tab.id && styles.lineDetailTabTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
          <Ionicons name="cash-outline" color="#fbbf24" size={22} />
          <Ionicons name="gift-outline" color="#94a3b8" size={22} />
          <Ionicons name="swap-horizontal-outline" color="#94a3b8" size={22} />
          <Ionicons name="refresh-outline" color="#94a3b8" size={22} />
        </View>
        {activeLineDetailTab === "order-book" ? (
          <View accessibilityLabel="event-detail-inline-order-book" style={styles.inlineOrderBook} testID="event-detail-inline-order-book">
            <View style={styles.inlineOrderBookHeader}>
              <Text style={styles.inlineBookHeaderText}>PRICE</Text>
              <Text style={styles.inlineBookHeaderText}>SHARES</Text>
              <Text style={styles.inlineBookHeaderText}>TOTAL</Text>
            </View>
            {[55, 54].map((price, index) => (
              <View key={price} style={styles.inlineBookRow}>
                <Text style={styles.inlineBookPrice}>{price}¢</Text>
                <Text style={styles.inlineBookText}>{index === 0 ? "8,070.50" : "246,972.30"}</Text>
                <Text style={styles.inlineBookText}>{index === 0 ? "$293,440.88" : "$289,002.10"}</Text>
              </View>
            ))}
          </View>
        ) : activeLineDetailTab === "graph" ? (
          <View accessibilityLabel="event-detail-inline-graph" style={styles.inlineGraph} testID="event-detail-inline-graph">
            <View style={styles.inlineGraphLine} />
            <Text style={styles.inlineGraphText}>Line movement for Team to Advance</Text>
          </View>
        ) : (
          <View accessibilityLabel="event-detail-inline-about" style={styles.inlineAbout} testID="event-detail-inline-about">
            <Text style={styles.inlineAboutText}>This market resolves to the team that advances from this World Cup matchup.</Text>
          </View>
        )}
      </View>
    );
  };

  const renderExactScore = () => (
    <View accessibilityLabel="event-detail-exact-score" testID="event-detail-exact-score">
      <View style={styles.polymarketLineCard}>
        <Text style={styles.marketTitle}>Exact Score</Text>
        <Text style={styles.marketSubcopy}>Correct score at full time</Text>
        {["0-0", "1-0", "0-1", "1-1"].map((score, index) => (
          <View key={score} style={styles.exactScoreRow}>
            <Text style={styles.exactScoreText}>{score}</Text>
            <Pressable accessibilityLabel={`event-detail-exact-score-${score}`} style={styles.exactScoreButton} testID={`event-detail-exact-score-${score}`}>
              <Text style={styles.exactScoreButtonText}>{[11, 14, 13, 16][index]}¢</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );

  const renderHalves = () => (
    <View accessibilityLabel="event-detail-halves" testID="event-detail-halves">
      {gameLineGroups.filter((group) => group.id === "first-half-winner" || group.id === "second-half-winner").map((group) => renderGroup(group))}
    </View>
  );

  const renderOrderBook = () => {
    if (!primaryMarket) return null;
    return (
      <View accessibilityLabel="event-detail-order-book-screen" style={styles.orderBookOverlay} testID="event-detail-order-book-screen">
        <View style={styles.orderBookHeader}>
          <View>
            <Text style={styles.orderBookTitle}>Order Book</Text>
            <Text style={styles.orderBookSubtitle}>{label(locale, event)} - {label(locale, primaryMarket)}</Text>
          </View>
          <Pressable accessibilityLabel="event-detail-order-book-close" onPress={() => setOrderBookVisible(false)} style={styles.orderBookClose} testID="event-detail-order-book-close">
            <Ionicons name="close" color="#f8fafc" size={22} />
          </Pressable>
        </View>
        <View style={styles.orderBookSummary}>
          <Text style={styles.orderBookSummaryText}>{t.bestBid} {marketDepth(primaryMarket).bid}</Text>
          <Text style={styles.orderBookSummaryText}>{t.bestAsk} {marketDepth(primaryMarket).ask}</Text>
          <Text style={styles.orderBookSummaryText}>{t.spread} {marketDepth(primaryMarket).spread}</Text>
        </View>
        <ScrollView style={styles.orderBookScroll} contentContainerStyle={styles.orderBookPad}>
          {primaryMarket.outcomes.map((outcome) => {
            const depth = outcomeDepth(outcome);
            const fallbackBidSize = Math.max(Math.round(outcome.probability * 20), 100);
            const fallbackAskSize = Math.max(Math.round((100 - outcome.probability) * 25), 100);
            const bidSize = outcome.bestBidSize ?? fallbackBidSize;
            const askSize = outcome.bestAskSize ?? fallbackAskSize;
            const largest = Math.max(bidSize, askSize, 1);
            return (
              <View accessibilityLabel={`order-book-outcome-${outcome.id}`} key={outcome.id} style={styles.orderBookOutcome} testID={`order-book-outcome-${outcome.id}`}>
                <View style={styles.orderBookOutcomeTop}>
                  <View>
                    <Text style={styles.orderBookOutcomeTitle}>{label(locale, outcome)}</Text>
                    <Text style={styles.orderBookOutcomeMeta}>{outcome.probability}% - {outcomeOdds(outcome)}x</Text>
                  </View>
                  <View style={styles.orderBookActionRow}>
                    <Pressable accessibilityLabel={`order-book-buy-${outcome.id}`} onPress={() => openTicket(primaryMarket, outcome, event, "buy")} style={[styles.orderBookTradeButton, { backgroundColor: outcome.color }]} testID={`order-book-buy-${outcome.id}`}>
                      <Text style={styles.orderBookTradeText}>{t.buy}</Text>
                    </Pressable>
                    <Pressable accessibilityLabel={`order-book-sell-${outcome.id}`} onPress={() => openTicket(primaryMarket, outcome, event, "sell")} style={styles.orderBookSellButton} testID={`order-book-sell-${outcome.id}`}>
                      <Text style={styles.orderBookSellText}>{t.sell}</Text>
                    </Pressable>
                  </View>
                </View>
                <View style={styles.orderBookColumns}>
                  <View style={styles.orderBookColumn}>
                    <Text style={styles.orderBookColumnLabel}>{t.bestBid}</Text>
                    <Text style={styles.orderBookPrice}>{depth.bid}</Text>
                    <View style={styles.depthBarTrack}>
                      <View style={[styles.depthBidBar, { width: `${Math.max(12, (bidSize / largest) * 100)}%` }]} />
                    </View>
                    <Text style={styles.orderBookSize}>{formatSize(bidSize)} {t.shares}</Text>
                  </View>
                  <View style={styles.orderBookColumn}>
                    <Text style={styles.orderBookColumnLabel}>{t.bestAsk}</Text>
                    <Text style={styles.orderBookPrice}>{depth.ask}</Text>
                    <View style={styles.depthBarTrack}>
                      <View style={[styles.depthAskBar, { width: `${Math.max(12, (askSize / largest) * 100)}%` }]} />
                    </View>
                    <Text style={styles.orderBookSize}>{formatSize(askSize)} {t.shares}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
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
        onPress={() => {
          const ticketOutcome = outcome.ticketOutcome ?? matchingOutcome;
          if (!ticketOutcome) return;
          const ticketMarket = outcome.ticketSelection?.marketType === "spread" ? spreadMarket : outcome.ticketSelection?.marketType === "totals" ? totalsMarket : primaryMarket;
          if (ticketMarket) openTicket(ticketMarket, ticketOutcome, event, defaultSide, outcome.ticketSelection);
        }}
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
        <View style={styles.headerRightCluster}>
          {group.lineValue && (
            <View style={styles.lineValuePill}>
              <Text style={styles.lineValueText}>{group.lineValue}</Text>
              <Ionicons name="chevron-down" color="#86efac" size={16} />
            </View>
          )}
          <Ionicons name={expandedMarketIds[group.id] ? "chevron-up" : "chevron-down"} color="#9ca3af" size={26} />
        </View>
      </Pressable>
      {expandedMarketIds[group.id] && (
        <>
          {group.selectedPeriod && group.onSelectPeriod && (
            <View style={styles.subSegmentRow}>
              {linePeriods.map((period) => (
                <Pressable
                  accessibilityLabel={`event-detail-${group.id}-period-${period}`}
                  key={period}
                  onPress={() => group.onSelectPeriod?.(period)}
                  style={[styles.subSegment, group.selectedPeriod === period && styles.subSegmentActive]}
                  testID={`event-detail-${group.id}-period-${period.replace(/[^A-Za-z0-9]/g, "-").toLowerCase()}`}
                >
                  <Text style={[styles.subSegmentText, group.selectedPeriod === period && styles.subSegmentTextActive]}>{period}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {group.lineOptions && group.onSelectLine && (
            <View style={styles.lineRailRow}>
              {group.lineOptions.map((line) => (
                <Pressable
                  accessibilityLabel={`event-detail-${group.id}-line-${line}`}
                  key={line}
                  onPress={() => group.onSelectLine?.(line)}
                  style={[styles.lineRailOption, group.lineValue === line && styles.lineRailOptionActive]}
                  testID={`event-detail-${group.id}-line-${line.replace(".", "-")}`}
                >
                  <Text style={[styles.lineRailText, group.lineValue === line && styles.lineRailTextActive]}>{line}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {group.rows.map((outcome) => renderParityOutcomeRow(outcome, group.id))}
        </>
      )}
    </View>
  );
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
            accessibilityLabel="event-detail-top-order-book"
            onPress={() => {
              setOrderBookVisible(true);
              setShareSheetVisible(false);
            }}
            style={styles.iconButton}
            testID="event-detail-top-order-book"
          >
            <Ionicons name="book-outline" size={22} color="#f8fafc" />
          </Pressable>
          <Pressable
            accessibilityLabel="event-detail-share"
            onPress={() => {
              setShareSheetVisible(true);
              setSavedNoticeVisible(false);
            }}
            style={styles.iconButton}
            testID="event-detail-share"
          >
            <Ionicons name="share-outline" size={23} color="#f8fafc" />
          </Pressable>
        </View>
      </View>
      {savedNoticeVisible && (
        <Pressable accessibilityLabel="event-detail-save-notice" onPress={() => setSavedNoticeVisible(false)} style={styles.actionNotice} testID="event-detail-save-notice">
          <Ionicons name={isSaved ? "book" : "book-outline"} size={18} color="#bfdbfe" />
          <Text style={styles.actionNoticeText}>{isSaved ? "Saved to watchlist" : "Removed from watchlist"}</Text>
          <Text style={styles.actionNoticeDismiss}>Dismiss</Text>
        </Pressable>
      )}
      {shareSheetVisible && (
        <View accessibilityLabel="event-detail-share-sheet" style={styles.shareSheet} testID="event-detail-share-sheet">
          <View style={styles.shareSheetHeader}>
            <View>
              <Text style={styles.shareSheetTitle}>Share this market</Text>
              <Text style={styles.shareSheetSub}>{label(locale, event)}</Text>
            </View>
            <Pressable accessibilityLabel="event-detail-share-dismiss" onPress={() => setShareSheetVisible(false)} style={styles.shareDismissButton} testID="event-detail-share-dismiss">
              <Ionicons name="close" size={20} color="#f8fafc" />
            </Pressable>
          </View>
          <View style={styles.shareActionsRow}>
            {["Copy link", "Share to chat", "Invite"].map((item) => (
              <Pressable accessibilityLabel={`event-detail-share-action-${item}`} key={item} style={styles.shareActionButton} testID={`event-detail-share-action-${item.replace(/\s+/g, "-").toLowerCase()}`}>
                <Text style={styles.shareActionText}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
      {orderBookVisible && renderOrderBook()}
      {compactHeaderVisible && activeHeaderTab === "game" && (
        <View accessibilityLabel="event-detail-sticky-market-shell" style={styles.stickyMarketShell} testID="event-detail-sticky-market-shell">
          <View
            accessibilityLabel={`event-detail-compact-game-header ${teamA ? teamCode(teamA.name) : ""} ${leftOutcome?.probability ?? 0}% ${event.startsAt} ${teamB ? teamCode(teamB.name) : ""} ${rightOutcome?.probability ?? 0}% Game Lines Player Props`}
            style={styles.compactGameHeader}
            testID="event-detail-compact-game-header"
          >
            <View style={styles.compactTeamSide}>
              <Text style={styles.compactFlag}>{teamA?.flag ?? ""}</Text>
              <View>
                <Text style={styles.compactTeamCode}>{teamA ? teamCode(teamA.name) : ""}</Text>
                <Text style={[styles.compactProbability, { color: leftOutcome?.color ?? "#22c55e" }]}>{leftOutcome?.probability ?? 0}%</Text>
              </View>
            </View>
            <View style={styles.compactMatchCenter}>
              <Text style={styles.compactDate}>{event.startsAt.split(" ")[0] === "Today" ? "Today" : event.startsAt}</Text>
              <Text style={styles.compactTime}>{event.status === "live" ? liveClock : event.startsAt.replace(/^Today\s*/, "")}</Text>
            </View>
            <View style={[styles.compactTeamSide, styles.compactTeamRight]}>
              <View style={styles.compactRightText}>
                <Text style={styles.compactTeamCode}>{teamB ? teamCode(teamB.name) : ""}</Text>
                <Text style={[styles.compactProbability, { color: rightOutcome?.color ?? "#ef4444" }]}>{rightOutcome?.probability ?? 0}%</Text>
              </View>
              <Text style={styles.compactFlag}>{teamB?.flag ?? ""}</Text>
            </View>
          </View>
          {renderMarketTabs("sticky")}
        </View>
      )}

      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={80}
        style={styles.scroller}
        contentContainerStyle={styles.scrollPad}
      >
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
        <View accessibilityLabel="event-detail-body-switch" style={styles.bodySwitchSection} testID="event-detail-body-switch">
          <View style={styles.bodySwitchMeta}>
            <Text style={styles.bodySwitchVolume}>{stats.volume} Vol.</Text>
            <Text style={styles.bodySwitchSource}>Holiwyn</Text>
          </View>
          <View style={styles.bodySwitchTabs}>
            <Pressable
              accessibilityLabel="event-detail-body-tab-market"
              onPress={() => setActiveBodyTab("market")}
              style={[styles.bodySwitchTab, activeBodyTab === "market" && styles.bodySwitchTabActive]}
              testID="event-detail-body-tab-market"
            >
              <Ionicons name="analytics-outline" color={activeBodyTab === "market" ? "#38bdf8" : "#8b93a3"} size={18} />
              <Text style={[styles.bodySwitchTabText, activeBodyTab === "market" && styles.bodySwitchTabTextActive]}>Market</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="event-detail-body-tab-live-stats"
              onPress={() => setActiveBodyTab("live-stats")}
              style={[styles.bodySwitchTab, activeBodyTab === "live-stats" && styles.bodySwitchTabActive]}
              testID="event-detail-body-tab-live-stats"
            >
              <Ionicons name="bar-chart-outline" color={activeBodyTab === "live-stats" ? "#38bdf8" : "#8b93a3"} size={18} />
              <Text style={[styles.bodySwitchTabText, activeBodyTab === "live-stats" && styles.bodySwitchTabTextActive]}>Live stats</Text>
            </Pressable>
          </View>
        </View>

        {activeBodyTab === "live-stats" ? (
          <View accessibilityLabel="event-detail-live-stats-panel" style={styles.liveStatsPanel} testID="event-detail-live-stats-panel">
            <View style={styles.liveStatsHeader}>
              <Text style={styles.liveStatsTitle}>Live stats</Text>
              <Text style={styles.liveStatsStatus}>{event.status === "live" ? liveClock : "Pregame preview"}</Text>
            </View>
            {[
              { label: "Possession", home: "54%", away: "46%" },
              { label: "Shots", home: "8", away: "5" },
              { label: "Shots on target", home: "3", away: "2" },
              { label: "Corners", home: "4", away: "3" },
              { label: "Expected goals", home: "1.12", away: "0.84" },
            ].map((row) => (
              <View accessibilityLabel={`event-detail-live-stat-${row.label}`} key={row.label} style={styles.liveStatRow} testID={`event-detail-live-stat-${row.label.replace(/[^A-Za-z0-9]/g, "-").toLowerCase()}`}>
                <Text style={styles.liveStatValue}>{row.home}</Text>
                <View style={styles.liveStatMiddle}>
                  <Text style={styles.liveStatLabel}>{row.label}</Text>
                  <View style={styles.liveStatTrack}>
                    <View style={styles.liveStatFill} />
                  </View>
                </View>
                <Text style={styles.liveStatValue}>{row.away}</Text>
              </View>
            ))}
            <View accessibilityLabel="event-detail-live-stats-timeline" style={styles.liveStatsTimeline} testID="event-detail-live-stats-timeline">
              <Text style={styles.liveStatsTimelineTitle}>Match flow</Text>
              {["12' USA pressure", "28' Belgium counter", "41' Corner USA"].map((item) => (
                <Text key={item} style={styles.liveStatsTimelineText}>{item}</Text>
              ))}
            </View>
          </View>
        ) : (
          <>
        <Pressable
          accessibilityLabel={`event-detail-price-chart two outcome traces ${chartFilter} ${label(locale, selectedChartOutcome ?? event)} ${selectedChartProbability}% ${chartPointMeta.label} ${chartPointMeta.value} +$9 +$39 +$479 All Game Live`}
          onPress={() => setSelectedChartPoint((current) => current === "latest" ? "mid" : current === "mid" ? "target" : "latest")}
          style={styles.chartBlock}
          testID="event-detail-price-chart"
        >
          <View style={styles.chartMarkers}>
            <Text style={styles.chartMarkerText}>+$9</Text>
            <Text style={styles.chartMarkerText}>+$39</Text>
            <Text style={styles.chartMarkerText}>+$479</Text>
          </View>
          <View style={styles.chartReferenceLine}>
            <Text style={styles.chartReferenceText}>Target</Text>
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
            <View
              accessibilityLabel={`event-detail-chart-selected-point-${selectedChartPoint}`}
              style={[styles.chartSelectedPoint, selectedChartPoint === "mid" && styles.chartSelectedPointMid, selectedChartPoint === "target" && styles.chartSelectedPointTarget, { borderColor: selectedChartColor }]}
              testID={`event-detail-chart-selected-point-${selectedChartPoint}`}
            />
          </View>
          <View style={styles.chartLabel}>
            <Text style={[styles.chartName, { color: selectedChartColor }]}>{selectedChartOutcome ? label(locale, selectedChartOutcome) : label(locale, event)}</Text>
            <Text style={[styles.chartPercent, { color: selectedChartColor }]}>{selectedChartOutcome?.probability ?? 0}%</Text>
          </View>
          <View accessibilityLabel={`event-detail-chart-tooltip ${chartPointMeta.label} ${chartPointMeta.value} ${chartPointMeta.time}`} style={styles.chartTooltip} testID="event-detail-chart-tooltip">
            <Text style={styles.chartTooltipLabel}>{chartPointMeta.label}</Text>
            <Text style={[styles.chartTooltipValue, { color: selectedChartColor }]}>{chartPointMeta.value}</Text>
            <Text style={styles.chartTooltipTime}>{chartPointMeta.time}</Text>
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
        </Pressable>

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

        {renderMarketTabs()}

        {activeTab === "player-props" ? (
          <View
            accessibilityLabel="event-detail-player-props event-detail-player-props-empty Player Props unavailable for this match"
            style={styles.emptyProps}
            testID="event-detail-player-props"
          >
            <Ionicons name="shirt-outline" color="#4b5563" size={34} />
            <Text style={styles.emptyPropsText}>Player Props unavailable for this match</Text>
          </View>
        ) : activeTab === "exact-score" ? (
          renderExactScore()
        ) : activeTab === "halves" ? (
          renderHalves()
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
            {renderTeamToAdvanceCard()}
            {primaryMarket && (
              <View style={styles.marketBlock}>
                <Pressable
                  accessibilityLabel={`event-detail-market-toggle-regulation-time-winner event-detail-market-toggle-${primaryMarket.id}`}
                  onPress={() => toggleGroup("regulation-time-winner")}
                  style={styles.marketHeaderRow}
                  testID={`event-detail-market-toggle-${primaryMarket.id}`}
                >
                  <View style={styles.marketTitleBlock}>
                    <Text style={styles.marketTitle}>Moneyline</Text>
                    <Text style={styles.marketSubcopy}>Regulation Time Winner · 90 Minutes Plus Stoppage Time</Text>
                  </View>
                  <Ionicons name={expandedMarketIds["regulation-time-winner"] ? "chevron-up" : "chevron-down"} color="#9ca3af" size={26} />
                </Pressable>
                {expandedMarketIds["regulation-time-winner"] && (
                  <>
                    <View accessibilityLabel={`market-depth-${primaryMarket.id}`} style={styles.depthRow} testID={`market-depth-${primaryMarket.id}`}>
                      <Text style={styles.depthText}>{t.bestBid} {marketDepth(primaryMarket).bid}</Text>
                      <Text style={styles.depthText}>{t.bestAsk} {marketDepth(primaryMarket).ask}</Text>
                      <Text style={styles.depthText}>{t.spread} {marketDepth(primaryMarket).spread}</Text>
                      <Pressable accessibilityLabel="event-detail-open-order-book" onPress={() => setOrderBookVisible(true)} style={styles.depthBookButton} testID="event-detail-open-order-book">
                        <Ionicons name="book-outline" color="#dbeafe" size={14} />
                        <Text style={styles.depthBookText}>Book</Text>
                      </Pressable>
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
                accessibilityLabel={`event-detail-market-toggle-spread Spread ${homeCode} to win by over ${spreadLine} goals ${spreadLine}`}
                onPress={() => toggleGroup("spread")}
                style={styles.marketHeaderRow}
                testID="event-detail-market-toggle-spread"
              >
                <View style={styles.marketTitleBlock}>
                  <Text style={styles.marketTitle}>Spread</Text>
                  <Text style={styles.marketSubcopy}>{homeCode} to win by over {spreadLine} goals</Text>
                </View>
                <View style={styles.headerRightCluster}>
                  <View style={styles.lineValuePill}>
                    <Text style={styles.lineValueText}>{spreadLine}</Text>
                    <Ionicons name="chevron-down" color="#86efac" size={16} />
                  </View>
                  <Ionicons name={expandedMarketIds.spread ? "chevron-up" : "chevron-down"} color="#9ca3af" size={26} />
                </View>
              </Pressable>
              {expandedMarketIds.spread && (
                <>
                  <View style={styles.subSegmentRow}>
                    {linePeriods.map((period) => (
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
                  <View style={styles.lineRailRow}>
                    {spreadLineOptions.map((line) => (
                      <Pressable
                        accessibilityLabel={`event-detail-spread-line-${line}`}
                        key={line}
                        onPress={() => setSpreadLine(line)}
                        style={[styles.lineRailOption, spreadLine === line && styles.lineRailOptionActive]}
                        testID={`event-detail-spread-line-${line.replace(".", "-")}`}
                      >
                        <Text style={[styles.lineRailText, spreadLine === line && styles.lineRailTextActive]}>{line}</Text>
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
  actionNotice: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 18, backgroundColor: "#0f1b2e", borderBottomWidth: 1, borderBottomColor: "#263247" },
  actionNoticeText: { flex: 1, color: "#f8fafc", fontSize: 14, fontWeight: "900" },
  actionNoticeDismiss: { color: "#93c5fd", fontSize: 13, fontWeight: "900" },
  shareSheet: { padding: 16, backgroundColor: "#0b1220", borderBottomWidth: 1, borderBottomColor: "#263247" },
  shareSheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  shareSheetTitle: { color: "#f8fafc", fontSize: 17, fontWeight: "900" },
  shareSheetSub: { color: "#94a3b8", fontSize: 12, fontWeight: "800", marginTop: 3 },
  shareDismissButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#111827" },
  shareActionsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  shareActionButton: { flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#172033", borderWidth: 1, borderColor: "#293548" },
  shareActionText: { color: "#e5e7eb", fontSize: 12, fontWeight: "900" },
  stickyMarketShell: { backgroundColor: "#060b14", borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  compactGameHeader: { minHeight: 78, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, backgroundColor: "#060b14", borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  compactTeamSide: { width: 132, flexDirection: "row", alignItems: "center", gap: 8 },
  compactTeamRight: { justifyContent: "flex-end" },
  compactFlag: { fontSize: 31 },
  compactTeamCode: { color: "#9ca3af", fontSize: 17, fontWeight: "900" },
  compactProbability: { fontSize: 20, fontWeight: "900", marginTop: 2 },
  compactMatchCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  compactDate: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  compactTime: { color: "#cbd5e1", fontSize: 15, fontWeight: "800", marginTop: 3 },
  compactRightText: { alignItems: "flex-end" },
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
  bodySwitchSection: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 8 },
  bodySwitchMeta: { minHeight: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  bodySwitchVolume: { color: "#8b93a3", fontSize: 15, fontWeight: "800" },
  bodySwitchSource: { color: "#64748b", fontSize: 15, fontWeight: "900" },
  bodySwitchTabs: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  bodySwitchTab: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 12, paddingHorizontal: 16, backgroundColor: "transparent" },
  bodySwitchTabActive: { backgroundColor: "#082f49" },
  bodySwitchTabText: { color: "#8b93a3", fontSize: 17, fontWeight: "900" },
  bodySwitchTabTextActive: { color: "#38bdf8" },
  liveStatsPanel: { marginHorizontal: 24, marginTop: 16, marginBottom: 24, padding: 16, borderRadius: 18, backgroundColor: "#10171f", borderWidth: 1, borderColor: "#26313f" },
  liveStatsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  liveStatsTitle: { color: "#f8fafc", fontSize: 20, fontWeight: "900" },
  liveStatsStatus: { overflow: "hidden", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, color: "#93c5fd", backgroundColor: "#0b2440", fontSize: 12, fontWeight: "900" },
  liveStatRow: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: "#1f2937" },
  liveStatValue: { width: 52, color: "#f8fafc", fontSize: 17, fontWeight: "900", textAlign: "center" },
  liveStatMiddle: { flex: 1, minWidth: 0 },
  liveStatLabel: { color: "#cbd5e1", fontSize: 13, fontWeight: "900", textAlign: "center", marginBottom: 6 },
  liveStatTrack: { height: 5, borderRadius: 999, backgroundColor: "#26313f", overflow: "hidden" },
  liveStatFill: { width: "58%", height: 5, borderRadius: 999, backgroundColor: "#38bdf8" },
  liveStatsTimeline: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#26313f" },
  liveStatsTimelineTitle: { color: "#f8fafc", fontSize: 15, fontWeight: "900", marginBottom: 8 },
  liveStatsTimelineText: { color: "#94a3b8", fontSize: 13, fontWeight: "800", marginTop: 4 },
  chartBlock: { minHeight: 190, paddingHorizontal: 0, paddingTop: 32, paddingBottom: 12 },
  chartMarkers: { position: "absolute", left: 14, top: 34, gap: 20 },
  chartMarkerText: { color: "#546071", fontSize: 11, fontWeight: "900" },
  chartReferenceLine: { position: "absolute", left: 0, right: 42, top: 63, borderTopWidth: 1, borderStyle: "dashed", borderColor: "#64748b", opacity: 0.65 },
  chartReferenceText: { position: "absolute", right: -2, top: -15, overflow: "hidden", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, color: "#dbeafe", backgroundColor: "#475569", fontSize: 12, fontWeight: "900" },
  dualChart: { width: "70%", height: 92, marginLeft: 0 },
  chartTrace: { position: "absolute", left: 0, right: 0, top: 0, height: 86, flexDirection: "row", alignItems: "flex-start" },
  chartTraceOverlay: { top: 28 },
  chartStep: { flex: 1, height: 5, borderRadius: 999, marginRight: -1 },
  chartDot: { position: "absolute", right: -8, top: 47, width: 15, height: 15, borderRadius: 999 },
  chartSelectedPoint: { position: "absolute", right: 20, top: 43, width: 22, height: 22, borderRadius: 999, borderWidth: 3, backgroundColor: "#0b1019" },
  chartSelectedPointMid: { right: "42%", top: 31 },
  chartSelectedPointTarget: { right: "18%", top: 12 },
  chartLabel: { position: "absolute", right: 28, top: 36, alignItems: "flex-start" },
  chartName: { fontSize: 17, fontWeight: "800" },
  chartPercent: { fontSize: 48, fontWeight: "500" },
  chartTooltip: { position: "absolute", left: "38%", top: 8, minWidth: 92, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: "#101827", borderWidth: 1, borderColor: "#334155" },
  chartTooltipLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "900" },
  chartTooltipValue: { fontSize: 17, fontWeight: "900", marginTop: 1 },
  chartTooltipTime: { color: "#cbd5e1", fontSize: 11, fontWeight: "800", marginTop: 1 },
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
  marketTabs: { flexDirection: "row", gap: 24, paddingHorizontal: 24, marginTop: 22, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  stickyMarketTabs: { marginTop: 0, paddingHorizontal: 20, borderBottomWidth: 0, backgroundColor: "#060b14" },
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
  polymarketLineCard: { marginHorizontal: 24, marginTop: 16, padding: 16, borderRadius: 18, backgroundColor: "#10171f", borderWidth: 1, borderColor: "#26313f" },
  lineCardTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  lineOutcomeButtonRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  lineOutcomeButton: { flex: 1, minHeight: 62, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "#25303a", borderBottomWidth: 5, borderBottomColor: "#1c2630" },
  lineOutcomeButtonText: { color: "#d1d5db", fontSize: 18, fontWeight: "900" },
  lineDetailTabs: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#26313f" },
  lineDetailTab: { minHeight: 34, justifyContent: "center" },
  lineDetailTabText: { color: "#7b8494", fontSize: 16, fontWeight: "900" },
  lineDetailTabTextActive: { color: "#f8fafc" },
  inlineOrderBook: { marginTop: 10, borderTopWidth: 1, borderTopColor: "#26313f" },
  inlineOrderBookHeader: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 },
  inlineBookHeaderText: { width: "30%", color: "#7b8494", fontSize: 12, fontWeight: "900", textAlign: "right" },
  inlineBookRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 9, borderTopWidth: 1, borderTopColor: "#172033" },
  inlineBookPrice: { width: "30%", color: "#ef4444", fontSize: 18, fontWeight: "900", textAlign: "right" },
  inlineBookText: { width: "30%", color: "#d1d5db", fontSize: 15, fontWeight: "800", textAlign: "right" },
  inlineGraph: { minHeight: 86, justifyContent: "center", marginTop: 12, borderTopWidth: 1, borderTopColor: "#26313f" },
  inlineGraphLine: { height: 5, borderRadius: 999, backgroundColor: "#38bdf8", marginHorizontal: 10 },
  inlineGraphText: { color: "#94a3b8", fontSize: 13, fontWeight: "800", marginTop: 10, textAlign: "center" },
  inlineAbout: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#26313f" },
  inlineAboutText: { color: "#cbd5e1", fontSize: 14, fontWeight: "700", lineHeight: 20 },
  exactScoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 54, borderTopWidth: 1, borderTopColor: "#26313f" },
  exactScoreText: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  exactScoreButton: { minWidth: 116, minHeight: 40, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#25303a" },
  exactScoreButtonText: { color: "#d1d5db", fontSize: 17, fontWeight: "900" },
  headerRightCluster: { flexDirection: "row", alignItems: "center", gap: 10 },
  lineValuePill: { minWidth: 58, minHeight: 32, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 2, borderRadius: 999, backgroundColor: "#052e1b", paddingHorizontal: 10 },
  lineValueText: { color: "#86efac", fontSize: 14, fontWeight: "900" },
  subSegmentRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, marginBottom: 4 },
  subSegment: { flex: 1, minHeight: 36, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "#111827" },
  subSegmentActive: { backgroundColor: "#273244" },
  subSegmentText: { color: "#8b93a3", fontSize: 12, fontWeight: "900" },
  subSegmentTextActive: { color: "#f8fafc" },
  lineRailRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 10, marginBottom: 6 },
  lineRailOption: { minWidth: 62, minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2937" },
  lineRailOptionActive: { backgroundColor: "#052e1b", borderColor: "#0a8f61" },
  lineRailText: { color: "#8b93a3", fontSize: 16, fontWeight: "900" },
  lineRailTextActive: { color: "#86efac" },
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
  depthBookButton: { minHeight: 30, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, borderRadius: 8, backgroundColor: "#111827", borderWidth: 1, borderColor: "#263247" },
  depthBookText: { color: "#dbeafe", fontSize: 11, fontWeight: "900" },
  probButton: { width: 92, minHeight: 62, alignItems: "center", justifyContent: "center", borderRadius: 13 },
  probButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
  probButtonSubtext: { color: "rgba(255,255,255,0.82)", fontSize: 10, fontWeight: "900", marginTop: 2 },
  orderBookOverlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 30, backgroundColor: "#070c14", paddingTop: 16 },
  orderBookHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#172033" },
  orderBookTitle: { color: "#f8fafc", fontSize: 22, fontWeight: "900" },
  orderBookSubtitle: { color: "#94a3b8", fontSize: 12, fontWeight: "800", marginTop: 4 },
  orderBookClose: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#111827", borderWidth: 1, borderColor: "#263247" },
  orderBookSummary: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#172033" },
  orderBookSummaryText: { flex: 1, color: "#cbd5e1", fontSize: 11, fontWeight: "900" },
  orderBookScroll: { flex: 1 },
  orderBookPad: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 28 },
  orderBookOutcome: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#172033" },
  orderBookOutcomeTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  orderBookOutcomeTitle: { color: "#f8fafc", fontSize: 17, fontWeight: "900" },
  orderBookOutcomeMeta: { color: "#94a3b8", fontSize: 12, fontWeight: "800", marginTop: 3 },
  orderBookActionRow: { flexDirection: "row", gap: 8 },
  orderBookTradeButton: { minWidth: 74, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  orderBookTradeText: { color: "#ffffff", fontSize: 13, fontWeight: "900" },
  orderBookSellButton: { minWidth: 74, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#1f2937", borderWidth: 1, borderColor: "#334155" },
  orderBookSellText: { color: "#dbeafe", fontSize: 13, fontWeight: "900" },
  orderBookColumns: { flexDirection: "row", gap: 10, marginTop: 12 },
  orderBookColumn: { flex: 1, gap: 5, padding: 10, borderRadius: 9, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2937" },
  orderBookColumnLabel: { color: "#64748b", fontSize: 10, fontWeight: "900" },
  orderBookPrice: { color: "#f8fafc", fontSize: 14, fontWeight: "900" },
  orderBookSize: { color: "#94a3b8", fontSize: 11, fontWeight: "800" },
  depthBarTrack: { height: 6, overflow: "hidden", borderRadius: 999, backgroundColor: "#111827" },
  depthBidBar: { height: 6, borderRadius: 999, backgroundColor: "#0a8f61" },
  depthAskBar: { height: 6, borderRadius: 999, backgroundColor: "#ef4444" },
});
