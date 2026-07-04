import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { API_KEY_SCOPES, createApiCredential } from "@/lib/canonicalAuth";
import { GET as getMobileLiveDetail } from "@/app/api/mobile/events/[slug]/live-detail/route";
import { GET as getOrderbookBook } from "@/app/api/orderbook/[marketId]/book/route";
import { GET as getPortfolio } from "@/app/api/portfolio/route";
import { GET as getPortfolioHistory } from "@/app/api/portfolio/history/route";
import { submitCanonicalOrder } from "@/server/services/canonicalOrderSubmission";
import { cancelOrderAndUnlock, placeOrderAndMatch } from "@/server/services/matching";
import { mintCompleteSetForPublicOrderbook } from "@/server/services/orderbookCollateral";
import { upsertReferenceOrderbookDepthSnapshots } from "@/server/services/referenceOrderbookDepthSnapshots";
import { upsertReferenceQuoteSnapshots } from "@/server/services/referenceQuoteSnapshots";

const OUTPUT_PATH = "docs/mobile/harness/cycle-EO-A-route-breadth/proof.json";
const PROVIDER_SOURCE = "polymarket";
const PROVIDER_DEPTH_SOURCE = "polymarket-clob";
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const summaryPath = argValue("summaryPath") ?? argValue("output") ?? OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function createUser(prefix: string, balance = "10000", isAdmin = false) {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `${prefix}_${suffix}`,
      email: `${prefix}_${suffix}@local.test`,
      isAdmin,
    },
  });
  await prisma.userBalance.create({
    data: { userId: user.id, availableUSDC: dec(balance), lockedUSDC: dec("0") },
  });
  return user;
}

