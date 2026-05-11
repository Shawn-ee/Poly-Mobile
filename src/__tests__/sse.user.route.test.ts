import { NextRequest } from "next/server";
import { CanonicalApiError } from "@/lib/canonicalApi";

const requireCanonicalActor = jest.fn();
const subscribeToUserUpdates = jest.fn();
const getUserBootstrapEvent = jest.fn();
const getUserEventsSince = jest.fn();

jest.mock("@/lib/canonicalAuth", () => ({
  requireCanonicalActor: (...args: unknown[]) => requireCanonicalActor(...args),
}));

jest.mock("@/server/services/orderbookEvents", () => ({
  subscribeToUserUpdates: (...args: unknown[]) => subscribeToUserUpdates(...args),
  getUserBootstrapEvent: (...args: unknown[]) => getUserBootstrapEvent(...args),
  getUserEventsSince: (...args: unknown[]) => getUserEventsSince(...args),
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

describe("SSE user stream", () => {
  beforeEach(() => {
    requireCanonicalActor.mockReset();
    subscribeToUserUpdates.mockReset();
    getUserBootstrapEvent.mockReset();
    getUserEventsSince.mockReset();
  });

  test("initial snapshot for authenticated user", async () => {
    requireCanonicalActor.mockResolvedValue({ userId: "u1" });
    subscribeToUserUpdates.mockImplementation(() => () => {});
    getUserBootstrapEvent.mockResolvedValue({
      id: null,
      sequence: null,
      type: "account.snapshot",
      payload: {
        balance: { availableUSDC: "10", lockedUSDC: "0", totalUSDC: "10" },
        orders: [{ id: "o1" }],
        fills: [{ id: "f1" }],
      },
    });

    const { GET } = await import("@/app/api/stream/me/orders/route");
    const abort = new AbortController();
    const req = new NextRequest("http://localhost/api/stream/me/orders?marketId=m1", {
      signal: abort.signal,
    });
    const res = await GET(req);
    const readChunk = createChunkReader(res);
    const chunk = await readChunk();
    expect(res.status).toBe(200);
    expect(chunk).toContain("event: account.snapshot");
    expect(chunk).toContain("\"orders\"");
    expect(chunk).toContain("\"fills\"");
    abort.abort();
  });

  test("user-specific updates are streamed", async () => {
    requireCanonicalActor.mockResolvedValue({ userId: "u1" });
    let listener: ((payload: unknown) => void) | null = null;
    subscribeToUserUpdates.mockImplementation((_id, cb) => {
      listener = cb;
      return () => {};
    });
    getUserBootstrapEvent.mockResolvedValue({
      id: null,
      sequence: null,
      type: "account.snapshot",
      payload: {
        balance: null,
        orders: [],
        fills: [],
      },
    });

    const { GET } = await import("@/app/api/stream/me/orders/route");
    const abort = new AbortController();
    const req = new NextRequest("http://localhost/api/stream/me/orders", {
      signal: abort.signal,
    });
    const res = await GET(req);
    const readChunk = createChunkReader(res);
    await readChunk();
    listener?.({
      id: "3",
      sequence: "3",
      type: "account.updated",
      payload: {
        balance: null,
        orders: [{ id: "o2" }],
        fills: [],
      },
    });
    const chunk = await readChunk();
    expect(chunk).toContain("event: account.updated");
    expect(chunk).toContain("\"sequence\":\"3\"");
    expect(chunk).toContain("\"o2\"");
    abort.abort();
  });

  test("unauthorized users cannot access private stream", async () => {
    requireCanonicalActor.mockRejectedValue(
      new CanonicalApiError("UNAUTHORIZED", "Authentication required.", 401)
    );

    const { GET } = await import("@/app/api/stream/me/orders/route");
    const req = new NextRequest("http://localhost/api/stream/me/orders");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
