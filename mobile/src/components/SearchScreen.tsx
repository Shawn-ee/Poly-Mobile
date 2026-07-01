import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { Event, Locale, Market, Outcome } from "../mocks/worldCup";
import { MarketList } from "./MarketLists";

type SearchFilter = "all" | "live" | "upcoming";

type SearchScreenCopy = {
  marketSearch: string;
  searchResults: string;
  topResults: string;
  clearSearch: string;
  noResults: string;
  searchAll: string;
  searchLive: string;
  searchUpcoming: string;
};

export function SearchScreen({
  locale,
  t,
  query,
  setQuery,
  events,
  openEvent,
  openTicket,
}: {
  locale: Locale;
  t: SearchScreenCopy;
  query: string;
  setQuery: (query: string) => void;
  events: Event[];
  openEvent: (event: Event) => void;
  openTicket: (market: Market, outcome: Outcome, event?: Event) => void;
}) {
  const [filter, setFilter] = useState<SearchFilter>("all");
  const disableSoftInputForSmoke = process.env.EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT === "1";
  const hasQuery = query.trim().length > 0;
  const visibleEvents =
    filter === "live"
      ? events.filter((event) => event.status === "live")
      : filter === "upcoming"
        ? events.filter((event) => event.status !== "live")
        : events;
  const resultLabel = locale === "zh" ? `${visibleEvents.length} 个结果` : `${visibleEvents.length} ${visibleEvents.length === 1 ? "result" : "results"}`;
  const filters: Array<[SearchFilter, string]> = [
    ["all", t.searchAll],
    ["live", t.searchLive],
    ["upcoming", t.searchUpcoming],
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
      <MarketList locale={locale} events={visibleEvents} empty={t.noResults} openEvent={openEvent} openTicket={openTicket} />
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
});
