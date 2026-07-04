import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { upsertReferenceOrderbookDepthSnapshots } from "@/server/services/referenceOrderbookDepthSnapshots";

const DEFAULT_EVENT_SLUG = "cycle-dw-a-world-cup-provider-orderbook-state";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-DW-A-provider-orderbook-state-matrix.json";
const DEFAULT_BASE_URL = "http://127.0.0.1:3002";
const DEPTH_SOURCE = "polymarket-clob-dw-state-matrix";
type JsonObject = Record<string, unknown>;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const eventSlug = args.eventSlug ?? DEFAULT_EVENT_SLUG;
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;
  const baseUrl = (args.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const { event, market, outcomes } = await upsertProofMarket(eventSlug);

  await clearRouteDepthInputs(market.id);

  const unavailableBody = await callBookRoute(baseUrl, market.id);
  const unavailable = summarizeRouteBody(unavailableBody);

  const staleFetchedAt = new Date(Date.now() - 5 * 60 * 1000);
  const staleRows = depthRows(market, outcomes, staleFetchedAt);
  const staleUpserted = await upsertReferenceOrderbookDepthSnapshots(staleRows);
  const staleBody = await callBookRoute(baseUrl, market.id);
  const stale = summarizeRouteBody(staleBody);

  const readyFetchedAt = new Date();
  const readyRows = depthRows(market, outcomes, readyFetchedAt);
  const readyUpserted = await upsertReferenceOrderbookDepthSnapshots(readyRows);
  const readyBody = await callBookRoute(baseUrl, market.id);
  const ready = summarizeRouteBody(readyBody);

  const expectedOutcomeIds = new Set(outcomes.map((outcome) => outcome.id));
  const expectedSelectorKey = "totals:regulation:2.5";
  const readyRowsUseExpectedOutcomes = ready.visibleMobileFields.levels.every((level) =>
    expectedOutcomeIds.has(level.outcomeId) &&
    (level.side === "bid" || level.side === "ask") &&
    level.price > 0 &&
    level.shares > 0 &&
    level.value > 0);

  const pass =
    unavailable.depthSource === "empty" &&
    unavailable.emptyState === "no-depth" &&
    unavailable.providerOrderbookDepth?.status === "unavailable" &&
    unavailable.providerQuoteDepth?.levelCount === 0 &&
    stale.depthSource === "provider-orderbook-depth" &&
    stale.providerOrderbookDepth?.status === "stale" &&
    stale.providerOrderbookDepth?.reason?.includes("older than") &&
    ready.depthSource === "provider-orderbook-depth" &&
    ready.availability?.status === "ready" &&
    ready.providerOrderbookDepth?.status === "ready" &&
    ready.providerOrderbookDepth?.sources.includes(DEPTH_SOURCE) &&
    ready.marketIdentity?.selectorKey === expectedSelectorKey &&
    ready.marketIdentity?.period === "regulation" &&
    ready.marketIdentity?.line === "2.5" &&
    ready.marketIdentity?.outcomes.length === outcomes.length &&
    ready.visibleMobileFields.outcomeIds.every((outcomeId) => expectedOutcomeIds.has(outcomeId)) &&
    ready.visibleMobileFields.levels.length >= 8 &&
    readyRowsUseExpectedOutcomes &&
    ready.emptyState == null;

  const artifact = {
    cycle: "DW-A",
    agent: "Agent A - Backend/provider lifecycle",
    gap: "PM-GAP-075",
    generatedAt: new Date().toISOString(),
    route: `/api/orderbook/${market.id}/book?maxLevels=24`,
    baseUrl,
    event: {
      id: event.id,
      slug: event.slug,
      title: event.title,
      compactStyle: "World Cup regulation totals provider state matrix",
    },
    market: {
      id: market.id,
      slug: market.slug,
      title: market.title,
      referenceSource: market.referenceSource,
      externalSlug: market.externalSlug,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
      marketType: market.marketType,
      marketGroupKey: market.marketGroupKey,
      marketGroupTitle: market.marketGroupTitle,
      period: market.period,
      line: market.line?.toString() ?? null,
      unit: market.unit,
      outcomeCount: outcomes.length,
      outcomeIds: outcomes.map((outcome) => outcome.id),
    },
    setup: {
      localOpenOrdersClearedForMarket: true,
      providerQuoteSnapshotsClearedForMarket: true,
      fallbackQuoteDepthClearedForMarket: true,
      proofDepthSource: DEPTH_SOURCE,
    },
    matrix: {
      unavailable: {
        seededProviderDepthRows: 0,
        response: unavailable,
      },
      stale: {
        seededProviderDepth: {
          source: DEPTH_SOURCE,
          rowsRequested: staleRows.length,
          rowsUpserted: staleUpserted.length,
          fetchedAt: staleFetchedAt.toISOString(),
        },
        response: stale,
      },
      ready: {
        seededProviderDepth: {
          source: DEPTH_SOURCE,
          rowsRequested: readyRows.length,
          rowsUpserted: readyUpserted.length,
          fetchedAt: readyFetchedAt.toISOString(),
        },
        response: ready,
      },
    },
    assertions: {
      unavailableDoesNotUseFallbackRowsAsReadyEvidence: unavailable.depthSource === "empty" &&
        unavailable.emptyState === "no-depth" &&
        unavailable.providerOrderbookDepth?.status === "unavailable" &&
        unavailable.providerQuoteDepth?.levelCount === 0,
      staleIsDistinctFromReady: stale.providerOrderbookDepth?.status === "stale" &&
        stale.depthSource === "provider-orderbook-depth" &&
        stale.providerOrderbookDepth?.status !== ready.providerOrderbookDepth?.status,
      readyUsesProviderOrderbookDepth: ready.depthSource === "provider-orderbook-depth" &&
        ready.providerOrderbookDepth?.status === "ready" &&
        ready.providerOrderbookDepth?.sources.includes(DEPTH_SOURCE),
      selectedMarketIdentityStableAcrossMatrix: [unavailable, stale, ready].every((state) =>
        state.marketIdentity?.marketId === market.id &&
        state.marketIdentity?.selectorKey === expectedSelectorKey &&
        state.marketIdentity?.period === "regulation" &&
        state.marketIdentity?.line === "2.5"),
      responseFieldsProven: Boolean(
        ready.depthSource &&
        ready.availability?.status &&
        ready.providerOrderbookDepth?.status &&
        ready.providerOrderbookDepth?.reason &&
        unavailable.emptyState &&
        ready.marketIdentity?.marketId &&
        ready.marketIdentity?.selectorKey &&
        ready.marketIdentity?.period &&
        ready.marketIdentity?.line &&
        ready.marketIdentity?.outcomes.length,
      ),
      outcomeIdsPresentOnIdentityAndLevels: ready.visibleMobileFields.outcomeIds.every((outcomeId) => expectedOutcomeIds.has(outcomeId)) &&
        readyRowsUseExpectedOutcomes,
    },
    pass,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);

  if (!pass) {
    process.exitCode = 1;
  }
}

