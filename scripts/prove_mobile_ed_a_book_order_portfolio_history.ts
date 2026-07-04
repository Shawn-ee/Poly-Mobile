import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { API_KEY_SCOPES, createApiCredential } from "@/lib/canonicalAuth";
import { GET as getPortfolio } from "@/app/api/portfolio/route";
import { GET as getPortfolioHistory } from "@/app/api/portfolio/history/route";
import { submitCanonicalOrder } from "@/server/services/canonicalOrderSubmission";
import { cancelOrderAndUnlock, placeOrderAndMatch } from "@/server/services/matching";
import { mintCompleteSetForPublicOrderbook } from "@/server/services/orderbookCollateral";
import { upsertReferenceOrderbookDepthSnapshots } from "@/server/services/referenceOrderbookDepthSnapshots";

const OUTPUT_PATH = "docs/mobile/harness/cycle-ED-A-book-order-portfolio-history.json";
const DEFAULT_BASE_URL = "http://127.0.0.1:3012";
const PROVIDER_DEPTH_SOURCE = "polymarket-clob-ed-book-lifecycle-proof";
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const summaryPath = argValue("summaryPath") ?? argValue("output") ?? OUTPUT_PATH;
const baseUrl = (argValue("baseUrl") ?? DEFAULT_BASE_URL).replace(/\/+$/, "");

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

const jsonRequest = (url: string, token: string) =>
  new NextRequest(url, { headers: { Authorization: `Bearer ${token}` } });

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
});

const expectedIdentityFields = [
  "marketId",
  "outcomeId",
  "marketType",
  "marketGroupId",
  "line",
  "period",
  "side",
  "displayLabel",
  "contractSide",
  "referenceSource",
  "providerSource",
  "externalSlug",
  "externalMarketId",
  "conditionId",
  "referenceTokenId",
  "tokenId",
  "referenceOutcomeLabel",
] as const;

function assertSameIdentity(
  label: string,
  actual: ReturnType<typeof pickSelectionIdentity>,
  expected: ReturnType<typeof pickSelectionIdentity>,
) {
  for (const field of expectedIdentityFields) {
    assert(
      actual[field] === expected[field],
      `${label}.${field} expected ${String(expected[field])}, got ${String(actual[field])}`,
    );
  }
}

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

async function createProviderBackedBookLineMarket() {
  const suffix = randomUUID().slice(0, 8);
  return prisma.market.create({
    data: {
      slug: `ed-a-book-lifecycle-spread-${suffix}`,
      title: "Spain vs Japan - Provider Book Spread",
      description: "ED-A backend proof market for selected Book identity lifecycle.",
      status: "LIVE",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      kind: "ORDERBOOK",
      type: "BINARY",
      marketType: "spread",
      marketGroupKey: "spreads",
      marketGroupTitle: "Spreads",
      displayOrder: 30,
      line: dec("-0.5"),
      period: "2H",
      unit: "goals",
      participantType: "team",
      participantName: "Spain",
      propCategory: "world-cup-book-lifecycle-proof",
      referenceSource: "polymarket",
      externalSlug: `ed-a-spain-japan-spread-2h-${suffix}`,
      externalMarketId: `gamma-ed-a-spain-japan-spread-2h-${suffix}`,
      conditionId: `condition-ed-a-spain-japan-spread-2h-${suffix}`,
      sourceUpdatedAt: new Date(),
      isListed: true,
      isCanceled: false,
      outcomes: {
        create: [
          {
            name: "YES",
            label: "Spain",
            side: "yes",
            code: "YES",
            slug: `ed-a-spain-spread-yes-${suffix}`,
            displayOrder: 0,
            isActive: true,
            isTradable: true,
            referenceTokenId: `token-ed-a-spain-spread-yes-${suffix}`,
            referenceOutcomeLabel: "Spain -0.5",
          },
          {
            name: "NO",
            label: "Japan",
            side: "no",
            code: "NO",
            slug: `ed-a-spain-spread-no-${suffix}`,
            displayOrder: 1,
            isActive: true,
            isTradable: true,
            referenceTokenId: `token-ed-a-spain-spread-no-${suffix}`,
            referenceOutcomeLabel: "Japan +0.5",
          },
        ],
      },
    },
    include: { outcomes: { orderBy: { displayOrder: "asc" } } },
  });
}

