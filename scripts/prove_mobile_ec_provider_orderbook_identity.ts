import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { buildMobileLiveProviderQuoteSnapshotRows } from "@/server/services/mobileLiveProviderQuoteSnapshotSeeding";
import { upsertReferenceOrderbookDepthSnapshots } from "@/server/services/referenceOrderbookDepthSnapshots";
import { upsertReferenceQuoteSnapshots } from "@/server/services/referenceQuoteSnapshots";

const DEFAULT_EVENT_SLUG = "cycle-ec-a-world-cup-provider-orderbook-identity";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-EC-A-provider-orderbook-identity.json";
const DEFAULT_BASE_URL = "http://127.0.0.1:3002";
const DEPTH_SOURCE = "polymarket-clob-ec-identity-proof";

type JsonObject = Record<string, unknown>;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const eventSlug = args.eventSlug ?? DEFAULT_EVENT_SLUG;
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;
  const baseUrl = (args.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const { event, matchWinner, totals, matchWinnerOutcomes } = await upsertProofEvent(eventSlug);

  await clearDepthInputs([matchWinner.id, totals.id]);

  const fetchedAt = new Date();
  const quoteRows = buildMobileLiveProviderQuoteSnapshotRows([matchWinner], fetchedAt.toISOString());
  const quoteUpserts = await upsertReferenceQuoteSnapshots(quoteRows);
  const depthRows = buildDepthRows(matchWinner, matchWinnerOutcomes, fetchedAt);
  const depthUpserts = await upsertReferenceOrderbookDepthSnapshots(depthRows);

  const liveDetail = await callLiveDetailRoute(baseUrl, eventSlug);
  const compactMarkets = Array.isArray(liveDetail.markets) ? liveDetail.markets.map(asJsonObject).filter(Boolean) as JsonObject[] : [];
  const selectedMarket = compactMarkets.find((market) =>
    stringOrNull(asJsonObject(market.orderbookIdentity)?.depthSource) === "provider-orderbook-depth" &&
    stringOrNull(asJsonObject(market.orderbookIdentity)?.depthProviderStatus) === "ready")
    ?? compactMarkets.find((market) => stringOrNull(market.id) === matchWinner.id);

  if (!selectedMarket) {
    throw new Error("Live-detail did not return a selectable compact provider market.");
  }

  const selectedIdentity = normalizeLiveMarketIdentity(selectedMarket);
  const book = await callBookRoute(baseUrl, selectedIdentity.marketId ?? matchWinner.id);
  const bookIdentity = normalizeBookIdentity(book);
  const bookDepth = normalizeProviderOrderbookDepth(book.providerOrderbookDepth);
  const bookLevels = normalizeLevels(book.levels);
  const selectedOutcomeIds = new Set(selectedIdentity.outcomeIds);
  const selectedTokenIds = new Set(selectedIdentity.tokenIds);
  const bookTokenIds = new Set(bookIdentity.outcomes.map((outcome) => outcome.tokenId).filter((tokenId): tokenId is string => Boolean(tokenId)));
  const lineMarkets = compactMarkets
    .map(normalizeLiveMarketIdentity)
    .filter((market) => market.line != null || !["moneyline", "match_winner_1x2"].includes(market.marketFamily ?? ""));
  const providerBackedLineMarkets = lineMarkets.filter((market) => market.depthSource === "provider-orderbook-depth" && market.depthProviderStatus === "ready");

  const assertions = {
    liveDetailStartedProof: stringOrNull(asJsonObject(liveDetail.event)?.slug) === eventSlug,
    selectedProviderBackedCompactMarket: selectedIdentity.depthSource === "provider-orderbook-depth" &&
      selectedIdentity.depthProviderStatus === "ready" &&
      selectedIdentity.ready === true,
    sameMarketId: selectedIdentity.marketId === bookIdentity.marketId,
    sameSelectorKey: selectedIdentity.selectorKey === bookIdentity.selectorKey,
    sameMarketGroupId: selectedIdentity.marketGroupId === bookIdentity.marketGroupId,
    sameFamilyPeriodLine: selectedIdentity.marketFamily === bookIdentity.marketFamily &&
      selectedIdentity.period === bookIdentity.period &&
      selectedIdentity.line === bookIdentity.line,
    sameOutcomeIds: bookIdentity.outcomes.every((outcome) => selectedOutcomeIds.has(outcome.id)),
    sameTokenIds: selectedTokenIds.size > 0 && bookTokenIds.size === selectedTokenIds.size &&
      [...bookTokenIds].every((tokenId) => selectedTokenIds.has(tokenId)),
    bookReturnedProviderReadyDepth: stringOrNull(book.depthSource) === "provider-orderbook-depth" &&
      bookDepth?.status === "ready" &&
      bookLevels.length >= 6,
    providerSourceMatches: selectedIdentity.providerSource === "polymarket" &&
      bookDepth?.sources.includes(DEPTH_SOURCE) === true,
    freshnessFieldsPresent: Boolean(selectedIdentity.refreshedAt && selectedIdentity.reason && selectedIdentity.nextRefreshAt != null),
  };

  const artifact = {
    cycle: "EC-A",
    agent: "Agent A - Backend/provider lifecycle",
    gap: "provider-backed orderbook identity parity",
    generatedAt: new Date().toISOString(),
    baseUrl,
    routes: {
      liveDetail: `/api/mobile/events/${eventSlug}/live-detail`,
      orderbook: `/api/orderbook/${selectedIdentity.marketId}/book?maxLevels=24`,
    },
    event: {
      id: event.id,
      slug: event.slug,
      title: event.title,
    },
    setup: {
      proofDepthSource: DEPTH_SOURCE,
      providerQuoteRowsUpserted: quoteUpserts.length,
      providerOrderbookDepthRowsUpserted: depthUpserts.length,
      matchWinnerMarketId: matchWinner.id,
      totalsLineMarketId: totals.id,
    },
    liveDetailSelection: selectedIdentity,
    orderbookResponse: {
      marketId: stringOrNull(book.marketId),
      depthSource: stringOrNull(book.depthSource),
      depthReason: stringOrNull(book.depthReason),
      emptyState: book.emptyState ?? null,
      marketIdentity: bookIdentity,
      providerOrderbookDepth: bookDepth,
      levelCount: bookLevels.length,
      firstLevels: bookLevels.slice(0, 8),
    },
    lineMarketProviderGap: {
      documented: providerBackedLineMarkets.length === 0,
      compactLineMarketCount: lineMarkets.length,
      providerBackedLineMarketCount: providerBackedLineMarkets.length,
      note: providerBackedLineMarkets.length === 0
        ? "This EC proof intentionally proves match-winner provider-backed identity; compact line markets are present but not seeded as provider-backed in this disposable event."
        : "At least one compact line market was provider-backed in this proof event.",
      lineMarkets: lineMarkets.map((market) => ({
        marketId: market.marketId,
        selectorKey: market.selectorKey,
        marketFamily: market.marketFamily,
        period: market.period,
        line: market.line,
        depthSource: market.depthSource,
        depthProviderStatus: market.depthProviderStatus,
      })),
    },
    assertions,
    pass: Object.values(assertions).every(Boolean),
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);

  if (!artifact.pass) {
    process.exitCode = 1;
  }
}

