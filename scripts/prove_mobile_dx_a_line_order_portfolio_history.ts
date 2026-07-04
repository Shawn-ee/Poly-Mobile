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
import { cancelOrderAndUnlock } from "@/server/services/matching";
import { mintCompleteSetForPublicOrderbook } from "@/server/services/orderbookCollateral";
import { placeOrderAndMatch } from "@/server/services/matching";

const OUTPUT_PATH = "docs/mobile/harness/cycle-DX-A-line-order-portfolio-history.json";
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const summaryPath = argValue("summaryPath") ?? OUTPUT_PATH;

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
  externalMarketId: selection?.externalMarketId,
  conditionId: selection?.conditionId,
  referenceTokenId: selection?.referenceTokenId,
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
  "externalMarketId",
  "conditionId",
  "referenceTokenId",
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

async function createWorldCupSpreadLineMarket() {
  const suffix = randomUUID().slice(0, 8);
  return prisma.market.create({
    data: {
      slug: `dx-a-world-cup-spread-line-${suffix}`,
      title: "Japan vs Morocco - World Cup 2026 Spread",
      description: "DX-A backend proof market for selected World Cup line lifecycle.",
      status: "LIVE",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      kind: "ORDERBOOK",
      type: "BINARY",
      marketType: "spread",
      marketGroupKey: "spreads",
      marketGroupTitle: "Spreads",
      displayOrder: 20,
      line: dec("-1.5"),
      period: "1H",
      participantType: "team",
      participantName: "Japan",
      propCategory: "world-cup-line-proof",
      referenceSource: "polymarket",
      externalSlug: `dx-a-japan-morocco-spread-1h-${suffix}`,
      externalMarketId: `gamma-dx-a-japan-morocco-spread-1h-${suffix}`,
      conditionId: `condition-dx-a-japan-morocco-spread-1h-${suffix}`,
      isListed: true,
      isCanceled: false,
      outcomes: {
        create: [
          {
            name: "YES",
            label: "Japan",
            side: "yes",
            code: "YES",
            slug: `dx-a-japan-spread-yes-${suffix}`,
            displayOrder: 0,
            isActive: true,
            referenceTokenId: `token-dx-a-japan-spread-yes-${suffix}`,
            referenceOutcomeLabel: "Japan",
          },
          {
            name: "NO",
            label: "Morocco",
            side: "no",
            code: "NO",
            slug: `dx-a-japan-spread-no-${suffix}`,
            displayOrder: 1,
            isActive: true,
            referenceTokenId: `token-dx-a-japan-spread-no-${suffix}`,
            referenceOutcomeLabel: "Morocco",
          },
        ],
      },
    },
    include: { outcomes: { orderBy: { displayOrder: "asc" } } },
  });
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
    throw new Error("Refusing to create DX-A mobile lifecycle proof state in production.");
  }

  const market = await createWorldCupSpreadLineMarket();
  const outcome = market.outcomes.find((item) => item.side === "yes") ?? market.outcomes[0];
  assert(outcome, "Proof market has no selected outcome.");

  const proofUser = await createUser("holiwyn_dx_a_line_lifecycle_user", "10000", true);
  const makerUser = await createUser("holiwyn_dx_a_line_lifecycle_maker", "10000", true);
  const credential = await createApiCredential({
    userId: proofUser.id,
    name: `dx-a-line-lifecycle-${new Date().toISOString()}`,
    scopes: [...API_KEY_SCOPES],
  });

  const expectedIdentity = {
    marketId: market.id,
    outcomeId: outcome.id,
    marketType: "spread",
    marketGroupId: "spreads",
    line: "-1.5",
    period: "1H",
    side: "yes",
    displayLabel: "Japan -1.5 1H",
    contractSide: "yes",
    referenceSource: "polymarket",
    externalMarketId: market.externalMarketId,
    conditionId: market.conditionId,
    referenceTokenId: outcome.referenceTokenId,
  };

  const openOrderRequest = {
    marketId: market.id,
    outcomeId: outcome.id,
    side: "BUY",
    type: "LIMIT",
    price: "0.31",
    size: "10",
    clientOrderId: `dx-a-open-${randomUUID()}`,
    contractSide: "YES",
    selection: expectedIdentity,
  };
  const openOrderResult = await submitCanonicalOrder({
    userId: proofUser.id,
    apiCredentialId: credential.apiKey.id,
    apiKeyId: credential.apiKey.keyId,
    body: openOrderRequest,
    idempotencyKeyHeader: `dx-a-open-${randomUUID()}`,
  });
  assert("order" in openOrderResult.body, `open order request failed: ${JSON.stringify(openOrderResult.body)}`);
  assert(openOrderResult.body.order.status === "OPEN", `expected open order, got ${openOrderResult.body.order.status}`);
  assertSameIdentity(
    "orderResponse.selection",
    pickSelectionIdentity(openOrderResult.body.order.selection),
    expectedIdentity,
  );

  const portfolioWithOpenOrder = await readPortfolio(credential.token);
  const openOrder = portfolioWithOpenOrder.openOrders.find(
    (item: { id: string }) => item.id === openOrderResult.body.order.id,
  );
  assert(openOrder, "Expected selected line order in portfolio openOrders.");
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
  assert(canceledActivity, "Expected selected line order in portfolio canceled activity.");
  assertSameIdentity("history.canceled.selection", pickSelectionIdentity(canceledActivity.selection), expectedIdentity);

  await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: makerUser.id, quantity: "25" });
  const makerAsk = await placeOrderAndMatch({
    marketId: market.id,
    userId: makerUser.id,
    outcomeId: outcome.id,
    side: "SELL",
    price: "0.42",
    size: "12",
    type: "LIMIT",
  });
  assert(makerAsk.order.status === "OPEN", `expected maker ask to rest, got ${makerAsk.order.status}`);

  const fillOrderRequest = {
    marketId: market.id,
    outcomeId: outcome.id,
    side: "BUY",
    type: "LIMIT",
    price: "0.42",
    size: "12",
    clientOrderId: `dx-a-fill-${randomUUID()}`,
    contractSide: "YES",
    selection: expectedIdentity,
  };
  const fillOrderResult = await submitCanonicalOrder({
    userId: proofUser.id,
    apiCredentialId: credential.apiKey.id,
    apiKeyId: credential.apiKey.keyId,
    body: fillOrderRequest,
    idempotencyKeyHeader: `dx-a-fill-${randomUUID()}`,
  });
  assert("order" in fillOrderResult.body, `fill order request failed: ${JSON.stringify(fillOrderResult.body)}`);
  assert(fillOrderResult.body.order.status === "FILLED", `expected filled order, got ${fillOrderResult.body.order.status}`);
  assert(fillOrderResult.body.fills.length > 0, "Expected selected line order to produce at least one fill.");
  assertSameIdentity(
    "fillOrderResponse.selection",
    pickSelectionIdentity(fillOrderResult.body.order.selection),
    expectedIdentity,
  );

  const portfolioAfterFill = await readPortfolio(credential.token);
  const position = portfolioAfterFill.positions.find(
    (item: { market?: { id?: string }; outcomeId?: string }) =>
      item.market?.id === market.id && item.outcomeId === outcome.id,
  );
  assert(position, "Expected selected line fill in portfolio positions.");
  assertSameIdentity("portfolio.position.selection", pickSelectionIdentity(position.selection), expectedIdentity);

  const historyAfterFill = await readPortfolioHistory(credential.token);
  const recentTrade = historyAfterFill.recentTrades.find(
    (item: { market?: { id?: string }; outcome?: { id?: string } }) =>
      item.market?.id === market.id && item.outcome?.id === outcome.id,
  );
  assert(recentTrade, "Expected selected line fill in portfolio recentTrades.");
  assertSameIdentity("history.recentTrade.selection", pickSelectionIdentity(recentTrade.selection), expectedIdentity);

  const summary = {
    pass: true,
    proof: "DX-A selected World Cup Spread line lifecycle preserves identity through order request, order response, open order, canceled activity, filled position, and recent trade activity.",
    user: { id: proofUser.id, username: proofUser.username },
    credential: { keyId: credential.apiKey.keyId },
    expectedIdentity,
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
  };

  const resolved = path.resolve(summaryPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
