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
import { appendUniqueActivity, cancelOpenOrderOnServer, openOrderCanceledActivity } from "./src/services/openOrderService";
import { closePositionOnServer } from "./src/services/positionCloseService";
import { serverClosedPortfolioFixture, serverHydratedPortfolioFixture } from "./src/services/portfolioFixtureService";
import { applyServerPortfolioState } from "./src/services/portfolioStateApplyService";
import { loadServerPortfolioState } from "./src/services/portfolioSyncService";
import { resolvePositionTradeTarget } from "./src/services/positionTradeTargetService";
import { loadProfilePreferences, saveProfilePreferences } from "./src/services/profilePreferencesService";
import {
  applyTicketQuoteToOutcome,
  applyTicketQuotesToEvent,
  applyTicketQuotesToMarket,
  applyTicketQuotesToMarkets,
  loadMarketQuotesById,
  loadTicketQuotes,
} from "./src/services/quoteService";

const DEFAULT_API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "http://10.0.2.2:3000";
const DEFAULT_API_KEY = process.env.EXPO_PUBLIC_API_KEY || "";
const ORDER_MODE: OrderMode = process.env.EXPO_PUBLIC_ORDER_MODE === "server" ? "server" : "mock";
const SMOKE_OPEN_SERVER_ORDER_PRICE = 1;
const SMOKE_OPEN_SERVER_ORDER_AMOUNT = "1";
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

const openOrderRemainingShares = (order: OpenOrder) => order.remainingShares ?? order.remaining;
const openOrderValue = (order: OpenOrder) => order.orderValue ?? openOrderRemainingShares(order) * order.price;

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
  slippage: string;
};
type ProfilePreferencesSyncStatus = "hidden" | "syncing" | "synced" | "error";

