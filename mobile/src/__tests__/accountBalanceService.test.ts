import { describe, expect, test, vi } from "vitest";
import { loadAccountBalance, mapAccountBalance } from "../services/accountBalanceService";

describe("accountBalanceService", () => {
  test("maps canonical route balance strings into mobile numeric values", () => {
    expect(mapAccountBalance({
      availableUSDC: "40.800000",
      lockedUSDC: "2.500000",
      totalUSDC: "43.300000",
      updatedAt: "2026-07-06T12:00:00.000Z",
    })).toEqual({
      source: "server-route",
      availableUSDC: 40.8,
      lockedUSDC: 2.5,
      totalUSDC: 43.3,
      updatedAt: "2026-07-06T12:00:00.000Z",
    });
  });

  test("loads visible cash balance through the canonical account route", async () => {
    const getAccountBalance = vi.fn(async () => ({
      availableUSDC: "12.250000",
      lockedUSDC: "1.750000",
      totalUSDC: "14.000000",
      updatedAt: new Date("2026-07-06T13:00:00.000Z"),
    }));

    await expect(loadAccountBalance({ api: { getAccountBalance }, fallbackBalance: 999 })).resolves.toEqual({
      source: "server-route",
      availableUSDC: 12.25,
      lockedUSDC: 1.75,
      totalUSDC: 14,
      updatedAt: "2026-07-06T13:00:00.000Z",
    });
    expect(getAccountBalance).toHaveBeenCalledTimes(1);
  });

  test("uses local fallback only when the account route is unavailable", async () => {
    await expect(loadAccountBalance({
      api: { getAccountBalance: vi.fn(async () => { throw new Error("offline"); }) },
      fallbackBalance: 25,
    })).resolves.toEqual({
      source: "local-fallback",
      availableUSDC: 25,
      lockedUSDC: 0,
      totalUSDC: 25,
      updatedAt: null,
    });
  });
});
