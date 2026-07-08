import type { PolyApi } from "../api";
import type { Locale } from "../mocks/worldCup";
import type { ProfilePreferences } from "../types";

export type LocalProfilePreferences = {
  locale: Locale;
  ticketDefaultAmount: string;
  ticketDefaultSide: "buy" | "sell";
  ticketDefaultSlippage: string;
  savedEventIds: string[];
};

export const toProfilePreferencesPayload = (preferences: LocalProfilePreferences): ProfilePreferences => ({
  locale: preferences.locale,
  ticketDefaultAmount: preferences.ticketDefaultAmount,
  ticketDefaultSide: preferences.ticketDefaultSide === "sell" ? "SELL" : "BUY",
  ticketDefaultSlippage: preferences.ticketDefaultSlippage,
  savedEventIds: [...preferences.savedEventIds],
});

export const fromProfilePreferencesPayload = (preferences: ProfilePreferences): LocalProfilePreferences => ({
  locale: preferences.locale,
  ticketDefaultAmount: preferences.ticketDefaultAmount,
  ticketDefaultSide: preferences.ticketDefaultSide === "SELL" ? "sell" : "buy",
  ticketDefaultSlippage: preferences.ticketDefaultSlippage ?? "1%",
  savedEventIds: [...preferences.savedEventIds],
});

export const loadProfilePreferences = async (api: PolyApi): Promise<LocalProfilePreferences> => {
  const response = await api.getProfilePreferences();
  return fromProfilePreferencesPayload(response.preferences);
};

export const saveProfilePreferences = async (
  api: PolyApi,
  preferences: LocalProfilePreferences,
): Promise<LocalProfilePreferences> => {
  const response = await api.saveProfilePreferences(toProfilePreferencesPayload(preferences));
  return fromProfilePreferencesPayload(response.preferences);
};
