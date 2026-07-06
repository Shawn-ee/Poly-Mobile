import type { PolyApi } from "../api";
import type { ProfileSummary } from "../types";

export type AccountSummaryViewModel = {
  source: "server-route";
  profileId: string;
  username: string;
  displayName: string;
  email: string | null;
  balance: number;
  portfolioValue: number;
  openPositionCount: number;
  openOrderCount: number;
  openOrderValue: number;
  totalExposure: number;
  tradingMode: "server";
  savedMarketCount: number;
  ticketDefaultAmount: string;
  ticketDefaultSide: "buy" | "sell";
  ticketDefaultSlippage: string;
  locale: "en" | "zh";
};

const numberValue = (value: string | number | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const toAccountSummaryViewModel = (summary: ProfileSummary): AccountSummaryViewModel => ({
  source: "server-route",
  profileId: summary.profile.id,
  username: summary.profile.username,
  displayName: summary.profile.displayName ?? summary.profile.username,
  email: summary.profile.email,
  balance: numberValue(summary.account.walletTotalUSDC),
  portfolioValue: numberValue(summary.account.portfolioValue),
  openPositionCount: summary.account.openPositionCount,
  openOrderCount: summary.account.openOrderCount,
  openOrderValue: numberValue(summary.account.openOrderValue),
  totalExposure: numberValue(summary.account.totalExposure),
  tradingMode: "server",
  savedMarketCount: summary.preferences.savedEventIds.length,
  ticketDefaultAmount: summary.preferences.ticketDefaultAmount,
  ticketDefaultSide: summary.preferences.ticketDefaultSide === "SELL" ? "sell" : "buy",
  ticketDefaultSlippage: summary.preferences.ticketDefaultSlippage ?? "1%",
  locale: summary.preferences.locale,
});

export const loadProfileSummary = async (
  api: Pick<PolyApi, "getProfileSummary">,
): Promise<AccountSummaryViewModel> => toAccountSummaryViewModel(await api.getProfileSummary());