async function clearRouteDepthInputs(marketId: string) {
  await prisma.order.deleteMany({
    where: {
      marketId,
      status: { in: ["OPEN", "PARTIAL"] },
    },
  });
  await prisma.referenceQuoteSnapshot.deleteMany({ where: { marketId } });
  await prisma.referenceOrderbookDepthSnapshot.deleteMany({ where: { marketId } });
}

async function upsertProofMarket(eventSlug: string) {
  const now = new Date();
  const event = await prisma.event.upsert({
    where: { slug: eventSlug },
    create: {
      slug: eventSlug,
      title: "World Cup 2026: Netherlands vs Portugal",
      description: "Disposable backend proof event for provider orderbook state matrix.",
      category: "sports",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "provider_orderbook_state_matrix_proof",
      homeTeamName: "Netherlands",
      awayTeamName: "Portugal",
      status: "live",
      liveStatus: "LIVE",
      period: "2H",
      clock: "71:00",
      homeScore: 1,
      awayScore: 2,
      source: "polymarket-proof",
      externalSlug: eventSlug,
      sourceUpdatedAt: now,
      metadata: proofEventMetadata(now),
    },
    update: {
      title: "World Cup 2026: Netherlands vs Portugal",
      status: "live",
      liveStatus: "LIVE",
      period: "2H",
      clock: "71:00",
      homeScore: 1,
      awayScore: 2,
      sourceUpdatedAt: now,
      metadata: proofEventMetadata(now),
    },
  });

  const marketSlug = `${eventSlug}-regulation-total-2-5`;
  const market = await prisma.market.upsert({
    where: { slug: marketSlug },
    create: {
      slug: marketSlug,
      title: "Netherlands vs Portugal: Total Goals 2.5",
      description: "Disposable compact World Cup-style totals market for provider state matrix proof.",
      categoryLegacy: "sports",
      type: "BINARY",
      marketType: "total_goals",
      marketGroupKey: "totals",
      marketGroupTitle: "Totals",
      displayOrder: 20,
      line: "2.5",
      unit: "goals",
      period: "regulation",
      status: "LIVE",
      eventId: event.id,
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      isListed: true,
      externalMarketId: "dw-a-provider-orderbook-state-market",
      conditionId: "dw-a-provider-orderbook-state-condition",
      referenceSource: "polymarket",
      externalSlug: marketSlug,
      referenceMetadata: {
        disposableProof: true,
        providerDepthStateMatrixProof: true,
        pmGap: "PM-GAP-075",
        selectorTarget: "totals:regulation:2.5",
      },
      rulesText: "Disposable backend proof market for provider orderbook state matrix.",
      sourceUpdatedAt: now,
    },
    update: {
      title: "Netherlands vs Portugal: Total Goals 2.5",
      description: "Disposable compact World Cup-style totals market for provider state matrix proof.",
      type: "BINARY",
      marketType: "total_goals",
      marketGroupKey: "totals",
      marketGroupTitle: "Totals",
      displayOrder: 20,
      line: "2.5",
      unit: "goals",
      period: "regulation",
      status: "LIVE",
      eventId: event.id,
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      isListed: true,
      referenceSource: "polymarket",
      externalSlug: marketSlug,
      sourceUpdatedAt: now,
    },
  });

  const outcomes = [];
  const outcomeInputs = [
    {
      name: "Over 2.5",
      label: "Over 2.5",
      code: "OVER_2_5",
      side: "over",
      token: "dw-a-token-over-2-5",
    },
    {
      name: "Under 2.5",
      label: "Under 2.5",
      code: "UNDER_2_5",
      side: "under",
      token: "dw-a-token-under-2-5",
    },
  ];

  for (const [index, input] of outcomeInputs.entries()) {
    const existing = await prisma.outcome.findFirst({
      where: {
        marketId: market.id,
        code: input.code,
      },
    });
    const data = {
      name: input.name,
      label: input.label,
      code: input.code,
      side: input.side,
      displayOrder: index,
      isActive: true,
      isTradable: true,
      referenceTokenId: input.token,
      referenceOutcomeLabel: input.label,
      referenceMetadata: {
        disposableProof: true,
        tokenId: input.token,
        line: "2.5",
        period: "regulation",
      },
    };
    const outcome = existing
      ? await prisma.outcome.update({ where: { id: existing.id }, data })
      : await prisma.outcome.create({
          data: {
            marketId: market.id,
            slug: `${market.slug}-${input.code.toLowerCase().replace(/_/g, "-")}`,
            ...data,
          },
        });
    outcomes.push(outcome);
  }

  return { event, market, outcomes };
}

