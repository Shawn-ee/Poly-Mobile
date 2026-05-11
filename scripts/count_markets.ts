import { prisma } from "@/lib/db";

async function main() {
  const total = await prisma.market.count();
  const soak = await prisma.market.count({ where: { title: { startsWith: "HTTP Soak Market" } } });
  const live = await prisma.market.count({ where: { status: "LIVE" } });
  const liveSoak = await prisma.market.count({
    where: { title: { startsWith: "HTTP Soak Market" }, status: "LIVE" },
  });

  console.log(JSON.stringify({ total, soak, live, liveSoak }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
