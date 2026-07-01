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
  };
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
        <Text style={styles.detailTitle}>{label(locale, event)}</Text>
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
          <Text style={styles.groupTitle}>{groupLabel(group.type)}</Text>
          {group.markets.map((market) => (
            <View key={market.id} style={styles.marketBlock}>
              <Text style={styles.marketTitle}>{label(locale, market)}</Text>
              {market.outcomes.map((outcome) => (
                <View key={outcome.id} style={styles.detailOutcome}>
                  <Text style={styles.teamName}>{label(locale, outcome)}</Text>
                  <Pressable
                    accessibilityLabel={`event-detail-outcome-${market.id}-${outcome.id}`}
                    onPress={() => openTicket(market, outcome, event)}
                    style={[styles.probButton, { backgroundColor: outcome.color }]}
                    testID={`event-detail-outcome-${market.id}-${outcome.id}`}
                  >
                    <Text style={styles.probButtonText}>{outcome.probability}%</Text>
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
  detailTitle: { color: "#f8fafc", fontSize: 26, fontWeight: "900" },
  statsGrid: { flexDirection: "row", gap: 8, marginTop: 16 },
  statCell: { flex: 1, minHeight: 66, justifyContent: "center", paddingHorizontal: 10, borderRadius: 10, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#263247" },
  statLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "900", textTransform: "uppercase", marginBottom: 5 },
  statValue: { color: "#f8fafc", fontSize: 13, fontWeight: "900" },
  sectionTitle: { color: "#f8fafc", fontSize: 24, fontWeight: "900", marginTop: 24, marginBottom: 12 },
  groupTabs: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  groupTab: { minHeight: 36, paddingHorizontal: 12, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#111b2d", borderWidth: 1, borderColor: "#2b3b55" },
  groupTabText: { color: "#dbeafe", fontSize: 12, fontWeight: "900" },
  marketGroup: { gap: 10, marginBottom: 14 },
  groupTitle: { color: "#94a3b8", fontSize: 13, fontWeight: "900", textTransform: "uppercase" },
  marketBlock: { padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginBottom: 12 },
  marketTitle: { color: "#f8fafc", fontSize: 19, fontWeight: "900", marginBottom: 8 },
  detailOutcome: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  teamName: { flex: 1, color: "#f8fafc", fontSize: 18, fontWeight: "800" },
  probButton: { minWidth: 86, alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 },
  probButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
});
