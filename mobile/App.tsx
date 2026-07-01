import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PolyApi } from "./src/api";
import type { EventDetail, EventSummary, Market, Outcome } from "./src/types";

const DEFAULT_API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1:3000";
const DEFAULT_API_KEY = process.env.EXPO_PUBLIC_API_KEY || "";

type Tab = "markets" | "portfolio" | "settings";
type Ticket = {
  market: Market;
  outcome: Outcome;
  side: "BUY" | "SELL";
};

const asNumber = (value: string | number | null | undefined, fallback = 0) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const probability = (value: string | number | null | undefined) =>
  `${Math.round(asNumber(value, 0.5) * 100)}%`;

const money = (value: number) => `$${value.toFixed(2)}`;

const formatStart = (raw: string | null) => {
  if (!raw) return "Time TBD";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Time TBD";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

export default function App() {
  const [tab, setTab] = useState<Tab>("markets");
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE);
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    AsyncStorage.multiGet(["apiBaseUrl", "apiKey"]).then((items) => {
      const stored = Object.fromEntries(items);
      if (stored.apiBaseUrl) setApiBaseUrl(stored.apiBaseUrl);
      if (stored.apiKey) setApiKey(stored.apiKey);
    });
  }, []);

  const api = useMemo(() => new PolyApi(apiBaseUrl, apiKey), [apiBaseUrl, apiKey]);

  const loadEvents = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);
      setError(null);
      try {
        const payload = await api.listWorldCupEvents(search);
        setEvents(payload.events);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load markets.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [api, search],
  );

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const openEvent = async (event: EventSummary) => {
    setLoading(true);
    setError(null);
    try {
      setSelectedEvent(await api.getEvent(event.slug));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load event.");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    await AsyncStorage.multiSet([
      ["apiBaseUrl", apiBaseUrl],
      ["apiKey", apiKey],
    ]);
    Alert.alert("Saved", "Mobile app settings were updated.");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.shell}>
        <Header selectedEvent={selectedEvent?.event ?? null} onBack={() => setSelectedEvent(null)} />

        {tab === "markets" && (
          <MarketsScreen
            loading={loading}
            refreshing={refreshing}
            error={error}
            events={events}
            selectedEvent={selectedEvent}
            search={search}
            setSearch={setSearch}
            reload={() => loadEvents("refresh")}
            submitSearch={() => loadEvents()}
            openEvent={openEvent}
            openTicket={(market, outcome, side) => setTicket({ market, outcome, side })}
          />
        )}

        {tab === "portfolio" && <PortfolioScreen />}

        {tab === "settings" && (
          <SettingsScreen
            apiBaseUrl={apiBaseUrl}
            apiKey={apiKey}
            setApiBaseUrl={setApiBaseUrl}
            setApiKey={setApiKey}
            saveSettings={saveSettings}
          />
        )}

        <BottomTabs tab={tab} setTab={setTab} />
      </View>

      <TradeTicket ticket={ticket} api={api} close={() => setTicket(null)} />
    </SafeAreaView>
  );
}

function Header({ selectedEvent, onBack }: { selectedEvent: EventSummary | null; onBack: () => void }) {
  return (
    <View style={styles.header}>
      {selectedEvent ? (
        <Pressable style={styles.iconButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color="#122033" />
        </Pressable>
      ) : (
        <View style={styles.mark}>
        <Text style={styles.markText}>H</Text>
        </View>
      )}
      <View style={styles.headerCopy}>
        <Text style={styles.kicker}>Holiwyn</Text>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {selectedEvent?.title ?? "Match odds and predictions"}
        </Text>
      </View>
      <View style={styles.livePill}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>Live</Text>
      </View>
    </View>
  );
}

function MarketsScreen(props: {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  events: EventSummary[];
  selectedEvent: EventDetail | null;
  search: string;
  setSearch: (value: string) => void;
  submitSearch: () => void;
  reload: () => void;
  openEvent: (event: EventSummary) => void;
  openTicket: (market: Market, outcome: Outcome, side: "BUY" | "SELL") => void;
}) {
  if (props.selectedEvent) {
    return <EventScreen detail={props.selectedEvent} openTicket={props.openTicket} />;
  }

  return (
    <View style={styles.content}>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#667085" />
        <TextInput
          value={props.search}
          onChangeText={props.setSearch}
          onSubmitEditing={props.submitSearch}
          placeholder="Search World Cup markets"
          placeholderTextColor="#8993a4"
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>
      <View style={styles.filterRow}>
        <Text style={styles.filterActive}>World Cup</Text>
        <Text style={styles.filter}>Soccer</Text>
        <Text style={styles.filter}>Live</Text>
      </View>

      {props.error && <Text style={styles.error}>{props.error}</Text>}

      {props.loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#155eef" />
          <Text style={styles.muted}>Loading live markets</Text>
        </View>
      ) : (
        <FlatList
          data={props.events}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={props.refreshing} onRefresh={props.reload} />}
          contentContainerStyle={styles.listPad}
          renderItem={({ item }) => <EventCard event={item} onPress={() => props.openEvent(item)} />}
          ListEmptyComponent={<Text style={styles.empty}>No World Cup markets found for this server.</Text>}
        />
      )}
    </View>
  );
}

