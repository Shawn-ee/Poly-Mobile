import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { selectCompactLiveMarkets } from "@/server/services/mobileLiveEventDetail";
import { extractProviderFixtureMetadataFromEventMetadata } from "@/server/services/mobileLiveProviderFixtureMetadata";
import {
  reviewMobileLiveLineProviderIdentities,
  summarizeLineProviderIdentityReadiness,
  type LineProviderMarketReviewInput,
} from "@/server/services/mobileLiveLineProviderIdentityReview";

const DEFAULT_EVENT_SLUG = "world-cup-2026-colombia-vs-ghana-2026-07-03";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-current-mobile-line-provider-identity-review.json";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const eventSlug = args.eventSlug ?? DEFAULT_EVENT_SLUG;
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;
  const event = await prisma.event.findFirst({
    where: { slug: eventSlug },
    include: {
      markets: {
        where: { status: "LIVE", visibility: "PUBLIC", mechanism: "ORDERBOOK" },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        include: {
          outcomes: {
            where: { isActive: true },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });
  if (!event) throw new Error(`No live event found for ${eventSlug}.`);

  const providerFixture = extractProviderFixtureMetadataFromEventMetadata(event.metadata);
  if (!providerFixture?.opticOddsFixtureId) {
    throw new Error(`Event ${eventSlug} is missing provider fixture metadata.`);
  }
  const compactMarkets = selectCompactLiveMarkets(event.markets);
  const initialReadiness = summarizeLineProviderIdentityReadiness(compactMarkets);
  const lineMarkets = compactMarkets.filter((market) => ["spread", "total_goals", "totals", "team_total_goals"].includes(market.marketType));
  if (lineMarkets.length === 0) throw new Error(`Event ${eventSlug} has no compact line markets to review.`);

  const goodReviews = lineMarkets.map((market) => buildReview({
    providerFixture,
    market,
    providerMarketId: providerMarketIdForLocalType(market.marketType),
    points: market.line == null ? null : Math.abs(Number(market.line)),
  }));
  const badReviews = [{
    ...goodReviews[0],
    providerMarketId: "moneyline",
    points: (goodReviews[0].points ?? 0) + 1,
    outcomes: goodReviews[0].outcomes.slice(0, 1),
  }];

  const goodDryRun = await reviewMobileLiveLineProviderIdentities({
    eventSlug,
    dryRun: true,
    reviews: goodReviews,
  });
  const badDryRun = await reviewMobileLiveLineProviderIdentities({
    eventSlug,
    dryRun: true,
    reviews: badReviews,
  });
  const finalReadiness = summarizeLineProviderIdentityReadiness(compactMarkets);
  const summary = {
    generatedAt: new Date().toISOString(),
    eventSlug,
    providerEventSlug: providerFixture.providerEventSlug,
    opticOddsFixtureId: providerFixture.opticOddsFixtureId,
    mode: "line-provider-identity-review-dry-run",
    lineMarketCount: lineMarkets.length,
    reviewedMarketCount: goodReviews.length,
    initialReadiness,
    goodDryRun: {
      applied: goodDryRun.applied,
      blocked: goodDryRun.blocked,
      validation: goodDryRun.validation,
      before: goodDryRun.before,
      after: goodDryRun.after,
      nextRequiredAction: goodDryRun.nextRequiredAction,
    },
    badDryRun: {
      applied: badDryRun.applied,
      blocked: badDryRun.blocked,
      validation: badDryRun.validation,
      blockReason: badDryRun.blockReason,
      nextRequiredAction: badDryRun.nextRequiredAction,
    },
    finalReadiness,
    mutatedDatabase: JSON.stringify(initialReadiness) !== JSON.stringify(finalReadiness),
    pass:
      goodDryRun.applied === false &&
      goodDryRun.blocked === false &&
      goodDryRun.validation.valid === true &&
      goodDryRun.after?.lineProviderReadyMarketCount === lineMarkets.length &&
      badDryRun.blocked === true &&
      badDryRun.validation.valid === false &&
      JSON.stringify(initialReadiness) === JSON.stringify(finalReadiness),
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

function buildReview(params: {
  providerFixture: NonNullable<ReturnType<typeof extractProviderFixtureMetadataFromEventMetadata>>;
  market: {
    id: string;
    title: string;
    marketType: string;
    line: unknown;
    period: string | null;
    outcomes: Array<{ id: string; name: string; label: string | null; side: string | null }>;
  };
  providerMarketId: string;
  points: number | null;
}): LineProviderMarketReviewInput {
  return {
    marketId: params.market.id,
    providerSource: "optic_odds",
    fixtureId: params.providerFixture.opticOddsFixtureId ?? "",
    gameId: params.providerFixture.opticOddsGameId,
    sportsbook: "BetMGM",
    providerMarketId: params.providerMarketId,
    providerMarketName: params.providerMarketId,
    points: params.points,
    period: params.market.period,
    outcomes: params.market.outcomes.map((outcome) => ({
      outcomeId: outcome.id,
      providerOddId: `${params.providerFixture.opticOddsFixtureId}:${params.providerMarketId}:${params.market.id}:${outcome.id}`,
      selection: outcome.label ?? outcome.name,
      selectionLine: outcome.side,
      teamId: outcome.side === "away" ? "optic-away-contract" : outcome.side === "home" ? "optic-home-contract" : null,
    })),
  };
}

function providerMarketIdForLocalType(marketType: string) {
  if (marketType === "spread") return "point_spread";
  if (marketType === "team_total_goals") return "team_total_goals";
  return "total_goals";
}

function parseArgs(args: string[]) {
  const parsed: Record<string, string> = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) continue;
    const [key, inlineValue] = arg.replace(/^--/, "").split("=");
    const nextValue = args[index + 1];
    const value = inlineValue ?? (nextValue && !nextValue.startsWith("--") ? nextValue : undefined);
    if (key && value) {
      parsed[key] = value;
      if (!inlineValue) index += 1;
    }
  }
  return parsed;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
