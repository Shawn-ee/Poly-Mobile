const queryRaw = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => queryRaw(...args),
  },
}));

import {
  getProfilePreferences,
  parseProfilePreferencesInput,
  saveProfilePreferences,
} from "@/server/services/profilePreferences";
import { CanonicalApiError } from "@/lib/canonicalApi";

describe("profilePreferences service", () => {
  beforeEach(() => {
    queryRaw.mockReset();
  });

  test("returns canonical defaults when no stored row exists", async () => {
    queryRaw.mockResolvedValue([]);

    await expect(getProfilePreferences({ userId: "user-1" })).resolves.toEqual({
      preferences: {
        locale: "en",
        ticketDefaultAmount: "100",
        ticketDefaultSide: "BUY",
        ticketDefaultSlippage: "1%",
        savedEventIds: [],
      },
    });
  });

  test("normalizes legacy stored payloads without slippage", async () => {
    queryRaw.mockResolvedValue([
      {
        preferences: {
          locale: "zh",
          ticketDefaultAmount: "250",
          ticketDefaultSide: "SELL",
          savedEventIds: ["world-cup-winner", 7, "mexico-ecuador"],
        },
      },
    ]);

    await expect(getProfilePreferences({ userId: "user-1" })).resolves.toEqual({
      preferences: {
        locale: "zh",
        ticketDefaultAmount: "250",
        ticketDefaultSide: "SELL",
        ticketDefaultSlippage: "1%",
        savedEventIds: ["world-cup-winner", "mexico-ecuador"],
      },
    });
  });

  test("saves and returns canonical profile preferences", async () => {
    const preferences = {
      locale: "zh" as const,
      ticketDefaultAmount: "500",
      ticketDefaultSide: "SELL" as const,
      ticketDefaultSlippage: "2%",
      savedEventIds: ["world-cup-winner"],
    };
    queryRaw.mockResolvedValue([{ preferences }]);

    await expect(saveProfilePreferences({ userId: "user-1", preferences })).resolves.toEqual({
      preferences,
    });

    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(queryRaw.mock.calls[0]).toEqual(expect.arrayContaining(["user-1", JSON.stringify(preferences)]));
  });

  test("rejects preference payloads missing saved event ids", () => {
    expect(() =>
      parseProfilePreferencesInput({
        locale: "en",
        ticketDefaultAmount: "100",
        ticketDefaultSide: "BUY",
        ticketDefaultSlippage: "1%",
      }),
    ).toThrow(CanonicalApiError);
  });
});
