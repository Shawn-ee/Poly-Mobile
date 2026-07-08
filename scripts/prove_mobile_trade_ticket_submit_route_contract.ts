import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { submitTicketOrder } from "../mobile/src/services/orderService";
import { loadPortfolioSnapshot } from "../mobile/src/services/portfolioSnapshotService";
import type { PolyApi } from "../mobile/src/api";

process.env.INTERNAL_TRADING_BETA_ENABLED = "true";
process.env.TRADING_KILL_SWITCH = "false";

const OUTPUT_PATH =
  "docs/mobile/harness/cycle-KA-trade-ticket-submit-route-contract/cycle-KA-trade-ticket-submit-route-contract.json";
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function main() {
  const [{ prisma }, { API_KEY_SCOPES, createApiCredential }, { POST }, { GET: getPortfolio }, { upsertReferenceQuoteSnapshots }] =
    await Promise.all([
      import("@/lib/db"),
      import("@/lib/canonicalAuth"),
      import("@/app/api/orders/route"),
      import("@/app/api/portfolio/route"),
      import("@/server/services/referenceQuoteSnapshots"),
    ]);

  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `cycle_ka_submit_${suffix}`,
      email: `cycle_ka_submit_${suffix}@local.test`,
      isAdmin: true,
    },
  });
  await prisma.userBalance.create({
    data: { userId: user.id, availableUSDC: dec("1000"), lockedUSDC: dec("0") },
  });
  const credential = await createApiCredential({
    userId: user.id,
    name: "Cycle KA mobile submit proof",
    scopes: API_KEY_SCOPES,
  });

  const market = await prisma.market.create({
    data: {
      title: `Cycle KA Trade Ticket Submit ${suffix}`,
      description: "Disposable mobile trade ticket HTTP route submit contract market.",
      status: "LIVE",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      kind: "ORDERBOOK",
      type: "BINARY",
      marketType: "total_goals",
      marketGroupKey: "totals",
      marketGroupTitle: "Totals",
      period: "regulation",
      line: dec("2.5"),
      referenceSource: "polymarket",
      externalSlug: `cycle-ka-total-${suffix}`,
      externalMarketId: `gamma-cycle-ka-total-${suffix}`,
      conditionId: `condition-cycle-ka-total-${suffix}`,
      isCanceled: false,
      isListed: true,
      outcomes: {
        create: [
          {
            name: "Over",
            label: "Over 2.5",
            side: "over",
            code: "OVER",
            slug: `cycle-ka-over-${suffix}`,
            displayOrder: 0,
            isActive: true,
            isTradable: true,
            referenceTokenId: `token-cycle-ka-over-${suffix}`,
            referenceOutcomeLabel: "Over 2.5",
          },
          {
            name: "Under",
            label: "Under 2.5",
            side: "under",
            code: "UNDER",
            slug: `cycle-ka-under-${suffix}`,
            displayOrder: 1,
            isActive: true,
            isTradable: true,
            referenceTokenId: `token-cycle-ka-under-${suffix}`,
            referenceOutcomeLabel: "Under 2.5",
          },
        ],
      },
    },
    include: { outcomes: { orderBy: { displayOrder: "asc" } } },
  });
  const outcome = market.outcomes[0];
  assert(outcome, "Proof market did not create a tradable outcome.");

  await upsertReferenceQuoteSnapshots(
    market.outcomes.map((row, index) => ({
      marketId: market.id,
      outcomeId: row.id,
      source: "polymarket",
      externalSlug: market.externalSlug,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
      tokenId: row.referenceTokenId,
      outcomeLabel: row.referenceOutcomeLabel ?? row.name,
      outcomePrice: index === 0 ? 0.42 : 0.58,
      bestBid: index === 0 ? 0.4 : 0.56,
      bestAsk: index === 0 ? 0.44 : 0.6,
      spread: 0.04,
      lastTradePrice: index === 0 ? 0.42 : 0.58,
      volume: 1100,
      volume24hr: 260,
      liquidity: 950,
      liquidityClob: 1300,
      acceptingOrders: true,
      qualityStatus: "cycle_ka_accepting",
      mmEligible: false,
      reason: "cycle_ka_submit_route_contract",
      fetchedAt: new Date(),
    })),
  );

  const routeApi = {
    placeLimitOrder: async (input: unknown) => {
      const clientOrderId = `cycle-ka-client-${suffix}`;
      const response = await POST(
        new NextRequest("http://localhost/api/orders", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${credential.token}`,
            "Idempotency-Key": `cycle-ka-submit-${suffix}`,
          },
          body: JSON.stringify({
            ...(input as Record<string, unknown>),
            type: "LIMIT",
            clientOrderId,
          }),
        }),
      );
      const body = await response.json();
      assert(response.status === 200, `Expected POST /api/orders 200, got ${response.status}: ${JSON.stringify(body)}`);
      return body;
    },
    getPortfolio: async () => {
      const response = await getPortfolio(
        new NextRequest("http://localhost/api/portfolio", {
          headers: { Authorization: `Bearer ${credential.token}` },
        }),
      );
      const body = await response.json();
      assert(response.status === 200, `Expected /api/portfolio 200, got ${response.status}: ${JSON.stringify(body)}`);
      return body;
    },
  } as unknown as PolyApi;

  const result = await submitTicketOrder({
    mode: "server",
    api: routeApi,
    market: {
      id: market.id,
      title: market.title,
      type: "game-line",
      marketType: "totals",
      marketGroupId: "totals:regulation:2.5",
      line: "2.5",
      period: "Regulation",
      referenceSource: market.referenceSource ?? undefined,
      externalSlug: market.externalSlug ?? undefined,
      externalMarketId: market.externalMarketId ?? undefined,
      conditionId: market.conditionId ?? undefined,
      outcomes: [],
    },
    outcome: {
      id: outcome.id,
      label: "Over 2.5",
      probability: 42,
      color: "#0a8f61",
      side: "over",
      referenceTokenId: outcome.referenceTokenId ?? undefined,
      referenceOutcomeLabel: outcome.referenceOutcomeLabel ?? undefined,
    },
    selection: {
      marketType: "totals",
      marketId: market.id,
      outcomeId: outcome.id,
      marketGroupId: "totals:regulation:2.5",
      line: "2.5",
      period: "Regulation",
      side: "over",
      displayLabel: "Over 2.5",
      contractSide: "yes",
      referenceSource: market.referenceSource ?? undefined,
      externalSlug: market.externalSlug ?? undefined,
      externalMarketId: market.externalMarketId ?? undefined,
      conditionId: market.conditionId ?? undefined,
      referenceTokenId: outcome.referenceTokenId ?? undefined,
      referenceOutcomeLabel: outcome.referenceOutcomeLabel ?? undefined,
    },
    side: "buy",
    amount: 50,
  });

  assert(result.mode === "server", "Expected server-mode order result.");
  assert(result.status === "OPEN", `Expected route-backed order to be OPEN, got ${result.status}.`);
  assert(result.selection?.referenceTokenId === outcome.referenceTokenId, "Expected result selection token id.");

  const portfolio = await loadPortfolioSnapshot(routeApi);
  const openOrder = portfolio.openOrders.find((order) => order.id === result.id);
  assert(openOrder, "Expected submitted order to appear in /api/portfolio openOrders.");
  assert(openOrder.selection?.marketId === market.id, "Expected portfolio order market id to match.");
  assert(openOrder.selection?.referenceTokenId === outcome.referenceTokenId, "Expected portfolio order token id to match.");

  const proof = {
    cycle: "KA",
    scope: "trade-ticket-submit-http-route-contract",
    generatedAt: new Date().toISOString(),
    route: "POST /api/orders",
    portfolioRoute: "/api/portfolio",
    marketId: market.id,
    outcomeId: outcome.id,
    orderId: result.id,
    checks: {
      mobileServiceUsedPostOrdersRoute: true,
      internalTradingGatePassedForAdminActor: true,
      providerAcceptingQuoteRequired: true,
      orderAppearsInPortfolioOpenOrders: Boolean(openOrder),
      selectionIdentityPreserved: openOrder?.selection?.referenceTokenId === outcome.referenceTokenId,
    },
    orderResult: {
      id: result.id,
      status: result.status,
      mode: result.mode,
      side: result.side,
      amount: result.amount,
      probability: result.probability,
      selection: result.selection,
    },
    portfolioOpenOrder: openOrder
      ? {
          id: openOrder.id,
          status: openOrder.status,
          side: openOrder.side,
          price: openOrder.price,
          remaining: openOrder.remaining,
          selection: openOrder.selection,
        }
      : null,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(proof, null, 2)}\n`);
  console.log(JSON.stringify(proof, null, 2));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
