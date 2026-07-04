import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { upsertReferenceOrderbookDepthSnapshots } from "@/server/services/referenceOrderbookDepthSnapshots";

const DEFAULT_EVENT_SLUG = "mobile-provider-refresh-proof-live";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-current-mobile-provider-depth-snapshot-route-proof.json";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const eventSlug = args.eventSlug ?? DEFAULT_EVENT_SLUG;
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;
  const baseUrl = (args.baseUrl ?? "http://127.0.0.1:3002").replace(/\/+$/, "");
  const market = await prisma.market.findFirst({
    where: {
      event: { slug: eventSlug },
      status: "LIVE",
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
    },
    include: {
      outcomes: {
        where: { isActive: true },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });

  if (!market) {
    throw new Error(`No live proof market found for event ${eventSlug}. Run prepare_mobile_provider_refresh_proof_event.ts first.`);
  }
  if (market.outcomes.length === 0) {
    throw new Error(`Proof market ${market.id} has no active outcomes.`);
  }

  await prisma.referenceOrderbookDepthSnapshot.deleteMany({ where: { marketId: market.id, source: "polymarket-clob-proof" } });
  const before = await callBookRoute(baseUrl, market.id);
  const fetchedAt = new Date();
  const depthRows = market.outcomes.flatMap((outcome, outcomeIndex) => {
    const bidBase = outcomeIndex === 0 ? 0.5 : 0.48;
    const askBase = outcomeIndex === 0 ? 0.54 : 0.52;
    return [
      {
        marketId: market.id,
        outcomeId: outcome.id,
        source: "polymarket-clob-proof",
        externalSlug: market.externalSlug,
        externalMarketId: market.externalMarketId,
        conditionId: market.conditionId,
        tokenId: outcome.referenceTokenId,
        side: "bid" as const,
        price: bidBase,
        size: 7800 + outcomeIndex * 100,
        levelIndex: 0,
        fetchedAt,
      },
      {
        marketId: market.id,
        outcomeId: outcome.id,
        source: "polymarket-clob-proof",
        externalSlug: market.externalSlug,
        externalMarketId: market.externalMarketId,
        conditionId: market.conditionId,
        tokenId: outcome.referenceTokenId,
        side: "bid" as const,
        price: Number((bidBase - 0.01).toFixed(2)),
        size: 8100 + outcomeIndex * 100,
        levelIndex: 1,
        fetchedAt,
      },
      {
        marketId: market.id,
        outcomeId: outcome.id,
        source: "polymarket-clob-proof",
        externalSlug: market.externalSlug,
        externalMarketId: market.externalMarketId,
        conditionId: market.conditionId,
        tokenId: outcome.referenceTokenId,
        side: "ask" as const,
        price: askBase,
        size: 7600 + outcomeIndex * 100,
        levelIndex: 0,
        fetchedAt,
      },
      {
        marketId: market.id,
        outcomeId: outcome.id,
        source: "polymarket-clob-proof",
        externalSlug: market.externalSlug,
        externalMarketId: market.externalMarketId,
        conditionId: market.conditionId,
        tokenId: outcome.referenceTokenId,
        side: "ask" as const,
        price: Number((askBase + 0.01).toFixed(2)),
        size: 7900 + outcomeIndex * 100,
        levelIndex: 1,
        fetchedAt,
      },
    ];
  });
  const upserted = await upsertReferenceOrderbookDepthSnapshots(depthRows);
  const after = await callBookRoute(baseUrl, market.id);

  const beforeSummary = summarizeRouteBody(before);
  const afterSummary = summarizeRouteBody(after);
  const summary = {
    generatedAt: new Date().toISOString(),
    eventSlug,
    baseUrl,
    marketId: market.id,
    marketSlug: market.slug,
    outcomeCount: market.outcomes.length,
    rowsRequested: depthRows.length,
    rowsUpserted: upserted.length,
    before: beforeSummary,
    after: afterSummary,
    pass:
      beforeSummary.depthSource !== "provider-orderbook-depth" &&
      afterSummary.depthSource === "provider-orderbook-depth" &&
      afterSummary.providerOrderbookDepth?.status === "ready" &&
      afterSummary.levelCount >= Math.min(4, depthRows.length),
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

async function callBookRoute(baseUrl: string, marketId: string) {
  const response = await fetch(`${baseUrl}/api/orderbook/${encodeURIComponent(marketId)}/book?maxLevels=24`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Book route failed: ${response.status} ${response.statusText}`);
  }
  return await response.json() as Record<string, any>;
}

function summarizeRouteBody(body: Record<string, any>) {
  const levels = Array.isArray(body.levels) ? body.levels : [];
  return {
    depthSource: body.depthSource ?? null,
    depthReason: body.depthReason ?? null,
    emptyState: body.emptyState ?? null,
    levelCount: levels.length,
    firstLevels: levels.slice(0, 6),
    providerOrderbookDepth: body.providerOrderbookDepth ?? null,
    providerQuoteDepth: body.providerQuoteDepth ?? null,
    providerQuoteSnapshot: body.providerQuoteSnapshot
      ? {
          status: body.providerQuoteSnapshot.status,
          snapshotCount: body.providerQuoteSnapshot.snapshotCount,
          shouldRefresh: body.providerQuoteSnapshot.shouldRefresh,
          sources: body.providerQuoteSnapshot.sources,
        }
      : null,
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
