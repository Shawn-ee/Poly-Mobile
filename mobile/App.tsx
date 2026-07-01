import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BackHandler, Linking, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PolyApi } from "./src/api";
import { normalizeEventDetail } from "./src/adapters/worldCupAdapter";
import { AccountScreen } from "./src/components/AccountScreen";
import { BottomTabs } from "./src/components/BottomTabs";
import { EventDetail } from "./src/components/EventDetail";
import { Header } from "./src/components/Header";
import { HomeScreen } from "./src/components/HomeScreen";
import { LiveScreen } from "./src/components/LiveScreen";
import {
  OpenOrder,
  OrderConfirmation,
  Portfolio,
  PortfolioActivity,
  portfolioPositionValue,
  PortfolioSyncStatus,
  Position,
} from "./src/components/Portfolio";
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
import { loadPortfolioHistoryActivities } from "./src/services/portfolioHistoryService";
import { loadPortfolioSnapshot } from "./src/services/portfolioSnapshotService";

const DEFAULT_API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "http://10.0.2.2:3000";
const DEFAULT_API_KEY = process.env.EXPO_PUBLIC_API_KEY || "";
const ORDER_MODE: OrderMode = process.env.EXPO_PUBLIC_ORDER_MODE === "server" ? "server" : "mock";
const SAVED_EVENTS_STORAGE_KEY = "holiwyn.savedEventIds.v1";
const LANGUAGE_STORAGE_KEY = "holiwyn.language.v1";
const PORTFOLIO_STORAGE_KEY = "holiwyn.portfolio.v1";
const TICKET_DEFAULTS_STORAGE_KEY = "holiwyn.ticketDefaults.v1";
const SMOKE_OPEN_ORDER: OpenOrder = {
  id: "smoke-open-order",
  title: "Mexico vs. Ecuador winner",
  outcome: "Mexico",
  side: "buy",
  status: "OPEN",
  price: 0.47,
  remaining: 250,
};

type MainTab = "home" | "live" | "portfolio" | "search" | "account";
type StoredPortfolio = {
  balance?: number;
  positions?: Position[];
  latestOrder?: OrderConfirmation | null;
  openOrders?: OpenOrder[];
  activities?: PortfolioActivity[];
};
type TicketDefaults = {
  amount: string;
  side: "buy" | "sell";
};

