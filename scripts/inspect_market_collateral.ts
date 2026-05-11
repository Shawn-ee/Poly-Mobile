import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const marketId = process.argv[2] ?? "3cf692cd-36d6-444d-9a2e-14e01b155426";
const ZERO = new Prisma.Decimal(0);

async function main() {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    select: {
      id: true,
      title: true,
      status: true,
      visibility: true,
      mechanism: true,
      collateralUSDC: true,
      outcomes: {
        where: { isActive: true },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, name: true },
      },
    },
  });

  if (!market) {
    throw new Error(`Market not found: ${marketId}`);
  }

  const grouped = await prisma.position.groupBy({
    by: ["outcomeId"],
    where: {
      marketId,
      shares: { gt: ZERO },
      outcomeId: { in: market.outcomes.map((o) => o.id) },
    },
    _sum: { shares: true },
  });

  const shareMap = new Map(grouped.map((row) => [row.outcomeId, row._sum.shares?.toString() ?? "0"]));

  console.log(
    JSON.stringify(
      {
        marketId: market.id,
        title: market.title,
        status: market.status,
        visibility: market.visibility,
        mechanism: market.mechanism,
        collateralUSDC: market.collateralUSDC.toString(),
        outcomes: market.outcomes.map((outcome) => ({
          outcomeId: outcome.id,
          name: outcome.name,
          outstandingShares: shareMap.get(outcome.id) ?? "0",
        })),
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
