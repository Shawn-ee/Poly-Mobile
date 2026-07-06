import { describe, expect, test } from "vitest";
import { loadProfileSummary, toAccountSummaryViewModel } from "../services/profileSummaryService";
import type { ProfileSummary } from "../types";

const summary: ProfileSummary = {
  profile: {
    id: "user-1",
    username: "holiwyn_user",
    displayName: null,
    email: "user@example.test",
    image: null,
    hasCustomAvatar: false,
    isAdmin: false,
  },
  preferences: {
    locale: "zh",
    ticketDefaultAmount: "250",
    ticketDefaultSide: "SELL",
    ticketDefaultSlippage: "2%",
    savedEventIds: ["match-1", "match-2"],
  },
  account: {
    walletAvailableUSDC: "40.800000",
    walletLockedUSDC: "0.000000",
    walletTotalUSDC: "40.800000",
    portfolioValue: "100.060000",
    openPositionCount: 1,
    openOrderCount: 2,
    openOrderValue: "20.500000",
    totalExposure: "120.560000",
    tradingMode: "server",
  },
};

describe("profileSummaryService", () => {
  test("maps backend profile summary into Account screen values", () => {
    expect(toAccountSummaryViewModel(summary)).toEqual({
      source: "server-route",
      profileId: "user-1",
      username: "holiwyn_user",
      displayName: "holiwyn_user",
      email: "user@example.test",
      balance: 40.8,
      portfolioValue: 100.06,
      openPositionCount: 1,
      openOrderCount: 2,
      openOrderValue: 20.5,
      totalExposure: 120.56,
      tradingMode: "server",
      savedMarketCount: 2,
      ticketDefaultAmount: "250",
      ticketDefaultSide: "sell",
      ticketDefaultSlippage: "2%",
      locale: "zh",
    });
  });

  test("loads profile summary through the mobile API client", async () => {
    await expect(
      loadProfileSummary({
        getProfileSummary: async () => summary,
      }),
    ).resolves.toMatchObject({
      source: "server-route",
      savedMarketCount: 2,
      ticketDefaultSide: "sell",
    });
  });
});
