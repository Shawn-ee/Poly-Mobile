import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { Event, Locale, Market, Outcome } from "../mocks/worldCup";
import { FutureList, MarketList } from "./MarketLists";
import { WorldCupSegmented, WorldCupTab } from "./WorldCupSegmented";

type HomeFilter = "all" | "live" | "today";

type HomeScreenCopy = {
  games: string;
  futures: string;
  trending: string;
  marketSearch: string;
  clearSearch: string;
  noResults: string;
  searchAll: string;
  searchLive: string;
  today: string;
  saved: string;
  volume: string;
  liquidity: string;
  noSavedMarkets: string;
};

export function HomeScreen({
  locale,
  t,
  worldCupTab,
  setWorldCupTab,
  events,
  query,
  setQuery,
  openEvent,
  openTicket,
  futures,
}: {
  locale: Locale;
  t: HomeScreenCopy;
  worldCupTab: WorldCupTab;
  setWorldCupTab: (tab: WorldCupTab) => void;
  events: Event[];
  query: string;
  setQuery: (query: string) => void;
  openEvent: (event: Event) => void;
  openTicket: (market: Market, outcome: Outcome, event?: Event) => void;
  futures: Market[];
  savedEventIds: Set<string>;
  toggleSavedEvent: (event: Event) => void;
}) {
  const [homeFilter, setHomeFilter] = useState<HomeFilter>("all");
  const homeFilters: Array<[HomeFilter, string]> = [
    ["all", t.searchAll],
    ["live", t.searchLive],
    ["today", t.today],
  ];
  const visibleEvents = useMemo(
    () =>
      homeFilter === "live"
        ? events.filter((event) => event.status === "live")
        : homeFilter === "today"
          ? events.filter((event) => event.status === "today")
          : events,
    [events, homeFilter],
  );
  const emptyCopy = t.noResults;
  const liveCount = events.filter((event) => event.status === "live").length;
  const availableGameCount = events.length;

  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollPad}>
      <View
        accessibilityLabel={`home-world-cup-games-focus World Cup games ${availableGameCount} matches ${liveCount} live prediction-only-home`}
        style={styles.gamesFocusHeader}
        testID="home-world-cup-games-focus"
      >
        <View style={styles.gamesFocusText}>
          <Text style={styles.gamesFocusEyebrow}>{locale === "zh" ? "\u4e16\u754c\u676f" : "World Cup"}</Text>
          <Text style={styles.gamesFocusTitle}>{locale === "zh" ? "\u6bd4\u8d5b\u9884\u6d4b" : "Game predictions"}</Text>
        </View>
        <View style={styles.gamesFocusStats}>
          <Text style={styles.gamesFocusStat}>{availableGameCount} {locale === "zh" ? "\u573a" : "matches"}</Text>
          <Text style={[styles.gamesFocusStat, liveCount > 0 && styles.gamesFocusLive]}>{liveCount} {locale === "zh" ? "\u6eda\u7403" : "live"}</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>{t.trending}</Text>
      <View style={styles.searchBox}>
        <Ionicons name="search" color="#94a3b8" size={20} />
        <TextInput
          onChangeText={setQuery}
          placeholder={t.marketSearch}
          placeholderTextColor="#64748b"
          style={styles.searchInput}
          value={query}
        />
        {query.trim().length > 0 && (
          <Pressable accessibilityLabel={t.clearSearch} testID="home-clear-search" onPress={() => setQuery("")} style={styles.clearButton}>
            <Ionicons name="close-circle" color="#bfdbfe" size={18} />
          </Pressable>
        )}
      </View>
      <View style={styles.filterRow}>
        {homeFilters.map(([value, text]) => (
          <Pressable
            key={value}
            accessibilityLabel={`home-filter-${value}`}
            testID={`home-filter-${value}`}
            style={[styles.filterChip, homeFilter === value && styles.filterChipActive]}
            onPress={() => setHomeFilter(value)}
          >
            <Text style={[styles.filterText, homeFilter === value && styles.filterTextActive]}>{text}</Text>
          </Pressable>
        ))}
      </View>
      <WorldCupSegmented left={t.games} right={t.futures} value={worldCupTab} setValue={setWorldCupTab} />
      {worldCupTab === "games" ? (
        <MarketList
          locale={locale}
          events={visibleEvents}
          empty={emptyCopy}
          openEvent={openEvent}
          openTicket={openTicket}
          statsCopy={{ volume: t.volume, liquidity: t.liquidity }}
        />
      ) : (
        <FutureList locale={locale} futures={futures} openTicket={openTicket} statsCopy={{ volume: t.volume, liquidity: t.liquidity }} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollPad: { width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 16, paddingBottom: 110 },
  gamesFocusHeader: { marginTop: 10, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#263247", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  gamesFocusText: { flex: 1, minWidth: 0 },
  gamesFocusEyebrow: { color: "#60a5fa", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  gamesFocusTitle: { color: "#f8fafc", fontSize: 28, fontWeight: "900", marginTop: 2 },
  gamesFocusStats: { alignItems: "flex-end", gap: 4 },
  gamesFocusStat: { color: "#cbd5e1", fontSize: 13, fontWeight: "900" },
  gamesFocusLive: { color: "#ef4444" },
  sectionTitle: { color: "#f8fafc", fontSize: 22, fontWeight: "900", marginTop: 18, marginBottom: 12 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, height: 52, paddingHorizontal: 14, borderRadius: 12, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginBottom: 14 },
  searchInput: { flex: 1, color: "#f8fafc", fontSize: 16, fontWeight: "700" },
  clearButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#1f2937" },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  filterChipActive: { backgroundColor: "#1d6dff", borderColor: "#1d6dff" },
  filterText: { color: "#8ea0b8", fontWeight: "900" },
  filterTextActive: { color: "#ffffff" },
  savedEmptyText: { color: "#94a3b8", fontWeight: "900", textAlign: "center", marginTop: 2, marginBottom: 14 },
});