export default function App() {
  const [locale, setLocale] = useState<Locale>("en");
  const [localeHydrated, setLocaleHydrated] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>("home");
  const [worldCupTab, setWorldCupTab] = useState<WorldCupTab>("games");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [query, setQuery] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [ticketOrderError, setTicketOrderError] = useState<string | null>(null);
  const [ticketOrderErrorDetail, setTicketOrderErrorDetail] = useState<string | null>(null);
  const [forceOrderFailure, setForceOrderFailure] = useState(false);
  const [balance, setBalance] = useState(10000);
  const [positions, setPositions] = useState<Position[]>([]);
  const [latestOrder, setLatestOrder] = useState<OrderConfirmation | null>(null);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [activities, setActivities] = useState<PortfolioActivity[]>([]);
  const [portfolioHydrated, setPortfolioHydrated] = useState(false);
  const [ticketDefaults, setTicketDefaults] = useState<TicketDefaults>({ amount: "100", side: "buy", slippage: "1%" });
  const [ticketDefaultsHydrated, setTicketDefaultsHydrated] = useState(false);
  const [portfolioSyncStatus, setPortfolioSyncStatus] = useState<PortfolioSyncStatus>(ORDER_MODE === "server" ? "syncing" : "hidden");
  const [profilePreferencesSyncStatus, setProfilePreferencesSyncStatus] = useState<ProfilePreferencesSyncStatus>(
    ORDER_MODE === "server" && DEFAULT_API_KEY.length > 0 ? "syncing" : "hidden"
  );
  const [events, setEvents] = useState<Event[]>(worldCupEvents);
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(() => new Set());
  const [savedEventIdsHydrated, setSavedEventIdsHydrated] = useState(false);
  const [forceAccountSignedIn, setForceAccountSignedIn] = useState(false);
  const [isRefreshingLive, setIsRefreshingLive] = useState(false);
  const [liveRefreshTick, setLiveRefreshTick] = useState(0);
  const [futures, setFutures] = useState<Market[]>(worldCupFutures);
  const t = appCopy[locale];
  const api = useMemo(() => new PolyApi(DEFAULT_API_BASE, DEFAULT_API_KEY), []);
  const mounted = useRef(true);
  const profilePreferencesReady = useRef(false);
  const skipPortfolioHydration = useRef(false);
  const forceServerCloseFixture = useRef(false);
  const forceServerOrderProof = useRef(false);
  const forceServerOpenOrderProof = useRef(false);
  const forceServerOrderSide = useRef<"buy" | "sell">("buy");
  const shouldSyncProfilePreferences = ORDER_MODE === "server" && DEFAULT_API_KEY.length > 0;
  const accountPortfolioValue = useMemo(
    () => balance + positions.reduce((total, position) => total + portfolioPositionValue(position), 0),
    [balance, positions],
  );
  const accountOpenOrderValue = useMemo(
    () => openOrders.reduce((total, order) => total + openOrderValue(order), 0),
    [openOrders],
  );

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
        if (skipPortfolioHydration.current) return;
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
          setTicketDefaults({ amount: parsed.amount, side: parsed.side, slippage: typeof parsed.slippage === "string" ? parsed.slippage : "1%" });
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
    if (!shouldSyncProfilePreferences) {
      setProfilePreferencesSyncStatus("hidden");
      return;
    }
    if (!localeHydrated || !savedEventIdsHydrated || !ticketDefaultsHydrated) {
      setProfilePreferencesSyncStatus("syncing");
      return;
    }
    let cancelled = false;
    setProfilePreferencesSyncStatus("syncing");
    loadProfilePreferences(api)
      .then((preferences) => {
        if (cancelled || !mounted.current) return;
        setLocale(preferences.locale);
        setTicketDefaults({
          amount: preferences.ticketDefaultAmount,
          side: preferences.ticketDefaultSide,
          slippage: preferences.ticketDefaultSlippage,
        });
        setSavedEventIds(new Set(preferences.savedEventIds));
        setProfilePreferencesSyncStatus("synced");
      })
      .catch(() => {
        if (!cancelled && mounted.current) setProfilePreferencesSyncStatus("error");
      })
      .finally(() => {
        if (!cancelled && mounted.current) profilePreferencesReady.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, [api, localeHydrated, savedEventIdsHydrated, shouldSyncProfilePreferences, ticketDefaultsHydrated]);

  useEffect(() => {
    if (
      !shouldSyncProfilePreferences ||
      !profilePreferencesReady.current ||
      !localeHydrated ||
      !savedEventIdsHydrated ||
      !ticketDefaultsHydrated
    ) {
      return;
    }
    saveProfilePreferences(api, {
      locale,
      ticketDefaultAmount: ticketDefaults.amount,
      ticketDefaultSide: ticketDefaults.side,
      ticketDefaultSlippage: ticketDefaults.slippage,
      savedEventIds: [...savedEventIds],
    })
      .then(() => {
        if (mounted.current) setProfilePreferencesSyncStatus("synced");
      })
      .catch(() => {
        if (mounted.current) setProfilePreferencesSyncStatus("error");
      });
  }, [api, locale, localeHydrated, savedEventIds, savedEventIdsHydrated, shouldSyncProfilePreferences, ticketDefaults, ticketDefaultsHydrated]);

  const handleLaunchUrl = useCallback((url: string | null) => {
    if (!mounted.current || !url) return;
    const shouldForceWorldCupWinnerFranceTicket = url.includes("forceWorldCupWinnerFranceTicket=1");
    const shouldForceClosedWorldCupWinnerFrance = url.includes("forceClosedWorldCupWinnerFrance=1");
    const shouldForceServerPortfolioFixture = url.includes("forceServerPortfolioFixture=1");
    const shouldForceOpenOrder = url.includes("forceOpenOrder=1");
    forceServerOrderProof.current = url.includes("forceServerOrderProof=1");
    forceServerOpenOrderProof.current = url.includes("forceServerOpenOrderProof=1");
    forceServerOrderSide.current = url.includes("forceServerOrderSide=sell") ? "sell" : "buy";
    forceServerCloseFixture.current = url.includes("forceServerCloseFixture=1");
    const shouldForceLive = url.includes("forceLive=1");
    setForceOrderFailure(url.includes("forceOrderFailure=1"));
    if (url.includes("forceResetState=1")) {
      skipPortfolioHydration.current = true;
      const resetRuntimeState = () => {
        if (!mounted.current) return;
        setBalance(10000);
        setPositions([]);
        setLatestOrder(null);
        setOpenOrders([]);
        setActivities([]);
        setTicket(null);
        setTicketOrderError(null);
        setTicketOrderErrorDetail(null);
        setSelectedEvent(null);
        setQuery("");
        setMainTab("home");
        setWorldCupTab("games");
        setTicketDefaults({ amount: "100", side: "buy", slippage: "1%" });
        setSavedEventIds(new Set());
        setForceAccountSignedIn(false);
      };
      resetRuntimeState();
      if (
        !shouldForceWorldCupWinnerFranceTicket &&
        !shouldForceClosedWorldCupWinnerFrance &&
        !shouldForceServerPortfolioFixture &&
        !shouldForceOpenOrder &&
        !forceServerOrderProof.current &&
        !shouldForceLive
      ) {
        setTimeout(resetRuntimeState, 750);
      }
      AsyncStorage.multiRemove([
        SAVED_EVENTS_STORAGE_KEY,
        PORTFOLIO_STORAGE_KEY,
        TICKET_DEFAULTS_STORAGE_KEY,
      ]).catch(() => undefined);
    }
    if (url.includes("forcePortfolio=1")) {
      setMainTab("portfolio");
    }
    if (shouldForceLive) {
      setMainTab("live");
    }
    if (shouldForceWorldCupWinnerFranceTicket) {
      const market = worldCupFutures[0];
      const outcome = market.outcomes[0];
      setTicket({ market, outcome, side: "buy" });
    }
    if (url.includes("forceMexicoEcuadorDetail=1")) {
      const event = worldCupEvents.find((item) => item.id === "mexico-ecuador");
      if (event) setSelectedEvent(event);
    }
    if (url.includes("forceTicketDefaults=1")) {
      const defaults: TicketDefaults = { amount: "500", side: "sell", slippage: "1%" };
      setTicketDefaults(defaults);
      AsyncStorage.setItem(TICKET_DEFAULTS_STORAGE_KEY, JSON.stringify(defaults)).catch(() => undefined);
      const market = worldCupFutures[0];
      const outcome = market.outcomes[0];
      setTicket({ market, outcome, side: "buy" });
    }
    if (shouldForceOpenOrder) {
      setBalance(10000);
      setPositions([]);
      setLatestOrder(null);
      setOpenOrders([SMOKE_OPEN_ORDER]);
      setActivities([]);
      setMainTab("portfolio");
      const snapshot: StoredPortfolio = {
        balance: 10000,
        positions: [],
        latestOrder: null,
        openOrders: [SMOKE_OPEN_ORDER],
        activities: [],
      };
      AsyncStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(snapshot)).catch(() => undefined);
    }
    if (shouldForceServerPortfolioFixture) {
      const fixture = serverHydratedPortfolioFixture();
      setBalance(fixture.balance);
      setPositions(fixture.positions);
      setLatestOrder(fixture.latestOrder);
      setOpenOrders(fixture.openOrders);
      setActivities(fixture.activities);
      setPortfolioSyncStatus("synced");
      setMainTab("portfolio");
      const snapshot: StoredPortfolio = {
        balance: fixture.balance,
        positions: fixture.positions,
        latestOrder: fixture.latestOrder,
        openOrders: fixture.openOrders,
        activities: fixture.activities,
      };
      AsyncStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(snapshot)).catch(() => undefined);
    }
    if (shouldForceClosedWorldCupWinnerFrance) {
      const closedActivity: PortfolioActivity = {
        id: "smoke-world-cup-winner-france-closed",
        action: "closed",
        title: "World Cup winner",
        outcome: "France",
        amount: 108.82,
        entryAmount: 100,
        side: "buy",
        probability: 34,
        timestamp: "Today 2:04 PM",
      };
      const boughtActivity: PortfolioActivity = {
        id: "smoke-world-cup-winner-france-opened",
        action: "opened",
        title: "World Cup winner",
        outcome: "France",
        amount: 100,
        side: "buy",
        probability: 34,
        timestamp: "Today 1:56 PM",
      };
      setBalance(10008.82);
      setPositions([]);
      setLatestOrder(null);
      setOpenOrders([]);
      setActivities([closedActivity, boughtActivity]);
      setMainTab("portfolio");
      const snapshot: StoredPortfolio = {
        balance: 10008.82,
        positions: [],
        latestOrder: null,
        openOrders: [],
        activities: [closedActivity, boughtActivity],
      };
      AsyncStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(snapshot)).catch(() => undefined);
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
      const defaults: TicketDefaults = { amount: "500", side: "sell", slippage: "1%" };
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
    if (url.includes("forceAccountSavedSummary=1")) {
      const seededSavedEvents = new Set(["mexico-ecuador"]);
      setSavedEventIds(seededSavedEvents);
      AsyncStorage.setItem(SAVED_EVENTS_STORAGE_KEY, JSON.stringify([...seededSavedEvents])).catch(() => undefined);
      setMainTab("account");
    }
    if (url.includes("forceAccountPositionSummary=1")) {
      setPositions([
        {
          id: "smoke-account-position",
          mode: "mock",
          title: "World Cup winner",
          outcome: "France",
          side: "buy",
          amount: 250,
          probability: 24,
        },
      ]);
      setOpenOrders([SMOKE_OPEN_ORDER]);
      setMainTab("account");
    }
  }, []);

  useEffect(() => {
    if (!forceServerOrderProof.current || ORDER_MODE !== "server") return;
    const event = events.find(
      (item) =>
        !worldCupEvents.some((mockEvent) => mockEvent.id === item.id) &&
        item.markets.some((market) => market.outcomes.length > 0),
    );
    const market = event?.markets.find((item) => item.outcomes.length > 0);
    const outcome = market?.outcomes[0];
    if (!event || !market || !outcome) return;
    forceServerOrderProof.current = false;
    const ticketOutcome = forceServerOpenOrderProof.current
      ? { ...outcome, probability: SMOKE_OPEN_SERVER_ORDER_PRICE }
      : outcome;
    if (forceServerOpenOrderProof.current) {
      setTicketDefaults({ amount: SMOKE_OPEN_SERVER_ORDER_AMOUNT, side: "buy", slippage: "1%" });
    }
    setSelectedEvent(event);
    setTicket({ event, market, outcome: ticketOutcome, side: forceServerOrderSide.current });
  }, [events]);

  useEffect(() => {
    Linking.getInitialURL().then(handleLaunchUrl);
    const subscription = Linking.addEventListener("url", (event) => handleLaunchUrl(event.url));
    return () => subscription.remove();
  }, [handleLaunchUrl]);

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
        if (ORDER_MODE !== "server") {
          setEvents(normalized);
          return;
        }
        const quotedEvents = await Promise.all(
          normalized.map(async (event) => {
            const quotesByMarketId = await loadMarketQuotesById(api, event.markets.map((market) => market.id));
            return applyTicketQuotesToEvent(event, quotesByMarketId);
          }),
        );
        if (mounted.current) setEvents(quotedEvents);
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
    const marketIds = futures.map((market) => market.id);
    loadMarketQuotesById(api, marketIds).then((quotesByMarketId) => {
      if (cancelled || !mounted.current) return;
      if (quotesByMarketId.size === 0) return;
      setFutures((current) => applyTicketQuotesToMarkets(current, quotesByMarketId));
    });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const applyServerState = useCallback((serverState: Awaited<ReturnType<typeof loadServerPortfolioState>>) => {
    setPortfolioSyncStatus(serverState.syncStatus);
    setBalance((current) =>
      applyServerPortfolioState({ balance: current, positions: [], openOrders: [], activities: [] }, serverState).balance,
    );
    setPositions((current) =>
      applyServerPortfolioState({ balance: 0, positions: current, openOrders: [], activities: [] }, serverState).positions,
    );
    setOpenOrders((current) =>
      applyServerPortfolioState({ balance: 0, positions: [], openOrders: current, activities: [] }, serverState).openOrders,
    );
    setActivities((current) =>
      applyServerPortfolioState({ balance: 0, positions: [], openOrders: [], activities: current }, serverState).activities,
    );
  }, []);

  const refreshServerPortfolio = useCallback(async () => {
    setPortfolioSyncStatus("syncing");
    const serverState = await loadServerPortfolioState(api);
    if (!mounted.current) return;
    applyServerState(serverState);
  }, [api, applyServerState]);

  useEffect(() => {
    if (ORDER_MODE !== "server") return undefined;
    let cancelled = false;
    setPortfolioSyncStatus("syncing");
    loadServerPortfolioState(api).then((serverState) => {
      if (!cancelled && mounted.current) applyServerState(serverState);
    }).catch(() => {
      if (!cancelled && mounted.current) setPortfolioSyncStatus("error");
    });
    return () => {
      cancelled = true;
    };
  }, [api, applyServerState]);

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

  const openTicket = (market: Market, outcome: Outcome, event?: Event, side?: "buy" | "sell") => {
    setTicketOrderError(null);
    setTicketOrderErrorDetail(null);
    setTicket({ market, outcome, event, side: side ?? ticketDefaults.side });
  };

  useEffect(() => {
    if (ORDER_MODE !== "server" || !ticket) return undefined;
    if (forceServerOpenOrderProof.current) return undefined;
    let cancelled = false;
    const marketId = ticket.market.id;
    const outcomeId = ticket.outcome.id;
    loadTicketQuotes(api, marketId, outcomeId)
      .then((quotes) => {
        if (cancelled || !mounted.current) return;
        setTicket((current) => {
          if (!current || current.market.id !== marketId || current.outcome.id !== outcomeId) return current;
          const quotedOutcome = applyTicketQuoteToOutcome(current.outcome, quotes);
          if (quotedOutcome === current.outcome) return current;
          return {
            ...current,
            outcome: quotedOutcome,
            market: {
              ...current.market,
              outcomes: current.market.outcomes.map((outcome) =>
                outcome.id === quotedOutcome.id ? quotedOutcome : outcome,
              ),
            },
          };
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, ticket?.market.id, ticket?.outcome.id]);

  useEffect(() => {
    if (ORDER_MODE !== "server" || !selectedEvent) return undefined;
    let cancelled = false;
    const eventId = selectedEvent.id;
    const marketIds = selectedEvent.markets.map((market) => market.id);
    loadMarketQuotesById(api, marketIds)
      .then((quotesByMarketId) => {
        if (cancelled || !mounted.current) return;
        setSelectedEvent((current) => {
          if (!current || current.id !== eventId) return current;
          let changed = false;
          const markets = current.markets.map((market) => {
            const quotes = quotesByMarketId.get(market.id);
            if (!quotes) return market;
            const quotedMarket = applyTicketQuotesToMarket(market, quotes);
            if (quotedMarket !== market) changed = true;
            return quotedMarket;
          });
          if (!changed) return current;
          return {
            ...current,
            markets,
          };
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, selectedEvent?.id]);

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
    setTicketOrderErrorDetail(null);
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
    } catch (error) {
      setTicketOrderError(t.orderFailed);
      const detail = error instanceof Error ? error.message.trim() : "";
      setTicketOrderErrorDetail(detail && detail !== t.orderFailed ? detail : null);
      return;
    }
    const isLiveOrder = ticket.event?.status === "live";
    const liveClock = isLiveOrder
      ? ticket.event?.startsAt.replace(/[^\x00-\x7F]+/g, "-").replace(/\s+-\s+/g, " - ")
      : undefined;
    if (ORDER_MODE !== "server") {
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
          isLive: isLiveOrder,
          liveClock,
          timestamp: t.justNow,
        },
        ...current,
      ]);
    }
    setLatestOrder({
      id: result.id,
      mode: result.mode,
      title: result.title,
      outcome: result.outcome,
      side: result.side,
      amount: result.amount,
      probability: result.probability,
      status: result.status,
      size: result.size,
      filledSize: result.filledSize,
      remainingSize: result.remainingSize,
      isLive: isLiveOrder,
      liveClock,
    });
    setActivities((current) => [
      {
        id: `${result.id}-opened`,
        action: result.side === "sell" ? "sold" : "opened",
        title: result.title,
        outcome: result.outcome,
        amount: result.amount,
        shares: result.filledSize ?? result.size,
        side: result.side,
        probability: result.probability,
        isLive: isLiveOrder,
        liveClock,
      },
      ...current,
    ]);
    setTicket(null);
    setTicketOrderError(null);
    setTicketOrderErrorDetail(null);
    setSelectedEvent(null);
    setMainTab("portfolio");
    if (ORDER_MODE === "server") {
      refreshServerPortfolio().catch(() => {
        if (mounted.current) setPortfolioSyncStatus("error");
      });
    }
  };

  const closePosition = async (position: Position) => {
    if (ORDER_MODE === "server" && forceServerCloseFixture.current) {
      const fixture = serverClosedPortfolioFixture(position);
      setBalance(fixture.balance);
      setPositions(fixture.positions);
      setLatestOrder(fixture.latestOrder);
      setOpenOrders(fixture.openOrders);
      setActivities(fixture.activities);
      setPortfolioSyncStatus("synced");
      const snapshot: StoredPortfolio = {
        balance: fixture.balance,
        positions: fixture.positions,
        latestOrder: fixture.latestOrder,
        openOrders: fixture.openOrders,
        activities: fixture.activities,
      };
      AsyncStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(snapshot)).catch(() => undefined);
      return;
    }
    try {
      await closePositionOnServer({ mode: ORDER_MODE, api, position });
    } catch {
      if (mounted.current) setPortfolioSyncStatus("error");
      return;
    }
    if (ORDER_MODE === "server") {
      await refreshServerPortfolio().catch(() => {
        if (mounted.current) setPortfolioSyncStatus("error");
      });
      return;
    }
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
        entryAmount: position.amount,
        side: position.side,
        probability: position.probability,
        isLive: position.isLive,
        liveClock: position.liveClock,
        timestamp: t.justNow,
      },
      ...current,
    ]);
  };

  const openPositionTrade = (position: Position, side: "buy" | "sell") => {
    const target = resolvePositionTradeTarget({ position, futures, events });
    if (!target) {
      setPortfolioSyncStatus("error");
      return;
    }
    setSelectedEvent(target.event ?? null);
    setMainTab("portfolio");
    openTicket(target.market, target.outcome, target.event, side);
  };

  const cancelOpenOrder = (order: OpenOrder) => {
    setOpenOrders((current) => current.filter((item) => item.id !== order.id));
    const canceledActivity = openOrderCanceledActivity(order, t.justNow);
    setActivities((current) => appendUniqueActivity(current, canceledActivity));
    cancelOpenOrderOnServer({ mode: ORDER_MODE, api, order })
      .then(() => {
        if (ORDER_MODE === "server") {
          return refreshServerPortfolio().then(() => {
            if (mounted.current) {
              setActivities((current) => appendUniqueActivity(current, canceledActivity));
            }
          });
        }
        return undefined;
      })
      .catch(() => {
        if (mounted.current) setPortfolioSyncStatus("error");
      });
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
            defaultSide={ticketDefaults.side}
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
                openPositionTrade={openPositionTrade}
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
                ticketDefaultSlippage={ticketDefaults.slippage}
                profileSyncStatus={profilePreferencesSyncStatus}
                savedMarketCount={savedEventIds.size}
                openPositionCount={positions.length}
                openOrderCount={openOrders.length}
                openOrderValue={accountOpenOrderValue}
                totalExposure={accountPortfolioValue + accountOpenOrderValue}
                portfolioValue={accountPortfolioValue}
                tradingMode={ORDER_MODE}
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
        orderErrorDetail={ticketOrderErrorDetail}
        tradingMode={ORDER_MODE}
        defaultAmount={ticketDefaults.amount}
        defaultSide={ticketDefaults.side}
        defaultSlippage={ticketDefaults.slippage}
        onPreferencesChange={(next) => setTicketDefaults(next)}
        close={() => {
          setTicketOrderError(null);
          setTicketOrderErrorDetail(null);
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
