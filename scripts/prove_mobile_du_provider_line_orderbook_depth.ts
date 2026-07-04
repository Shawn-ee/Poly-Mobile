import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { upsertReferenceOrderbookDepthSnapshots } from "@/server/services/referenceOrderbookDepthSnapshots";

const DEFAULT_EVENT_SLUG = "cycle-du-a-world-cup-provider-line-depth";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-DU-A-provider-line-orderbook-depth-proof.json";
const DEFAULT_BASE_URL = "http://127.0.0.1:3002";
const DEPTH_SOURCE = "polymarket-clob-du-proof";
type JsonObject = Record<string, unknown>;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const eventSlug = args.eventSlug ?? DEFAULT_EVENT_SLUG;
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;
  const baseUrl = (args.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const { event, market, outcomes } = await upsertProofLineMarket(eventSlug);

  await prisma.order.deleteMany({
    where: {
      marketId: market.id,
      status: { in: ["OPEN", "PARTIAL"] },
    },
  });
  await prisma.referenceOrderbookDepthSnapshot.deleteMany({
    where: { marketId: market.id, source: DEPTH_SOURCE },
  });

  const fetchedAt = new Date();
  const depthRows = outcomes.flatMap((outcome, outcomeIndex) => {
    const bidBase = [0.42, 0.55][outcomeIndex] ?? 0.24;
    const askBase = [0.46, 0.59][outcomeIndex] ?? 0.28;
    const sizeBase = [18500, 16250][outcomeIndex] ?? 8000;

    return [
      depthRow(market, outcome, "bid", bidBase, sizeBase, 0, fetchedAt),
      depthRow(market, outcome, "bid", Number((bidBase - 0.02).toFixed(2)), sizeBase + 1100, 1, fetchedAt),
      depthRow(market, outcome, "ask", askBase, sizeBase - 900, 0, fetchedAt),
      depthRow(market, outcome, "ask", Number((askBase + 0.02).toFixed(2)), sizeBase + 650, 1, fetchedAt),
    ];
  });

  const upserted = await upsertReferenceOrderbookDepthSnapshots(depthRows);
  const body = await callBookRoute(baseUrl, market.id);
  const summary = summarizeRouteBody(body);
  const expectedOutcomeIds = new Set(summary.marketIdentity?.outcomes.map((outcome) => outcome.id) ?? []);
  const visibleRows = summary.visibleMobileFields.levels;

  const pass =
    summary.depthSource === "provider-orderbook-depth" &&
    summary.availability?.status === "ready" &&
    summary.providerOrderbookDepth?.status === "ready" &&
    summary.providerOrderbookDepth?.sources.includes(DEPTH_SOURCE) &&
    summary.marketIdentity?.selectorKey === "spreads:first-half:1.5" &&
    summary.marketIdentity?.marketFamily === "spread" &&
    summary.marketIdentity?.marketType === "spread" &&
    summary.marketIdentity?.marketGroupKey === "spreads" &&
    summary.marketIdentity?.period === "first-half" &&
    summary.marketIdentity?.line === "1.5" &&
    summary.marketIdentity?.outcomes.length === 2 &&
    visibleRows.length >= 8 &&
    visibleRows.every((row) =>
      expectedOutcomeIds.has(row.outcomeId) &&
      (row.side === "bid" || row.side === "ask") &&
      row.price > 0 &&
      row.shares > 0 &&
      row.value > 0);

  const artifact = {
    cycle: "DU-A",
    agent: "Agent A - Backend/provider lifecycle",
    gap: "PM-GAP-075",
    generatedAt: new Date().toISOString(),
    route: `/api/orderbook/${market.id}/book?maxLevels=24`,
    baseUrl,
    event: {
      id: event.id,
      slug: event.slug,
      title: event.title,
      compactStyle: "World Cup first-half spread",
    },
    market: {
      id: market.id,
      slug: market.slug,
      title: market.title,
      marketType: market.marketType,
      marketGroupKey: market.marketGroupKey,
      marketGroupTitle: market.marketGroupTitle,
      period: market.period,
      line: market.line?.toString() ?? null,
      unit: market.unit,
      outcomeCount: outcomes.length,
    },
    seededProviderDepth: {
      source: DEPTH_SOURCE,
      rowsRequested: depthRows.length,
      rowsUpserted: upserted.length,
      fetchedAt: fetchedAt.toISOString(),
      localOpenOrdersClearedForMarket: true,
    },
    response: summary,
    assertions: {
      routeReturnedProviderBackedReadyDepth: summary.depthSource === "provider-orderbook-depth",
      availabilityReady: summary.availability?.status === "ready",
      providerDepthReady: summary.providerOrderbookDepth?.status === "ready",
      providerDepthSourcePresent: Boolean(summary.providerOrderbookDepth?.sources.includes(DEPTH_SOURCE)),
      selectorKeyCarriesFamilyPeriodLine: summary.marketIdentity?.selectorKey === "spreads:first-half:1.5",
      spreadIdentityPresent: summary.marketIdentity?.marketFamily === "spread",
      periodPresent: summary.marketIdentity?.period === "first-half",
      linePresent: summary.marketIdentity?.line === "1.5",
      outcomeIdsPresentOnIdentityAndLevels: visibleRows.every((row) => expectedOutcomeIds.has(row.outcomeId)),
      sidePriceSharesValueRowsPresent: visibleRows.length >= 8 &&
        visibleRows.every((row) => (row.side === "bid" || row.side === "ask") && row.price > 0 && row.shares > 0 && row.value > 0),
      noEmptyState: summary.emptyState == null,
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

async function upsertProofLineMarket(eventSlug: string) {
  const now = new Date();
  const event = await prisma.event.upsert({
    where: { slug: eventSlug },
    create: {
      slug: eventSlug,
      title: "World Cup 2026: Japan vs Morocco",
      description: "Disposable backend proof event for provider-backed line-market Book depth.",
      category: "sports",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "provider_line_depth_proof",
      homeTeamName: "Japan",
      awayTeamName: "Morocco",
      status: "live",
      liveStatus: "LIVE",
      period: "1H",
      clock: "36:00",
      homeScore: 0,
      awayScore: 0,
      source: "polymarket-proof",
      externalSlug: eventSlug,
      sourceUpdatedAt: now,
      metadata: proofEventMetadata(now),
    },
    update: {
      title: "World Cup 2026: Japan vs Morocco",
      status: "live",
      liveStatus: "LIVE",
      period: "1H",
      clock: "36:00",
      homeScore: 0,
      awayScore: 0,
      sourceUpdatedAt: now,
      metadata: proofEventMetadata(now),
    },
  });

  const marketSlug = `${eventSlug}-first-half-spread-1-5`;
  const market = await prisma.market.upsert({
    where: { slug: marketSlug },
    create: {
      slug: marketSlug,
      title: "Japan vs Morocco: 1H Spread 1.5",
      description: "Disposable compact World Cup-style first-half spread proof market.",
      categoryLegacy: "sports",
      type: "BINARY",
      marketType: "spread",
      marketGroupKey: "spreads",
      marketGroupTitle: "Spread",
      displayOrder: 10,
      line: "1.5",
      unit: "goals",
      period: "first-half",
      status: "LIVE",
      eventId: event.id,
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      isListed: true,
      externalMarketId: "du-a-provider-line-depth-market",
      conditionId: "du-a-provider-line-depth-condition",
      referenceSource: "polymarket",
      externalSlug: marketSlug,
      referenceMetadata: {
        disposableProof: true,
        providerDepthProof: true,
        pmGap: "PM-GAP-075",
        selectorTarget: "spreads:first-half:1.5",
      },
      rulesText: "Disposable backend proof market for Book-ready provider depth on a first-half spread.",
      sourceUpdatedAt: now,
    },
    update: {
      title: "Japan vs Morocco: 1H Spread 1.5",
      description: "Disposable compact World Cup-style first-half spread proof market.",
      type: "BINARY",
      marketType: "spread",
      marketGroupKey: "spreads",
      marketGroupTitle: "Spread",
      displayOrder: 10,
      line: "1.5",
      unit: "goals",
      period: "first-half",
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
      name: "Japan -1.5",
      label: "Japan -1.5",
      code: "JAPAN_MINUS_1_5",
      side: "home",
      token: "du-a-token-japan-minus-1-5",
    },
    {
      name: "Morocco +1.5",
      label: "Morocco +1.5",
      code: "MOROCCO_PLUS_1_5",
      side: "away",
      token: "du-a-token-morocco-plus-1-5",
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
      isTradable: true,
      referenceTokenId: input.token,
      referenceOutcomeLabel: input.label,
      referenceMetadata: {
        disposableProof: true,
        tokenId: input.token,
        line: "1.5",
        period: "first-half",
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
        reason: "Disposable DU-A provider line-depth proof event.",
      },
    },
  };
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
        displayUnits: asJsonObject(identity.displayUnits),
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
        }
      : null,
    marketIdentity,
    levelCount: levels.length,
    visibleMobileFields: {
      source: stringOrNull(body.depthSource),
      status: stringOrNull(asJsonObject(body.providerOrderbookDepth)?.status),
      readyAvailability: stringOrNull(asJsonObject(body.availability)?.status),
      selectorKey: marketIdentity?.selectorKey ?? null,
      marketFamily: marketIdentity?.marketFamily ?? null,
      period: marketIdentity?.period ?? null,
      line: marketIdentity?.line ?? null,
      outcomeIds: marketIdentity?.outcomes.map((outcome) => outcome.id) ?? [],
      levels: visibleLevels,
    },
    providerOrderbookDepth: normalizeProviderOrderbookDepth(body.providerOrderbookDepth),
    providerQuoteDepth: body.providerQuoteDepth ?? null,
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
    staleAfterSeconds: numberOrNull(depth.staleAfterSeconds),
    refreshTtlSeconds: numberOrNull(depth.refreshTtlSeconds),
    nextRefreshAt: stringOrNull(depth.nextRefreshAt),
    shouldRefresh: Boolean(depth.shouldRefresh),
    isStale: Boolean(depth.isStale),
    sources: Array.isArray(depth.sources) ? depth.sources.map((source) => String(source)) : [],
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
