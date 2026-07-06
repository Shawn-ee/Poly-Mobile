import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CanonicalApiError } from "@/lib/canonicalApi";
import { getProfilePreferences } from "@/server/services/profilePreferences";

export type ProfileSummary = {
  profile: {
    id: string;
    username: string;
    displayName: string | null;
    email: string | null;
    image: string | null;
    hasCustomAvatar: boolean;
    isAdmin: boolean;
  };
  preferences: Awaited<ReturnType<typeof getProfilePreferences>>["preferences"];
  account: {
    walletAvailableUSDC: string;
    walletLockedUSDC: string;
    walletTotalUSDC: string;
    portfolioValue: string;
    openPositionCount: number;
    openOrderCount: number;
    openOrderValue: string;
    totalExposure: string;
    tradingMode: "server";
  };
};

const ZERO = new Prisma.Decimal(0);

const decimalString = (value: Prisma.Decimal.Value) =>
  new Prisma.Decimal(value).toDecimalPlaces(6).toString();

export const getProfileSummary = async (params: { userId: string }): Promise<ProfileSummary> => {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      image: true,
      hasCustomAvatar: true,
      isAdmin: true,
      balance: {
        select: {
          availableUSDC: true,
          lockedUSDC: true,
        },
      },
      positions: {
        where: {
          shares: { gt: ZERO },
        },
        select: {
          shares: true,
          avgCost: true,
        },
      },
      orders: {
        where: {
          status: { in: ["OPEN", "PARTIAL"] },
        },
        select: {
          remaining: true,
          price: true,
        },
      },
    },
  });

  if (!user) {
    throw new CanonicalApiError("NOT_FOUND", "Profile not found.", 404);
  }

  const preferences = await getProfilePreferences({ userId: params.userId });
  const walletAvailableUSDC = user.balance?.availableUSDC ?? ZERO;
  const walletLockedUSDC = user.balance?.lockedUSDC ?? ZERO;
  const walletTotalUSDC = new Prisma.Decimal(walletAvailableUSDC).plus(walletLockedUSDC);
  const portfolioValue = user.positions.reduce(
    (sum, position) => sum.plus(new Prisma.Decimal(position.shares).mul(position.avgCost)),
    ZERO,
  );
  const openOrderValue = user.orders.reduce(
    (sum, order) => sum.plus(new Prisma.Decimal(order.remaining).mul(order.price)),
    ZERO,
  );

  return {
    profile: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      image: user.image,
      hasCustomAvatar: user.hasCustomAvatar,
      isAdmin: user.isAdmin,
    },
    preferences: preferences.preferences,
    account: {
      walletAvailableUSDC: decimalString(walletAvailableUSDC),
      walletLockedUSDC: decimalString(walletLockedUSDC),
      walletTotalUSDC: decimalString(walletTotalUSDC),
      portfolioValue: decimalString(portfolioValue),
      openPositionCount: user.positions.length,
      openOrderCount: user.orders.length,
      openOrderValue: decimalString(openOrderValue),
      totalExposure: decimalString(portfolioValue.plus(openOrderValue)),
      tradingMode: "server",
    },
  };
};