async function seedProviderBookDepth(market: Awaited<ReturnType<typeof createProviderBackedBookLineMarket>>) {
  const fetchedAt = new Date();
  const rows = market.outcomes.flatMap((outcome, outcomeIndex) => {
    const bid = outcomeIndex === 0 ? 0.58 : 0.39;
    const ask = outcomeIndex === 0 ? 0.62 : 0.43;
    return [
      {
        marketId: market.id,
        outcomeId: outcome.id,
        source: PROVIDER_DEPTH_SOURCE,
        externalSlug: market.externalSlug,
        externalMarketId: market.externalMarketId,
        conditionId: market.conditionId,
        tokenId: outcome.referenceTokenId,
        side: "bid" as const,
        price: bid,
        size: 4200 + outcomeIndex * 400,
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
        price: ask,
        size: 3900 + outcomeIndex * 350,
        levelIndex: 0,
        fetchedAt,
      },
    ];
  });
  return upsertReferenceOrderbookDepthSnapshots(rows);
}

async function readBook(marketId: string) {
  const response = await fetch(`${baseUrl}/api/orderbook/${marketId}/book?maxLevels=24`);
  const body = await response.json();
  assert(response.status === 200, `expected /api/orderbook/:marketId/book 200, got ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function readPortfolio(token: string) {
  const response = await getPortfolio(jsonRequest("http://localhost/api/portfolio", token));
  const body = await response.json();
  assert(response.status === 200, `expected /api/portfolio 200, got ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function readPortfolioHistory(token: string) {
  const response = await getPortfolioHistory(jsonRequest("http://localhost/api/portfolio/history", token));
  const body = await response.json();
  assert(response.status === 200, `expected /api/portfolio/history 200, got ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to create ED-A mobile lifecycle proof state in production.");
  }

  const market = await createProviderBackedBookLineMarket();
  const depthRows = await seedProviderBookDepth(market);
  const outcome = market.outcomes.find((item) => item.side === "yes") ?? market.outcomes[0];
  assert(outcome, "Proof market has no selected outcome.");

  const book = await readBook(market.id);
  const bookIdentity = book.marketIdentity as Record<string, unknown>;
  const bookOutcome = ((bookIdentity.outcomes as Array<Record<string, unknown>> | undefined) ?? [])
    .find((item) => item.id === outcome.id || item.outcomeId === outcome.id);
  assert(bookOutcome, "Book response did not include selected outcome identity.");
  assert(book.depthSource === "provider-orderbook-depth", `expected provider orderbook depth, got ${String(book.depthSource)}`);
  assert(bookOutcome.tokenId === outcome.referenceTokenId, "Book outcome token id did not match selected provider token.");

  const proofUser = await createUser("holiwyn_ed_a_book_lifecycle_user", "10000", true);
  const makerUser = await createUser("holiwyn_ed_a_book_lifecycle_maker", "10000", true);
  const credential = await createApiCredential({
    userId: proofUser.id,
    name: `ed-a-book-lifecycle-${new Date().toISOString()}`,
    scopes: [...API_KEY_SCOPES],
  });

  const expectedIdentity = {
    marketId: market.id,
    outcomeId: outcome.id,
    marketType: bookIdentity.marketType,
    marketGroupId: bookIdentity.marketGroupId,
    line: bookIdentity.line,
    period: bookIdentity.period,
    side: outcome.side,
    displayLabel: [outcome.label, bookIdentity.line, bookIdentity.period].filter(Boolean).join(" "),
    contractSide: "yes",
    referenceSource: market.referenceSource,
    providerSource: market.referenceSource,
    externalSlug: market.externalSlug,
    externalMarketId: market.externalMarketId,
    conditionId: market.conditionId,
    referenceTokenId: outcome.referenceTokenId,
    tokenId: bookOutcome.tokenId,
    referenceOutcomeLabel: outcome.referenceOutcomeLabel,
  };

  const openOrderRequest = {
    marketId: market.id,
    outcomeId: outcome.id,
    side: "BUY",
    type: "LIMIT",
    price: "0.32",
    size: "10",
    clientOrderId: `ed-a-open-${randomUUID()}`,
    contractSide: "YES",
    selection: expectedIdentity,
  };
  const openOrderResult = await submitCanonicalOrder({
    userId: proofUser.id,
    apiCredentialId: credential.apiKey.id,
    apiKeyId: credential.apiKey.keyId,
    body: openOrderRequest,
    idempotencyKeyHeader: `ed-a-open-${randomUUID()}`,
  });
  assert("order" in openOrderResult.body, `open order request failed: ${JSON.stringify(openOrderResult.body)}`);
  assert(openOrderResult.body.order.status === "OPEN", `expected open order, got ${openOrderResult.body.order.status}`);
  assertSameIdentity("orderResponse.selection", pickSelectionIdentity(openOrderResult.body.order.selection), expectedIdentity);

  const portfolioWithOpenOrder = await readPortfolio(credential.token);
  const openOrder = portfolioWithOpenOrder.openOrders.find(
    (item: { id: string }) => item.id === openOrderResult.body.order.id,
  );
  assert(openOrder, "Expected selected Book order in portfolio openOrders.");
  assertSameIdentity("portfolio.openOrder.selection", pickSelectionIdentity(openOrder.selection), expectedIdentity);

  const canceled = await cancelOrderAndUnlock({
    orderId: openOrderResult.body.order.id,
    userId: proofUser.id,
    apiCredentialId: credential.apiKey.id,
  });
  assert(canceled.order.status === "CANCELED", `expected canceled order, got ${canceled.order.status}`);

  const historyAfterCancel = await readPortfolioHistory(credential.token);
  const canceledActivity = historyAfterCancel.canceledOrders.find(
    (item: { id: string }) => item.id === openOrderResult.body.order.id,
  );
  assert(canceledActivity, "Expected selected Book order in portfolio canceled activity.");
  assertSameIdentity("history.canceled.selection", pickSelectionIdentity(canceledActivity.selection), expectedIdentity);

  await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: makerUser.id, quantity: "25" });
  const makerAsk = await placeOrderAndMatch({
    marketId: market.id,
    userId: makerUser.id,
    outcomeId: outcome.id,
    side: "SELL",
    price: "0.44",
    size: "12",
    type: "LIMIT",
  });
  assert(makerAsk.order.status === "OPEN", `expected maker ask to rest, got ${makerAsk.order.status}`);

  const fillOrderRequest = {
    marketId: market.id,
    outcomeId: outcome.id,
    side: "BUY",
    type: "LIMIT",
    price: "0.44",
    size: "12",
    clientOrderId: `ed-a-fill-${randomUUID()}`,
    contractSide: "YES",
    selection: expectedIdentity,
  };
  const fillOrderResult = await submitCanonicalOrder({
    userId: proofUser.id,
    apiCredentialId: credential.apiKey.id,
    apiKeyId: credential.apiKey.keyId,
    body: fillOrderRequest,
    idempotencyKeyHeader: `ed-a-fill-${randomUUID()}`,
  });
  assert("order" in fillOrderResult.body, `fill order request failed: ${JSON.stringify(fillOrderResult.body)}`);
  assert(fillOrderResult.body.order.status === "FILLED", `expected filled order, got ${fillOrderResult.body.order.status}`);
  assert(fillOrderResult.body.fills.length > 0, "Expected selected Book order to produce at least one fill.");
  assertSameIdentity("fillOrderResponse.selection", pickSelectionIdentity(fillOrderResult.body.order.selection), expectedIdentity);

  const portfolioAfterFill = await readPortfolio(credential.token);
  const position = portfolioAfterFill.positions.find(
    (item: { market?: { id?: string }; outcomeId?: string }) =>
      item.market?.id === market.id && item.outcomeId === outcome.id,
  );
  assert(position, "Expected selected Book fill in portfolio positions.");
  assertSameIdentity("portfolio.position.selection", pickSelectionIdentity(position.selection), expectedIdentity);

  const historyAfterFill = await readPortfolioHistory(credential.token);
  const recentTrade = historyAfterFill.recentTrades.find(
    (item: { market?: { id?: string }; outcome?: { id?: string } }) =>
      item.market?.id === market.id && item.outcome?.id === outcome.id,
  );
  assert(recentTrade, "Expected selected Book fill in portfolio recentTrades.");
  assertSameIdentity("history.recentTrade.selection", pickSelectionIdentity(recentTrade.selection), expectedIdentity);

  const assertions = {
    bookReturnedProviderDepth: book.depthSource === "provider-orderbook-depth",
    bookOutcomeTokenMatchesSelection: bookOutcome.tokenId === expectedIdentity.tokenId,
    orderResponsePreservesIdentity: true,
    portfolioOpenOrderPreservesIdentity: true,
    canceledActivityPreservesIdentity: true,
    fillOrderPreservesIdentity: true,
    portfolioPositionPreservesIdentity: true,
    recentActivityPreservesIdentity: true,
  };

  const summary = {
    pass: Object.values(assertions).every(Boolean),
    proof: "ED-A selected provider-backed Book line identity preserves provider/source/token fields through order response, portfolio open orders/positions, and portfolio history/recent activity.",
    limitation: "Identity persistence is request-body JSON metadata on ApiOrderRequest plus market/outcome fallback metadata for positions and trades; there is no immutable per-trade selection snapshot or schema migration in this proof.",
    baseUrl,
    providerDepthSource: PROVIDER_DEPTH_SOURCE,
    setup: {
      depthRowsUpserted: depthRows.length,
      marketId: market.id,
      outcomeId: outcome.id,
    },
    expectedIdentity,
    bookSelection: {
      marketIdentity: {
        marketId: bookIdentity.marketId,
        selectorKey: bookIdentity.selectorKey,
        marketType: bookIdentity.marketType,
        marketFamily: bookIdentity.marketFamily,
        marketGroupId: bookIdentity.marketGroupId,
        period: bookIdentity.period,
        line: bookIdentity.line,
        selectedOutcome: bookOutcome,
      },
      depthSource: book.depthSource,
      providerOrderbookDepth: book.providerOrderbookDepth,
    },
    orderRequest: pickSelectionIdentity(openOrderRequest.selection),
    orderResponse: {
      id: openOrderResult.body.order.id,
      status: openOrderResult.body.order.status,
      selection: pickSelectionIdentity(openOrderResult.body.order.selection),
    },
    portfolioOpenOrder: {
      id: openOrder.id,
      status: openOrder.status,
      selection: pickSelectionIdentity(openOrder.selection),
    },
    canceledActivity: {
      id: canceledActivity.id,
      status: canceledActivity.status,
      selection: pickSelectionIdentity(canceledActivity.selection),
    },
    fillOrderResponse: {
      id: fillOrderResult.body.order.id,
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
    counts: {
      openOrdersAfterFill: portfolioAfterFill.openOrders.length,
      positionsAfterFill: portfolioAfterFill.positions.length,
      canceledOrders: historyAfterFill.canceledOrders.length,
      recentTrades: historyAfterFill.recentTrades.length,
    },
    assertions,
  };

  const resolved = path.resolve(summaryPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));

  if (!summary.pass) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
