import { prisma } from "@/lib/db";
import { CanonicalApiError } from "@/lib/canonicalApi";

export type ProfilePreferences = {
  locale: "en" | "zh";
  ticketDefaultAmount: string;
  ticketDefaultSide: "BUY" | "SELL";
  ticketDefaultSlippage: string;
  savedEventIds: string[];
};

const DEFAULT_PROFILE_PREFERENCES: ProfilePreferences = {
  locale: "en",
  ticketDefaultAmount: "100",
  ticketDefaultSide: "BUY",
  ticketDefaultSlippage: "1%",
  savedEventIds: [],
};

type PreferenceRow = {
  preferences: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeStoredPreferences = (value: unknown): ProfilePreferences => {
  if (!isRecord(value)) {
    return { ...DEFAULT_PROFILE_PREFERENCES };
  }

  return {
    locale: value.locale === "zh" ? "zh" : "en",
    ticketDefaultAmount:
      typeof value.ticketDefaultAmount === "string" && value.ticketDefaultAmount.trim()
        ? value.ticketDefaultAmount
        : DEFAULT_PROFILE_PREFERENCES.ticketDefaultAmount,
    ticketDefaultSide: value.ticketDefaultSide === "SELL" ? "SELL" : "BUY",
    ticketDefaultSlippage:
      typeof value.ticketDefaultSlippage === "string" && value.ticketDefaultSlippage.trim()
        ? value.ticketDefaultSlippage
        : DEFAULT_PROFILE_PREFERENCES.ticketDefaultSlippage,
    savedEventIds: Array.isArray(value.savedEventIds)
      ? value.savedEventIds.filter((id): id is string => typeof id === "string")
      : [],
  };
};

export const parseProfilePreferencesInput = (input: unknown): ProfilePreferences => {
  if (!isRecord(input)) {
    throw new CanonicalApiError("INVALID_REQUEST", "Profile preferences body is required.", 400);
  }

  if (input.locale !== "en" && input.locale !== "zh") {
    throw new CanonicalApiError("INVALID_REQUEST", "locale must be en or zh.", 400);
  }

  if (typeof input.ticketDefaultAmount !== "string" || !input.ticketDefaultAmount.trim()) {
    throw new CanonicalApiError("INVALID_REQUEST", "ticketDefaultAmount is required.", 400);
  }

  if (input.ticketDefaultSide !== "BUY" && input.ticketDefaultSide !== "SELL") {
    throw new CanonicalApiError("INVALID_REQUEST", "ticketDefaultSide must be BUY or SELL.", 400);
  }

  if (typeof input.ticketDefaultSlippage !== "string" || !input.ticketDefaultSlippage.trim()) {
    throw new CanonicalApiError("INVALID_REQUEST", "ticketDefaultSlippage is required.", 400);
  }

  if (!Array.isArray(input.savedEventIds) || input.savedEventIds.some((id) => typeof id !== "string")) {
    throw new CanonicalApiError("INVALID_REQUEST", "savedEventIds must be a string array.", 400);
  }

  return {
    locale: input.locale,
    ticketDefaultAmount: input.ticketDefaultAmount,
    ticketDefaultSide: input.ticketDefaultSide,
    ticketDefaultSlippage: input.ticketDefaultSlippage,
    savedEventIds: [...input.savedEventIds],
  };
};

export const getProfilePreferences = async (params: { userId: string }) => {
  const rows = await prisma.$queryRaw<PreferenceRow[]>`
    SELECT "preferences"
    FROM "UserProfilePreference"
    WHERE "userId" = ${params.userId}
    LIMIT 1
  `;

  return { preferences: normalizeStoredPreferences(rows[0]?.preferences) };
};

export const saveProfilePreferences = async (params: {
  userId: string;
  preferences: ProfilePreferences;
}) => {
  const serialized = JSON.stringify(params.preferences);
  const rows = await prisma.$queryRaw<PreferenceRow[]>`
    INSERT INTO "UserProfilePreference" ("userId", "preferences", "createdAt", "updatedAt")
    VALUES (${params.userId}, ${serialized}::jsonb, NOW(), NOW())
    ON CONFLICT ("userId")
    DO UPDATE SET
      "preferences" = EXCLUDED."preferences",
      "updatedAt" = NOW()
    RETURNING "preferences"
  `;

  return { preferences: normalizeStoredPreferences(rows[0]?.preferences) };
};
