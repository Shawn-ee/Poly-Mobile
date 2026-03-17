import { NextRequest } from "next/server";
import { GET } from "@/app/api/stream/me/orders/route";

const subscribeToUserUpdates = jest.fn();
const emitUserUpdate = jest.fn();
const getUserId = jest.fn();

jest.mock("@/lib/auth", () => ({
  getUserId: () => getUserId(),
}));

jest.mock("@/server/services/orderbookEvents", () => ({
  subscribeToUserUpdates: (...args: unknown[]) => subscribeToUserUpdates(...args),
  emitUserUpdate: (...args: unknown[]) => emitUserUpdate(...args),
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
    subscribeToUserUpdates.mockReset();
    emitUserUpdate.mockReset();
    getUserId.mockReset();
  });

  test("2.1 initial snapshot for authenticated user", async () => {
    getUserId.mockResolvedValue("u1");
    subscribeToUserUpdates.mockImplementation(() => () => {});
    emitUserUpdate.mockResolvedValue({
      type: "user_update",
      sequence: 1,
      orders: [{ id: "o1" }],
      fills: [{ id: "f1" }],
    });

    const abort = new AbortController();
    const req = new NextRequest("http://localhost/api/stream/me/orders?marketId=m1", {
      signal: abort.signal,
    });
    const res = await GET(req);
    const readChunk = createChunkReader(res);
    const chunk = await readChunk();
    expect(chunk).toContain("\"orders\"");
    expect(chunk).toContain("\"fills\"");
    abort.abort();
  });

  test("2.2 user-specific updates are streamed", async () => {
    getUserId.mockResolvedValue("u1");
    let listener: ((payload: unknown) => void) | null = null;
    subscribeToUserUpdates.mockImplementation((_id, cb) => {
      listener = cb;
      return () => {};
    });
    emitUserUpdate.mockResolvedValue({
      type: "user_update",
      sequence: 2,
      orders: [],
      fills: [],
    });

    const abort = new AbortController();
    const req = new NextRequest("http://localhost/api/stream/me/orders", {
      signal: abort.signal,
    });
    const res = await GET(req);
    const readChunk = createChunkReader(res);
    await readChunk();
    listener?.({
      type: "user_update",
      sequence: 3,
      orders: [{ id: "o2" }],
      fills: [],
    });
    const chunk = await readChunk();
    expect(chunk).toContain("\"sequence\":3");
    expect(chunk).toContain("\"o2\"");
    abort.abort();
  });

  test("7.1 unauthorized users cannot access private stream", async () => {
    getUserId.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/stream/me/orders");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
