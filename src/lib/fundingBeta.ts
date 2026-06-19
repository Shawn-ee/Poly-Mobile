import { config } from "@/lib/config";
import { prisma } from "@/lib/db";

export class FundingAccessError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "FundingAccessError";
    this.status = status;
    this.code = code;
  }
}

export type FundingFeatureFlags = {
  internalFundingBetaEnabled: boolean;
  fundingKillSwitch: boolean;
  allowAutoDepositCredit: boolean;
  allowlistEmails: string[];
};

type FundingUser = {
  id: string;
  email: string | null;
  isAdmin?: boolean;
};

export function getFundingFeatureFlags(): FundingFeatureFlags {
  return {
    internalFundingBetaEnabled: config.internalFundingBetaEnabled,
    fundingKillSwitch: config.fundingKillSwitch,
    allowAutoDepositCredit: config.allowAutoDepositCredit,
    allowlistEmails: config.internalFundingAllowlistEmails,
  };
}

export function assertFundingNotKilled(flags = getFundingFeatureFlags()) {
  if (flags.fundingKillSwitch) {
    throw new FundingAccessError(
      "Funding is temporarily disabled.",
      503,
      "FUNDING_KILL_SWITCH_ACTIVE",
    );
  }
}

export function isInternalFundingAllowedForUser(
  user: FundingUser | null | undefined,
  flags = getFundingFeatureFlags(),
) {
  if (!user || !flags.internalFundingBetaEnabled) return false;
  if (user.isAdmin) return true;
  const email = user.email?.trim().toLowerCase();
  return Boolean(email && flags.allowlistEmails.includes(email));
}

export function requireInternalFundingUser(
  user: FundingUser | null | undefined,
  flags = getFundingFeatureFlags(),
) {
  if (!user) {
    throw new FundingAccessError("Unauthorized", 401, "UNAUTHORIZED");
  }
  if (!flags.internalFundingBetaEnabled) {
    throw new FundingAccessError(
      "Internal funding beta is not enabled.",
      403,
      "FUNDING_BETA_DISABLED",
    );
  }
  if (!isInternalFundingAllowedForUser(user, flags)) {
    throw new FundingAccessError(
      "Funding is limited to allowlisted internal beta users.",
      403,
      "FUNDING_NOT_ALLOWLISTED",
    );
  }
  return user;
}

export async function requireInternalFundingUserById(
  userId: string | null | undefined,
  flags = getFundingFeatureFlags(),
) {
  if (!userId) {
    throw new FundingAccessError("Unauthorized", 401, "UNAUTHORIZED");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, isAdmin: true },
  });

  return requireInternalFundingUser(user, flags);
}

export function assertAutoDepositCreditAllowed(flags = getFundingFeatureFlags()) {
  if (!flags.internalFundingBetaEnabled) {
    throw new FundingAccessError(
      "Internal funding beta is not enabled.",
      403,
      "FUNDING_BETA_DISABLED",
    );
  }
  assertFundingNotKilled(flags);
  if (!flags.allowAutoDepositCredit) {
    throw new FundingAccessError(
      "Automatic deposit crediting is disabled.",
      503,
      "AUTO_DEPOSIT_CREDIT_DISABLED",
    );
  }
}

export function toFundingAccessResponse(error: unknown) {
  if (error instanceof FundingAccessError) {
    return {
      body: { error: error.message, code: error.code },
      status: error.status,
    };
  }
  return null;
}
