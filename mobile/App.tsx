import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PolyApi } from "./src/api";
import { normalizeEventDetail } from "./src/adapters/worldCupAdapter";
import { BottomTabs } from "./src/components/BottomTabs";
import { EventDetail } from "./src/components/EventDetail";
import { Header } from "./src/components/Header";
import { HomeScreen } from "./src/components/HomeScreen";
import { LiveScreen } from "./src/components/LiveScreen";
import { Portfolio, portfolioPositionValue, Position } from "./src/components/Portfolio";
import { SearchScreen } from "./src/components/SearchScreen";
import { Ticket, TradeTicket } from "./src/components/TradeTicket";
import { WorldCupTab } from "./src/components/WorldCupSegmented";
import { appCopy } from "./src/localization/appCopy";
import {
  Event,
  Locale,
  Market,
  Outcome,
  worldCupEvents,
  worldCupFutures,
} from "./src/mocks/worldCup";
import { OrderMode, submitTicketOrder } from "./src/services/orderService";

const DEFAULT_API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "http://10.0.2.2:3000";
const ORDER_MODE: OrderMode = process.env.EXPO_PUBLIC_ORDER_MODE === "server" ? "server" : "mock";

type MainTab = "home" | "live" | "portfolio" | "search";
export default function App() {
  const [locale, setLocale] = useState<Locale>("en");
  const [mainTab, setMainTab] = useState<MainTab>("home");
  const [worldCupTab, setWorldCupTab] = useState<WorldCupTab>("games");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [query, setQuery] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [balance, setBalance] = useState(10000);
  const [positions, setPositions] = useState<Position[]>([]);
  const [events, setEvents] = useState<Event[]>(worldCupEvents);
  const [isRefreshingLive, setIsRefreshingLive] = useState(false);
  const [liveRefreshTick, setLiveRefreshTick] = useState(0);
  const [futures] = useState<Market[]>(worldCupFutures);
  const t = appCopy[locale];
  const api = useMemo(() => new PolyApi(DEFAULT_API_BASE), []);
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadBackendWorldCup = useCallback(async () => {
    try {
      const payload = await api.listWorldCupEvents();
      const details = await Promise.all(
        payload.events.slice(0, 8).map(async (event) => {
          try {
            return normalizeEventDetail(await api.getEvent(event.slug));
          } catch {
            return null;
          }
        }),
      );
      const normalized = details.filter((event): event is Event => Boolean(event));
      if (mounted.current && normalized.length > 0) {
        setEvents(normalized);
      }
    } catch {
      if (mounted.current) setEvents(worldCupEvents);
    }
  }, [api]);

  useEffect(() => {
    loadBackendWorldCup();
  }, [loadBackendWorldCup]);

  const refreshLiveMarkets = useCallback(async () => {
    setIsRefreshingLive(true);
    try {
      await loadBackendWorldCup();
      if (mounted.current) setLiveRefreshTick((tick) => tick + 1);
    } finally {
      if (mounted.current) setIsRefreshingLive(false);
    }
  }, [loadBackendWorldCup]);

  const filteredEvents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return events;
    return events.filter((event) =>
      [event.title, event.zhTitle, event.tag, event.zhTag, ...event.teams.flatMap((team) => [team.name, team.zhName])]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [events, query]);

  const openTicket = (market: Market, outcome: Outcome, event?: Event) => {
    setTicket({ market, outcome, event, side: "buy" });
  };

  const placeOrder = async (amount: number, side: "buy" | "sell") => {
    if (!ticket || amount <= 0) return;
    const cost = Math.min(amount, balance);
    const result = await submitTicketOrder({
      mode: ORDER_MODE,
      api,
      event: ticket.event,
      market: ticket.market,
      outcome: ticket.outcome,
      side,
      amount: cost,
    });
    setBalance((current) => current - cost);
    setPositions((current) => [
      {
        id: result.id,
        mode: result.mode,
        title: result.title,
        outcome: result.outcome,
        side: result.side,
        amount: result.amount,
        probability: result.probability,
      },
      ...current,
    ]);
    setTicket(null);
    setMainTab("portfolio");
  };

  const closePosition = (position: Position) => {
    setBalance((current) => current + portfolioPositionValue(position));
    setPositions((current) => current.filter((item) => item.id !== position.id));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.shell}>
        <Header
          locale={locale}
          promo={t.promo}
          language={t.language}
          toggleLanguage={() => setLocale((current) => (current === "en" ? "zh" : "en"))}
        />
        {selectedEvent ? (
          <EventDetail
            event={selectedEvent}
            locale={locale}
            t={t}
            openTicket={openTicket}
            goBack={() => setSelectedEvent(null)}
          />
        ) : (
          <>
            {mainTab === "home" && (
              <HomeScreen
                locale={locale}
                t={t}
                worldCupTab={worldCupTab}
                setWorldCupTab={setWorldCupTab}
                events={filteredEvents}
                query={query}
                setQuery={setQuery}
                openEvent={setSelectedEvent}
                openTicket={openTicket}
                futures={futures}
              />
            )}
            {mainTab === "live" && (
              <LiveScreen
                locale={locale}
                t={t}
                events={events.filter((event) => event.status === "live")}
                isRefreshing={isRefreshingLive}
                refreshTick={liveRefreshTick}
                onRefresh={refreshLiveMarkets}
                openEvent={setSelectedEvent}
                openTicket={openTicket}
              />
            )}
            {mainTab === "portfolio" && (
              <Portfolio locale={locale} t={t} balance={balance} positions={positions} closePosition={closePosition} />
            )}
            {mainTab === "search" && (
              <SearchScreen
                locale={locale}
                t={t}
                query={query}
                setQuery={setQuery}
                events={filteredEvents}
                openEvent={setSelectedEvent}
                openTicket={openTicket}
              />
            )}
          </>
        )}
        {!selectedEvent && <BottomTabs tab={mainTab} setTab={setMainTab} t={t} />}
      </View>
      <TradeTicket
        locale={locale}
        t={t}
        ticket={ticket}
        balance={balance}
        close={() => setTicket(null)}
        placeOrder={placeOrder}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#070c14" },
  shell: { flex: 1, backgroundColor: "#070c14" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 },
  logo: { width: 44, height: 44, borderRadius: 8, backgroundColor: "#101827", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#263247" },
  logoMark: { color: "#f8fafc", fontWeight: "900", fontSize: 24 },
  headerMain: { flex: 1 },
  brand: { color: "#f8fafc", fontSize: 26, fontWeight: "900" },
  subBrand: { color: "#8ea0b8", fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  langButton: { paddingHorizontal: 10, paddingVertical: 9, borderRadius: 8, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  langText: { color: "#cbd5e1", fontWeight: "900" },
  promoButton: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: "#1d6dff" },
  promoText: { color: "#ffffff", fontWeight: "900" },
  bell: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  content: { flex: 1 },
  scrollPad: { paddingHorizontal: 16, paddingBottom: 110 },
  sportRow: { gap: 16, paddingVertical: 8 },
  sportItem: { alignItems: "center", gap: 6, opacity: 0.66 },
  sportItemActive: { opacity: 1 },
  sportIcon: { fontSize: 34 },
  sportLabel: { color: "#8ea0b8", fontSize: 14, fontWeight: "800" },
  sportLabelActive: { color: "#f8fafc" },
  featureCard: { marginTop: 14, padding: 18, borderRadius: 16, backgroundColor: "#15365f", borderWidth: 1, borderColor: "#2a5f9f" },
  featureHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  featureTitle: { color: "#f8fafc", fontSize: 28, fontWeight: "900", letterSpacing: 0 },
  featureBadge: { fontSize: 38 },
  futureOutcomes: { flexDirection: "row", gap: 10, marginTop: 26 },
  futureOutcome: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.1)" },
  futureName: { color: "#f8fafc", fontWeight: "800" },
  futureProb: { color: "#c7d2fe", fontSize: 20, fontWeight: "900", marginTop: 4 },
  sectionTitle: { color: "#f8fafc", fontSize: 24, fontWeight: "900", marginTop: 24, marginBottom: 12 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, height: 52, paddingHorizontal: 14, borderRadius: 12, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginBottom: 14 },
  searchInput: { flex: 1, color: "#f8fafc", fontSize: 16, fontWeight: "700" },
  segmented: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#263247", marginBottom: 10 },
  segment: { flex: 1, alignItems: "center", paddingVertical: 14 },
  segmentActive: { borderBottomWidth: 3, borderBottomColor: "#f8fafc" },
  segmentText: { color: "#8ea0b8", fontSize: 18, fontWeight: "800" },
  segmentTextActive: { color: "#f8fafc" },
  eventList: { gap: 12 },
  eventCard: { padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  eventMetaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  timeText: { color: "#94a3b8", fontWeight: "800" },
  eventTag: { color: "#94a3b8", fontWeight: "800" },
  liveTag: { color: "#ff4d4f" },
  eventTitle: { color: "#f8fafc", fontSize: 20, fontWeight: "900", marginBottom: 8 },
  teamRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 9 },
  teamName: { flex: 1, color: "#f8fafc", fontSize: 18, fontWeight: "800" },
  oddsText: { color: "#a7b1c2", width: 48, textAlign: "right", fontSize: 17, fontWeight: "800" },
  probButton: { minWidth: 86, alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 },
  probButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
  empty: { color: "#94a3b8", textAlign: "center", marginTop: 30, fontWeight: "800" },
  backButton: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingVertical: 8, paddingRight: 12 },
  backText: { color: "#f8fafc", fontWeight: "900" },
  detailHero: { padding: 18, borderRadius: 16, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginBottom: 4 },
  detailMeta: { color: "#94a3b8", fontWeight: "800", marginBottom: 8 },
  detailTitle: { color: "#f8fafc", fontSize: 26, fontWeight: "900" },
  marketBlock: { padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginBottom: 12 },
  marketTitle: { color: "#f8fafc", fontSize: 19, fontWeight: "900", marginBottom: 8 },
  detailOutcome: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  balanceCard: { padding: 18, borderRadius: 16, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginTop: 10 },
  balanceLabel: { color: "#94a3b8", fontWeight: "800" },
  balanceValue: { color: "#f8fafc", fontSize: 34, fontWeight: "900", marginTop: 6 },
  emptyCard: { alignItems: "center", padding: 28, borderRadius: 16, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginTop: 16 },
  emptyTitle: { color: "#f8fafc", fontSize: 20, fontWeight: "900", marginTop: 10 },
  emptyText: { color: "#94a3b8", textAlign: "center", marginTop: 6, fontWeight: "700" },
  positionCard: { padding: 14, borderRadius: 14, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247", marginTop: 12 },
  positionTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "900" },
  positionMeta: { color: "#94a3b8", marginTop: 5, fontWeight: "800" },
  positionValue: { color: "#22c55e", fontSize: 22, fontWeight: "900", marginTop: 8 },
  tabs: { height: 74, flexDirection: "row", backgroundColor: "#080d16", borderTopWidth: 1, borderTopColor: "#1f2937" },
  tabButton: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  tabText: { color: "#64748b", fontWeight: "800", fontSize: 12 },
  tabTextActive: { color: "#1d6dff" },
  modalShade: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  ticket: { padding: 18, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: "#101827", borderWidth: 1, borderColor: "#263247" },
  ticketTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  ticketTitle: { color: "#f8fafc", fontSize: 24, fontWeight: "900" },
  ticketSub: { color: "#94a3b8", fontWeight: "800", marginTop: 4 },
  closeButton: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#1f2937" },
  ticketSideRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  sideButton: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, backgroundColor: "#1f2937" },
  sideButtonActive: { backgroundColor: "#1d6dff" },
  sideText: { color: "#94a3b8", fontWeight: "900" },
  sideTextActive: { color: "#ffffff" },
  inputLabel: { color: "#94a3b8", fontWeight: "800", marginTop: 18, marginBottom: 8 },
  amountInput: { height: 54, borderRadius: 12, paddingHorizontal: 14, backgroundColor: "#070c14", borderWidth: 1, borderColor: "#263247", color: "#f8fafc", fontSize: 22, fontWeight: "900" },
  estimateLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#263247" },
  estimateLabel: { color: "#94a3b8", fontWeight: "800" },
  estimateValue: { color: "#f8fafc", fontWeight: "900" },
  primaryButton: { height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#1d6dff", marginTop: 16 },
  primaryText: { color: "#ffffff", fontSize: 17, fontWeight: "900" },
});
