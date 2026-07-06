import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import type { Event, Locale, Market, Outcome } from "../mocks/worldCup";
import { label, money } from "../presentation/formatters";

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
  canLoadMoreEvents,
  isLoadingMoreEvents = false,
  loadMoreEvents,
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
  canLoadMoreEvents?: boolean;
  isLoadingMoreEvents?: boolean;
  loadMoreEvents?: () => void;
}) {
  const [sort, setSort] = useState<SearchSort>("popular");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const disableSoftInputForSmoke = process.env.EXPO_PUBLIC_SMOKE_DISABLE_SOFT_INPUT === "1";
  const hasQuery = query.trim().length > 0;
  const visibleEvents = [...events].sort((left, right) => {
    if (sort === "live") {
      const leftLive = left.status === "live" ? 0 : 1;
      const rightLive = right.status === "live" ? 0 : 1;
      if (leftLive !== rightLive) return leftLive - rightLive;
    }
    const leftDepth = left.markets.reduce((total, market) => total + market.outcomes.length, 0);
    const rightDepth = right.markets.reduce((total, market) => total + market.outcomes.length, 0);
    return rightDepth - leftDepth;
  });
  const emptyCopy = t.noResults;
  const resultLabel = locale === "zh" ? `${visibleEvents.length} \u4e2a\u7ed3\u679c` : `${visibleEvents.length} ${visibleEvents.length === 1 ? "result" : "results"}`;
  const sortOptions: Array<[SearchSort, string]> = [
    ["popular", t.sortPopular],
    ["live", t.sortLiveFirst],
  ];
  const categoryChips = locale === "zh" ? ["\u5168\u90e8", "\u4f53\u80b2", "\u4e16\u754c\u676f", "\u6eda\u7403"] : ["All", "Sports", "World Cup", "Live"];
  const canLoadMore = Boolean(canLoadMoreEvents && loadMoreEvents);
  const loadMoreResults = () => {
    if (!canLoadMore || isLoadingMoreEvents) return;
    loadMoreEvents?.();
  };
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    if (distanceFromBottom < 160) loadMoreResults();
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScroll={handleScroll}
        onScrollBeginDrag={Keyboard.dismiss}
        scrollEventThrottle={120}
        style={styles.content}
        contentContainerStyle={[styles.scrollPad, isInputFocused && styles.scrollPadKeyboard]}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryRow}>
          {categoryChips.map((chip, index) => (
            <Pressable
              accessibilityLabel={`search-category-${index}`}
              key={chip}
              style={[styles.categoryChip, index === 0 && styles.categoryChipActive]}
              testID={`search-category-${index}`}
            >
              <Text style={[styles.categoryText, index === 0 && styles.categoryTextActive]}>{chip}</Text>
            </Pressable>
          ))}
        </ScrollView>
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
            returnKeyType="search"
            blurOnSubmit
            onBlur={() => setIsInputFocused(false)}
            onFocus={() => setIsInputFocused(true)}
            onSubmitEditing={Keyboard.dismiss}
          />
          {isInputFocused && (
            <Pressable accessibilityLabel="dismiss-search-keyboard" testID="dismiss-search-keyboard" style={styles.dismissKeyboardButton} onPress={Keyboard.dismiss}>
              <Ionicons name="chevron-down-circle" color="#dbeafe" size={20} />
            </Pressable>
          )}
        </View>
        <View style={styles.searchHeader}>
          <View>
            <Text style={styles.searchHeading}>{hasQuery ? t.searchResults : t.topResults}</Text>
            <Text style={styles.resultMeta}>{resultLabel}</Text>
          </View>
          {hasQuery && (
            <Pressable accessibilityLabel={t.clearSearch} testID="clear-search" style={styles.clearSearchButton} onPress={() => setQuery("")}>
              <Ionicons name="close-circle" color="#dbeafe" size={18} />
            </Pressable>
          )}
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
        {visibleEvents.length === 0 ? (
          <Text style={styles.empty}>{emptyCopy}</Text>
        ) : (
          <View style={styles.resultList}>
            {visibleEvents.map((event) => {
              const topMarket = event.markets[0];
              const topOutcome = topMarket.outcomes[0];
              const outcomeCount = event.markets.reduce((total, market) => total + market.outcomes.length, 0);
              const volume = 8200 + outcomeCount * 1150;
              const liquidity = 4200 + event.markets.length * 950;
              const isSaved = savedEventIds.has(event.id);
              return (
                <Pressable
                  accessibilityLabel={`search-result-${event.id}`}
                  key={event.id}
                  onPress={() => openEvent(event)}
                  style={styles.resultRow}
                  testID={`search-result-${event.id}`}
                >
                  <View style={styles.resultIcon}>
                    <Text style={styles.resultIconText}>{event.teams[0]?.flag ?? "WC"}</Text>
                  </View>
                  <View style={styles.resultBody}>
                    <Text style={styles.resultKicker}>{label(locale, { label: "Sports - Soccer", zhLabel: "\u4f53\u80b2 - \u8db3\u7403" })}</Text>
                    <Text style={styles.resultTitle}>{label(locale, event)}</Text>
                    <View style={styles.resultStats}>
                      <Text style={styles.resultStat}>{t.volume}: {money(volume)}</Text>
                      <Text style={styles.resultStat}>{money(Math.round(volume * 0.08))} today</Text>
                      <Text style={styles.resultStat}>{t.liquidity}: {money(liquidity)}</Text>
                    </View>
                    <View style={styles.resultStats}>
                      <Text style={styles.resultStat}>Chat {420 + outcomeCount * 37}</Text>
                      <Text style={styles.resultStat}>Ends {event.startsAt}</Text>
                    </View>
                  </View>
                  <View style={styles.resultRight}>
                    <Text style={styles.resultProbability}>{topOutcome.probability}%</Text>
                    <Text style={styles.resultOutcome}>{label(locale, topOutcome)}</Text>
                    <View style={styles.resultActions}>
                      {toggleSavedEvent && (
                        <Pressable
                          accessibilityLabel={`save-event-${event.id}`}
                          onPress={(pressEvent) => {
                            pressEvent.stopPropagation();
                            toggleSavedEvent(event);
                          }}
                          style={styles.compactSaveButton}
                          testID={`save-event-${event.id}`}
                        >
                          <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} color={isSaved ? "#fbbf24" : "#8ea0b8"} size={23} />
                        </Pressable>
                      )}
                      <Ionicons name="chevron-forward" color="#8ea0b8" size={22} />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
        {canLoadMore && (
          <Pressable
            accessibilityLabel={`search-load-more-results visible-${visibleEvents.length}-next-10`}
            onPress={loadMoreResults}
            style={styles.loadMoreButton}
            testID="search-load-more-results"
          >
            <Text style={styles.loadMoreText}>
              {isLoadingMoreEvents ? (locale === "zh" ? "\u52a0\u8f7d\u4e2d" : "Loading") : (locale === "zh" ? "\u52a0\u8f7d\u66f4\u591a\u7ed3\u679c" : "Load 10 more")}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1 },
  scrollPad: { paddingHorizontal: 16, paddingBottom: 110 },
  scrollPadKeyboard: { paddingBottom: 360 },
  categoryScroll: { marginHorizontal: -16, marginBottom: 16 },
  categoryRow: { gap: 10, paddingHorizontal: 16 },
  categoryChip: { height: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, borderRadius: 10, backgroundColor: "transparent" },
  categoryChipActive: { backgroundColor: "#1f2937" },
  categoryText: { color: "#8ea0b8", fontSize: 16, fontWeight: "900" },
  categoryTextActive: { color: "#f8fafc" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, height: 52, paddingHorizontal: 14, borderRadius: 12, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginBottom: 14 },
  searchInput: { flex: 1, color: "#f8fafc", fontSize: 16, fontWeight: "700" },
  dismissKeyboardButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#1f2937" },
  searchHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  searchHeading: { color: "#f8fafc", fontSize: 20, fontWeight: "900" },
  resultMeta: { color: "#8ea0b8", fontSize: 13, fontWeight: "800", marginTop: 3 },
  clearSearchButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#1f2937" },
  sortRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  sortButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  sortButtonActive: { backgroundColor: "#1f2937", borderColor: "#3b82f6" },
  sortText: { color: "#8ea0b8", fontSize: 12, fontWeight: "900" },
  sortTextActive: { color: "#dbeafe" },
  resultList: { borderTopWidth: 1, borderTopColor: "#263247" },
  resultRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: "#263247" },
  resultIcon: { width: 58, height: 58, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#1f2937" },
  resultIconText: { fontSize: 30 },
  resultBody: { flex: 1, minWidth: 0 },
  resultKicker: { color: "#8ea0b8", fontSize: 13, fontWeight: "900", marginBottom: 5 },
  resultTitle: { color: "#f8fafc", fontSize: 21, lineHeight: 26, fontWeight: "900", marginBottom: 8 },
  resultStats: { flexDirection: "row", flexWrap: "wrap", columnGap: 10, rowGap: 4, marginTop: 2 },
  resultStat: { color: "#8ea0b8", fontSize: 12, fontWeight: "800" },
  resultRight: { width: 88, alignItems: "flex-end", paddingTop: 4 },
  resultProbability: { color: "#f8fafc", fontSize: 31, lineHeight: 36, fontWeight: "900" },
  resultOutcome: { color: "#8ea0b8", fontSize: 13, fontWeight: "900", marginTop: 2, textAlign: "right" },
  resultActions: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  compactSaveButton: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  loadMoreButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 12, borderRadius: 12, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  loadMoreText: { color: "#dbeafe", fontSize: 15, fontWeight: "900" },
  empty: { color: "#94a3b8", textAlign: "center", marginTop: 30, fontWeight: "800" },
});
