import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createApiCredential } from "@/lib/canonicalAuth";
import { GET as getPortfolioRoute } from "@/app/api/portfolio/route";
import { GET as getPortfolioHistoryRoute } from "@/app/api/portfolio/history/route";
import { loadServerPortfolioState } from "../mobile/src/services/portfolioSyncService";
import type { PolyApi } from "../mobile/src/api";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KE-portfolio-sync-route-contract/cycle-KE-portfolio-sync-route-contract.json";
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function seedPortfolioSyncAccount() {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `mobile_ke_portfolio_${suffix}`,
      email: `mobile-ke-portfolio-${suffix}@example.test`,
      balance: {
        create: {
          availableUSDC: dec("125.50"),
          lockedUSDC: dec("4.40"),
        },
      },
    },
  });

  const market = await prisma.market.create({
    data: {
      title: `KE Portfolio Sync Spread ${suffix}`,
      description: "Disposable Portfolio sync route contract market.",
      status: "LIVE",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      kind: "ORDERBOOK",
      type: "BINARY",
      marketType: "spread",
      marketGroupKey: "spread",
      marketGroupTitle: "Spread",
      period: "regulation",
      line: dec("1.5"),
      referenceSource: "polymarket",
      externalSlug: `ke-portfolio-spread-${suffix}`,
      externalMarketId: `gamma-ke-portfolio-${suffix}`,
      conditionId: `condition-ke-portfolio-${suffix}`,
      isListed: true,
      outcomes: {
        create: [
          {
            name: "Home -1.5",
            label: "Home -1.5",
            side: "home",
            code: "HOME",
            slug: `ke-portfolio-home-${suffix}`,
            displayOrder: 0,
            isActive: true,
            isTradable: true,
            referenceTokenId: `token-ke-home-${suffix}`,
            referenceOutcomeLabel: "Home -1.5",
          },
          {
            name: "Away +1.5",
            label: "Away +1.5",
            side: "away",
            code: "AWAY",
            slug: `ke-portfolio-away-${suffix}`,
            displayOrder: 1,
            isActive: true,
            isTradable: true,
            referenceTokenId: `token-ke-away-${suffix}`,
            referenceOutcomeLabel: "Away +1.5",
          },
        ],
      },
    },
    include: { outcomes: { orderBy: { displayOrder: "asc" } } },
  });

  const outcome = market.outcomes[0];
  assert(outcome, "Expected proof market to create an outcome.");

  const selection = {
    marketId: market.id,
    outcomeId: outcome.id,
    marketGroupId: "spread:regulation:1.5",
    marketType: "spread",
    line: "1.5",
    period: "Regulation",
    side: "home",
    displayLabel: "Home -1.5",
    contractSide: "yes",
    referenceSource: "polymarket",
    externalSlug: market.externalSlug,
    externalMarketId: market.externalMarketId,
    conditionId: market.conditionId,
    referenceTokenId: outcome.referenceTokenId,
    referenceOutcomeLabel: outcome.referenceOutcomeLabel,
    limitPrice: 0.44,
    limitSide: "ask",
    limitShares: 10,
  };
  const requestBody = {
    marketId: market.id,
    outcomeId: outcome.id,
    side: "BUY",
    type: "LIMIT",
    price: "0.44",
    size: "10",
    contractSide: "YES",
    selection,
  };

  await prisma.position.create({
    data: {
      userId: user.id,
      marketId: market.id,
      outcomeId: outcome.id,
      shares: dec("40"),
      avgCost: dec("0.45"),
    },
  });

  const filledOrder = await prisma.order.create({
    data: {
      userId: user.id,
      marketId: market.id,
      outcomeId: outcome.id,
      side: "BUY",
      price: dec("0.45"),
      amount: dec("40"),
      remaining: dec("0"),
      reservedNotional: dec("0"),
      status: "FILLED",
    },
  });
  await prisma.apiOrderRequest.create({
    data: {
      userId: user.id,
      idempotencyKey: `ke-filled-${suffix}`,
      clientOrderId: `ke-filled-client-${suffix}`,
      requestFingerprint: `ke-filled-fingerprint-${suffix}`,
      requestBody,
      submittedNotional: dec("18"),
      status: "SUCCEEDED",
      orderId: filledOrder.id,
      responseStatus: 200,
      responseBody: { order: { id: filledOrder.id, status: "FILLED" } },
    },
  });

  const openOrder = await prisma.order.create({
    data: {
      userId: user.id,
      marketId: market.id,
      outcomeId: outcome.id,
      side: "BUY",
      price: dec("0.44"),
      amount: dec("10"),
      remaining: dec("10"),
      reservedNotional: dec("4.4"),
      status: "OPEN",
    },
  });
  await prisma.apiOrderRequest.create({
    data: {
      userId: user.id,
      idempotencyKey: `ke-open-${suffix}`,
      clientOrderId: `ke-open-client-${suffix}`,
      requestFingerprint: `ke-open-fingerprint-${suffix}`,
      requestBody,
      submittedNotional: dec("4.4"),
      status: "SUCCEEDED",
      orderId: openOrder.id,
      responseStatus: 200,
      responseBody: { order: { id: openOrder.id, status: "OPEN" } },
    },
  });

  const canceledOrder = await prisma.order.create({
    data: {
      userId: user.id,
      marketId: market.id,
      outcomeId: outcome.id,
      side: "BUY",
      price: dec("0.43"),
      amount: dec("8"),
      remaining: dec("8"),
      reservedNotional: dec("0"),
      status: "CANCELED",
    },
  });
  await prisma.apiOrderRequest.create({
    data: {
      userId: user.id,
      idempotencyKey: `ke-canceled-${suffix}`,
      clientOrderId: `ke-canceled-client-${suffix}`,
      requestFingerprint: `ke-canceled-fingerprint-${suffix}`,
      requestBody,
      submittedNotional: dec("3.44"),
      status: "SUCCEEDED",
      orderId: canceledOrder.id,
      responseStatus: 200,
      responseBody: { order: { id: canceledOrder.id, status: "CANCELED" } },
    },
  });

  await prisma.trade.create({
    data: {
      userId: user.id,
      marketId: market.id,
      outcomeId: outcome.id,
      side: "BUY",
      shares: dec("40"),
      cost: dec("18"),
      fee: dec("0"),
    },
  });

  const credential = await createApiCredential({
    userId: user.id,
    name: `mobile-ke-portfolio-${suffix}`,
    scopes: ["account:read"],
  });

  return { user, token: credential.token, market, outcome, openOrder, canceledOrder, selection };
}

