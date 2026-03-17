import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { recomputeBalanceFromLedger } from "@/server/services/ledger";

export class WalletUserProvisioningError extends Error {
  status: number;

  constructor(message = "User account is not provisioned.", status = 401) {
    super(message);
    this.name = "WalletUserProvisioningError";
    this.status = status;
  }
}

const formatUsdc = (value: Prisma.Decimal | number) => {
  const decimal = value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
  return decimal.toFixed(6);
};

export const getWalletBalance = async (userId: string) => {
  const custody = await getCustodyBalance(userId);
  return custody.totalUSDC;
};

export const getCustodyBalance = async (userId: string) => {
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!userExists) {
    throw new WalletUserProvisioningError("Session user was not found in database.", 401);
  }

  const balance = await prisma.userBalance.findUnique({
    where: { userId },
  });
  if (!balance) {
    const recomputed = await recomputeBalanceFromLedger(userId);
    let syncedBalance;
    try {
      syncedBalance = await prisma.userBalance.upsert({
        where: { userId },
        create: {
          userId,
          availableUSDC: recomputed.availableUSDC,
          lockedUSDC: recomputed.lockedUSDC,
        },
        update: {
          availableUSDC: recomputed.availableUSDC,
          lockedUSDC: recomputed.lockedUSDC,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new WalletUserProvisioningError("Session user does not exist.", 401);
      }
      throw error;
    }
    return {
      availableUSDC: formatUsdc(syncedBalance.availableUSDC),
      lockedUSDC: formatUsdc(syncedBalance.lockedUSDC),
      totalUSDC: formatUsdc(syncedBalance.availableUSDC.add(syncedBalance.lockedUSDC)),
      updatedAt: syncedBalance.updatedAt,
    };
  }

  return {
    availableUSDC: formatUsdc(balance.availableUSDC),
    lockedUSDC: formatUsdc(balance.lockedUSDC),
    totalUSDC: formatUsdc(balance.availableUSDC.add(balance.lockedUSDC)),
    updatedAt: balance.updatedAt,
  };
};
