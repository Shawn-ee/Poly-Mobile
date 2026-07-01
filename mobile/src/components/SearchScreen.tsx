import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { Event, Locale, Market, Outcome } from "../mocks/worldCup";
import { MarketList } from "./MarketLists";

type SearchFilter = "all" | "live" | "upcoming" | "saved";
type SearchSort = "popular" | "live";

type SearchScreenCopy = {
  marketSearch: string;
  searchResults: string;
  topResults: string;
  clearSearch: string;
  noResults: string;
  noSavedMarkets: string;
  searchAll: string;
  searchLive: string;
  searchUpcoming: string;
  saved: string;
  volume: string;
  liquidity: string;
  sortPopular: string;
  sortLiveFirst: string;
};

export function SearchScreen({
  locale,
  t,
  query,
  setQuery,
  events,
  openEvent,
  openTicket,
  savedEventIds,
  toggleSavedEvent,
}: {
  locale: Locale;
  t: SearchScreenCopy;
  query: string;
  setQuery: (query: string) => void;
  events: Event[];
  openEvent: (event: Event) => void;
  openTicket: (market: Market, outcome: Outcome, event?: Event) => void;
  savedEventIds: Set<string>;
  toggleSavedEvent: (event: Event) => void;
}) {
  const [filter, setFilter] = useState<SearchFilter>("all");
  const [sort, setSort] = useState<SearchSort>("popular");
  const disableSoftInputForSmoke = process.env.EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT === "1";
  const hasQuery = query.trim().length > 0;
  const filteredEvents =
    filter === "live"
      ? events.filter((event) => event.status === "live")
      : filter === "upcoming"
        ? events.filter((event) => event.status !== "live")
        : filter === "saved"
          ? events.filter((event) => savedEventIds.has(event.id))
        : events;
  const visibleEvents = [...filteredEvents].sort((left, right) => {
    if (sort === "live") {
      const leftLive = left.status === "live" ? 0 : 1;
      const rightLive = right.status === "live" ? 0 : 1;
      if (leftLive !== rightLive) return leftLive - rightLive;
    }
    const leftDepth = left.markets.reduce((total, market) => total + market.outcomes.length, 0);
    const rightDepth = right.markets.reduce((total, market) => total + market.outcomes.length, 0);
    return rightDepth - leftDepth;
  });
  const emptyCopy = filter === "saved" ? t.noSavedMarkets : t.noResults;
  const resultLabel = locale === "zh" ? `${visibleEvents.length} \u4e2a\u7ed3\u679c` : `${visibleEvents.length} ${visibleEvents.length === 1 ? "result" : "results"}`;
  const filters: Array<[SearchFilter, string]> = [
    ["all", t.searchAll],
    ["live", t.searchLive],
    ["upcoming", t.searchUpcoming],
    ["saved", t.saved],
  ];
  const sortOptions: Array<[SearchSort, string]> = [
    ["popular", t.sortPopular],
    ["live", t.sortLiveFirst],
  ];

  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollPad}>
      <View style={styles.searchBox}>
        <Ionicons name="search" color="#94a3b8" size={20} />
        <TextInput
          accessibilityLabel="search-world-cup-markets"
          testID="search-world-cup-markets"
          value={query}
          onChangeText={setQuery}
          placeholder={t.marketSearch}
          placeholderTextColor="#64748b"
          style={styles.searchInput}
          showSoftInputOnFocus={!disableSoftInputForSmoke}
        />
      </View>
      <View style={styles.searchHeader}>
        <View>
          <Text style={styles.searchHeading}>{hasQuery ? t.searchResults : t.topResults}</Text>
          <Text style={styles.resultMeta}>{resultLabel}</Text>
        </View>
        {hasQuery && (
          <Pressable accessibilityLabel="clear-search" testID="clear-search" style={styles.clearSearchButton} onPress={() => setQuery("")}>
            <Text style={styles.clearSearchText}>{t.clearSearch}</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.searchFilters}>
        {filters.map(([value, text]) => (
          <Pressable
            key={value}
            accessibilityLabel={`search-filter-${value}`}
            testID={`search-filter-${value}`}
            style={[styles.searchFilterChip, filter === value && styles.searchFilterChipActive]}
            onPress={() => setFilter(value)}
          >
            <Text style={[styles.searchFilterText, filter === value && styles.searchFilterTextActive]}>{text}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.sortRow}>
        {sortOptions.map(([value, text]) => (
          <Pressable
            key={value}
            accessibilityLabel={`search-sort-${value}`}
            testID={`search-sort-${value}`}
            style={[styles.sortButton, sort === value && styles.sortButtonActive]}
            onPress={() => setSort(value)}
          >
            <Text style={[styles.sortText, sort === value && styles.sortTextActive]}>{text}</Text>
          </Pressable>
        ))}
      </View>
      <MarketList
        locale={locale}
        events={visibleEvents}
        empty={emptyCopy}
        openEvent={openEvent}
        openTicket={openTicket}
        savedEventIds={savedEventIds}
        toggleSavedEvent={toggleSavedEvent}
        statsCopy={{ volume: t.volume, liquidity: t.liquidity }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollPad: { paddingHorizontal: 16, paddingBottom: 110 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, height: 52, paddingHorizontal: 14, borderRadius: 12, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginBottom: 14 },
  searchInput: { flex: 1, color: "#f8fafc", fontSize: 16, fontWeight: "700" },
  searchHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  searchHeading: { color: "#f8fafc", fontSize: 20, fontWeight: "900" },
  resultMeta: { color: "#8ea0b8", fontSize: 13, fontWeight: "800", marginTop: 3 },
  clearSearchButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "#1f2937" },
  clearSearchText: { color: "#dbeafe", fontWeight: "900" },
  searchFilters: { flexDirection: "row", gap: 8, marginBottom: 12 },
  searchFilterChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  searchFilterChipActive: { backgroundColor: "#1d6dff", borderColor: "#1d6dff" },
  searchFilterText: { color: "#8ea0b8", fontWeight: "900" },
  searchFilterTextActive: { color: "#ffffff" },
  sortRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  sortButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  sortButtonActive: { backgroundColor: "#1f2937", borderColor: "#3b82f6" },
  sortText: { color: "#8ea0b8", fontSize: 12, fontWeight: "900" },
  sortTextActive: { color: "#dbeafe" },
});
