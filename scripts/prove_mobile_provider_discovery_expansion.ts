import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { fetchPolymarketEventBySlug } from "@/server/services/polymarketEventImport";
import { attachMobileLiveProviderIdentities } from "@/server/services/mobileLiveProviderIdentityAttach";
import {
  buildProviderCandidateSearchQueries,
  discoverMobileLiveProviderCandidates,
} from "@/server/services/mobileLiveProviderCandidates";
import { getMobileLiveProviderMappingReadiness } from "@/server/services/mobileLiveProviderMapping";
import { refreshMobileLiveProviderQuoteSnapshots } from "@/server/services/mobileLiveProviderRefresh";

const DEFAULT_PROVIDER_EVENT_SLUG = "fifwc-col-gha-2026-07-03";
const DEFAULT_LOCAL_EVENT_SLUG = "world-cup-2026-colombia-vs-ghana-2026-07-03";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-current-mobile-provider-discovery-expansion.json";

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
  const discovery = await discoverMobileLiveProviderCandidates({
    eventSlug,
    providerSearchMode: "sports-events",
    maxCandidatesPerMarket: 6,
  });
  const mappings = discovery.targets
    .map((target) => target.attachProposal?.mapping ?? null)
    .filter((mapping): mapping is NonNullable<typeof mapping> => Boolean(mapping));
  const attach = await attachMobileLiveProviderIdentities({
    eventSlug,
    dryRun: false,
    confirmApply: true,
    mappings,
  });
  const after = await getMobileLiveProviderMappingReadiness(eventSlug);
  const refresh = await refreshMobileLiveProviderQuoteSnapshots({
    eventSlug,
    allowContractProofFallback: false,
  });

  const searchQuerySamples = prepared.markets.map((market) => ({
    title: market.title,
    queries: buildProviderCandidateSearchQueries({
      id: market.id,
      title: market.title,
      marketType: "moneyline",
      period: null,
      line: null,
      unit: null,
      marketGroupKey: "main",
      marketGroupTitle: "Game Lines",
      outcomes: [
        { id: `${market.id}-yes`, name: "Yes", side: "yes", displayOrder: 0, referenceOutcomeLabel: "Yes" },
        { id: `${market.id}-no`, name: "No", side: "no", displayOrder: 1, referenceOutcomeLabel: "No" },
      ],
    }),
  }));

  const expectedFallbacks = [
    `${providerEventSlug}-col`,
    `${providerEventSlug}-draw`,
    `${providerEventSlug}-gha`,
  ];
  const targetSummaries = discovery.targets.map((target) => ({
    marketId: target.marketId,
    title: target.title,
    expectedProviderFamily: target.expectedProviderFamily,
    candidateCount: target.candidateCount,
    attachReady: target.attachProposal?.attachReady ?? false,
    bestCandidate: target.bestCandidate
      ? {
          slug: target.bestCandidate.slug,
          question: target.bestCandidate.question,
          family: target.bestCandidate.attachReadiness.candidateFamily,
          reasons: target.bestCandidate.attachReadiness.reasons,
          relevance: target.bestCandidate.attachReadiness.relevance,
        }
      : null,
  }));

  const summary = {
    generatedAt: new Date().toISOString(),
    eventSlug,
    providerEventSlug,
    providerEventTitle: providerEvent.title,
    providerSource: "gamma-api.polymarket.com/events?slug plus exact slug fallback",
    prepared,
    before: summarizeReadiness(before),
    discovery: {
      providerSearchMode: discovery.providerSearchMode,
      providerEventSlugs: discovery.providerEventSlugs,
      providerEventSlugSource: discovery.providerEventSlugSource,
      manualSlugFallbacks: discovery.manualSlugFallbacks,
      manualSlugFallbackCandidateCount: discovery.manualSlugFallbackCandidateCount,
      providerCandidateFamilySummary: discovery.providerCandidateFamilySummary,
      targetMarketCount: discovery.targetMarketCount,
      attachReadyCandidateCount: discovery.attachReadyCandidateCount,
      providerErrorCount: discovery.providerErrorCount,
      nextRequiredAction: discovery.nextRequiredAction,
      targets: targetSummaries,
    },
    searchQuerySamples,
    attach: {
      applied: attach.applied,
      validation: attach.validation,
    },
    after: summarizeReadiness(after),
    refresh: {
      providerMappedMarketCount: refresh.providerMappedMarketCount,
      snapshotsUpdated: refresh.provider.snapshotsUpdated,
      refreshedCount: refresh.provider.refreshedCount,
      depthRowsUpdated: refresh.providerDepth.depthRowsUpdated,
      contractProofFallback: refresh.contractProofFallback,
      postRefresh: refresh.postRefresh,
    },
    pass:
      prepared.marketCount >= 3 &&
      expectedFallbacks.every((slug) => discovery.manualSlugFallbacks.includes(slug)) &&
      discovery.manualSlugFallbackCandidateCount >= 3 &&
      discovery.attachReadyCandidateCount >= 3 &&
      discovery.providerErrorCount === 0 &&
      mappings.length >= 3 &&
      attach.applied === true &&
      after.providerRefreshableMarketCount >= 3 &&
      refresh.providerMappedMarketCount >= 3 &&
      refresh.provider.snapshotsUpdated >= 3 &&
      refresh.contractProofFallback == null,
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
      metadata: eventMetadata(params.providerEventSlug, now),
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
      metadata: eventMetadata(params.providerEventSlug, now),
    },
  });

  const localMarkets = [];
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
        rulesText: "Provider-shaped World Cup live market for Holiwyn mobile discovery proof.",
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
    await upsertBinaryOutcomes(market.id, marketSlug);
    localMarkets.push({ id: market.id, slug: market.slug, title: market.title });
  }
  return {
    eventId: event.id,
    eventSlug: event.slug,
    marketCount: localMarkets.length,
    markets: localMarkets,
  };
}

async function upsertBinaryOutcomes(marketId: string, marketSlug: string) {
  const labels = [
    { code: "YES", name: "Yes", side: "yes", displayOrder: 0 },
    { code: "NO", name: "No", side: "no", displayOrder: 1 },
  ];
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

function eventMetadata(providerEventSlug: string, now: Date) {
  return {
    cycle: "DA",
    providerEventSlug,
    mobileLiveDetail: {
      liveDataStatus: {
        source: "polymarket-gamma",
        status: "ready",
        lastUpdated: now.toISOString(),
        reason: "Cycle DA provider discovery expansion proof uses exact sports event plus exact slug fallback.",
      },
    },
  };
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