const authRequest = (url: string, token: string) =>
  new NextRequest(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

async function main() {
  const seeded = await seedPortfolioSyncAccount();
  const routeApi = {
    getPortfolio: async () => {
      const response = await getPortfolioRoute(authRequest("http://localhost/api/portfolio", seeded.token));
      const body = await response.json();
      assert(response.status === 200, `Expected /api/portfolio 200, received ${response.status}: ${JSON.stringify(body)}`);
      return body;
    },
    getPortfolioHistory: async () => {
      const response = await getPortfolioHistoryRoute(authRequest("http://localhost/api/portfolio/history", seeded.token));
      const body = await response.json();
      assert(response.status === 200, `Expected /api/portfolio/history 200, received ${response.status}: ${JSON.stringify(body)}`);
      return body;
    },
  };

  const state = await loadServerPortfolioState(routeApi as Pick<PolyApi, "getPortfolio" | "getPortfolioHistory">);
  const position = state.snapshot?.positions.find((item) => item.marketId === seeded.market.id);
  const openOrder = state.snapshot?.openOrders.find((item) => item.id === seeded.openOrder.id);
  const canceledActivity = state.activities?.find((item) => item.id === `canceled-order-${seeded.canceledOrder.id}`);
  const tradeActivity = state.activities?.find((item) => item.id.startsWith("trade-"));

  assert(state.syncStatus === "synced", `Expected synced Portfolio state, received ${state.syncStatus}.`);
  assert(state.snapshot?.balance === 125.5, `Expected available balance 125.5, received ${state.snapshot?.balance}.`);
  assert(position?.mode === "server", "Expected server position to be mapped.");
  assert(position.selection?.displayLabel === "Home -1.5", "Expected position selection label from backend metadata.");
  assert(position.selection?.marketType === "spread", "Expected position spread selection metadata.");
  assert(openOrder?.selection?.displayLabel === "Home -1.5", "Expected open order selection label from backend metadata.");
  assert(openOrder?.side === "buy", "Expected open order side to map to buy.");
  assert(canceledActivity?.selection?.displayLabel === "Home -1.5", "Expected canceled activity selection label.");
  assert(canceledActivity?.action === "canceled", "Expected canceled order activity.");
  assert(tradeActivity?.selection?.displayLabel === "Home -1.5", "Expected recent trade activity selection label.");
  assert(tradeActivity?.action === "opened", "Expected recent trade activity to map to opened.");

  const summary = {
    pass: true,
    createdAt: new Date().toISOString(),
    routes: ["/api/portfolio", "/api/portfolio/history"],
    auth: "canonical account:read API key",
    service: "loadServerPortfolioState",
    syncStatus: state.syncStatus,
    snapshot: {
      balance: state.snapshot.balance,
      positions: state.snapshot.positions.length,
      openOrders: state.snapshot.openOrders.length,
      proofPosition: {
        id: position.id,
        marketId: position.marketId,
        outcomeId: position.outcomeId,
        displayLabel: position.selection?.displayLabel,
        marketType: position.selection?.marketType,
        currentValue: position.currentValue,
        pnl: position.pnl,
      },
      proofOpenOrder: {
        id: openOrder.id,
        side: openOrder.side,
        displayLabel: openOrder.selection?.displayLabel,
      },
    },
    activities: {
      count: state.activities.length,
      canceled: {
        id: canceledActivity.id,
        action: canceledActivity.action,
        displayLabel: canceledActivity.selection?.displayLabel,
      },
      recentTrade: {
        id: tradeActivity.id,
        action: tradeActivity.action,
        displayLabel: tradeActivity.selection?.displayLabel,
      },
    },
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
