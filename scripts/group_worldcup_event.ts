import { prisma } from "@/lib/db";

const EVENT_SLUG = "2026-fifa-world-cup-winner";
const EVENT_EXTERNAL_SLUG = "2026-fifa-world-cup-winner-595";

async function main() {
  const event = await prisma.event.findUnique({
    where: { slug: EVENT_SLUG },
    include: {
      markets: {
        where: { referenceSource: "polymarket" },
        select: {
          id: true,
          title: true,
          referenceMetadata: true,
        },
      },
    },
  });

  if (!event) {
    throw new Error(`Event ${EVENT_SLUG} not found.`);
  }

  const metadata =
    event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata)
      ? (event.metadata as Record<string, unknown>)
      : {};

  await prisma.event.update({
    where: { id: event.id },
    data: {
      metadata: {
        ...metadata,
        referenceGroup: {
          title: "Winner",
          slug: "winner",
          groupType: "MUTUALLY_EXCLUSIVE",
          resolutionMode: "ONE_WINNER",
          source: "polymarket",
          externalSlug: EVENT_EXTERNAL_SLUG,
          expectedSumYesAround: 1,
          negativeRiskLike: true,
          note: "Local engine uses grouped binary markets, not true negative-risk conversion.",
        },
      },
    },
  });

  let updatedCount = 0;
  for (const market of event.markets) {
    const current =
      market.referenceMetadata && typeof market.referenceMetadata === "object" && !Array.isArray(market.referenceMetadata)
        ? (market.referenceMetadata as Record<string, unknown>)
        : {};
    const existingGroup =
      current.group && typeof current.group === "object" && !Array.isArray(current.group)
        ? (current.group as Record<string, unknown>)
        : {};
    const titleMatch = market.title.match(/^Will\s+(.+?)\s+win\b/i);
    const outcomeLabel =
      typeof existingGroup.outcomeLabel === "string"
        ? existingGroup.outcomeLabel
        : titleMatch?.[1]?.trim() || market.title;

    await prisma.market.update({
      where: { id: market.id },
      data: {
        referenceMetadata: {
          ...current,
          group: {
            ...existingGroup,
            title: "Winner",
            slug: "winner",
            groupType: "MUTUALLY_EXCLUSIVE",
            resolutionMode: "ONE_WINNER",
            source: "polymarket",
            externalSlug: EVENT_EXTERNAL_SLUG,
            eventSlug: EVENT_SLUG,
            outcomeLabel,
            negativeRiskLike: true,
            expectedSumYesAround: 1,
          },
        },
      },
    });
    updatedCount += 1;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        eventId: event.id,
        eventSlug: EVENT_SLUG,
        externalSlug: EVENT_EXTERNAL_SLUG,
        updatedCount,
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
