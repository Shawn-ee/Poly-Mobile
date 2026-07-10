import fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";

process.env.INTERNAL_TRADING_BETA_ENABLED = "true";
process.env.TRADING_KILL_SWITCH = "false";

const DEFAULT_EVENT_SLUG = "switzerland-vs-colombia";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-LO-match-line-order-lifecycle/cycle-LO-match-line-order-lifecycle.json";
const DEFAULT_PROOF_PRICE = "0.99";

const dec = (value: Prisma.Decimal.Value) => value;

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

function loadLocalDatabaseUrlIfNeeded() {
  if (process.env.DATABASE_URL) return;
  try {
    const envFile = readFileSync(".env", "utf8");
    const line = envFile
      .split(/\r?\n/)
      .map((entry) => entry.replace(/^\uFEFF/, "").trimStart())
      .find((entry) => entry.startsWith("DATABASE_URL="));
    if (!line) return;
    let value = line.slice("DATABASE_URL=".length).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env.DATABASE_URL = value;
  } catch {
    // Leave the original Prisma error if local env loading is unavailable.
  }
}

const responseJson = async (response: Response) => {
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
};

async function createUserWithCredential(suffix: string) {
  const [{ prisma }, { API_KEY_SCOPES, createApiCredential }] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/canonicalAuth"),
  ]);
  const user = await prisma.user.create({
    data: {
      username: `cycle_lo_match_line_${suffix}`,
      email: `cycle_lo_match_line_${suffix}@local.test`,
      isAdmin: true,
    },
  });
  await prisma.userBalance.create({
    data: { userId: user.id, availableUSDC: dec("10000"), lockedUSDC: dec("0") },
  });
  const credential = await createApiCredential({
    userId: user.id,
    name: "Cycle LO match line lifecycle proof",
    scopes: API_KEY_SCOPES,
  });
  return { user, credential };
}

async function createMakerForMarket(params: {
  marketId: string;
  outcomeId: string;
  askPrice: string;
  askSize: string;
}) {
  const [{ mintCompleteSetForPublicOrderbook }, { placeOrderAndMatch }] = await Promise.all([
    import("@/server/services/orderbookCollateral"),
    import("@/server/services/matching"),
  ]);
  const { prisma } = await import("@/lib/db");
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `cycle_lo_maker_${suffix}`,
      email: `cycle_lo_maker_${suffix}@local.test`,
    },
  });
  await prisma.userBalance.create({
    data: { userId: user.id, availableUSDC: dec("1000"), lockedUSDC: dec("0") },
  });
  await mintCompleteSetForPublicOrderbook({
    marketId: params.marketId,
    userId: user.id,
    quantity: "100",
  });
  const makerOrder = await placeOrderAndMatch({
    marketId: params.marketId,
    outcomeId: params.outcomeId,
    userId: user.id,
    side: "SELL",
    type: "LIMIT",
    price: params.askPrice,
    size: params.askSize,
  });
  assert(makerOrder.order.status === "OPEN", `Expected maker ask to rest OPEN, got ${makerOrder.order.status}.`);
  return { user, makerOrder };
}

