import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { fetchPolymarketEventBySlug } from "@/server/services/polymarketEventImport";
import { reviewMobileLiveProviderBulkSlugMappings } from "@/server/services/mobileLiveProviderBulkSlugReview";
import { getMobileLiveProviderMappingReadiness } from "@/server/services/mobileLiveProviderMapping";

const DEFAULT_PROVIDER_EVENT_SLUG = "fifwc-col-gha-2026-07-03";
const DEFAULT_LOCAL_EVENT_SLUG = "world-cup-2026-colombia-vs-ghana-2026-07-03";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-current-mobile-provider-bulk-review-apply-workflow.json";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const providerEventSlug = args.providerEventSlug ?? DEFAULT_PROVIDER_EVENT_SLUG;
  const eventSlug = args.eventSlug ?? DEFAULT_LOCAL_EVENT_SLUG;
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;

  const providerEvent = await fetchPolymarketEventBySlug(providerEventSlug);
  const providerMarkets = providerEvent.markets
    .filter((market) => market.active && !market.closed && !market.archived)
    .filter((market) => market.outcomes.length === 2 && market.clobTokenIds.length === 2)
    .slice(0, 3);
  if (providerMarkets.length < 3) {
    throw new Error(`Provider event ${providerEventSlug} exposed fewer than 3 attachable markets.`);
  }

  const prepared = await prepareLocalEvent({
    eventSlug,
    providerEventSlug,
    title: providerEvent.title,
    description: providerEvent.description,
    image: providerEvent.image,
    markets: providerMarkets,
  });
  const before = await getMobileLiveProviderMappingReadiness(eventSlug);

  const validReviews = [
    { marketId: prepared.matchWinnerMarkets.colombia.id, slugs: [`${providerEventSlug}-col`] },
    { marketId: prepared.matchWinnerMarkets.draw.id, slugs: [`${providerEventSlug}-draw`] },
    { marketId: prepared.matchWinnerMarkets.ghana.id, slugs: [`${providerEventSlug}-gha`] },
  ];
  const mixedReviews = [
    ...validReviews,
    { marketId: prepared.lineMarket.id, slugs: [`${providerEventSlug}-col`] },
  ];

  const blocked = await reviewMobileLiveProviderBulkSlugMappings({
    eventSlug,
    dryRun: false,
    confirmApply: true,
    reviews: mixedReviews,
  });
  const afterBlocked = await getMobileLiveProviderMappingReadiness(eventSlug);
  const dryRun = await reviewMobileLiveProviderBulkSlugMappings({
    eventSlug,
    dryRun: true,
    confirmApply: false,
    reviews: validReviews,
  });
  const apply = await reviewMobileLiveProviderBulkSlugMappings({
    eventSlug,
    dryRun: false,
    confirmApply: true,
    reviews: validReviews,
  });
  const afterApply = await getMobileLiveProviderMappingReadiness(eventSlug);

  const summary = {
    generatedAt: new Date().toISOString(),
    eventSlug,
    providerEventSlug,
    providerEventTitle: providerEvent.title,
    prepared,
    before: summarizeReadiness(before),
    blocked: summarizeWorkflow(blocked),
    afterBlocked: summarizeReadiness(afterBlocked),
    dryRun: summarizeWorkflow(dryRun),
    apply: summarizeWorkflow(apply),
    afterApply: summarizeReadiness(afterApply),
    pass:
      before.providerRefreshableMarketCount === 0 &&
      blocked.blocked === true &&
      blocked.applied === false &&
      blocked.attach == null &&
      afterBlocked.providerRefreshableMarketCount === 0 &&
      dryRun.blocked === false &&
      dryRun.applied === false &&
      dryRun.attach?.dryRun === true &&
      dryRun.preview.attachReadyReviewCount === 3 &&
      apply.blocked === false &&
      apply.applied === true &&
      apply.attach?.applied === true &&
      afterApply.providerRefreshableMarketCount >= 3 &&
      afterApply.providerRefreshableOutcomeCount >= 6,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

async function prepareLocalEvent(params: {
  eventSlug: string;
  providerEventSlug: string;
  title: string;
  description: string | null;
  image: string | null;
  markets: Awaited<ReturnType<typeof fetchPolymarketEventBySlug>>["markets"];
}) {
  const now = new Date();
  const event = await prisma.event.upsert({
    where: { slug: params.eventSlug },
    create: {
      slug: params.eventSlug,
      title: params.title,
      description: params.description,
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "Colombia",
      awayTeamName: "Ghana",
      status: "live",
      liveStatus: "LIVE",
      period: "Live",
      clock: "80:00",
      homeScore: 0,
      awayScore: 0,
      source: "polymarket",
      externalSlug: params.providerEventSlug,
      imageUrl: params.image,
      sourceUpdatedAt: now,
      metadata: {
        cycle: "DE",
        providerEventSlug: params.providerEventSlug,
      },
    },
    update: {
      title: params.title,
      description: params.description,
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "Colombia",
      awayTeamName: "Ghana",
      status: "live",
      liveStatus: "LIVE",
      period: "Live",
      clock: "80:00",
      homeScore: 0,
      awayScore: 0,
      source: "polymarket",
      externalSlug: params.providerEventSlug,
      imageUrl: params.image,
      sourceUpdatedAt: now,
    },
  });

  const matchWinnerMarkets: Record<string, { id: string; slug: string; title: string }> = {};
  for (const [index, providerMarket] of params.markets.entries()) {
    const marketSlug = `${params.eventSlug}-${providerMarket.slug}`;
    const market = await prisma.market.upsert({
      where: { slug: marketSlug },
      create: {
        slug: marketSlug,
        title: providerMarket.question,
        description: params.description ?? providerMarket.question,
        categoryLegacy: "sports",
        type: "BINARY",
        marketType: "moneyline",
        marketGroupKey: "main",
        marketGroupTitle: "Game Lines",
        displayOrder: index,
        status: "LIVE",
        eventId: event.id,
        visibility: "PUBLIC",
        mechanism: "ORDERBOOK",
        isListed: true,
        referenceSource: null,
        externalSlug: null,
        externalMarketId: null,
        conditionId: null,
        rulesText: "Provider-shaped World Cup live market for Holiwyn mobile bulk review apply proof.",
        sourceUpdatedAt: now,
      },
      update: {
        title: providerMarket.question,
        description: params.description ?? providerMarket.question,
        type: "BINARY",
        marketType: "moneyline",
        marketGroupKey: "main",
        marketGroupTitle: "Game Lines",
        displayOrder: index,
        status: "LIVE",
        eventId: event.id,
        visibility: "PUBLIC",
        mechanism: "ORDERBOOK",
        isListed: true,
        referenceSource: null,
        externalSlug: null,
        externalMarketId: null,
        conditionId: null,
        sourceUpdatedAt: now,
      },
    });
    await upsertOutcomes(market.id, marketSlug, yesNoOutcomes());
    const marketSummary = { id: market.id, slug: market.slug, title: market.title };
    if (providerMarket.slug.endsWith("-col")) matchWinnerMarkets.colombia = marketSummary;
    if (providerMarket.slug.endsWith("-draw")) matchWinnerMarkets.draw = marketSummary;
    if (providerMarket.slug.endsWith("-gha")) matchWinnerMarkets.ghana = marketSummary;
  }

  const lineMarketSlug = `${params.eventSlug}-bulk-apply-total-goals-25`;
  const lineMarket = await prisma.market.upsert({
    where: { slug: lineMarketSlug },
    create: {
      slug: lineMarketSlug,
      title: "Colombia vs Ghana total goals 2.5",
      description: "Bulk apply guard target. A match-winner slug must not satisfy this totals market.",
      categoryLegacy: "sports",
      type: "BINARY",
      marketType: "total_goals",
      marketGroupKey: "totals",
      marketGroupTitle: "Totals",
      displayOrder: 50,
      status: "LIVE",
      eventId: event.id,
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      isListed: true,
      referenceSource: null,
      externalSlug: null,
      externalMarketId: null,
      conditionId: null,
      line: "2.5",
      unit: "goals",
      rulesText: "Bulk apply guard target. Wrong-family slugs must be rejected.",
      sourceUpdatedAt: now,
    },
    update: {
      title: "Colombia vs Ghana total goals 2.5",
      description: "Bulk apply guard target. A match-winner slug must not satisfy this totals market.",
      marketType: "total_goals",
      marketGroupKey: "totals",
      marketGroupTitle: "Totals",
      displayOrder: 50,
      status: "LIVE",
      eventId: event.id,
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      isListed: true,
      referenceSource: null,
      externalSlug: null,
      externalMarketId: null,
      conditionId: null,
      line: "2.5",
      unit: "goals",
      sourceUpdatedAt: now,
    },
  });
  await upsertOutcomes(lineMarket.id, lineMarketSlug, [
    { code: "OVER", name: "Over 2.5", side: "over", displayOrder: 0 },
    { code: "UNDER", name: "Under 2.5", side: "under", displayOrder: 1 },
  ]);

  return {
    eventId: event.id,
    eventSlug: event.slug,
    matchWinnerMarkets,
    lineMarket: { id: lineMarket.id, slug: lineMarket.slug, title: lineMarket.title },
  };
}

async function upsertOutcomes(
  marketId: string,
  marketSlug: string,
  labels: Array<{ code: string; name: string; side: string; displayOrder: number }>,
) {
  const activeOutcomeIds = [];
  for (const label of labels) {
    const existing = await prisma.outcome.findFirst({ where: { marketId, code: label.code } });
    const data = {
      name: label.name,
      label: label.name,
      side: label.side,
      displayOrder: label.displayOrder,
      isActive: true,
      isTradable: true,
      referenceTokenId: null,
      referenceOutcomeLabel: null,
      referenceMetadata: null,
    };
    const outcome = existing
      ? await prisma.outcome.update({ where: { id: existing.id }, data })
      : await prisma.outcome.create({
          data: {
            marketId,
            code: label.code,
            slug: `${marketSlug}-${label.code.toLowerCase()}`,
            ...data,
          },
        });
    activeOutcomeIds.push(outcome.id);
  }
  await prisma.outcome.updateMany({
    where: { marketId, id: { notIn: activeOutcomeIds } },
    data: { isActive: false },
  });
}

function summarizeWorkflow(result: Awaited<ReturnType<typeof reviewMobileLiveProviderBulkSlugMappings>>) {
  return {
    mode: result.mode,
    dryRun: result.dryRun,
    applied: result.applied,
    blocked: result.blocked,
    blockReason: result.blockReason,
    nextRequiredAction: result.nextRequiredAction,
    preview: {
      reviewCount: result.preview.reviewCount,
      attachReadyReviewCount: result.preview.attachReadyReviewCount,
      candidateCount: result.preview.candidateCount,
      attachReadyCandidateCount: result.preview.attachReadyCandidateCount,
      mappingCount: result.preview.mappings.length,
      failedReviews: result.preview.results
        .filter((item) => item.attachProposal?.attachReady !== true)
        .map((item) => ({
          marketId: item.marketId,
          title: item.title,
          requestedSlugs: item.requestedSlugs,
          reasons: item.bestCandidate?.attachReadiness.reasons ?? [],
        })),
    },
    attach: result.attach
      ? {
          dryRun: result.attach.dryRun,
          applied: result.attach.applied,
          validation: result.attach.validation,
        }
      : null,
  };
}

function summarizeReadiness(readiness: Awaited<ReturnType<typeof getMobileLiveProviderMappingReadiness>>) {
  return {
    compactMarketCount: readiness.compactMarketCount,
    providerRefreshableMarketCount: readiness.providerRefreshableMarketCount,
    providerRefreshableOutcomeCount: readiness.providerRefreshableOutcomeCount,
    missingExternalSlugMarketCount: readiness.missingExternalSlugMarketCount,
    missingExternalMarketIdMarketCount: readiness.missingExternalMarketIdMarketCount,
    missingConditionIdMarketCount: readiness.missingConditionIdMarketCount,
    missingOutcomeTokenMarketCount: readiness.missingOutcomeTokenMarketCount,
    isProviderRefreshReady: readiness.isProviderRefreshReady,
    nextRequiredAction: readiness.nextRequiredAction,
  };
}

function yesNoOutcomes() {
  return [
    { code: "YES", name: "Yes", side: "yes", displayOrder: 0 },
    { code: "NO", name: "No", side: "no", displayOrder: 1 },
  ];
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (!part.startsWith("--")) continue;
    const key = part.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

main()
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
