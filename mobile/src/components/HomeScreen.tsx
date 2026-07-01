import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { Event, Locale, Market, Outcome } from "../mocks/worldCup";
import { FeaturedFuture } from "./FeaturedFuture";
import { FutureList, MarketList } from "./MarketLists";
import { SportNav } from "./SportNav";
import { WorldCupSegmented, WorldCupTab } from "./WorldCupSegmented";

type HomeScreenCopy = {
  games: string;
  futures: string;
  trending: string;
  marketSearch: string;
  noResults: string;
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
}) {
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
      <WorldCupSegmented left={t.games} right={t.futures} value={worldCupTab} setValue={setWorldCupTab} />
      {worldCupTab === "games" ? (
        <MarketList locale={locale} events={events} empty={t.noResults} openEvent={openEvent} openTicket={openTicket} />
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
});
