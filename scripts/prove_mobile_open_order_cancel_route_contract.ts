import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { DELETE as cancelOrderRoute } from "@/app/api/orders/[id]/route";
import { GET as getPortfolio } from "@/app/api/portfolio/route";
import { GET as getPortfolioHistory } from "@/app/api/portfolio/history/route";
import { prisma } from "@/lib/db";
import { API_KEY_SCOPES, createApiCredential } from "@/lib/canonicalAuth";
import { submitCanonicalOrder } from "@/server/services/canonicalOrderSubmission";
import { upsertReferenceQuoteSnapshots } from "@/server/services/referenceQuoteSnapshots";
import { cancelOpenOrderOnServer } from "../mobile/src/services/openOrderService";
import { loadPortfolioHistoryActivities } from "../mobile/src/services/portfolioHistoryService";
import { loadPortfolioSnapshot } from "../mobile/src/services/portfolioSnapshotService";
import type { PolyApi } from "../mobile/src/api";

const OUTPUT_PATH =
  "docs/mobile/harness/cycle-JZ-open-order-cancel-route-contract/cycle-JZ-open-order-cancel-route-contract.json";
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function createUser() {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `cycle_jz_cancel_${suffix}`,
      email: `cycle_jz_cancel_${suffix}@local.test`,
    },
  });
  await prisma.userBalance.create({
    data: { userId: user.id, availableUSDC: dec("1000"), lockedUSDC: dec("0") },
  });
  return user;
}

async function createMarket() {
  const suffix = randomUUID().slice(0, 8);
  return prisma.market.create({
    data: {
      title: `Cycle JZ Open Order Cancel ${suffix}`,
      description: "Disposable mobile open-order cancel route contract market.",
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
      externalSlug: `cycle-jz-spread-${suffix}`,
      externalMarketId: `gamma-cycle-jz-spread-${suffix}`,
      conditionId: `condition-cycle-jz-spread-${suffix}`,
      isCanceled: false,
      isListed: true,
      outcomes: {
        create: [
          {
            name: "Home -1.5",
            label: "Home -1.5",
            side: "home",
            code: "HOME",
            slug: `cycle-jz-home-${suffix}`,
            displayOrder: 0,
            isActive: true,
            isTradable: true,
            referenceTokenId: `token-cycle-jz-home-${suffix}`,
            referenceOutcomeLabel: "Home -1.5",
          },
          {
            name: "Away +1.5",
            label: "Away +1.5",
            side: "away",
            code: "AWAY",
            slug: `cycle-jz-away-${suffix}`,
            displayOrder: 1,
            isActive: true,
            isTradable: true,
            referenceTokenId: `token-cycle-jz-away-${suffix}`,
            referenceOutcomeLabel: "Away +1.5",
          },
        ],
      },
    },
    include: { outcomes: { orderBy: { displayOrder: "asc" } } },
  });
}

async function seedProviderQuotes(market: Awaited<ReturnType<typeof createMarket>>) {
  const fetchedAt = new Date();
  await upsertReferenceQuoteSnapshots(
    market.outcomes.map((outcome, index) => ({
      marketId: market.id,
      outcomeId: outcome.id,
      source: "polymarket",
      externalSlug: market.externalSlug,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
      tokenId: outcome.referenceTokenId,
      outcomeLabel: outcome.referenceOutcomeLabel ?? outcome.name,
      outcomePrice: index === 0 ? 0.44 : 0.56,
      bestBid: index === 0 ? 0.41 : 0.53,
      bestAsk: index === 0 ? 0.45 : 0.57,
      spread: 0.04,
      lastTradePrice: index === 0 ? 0.44 : 0.56,
      volume: 1000,
      volume24hr: 200,
      liquidity: 900,
      liquidityClob: 1200,
      acceptingOrders: true,
      qualityStatus: "cycle_jz_accepting",
      mmEligible: false,
      reason: "cycle_jz_cancel_contract",
      fetchedAt,
    })),
  );
}

const authRequest = (url: string, token: string, init?: RequestInit) =>
  new NextRequest(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });

