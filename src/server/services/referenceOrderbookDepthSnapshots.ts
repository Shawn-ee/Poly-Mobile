import { Prisma, ReferenceOrderbookDepthSnapshot } from "@prisma/client";
import { prisma } from "@/lib/db";

export type ReferenceOrderbookDepthSnapshotInput = {
  marketId: string;
  outcomeId: string;
  source: string;
  externalSlug?: string | null;
  externalMarketId?: string | null;
  conditionId?: string | null;
  tokenId?: string | null;
  side: "bid" | "ask";
  price: number | string | Prisma.Decimal;
  size: number | string | Prisma.Decimal;
  levelIndex: number;
  fetchedAt: string | Date;
};

export async function upsertReferenceOrderbookDepthSnapshots(inputs: ReferenceOrderbookDepthSnapshotInput[]) {
  const normalized = inputs.map(normalizeInput).filter((input): input is NormalizedDepthInput => input != null);
  if (normalized.length === 0) return [] as ReferenceOrderbookDepthSnapshot[];

  return prisma.$transaction(
    normalized.map((input) =>
      prisma.referenceOrderbookDepthSnapshot.upsert({
        where: {
          marketId_outcomeId_source_side_price: {
            marketId: input.marketId,
            outcomeId: input.outcomeId,
            source: input.source,
            side: input.side,
            price: input.price,
          },
        },
        create: input,
        update: {
          externalSlug: input.externalSlug,
          externalMarketId: input.externalMarketId,
          conditionId: input.conditionId,
          tokenId: input.tokenId,
          size: input.size,
          levelIndex: input.levelIndex,
          fetchedAt: input.fetchedAt,
        },
      }),
    ),
  );
}

type NormalizedDepthInput = Prisma.ReferenceOrderbookDepthSnapshotUncheckedCreateInput;

function normalizeInput(input: ReferenceOrderbookDepthSnapshotInput): NormalizedDepthInput | null {
  const price = decimalOrNull(input.price);
  const size = decimalOrNull(input.size);
  if (!price || !size || price.lte(0) || price.gte(1) || size.lte(0)) return null;
  const fetchedAt = input.fetchedAt instanceof Date ? input.fetchedAt : new Date(input.fetchedAt);
  if (Number.isNaN(fetchedAt.getTime())) return null;

  return {
    marketId: input.marketId,
    outcomeId: input.outcomeId,
    source: input.source,
    externalSlug: input.externalSlug ?? null,
    externalMarketId: input.externalMarketId ?? null,
    conditionId: input.conditionId ?? null,
    tokenId: input.tokenId ?? null,
    side: input.side,
    price,
    size,
    levelIndex: Math.max(0, Math.floor(input.levelIndex)),
    fetchedAt,
  };
}

function decimalOrNull(value: number | string | Prisma.Decimal) {
  try {
    const decimal = new Prisma.Decimal(value);
    return decimal.isFinite() ? decimal : null;
  } catch {
    return null;
  }
}
