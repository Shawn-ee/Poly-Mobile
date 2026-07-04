import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { fetchPolymarketEventBySlug } from "@/server/services/polymarketEventImport";
import { attachMobileLiveProviderIdentities } from "@/server/services/mobileLiveProviderIdentityAttach";
import { discoverMobileLiveProviderCandidates } from "@/server/services/mobileLiveProviderCandidates";
import { getMobileLiveProviderMappingReadiness } from "@/server/services/mobileLiveProviderMapping";
import { refreshMobileLiveProviderQuoteSnapshots } from "@/server/services/mobileLiveProviderRefresh";

const DEFAULT_PROVIDER_EVENT_SLUG = "fifwc-col-gha-2026-07-03";
const DEFAULT_LOCAL_EVENT_SLUG = "world-cup-2026-colombia-vs-ghana-2026-07-03";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-current-mobile-provider-sports-event-discovery-proof.json";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const providerEventSlug = args.providerEventSlug ?? DEFAULT_PROVIDER_EVENT_SLUG;
  const eventSlug = args.eventSlug ?? DEFAULT_LOCAL_EVENT_SLUG;
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;
  const providerEvent = await fetchPolymarketEventBySlug(providerEventSlug);
  const providerMarkets = providerEvent.markets
    .filter((market) => market.active && !market.closed && !market.archived)
    .filter((market) => market.outcomes.length === 2 && market.clobTokenIds.length === 2)
    .slice(0, 6);

  if (providerMarkets.length < 2) {
    throw new Error(`Provider event ${providerEventSlug} exposed fewer than 2 attachable markets.`);
  }

  const prepared = await prepareLocalProviderEvent({
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
    providerEventSlugs: [providerEventSlug],
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

  const summary = {
    generatedAt: new Date().toISOString(),
    eventSlug,
    providerEventSlug,
    providerEventTitle: providerEvent.title,
    providerSource: "gamma-api.polymarket.com/events?slug",
    prepared,
    before: summarizeReadiness(before),
    discovery: {
      providerSearchMode: discovery.providerSearchMode,
      targetMarketCount: discovery.targetMarketCount,
      attachReadyCandidateCount: discovery.attachReadyCandidateCount,
      providerErrorCount: discovery.providerErrorCount,
      nextRequiredAction: discovery.nextRequiredAction,
      targets: discovery.targets.map((target) => ({
        marketId: target.marketId,
        title: target.title,
        candidateCount: target.candidateCount,
        attachReady: target.attachProposal?.attachReady ?? false,
        bestCandidate: target.bestCandidate
          ? {
              slug: target.bestCandidate.slug,
              question: target.bestCandidate.question,
              eventTitle: target.bestCandidate.eventTitle,
              score: target.bestCandidate.score,
              attachReadiness: target.bestCandidate.attachReadiness,
            }
          : null,
      })),
    },
    attach: {
      applied: attach.applied,
      validation: attach.validation,
    },
    after: summarizeReadiness(after),
    refresh: {
      providerMappedMarketCount: refresh.providerMappedMarketCount,
      unsupportedMarketCount: refresh.unsupportedMarketCount,
      snapshotsUpdated: refresh.provider.snapshotsUpdated,
      refreshedCount: refresh.provider.refreshedCount,
      skippedCount: refresh.provider.skippedCount,
      depthRowsUpdated: refresh.providerDepth.depthRowsUpdated,
      postRefresh: refresh.postRefresh,
      contractProofFallback: refresh.contractProofFallback,
    },
    pass:
      prepared.marketCount >= 2 &&
      discovery.providerErrorCount === 0 &&
      discovery.attachReadyCandidateCount >= 2 &&
      mappings.length >= 2 &&
      attach.applied === true &&
      after.providerRefreshableMarketCount >= 2 &&
      refresh.providerMappedMarketCount >= 2 &&
      refresh.provider.snapshotsUpdated >= 2 &&
      refresh.contractProofFallback == null,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

async function prepareLocalProviderEvent(params: {
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
        rulesText: "Provider-shaped World Cup live market for Holiwyn mobile parity proof.",
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
    cycle: "CW",
    providerEventSlug,
    mobileLiveDetail: {
      liveDataStatus: {
        source: "polymarket-gamma",
        status: "ready",
        lastUpdated: now.toISOString(),
        reason: "Cycle CW provider discovery proof event is backed by exact Polymarket sports event slug.",
      },
      liveStats: [
        { label: "Possession", home: "54%", away: "46%" },
        { label: "Shots", home: "8", away: "5" },
      ],
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
