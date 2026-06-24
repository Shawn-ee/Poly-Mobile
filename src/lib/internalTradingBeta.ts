import { CanonicalApiError } from "@/lib/canonicalApi";
import { config } from "@/lib/config";
import { prisma } from "@/lib/db";

export type TradingFeatureFlags = {
  internalTradingBetaEnabled: boolean;
  tradingKillSwitch: boolean;
  allowlistEmails: string[];
};

type TradingUser = {
  id: string;
  email: string | null;
  isAdmin?: boolean;
};

export function getTradingFeatureFlags(): TradingFeatureFlags {
  return {
    internalTradingBetaEnabled: config.internalTradingBetaEnabled,
    tradingKillSwitch: config.tradingKillSwitch,
    allowlistEmails: config.internalTradingAllowlistEmails,
  };
}

export function assertTradingNotKilled(flags = getTradingFeatureFlags()) {
  if (flags.tradingKillSwitch) {
    throw new CanonicalApiError(
      "TRADING_KILL_SWITCH_ACTIVE",
      "Internal trading beta is temporarily disabled.",
      503,
    );
  }
}

export function isInternalTradingAllowedForUser(
  user: TradingUser | null | undefined,
  flags = getTradingFeatureFlags(),
) {
  if (!user || !flags.internalTradingBetaEnabled) return false;
  if (user.isAdmin) return true;
  const email = user.email?.trim().toLowerCase();
  return Boolean(email && flags.allowlistEmails.includes(email));
}

export function requireInternalTradingUser(
  user: TradingUser | null | undefined,
  flags = getTradingFeatureFlags(),
) {
  if (!user) {
    throw new CanonicalApiError("UNAUTHORIZED", "Authentication required.", 401);
  }
  if (!flags.internalTradingBetaEnabled) {
    throw new CanonicalApiError(
      "TRADING_BETA_DISABLED",
      "Internal trading beta is not enabled.",
      403,
    );
  }
  assertTradingNotKilled(flags);
  if (!isInternalTradingAllowedForUser(user, flags)) {
    throw new CanonicalApiError(
      "TRADING_NOT_ALLOWLISTED",
      "Trading is limited to allowlisted internal beta users.",
      403,
    );
  }
  return user;
}

export async function requireInternalTradingUserById(
  userId: string | null | undefined,
  flags = getTradingFeatureFlags(),
) {
  if (!userId) {
    throw new CanonicalApiError("UNAUTHORIZED", "Authentication required.", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, isAdmin: true },
  });

  return requireInternalTradingUser(user, flags);
}
