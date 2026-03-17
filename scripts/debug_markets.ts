import { prisma } from "@/lib/db";

async function main() {
  const total = await prisma.market.count();

  const [byStatus, byMechanism, byVisibility, firstMarkets] = await Promise.all([
    prisma.market.groupBy({
      by: ["status"],
      _count: { _all: true },
      orderBy: { status: "asc" },
    }),
    prisma.market.groupBy({
      by: ["mechanism"],
      _count: { _all: true },
      orderBy: { mechanism: "asc" },
    }),
    prisma.market.groupBy({
      by: ["visibility"],
      _count: { _all: true },
      orderBy: { visibility: "asc" },
    }),
    prisma.market.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        mechanism: true,
        visibility: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  console.info(`Markets total: ${total}`);
  console.info("Status:");
  if (byStatus.length === 0) console.info("  (none)");
  for (const row of byStatus) {
    console.info(`  ${row.status}: ${row._count._all}`);
  }

  console.info("Mechanism:");
  if (byMechanism.length === 0) console.info("  (none)");
  for (const row of byMechanism) {
    console.info(`  ${row.mechanism}: ${row._count._all}`);
  }

  console.info("Visibility:");
  if (byVisibility.length === 0) console.info("  (none)");
  for (const row of byVisibility) {
    console.info(`  ${row.visibility}: ${row._count._all}`);
  }

  console.info("First markets (latest 10):");
  if (firstMarkets.length === 0) {
    console.info("  (none)");
  } else {
    for (const m of firstMarkets) {
      console.info(
        `  ${m.id} | ${m.title} | ${m.status} | ${m.mechanism} | ${m.visibility} | ${m.createdAt.toISOString()}`
      );
    }
  }
}

main()
  .catch((error) => {
    console.error("[debug:markets] fatal", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
