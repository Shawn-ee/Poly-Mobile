import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { Event, Locale, Market, Outcome } from "../mocks/worldCup";
import { FeaturedFuture } from "./FeaturedFuture";
import { FutureList, MarketList } from "./MarketLists";
import { SportNav } from "./SportNav";
import { WorldCupSegmented, WorldCupTab } from "./WorldCupSegmented";

type HomeFilter = "all" | "live" | "today" | "saved";

type HomeScreenCopy = {
  games: string;
  futures: string;
  trending: string;
  marketSearch: string;
  noResults: string;
  searchAll: string;
  searchLive: string;
  today: string;
  saved: string;
  volume: string;
  liquidity: string;
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
  savedEventIds,
  toggleSavedEvent,
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
    ["saved", t.saved],
  ];
  const visibleEvents = useMemo(
    () =>
      homeFilter === "live"
        ? events.filter((event) => event.status === "live")
        : homeFilter === "today"
          ? events.filter((event) => event.status === "today")
          : homeFilter === "saved"
            ? events.filter((event) => savedEventIds.has(event.id))
          : events,
    [events, homeFilter, savedEventIds],
  );

  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollPad}>
      <SportNav locale={locale} />
      <FeaturedFuture locale={locale} futures={futures} openTicket={openTicket} />
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
          empty={t.noResults}
          openEvent={openEvent}
          openTicket={openTicket}
          savedEventIds={savedEventIds}
          toggleSavedEvent={toggleSavedEvent}
          statsCopy={{ volume: t.volume, liquidity: t.liquidity }}
        />
      ) : (
        <FutureList locale={locale} futures={futures} openTicket={openTicket} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollPad: { paddingHorizontal: 16, paddingBottom: 110 },
  sectionTitle: { color: "#f8fafc", fontSize: 24, fontWeight: "900", marginTop: 24, marginBottom: 12 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, height: 52, paddingHorizontal: 14, borderRadius: 12, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginBottom: 14 },
  searchInput: { flex: 1, color: "#f8fafc", fontSize: 16, fontWeight: "700" },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  filterChipActive: { backgroundColor: "#1d6dff", borderColor: "#1d6dff" },
  filterText: { color: "#8ea0b8", fontWeight: "900" },
  filterTextActive: { color: "#ffffff" },
});