function proofEventMetadata(now: Date) {
  return {
    disposableProof: true,
    pmGap: "PM-GAP-075",
    mobileLiveDetail: {
      liveDataStatus: {
        source: "polymarket-proof",
        status: "ready",
        lastUpdated: now.toISOString(),
        reason: "Disposable DW-A provider orderbook state matrix proof event.",
      },
    },
  };
}

function depthRows(
  market: { id: string; externalSlug: string | null; externalMarketId: string | null; conditionId: string | null },
  outcomes: Array<{ id: string; referenceTokenId: string | null }>,
  fetchedAt: Date,
) {
  return outcomes.flatMap((outcome, outcomeIndex) => {
    const bidBase = [0.49, 0.48][outcomeIndex] ?? 0.2;
    const askBase = [0.53, 0.52][outcomeIndex] ?? 0.24;
    const sizeBase = [21400, 19650][outcomeIndex] ?? 9000;

    return [
      depthRow(market, outcome, "bid", bidBase, sizeBase, 0, fetchedAt),
      depthRow(market, outcome, "bid", Number((bidBase - 0.02).toFixed(2)), sizeBase + 1250, 1, fetchedAt),
      depthRow(market, outcome, "ask", askBase, sizeBase - 1100, 0, fetchedAt),
      depthRow(market, outcome, "ask", Number((askBase + 0.02).toFixed(2)), sizeBase + 850, 1, fetchedAt),
    ];
  });
}

