import { NextRequest } from "next/server";

const getExistingUserId = jest.fn();
const getMarketBootstrapEvent = jest.fn();
const subscribeToMarketUpdates = jest.fn();
const getMarketEventsSince = jest.fn();
const prismaMarketFindUnique = jest.fn();
const assertMarketVisibleToUser = jest.fn();

jest.mock("@/lib/auth", () => ({
  getExistingUserId: () => getExistingUserId(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    market: {
      findUnique: (...args: unknown[]) => prismaMarketFindUnique(...args),
    },
  },
}));

jest.mock("@/lib/marketAccess", () => ({
  assertMarketVisibleToUser: (...args: unknown[]) => assertMarketVisibleToUser(...args),
}));

jest.mock("@/server/services/orderbookEvents", () => ({
  getMarketBootstrapEvent: (...args: unknown[]) => getMarketBootstrapEvent(...args),
  subscribeToMarketUpdates: (...args: unknown[]) => subscribeToMarketUpdates(...args),
  getMarketEventsSince: (...args: unknown[]) => getMarketEventsSince(...args),
  getStreamPollIntervalMs: () => 1_000,
}));

const createChunkReader = (response: Response) => {
  const reader = response.body?.getReader();
  return async () => {
    if (!reader) return "";
    const { value } = await reader.read();
    if (!value) return "";
    return new TextDecoder().decode(value);
  };
};

describe("SSE market stream", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    getExistingUserId.mockReset();
    getMarketBootstrapEvent.mockReset();
    subscribeToMarketUpdates.mockReset();
    getMarketEventsSince.mockReset();
    prismaMarketFindUnique.mockReset();
    assertMarketVisibleToUser.mockReset();

    getExistingUserId.mockResolvedValue(null);
    prismaMarketFindUnique.mockResolvedValue({
      id: "m1",
      visibility: "PUBLIC",
      ownerId: null,
      mechanism: "ORDERBOOK",
    });
    assertMarketVisibleToUser.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("initial snapshot on connect", async () => {
    let listener: ((payload: unknown) => void) | null = null;
    subscribeToMarketUpdates.mockImplementation((_id, cb) => {
      listener = cb;
      return () => {};
    });
    getMarketBootstrapEvent.mockResolvedValue({
      id: null,
      sequence: null,
      type: "quote.snapshot",
      payload: {
        topLevels: { bids: [{ price: "0.5", size: "10", outcomeId: "yes" }], asks: [] },
        recentTrades: [{ id: "t1" }],
      },
    });

    const { GET } = await import("@/app/api/stream/market/[marketId]/route");
    const abort = new AbortController();
    const req = new NextRequest("http://localhost/api/stream/market/m1", {
      signal: abort.signal,
    });
    const res = await GET(req, { params: Promise.resolve({ marketId: "m1" }) });
    const readChunk = createChunkReader(res);
    const chunk = await readChunk();
    expect(res.status).toBe(200);
    expect(chunk).toContain("event: quote.snapshot");
    expect(chunk).toContain("\"topLevels\"");
    expect(chunk).toContain("\"recentTrades\"");
    expect(listener).not.toBeNull();
    abort.abort();
  });

  test("realtime updates with ascending sequence", async () => {
    let listener: ((payload: unknown) => void) | null = null;
    subscribeToMarketUpdates.mockImplementation((_id, cb) => {
      listener = cb;
      return () => {};
    });
    getMarketBootstrapEvent.mockResolvedValue({
      id: null,
      sequence: null,
      type: "quote.snapshot",
      payload: { topLevels: { bids: [], asks: [] }, recentTrades: [] },
    });

    const { GET } = await import("@/app/api/stream/market/[marketId]/route");
    const abort = new AbortController();
    const req = new NextRequest("http://localhost/api/stream/market/m1", {
      signal: abort.signal,
    });
    const res = await GET(req, { params: Promise.resolve({ marketId: "m1" }) });
    const readChunk = createChunkReader(res);
    await readChunk();

    listener?.({
      id: "11",
      sequence: "11",
      type: "quote.updated",
      payload: { topLevels: { bids: [], asks: [] }, recentTrades: [] },
    });
    const second = await readChunk();
    expect(second).toContain("event: quote.updated");
    expect(second).toContain("\"sequence\":\"11\"");
    abort.abort();
  });

  test("heartbeat every 15 seconds", async () => {
    subscribeToMarketUpdates.mockImplementation(() => () => {});
    getMarketBootstrapEvent.mockResolvedValue({
      id: null,
      sequence: null,
      type: "quote.snapshot",
      payload: { topLevels: { bids: [], asks: [] }, recentTrades: [] },
    });

    const { GET } = await import("@/app/api/stream/market/[marketId]/route");
    const abort = new AbortController();
    const req = new NextRequest("http://localhost/api/stream/market/m1", {
      signal: abort.signal,
    });
    const res = await GET(req, { params: Promise.resolve({ marketId: "m1" }) });
    const readChunk = createChunkReader(res);
    await readChunk();
    jest.advanceTimersByTime(15_000);
    const heartbeat = await readChunk();
    expect(heartbeat).toContain(":\n\n");
    abort.abort();
  });

  test("reconnect with Last-Event-ID replays newer events", async () => {
    subscribeToMarketUpdates.mockImplementation(() => () => {});
    getMarketEventsSince.mockResolvedValue([
      {
        id: "6",
        sequence: "6",
        type: "quote.updated",
        payload: { topLevels: { bids: [], asks: [] }, recentTrades: [] },
      },
      {
        id: "7",
        sequence: "7",
        type: "quote.updated",
        payload: { topLevels: { bids: [], asks: [] }, recentTrades: [] },
      },
    ]);

    const { GET } = await import("@/app/api/stream/market/[marketId]/route");
    const abort = new AbortController();
    const req = new NextRequest("http://localhost/api/stream/market/m1", {
      headers: { "Last-Event-ID": "5" },
      signal: abort.signal,
    });
    const res = await GET(req, { params: Promise.resolve({ marketId: "m1" }) });
    const readChunk = createChunkReader(res);
    const chunk = await readChunk();
    expect(getMarketEventsSince).toHaveBeenCalledWith({
      marketId: "m1",
      outcomeId: null,
      lastSequence: "5",
    });
    expect(chunk).toContain("\"sequence\":\"6\"");
    abort.abort();
  });
});