async function clearDepthInputs(marketIds: string[]) {
  await prisma.order.deleteMany({ where: { marketId: { in: marketIds }, status: { in: ["OPEN", "PARTIAL"] } } });
  await prisma.referenceQuoteSnapshot.deleteMany({ where: { marketId: { in: marketIds } } });
  await prisma.referenceOrderbookDepthSnapshot.deleteMany({ where: { marketId: { in: marketIds } } });
}

async function upsertProofEvent(eventSlug: string) {
  const now = new Date();
  const event = await prisma.event.upsert({
    where: { slug: eventSlug },
    create: {
      slug: eventSlug,
      title: "World Cup 2026: Spain vs Japan",
      description: "Disposable EC-A provider orderbook identity proof event.",
      category: "sports",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "provider_orderbook_identity_proof",
      homeTeamName: "Spain",
      awayTeamName: "Japan",
      status: "live",
      liveStatus: "LIVE",
      period: "2H",
      clock: "74:00",
      homeScore: 2,
      awayScore: 1,
      source: "polymarket-proof",
      externalSlug: eventSlug,
      sourceUpdatedAt: now,
      metadata: proofEventMetadata(now),
    },
    update: {
      title: "World Cup 2026: Spain vs Japan",
      status: "live",
      liveStatus: "LIVE",
      period: "2H",
      clock: "74:00",
      homeScore: 2,
      awayScore: 1,
      sourceUpdatedAt: now,
      metadata: proofEventMetadata(now),
    },
  });

  const matchWinner = await upsertMarket({
    eventId: event.id,
    slug: `${eventSlug}-match-winner`,
    title: "Spain vs Japan: Match Winner",
    marketType: "match_winner_1x2",
    marketGroupKey: "main",
    marketGroupTitle: "Match Winner",
    displayOrder: 0,
    line: null,
    unit: null,
    period: "full-game",
    externalMarketId: "ec-a-provider-orderbook-identity-market",
    conditionId: "ec-a-provider-orderbook-identity-condition",
  });
  const totals = await upsertMarket({
    eventId: event.id,
    slug: `${eventSlug}-total-2-5`,
    title: "Spain vs Japan: Total Goals 2.5",
    marketType: "total_goals",
    marketGroupKey: "totals",
    marketGroupTitle: "Totals",
    displayOrder: 20,
    line: "2.5",
    unit: "goals",
    period: "regulation",
    externalMarketId: "ec-a-provider-orderbook-identity-total-market",
    conditionId: "ec-a-provider-orderbook-identity-total-condition",
  });

  const matchWinnerOutcomes = await upsertOutcomes(matchWinner, [
    { name: "Spain", code: "SPAIN", side: "home", token: "ec-a-token-spain" },
    { name: "Draw", code: "DRAW", side: "draw", token: "ec-a-token-draw" },
    { name: "Japan", code: "JAPAN", side: "away", token: "ec-a-token-japan" },
  ]);
  await upsertOutcomes(totals, [
    { name: "Over 2.5", code: "OVER_2_5", side: "over", token: "ec-a-token-over-2-5" },
    { name: "Under 2.5", code: "UNDER_2_5", side: "under", token: "ec-a-token-under-2-5" },
  ]);

  return { event, matchWinner: { ...matchWinner, outcomes: matchWinnerOutcomes }, totals, matchWinnerOutcomes };
}