function depthRow(
  market: { id: string; externalSlug: string | null; externalMarketId: string | null; conditionId: string | null },
  outcome: { id: string; referenceTokenId: string | null },
  side: "bid" | "ask",
  price: number,
  size: number,
  levelIndex: number,
  fetchedAt: Date,
) {
  return {
    marketId: market.id,
    outcomeId: outcome.id,
    source: DEPTH_SOURCE,
    externalSlug: market.externalSlug,
    externalMarketId: market.externalMarketId,
    conditionId: market.conditionId,
    tokenId: outcome.referenceTokenId,
    side,
    price,
    size,
    levelIndex,
    fetchedAt,
  };
}

async function callBookRoute(baseUrl: string, marketId: string) {
  const response = await fetch(`${baseUrl}/api/orderbook/${encodeURIComponent(marketId)}/book?maxLevels=24`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Book route failed: ${response.status} ${response.statusText} ${body}`);
  }
  return await response.json() as JsonObject;
}

function summarizeRouteBody(body: JsonObject) {
  const levels = Array.isArray(body.levels) ? body.levels : [];
  const identity = asJsonObject(body.marketIdentity);
  const marketIdentity = identity
    ? {
        source: stringOrNull(identity.source),
        marketId: stringOrNull(identity.marketId),
        title: stringOrNull(identity.title),
        selectorKey: stringOrNull(identity.selectorKey),
        marketFamily: stringOrNull(identity.marketFamily),
        marketType: stringOrNull(identity.marketType),
        marketGroupKey: stringOrNull(identity.marketGroupKey),
        marketGroupId: stringOrNull(identity.marketGroupId),
        marketGroupTitle: stringOrNull(identity.marketGroupTitle),
        displayOrder: numberOrNull(identity.displayOrder),
        period: stringOrNull(identity.period),
        line: stringOrNull(identity.line),
        unit: stringOrNull(identity.unit),
        outcomeCount: numberOrNull(identity.outcomeCount),
        tradableOutcomeCount: numberOrNull(identity.tradableOutcomeCount),
        outcomes: Array.isArray(identity.outcomes)
          ? identity.outcomes.map((outcome) => asJsonObject(outcome)).filter((outcome): outcome is JsonObject => outcome != null).map((outcome) => ({
              id: stringOrNull(outcome.id) ?? "",
              name: stringOrNull(outcome.name),
              label: stringOrNull(outcome.label),
              side: stringOrNull(outcome.side),
              displayOrder: numberOrNull(outcome.displayOrder),
              isTradable: Boolean(outcome.isTradable),
            }))
          : [],
      }
    : null;

  const visibleLevels = levels
    .map((level) => asJsonObject(level))
    .filter((level): level is JsonObject => level != null)
    .map((level) => ({
      outcomeId: stringOrNull(level.outcomeId) ?? "",
      side: stringOrNull(level.side),
      price: Number(level.price),
      shares: Number(level.shares),
      value: Number(level.value ?? level.total),
    }));

  const providerOrderbookDepth = normalizeProviderOrderbookDepth(body.providerOrderbookDepth);
  const providerQuoteDepth = normalizeProviderQuoteDepth(body.providerQuoteDepth);

  return {
    marketId: stringOrNull(body.marketId),
    outcomeId: stringOrNull(body.outcomeId),
    depthSource: stringOrNull(body.depthSource),
    depthReason: stringOrNull(body.depthReason),
    emptyState: body.emptyState ?? null,
    availability: asJsonObject(body.availability)
      ? {
          source: stringOrNull(asJsonObject(body.availability)?.source),
          status: stringOrNull(asJsonObject(body.availability)?.status),
          marketStatus: stringOrNull(asJsonObject(body.availability)?.marketStatus),
          isStale: Boolean(asJsonObject(body.availability)?.isStale),
          isSuspended: Boolean(asJsonObject(body.availability)?.isSuspended),
          isDelayed: Boolean(asJsonObject(body.availability)?.isDelayed),
          reason: stringOrNull(asJsonObject(body.availability)?.reason),
        }
      : null,
    marketIdentity,
    levelCount: levels.length,
    visibleMobileFields: {
      source: stringOrNull(body.depthSource),
      availabilityStatus: stringOrNull(asJsonObject(body.availability)?.status),
      providerOrderbookDepthStatus: providerOrderbookDepth?.status ?? null,
      providerOrderbookDepthReason: providerOrderbookDepth?.reason ?? null,
      emptyState: body.emptyState ?? null,
      selectorKey: marketIdentity?.selectorKey ?? null,
      marketFamily: marketIdentity?.marketFamily ?? null,
      period: marketIdentity?.period ?? null,
      line: marketIdentity?.line ?? null,
      outcomeIds: marketIdentity?.outcomes.map((outcome) => outcome.id) ?? [],
      levels: visibleLevels,
    },
    providerOrderbookDepth,
    providerQuoteDepth,
  };
}

function normalizeProviderOrderbookDepth(value: unknown) {
  const depth = asJsonObject(value);
  if (!depth) return null;
  return {
    source: stringOrNull(depth.source),
    status: stringOrNull(depth.status),
    levelCount: numberOrNull(depth.levelCount) ?? 0,
    snapshotCount: numberOrNull(depth.snapshotCount) ?? 0,
    latestFetchedAt: stringOrNull(depth.latestFetchedAt),
    latestUpdatedAt: stringOrNull(depth.latestUpdatedAt),
    stalenessSeconds: numberOrNull(depth.stalenessSeconds),
    staleAfterSeconds: numberOrNull(depth.staleAfterSeconds),
    refreshTtlSeconds: numberOrNull(depth.refreshTtlSeconds),
    nextRefreshAt: stringOrNull(depth.nextRefreshAt),
    shouldRefresh: Boolean(depth.shouldRefresh),
    isStale: Boolean(depth.isStale),
    sources: Array.isArray(depth.sources) ? depth.sources.map((source) => String(source)) : [],
    reason: stringOrNull(depth.reason),
  };
}

function normalizeProviderQuoteDepth(value: unknown) {
  const depth = asJsonObject(value);
  if (!depth) return null;
  return {
    source: stringOrNull(depth.source),
    levelCount: numberOrNull(depth.levelCount) ?? 0,
    sizeSource: stringOrNull(depth.sizeSource),
    isEstimatedSize: Boolean(depth.isEstimatedSize),
    reason: stringOrNull(depth.reason),
  };
}

function asJsonObject(value: unknown): JsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : null;
}

function stringOrNull(value: unknown) {
  return typeof value === "string" ? value : value == null ? null : String(value);
}

function numberOrNull(value: unknown) {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