function EventCard({ event, onPress }: { event: EventSummary; onPress: () => void }) {
  const hasScore = event.homeScore !== null || event.awayScore !== null;
  return (
    <Pressable style={styles.eventCard} onPress={onPress}>
      <View style={styles.eventTop}>
        <View>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventMeta}>
            {event.liveStatus ?? event.status} · {formatStart(event.startTime)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#98a2b3" />
      </View>
      {hasScore && (
        <Text style={styles.score}>
          {event.homeTeamName ?? "Home"} {event.homeScore ?? 0} - {event.awayScore ?? 0}{" "}
          {event.awayTeamName ?? "Away"}
        </Text>
      )}
      <View style={styles.cardFooter}>
        <Text style={styles.stat}>{event.activeMarketCount} active</Text>
        <Text style={styles.stat}>{event.marketCount} markets</Text>
        {(event.topOutcomes ?? []).slice(0, 2).map((outcome) => (
          <Text key={outcome} style={styles.outcomeTag} numberOfLines={1}>
            {outcome}
          </Text>
        ))}
      </View>
    </Pressable>
  );
}

function EventScreen({
  detail,
  openTicket,
}: {
  detail: EventDetail;
  openTicket: (market: Market, outcome: Outcome, side: "BUY" | "SELL") => void;
}) {
  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.detailPad}>
      <View style={styles.scoreboard}>
        <Text style={styles.matchTitle}>{detail.event.homeTeamName ?? detail.event.title}</Text>
        <Text style={styles.matchScore}>
          {detail.event.homeScore ?? 0} - {detail.event.awayScore ?? 0}
        </Text>
        <Text style={styles.matchTitle}>{detail.event.awayTeamName ?? "World Cup"}</Text>
        <Text style={styles.matchMeta}>
          {detail.event.period ?? detail.event.liveStatus ?? detail.event.status} · {detail.event.clock ?? formatStart(detail.event.startTime)}
        </Text>
      </View>

      {detail.markets.map((market) => (
        <View key={market.id} style={styles.marketBlock}>
          <Text style={styles.marketTitle}>{market.title}</Text>
          <View style={styles.outcomesGrid}>
            {market.outcomes.map((outcome) => (
              <View key={outcome.id} style={styles.outcomeBox}>
                <Text style={styles.outcomeName} numberOfLines={2}>
                  {outcome.label || outcome.name}
                </Text>
                <Text style={styles.prob}>{probability(outcome.price)}</Text>
                <View style={styles.tradeRow}>
                  <Pressable style={styles.buyButton} onPress={() => openTicket(market, outcome, "BUY")}>
                    <Text style={styles.buyText}>Buy</Text>
                  </Pressable>
                  <Pressable style={styles.sellButton} onPress={() => openTicket(market, outcome, "SELL")}>
                    <Text style={styles.sellText}>Sell</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function TradeTicket({ ticket, api, close }: { ticket: Ticket | null; api: PolyApi; close: () => void }) {
  const [shares, setShares] = useState("10");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const impliedPrice = price || asNumber(ticket?.outcome.price, 0.5).toFixed(2);
  const cost = asNumber(shares) * asNumber(impliedPrice);

  useEffect(() => {
    if (ticket) setPrice(asNumber(ticket.outcome.price, 0.5).toFixed(2));
  }, [ticket]);

  const place = async () => {
    if (!ticket) return;
    setSubmitting(true);
    try {
      await api.placeLimitOrder({
        marketId: ticket.market.id,
        outcomeId: ticket.outcome.id,
        side: ticket.side,
        price: impliedPrice,
        size: shares,
      });
      Alert.alert("Order submitted", "Your limit order was sent to the server.");
      close();
    } catch (err) {
      Alert.alert("Order not placed", err instanceof Error ? err.message : "Could not place the order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={Boolean(ticket)} animationType="slide" transparent>
      <View style={styles.modalShade}>
        <View style={styles.ticket}>
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketTitle}>{ticket?.side ?? "Buy"} {ticket?.outcome.label}</Text>
            <Pressable style={styles.iconButton} onPress={close}>
              <Ionicons name="close" size={22} color="#122033" />
            </Pressable>
          </View>
          <Text style={styles.ticketMarket} numberOfLines={2}>{ticket?.market.title}</Text>
          <View style={styles.ticketFields}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Price</Text>
              <TextInput value={price} onChangeText={setPrice} keyboardType="decimal-pad" style={styles.fieldInput} />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Shares</Text>
              <TextInput value={shares} onChangeText={setShares} keyboardType="decimal-pad" style={styles.fieldInput} />
            </View>
          </View>
          <View style={styles.estimateRow}>
            <Text style={styles.estimateLabel}>Estimated cost</Text>
            <Text style={styles.estimateValue}>{money(cost)}</Text>
          </View>
          <Pressable style={styles.primaryAction} onPress={place} disabled={submitting}>
            <Text style={styles.primaryActionText}>{submitting ? "Submitting" : "Submit limit order"}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function PortfolioScreen() {
  return (
    <View style={styles.content}>
      <View style={styles.placeholder}>
        <Ionicons name="wallet-outline" size={30} color="#155eef" />
        <Text style={styles.placeholderTitle}>Portfolio is next</Text>
        <Text style={styles.placeholderText}>
          The server already has account, order, and position APIs. The next pass should add mobile sign-in and a guarded account view.
        </Text>
      </View>
    </View>
  );
}

function SettingsScreen(props: {
  apiBaseUrl: string;
  apiKey: string;
  setApiBaseUrl: (value: string) => void;
  setApiKey: (value: string) => void;
  saveSettings: () => void;
}) {
  return (
    <View style={styles.content}>
      <Text style={styles.settingsLabel}>API base URL</Text>
      <TextInput value={props.apiBaseUrl} onChangeText={props.setApiBaseUrl} style={styles.settingsInput} autoCapitalize="none" />
      <Text style={styles.settingsLabel}>API key token</Text>
      <TextInput
        value={props.apiKey}
        onChangeText={props.setApiKey}
        style={styles.settingsInput}
        autoCapitalize="none"
        secureTextEntry
        placeholder="pk_live_..."
      />
      <Pressable style={styles.primaryAction} onPress={props.saveSettings}>
        <Text style={styles.primaryActionText}>Save settings</Text>
      </Pressable>
    </View>
  );
}

function BottomTabs({ tab, setTab }: { tab: Tab; setTab: (tab: Tab) => void }) {
  const item = (name: Tab, icon: keyof typeof Ionicons.glyphMap, label: string) => (
    <Pressable style={styles.tabButton} onPress={() => setTab(name)}>
      <Ionicons name={icon} size={22} color={tab === name ? "#155eef" : "#667085"} />
      <Text style={[styles.tabText, tab === name && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={styles.tabs}>
      {item("markets", "football-outline", "Markets")}
      {item("portfolio", "pie-chart-outline", "Portfolio")}
      {item("settings", "settings-outline", "Settings")}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f8fb" },
  shell: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e9f0",
  },
  mark: { width: 42, height: 42, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#122033" },
  markText: { color: "#ffffff", fontWeight: "800" },
  iconButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#edf1f7" },
  headerCopy: { flex: 1 },
  kicker: { color: "#667085", fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  headerTitle: { color: "#122033", fontSize: 18, fontWeight: "800" },
  livePill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#eaf7ee" },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#17a34a" },
  liveText: { color: "#137333", fontSize: 12, fontWeight: "800" },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },
  searchRow: { height: 48, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e5e9f0" },
  searchInput: { flex: 1, color: "#122033", fontSize: 15 },
  filterRow: { flexDirection: "row", gap: 8, marginTop: 12, marginBottom: 8 },
  filterActive: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "#155eef", color: "#ffffff", fontWeight: "800" },
  filter: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "#ffffff", color: "#475467", fontWeight: "700" },
  error: { color: "#b42318", marginVertical: 8, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  muted: { color: "#667085" },
  listPad: { paddingBottom: 96 },
  eventCard: { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e5e9f0", borderRadius: 8, padding: 14, marginTop: 10 },
  eventTop: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  eventTitle: { color: "#122033", fontSize: 16, lineHeight: 21, fontWeight: "800" },
  eventMeta: { color: "#667085", marginTop: 4, fontWeight: "600" },
  score: { color: "#122033", fontSize: 20, fontWeight: "900", marginTop: 12 },
  cardFooter: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  stat: { color: "#475467", backgroundColor: "#f2f4f7", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 7, fontWeight: "700" },
  outcomeTag: { color: "#155eef", backgroundColor: "#eff4ff", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 7, maxWidth: 130, fontWeight: "700" },
  empty: { color: "#667085", textAlign: "center", marginTop: 40, fontWeight: "700" },
  detailPad: { paddingBottom: 110 },
  scoreboard: { backgroundColor: "#122033", borderRadius: 8, padding: 16, marginBottom: 14 },
  matchTitle: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  matchScore: { color: "#ffffff", fontSize: 36, fontWeight: "900", marginVertical: 6 },
  matchMeta: { color: "#c7d7fe", marginTop: 10, fontWeight: "700" },
  marketBlock: { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e5e9f0", borderRadius: 8, padding: 14, marginBottom: 12 },
  marketTitle: { color: "#122033", fontSize: 16, lineHeight: 21, fontWeight: "800", marginBottom: 12 },
  outcomesGrid: { gap: 10 },
  outcomeBox: { borderWidth: 1, borderColor: "#e5e9f0", borderRadius: 8, padding: 12, backgroundColor: "#fbfcfe" },
  outcomeName: { color: "#122033", fontWeight: "800", minHeight: 36 },
  prob: { color: "#155eef", fontSize: 26, fontWeight: "900", marginVertical: 8 },
  tradeRow: { flexDirection: "row", gap: 8 },
  buyButton: { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 8, backgroundColor: "#155eef" },
  sellButton: { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 8, backgroundColor: "#eef2f6" },
  buyText: { color: "#ffffff", fontWeight: "900" },
  sellText: { color: "#122033", fontWeight: "900" },
  tabs: { height: 72, flexDirection: "row", borderTopWidth: 1, borderTopColor: "#e5e9f0", backgroundColor: "#ffffff" },
  tabButton: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  tabText: { color: "#667085", fontSize: 12, fontWeight: "800" },
  tabTextActive: { color: "#155eef" },
  modalShade: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(18,32,51,0.3)" },
  ticket: { backgroundColor: "#ffffff", padding: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  ticketHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  ticketTitle: { flex: 1, color: "#122033", fontSize: 20, fontWeight: "900" },
  ticketMarket: { color: "#667085", marginTop: 6, fontWeight: "700" },
  ticketFields: { flexDirection: "row", gap: 10, marginTop: 16 },
  field: { flex: 1 },
  fieldLabel: { color: "#475467", fontSize: 12, fontWeight: "800", marginBottom: 6, textTransform: "uppercase" },
  fieldInput: { height: 48, borderWidth: 1, borderColor: "#d0d5dd", borderRadius: 8, paddingHorizontal: 12, color: "#122033", fontSize: 16, fontWeight: "800" },
  estimateRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: "#e5e9f0" },
  estimateLabel: { color: "#667085", fontWeight: "800" },
  estimateValue: { color: "#122033", fontWeight: "900" },
  primaryAction: { alignItems: "center", justifyContent: "center", height: 50, borderRadius: 8, backgroundColor: "#155eef", marginTop: 12 },
  primaryActionText: { color: "#ffffff", fontWeight: "900", fontSize: 16 },
  placeholder: { alignItems: "center", justifyContent: "center", padding: 24, marginTop: 80 },
  placeholderTitle: { color: "#122033", fontSize: 20, fontWeight: "900", marginTop: 12 },
  placeholderText: { color: "#667085", lineHeight: 21, textAlign: "center", marginTop: 8, fontWeight: "600" },
  settingsLabel: { color: "#475467", fontWeight: "800", marginTop: 14, marginBottom: 6 },
  settingsInput: { height: 50, borderWidth: 1, borderColor: "#d0d5dd", borderRadius: 8, backgroundColor: "#ffffff", paddingHorizontal: 12, color: "#122033", fontWeight: "700" },
});
