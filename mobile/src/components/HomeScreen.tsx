import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import type { Event, Locale, Market, Outcome } from "../mocks/worldCup";
import { MarketList } from "./MarketLists";
import { initialHomeMatchCount, nextHomeMatchCount } from "../services/homePaginationService";
import type { HomeEventFeedFilter } from "../services/homeEventFeedService";

export type HomeFilter = Extract<HomeEventFeedFilter, "all" | "live" | "today">;

type HomeScreenCopy = {
  marketSearch: string;
  clearSearch: string;
  noResults: string;
  searchAll: string;
  searchLive: string;
  today: string;
  saved: string;
  noSavedMarkets: string;
};

export function HomeScreen({
  locale,
  t,
  events,
  openEvent,
  openTicket,
  homeFilter,
  setHomeFilter,
  canLoadMoreEvents,
  isLoadingMoreEvents = false,
  loadMoreEvents,
}: {
  locale: Locale;
  t: HomeScreenCopy;
  events: Event[];
  openEvent: (event: Event) => void;
  openTicket: (market: Market, outcome: Outcome, event?: Event) => void;
  homeFilter: HomeFilter;
  setHomeFilter: (filter: HomeFilter) => void;
  canLoadMoreEvents?: boolean;
  isLoadingMoreEvents?: boolean;
  loadMoreEvents?: () => void;
  savedEventIds: Set<string>;
  toggleSavedEvent: (event: Event) => void;
}) {
  const [visibleMatchCount, setVisibleMatchCount] = useState(initialHomeMatchCount);
  useEffect(() => {
    setVisibleMatchCount(initialHomeMatchCount());
  }, [homeFilter]);
  const homeFilters: Array<[HomeFilter, string]> = [
    ["all", t.searchAll],
    ["live", t.searchLive],
    ["today", t.today],
  ];
  const usesServerPaging = Boolean(loadMoreEvents);
  const visibleEvents = useMemo(
    () =>
      usesServerPaging
        ? events
        : homeFilter === "live"
          ? events.filter((event) => event.status === "live")
          : homeFilter === "today"
            ? events.filter((event) => event.status === "today")
            : events,
    [events, homeFilter, usesServerPaging],
  );
  const pagedEvents = usesServerPaging ? visibleEvents : visibleEvents.slice(0, visibleMatchCount);
  const canLoadMore = usesServerPaging ? Boolean(canLoadMoreEvents) : visibleMatchCount < visibleEvents.length;
  const loadMoreMatches = () => {
    if (!canLoadMore || isLoadingMoreEvents) return;
    if (usesServerPaging) {
      loadMoreEvents?.();
      return;
    }
    setVisibleMatchCount((current) => nextHomeMatchCount(current, visibleEvents.length));
  };
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    if (distanceFromBottom < 160) loadMoreMatches();
  };
  const emptyCopy = t.noResults;
  const liveCount = events.filter((event) => event.status === "live").length;
  const availableGameCount = events.length;

  return (
    <ScrollView onScroll={handleScroll} scrollEventThrottle={120} style={styles.content} contentContainerStyle={styles.scrollPad}>
      <View
        accessibilityLabel={`home-world-cup-games-focus home-compact-retail-feed World Cup matches live prediction-only-home visible-${pagedEvents.length}-of-${visibleEvents.length}`}
        style={styles.gamesFocusHeader}
        testID="home-world-cup-games-focus"
      >
        <View style={styles.gamesFocusText}>
          <Text style={styles.gamesFocusEyebrow}>{locale === "zh" ? "\u4e16\u754c\u676f" : "World Cup"}</Text>
          <Text style={styles.gamesFocusTitle}>{locale === "zh" ? "\u6bd4\u8d5b" : "Matches"}</Text>
        </View>
        <View style={styles.gamesFocusStats}>
          <Text style={styles.gamesFocusStat}>{availableGameCount} {locale === "zh" ? "\u573a" : "matches"}</Text>
          <Text style={[styles.gamesFocusStat, liveCount > 0 && styles.gamesFocusLive]}>{liveCount} {locale === "zh" ? "\u6eda\u7403" : "live"}</Text>
        </View>
      </View>
      <View style={styles.filterRow}>
        {homeFilters.map(([value, text]) => (
          <Pressable
            key={value}
            accessibilityLabel={`home-filter-${value}`}
            testID={`home-filter-${value}`}
            style={[styles.filterChip, homeFilter === value && styles.filterChipActive]}
            onPress={() => {
              if (homeFilter !== value) setHomeFilter(value);
            }}
          >
            <Text style={[styles.filterText, homeFilter === value && styles.filterTextActive]}>{text}</Text>
          </Pressable>
        ))}
      </View>
      <View
        accessible
        accessibilityLabel="home-secondary-markets-hidden-local-mvp home-games-only-retail-flow"
        style={styles.mvpHiddenState}
        testID="home-secondary-markets-hidden-local-mvp"
      />
        <MarketList
          locale={locale}
          events={pagedEvents}
          empty={emptyCopy}
          openEvent={openEvent}
          openTicket={openTicket}
        />
      {canLoadMore && (
        <Pressable
          accessibilityLabel={`home-load-more-matches visible-${pagedEvents.length}-next-10`}
          onPress={loadMoreMatches}
          style={styles.loadMoreButton}
          testID="home-load-more-matches"
        >
          <Text style={styles.loadMoreText}>
            {isLoadingMoreEvents ? (locale === "zh" ? "\u52a0\u8f7d\u4e2d" : "Loading") : (locale === "zh" ? "\u52a0\u8f7d\u66f4\u591a\u6bd4\u8d5b" : "Load 10 more")}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollPad: { width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 14, paddingBottom: 110 },
  gamesFocusHeader: { marginTop: 0, paddingTop: 6, paddingBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  gamesFocusText: { flex: 1, minWidth: 0 },
  gamesFocusEyebrow: { color: "#60a5fa", fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  gamesFocusTitle: { color: "#f8fafc", fontSize: 24, fontWeight: "900", marginTop: 1 },
  gamesFocusStats: { alignItems: "flex-end", gap: 4 },
  gamesFocusStat: { color: "#cbd5e1", fontSize: 12, fontWeight: "900" },
  gamesFocusLive: { color: "#ef4444" },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  filterChip: { minHeight: 34, justifyContent: "center", paddingHorizontal: 13, borderRadius: 999, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  filterChipActive: { backgroundColor: "#1d6dff", borderColor: "#1d6dff" },
  filterText: { color: "#8ea0b8", fontWeight: "900" },
  filterTextActive: { color: "#ffffff" },
  loadMoreButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 12, borderRadius: 12, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  loadMoreText: { color: "#dbeafe", fontSize: 15, fontWeight: "900" },
  mvpHiddenState: { width: 1, height: 1, opacity: 0.01 },
  savedEmptyText: { color: "#94a3b8", fontWeight: "900", textAlign: "center", marginTop: 2, marginBottom: 14 },
});