async function upsertMarket(input: {
  eventId: string;
  slug: string;
  title: string;
  marketType: string;
  marketGroupKey: string;
  marketGroupTitle: string;
  displayOrder: number;
  line: string | null;
  unit: string | null;
  period: string;
  externalMarketId: string;
  conditionId: string;
}) {
  const now = new Date();
  return prisma.market.upsert({
    where: { slug: input.slug },
    create: {
      slug: input.slug,
      title: input.title,
      description: "Disposable compact World Cup-style market for EC-A provider identity proof.",
      categoryLegacy: "sports",
      type: input.marketType === "match_winner_1x2" ? "MULTI_WINNER" : "BINARY",
      marketType: input.marketType,
      marketGroupKey: input.marketGroupKey,
      marketGroupTitle: input.marketGroupTitle,
      displayOrder: input.displayOrder,
      line: input.line,
      unit: input.unit,
      period: input.period,
      status: "LIVE",
      eventId: input.eventId,
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      isListed: true,
      externalMarketId: input.externalMarketId,
      conditionId: input.conditionId,
      referenceSource: "polymarket",
      externalSlug: input.slug,
      referenceMetadata: {
        disposableProof: true,
        providerOrderbookIdentityProof: true,
        cycle: "EC-A",
      },
      rulesText: "Disposable backend proof market for provider-backed orderbook identity.",
      sourceUpdatedAt: now,
    },
    update: {
      title: input.title,
      marketType: input.marketType,
      marketGroupKey: input.marketGroupKey,
      marketGroupTitle: input.marketGroupTitle,
      displayOrder: input.displayOrder,
      line: input.line,
      unit: input.unit,
      period: input.period,
      status: "LIVE",
      eventId: input.eventId,
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      isListed: true,
      referenceSource: "polymarket",
      externalSlug: input.slug,
      externalMarketId: input.externalMarketId,
      conditionId: input.conditionId,
      sourceUpdatedAt: now,
    },
  });
}

