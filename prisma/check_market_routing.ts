import { prisma } from "../src/lib/db";

async function main() {
  const grouped = await prisma.market.groupBy({
    by: ["visibility", "mechanism"],
    _count: { _all: true },
    orderBy: [{ visibility: "asc" }, { mechanism: "asc" }],
  });

  console.log("Market counts by visibility/mechanism");
  for (const row of grouped) {
    console.log(
      `${row.visibility} / ${row.mechanism}: ${row._count._all}`
    );
  }

  const invalid = await prisma.market.findMany({
    where: {
      mechanism: "POOL",
      visibility: "PUBLIC",
    },
    select: {
      id: true,
      title: true,
      kind: true,
      visibility: true,
      mechanism: true,
      status: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (invalid.length > 0) {
    console.warn("\nWARNING: Invalid market routing rows found");
    invalid.forEach((row) => {
      console.warn(
        `- ${row.id} | ${row.title} | ${row.visibility}/${row.mechanism} | kind=${row.kind} | status=${row.status}`
      );
    });
  } else {
    console.log("\nNo invalid market routing rows found.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
