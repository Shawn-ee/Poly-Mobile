import { afterEach, describe, expect, test, vi } from "vitest";
import { PolyApi } from "../api";

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });

describe("Holiwyn mobile API client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("sends Bearer auth from the configured API key", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ walletBalance: 10000, positions: [], openOrders: [], comboOrders: [] }));
    vi.stubGlobal("fetch", fetchImpl);

    await new PolyApi("https://api.example.test/", "test-api-key").getPortfolio();

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(url).toBe("https://api.example.test/api/portfolio");
    expect(headers.get("Authorization")).toBe("Bearer test-api-key");
    expect(headers.get("Accept")).toBe("application/json");
  });

  test("places canonical limit orders with idempotency and auth headers", async () => {
    vi.spyOn(Date, "now").mockReturnValue(12345);
    const fetchImpl = vi.fn(async () => jsonResponse({ order: { id: "order-1" } }));
    vi.stubGlobal("fetch", fetchImpl);

    await new PolyApi("https://api.example.test", "test-api-key").placeLimitOrder({
      marketId: "market-1",
      outcomeId: "yes",
      side: "BUY",
      price: "0.45",
      size: "10.00",
    });

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(url).toBe("https://api.example.test/api/orders");
    expect(init.method).toBe("POST");
    expect(headers.get("Authorization")).toBe("Bearer test-api-key");
    expect(headers.get("Idempotency-Key")).toBe("mobile-12345");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(JSON.parse(String(init.body))).toEqual({
      marketId: "market-1",
      outcomeId: "yes",
      side: "BUY",
      price: "0.45",
      size: "10.00",
      type: "LIMIT",
      clientOrderId: "mobile-12345",
    });
  });

  test("cancels orders through the canonical order endpoint", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ order: { id: "order/1", status: "CANCELED" } }));
    vi.stubGlobal("fetch", fetchImpl);

    await new PolyApi("https://api.example.test", "test-api-key").cancelOrder("order/1");

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(url).toBe("https://api.example.test/api/orders/order%2F1");
    expect(init.method).toBe("DELETE");
    expect(headers.get("Authorization")).toBe("Bearer test-api-key");
  });

  test("loads range-aware portfolio value history", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        range: "1W",
        ranges: ["1D", "1W", "1M", "All"],
        source: "portfolio-value-history-route",
        status: "ready",
        generatedAt: "2026-07-04T12:00:00.000Z",
        lastUpdated: "2026-07-04T12:00:00.000Z",
        emptyState: null,
        points: [{ timestamp: "2026-07-04T12:00:00.000Z", value: 10004.62, cash: 8.35, positionsValue: 9996.27, pnl: 4.62 }],
      }),
    );
    vi.stubGlobal("fetch", fetchImpl);

    const history = await new PolyApi("https://api.example.test", "test-api-key").getPortfolioValueHistory("1W");

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(url).toBe("https://api.example.test/api/portfolio/value-history?range=1W");
    expect(headers.get("Authorization")).toBe("Bearer test-api-key");
    expect(history.points[0]).toEqual({
      timestamp: "2026-07-04T12:00:00.000Z",
      value: 10004.62,
      cash: 8.35,
      positionsValue: 9996.27,
      pnl: 4.62,
    });
  });

  test("loads canonical account balance for visible cash values", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        availableUSDC: "40.800000",
        lockedUSDC: "2.500000",
        totalUSDC: "43.300000",
        updatedAt: "2026-07-06T12:00:00.000Z",
      }),
    );
    vi.stubGlobal("fetch", fetchImpl);

    const balance = await new PolyApi("https://api.example.test", "test-api-key").getAccountBalance();

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(url).toBe("https://api.example.test/api/account/balance");
    expect(headers.get("Authorization")).toBe("Bearer test-api-key");
    expect(balance).toMatchObject({
      availableUSDC: "40.800000",
      lockedUSDC: "2.500000",
      totalUSDC: "43.300000",
    });
  });

  test("loads authenticated profile summary for account settings", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        profile: {
          id: "user-1",
          username: "holiwyn_user",
          displayName: "Holiwyn User",
          email: "user@example.test",
          image: null,
          hasCustomAvatar: false,
          isAdmin: false,
        },
        preferences: {
          locale: "en",
          ticketDefaultAmount: "100",
          ticketDefaultSide: "BUY",
          ticketDefaultSlippage: "1%",
          savedEventIds: ["match-1"],
        },
        account: {
          walletAvailableUSDC: "40.800000",
          walletLockedUSDC: "0",
          walletTotalUSDC: "40.800000",
          portfolioValue: "100.060000",
          openPositionCount: 1,
          openOrderCount: 2,
          openOrderValue: "20.500000",
          totalExposure: "120.560000",
          tradingMode: "server",
        },
        menuItems: [
          { key: "leaderboard", status: "unavailable", reason: "outside-mvp-scope", route: null },
          { key: "rewards", status: "unavailable", reason: "outside-mvp-scope", route: null },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchImpl);

    const summary = await new PolyApi("https://api.example.test", "test-api-key").getProfileSummary();

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(url).toBe("https://api.example.test/api/profile/summary");
    expect(headers.get("Authorization")).toBe("Bearer test-api-key");
    expect(summary.account).toMatchObject({
      openPositionCount: 1,
      openOrderCount: 2,
      tradingMode: "server",
    });
    expect(summary.menuItems).toEqual([
      { key: "leaderboard", status: "unavailable", reason: "outside-mvp-scope", route: null },
      { key: "rewards", status: "unavailable", reason: "outside-mvp-scope", route: null },
    ]);
  });

  test("lists World Cup events with structured filters and mobile compact markets", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ events: [] }));
    vi.stubGlobal("fetch", fetchImpl);

    await new PolyApi("https://api.example.test", "test-api-key").listWorldCupEvents();

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const parsedUrl = new URL(url);
    expect(`${parsedUrl.origin}${parsedUrl.pathname}`).toBe("https://api.example.test/api/events");
    expect(parsedUrl.searchParams.has("category")).toBe(false);
    expect(parsedUrl.searchParams.get("sportKey")).toBe("soccer");
    expect(parsedUrl.searchParams.get("leagueKey")).toBe("world_cup");
    expect(parsedUrl.searchParams.get("includeMobileMarkets")).toBe("1");
    expect(parsedUrl.searchParams.has("mobileMvpMatches")).toBe(false);
    expect(parsedUrl.searchParams.has("search")).toBe(false);
    expect((init.headers as Headers).get("Authorization")).toBe("Bearer test-api-key");
  });

  test("can request the Local MVP match-only Home feed contract", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ events: [] }));
    vi.stubGlobal("fetch", fetchImpl);

    await new PolyApi("https://api.example.test", "test-api-key").listWorldCupEvents({
      limit: 10,
      mobileMvpMatches: true,
    });

    const [url] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const parsedUrl = new URL(url);
    expect(parsedUrl.searchParams.get("sportKey")).toBe("soccer");
    expect(parsedUrl.searchParams.get("leagueKey")).toBe("world_cup");
    expect(parsedUrl.searchParams.get("includeMobileMarkets")).toBe("1");
    expect(parsedUrl.searchParams.get("mobileMvpMatches")).toBe("1");
  });

  test("lists World Cup events with backend pagination parameters", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ events: [], nextCursor: "event-2", page: { limit: 10, nextCursor: "event-2", hasMore: true } }));
    vi.stubGlobal("fetch", fetchImpl);

    const payload = await new PolyApi("https://api.example.test", "test-api-key").listWorldCupEvents({
      limit: 10,
      cursor: "event-1",
      search: "mexico",
    });

    const [url] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const parsedUrl = new URL(url);
    expect(parsedUrl.searchParams.get("limit")).toBe("10");
    expect(parsedUrl.searchParams.get("cursor")).toBe("event-1");
    expect(parsedUrl.searchParams.get("search")).toBe("mexico");
    expect(parsedUrl.searchParams.get("includeMobileMarkets")).toBe("1");
    expect(payload.nextCursor).toBe("event-2");
  });

  test("can list all soccer provider events without the World Cup league filter", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ events: [] }));
    vi.stubGlobal("fetch", fetchImpl);

    await new PolyApi("https://api.example.test", "test-api-key").listWorldCupEvents({
      source: "polymarket",
      leagueKey: null,
    });

    const [url] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const parsedUrl = new URL(url);
    expect(parsedUrl.searchParams.get("sportKey")).toBe("soccer");
    expect(parsedUrl.searchParams.has("leagueKey")).toBe(false);
    expect(parsedUrl.searchParams.get("source")).toBe("polymarket");
    expect(parsedUrl.searchParams.get("includeMobileMarkets")).toBe("1");
  });

  test("lists World Cup events with backend status filters for Home tabs", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ events: [], page: { limit: 10, nextCursor: null, hasMore: false } }));
    vi.stubGlobal("fetch", fetchImpl);

    await new PolyApi("https://api.example.test", "test-api-key").listWorldCupEvents({
      limit: 10,
      status: "live",
    });

    const [url] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const parsedUrl = new URL(url);
    expect(parsedUrl.searchParams.get("status")).toBe("live");
    expect(parsedUrl.searchParams.get("includeMobileMarkets")).toBe("1");
  });

  test("loads mobile orderbook depth contract", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        marketId: "market-1",
        outcomeId: null,
        generatedAt: "2026-06-15T12:00:00.000Z",
        emptyState: null,
        levels: [{ outcomeId: "yes", side: "bid", price: 0.57, shares: 120, total: 68.4 }],
        bids: [{ outcomeId: "yes", price: 0.57, size: 120 }],
        asks: [],
      }),
    );
    vi.stubGlobal("fetch", fetchImpl);

    const book = await new PolyApi("https://api.example.test", "test-api-key").getOrderbook("market/1", { maxLevels: 12 });

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    const parsedUrl = new URL(url);
    expect(`${parsedUrl.origin}${parsedUrl.pathname}`).toBe("https://api.example.test/api/orderbook/market%2F1/book");
    expect(parsedUrl.searchParams.get("maxLevels")).toBe("12");
    expect(parsedUrl.searchParams.get("_ts")).toEqual(expect.any(String));
    expect(headers.get("Authorization")).toBe("Bearer test-api-key");
    expect(book.levels[0]).toEqual({ outcomeId: "yes", side: "bid", price: 0.57, shares: 120, total: 68.4 });
  });

  test("prefers compact mobile event detail and falls back to legacy event route", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "not found" }), { status: 404 }))
      .mockResolvedValueOnce(jsonResponse({ event: { slug: "match-1" }, markets: [] }));
    vi.stubGlobal("fetch", fetchImpl);

    const event = await new PolyApi("https://api.example.test", "test-api-key").getEvent("match/1");

    expect(event).toEqual({ event: { slug: "match-1" }, markets: [] });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://api.example.test/api/mobile/events/match%2F1/live-detail");
    expect(fetchImpl.mock.calls[1]?.[0]).toBe("https://api.example.test/api/events/match%2F1");
  });

  test("uses compact mobile event detail without legacy fallback when available", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({
      event: {
        slug: "match-1",
        marketProfile: "regulation_90",
        resultMode: "can_draw",
        supportedMarketTypes: ["regulation_90", "spread"],
      },
      markets: [{ id: "market-1", marketType: "spread" }],
    }));
    vi.stubGlobal("fetch", fetchImpl);

    const event = await new PolyApi("https://api.example.test", "test-api-key").getEvent("match-1");

    expect(event.event).toMatchObject({
      slug: "match-1",
      marketProfile: "regulation_90",
      resultMode: "can_draw",
    });
    expect(event.markets).toEqual([{ id: "market-1", marketType: "spread" }]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [[eventDetailUrl]] = fetchImpl.mock.calls as unknown as Array<[string, unknown]>;
    expect(eventDetailUrl).toBe("https://api.example.test/api/mobile/events/match-1/live-detail");
  });

  test("loads full public event market catalog for Event Detail lines", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({
      markets: [{
        id: "spread-1",
        title: "Spread",
        marketType: "spread",
        period: "regulation",
        line: "1.5",
        outcomes: [],
      }],
    }));
    vi.stubGlobal("fetch", fetchImpl);

    const payload = await new PolyApi("https://api.example.test", "test-api-key").getEventMarkets("match/1");

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.example.test/api/events/match%2F1/markets");
    expect((init.headers as Headers).get("Authorization")).toBe("Bearer test-api-key");
    expect(payload.markets[0]).toMatchObject({
      id: "spread-1",
      marketType: "spread",
      period: "regulation",
      line: "1.5",
    });
  });

  test("saves authenticated profile preferences with canonical local settings", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        preferences: {
          locale: "en",
          ticketDefaultAmount: "500",
          ticketDefaultSide: "SELL",
          ticketDefaultSlippage: "2%",
          savedEventIds: ["mexico-ecuador"],
        },
      }),
    );
    vi.stubGlobal("fetch", fetchImpl);

    await new PolyApi("https://api.example.test", "test-api-key").saveProfilePreferences({
      locale: "en",
      ticketDefaultAmount: "500",
      ticketDefaultSide: "SELL",
      ticketDefaultSlippage: "2%",
      savedEventIds: ["mexico-ecuador"],
    });

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(url).toBe("https://api.example.test/api/profile/preferences");
    expect(init.method).toBe("PUT");
    expect(headers.get("Authorization")).toBe("Bearer test-api-key");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(JSON.parse(String(init.body))).toEqual({
      locale: "en",
      ticketDefaultAmount: "500",
      ticketDefaultSide: "SELL",
      ticketDefaultSlippage: "2%",
      savedEventIds: ["mexico-ecuador"],
    });
  });
});
