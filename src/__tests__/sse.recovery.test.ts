import { backoffMs, connectSseWithBackoff } from "@/lib/sseReconnect";

describe("SSE fault and recovery", () => {
  test("5.1 reconnect uses exponential backoff", () => {
    expect(backoffMs(1)).toBe(250);
    expect(backoffMs(2)).toBe(500);
    expect(backoffMs(3)).toBe(1000);
    expect(backoffMs(10)).toBe(10_000);
  });

  test("5.1 disconnect triggers reconnect attempts", () => {
    jest.useFakeTimers();
    const created: Array<{ onerror: (() => void) | null; close: jest.Mock }> = [];
    const create = () => {
      const source = {
        close: jest.fn(),
        onopen: null as (() => void) | null,
        onerror: null as (() => void) | null,
      };
      created.push(source);
      return source;
    };

    const stop = connectSseWithBackoff({ create });
    expect(created.length).toBe(1);
    created[0].onerror?.();
    jest.advanceTimersByTime(250);
    expect(created.length).toBe(2);
    stop();
    jest.useRealTimers();
  });
});
