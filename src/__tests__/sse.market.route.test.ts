import { NextRequest } from "next/server";
import { GET } from "@/app/api/stream/market/[marketId]/route";

const subscribeToMarketUpdates = jest.fn();
const emitMarketUpdate = jest.fn();
const getMarketEventsSince = jest.fn();

jest.mock("@/server/services/orderbookEvents", () => ({
  subscribeToMarketUpdates: (...args: unknown[]) => subscribeToMarketUpdates(...args),
  emitMarketUpdate: (...args: unknown[]) => emitMarketUpdate(...args),
  getMarketEventsSince: (...args: unknown[]) => getMarketEventsSince(...args),
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
    subscribeToMarketUpdates.mockReset();
    emitMarketUpdate.mockReset();
    getMarketEventsSince.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("1.1 initial snapshot on connect", async () => {
    let listener: ((payload: unknown) => void) | null = null;
    subscribeToMarketUpdates.mockImplementation((_id, cb) => {
      listener = cb;
      return () => {};
    });
    emitMarketUpdate.mockResolvedValue({
      type: "market_update",
      sequence: 1,
      topLevels: { bids: [{ price: 0.5, size: 10 }], asks: [{ price: 0.6, size: 8 }] },
      recentTrades: [{ id: "t1" }],
    });

    const abort = new AbortController();
    const req = new NextRequest("http://localhost/api/stream/market/m1", {
      signal: abort.signal,
    });
    const res = await GET(req, { params: Promise.resolve({ marketId: "m1" }) });
    const readChunk = createChunkReader(res);
    const chunk = await readChunk();
    expect(chunk).toContain("data:");
    expect(chunk).toContain("\"sequence\":1");
    expect(chunk).toContain("\"topLevels\"");
    expect(chunk).toContain("\"recentTrades\"");
    expect(listener).not.toBeNull();
    abort.abort();
  });

  test("1.2 realtime updates with ascending sequence", async () => {
    let listener: ((payload: unknown) => void) | null = null;
    subscribeToMarketUpdates.mockImplementation((_id, cb) => {
      listener = cb;
      return () => {};
    });
    emitMarketUpdate.mockResolvedValue({
      type: "market_update",
      sequence: 10,
      topLevels: { bids: [], asks: [] },
      recentTrades: [],
    });

    const abort = new AbortController();
    const req = new NextRequest("http://localhost/api/stream/market/m1", {
      signal: abort.signal,
    });
    const res = await GET(req, { params: Promise.resolve({ marketId: "m1" }) });
    const readChunk = createChunkReader(res);
    const first = await readChunk();
    expect(first).toContain("\"sequence\":10");

    listener?.({
      type: "market_update",
      sequence: 11,
      topLevels: { bids: [], asks: [] },
      recentTrades: [],
    });
    const second = await readChunk();
    expect(second).toContain("\"sequence\":11");
    abort.abort();
  });

  test("1.3 heartbeat every 15 seconds", async () => {
    subscribeToMarketUpdates.mockImplementation(() => () => {});
    emitMarketUpdate.mockResolvedValue({
      type: "market_update",
      sequence: 1,
      topLevels: { bids: [], asks: [] },
      recentTrades: [],
    });

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

  test("1.4 reconnect with Last-Event-ID replays newer events", async () => {
    subscribeToMarketUpdates.mockImplementation(() => () => {});
    getMarketEventsSince.mockReturnValue([
      { type: "market_update", sequence: 6, topLevels: { bids: [], asks: [] }, recentTrades: [] },
      { type: "market_update", sequence: 7, topLevels: { bids: [], asks: [] }, recentTrades: [] },
    ]);

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
      lastSequence: 5,
    });
    expect(chunk).toContain("\"sequence\":6");
    abort.abort();
  });
});
