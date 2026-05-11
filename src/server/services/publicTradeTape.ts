import { prisma } from "@/lib/db";

export type PublicTradeTapeEntry = {
  id: string;
  executionId: string;
  marketId: string;
  outcomeId: string;
  outcomeName: string;
  outcome: string;
  side: "BUY" | "SELL";
  price: number;
  quantity: number;
  shares: number;
  cost: number;
  createdAt: Date;
};

export async function getPublicTradeTape(params: {
  marketId: string;
  outcomeId?: string | null;
  limit: number;
}) {
  const items = await prisma.fill.findMany({
    where: {
      marketId: params.marketId,
      ...(params.outcomeId ? { outcomeId: params.outcomeId } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: params.limit,
    include: {
      outcome: { select: { id: true, name: true } },
    },
  });

  return items.map(
    (item) =>
      ({
        id: item.id,
        executionId: item.id,
        marketId: item.marketId,
        outcomeId: item.outcomeId,
        outcomeName: item.outcome.name,
        outcome: item.outcome.name,
        side: item.side,
        price: Number(item.price),
        quantity: Number(item.size),
        shares: Number(item.size),
        cost: Number(item.notionalUSDC),
        createdAt: item.createdAt,
      }) satisfies PublicTradeTapeEntry
  );
}
