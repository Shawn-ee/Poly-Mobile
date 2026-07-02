import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Event, Locale, Market, Outcome } from "../mocks/worldCup";
import { label } from "../presentation/formatters";

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
};

const groupLabels: Record<Market["type"], { en: string; zh: string }> = {
  "game-line": { en: "Game lines", zh: "比赛盘口" },
  live: { en: "Live markets", zh: "滚球市场" },
  prop: { en: "Props", zh: "玩法" },
  future: { en: "Futures", zh: "期货" },
};

const groupMarkets = (markets: Market[]) => {
  const order: Array<Market["type"]> = ["live", "game-line", "prop", "future"];
  return order
    .map((type) => ({ type, markets: markets.filter((market) => market.type === type) }))
    .filter((group) => group.markets.length > 0);
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
  const bid = formatSize(bidSize);
  const ask = formatSize(askSize);
  return `${labels.bid} ${bid} ${labels.shares} - ${labels.ask} ${ask} ${labels.shares}`;
};

export function EventDetail({
  event,
  locale,
  t,
  openTicket,
  goBack,
  isSaved,
  toggleSavedEvent,
}: {
  event: Event;
  locale: Locale;
  t: EventDetailCopy;
  openTicket: (market: Market, outcome: Outcome, event?: Event) => void;
  goBack: () => void;
  isSaved: boolean;
  toggleSavedEvent: (event: Event) => void;
}) {
  const groups = groupMarkets(event.markets);
  const stats = marketStats(event);
  const scrollRef = useRef<ScrollView>(null);
  const groupOffsets = useRef<Record<Market["type"], number>>({
    future: 0,
    "game-line": 0,
    live: 0,
    prop: 0,
  });
  const groupLabel = (type: Market["type"]) => (locale === "zh" ? groupLabels[type].zh : groupLabels[type].en);
  const groupCountLabel = (count: number) => {
    if (locale === "en" && count === 1) return "1 market";
    return `${count} ${t.marketCount}`;
  };
  const scrollToGroup = (type: Market["type"]) => {
    scrollRef.current?.scrollTo({ y: Math.max(groupOffsets.current[type] - 8, 0), animated: false });
  };

  return (
    <View style={styles.content}>
      <Pressable
        accessibilityLabel="event-detail-back"
        onPress={goBack}
        style={styles.backButton}
        testID="event-detail-back"
      >
        <Ionicons name="chevron-back" size={18} color="#f8fafc" />
        <Text style={styles.backText}>{t.worldCup}</Text>
      </Pressable>
      <ScrollView ref={scrollRef} style={styles.content} contentContainerStyle={styles.scrollPad}>
      <View style={styles.detailHero}>
        <Text style={styles.detailMeta}>{event.startsAt} · {label(locale, { label: event.tag, zhLabel: event.zhTag })}</Text>
        <View style={styles.detailTitleRow}>
          <Text style={styles.detailTitle}>{label(locale, event)}</Text>
          <Pressable
            accessibilityLabel={`event-detail-save-${event.id}`}
            onPress={() => toggleSavedEvent(event)}
            style={[styles.saveButton, isSaved && styles.saveButtonActive]}
            testID={`event-detail-save-${event.id}`}
          >
            <Text style={[styles.saveText, isSaved && styles.saveTextActive]}>{isSaved ? "★" : "☆"}</Text>
          </Pressable>
        </View>
        <View accessibilityLabel="event-detail-stats" style={styles.statsGrid} testID="event-detail-stats">
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>{t.volume}</Text>
            <Text style={styles.statValue}>{stats.volume}</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>{t.liquidity}</Text>
            <Text style={styles.statValue}>{stats.liquidity}</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>{t.traders}</Text>
            <Text style={styles.statValue}>{stats.traders}</Text>
          </View>
        </View>
        <View accessibilityLabel="event-detail-market-summary" style={styles.summaryRow} testID="event-detail-market-summary">
          <View style={styles.summaryPill}>
            <Ionicons name="layers-outline" size={16} color="#93c5fd" />
            <Text style={styles.summaryText}>
              {stats.marketCount} {t.marketCount}
            </Text>
          </View>
          <View style={styles.summaryPill}>
            <Ionicons name="git-branch-outline" size={16} color="#93c5fd" />
            <Text style={styles.summaryText}>
              {stats.outcomeCount} {t.outcomeCount}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.sectionTitle}>{t.markets}</Text>
      <View style={styles.groupTabs}>
        {groups.map((group) => (
          <Pressable
            accessibilityLabel={`event-detail-group-${group.type}`}
            key={group.type}
            onPress={() => scrollToGroup(group.type)}
            style={styles.groupTab}
            testID={`event-detail-group-${group.type}`}
          >
            <Text style={styles.groupTabText}>{groupLabel(group.type)}</Text>
            <Text style={styles.groupTabCount}>{groupCountLabel(group.markets.length)}</Text>
          </Pressable>
        ))}
      </View>
      {groups.map((group) => (
        <View
          key={group.type}
          onLayout={(event) => {
            groupOffsets.current[group.type] = event.nativeEvent.layout.y;
          }}
          style={styles.marketGroup}
        >
          <View style={styles.groupTitleRow}>
            <Text style={styles.groupTitle}>{groupLabel(group.type)}</Text>
            <Text style={styles.groupCount}>{groupCountLabel(group.markets.length)}</Text>
          </View>
          {group.markets.map((market) => (
            <View key={market.id} style={styles.marketBlock}>
              <View style={styles.marketHeaderRow}>
                <Text style={styles.marketTitle}>{label(locale, market)}</Text>
                <Text style={styles.marketOutcomeCount}>
                  {market.outcomes.length} {t.outcomeCount}
                </Text>
              </View>
              <View accessibilityLabel={`market-depth-${market.id}`} style={styles.depthRow} testID={`market-depth-${market.id}`}>
                <View style={styles.depthCell}>
                  <Text style={styles.depthLabel}>{t.bestBid}</Text>
                  <Text style={styles.depthValue}>{marketDepth(market).bid}</Text>
                </View>
                <View style={styles.depthCell}>
                  <Text style={styles.depthLabel}>{t.bestAsk}</Text>
                  <Text style={styles.depthValue}>{marketDepth(market).ask}</Text>
                </View>
                <View style={styles.depthCell}>
                  <Text style={styles.depthLabel}>{t.spread}</Text>
                  <Text style={styles.depthValue}>{marketDepth(market).spread}</Text>
                </View>
              </View>
              {market.outcomes.map((outcome) => (
                <View key={outcome.id} style={styles.detailOutcome}>
                  <View style={styles.outcomeTextBlock}>
                    <Text style={styles.teamName}>{label(locale, outcome)}</Text>
                    {(() => {
                      const sizeText = outcomeDepthSize(outcome, { bid: t.bestBid, ask: t.bestAsk, shares: t.shares });
                      if (!sizeText) return null;
                      return (
                      <Text
                        adjustsFontSizeToFit
                        accessibilityLabel={`event-detail-outcome-depth-size-${market.id}-${outcome.id}`}
                        minimumFontScale={0.82}
                        numberOfLines={1}
                        style={styles.outcomeSizeText}
                      >
                        {t.liquidity}: {sizeText}
                      </Text>
                      );
                    })()}
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
                    onPress={() => openTicket(market, outcome, event)}
                    style={[styles.probButton, { backgroundColor: outcome.color }]}
                    testID={`event-detail-outcome-${market.id}-${outcome.id}`}
                  >
                    <Text style={styles.probButtonText}>{outcome.probability}%</Text>
                    <Text style={styles.probButtonSubtext}>{outcomeOdds(outcome)}x</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ))}
        </View>
      ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollPad: { paddingHorizontal: 16, paddingBottom: 110 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingVertical: 8, paddingLeft: 16, paddingRight: 12 },
  backText: { color: "#f8fafc", fontWeight: "900" },
  detailHero: { padding: 18, borderRadius: 16, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginBottom: 4 },
  detailMeta: { color: "#94a3b8", fontWeight: "800", marginBottom: 8 },
  detailTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailTitle: { flex: 1, color: "#f8fafc", fontSize: 26, fontWeight: "900" },
  saveButton: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  saveButtonActive: { backgroundColor: "#fbbf24", borderColor: "#fbbf24" },
  saveText: { color: "#94a3b8", fontSize: 24, fontWeight: "900" },
  saveTextActive: { color: "#101827" },
  statsGrid: { flexDirection: "row", gap: 8, marginTop: 16 },
  statCell: { flex: 1, minHeight: 66, justifyContent: "center", paddingHorizontal: 10, borderRadius: 10, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  statLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "900", textTransform: "uppercase", marginBottom: 5 },
  statValue: { color: "#f8fafc", fontSize: 13, fontWeight: "900" },
  summaryRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  summaryPill: { flex: 1, minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  summaryText: { color: "#dbeafe", fontSize: 12, fontWeight: "900" },
  sectionTitle: { color: "#f8fafc", fontSize: 24, fontWeight: "900", marginTop: 24, marginBottom: 12 },
  groupTabs: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  groupTab: { minHeight: 42, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#111b2d", borderWidth: 1, borderColor: "#2b3b55" },
  groupTabText: { color: "#dbeafe", fontSize: 12, fontWeight: "900" },
  groupTabCount: { color: "#93c5fd", fontSize: 10, fontWeight: "900", marginTop: 2 },
  marketGroup: { gap: 10, marginBottom: 14 },
  groupTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  groupTitle: { color: "#94a3b8", fontSize: 13, fontWeight: "900", textTransform: "uppercase" },
  groupCount: { color: "#93c5fd", fontSize: 12, fontWeight: "900" },
  marketBlock: { padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginBottom: 12 },
  marketHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  marketTitle: { flex: 1, color: "#f8fafc", fontSize: 19, fontWeight: "900" },
  marketOutcomeCount: { color: "#93c5fd", fontSize: 12, fontWeight: "900" },
  depthRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  depthCell: { flex: 1, minHeight: 48, justifyContent: "center", paddingHorizontal: 9, borderRadius: 9, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  depthLabel: { color: "#94a3b8", fontSize: 10, fontWeight: "900", textTransform: "uppercase", marginBottom: 3 },
  depthValue: { color: "#e0f2fe", fontSize: 13, fontWeight: "900" },
  detailOutcome: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  outcomeTextBlock: { flex: 1, paddingRight: 4 },
  teamName: { color: "#f8fafc", fontSize: 18, fontWeight: "800" },
  outcomeSizeText: { color: "#bfdbfe", fontSize: 10, fontWeight: "900", marginTop: 3 },
  outcomeDepthText: { color: "#94a3b8", fontSize: 11, fontWeight: "800", marginTop: 3 },
  probButton: { minWidth: 86, alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 },
  probButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
  probButtonSubtext: { color: "rgba(255,255,255,0.82)", fontSize: 11, fontWeight: "900", marginTop: 2 },
});