async function upsertOutcomes(
  market: { id: string; slug: string },
  inputs: Array<{ name: string; code: string; side: string; token: string }>,
) {
  const outcomes = [];
  for (const [index, input] of inputs.entries()) {
    const existing = await prisma.outcome.findFirst({ where: { marketId: market.id, code: input.code } });
    const data = {
      name: input.name,
      label: input.name,
      code: input.code,
      side: input.side,
      displayOrder: index,
      isActive: true,
      isTradable: true,
      referenceTokenId: input.token,
      referenceOutcomeLabel: input.name,
      referenceMetadata: {
        disposableProof: true,
        tokenId: input.token,
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
  return outcomes;
}

function proofEventMetadata(now: Date) {
  return {
    disposableProof: true,
    cycle: "EC-A",
    mobileLiveDetail: {
      liveDataStatus: {
        source: "polymarket-proof",
        status: "ready",
        lastUpdated: now.toISOString(),
        reason: "Disposable EC-A provider orderbook identity proof event.",
      },
    },
  };
}

function buildDepthRows(
  market: { id: string; externalSlug: string | null; externalMarketId: string | null; conditionId: string | null },
  outcomes: Array<{ id: string; referenceTokenId: string | null }>,
  fetchedAt: Date,
) {
  return outcomes.flatMap((outcome, outcomeIndex) => {
    const bidBase = [0.62, 0.23, 0.17][outcomeIndex] ?? 0.12;
    const askBase = [0.65, 0.26, 0.2][outcomeIndex] ?? 0.15;
    const sizeBase = [18400, 11200, 9600][outcomeIndex] ?? 7000;
    return [
      depthRow(market, outcome, "bid", bidBase, sizeBase, 0, fetchedAt),
      depthRow(market, outcome, "bid", Number((bidBase - 0.01).toFixed(2)), sizeBase + 800, 1, fetchedAt),
      depthRow(market, outcome, "ask", askBase, sizeBase - 600, 0, fetchedAt),
      depthRow(market, outcome, "ask", Number((askBase + 0.01).toFixed(2)), sizeBase + 500, 1, fetchedAt),
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

async function callLiveDetailRoute(baseUrl: string, eventSlug: string) {
  const response = await fetch(`${baseUrl}/api/mobile/events/${encodeURIComponent(eventSlug)}/live-detail`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Live-detail route failed: ${response.status} ${response.statusText} ${body}`);
  }
  return await response.json() as JsonObject;
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

function normalizeLiveMarketIdentity(market: JsonObject) {
  const identity = asJsonObject(market.orderbookIdentity);
  const selection = asJsonObject(market.selection);
  const outcomes = Array.isArray(market.outcomes) ? market.outcomes.map(asJsonObject).filter(Boolean) as JsonObject[] : [];
  return {
    marketId: stringOrNull(identity?.marketId) ?? stringOrNull(market.id),
    marketGroupId: stringOrNull(identity?.marketGroupId) ?? stringOrNull(market.marketGroupId),
    selectorKey: stringOrNull(identity?.selectorKey) ?? stringOrNull(selection?.selectorKey),
    marketFamily: stringOrNull(identity?.marketFamily) ?? stringOrNull(selection?.marketFamily),
    period: stringOrNull(identity?.period) ?? stringOrNull(selection?.period),
    line: stringOrNull(identity?.line) ?? stringOrNull(market.line),
    outcomeIds: Array.isArray(identity?.outcomeIds)
      ? identity.outcomeIds.map(String)
      : outcomes.map((outcome) => stringOrNull(outcome.id)).filter((id): id is string => Boolean(id)),
    tokenIds: Array.isArray(identity?.tokenIds)
      ? identity.tokenIds.map(String)
      : outcomes.map((outcome) => stringOrNull(outcome.tokenId) ?? stringOrNull(outcome.referenceTokenId)).filter((id): id is string => Boolean(id)),
    providerSource: stringOrNull(identity?.providerSource),
    providerStatus: stringOrNull(identity?.providerStatus),
    depthSource: stringOrNull(identity?.depthSource),
    depthStatus: stringOrNull(identity?.depthStatus),
    depthProviderStatus: stringOrNull(identity?.depthProviderStatus),
    depthProviderSources: Array.isArray(identity?.depthProviderSources) ? identity.depthProviderSources.map(String) : [],
    refreshedAt: stringOrNull(identity?.refreshedAt),
    nextRefreshAt: stringOrNull(identity?.nextRefreshAt),
    shouldRefresh: Boolean(identity?.shouldRefresh),
    isStale: Boolean(identity?.isStale),
    ready: identity?.ready === true,
    reason: stringOrNull(identity?.reason),
  };
}

function normalizeBookIdentity(body: JsonObject) {
  const identity = asJsonObject(body.marketIdentity) ?? {};
  const outcomes = Array.isArray(identity.outcomes) ? identity.outcomes.map(asJsonObject).filter(Boolean) as JsonObject[] : [];
  return {
    marketId: stringOrNull(identity.marketId),
    marketGroupId: stringOrNull(identity.marketGroupId),
    selectorKey: stringOrNull(identity.selectorKey),
    marketFamily: stringOrNull(identity.marketFamily),
    period: stringOrNull(identity.period),
    line: stringOrNull(identity.line),
    outcomes: outcomes.map((outcome) => ({
      id: stringOrNull(outcome.id) ?? "",
      outcomeId: stringOrNull(outcome.outcomeId),
      tokenId: stringOrNull(outcome.tokenId),
      label: stringOrNull(outcome.label),
      side: stringOrNull(outcome.side),
    })),
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
    sources: Array.isArray(depth.sources) ? depth.sources.map(String) : [],
    reason: stringOrNull(depth.reason),
  };
}

function normalizeLevels(value: unknown) {
  return (Array.isArray(value) ? value : [])
    .map(asJsonObject)
    .filter((level): level is JsonObject => level != null)
    .map((level) => ({
      outcomeId: stringOrNull(level.outcomeId),
      side: stringOrNull(level.side),
      price: numberOrNull(level.price),
      shares: numberOrNull(level.shares),
      value: numberOrNull(level.value ?? level.total),
    }));
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