async function loadTarget(eventSlug: string) {
  const { prisma } = await import("@/lib/db");
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      markets: {
        where: {
          status: "LIVE",
          visibility: "PUBLIC",
          mechanism: "ORDERBOOK",
          marketType: "spread",
        },
        orderBy: [{ line: "desc" }, { displayOrder: "asc" }],
        include: {
          outcomes: {
            where: { isActive: true, isTradable: true },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });
  assert(event, `Event ${eventSlug} was not found.`);
  const market = event.markets.find((item) => item.line?.toString() === "1.5") ?? event.markets[0];
  assert(market, `Event ${eventSlug} has no enriched spread market.`);
  const outcome =
    market.outcomes.find((item) => item.side === "away") ??
    market.outcomes.find((item) => item.side === "home") ??
    market.outcomes[0];
  assert(outcome, `Market ${market.id} has no tradable outcome.`);
  return { event, market, outcome };
}

async function placeRouteOrder(params: {
  token: string;
  suffix: string;
  market: Awaited<ReturnType<typeof loadTarget>>["market"];
  outcome: Awaited<ReturnType<typeof loadTarget>>["outcome"];
  price: string;
  size: string;
}) {
  const { POST } = await import("@/app/api/orders/route");
  const selection = {
    marketId: params.market.id,
    outcomeId: params.outcome.id,
    marketGroupId: params.market.marketGroupKey,
    marketType: "spread",
    line: params.market.line?.toString() ?? null,
    period: params.market.period ?? "regulation",
    side: params.outcome.side,
    displayLabel: params.outcome.label ?? params.outcome.name,
    contractSide: "yes",
    referenceSource: params.market.referenceSource,
    providerSource: params.market.referenceSource,
    externalSlug: params.market.externalSlug,
    externalMarketId: params.market.externalMarketId,
    conditionId: params.market.conditionId,
    referenceTokenId: params.outcome.referenceTokenId,
    tokenId: params.outcome.referenceTokenId,
    referenceOutcomeLabel: params.outcome.referenceOutcomeLabel,
    limitPrice: Number(params.price),
    limitSide: "ask",
    limitShares: Number(params.size),
  };

  const response = await POST(
    new NextRequest("http://localhost/api/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.token}`,
        "Idempotency-Key": `cycle-lo-${params.suffix}`,
      },
      body: JSON.stringify({
        marketId: params.market.id,
        outcomeId: params.outcome.id,
        side: "BUY",
        contractSide: "YES",
        price: params.price,
        size: params.size,
        type: "LIMIT",
        clientOrderId: `cycle-lo-client-${params.suffix}`,
        selection,
      }),
    }),
  );
  const result = await responseJson(response);
  assert(result.status === 200, `Expected POST /api/orders 200, got ${result.status}: ${JSON.stringify(result.body)}`);
  return result.body;
}

async function getPortfolio(token: string) {
  const { GET } = await import("@/app/api/portfolio/route");
  const response = await GET(new NextRequest("http://localhost/api/portfolio", {
    headers: { Authorization: `Bearer ${token}` },
  }));
  const result = await responseJson(response);
  assert(result.status === 200, `Expected /api/portfolio 200, got ${result.status}: ${JSON.stringify(result.body)}`);
  return result.body;
}

