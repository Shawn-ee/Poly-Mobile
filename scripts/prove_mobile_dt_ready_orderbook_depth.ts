import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { upsertReferenceOrderbookDepthSnapshots } from "@/server/services/referenceOrderbookDepthSnapshots";

const DEFAULT_EVENT_SLUG = "cycle-dt-a-world-cup-ready-depth";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-DT-A-ready-orderbook-depth-proof.json";
const DEFAULT_BASE_URL = "http://127.0.0.1:3002";
const DEPTH_SOURCE = "polymarket-clob-dt-proof";
type JsonObject = Record<string, unknown>;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const eventSlug = args.eventSlug ?? DEFAULT_EVENT_SLUG;
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;
  const baseUrl = (args.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const { market, outcomes } = await upsertProofMarket(eventSlug);

  await prisma.referenceOrderbookDepthSnapshot.deleteMany({
    where: { marketId: market.id, source: DEPTH_SOURCE },
  });

  const fetchedAt = new Date();
  const depthRows = outcomes.flatMap((outcome, outcomeIndex) => {
    const bidBase = [0.57, 0.31, 0.18][outcomeIndex] ?? 0.12;
    const askBase = [0.6, 0.34, 0.21][outcomeIndex] ?? 0.15;
    const sizeBase = [12400, 8600, 5300][outcomeIndex] ?? 4100;

    return [
      depthRow(market, outcome, "bid", bidBase, sizeBase, 0, fetchedAt),
      depthRow(market, outcome, "bid", Number((bidBase - 0.01).toFixed(2)), sizeBase + 700, 1, fetchedAt),
      depthRow(market, outcome, "ask", askBase, sizeBase - 500, 0, fetchedAt),
      depthRow(market, outcome, "ask", Number((askBase + 0.01).toFixed(2)), sizeBase + 300, 1, fetchedAt),
    ];
  });

  const upserted = await upsertReferenceOrderbookDepthSnapshots(depthRows);
  const body = await callBookRoute(baseUrl, market.id);
  const summary = summarizeRouteBody(body);
  const pass =
    summary.depthSource === "provider-orderbook-depth" &&
    summary.marketIdentity?.selectorKey === "main:full-game:default" &&
    summary.marketIdentity?.marketFamily === "moneyline" &&
    summary.providerOrderbookDepth?.status === "ready" &&
    summary.providerOrderbookDepth?.levelCount >= 6 &&
    summary.priceShareValueRows.length >= 6 &&
    summary.priceShareValueRows.every((row) => row.price > 0 && row.shares > 0 && row.value > 0);

  const artifact = {
    cycle: "DT-A",
    agent: "Agent A - Ready Depth Proof",
    gap: "PM-GAP-075",
    generatedAt: new Date().toISOString(),
    route: `/api/orderbook/${market.id}/book?maxLevels=24`,
    baseUrl,
    event: {
      slug: eventSlug,
      title: "World Cup 2026: Brazil vs Germany",
      compactStyle: "World Cup moneyline",
    },
    market: {
      id: market.id,
      slug: market.slug,
      title: market.title,
      marketType: market.marketType,
      marketGroupKey: market.marketGroupKey,
      period: market.period,
      outcomeCount: outcomes.length,
    },
    seededProviderDepth: {
      source: DEPTH_SOURCE,
      rowsRequested: depthRows.length,
      rowsUpserted: upserted.length,
      fetchedAt: fetchedAt.toISOString(),
    },
    response: summary,
    assertions: {
      routeReturnedProviderBackedReadyDepth: summary.depthSource === "provider-orderbook-depth",
      marketIdentityPresent: Boolean(summary.marketIdentity),
      selectorKeyPresent: summary.marketIdentity?.selectorKey === "main:full-game:default",
      multiplePriceSharesValueRows: summary.priceShareValueRows.length >= 6,
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

async function upsertProofMarket(eventSlug: string) {
  const now = new Date();
  const event = await prisma.event.upsert({
    where: { slug: eventSlug },
    create: {
      slug: eventSlug,
      title: "World Cup 2026: Brazil vs Germany",
      description: "Disposable backend proof event for provider-backed Book depth.",
      category: "sports",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "ready_depth_proof",
      homeTeamName: "Brazil",
      awayTeamName: "Germany",
      status: "live",
      liveStatus: "LIVE",
      period: "2H",
      clock: "63:00",
      homeScore: 1,
      awayScore: 1,
      source: "polymarket-proof",
      externalSlug: eventSlug,
      sourceUpdatedAt: now,
      metadata: {
        disposableProof: true,
        pmGap: "PM-GAP-075",
        mobileLiveDetail: {
          liveDataStatus: {
            source: "polymarket-proof",
            status: "ready",
            lastUpdated: now.toISOString(),
            reason: "Disposable DT-A ready-depth proof event.",
          },
        },
      },
    },
    update: {
      title: "World Cup 2026: Brazil vs Germany",
      status: "live",
      liveStatus: "LIVE",
      period: "2H",
      clock: "63:00",
      homeScore: 1,
      awayScore: 1,
      sourceUpdatedAt: now,
      metadata: {
        disposableProof: true,
        pmGap: "PM-GAP-075",
        mobileLiveDetail: {
          liveDataStatus: {
            source: "polymarket-proof",
            status: "ready",
            lastUpdated: now.toISOString(),
            reason: "Disposable DT-A ready-depth proof event.",
          },
        },
      },
    },
  });

  const marketSlug = `${eventSlug}-match-winner`;
  const market = await prisma.market.upsert({
    where: { slug: marketSlug },
    create: {
      slug: marketSlug,
      title: "Brazil vs Germany: Match Winner",
      description: "Disposable compact World Cup-style orderbook depth proof market.",
      categoryLegacy: "sports",
      type: "MULTI_WINNER",
      marketType: "match_winner_1x2",
      marketGroupKey: "main",
      marketGroupTitle: "Match Winner",
      displayOrder: 0,
      status: "LIVE",
      eventId: event.id,
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      isListed: true,
      externalMarketId: "dt-a-ready-depth-market",
      conditionId: "dt-a-ready-depth-condition",
      referenceSource: "polymarket",
      externalSlug: marketSlug,
      referenceMetadata: {
        disposableProof: true,
        providerDepthProof: true,
        pmGap: "PM-GAP-075",
      },
      rulesText: "Disposable backend proof market for Book-ready provider depth.",
      sourceUpdatedAt: now,
    },
    update: {
      title: "Brazil vs Germany: Match Winner",
      description: "Disposable compact World Cup-style orderbook depth proof market.",
      type: "MULTI_WINNER",
      marketType: "match_winner_1x2",
      marketGroupKey: "main",
      marketGroupTitle: "Match Winner",
      displayOrder: 0,
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
    { name: "Brazil", code: "BRAZIL", side: "home", token: "dt-a-token-brazil" },
    { name: "Draw", code: "DRAW", side: "draw", token: "dt-a-token-draw" },
    { name: "Germany", code: "GERMANY", side: "away", token: "dt-a-token-germany" },
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
      label: input.name,
      code: input.code,
      side: input.side,
      displayOrder: index,
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
            slug: `${market.slug}-${input.code.toLowerCase()}`,
            ...data,
          },
        });
    outcomes.push(outcome);
  }

  return { market, outcomes };
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
        source: identity.source ?? null,
        marketId: identity.marketId ?? null,
        title: identity.title ?? null,
        selectorKey: identity.selectorKey ?? null,
        marketFamily: identity.marketFamily ?? null,
        marketType: identity.marketType ?? null,
        marketGroupKey: identity.marketGroupKey ?? null,
        period: identity.period ?? null,
        line: identity.line ?? null,
        unit: identity.unit ?? null,
        outcomeCount: identity.outcomeCount ?? null,
        tradableOutcomeCount: identity.tradableOutcomeCount ?? null,
        outcomes: Array.isArray(identity.outcomes)
          ? identity.outcomes.map((outcome) => asJsonObject(outcome)).filter(Boolean).map((outcome) => ({
              id: outcome.id,
              name: outcome.name,
              side: outcome.side,
              isTradable: outcome.isTradable,
            }))
          : [],
      }
    : null;

  return {
    marketId: body.marketId ?? null,
    outcomeId: body.outcomeId ?? null,
    depthSource: body.depthSource ?? null,
    depthReason: body.depthReason ?? null,
    emptyState: body.emptyState ?? null,
    availability: asJsonObject(body.availability)
      ? {
          status: asJsonObject(body.availability)?.status,
          marketStatus: asJsonObject(body.availability)?.marketStatus,
          isStale: asJsonObject(body.availability)?.isStale,
          isSuspended: asJsonObject(body.availability)?.isSuspended,
          isDelayed: asJsonObject(body.availability)?.isDelayed,
        }
      : null,
    marketIdentity,
    levelCount: levels.length,
    priceShareValueRows: levels.slice(0, 12).map((level) => asJsonObject(level)).filter(Boolean).map((level) => ({
      outcomeId: level.outcomeId,
      side: level.side,
      price: Number(level.price),
      shares: Number(level.shares),
      value: Number(level.total),
    })),
    providerOrderbookDepth: body.providerOrderbookDepth ?? null,
    providerQuoteDepth: body.providerQuoteDepth ?? null,
  };
}

function asJsonObject(value: unknown): JsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : null;
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
