import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { selectCompactLiveMarkets, serializeMobileLiveEventDetail } from "@/server/services/mobileLiveEventDetail";
import { extractProviderFixtureMetadataFromEventMetadata } from "@/server/services/mobileLiveProviderFixtureMetadata";
import { reviewMobileLiveLineProviderIdentities, type LineProviderMarketReviewInput } from "@/server/services/mobileLiveLineProviderIdentityReview";
import { buildOpticOddsReferenceQuoteRows, type OpticOddsFixtureOddsResponse } from "@/server/services/mobileLiveOpticOddsLineIngestion";
import { expireMobileLiveProviderQuoteSnapshots, refreshMobileLiveProviderQuoteSnapshots } from "@/server/services/mobileLiveProviderRefresh";
import { upsertReferenceQuoteSnapshots } from "@/server/services/referenceQuoteSnapshots";

const DEFAULT_EVENT_SLUG = "world-cup-2026-colombia-vs-ghana-2026-07-03";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-current-mobile-line-provider-refresh-execution.json";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const eventSlug = args.eventSlug ?? DEFAULT_EVENT_SLUG;
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;

  process.env.OPTIC_ODDS_API_KEY = process.env.OPTIC_ODDS_API_KEY || "cycle-dj-proof-key";
  process.env.OPTIC_ODDS_SPORTSBOOKS = process.env.OPTIC_ODDS_SPORTSBOOKS || "BetMGM";

  const event = await loadEvent(eventSlug);
  const providerFixture = extractProviderFixtureMetadataFromEventMetadata(event.metadata);
  if (!providerFixture?.opticOddsFixtureId) throw new Error(`Event ${eventSlug} is missing OpticOdds fixture identity.`);

  const compactMarkets = selectCompactLiveMarkets(event.markets);
  const lineMarkets = compactMarkets.filter((market) => ["spread", "total_goals", "totals", "team_total_goals"].includes(market.marketType));
  if (lineMarkets.length === 0) throw new Error(`Event ${eventSlug} has no compact line markets.`);

  const reviews = lineMarkets.map((market) => buildReview({
    fixtureId: providerFixture.opticOddsFixtureId!,
    gameId: providerFixture.opticOddsGameId,
    market,
  }));
  const apply = await reviewMobileLiveLineProviderIdentities({
    eventSlug,
    dryRun: false,
    confirmApply: true,
    reviews,
  });
  if (!apply.applied) throw new Error("Line provider identity apply did not complete.");

  const reviewedEvent = await loadEvent(eventSlug);
  const reviewedCompactMarkets = selectCompactLiveMarkets(reviewedEvent.markets);
  const reviewedLineMarkets = reviewedCompactMarkets.filter((market) => lineMarkets.some((lineMarket) => lineMarket.id === market.id));
  const providerResponse = buildProviderResponse(providerFixture.opticOddsFixtureId, providerFixture.opticOddsGameId, reviews);
  const staleFetchedAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const staleRows = buildOpticOddsReferenceQuoteRows({
    providerFixture,
    compactMarkets: reviewedLineMarkets,
    response: providerResponse,
    fetchedAt: staleFetchedAt,
  });
  await upsertReferenceQuoteSnapshots(staleRows);

  const before = await summarizeLiveDetail(eventSlug, lineMarkets.map((market) => market.id));
  const expired = await expireMobileLiveProviderQuoteSnapshots({ eventSlug, staleSeconds: 300 });
  const fetchCalls: Array<{ url: string; apiKey: string | null }> = [];
  const refresh = await refreshMobileLiveProviderQuoteSnapshots({
    eventSlug,
    allowContractProofFallback: false,
    lineProviderFetchImpl: async (input, init) => {
      fetchCalls.push({
        url: input instanceof URL ? input.toString() : String(input),
        apiKey: init?.headers && typeof init.headers === "object" && !Array.isArray(init.headers)
          ? String((init.headers as Record<string, string>)["X-Api-Key"] ?? "")
          : null,
      });
      return new Response(JSON.stringify(providerResponse), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });
  const after = await summarizeLiveDetail(eventSlug, lineMarkets.map((market) => market.id));

  const summary = {
    generatedAt: new Date().toISOString(),
    eventSlug,
    providerEventSlug: providerFixture.providerEventSlug,
    opticOddsFixtureId: providerFixture.opticOddsFixtureId,
    mode: "line-provider-refresh-execution",
    lineMarketCount: lineMarkets.length,
    reviewedMarketCount: reviews.length,
    apply: {
      applied: apply.applied,
      blocked: apply.blocked,
      before: apply.before,
      after: apply.after,
      nextRequiredAction: apply.nextRequiredAction,
    },
    staleSeed: {
      fetchedAt: staleFetchedAt,
      rowCount: staleRows.length,
      marketCount: new Set(staleRows.map((row) => row.marketId)).size,
    },
    before,
    expired,
    refresh: {
      providerSnapshotsUpdated: refresh.provider.snapshotsUpdated,
      lineProvider: refresh.lineProvider,
      contractProofFallback: refresh.contractProofFallback,
      postRefresh: refresh.postRefresh,
    },
    after,
    fetchCalls,
    pass:
      apply.applied === true &&
      staleRows.length === reviews.reduce((count, review) => count + review.outcomes.length, 0) &&
      before.targetLineMarkets.every((market) => market.providerQuoteSnapshot.status === "stale" && market.providerQuoteSnapshot.shouldRefresh) &&
      refresh.lineProvider.attempted === true &&
      refresh.lineProvider.status === "ready" &&
      refresh.lineProvider.snapshotsUpdated === staleRows.length &&
      refresh.contractProofFallback == null &&
      after.contract.batchedProviderQuoteSnapshotReadyCount >= before.contract.batchedProviderQuoteSnapshotReadyCount &&
      after.targetLineMarkets.every((market) => market.providerQuoteSnapshot.status === "ready" && !market.providerQuoteSnapshot.shouldRefresh),
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.pass) process.exitCode = 1;
}

async function loadEvent(eventSlug: string) {
  const event = await prisma.event.findFirst({
    where: { slug: eventSlug },
    include: {
      markets: {
        where: { status: "LIVE", visibility: "PUBLIC", mechanism: "ORDERBOOK" },
        orderBy: [{ marketGroupKey: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
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
  return event;
}

async function summarizeLiveDetail(eventSlug: string, targetMarketIds: string[]) {
  const event = await loadEvent(eventSlug);
  const compactMarkets = selectCompactLiveMarkets(event.markets);
  const primaryMarketId = compactMarkets[0]?.id ?? null;
  const chartSnapshots = primaryMarketId
    ? await prisma.marketOutcomeSnapshot.findMany({
        where: { marketId: primaryMarketId },
        orderBy: { ts: "asc" },
        take: 240,
      })
    : [];
  const detail = await serializeMobileLiveEventDetail({ event, chartSnapshots });
  return {
    contract: detail.contract,
    targetLineMarkets: detail.markets
      .filter((market) => targetMarketIds.includes(market.id))
      .map((market) => ({
        marketId: market.id,
        title: market.title,
        marketType: market.marketType,
        line: market.line,
        providerQuoteSnapshot: market.providerQuoteSnapshot,
      })),
  };
}

function buildReview(params: {
  fixtureId: string;
  gameId?: string | null;
  market: {
    id: string;
    marketType: string;
    line: unknown;
    period: string | null;
    outcomes: Array<{ id: string; name: string; label: string | null; side: string | null }>;
  };
}): LineProviderMarketReviewInput {
  const providerMarketId = providerMarketIdForLocalType(params.market.marketType);
  return {
    marketId: params.market.id,
    providerSource: "optic_odds",
    fixtureId: params.fixtureId,
    gameId: params.gameId,
    sportsbook: "BetMGM",
    providerMarketId,
    providerMarketName: providerMarketId,
    points: params.market.line == null ? null : Math.abs(Number(params.market.line)),
    period: params.market.period,
    outcomes: params.market.outcomes.map((outcome) => ({
      outcomeId: outcome.id,
      providerOddId: providerOddId(params.fixtureId, providerMarketId, params.market.id, outcome.id),
      selection: outcome.label ?? outcome.name,
      selectionLine: outcome.side,
      teamId: outcome.side === "away" ? "optic-away-contract" : outcome.side === "home" ? "optic-home-contract" : null,
    })),
  };
}

function buildProviderResponse(
  fixtureId: string,
  gameId: string | null | undefined,
  reviews: LineProviderMarketReviewInput[],
): OpticOddsFixtureOddsResponse {
  const odds = reviews.flatMap((review, reviewIndex) =>
    review.outcomes.map((outcome, outcomeIndex) => ({
      id: outcome.providerOddId,
      sportsbook: review.sportsbook,
      market: review.providerMarketName ?? review.providerMarketId,
      market_id: review.providerMarketId,
      name: outcome.selection,
      selection: outcome.selection,
      normalized_selection: outcome.selection.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      selection_line: outcome.selectionLine,
      team_id: outcome.teamId,
      price: Number((0.41 + reviewIndex * 0.04 + outcomeIndex * 0.08).toFixed(4)),
      points: review.points,
      is_main: true,
      timestamp: new Date().toISOString(),
    })),
  );
  return {
    data: [{
      id: fixtureId,
      game_id: gameId,
      status: "live",
      is_live: true,
      home_competitors: [{ id: "optic-home-contract", name: "Colombia", abbreviation: "COL" }],
      away_competitors: [{ id: "optic-away-contract", name: "Ghana", abbreviation: "GHA" }],
      odds,
    }],
  };
}

function providerMarketIdForLocalType(marketType: string) {
  if (marketType === "spread") return "point_spread";
  if (marketType === "team_total_goals") return "team_total_goals";
  return "total_goals";
}

function providerOddId(fixtureId: string, providerMarketId: string, marketId: string, outcomeId: string) {
  return `${fixtureId}:${providerMarketId}:${marketId}:${outcomeId}`;
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