async function getPortfolioHistory(token: string) {
  const { GET } = await import("@/app/api/portfolio/history/route");
  const response = await GET(new NextRequest("http://localhost/api/portfolio/history", {
    headers: { Authorization: `Bearer ${token}` },
  }));
  const result = await responseJson(response);
  assert(result.status === 200, `Expected /api/portfolio/history 200, got ${result.status}: ${JSON.stringify(result.body)}`);
  return result.body;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run local MVP lifecycle proof in production.");
  }
  loadLocalDatabaseUrlIfNeeded();

  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const cycle = argValue("cycle") ?? "LO";
  const suffix = randomUUID().slice(0, 8);
  const target = await loadTarget(eventSlug);
  const askPrice = argValue("price") ?? DEFAULT_PROOF_PRICE;
  const size = argValue("size") ?? "10";
  const { credential } = await createUserWithCredential(suffix);
  const maker = await createMakerForMarket({
    marketId: target.market.id,
    outcomeId: target.outcome.id,
    askPrice,
    askSize: "25",
  });
  const orderResponse = await placeRouteOrder({
    token: credential.token,
    suffix,
    market: target.market,
    outcome: target.outcome,
    price: askPrice,
    size,
  });
  const portfolio = await getPortfolio(credential.token);
  const history = await getPortfolioHistory(credential.token);

  const order = orderResponse.order;
  const position = portfolio.positions?.find((item: any) =>
    item.market?.id === target.market.id && item.outcomeId === target.outcome.id,
  );
  const recentTrade = history.recentTrades?.find((item: any) =>
    item.market?.id === target.market.id && item.outcome?.id === target.outcome.id,
  );

  assert(order?.status === "FILLED", `Expected taker order FILLED, got ${order?.status}.`);
  assert(order?.selection?.marketType === "spread", "Order response lost spread selection.");
  assert(position, "Expected filled spread position in /api/portfolio.");
  assert(position.selection?.line === target.market.line?.toString(), "Portfolio position lost selected spread line.");
  assert(position.selection?.referenceTokenId === target.outcome.referenceTokenId, "Portfolio position lost selected token.");
  assert(recentTrade, "Expected filled spread trade in /api/portfolio/history recentTrades.");
  assert(recentTrade.selection?.marketType === "spread", "Recent trade lost spread market type.");
  assert(
    portfolio.selectionSourceSummary?.positions?.lineMarkets?.status === "contract-fixture",
    "Portfolio position source summary did not classify the enriched line as contract-fixture.",
  );
  assert(
    history.selectionSourceSummary?.recentTrades?.lineMarkets?.status === "contract-fixture",
    "Portfolio history source summary did not classify the enriched line trade as contract-fixture.",
  );

  const summary = {
    pass: true,
    generatedAt: new Date().toISOString(),
    cycle,
    scope: "match-line-order-lifecycle",
    event: {
      slug: target.event.slug,
      title: target.event.title,
      eventType: target.event.eventType,
      liveStatus: target.event.liveStatus,
    },
    market: {
      id: target.market.id,
      title: target.market.title,
      marketType: target.market.marketType,
      marketGroupKey: target.market.marketGroupKey,
      line: target.market.line?.toString() ?? null,
      period: target.market.period,
      referenceSource: target.market.referenceSource,
      externalMarketId: target.market.externalMarketId,
      conditionId: target.market.conditionId,
    },
    outcome: {
      id: target.outcome.id,
      label: target.outcome.label ?? target.outcome.name,
      side: target.outcome.side,
      referenceTokenId: target.outcome.referenceTokenId,
    },
    maker: {
      userId: maker.user.id,
      orderId: maker.makerOrder.order.id,
      status: maker.makerOrder.order.status,
    },
    order: {
      id: order.id,
      status: order.status,
      side: order.side,
      price: order.price,
      size: order.size,
      remaining: order.remaining,
      selection: order.selection,
    },
    portfolio: {
      position: position
        ? {
            marketId: position.market.id,
            outcomeId: position.outcomeId,
            shares: position.shares,
            avgCost: position.avgCost,
            selection: position.selection,
          }
        : null,
      openOrders: portfolio.openOrders?.length ?? 0,
      selectionSourceSummary: portfolio.selectionSourceSummary,
    },
    history: {
      recentTrade: recentTrade
        ? {
            id: recentTrade.id,
            side: recentTrade.side,
            price: recentTrade.price,
            size: recentTrade.size,
            selection: recentTrade.selection,
          }
        : null,
      recentTradeCount: history.recentTrades?.length ?? 0,
      canceledOrderCount: history.canceledOrders?.length ?? 0,
      selectionSourceSummary: history.selectionSourceSummary,
    },
    assertions: {
      routeOrderFilled: order.status === "FILLED",
      portfolioPositionPresent: Boolean(position),
      historyRecentTradePresent: Boolean(recentTrade),
      selectedLinePreserved: position?.selection?.line === target.market.line?.toString(),
      selectedTokenPreserved: position?.selection?.referenceTokenId === target.outcome.referenceTokenId,
      portfolioLineSourceSummary: portfolio.selectionSourceSummary?.positions?.lineMarkets?.status,
      historyLineSourceSummary: history.selectionSourceSummary?.recentTrades?.lineMarkets?.status,
      androidProof: "not-run-s23-not-visible-to-adb",
    },
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = await import("@/lib/db");
    await prisma.$disconnect();
  });
