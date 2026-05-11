import { prisma } from "@/lib/db";

async function main() {
  const event = await prisma.event.upsert({
    where: { slug: "sample-polymarket-structure-event" },
    update: {
      title: "Sample Polymarket Structure Event",
      description: "Dev-only sample event for Event -> Market -> Outcome manual testing.",
      category: "Demo",
      status: "ACTIVE",
      source: "local",
    },
    create: {
      slug: "sample-polymarket-structure-event",
      title: "Sample Polymarket Structure Event",
      description: "Dev-only sample event for Event -> Market -> Outcome manual testing.",
      category: "Demo",
      status: "ACTIVE",
      source: "local",
    },
  });

  const existingAttached = await prisma.market.findMany({
    where: { eventId: event.id },
    orderBy: [{ createdAt: "desc" }],
    select: { id: true, title: true },
    take: 3,
  });

  if (existingAttached.length >= 2) {
    console.log(
      JSON.stringify(
        {
          event: { id: event.id, slug: event.slug, title: event.title },
          attachedMarketIds: existingAttached.map((market) => market.id),
        },
        null,
        2,
      ),
    );
    return;
  }

  const markets = await prisma.market.findMany({
    where: { visibility: "PUBLIC", eventId: null },
    orderBy: [{ createdAt: "desc" }],
    take: 3,
    select: { id: true, title: true },
  });

  if (markets.length === 0) {
    console.log(JSON.stringify({ event, attachedMarketIds: [] }, null, 2));
    return;
  }

  await prisma.market.updateMany({
    where: { id: { in: markets.map((market) => market.id) } },
    data: { eventId: event.id },
  });

  console.log(
    JSON.stringify(
      {
        event: { id: event.id, slug: event.slug, title: event.title },
        attachedMarketIds: [...existingAttached.map((market) => market.id), ...markets.map((market) => market.id)],
      },
      null,
      2,
    ),
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