export default function App() {
  const [locale, setLocale] = useState<Locale>("en");
  const [localeHydrated, setLocaleHydrated] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>("home");
  const [worldCupTab, setWorldCupTab] = useState<WorldCupTab>("games");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [query, setQuery] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [ticketOrderError, setTicketOrderError] = useState<string | null>(null);
  const [forceOrderFailure, setForceOrderFailure] = useState(false);
  const [balance, setBalance] = useState(10000);
  const [positions, setPositions] = useState<Position[]>([]);
  const [latestOrder, setLatestOrder] = useState<OrderConfirmation | null>(null);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [activities, setActivities] = useState<PortfolioActivity[]>([]);
  const [portfolioHydrated, setPortfolioHydrated] = useState(false);
  const [ticketDefaults, setTicketDefaults] = useState<TicketDefaults>({ amount: "100", side: "buy" });
  const [ticketDefaultsHydrated, setTicketDefaultsHydrated] = useState(false);
  const [portfolioSyncStatus, setPortfolioSyncStatus] = useState<PortfolioSyncStatus>(ORDER_MODE === "server" ? "syncing" : "hidden");
  const [events, setEvents] = useState<Event[]>(worldCupEvents);
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(() => new Set());
  const [savedEventIdsHydrated, setSavedEventIdsHydrated] = useState(false);
  const [forceAccountSignedIn, setForceAccountSignedIn] = useState(false);
  const [isRefreshingLive, setIsRefreshingLive] = useState(false);
  const [liveRefreshTick, setLiveRefreshTick] = useState(0);
  const [futures] = useState<Market[]>(worldCupFutures);
  const t = appCopy[locale];
  const api = useMemo(() => new PolyApi(DEFAULT_API_BASE, DEFAULT_API_KEY), []);
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(SAVED_EVENTS_STORAGE_KEY)
      .then((stored) => {
        if (!mounted.current || !stored) return;
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedEventIds(new Set(parsed.filter((id): id is string => typeof id === "string")));
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted.current) setSavedEventIdsHydrated(true);
      });
  }, []);

  useEffect(() => {
    if (!savedEventIdsHydrated) return;
    AsyncStorage.setItem(SAVED_EVENTS_STORAGE_KEY, JSON.stringify([...savedEventIds])).catch(() => undefined);
  }, [savedEventIds, savedEventIdsHydrated]);

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then((stored) => {
        if (mounted.current && (stored === "en" || stored === "zh")) {
          setLocale(stored);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted.current) setLocaleHydrated(true);
      });
  }, []);

  useEffect(() => {
    if (!localeHydrated) return;
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, locale).catch(() => undefined);
  }, [locale, localeHydrated]);

  useEffect(() => {
    AsyncStorage.getItem(PORTFOLIO_STORAGE_KEY)
      .then((stored) => {
        if (!mounted.current || !stored) return;
        const parsed = JSON.parse(stored) as StoredPortfolio;
        if (typeof parsed.balance === "number") setBalance(parsed.balance);
        if (Array.isArray(parsed.positions)) setPositions(parsed.positions);
        if (parsed.latestOrder && typeof parsed.latestOrder === "object") setLatestOrder(parsed.latestOrder);
        if (Array.isArray(parsed.openOrders)) setOpenOrders(parsed.openOrders);
        if (Array.isArray(parsed.activities)) setActivities(parsed.activities);
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted.current) setPortfolioHydrated(true);
      });
  }, []);

  useEffect(() => {
    if (!portfolioHydrated) return;
    const snapshot: StoredPortfolio = { balance, positions, latestOrder, openOrders, activities };
    AsyncStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(snapshot)).catch(() => undefined);
  }, [activities, balance, latestOrder, openOrders, portfolioHydrated, positions]);

  useEffect(() => {
    AsyncStorage.getItem(TICKET_DEFAULTS_STORAGE_KEY)
      .then((stored) => {
        if (!mounted.current || !stored) return;
        const parsed = JSON.parse(stored) as Partial<TicketDefaults>;
        if (typeof parsed.amount === "string" && (parsed.side === "buy" || parsed.side === "sell")) {
          setTicketDefaults({ amount: parsed.amount, side: parsed.side });
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted.current) setTicketDefaultsHydrated(true);
      });
  }, []);

  useEffect(() => {
    if (!ticketDefaultsHydrated) return;
    AsyncStorage.setItem(TICKET_DEFAULTS_STORAGE_KEY, JSON.stringify(ticketDefaults)).catch(() => undefined);
  }, [ticketDefaults, ticketDefaultsHydrated]);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (!mounted.current || !url) return;
      setForceOrderFailure(url.includes("forceOrderFailure=1"));
      if (url.includes("forcePortfolio=1")) {
        setMainTab("portfolio");
      }
      if (url.includes("forceWorldCupWinnerFranceTicket=1")) {
        const market = worldCupFutures[0];
        const outcome = market.outcomes[0];
        setTicket({ market, outcome, side: "buy" });
      }
      if (url.includes("forceTicketDefaults=1")) {
        const defaults: TicketDefaults = { amount: "500", side: "sell" };
        setTicketDefaults(defaults);
        AsyncStorage.setItem(TICKET_DEFAULTS_STORAGE_KEY, JSON.stringify(defaults)).catch(() => undefined);
        const market = worldCupFutures[0];
        const outcome = market.outcomes[0];
        setTicket({ market, outcome, side: "buy" });
      }
      if (url.includes("forceOpenOrder=1")) {
        setOpenOrders([SMOKE_OPEN_ORDER]);
        setMainTab("portfolio");
      }
      const forcedSearchQuery = url.match(/[?&]forceSearchQuery=([^&]+)/)?.[1];
      if (forcedSearchQuery) {
        setQuery(decodeURIComponent(forcedSearchQuery));
        setMainTab("search");
      }
      const forcedHomeQuery = url.match(/[?&]forceHomeQuery=([^&]+)/)?.[1];
      if (forcedHomeQuery) {
        setQuery(decodeURIComponent(forcedHomeQuery));
        setMainTab("home");
      }
      if (url.includes("forceAccount=1")) {
        setMainTab("account");
      }
      if (url.includes("forceAccountPreferences=1")) {
        const defaults: TicketDefaults = { amount: "500", side: "sell" };
        setTicketDefaults(defaults);
        AsyncStorage.setItem(TICKET_DEFAULTS_STORAGE_KEY, JSON.stringify(defaults)).catch(() => undefined);
        setMainTab("account");
      }
      if (url.includes("forceAccountSignIn=1")) {
        setForceAccountSignedIn(true);
        setMainTab("account");
      }
      if (url.includes("forceChinese=1")) {
        setLocale("zh");
        AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, "zh").catch(() => undefined);
      }
      if (url.includes("forceEnglish=1")) {
        setLocale("en");
        AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, "en").catch(() => undefined);
      }
      if (url.includes("forceSearch=1")) {
        setMainTab("search");
      }
      const shouldForceSaveMexico = url.includes("forceSaveMexico=1");
      if (url.includes("forceClearSaved=1") && !shouldForceSaveMexico) {
        setSavedEventIds(new Set());
        AsyncStorage.removeItem(SAVED_EVENTS_STORAGE_KEY).catch(() => undefined);
      }
      if (shouldForceSaveMexico) {
        const seededSavedEvents = new Set(["mexico-ecuador"]);
        setSavedEventIds(seededSavedEvents);
        AsyncStorage.setItem(SAVED_EVENTS_STORAGE_KEY, JSON.stringify([...seededSavedEvents])).catch(() => undefined);
      }
    });
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

  useEffect(() => {
    if (ORDER_MODE !== "server") return undefined;
    let cancelled = false;
    setPortfolioSyncStatus("syncing");
    Promise.allSettled([loadPortfolioSnapshot(api), loadPortfolioHistoryActivities(api)]).then(
      ([snapshotResult, historyResult]) => {
        if (cancelled) return;
        setPortfolioSyncStatus(snapshotResult.status === "rejected" && historyResult.status === "rejected" ? "error" : "synced");
        if (snapshotResult.status === "fulfilled") {
          setBalance(snapshotResult.value.balance);
          if (snapshotResult.value.positions.length > 0) {
            setPositions((current) => (current.length > 0 ? current : snapshotResult.value.positions));
          }
          if (snapshotResult.value.openOrders.length > 0) {
            setOpenOrders((current) => (current.length > 0 ? current : snapshotResult.value.openOrders));
          }
        }
        if (historyResult.status === "fulfilled" && historyResult.value.length > 0) {
          setActivities((current) => (current.length > 0 ? current : historyResult.value));
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    if (!selectedEvent) return undefined;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      setSelectedEvent(null);
      return true;
    });
    return () => subscription.remove();
  }, [selectedEvent]);

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
      [
        event.title,
        event.zhTitle,
        event.tag,
        event.zhTag,
        ...event.teams.flatMap((team) => [team.name, team.zhName]),
        ...event.markets.flatMap((market) => [
          market.title,
          market.zhTitle,
          ...market.outcomes.flatMap((outcome) => [outcome.label, outcome.zhLabel]),
        ]),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [events, query]);

  const openTicket = (market: Market, outcome: Outcome, event?: Event) => {
    setTicketOrderError(null);
    setTicket({ market, outcome, event, side: "buy" });
  };

  const toggleSavedEvent = (event: Event) => {
    setSavedEventIds((current) => {
      const next = new Set(current);
      if (next.has(event.id)) {
        next.delete(event.id);
      } else {
        next.add(event.id);
      }
      return next;
    });
  };

  const placeOrder = async (amount: number, side: "buy" | "sell") => {
    if (!ticket || amount <= 0) return;
    const cost = Math.min(amount, balance);
    setTicketOrderError(null);
    let result;
    try {
      if (forceOrderFailure) {
        throw new Error("Forced order failure for mobile harness.");
      }
      result = await submitTicketOrder({
        mode: ORDER_MODE,
        api,
        event: ticket.event,
        market: ticket.market,
        outcome: ticket.outcome,
        side,
        amount: cost,
      });
    } catch {
      setTicketOrderError(t.orderFailed);
      return;
    }
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
    setLatestOrder({
      id: result.id,
      mode: result.mode,
      title: result.title,
      outcome: result.outcome,
      side: result.side,
      amount: result.amount,
    });
    setActivities((current) => [
      {
        id: `${result.id}-opened`,
        action: "opened",
        title: result.title,
        outcome: result.outcome,
        amount: result.amount,
      },
      ...current,
    ]);
    setTicket(null);
    setTicketOrderError(null);
    setMainTab("portfolio");
  };

  const closePosition = (position: Position) => {
    const value = portfolioPositionValue(position);
    setBalance((current) => current + value);
    setPositions((current) => current.filter((item) => item.id !== position.id));
    setActivities((current) => [
      {
        id: `${position.id}-closed`,
        action: "closed",
        title: position.title,
        outcome: position.outcome,
        amount: value,
      },
      ...current,
    ]);
  };

  const cancelOpenOrder = (order: OpenOrder) => {
    setOpenOrders((current) => current.filter((item) => item.id !== order.id));
    setActivities((current) => [
      {
        id: `${order.id}-canceled`,
        action: "canceled",
        title: order.title,
        outcome: order.outcome,
        amount: order.remaining,
      },
      ...current,
    ]);
    if (ORDER_MODE === "server") {
      api.cancelOrder(order.id).catch(() => {
        if (mounted.current) setPortfolioSyncStatus("error");
      });
    }
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
            isSaved={savedEventIds.has(selectedEvent.id)}
            toggleSavedEvent={toggleSavedEvent}
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
                savedEventIds={savedEventIds}
                toggleSavedEvent={toggleSavedEvent}
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
              <Portfolio
                locale={locale}
                t={t}
                balance={balance}
                positions={positions}
                latestOrder={latestOrder}
                openOrders={openOrders}
                activities={activities}
                syncStatus={portfolioSyncStatus}
                closePosition={closePosition}
                cancelOpenOrder={cancelOpenOrder}
              />
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
                savedEventIds={savedEventIds}
                toggleSavedEvent={toggleSavedEvent}
              />
            )}
            {mainTab === "account" && (
              <AccountScreen
                t={t}
                balance={balance}
                forceSignedIn={forceAccountSignedIn}
                languagePreferenceValue={locale === "en" ? "English" : "\u4e2d\u6587"}
                ticketDefaultAmount={ticketDefaults.amount}
                ticketDefaultSide={ticketDefaults.side}
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
        orderError={ticketOrderError}
        defaultAmount={ticketDefaults.amount}
        defaultSide={ticketDefaults.side}
        onPreferencesChange={(next) => setTicketDefaults(next)}
        close={() => {
          setTicketOrderError(null);
          setTicket(null);
        }}
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
