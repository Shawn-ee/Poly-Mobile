import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { prisma } from "../src/lib/db";
import { buildTicketSelectionMetadata } from "../src/server/services/ticketSelectionMetadata";

const HARNESS_DIR = join(process.cwd(), "docs", "mobile", "harness");
const OUTPUT_PATH = join(HARNESS_DIR, "cycle-current-mobile-provider-token-lifecycle.json");

async function main() {
  const market = await prisma.market.findFirst({
    where: {
      referenceSource: "polymarket",
      externalMarketId: { not: null },
      conditionId: { not: null },
      event: {
        slug: "world-cup-2026-colombia-vs-ghana-2026-07-03",
      },
    },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    include: {
      event: true,
      outcomes: {
        where: { isActive: true, referenceTokenId: { not: null } },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  const outcome = market?.outcomes[0] ?? null;
  const selection = market && outcome
    ? buildTicketSelectionMetadata({
        requestBody: {
          selection: {
            marketType: market.marketType,
            marketId: market.id,
            outcomeId: outcome.id,
            marketGroupId: market.marketGroupKey ?? undefined,
            line: market.line?.toString(),
            period: market.period ?? undefined,
            side: outcome.side ?? undefined,
            displayLabel: outcome.label ?? outcome.name,
            contractSide: "yes",
            referenceSource: market.referenceSource,
            externalSlug: market.externalSlug,
            externalMarketId: market.externalMarketId,
            conditionId: market.conditionId,
            referenceTokenId: outcome.referenceTokenId,
            referenceOutcomeLabel: outcome.referenceOutcomeLabel ?? outcome.name,
          },
        },
        market,
        outcome,
      })
    : null;

  const requiredFields = [
    selection?.marketId,
    selection?.outcomeId,
    selection?.referenceSource,
    selection?.externalMarketId,
    selection?.conditionId,
    selection?.referenceTokenId,
  ];
  const pass = Boolean(market && outcome && selection && requiredFields.every((field) => typeof field === "string" && field.length > 0));

  const summary = {
    pass,
    cycle: "DM",
    proof: "provider-token-lifecycle",
    generatedAt: new Date().toISOString(),
    event: market?.event
      ? {
          id: market.event.id,
          slug: market.event.slug,
          title: market.event.title,
        }
      : null,
    market: market
      ? {
          id: market.id,
          title: market.title,
          referenceSource: market.referenceSource,
          externalSlug: market.externalSlug,
          externalMarketId: market.externalMarketId,
          conditionId: market.conditionId,
          marketType: market.marketType,
          marketGroupId: market.marketGroupKey,
          line: market.line?.toString() ?? null,
          period: market.period,
        }
      : null,
    outcome: outcome
      ? {
          id: outcome.id,
          name: outcome.name,
          label: outcome.label,
          side: outcome.side,
          referenceTokenId: outcome.referenceTokenId,
          referenceOutcomeLabel: outcome.referenceOutcomeLabel,
        }
      : null,
    selection,
    checks: {
      missingOpticOddsDoesNotBlock: !process.env.OPTIC_ODDS_API_KEY,
      hasPolymarketMarket: Boolean(market),
      hasProviderOutcomeToken: Boolean(outcome?.referenceTokenId),
      selectionPreservesProviderMarket: selection?.externalMarketId === market?.externalMarketId,
      selectionPreservesCondition: selection?.conditionId === market?.conditionId,
      selectionPreservesProviderToken: selection?.referenceTokenId === outcome?.referenceTokenId,
    },
  };

  mkdirSync(HARNESS_DIR, { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(summary, null, 2)}\n`);
  if (!pass) {
    throw new Error(`Provider token lifecycle proof failed. See ${OUTPUT_PATH}`);
  }
  console.log(`Provider token lifecycle proof passed: ${OUTPUT_PATH}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