async function createProofEvent() {
  const suffix = randomUUID().slice(0, 8);
  const now = new Date();
  const staleMarketSourceUpdatedAt = new Date(now.getTime() - 5 * 60 * 1000);
  return prisma.event.create({
    data: {
      slug: `mobile-eo-a-route-breadth-${suffix}`,
      title: "EO-A Route Breadth Sell Totals",
      description: "Disposable backend event for route-backed provider-depth Book bid/Sell lifecycle breadth proof.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "Route Home",
      awayTeamName: "Route Away",
      status: "live",
      liveStatus: "LIVE",
      period: "Live",
      clock: "72:00",
      homeScore: 1,
      awayScore: 0,
      metadata: {
        providerFixture: {
          providerSource: "polymarket-gamma",
          providerEventSlug: `eo-a-provider-event-${suffix}`,
          providerEventId: `gamma-event-eo-a-${suffix}`,
          sport: "soccer",
          live: true,
          opticOddsApiKeyRequired: false,
        },
        mobileLiveDetail: {
          liveDataStatus: {
            source: "polymarket-gamma",
            status: "ready",
            lastUpdated: now.toISOString(),
            reason: "EO-A route-backed provider-depth bid/Sell lifecycle proof event.",
          },
        },
      },
      markets: {
        create: [
          {
            slug: `mobile-eo-a-total-35-2h-${suffix}`,
            title: "Route Home vs Route Away - Total Goals 3.5 2H",
            description: "EO-A provider-backed totals line selected from live-detail and Book route bid depth.",
            status: "LIVE",
            mechanism: "ORDERBOOK",
            visibility: "PUBLIC",
            kind: "ORDERBOOK",
            type: "BINARY",
            marketType: "total_goals",
            marketGroupKey: "totals",
            marketGroupTitle: "Totals",
            displayOrder: 0,
            period: "2H",
            line: dec("3.5"),
            unit: "goals",
            referenceSource: PROVIDER_SOURCE,
            externalSlug: `eo-a-total-35-2h-${suffix}`,
            externalMarketId: `gamma-eo-a-total-35-2h-${suffix}`,
            conditionId: `condition-eo-a-total-35-2h-${suffix}`,
            sourceUpdatedAt: staleMarketSourceUpdatedAt,
            isListed: true,
            outcomes: {
              create: [
                {
                  name: "Over",
                  label: "Over 3.5 2H",
                  side: "over",
                  code: "OVER",
                  slug: `mobile-eo-a-over-${suffix}`,
                  displayOrder: 0,
                  isActive: true,
                  isTradable: true,
                  referenceTokenId: `token-eo-a-over-${suffix}`,
                  referenceOutcomeLabel: "Over 3.5",
                },
                {
                  name: "Under",
                  label: "Under 3.5 2H",
                  side: "under",
                  code: "UNDER",
                  slug: `mobile-eo-a-under-${suffix}`,
                  displayOrder: 1,
                  isActive: true,
                  isTradable: true,
                  referenceTokenId: `token-eo-a-under-${suffix}`,
                  referenceOutcomeLabel: "Under 3.5",
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      markets: {
        orderBy: { displayOrder: "asc" },
        include: { outcomes: { orderBy: { displayOrder: "asc" } } },
      },
    },
  });
}

async function seedProviderSnapshots(market: Awaited<ReturnType<typeof createProofEvent>>["markets"][number]) {
  const fetchedAt = new Date(Date.now() - 15 * 1000);
  await upsertReferenceQuoteSnapshots(market.outcomes.map((outcome, index) => ({
    marketId: market.id,
    outcomeId: outcome.id,
    source: PROVIDER_SOURCE,
    externalSlug: market.externalSlug,
    externalMarketId: market.externalMarketId,
    conditionId: market.conditionId,
    tokenId: outcome.referenceTokenId,
    outcomeLabel: outcome.referenceOutcomeLabel ?? outcome.name,
    outcomePrice: index === 0 ? 0.61 : 0.39,
    bestBid: index === 0 ? 0.59 : 0.37,
    bestAsk: index === 0 ? 0.63 : 0.41,
    spread: 0.04,
    lastTradePrice: index === 0 ? 0.61 : 0.39,
    volume: 2500,
    volume24hr: 600,
    liquidity: 1800,
    liquidityClob: 2200,
    acceptingOrders: true,
    qualityStatus: "eo_a_ready",
    mmEligible: false,
    reason: "eo_a_route_breadth_seed",
    fetchedAt,
  })));

  const rows = market.outcomes.flatMap((outcome, index) => [
    {
      marketId: market.id,
      outcomeId: outcome.id,
      source: PROVIDER_DEPTH_SOURCE,
      externalSlug: market.externalSlug,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
      tokenId: outcome.referenceTokenId,
      side: "bid" as const,
      price: index === 0 ? 0.59 : 0.37,
      size: index === 0 ? 480 : 430,
      levelIndex: 0,
      fetchedAt,
    },
    {
      marketId: market.id,
      outcomeId: outcome.id,
      source: PROVIDER_DEPTH_SOURCE,
      externalSlug: market.externalSlug,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
      tokenId: outcome.referenceTokenId,
      side: "ask" as const,
      price: index === 0 ? 0.63 : 0.41,
      size: index === 0 ? 390 : 410,
      levelIndex: 0,
      fetchedAt,
    },
  ]);
  await upsertReferenceOrderbookDepthSnapshots(rows);

  await prisma.marketOutcomeSnapshot.createMany({
    data: market.outcomes.map((outcome, index) => ({
      marketId: market.id,
      outcomeId: outcome.id,
      ts: fetchedAt,
      price: dec(index === 0 ? "0.61" : "0.39"),
    })),
  });
}

async function readLiveDetailRoute(eventSlug: string) {
  const response = await getMobileLiveDetail(
    new Request(`http://localhost/api/mobile/events/${encodeURIComponent(eventSlug)}/live-detail`),
    { params: Promise.resolve({ slug: eventSlug }) },
  );
  const body = await response.json();
  assert(response.status === 200, `Expected live-detail route status 200, got ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function readOrderbookBookRoute(marketId: string) {
  const response = await getOrderbookBook(
    new NextRequest(`http://localhost/api/orderbook/${encodeURIComponent(marketId)}/book?maxLevels=24`),
    { params: Promise.resolve({ marketId }) },
  );
  const body = await response.json();
  assert(response.status === 200, `Expected Book route status 200, got ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

const authRequest = (url: string, token: string) =>
  new NextRequest(url, { headers: { Authorization: `Bearer ${token}` } });

async function readPortfolio(token: string) {
  const response = await getPortfolio(authRequest("http://localhost/api/portfolio", token));
  const body = await response.json();
  assert(response.status === 200, `Expected /api/portfolio status 200, got ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function readPortfolioHistory(token: string) {
  const response = await getPortfolioHistory(authRequest("http://localhost/api/portfolio/history", token));
  const body = await response.json();
  assert(response.status === 200, `Expected /api/portfolio/history status 200, got ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

const pickSelectionIdentity = (selection: Record<string, unknown> | null | undefined) => ({
  marketId: selection?.marketId,
  outcomeId: selection?.outcomeId,
  marketType: selection?.marketType,
  marketGroupId: selection?.marketGroupId,
  line: selection?.line,
  period: selection?.period,
  side: selection?.side,
  displayLabel: selection?.displayLabel,
  contractSide: selection?.contractSide,
  referenceSource: selection?.referenceSource,
  providerSource: selection?.providerSource,
  externalSlug: selection?.externalSlug,
  externalMarketId: selection?.externalMarketId,
  conditionId: selection?.conditionId,
  referenceTokenId: selection?.referenceTokenId,
  tokenId: selection?.tokenId,
  referenceOutcomeLabel: selection?.referenceOutcomeLabel,
  limitPrice: selection?.limitPrice,
  limitSide: selection?.limitSide,
  limitShares: selection?.limitShares,
});

const expectedIdentityFields = Object.keys(pickSelectionIdentity({})) as Array<keyof ReturnType<typeof pickSelectionIdentity>>;

function assertSameIdentity(
  label: string,
  actual: ReturnType<typeof pickSelectionIdentity>,
  expected: ReturnType<typeof pickSelectionIdentity>,
) {
  for (const field of expectedIdentityFields) {
    assert(actual[field] === expected[field], `${label}.${field} expected ${String(expected[field])}, got ${String(actual[field])}`);
  }
}

function selectedLimitSelectionFromRoutes(liveDetailPayload: any, bookPayload: any, marketId: string, outcomeId: string) {
  assert(bookPayload.marketId === marketId, `Book route marketId expected ${marketId}, got ${bookPayload.marketId}`);
  assert(bookPayload.marketIdentity?.marketId === marketId, "Book route marketIdentity did not preserve marketId.");
  assert(bookPayload.marketIdentity?.marketFamily === "total", `Book route marketFamily expected total, got ${bookPayload.marketIdentity?.marketFamily}`);
  assert(bookPayload.marketIdentity?.marketType === "total_goals", `Book route marketType expected total_goals, got ${bookPayload.marketIdentity?.marketType}`);
  assert(bookPayload.marketIdentity?.marketGroupId === "totals", `Book route marketGroupId expected totals, got ${bookPayload.marketIdentity?.marketGroupId}`);
  assert(bookPayload.marketIdentity?.period === "2H", `Book route period expected 2H, got ${bookPayload.marketIdentity?.period}`);
  assert(bookPayload.marketIdentity?.line === "3.5", `Book route line expected 3.5, got ${bookPayload.marketIdentity?.line}`);
  assert(bookPayload.availability?.source === "provider-lifecycle", `Book route availability source expected provider-lifecycle, got ${bookPayload.availability?.source}`);
  assert(bookPayload.availability?.status === "ready", `Book route availability expected ready, got ${bookPayload.availability?.status}`);

  const bookOutcome = bookPayload.marketIdentity.outcomes.find((item: any) => item.id === outcomeId || item.outcomeId === outcomeId);
  assert(bookOutcome, "Book route market identity did not include selected outcome.");
  const bidLevel = bookPayload.levels.find((level: any) => level.outcomeId === outcomeId && level.side === "bid");
  assert(bidLevel, "Book route provider depth did not include selected bid level.");

  const market = liveDetailPayload.markets.find((item: any) => item.id === marketId);
  assert(market, `live-detail did not include selected market ${marketId}.`);
  assert(market.orderbookDepthSource === "provider-orderbook-depth", `expected provider orderbook depth, got ${market.orderbookDepthSource}`);
  assert(market.providerOrderbookDepth.status === "ready", `expected ready provider depth, got ${market.providerOrderbookDepth.status}`);
  assert(market.providerLifecycle.ready === true, "expected live-detail provider lifecycle to be ready.");

  const outcome = market.outcomes.find((item: any) => item.id === outcomeId);
  assert(outcome, `live-detail did not include selected outcome ${outcomeId}.`);
  const selectorOutcome = market.selection.outcomes.find((item: any) => item.outcomeId === outcomeId || item.id === outcomeId);
  assert(selectorOutcome, "live-detail selection contract did not include selected outcome.");
  const liveDetailBidLevel = market.orderbookDepth.find((level: any) => level.outcomeId === outcomeId && level.side === "bid");
  assert(liveDetailBidLevel, "live-detail provider depth did not include selected bid level.");
  assert(liveDetailBidLevel.price === bidLevel.price, "live-detail bid price did not match Book route bid price.");
  assert(liveDetailBidLevel.shares === bidLevel.shares, "live-detail bid shares did not match Book route bid shares.");

  return {
    market,
    outcome,
    bidLevel,
    bookMarketIdentity: bookPayload.marketIdentity,
    bookAvailability: bookPayload.availability,
    selection: {
      marketId: market.id,
      outcomeId: outcome.id,
      marketType: market.selection.marketType,
      marketGroupId: market.selection.marketGroupId,
      line: market.selection.line,
      period: market.selection.period,
      side: outcome.side,
      displayLabel: outcome.label ?? market.selection.displayLabel,
      contractSide: "yes",
      referenceSource: market.referenceSource,
      providerSource: market.orderbookIdentity.providerSource ?? market.referenceSource,
      externalSlug: market.externalSlug,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
      referenceTokenId: outcome.referenceTokenId,
      tokenId: selectorOutcome.tokenId,
      referenceOutcomeLabel: outcome.referenceOutcomeLabel,
      limitPrice: bidLevel.price,
      limitSide: bidLevel.side,
      limitShares: bidLevel.shares,
    },
  };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to create EO-A route breadth proof state in production.");
  }

  const opticOddsCredential = process.env.OPTIC_ODDS_API_KEY ? "configured" : "missing_non_blocking";
  const event = await createProofEvent();
  const market = event.markets[0];
  const outcome = market?.outcomes.find((item) => item.side === "over") ?? market?.outcomes[0];
  assert(market, "Proof event did not create a market.");
  assert(outcome, "Proof market did not create a selected outcome.");
  await seedProviderSnapshots(market);

  const liveDetail = await readLiveDetailRoute(event.slug!);
  const book = await readOrderbookBookRoute(market.id);
  const selected = selectedLimitSelectionFromRoutes(liveDetail, book, market.id, outcome.id);
  const expectedIdentity = pickSelectionIdentity(selected.selection);

  const proofUser = await createUser("holiwyn_eo_a_route_breadth_user", "10000", true);
  const makerUser = await createUser("holiwyn_eo_a_route_breadth_maker", "10000", true);
  const credential = await createApiCredential({
    userId: proofUser.id,
    name: `eo-a-route-breadth-${new Date().toISOString()}`,
    scopes: [...API_KEY_SCOPES],
  });

  const openOrderRequest = {
    marketId: market.id,
    outcomeId: outcome.id,
    side: "SELL",
    type: "LIMIT",
    price: String(selected.selection.limitPrice),
    size: "10",
    clientOrderId: `eo-a-open-sell-${randomUUID()}`,
    contractSide: "YES",
    selection: selected.selection,
  };
  await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: proofUser.id, quantity: "50" });
  const openOrderResult = await submitCanonicalOrder({
    userId: proofUser.id,
    apiCredentialId: credential.apiKey.id,
    apiKeyId: credential.apiKey.keyId,
    body: openOrderRequest,
    idempotencyKeyHeader: `eo-a-open-sell-${randomUUID()}`,
  });
  assert("order" in openOrderResult.body, `open order failed: ${JSON.stringify(openOrderResult.body)}`);
  assert(openOrderResult.body.order.status === "OPEN", `expected open order, got ${openOrderResult.body.order.status}`);
  assertSameIdentity("orderResponse.selection", pickSelectionIdentity(openOrderResult.body.order.selection), expectedIdentity);

  const portfolioWithOpenOrder = await readPortfolio(credential.token);
  const openOrder = portfolioWithOpenOrder.openOrders.find((item: { id: string }) => item.id === openOrderResult.body.order.id);
  assert(openOrder, "Expected route-backed Book limit order in portfolio openOrders.");
  assertSameIdentity("portfolio.openOrder.selection", pickSelectionIdentity(openOrder.selection), expectedIdentity);

  const canceled = await cancelOrderAndUnlock({
    orderId: openOrderResult.body.order.id,
    userId: proofUser.id,
    apiCredentialId: credential.apiKey.id,
  });
  assert(canceled.order.status === "CANCELED", `expected canceled order, got ${canceled.order.status}`);
  const historyAfterCancel = await readPortfolioHistory(credential.token);
  const canceledActivity = historyAfterCancel.canceledOrders.find((item: { id: string }) => item.id === openOrderResult.body.order.id);
  assert(canceledActivity, "Expected route-backed Book limit order in canceled activity.");
  assertSameIdentity("history.canceled.selection", pickSelectionIdentity(canceledActivity.selection), expectedIdentity);

  const makerBid = await placeOrderAndMatch({
    marketId: market.id,
    userId: makerUser.id,
    outcomeId: outcome.id,
    side: "BUY",
    price: String(selected.selection.limitPrice),
    size: "12",
    type: "LIMIT",
  });
  assert(makerBid.order.status === "OPEN", `expected maker bid to rest, got ${makerBid.order.status}`);

  const fillOrderRequest = {
    marketId: market.id,
    outcomeId: outcome.id,
    side: "SELL",
    type: "LIMIT",
    price: String(selected.selection.limitPrice),
    size: "12",
    clientOrderId: `eo-a-fill-sell-${randomUUID()}`,
    contractSide: "YES",
    selection: selected.selection,
  };
  const fillOrderResult = await submitCanonicalOrder({
    userId: proofUser.id,
    apiCredentialId: credential.apiKey.id,
    apiKeyId: credential.apiKey.keyId,
    body: fillOrderRequest,
    idempotencyKeyHeader: `eo-a-fill-sell-${randomUUID()}`,
  });
  assert("order" in fillOrderResult.body, `fill order failed: ${JSON.stringify(fillOrderResult.body)}`);
  assert(fillOrderResult.body.order.status === "FILLED", `expected filled order, got ${fillOrderResult.body.order.status}`);
  assert(fillOrderResult.body.fills.length > 0, "Expected route-backed limit order to produce a fill.");
  assertSameIdentity("fillOrderResponse.selection", pickSelectionIdentity(fillOrderResult.body.order.selection), expectedIdentity);

  const portfolioAfterFill = await readPortfolio(credential.token);
  const position = portfolioAfterFill.positions.find(
    (item: { market?: { id?: string }; outcomeId?: string }) =>
      item.market?.id === market.id && item.outcomeId === outcome.id,
  );
  assert(position, "Expected route-backed Book limit fill in portfolio positions.");
  assertSameIdentity("portfolio.position.selection", pickSelectionIdentity(position.selection), expectedIdentity);

  const historyAfterFill = await readPortfolioHistory(credential.token);
  const recentTrade = historyAfterFill.recentTrades.find(
    (item: { market?: { id?: string }; outcome?: { id?: string } }) =>
      item.market?.id === market.id && item.outcome?.id === outcome.id,
  );
  assert(recentTrade, "Expected route-backed Book limit fill in recent trade activity.");
  assertSameIdentity("history.recentTrade.selection", pickSelectionIdentity(recentTrade.selection), expectedIdentity);

  const assertions = {
    liveDetailProviderDepthReady:
      selected.market.orderbookDepthSource === "provider-orderbook-depth" &&
      selected.market.providerOrderbookDepth.status === "ready" &&
      selected.market.providerLifecycle.ready === true,
    liveDetailSelectionIncludesProviderToken:
      selected.selection.tokenId === outcome.referenceTokenId &&
      selected.selection.referenceTokenId === outcome.referenceTokenId,
    bookRouteProviderLifecycleReady:
      selected.bookAvailability.source === "provider-lifecycle" &&
      selected.bookAvailability.status === "ready",
    totalsMarketFamilyPreserved:
      selected.bookMarketIdentity.marketFamily === "total" &&
      selected.bookMarketIdentity.marketType === "total_goals" &&
      selected.bookMarketIdentity.marketGroupId === "totals",
    limitFieldsBornFromProviderBid:
      selected.selection.limitPrice === selected.bidLevel.price &&
      selected.selection.limitSide === "bid" &&
      selected.selection.limitShares === selected.bidLevel.shares,
    sellOrderResponsePreservesIdentityAndLimit: openOrderResult.body.order.side === "SELL",
    portfolioOpenSellOrderPreservesIdentityAndLimit: openOrder.side === "SELL",
    canceledSellActivityPreservesIdentityAndLimit: canceledActivity.side === "SELL",
    filledSellOrderPreservesIdentityAndLimit: fillOrderResult.body.order.side === "SELL",
    portfolioPositionPreservesIdentityAndLimit: true,
    recentSellActivityPreservesIdentityAndLimit: recentTrade.side === "SELL",
    missingOpticOddsApiKeyIsNonBlocking:
      opticOddsCredential === "configured" || selected.market.providerLifecycle.ready === true,
  };

  const summary = {
    pass: Object.values(assertions).every(Boolean),
    generatedAt: new Date().toISOString(),
    proof: "EO-A proves a bid-side Sell limit selection born from /api/mobile/events/:slug/live-detail and /api/orderbook/:marketId/book provider orderbook depth preserves totals market/outcome/line/provider/limit identity through order creation, portfolio, and history contracts.",
    opticOddsCredential,
    routes: {
      liveDetail: "/api/mobile/events/:slug/live-detail",
      book: "/api/orderbook/:marketId/book",
      orderCreation: "canonical order service backing POST /api/orders",
      portfolio: "/api/portfolio",
      portfolioHistory: "/api/portfolio/history",
    },
    setup: {
      eventSlug: event.slug,
      marketId: market.id,
      outcomeId: outcome.id,
      providerSource: PROVIDER_SOURCE,
      providerDepthSource: PROVIDER_DEPTH_SOURCE,
    },
    liveDetailSelection: {
      market: {
        id: selected.market.id,
        orderbookDepthSource: selected.market.orderbookDepthSource,
        providerOrderbookDepth: selected.market.providerOrderbookDepth,
        orderbookIdentity: selected.market.orderbookIdentity,
      },
      bookMarketIdentity: selected.bookMarketIdentity,
      bookAvailability: selected.bookAvailability,
      bidLevel: selected.bidLevel,
      selection: expectedIdentity,
    },
    orderRequest: pickSelectionIdentity(openOrderRequest.selection),
    orderResponse: {
      id: openOrderResult.body.order.id,
      side: openOrderResult.body.order.side,
      status: openOrderResult.body.order.status,
      selection: pickSelectionIdentity(openOrderResult.body.order.selection),
    },
    portfolioOpenOrder: {
      id: openOrder.id,
      side: openOrder.side,
      status: openOrder.status,
      selection: pickSelectionIdentity(openOrder.selection),
    },
    canceledActivity: {
      id: canceledActivity.id,
      side: canceledActivity.side,
      status: canceledActivity.status,
      selection: pickSelectionIdentity(canceledActivity.selection),
    },
    fillOrderResponse: {
      id: fillOrderResult.body.order.id,
      side: fillOrderResult.body.order.side,
      status: fillOrderResult.body.order.status,
      fillCount: fillOrderResult.body.fills.length,
      selection: pickSelectionIdentity(fillOrderResult.body.order.selection),
    },
    portfolioPosition: {
      marketId: position.market.id,
      outcomeId: position.outcomeId,
      shares: position.shares,
      avgCost: position.avgCost,
      selection: pickSelectionIdentity(position.selection),
    },
    recentActivity: {
      id: recentTrade.id,
      side: recentTrade.side,
      shares: recentTrade.shares,
      cost: recentTrade.cost,
      selection: pickSelectionIdentity(recentTrade.selection),
    },
    assertions,
    remainingGaps: [
      "Order creation uses the canonical service backing POST /api/orders so the proof can run without depending on local trading-beta environment flags; portfolio and history are read through route handlers.",
      "There is still no immutable first-class Order/Trade/Position selection snapshot column; filled position and recent trade identity use the existing guarded ApiOrderRequest selection bridge.",
      "This proof uses disposable Polymarket-shaped provider rows, not a production live Polymarket event.",
    ],
  };

  const resolved = path.resolve(summaryPath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

  if (!summary.pass) process.exitCode = 1;
}

main()
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
