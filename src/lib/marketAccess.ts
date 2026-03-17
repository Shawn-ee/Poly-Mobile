import { Market, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { MarketGuardError } from "@/lib/marketGuards";

type DbLike = PrismaClient | typeof prisma;

export const assertMarketVisibleToUser = async (params: {
  market: Pick<Market, "id" | "visibility" | "ownerId" | "mechanism">;
  userId: string | null;
  db?: DbLike;
}) => {
  const db = params.db ?? prisma;

  if (params.market.visibility === "PUBLIC") {
    return;
  }

  if (!params.userId) {
    throw new MarketGuardError("Unauthorized", 401);
  }

  if (params.market.ownerId && params.market.ownerId === params.userId) {
    return;
  }

  const membership = await db.marketMember.findUnique({
    where: {
      marketId_userId: {
        marketId: params.market.id,
        userId: params.userId,
      },
    },
    select: { id: true },
  });

  if (membership) {
    return;
  }

  throw new MarketGuardError("Forbidden", 403);
};

export const upsertMarketMember = async (params: {
  marketId: string;
  userId: string;
  role?: "OWNER" | "MEMBER";
  db?: DbLike;
}) => {
  const db = params.db ?? prisma;
  return db.marketMember.upsert({
    where: {
      marketId_userId: {
        marketId: params.marketId,
        userId: params.userId,
      },
    },
    create: {
      marketId: params.marketId,
      userId: params.userId,
      role: params.role ?? "MEMBER",
    },
    update: {
      role: params.role ?? "MEMBER",
    },
  });
};
