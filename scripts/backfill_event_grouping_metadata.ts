/**
 * Backfill event grouping metadata for Polymarket-style grouped display.
 *
 * Adds `referenceGroup` to event metadata and `group` (with outcomeLabel)
 * to each child market's referenceMetadata.
 *
 * Usage:
 *   npx ts-node scripts/backfill_event_grouping_metadata.ts --apply --confirm BACKFILL_GROUP
 *
 * Dry-run (safe, no writes):
 *   npx ts-node scripts/backfill_event_grouping_metadata.ts
 */

import { prisma } from "../src/lib/db";

type GroupConfig = {
  eventSlug: string;
  groupTitle: string;
  groupSlug: string;
  groupType: string;
  resolutionMode: string;
  negativeRiskLike: boolean;
  expectedSumYesAround: number;
  outcomeLabelExtractor: (marketTitle: string) => string;
};

const GROUP_CONFIGS: GroupConfig[] = [
  {
    eventSlug: "world-cup-winner",
    groupTitle: "Winner",
    groupSlug: "winner",
    groupType: "MUTUALLY_EXCLUSIVE",
    resolutionMode: "ONE_WINNER",
    negativeRiskLike: true,
    expectedSumYesAround: 1,
    outcomeLabelExtractor: extractTeamLabel,
  },
  {
    eventSlug: "2026-nba-champion",
    groupTitle: "Winner",
    groupSlug: "winner",
    groupType: "MUTUALLY_EXCLUSIVE",
    resolutionMode: "ONE_WINNER",
    negativeRiskLike: true,
    expectedSumYesAround: 1,
    outcomeLabelExtractor: extractTeamLabel,
  },
];

function extractTeamLabel(title: string): string {
  // "Will Brazil win the 2026 FIFA World Cup?" → "Brazil"
  // "Will the New York Knicks win the 2026 NBA Finals?" → "New York Knicks"
  // "Will the San Antonio Spurs win the 2026 NBA Finals?" → "San Antonio Spurs"
  const match = title.match(/^Will\s+(?:the\s+)?(.+?)\s+win\b/i);
  return match?.[1]?.trim() || title.trim();
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const confirm = args.includes("--confirm")
    ? args[args.indexOf("--confirm") + 1] ?? ""
    : "";

  if (apply && confirm !== "BACKFILL_GROUP") {
    console.error(
      "ERROR: Live backfill requires --confirm BACKFILL_GROUP."
    );
    process.exit(1);
  }

  console.log(`Mode: ${apply ? "APPLY (live)" : "DRY-RUN (read-only)"}\n`);

  for (const config of GROUP_CONFIGS) {
    console.log(`=== Event: ${config.eventSlug} ===`);

    const event = await prisma.event.findUnique({
      where: { slug: config.eventSlug },
      select: { id: true, title: true, metadata: true },
    });

    if (!event) {
      console.log(`  SKIP: event not found\n`);
      continue;
    }

    const currentMeta =
      event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata)
        ? (event.metadata as Record<string, unknown>)
        : {};

    const hasExistingGroup =
      currentMeta.referenceGroup &&
      typeof currentMeta.referenceGroup === "object" &&
      !Array.isArray(currentMeta.referenceGroup);

    if (hasExistingGroup) {
      console.log(`  Event already has referenceGroup metadata.`);
    } else {
      const newMeta = {
        ...currentMeta,
        referenceGroup: {
          title: config.groupTitle,
          slug: config.groupSlug,
          groupType: config.groupType,
          resolutionMode: config.resolutionMode,
          source: "polymarket",
          externalSlug: event.title,
          expectedSumYesAround: config.expectedSumYesAround,
          negativeRiskLike: config.negativeRiskLike,
          note: "Backfilled for grouped event display.",
        },
      };

      if (apply) {
        await prisma.event.update({
          where: { id: event.id },
          data: { metadata: newMeta },
        });
        console.log(`  ✓ Added referenceGroup to event metadata.`);
      } else {
        console.log(`  [DRY-RUN] Would add referenceGroup to event metadata.`);
      }
    }

    // Process child markets
    const markets = await prisma.market.findMany({
      where: {
        eventId: event.id,
        isListed: true,
        visibility: "PUBLIC",
      },
      select: { id: true, title: true, referenceMetadata: true },
    });

    console.log(`  Child markets: ${markets.length}`);

    for (const market of markets) {
      const outcomeLabel = config.outcomeLabelExtractor(market.title);

      const currentRefMeta =
        market.referenceMetadata &&
        typeof market.referenceMetadata === "object" &&
        !Array.isArray(market.referenceMetadata)
          ? (market.referenceMetadata as Record<string, unknown>)
          : {};

      const existingGroup =
        currentRefMeta.group &&
        typeof currentRefMeta.group === "object" &&
        !Array.isArray(currentRefMeta.group)
          ? (currentRefMeta.group as Record<string, unknown>)
          : null;

      if (existingGroup?.outcomeLabel) {
        console.log(`    ${outcomeLabel}: already has group metadata.`);
      } else {
        const newRefMeta = {
          ...currentRefMeta,
          group: {
            title: config.groupTitle,
            slug: config.groupSlug,
            groupType: config.groupType,
            resolutionMode: config.resolutionMode,
            source: "polymarket",
            externalSlug: event.title,
            eventSlug: config.eventSlug,
            outcomeLabel,
            negativeRiskLike: config.negativeRiskLike,
            expectedSumYesAround: config.expectedSumYesAround,
          },
        };

        if (apply) {
          await prisma.market.update({
            where: { id: market.id },
            data: { referenceMetadata: newRefMeta },
          });
          console.log(`    ✓ ${outcomeLabel}: added group metadata.`);
        } else {
          console.log(`    [DRY-RUN] ${outcomeLabel}: would add group metadata.`);
        }
      }
    }

    console.log();
  }

  console.log(apply ? "Backfill complete (live)." : "Dry-run complete. Use --apply --confirm BACKFILL_GROUP to apply.");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