async function readPortfolio(token: string) {
  const response = await getPortfolio(authRequest("http://localhost/api/portfolio", token));
  const body = await response.json();
  assert(response.status === 200, `Expected /api/portfolio 200, got ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function readPortfolioHistory(token: string) {
  const response = await getPortfolioHistory(authRequest("http://localhost/api/portfolio/history", token));
  const body = await response.json();
  assert(
    response.status === 200,
    `Expected /api/portfolio/history 200, got ${response.status}: ${JSON.stringify(body)}`,
  );
  return body;
}

async function cancelOrder(token: string, orderId: string) {
  const response = await cancelOrderRoute(
    authRequest(`http://localhost/api/orders/${encodeURIComponent(orderId)}`, token, { method: "DELETE" }),
    { params: Promise.resolve({ id: orderId }) },
  );
  const body = await response.json();
  assert(response.status === 200, `Expected cancel 200, got ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

const pickSelection = (selection: Record<string, unknown> | null | undefined) => ({
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

async function main() {
  const user = await createUser();
  const credential = await createApiCredential({
    userId: user.id,
    name: "Cycle JZ mobile cancel proof",
    scopes: API_KEY_SCOPES,
  });
  const market = await createMarket();
  await seedProviderQuotes(market);
  const outcome = market.outcomes[0];
  assert(outcome, "Proof market did not create a tradable outcome.");

  const expectedSelection = {
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
  };

  const submitted = await submitCanonicalOrder({
    userId: user.id,
    apiCredentialId: credential.apiKey.id,
    apiKeyId: credential.apiKey.keyId,
    idempotencyKeyHeader: `cycle-jz-open-order-${randomUUID()}`,
    body: {
      marketId: market.id,
      outcomeId: outcome.id,
      side: "BUY",
      type: "LIMIT",
      price: "0.42",
      size: "5.000000",
      selection: expectedSelection,
    },
  });
  assert(submitted.status === 200, `Expected order submit 200, got ${submitted.status}.`);
  assert("order" in submitted.body && submitted.body.order.status === "OPEN", "Expected an open resting order.");
  const orderId = submitted.body.order.id;

  const routeApi = {
    getPortfolio: () => readPortfolio(credential.token),
    getPortfolioHistory: () => readPortfolioHistory(credential.token),
    cancelOrder: (id: string) => cancelOrder(credential.token, id),
  } as unknown as PolyApi;

  const beforePortfolio = await loadPortfolioSnapshot(routeApi);
  const beforeOpenOrder = beforePortfolio.openOrders.find((order) => order.id === orderId);
  assert(beforeOpenOrder, "Expected mobile Portfolio snapshot to include the open order before cancel.");
  assert(beforeOpenOrder.selection?.marketId === market.id, "Expected open order selection market id.");
  assert(beforeOpenOrder.selection?.referenceTokenId === outcome.referenceTokenId, "Expected open order token id.");

  await cancelOpenOrderOnServer({ mode: "server", api: routeApi, order: beforeOpenOrder });

  const afterPortfolio = await loadPortfolioSnapshot(routeApi);
  assert(!afterPortfolio.openOrders.some((order) => order.id === orderId), "Expected canceled order removed from open orders.");

  const historyPayload = await readPortfolioHistory(credential.token);
  const canceledOrder = historyPayload.canceledOrders.find((order: { id: string }) => order.id === orderId);
  assert(canceledOrder, "Expected canceled order in /api/portfolio/history.");
  assert(canceledOrder.selection?.marketId === market.id, "Expected canceled history selection market id.");
  assert(canceledOrder.selection?.referenceTokenId === outcome.referenceTokenId, "Expected canceled history token id.");

  const activities = await loadPortfolioHistoryActivities(routeApi);
  const canceledActivity = activities.find((activity) => activity.id === `canceled-order-${orderId}`);
  assert(canceledActivity?.selection?.marketId === market.id, "Expected mobile canceled activity selection market id.");
  assert(
    canceledActivity?.selection?.referenceTokenId === outcome.referenceTokenId,
    "Expected mobile canceled activity token id.",
  );

  const proof = {
    cycle: "JZ",
    scope: "open-order-cancel-route-contract",
    generatedAt: new Date().toISOString(),
    route: "/api/orders/:id DELETE",
    portfolioRoutes: ["/api/portfolio", "/api/portfolio/history"],
    orderId,
    marketId: market.id,
    outcomeId: outcome.id,
    checks: {
      mobileServiceCalledRoute: true,
      openOrderRemovedAfterCancel: !afterPortfolio.openOrders.some((order) => order.id === orderId),
      canceledHistoryCreated: Boolean(canceledOrder),
      canceledActivityPreservesSelection: Boolean(canceledActivity?.selection?.referenceTokenId === outcome.referenceTokenId),
    },
    beforeOpenOrder: {
      id: beforeOpenOrder.id,
      status: beforeOpenOrder.status,
      selection: pickSelection(beforeOpenOrder.selection as Record<string, unknown>),
    },
    cancelResponse: {
      status: "CANCELED",
      canceledByApiKeyId: credential.apiKey.keyId,
    },
    canceledHistory: {
      id: canceledOrder.id,
      status: canceledOrder.status,
      selection: pickSelection(canceledOrder.selection),
    },
    canceledActivity: canceledActivity
      ? {
          id: canceledActivity.id,
          action: canceledActivity.action,
          selection: pickSelection(canceledActivity.selection as Record<string, unknown>),
        }
      : null,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(proof, null, 2)}\n`);
  console.log(JSON.stringify(proof, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
