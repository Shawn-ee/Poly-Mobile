import { Prisma } from "@prisma/client";

export type MobileDepthSeedOrder = {
  outcomeId: string;
  side: "BUY" | "SELL";
  price: Prisma.Decimal;
  amount: Prisma.Decimal;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const probabilityForIndex = (index: number, count: number) => {
  if (count <= 1) return 0.5;
  const head = 0.62;
  const tail = 0.18;
  const step = (head - tail) / Math.max(1, count - 1);
  return clamp(head - index * step, 0.08, 0.82);
};

export const buildMobileLiveOrderbookDepthRows = (
  outcomes: Array<{ id: string; displayOrder?: number | null }>,
): MobileDepthSeedOrder[] =>
  outcomes.flatMap((outcome, index) => {
    const probability = probabilityForIndex(index, outcomes.length);
    const bidPrice = new Prisma.Decimal(clamp(probability - 0.03, 0.02, 0.97).toFixed(2));
    const askPrice = new Prisma.Decimal(clamp(probability + 0.03, 0.03, 0.98).toFixed(2));
    const baseSize = 820 + index * 160;

    return [
      {
        outcomeId: outcome.id,
        side: "BUY",
        price: bidPrice,
        amount: new Prisma.Decimal((baseSize + 240).toFixed(6)),
      },
      {
        outcomeId: outcome.id,
        side: "BUY",
        price: bidPrice.minus(new Prisma.Decimal("0.02")),
        amount: new Prisma.Decimal(baseSize.toFixed(6)),
      },
      {
        outcomeId: outcome.id,
        side: "SELL",
        price: askPrice,
        amount: new Prisma.Decimal((baseSize + 120).toFixed(6)),
      },
      {
        outcomeId: outcome.id,
        side: "SELL",
        price: askPrice.plus(new Prisma.Decimal("0.02")),
        amount: new Prisma.Decimal((baseSize - 80).toFixed(6)),
      },
    ];
  });
