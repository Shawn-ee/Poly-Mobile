import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

process.env.INTERNAL_TRADING_BETA_ENABLED = "true";
process.env.TRADING_KILL_SWITCH = "false";

const DEFAULT_BASE_URL = "http://127.0.0.1:3002";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/cycle-LT-home-to-portfolio-route-journey/cycle-LT-home-to-portfolio-route-journey.json";

const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.slice().reverse().find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

const responseJson = async (response: Response) => {
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
};

async function fetchJson(url: string) {
  const response = await fetch(url);
  const body = await response.json().catch(() => ({}));
  assert(response.ok, `Expected ${url} ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function createUserWithCredential(suffix: string) {
  const [{ prisma }, { API_KEY_SCOPES, createApiCredential }] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/canonicalAuth"),
  ]);
  const user = await prisma.user.create({
    data: {
      username: `cycle_lt_home_journey_${suffix}`,
      email: `cycle_lt_home_journey_${suffix}@local.test`,
      isAdmin: true,
    },
  });
  await prisma.userBalance.create({
    data: { userId: user.id, availableUSDC: dec("10000"), lockedUSDC: dec("0") },
  });
  const credential = await createApiCredential({
    userId: user.id,
    name: "Cycle LT Home to Portfolio route journey proof",
    scopes: API_KEY_SCOPES,
  });
  return { user, credential };
}

async function createMakerForMarket(params: {
  marketId: string;
  outcomeId: string;
  askPrice: string;
  askSize: string;
  minRemainingSize: string;
}) {
  const [{ mintCompleteSetForPublicOrderbook }, { cancelOrderAndUnlock, placeOrderAndMatch }] = await Promise.all([
    import("@/server/services/orderbookCollateral"),
    import("@/server/services/matching"),
  ]);
  const { prisma } = await import("@/lib/db");
  const staleProofBids = await prisma.order.findMany({
    where: {
      marketId: params.marketId,
      outcomeId: params.outcomeId,
      side: "BUY",
      status: { in: ["OPEN", "PARTIAL"] },
      price: { gte: dec(params.askPrice) },
      user: {
        OR: [
          { email: { endsWith: "@local.test" } },
          { username: { startsWith: "cycle_" } },
          { username: { startsWith: "cycle-" } },
          { username: { startsWith: "cycle_lt_home_journey_" } },
          { username: { startsWith: "cycle_lt_maker_" } },
          { username: { startsWith: "holiwyn-mobile-" } },
        ],
      },
    },
    select: { id: true, userId: true },
  });
  for (const order of staleProofBids) {
    await cancelOrderAndUnlock({ orderId: order.id, userId: order.userId });
  }
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `cycle_lt_maker_${suffix}`,
      email: `cycle_lt_maker_${suffix}@local.test`,
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
  const makerRemaining = dec(makerOrder.order.remaining);
  assert(
    makerOrder.order.status === "OPEN" || makerOrder.order.status === "PARTIAL",
    `Expected maker ask OPEN/PARTIAL, got ${makerOrder.order.status}.`,
  );
  assert(
    makerRemaining.greaterThanOrEqualTo(dec(params.minRemainingSize)),
    `Expected maker ask to leave at least ${params.minRemainingSize} shares, got ${makerRemaining.toString()}.`,
  );
  return { user, makerOrder };
}

async function placeRouteOrder(params: {
  token: string;
  suffix: string;
  selection: Record<string, unknown>;
  price: string;
  size: string;
}) {
  const { POST } = await import("@/app/api/orders/route");
  const response = await POST(
    new NextRequest("http://localhost/api/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.token}`,
        "Idempotency-Key": `cycle-lt-${params.suffix}`,
      },
      body: JSON.stringify({
        marketId: params.selection.marketId,
        outcomeId: params.selection.outcomeId,
        side: "BUY",
        contractSide: "YES",
        price: params.price,
        size: params.size,
        type: "LIMIT",
        clientOrderId: `cycle-lt-client-${params.suffix}`,
        selection: params.selection,
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

function pickLineMarket(detail: any) {
  const markets = Array.isArray(detail.markets) ? detail.markets : [];
  return (
    markets.find((market: any) =>
      market.referenceSource === "contract-fixture" &&
      market.marketType === "spread" &&
      market.line === "1.5" &&
      Array.isArray(market.outcomes) &&
      market.outcomes.length > 0
    ) ??
    markets.find((market: any) =>
      market.referenceSource === "contract-fixture" &&
      ["spread", "total_goals", "team_total_goals"].includes(market.marketType) &&
      Array.isArray(market.outcomes) &&
      market.outcomes.length > 0
    )
  );
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run local MVP journey proof in production.");
  }

  const baseUrl = argValue("baseUrl") ?? DEFAULT_BASE_URL;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const cycle = argValue("cycle") ?? "LT";
  const suffix = randomUUID().slice(0, 8);
  const askPrice = argValue("price") ?? "0.52";
  const size = argValue("size") ?? "10";

  const homeUrl = `${baseUrl}/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10`;
  const home = await fetchJson(homeUrl);
  const homeEvents = Array.isArray(home.events) ? home.events : [];
  const selectedHomeEvent = homeEvents.find((event: any) =>
    event.marketSourceSummary?.regulationWinner?.status === "provider-backed" &&
    event.marketSourceSummary?.lineMarkets?.status === "contract-fixture"
  );
  assert(selectedHomeEvent, "Home route did not expose an MVP-ready event with provider-backed winner and contract-fixture lines.");

  const detailUrl = `${baseUrl}/api/mobile/events/${encodeURIComponent(selectedHomeEvent.slug)}/live-detail`;
  const detail = await fetchJson(detailUrl);
  assert(detail.event?.marketSourceSummary?.regulationWinner?.status === "provider-backed", "Detail route lost provider-backed winner status.");
  assert(detail.event?.marketSourceSummary?.lineMarkets?.status === "contract-fixture", "Detail route lost contract-fixture line status.");

  const selectedMarket = pickLineMarket(detail);
  assert(selectedMarket, "Detail route did not expose a contract-fixture line market.");
  const selectedOutcome =
    selectedMarket.outcomes.find((outcome: any) => outcome.side === "away" || outcome.side === "over" || outcome.side === "home") ??
    selectedMarket.outcomes[0];
  assert(selectedOutcome, "Selected line market has no outcome.");

  const selection = {
    marketId: selectedMarket.id,
    outcomeId: selectedOutcome.id,
    marketGroupId: selectedMarket.marketGroupId ?? selectedMarket.marketGroupKey,
    marketType: selectedMarket.marketType,
    line: selectedMarket.line ?? null,
    period: selectedMarket.period ?? "regulation",
    side: selectedOutcome.side,
    displayLabel: selectedOutcome.label ?? selectedOutcome.name,
    contractSide: "yes",
    referenceSource: selectedMarket.referenceSource,
    providerSource: selectedMarket.referenceSource,
    externalSlug: selectedMarket.externalSlug,
    externalMarketId: selectedMarket.externalMarketId,
    conditionId: selectedMarket.conditionId,
    referenceTokenId: selectedOutcome.referenceTokenId,
    tokenId: selectedOutcome.referenceTokenId,
    referenceOutcomeLabel: selectedOutcome.referenceOutcomeLabel,
    limitPrice: Number(askPrice),
    limitSide: "ask",
    limitShares: Number(size),
  };

  const { credential } = await createUserWithCredential(suffix);
  const maker = await createMakerForMarket({
    marketId: selectedMarket.id,
    outcomeId: selectedOutcome.id,
    askPrice,
    askSize: "25",
    minRemainingSize: size,
  });
  const orderResponse = await placeRouteOrder({
    token: credential.token,
    suffix,
    selection,
    price: askPrice,
    size,
  });
  const portfolio = await getPortfolio(credential.token);
  const history = await getPortfolioHistory(credential.token);

  const order = orderResponse.order;
  const position = portfolio.positions?.find((item: any) =>
    item.market?.id === selectedMarket.id && item.outcomeId === selectedOutcome.id,
  );
  const recentTrade = history.recentTrades?.find((item: any) =>
    item.market?.id === selectedMarket.id && item.outcome?.id === selectedOutcome.id,
  );

  assert(order?.status === "FILLED", `Expected taker order FILLED, got ${order?.status}.`);
  assert(order?.selection?.marketId === selectedMarket.id, "Order response lost selected market id.");
  assert(order?.selection?.outcomeId === selectedOutcome.id, "Order response lost selected outcome id.");
  assert(order?.selection?.referenceSource === "contract-fixture", "Order response lost contract-fixture source.");
  assert(position, "Expected filled position from Home-selected line market.");
  assert(position.selection?.line === selectedMarket.line, "Portfolio position lost selected line.");
  assert(position.selection?.referenceTokenId === selectedOutcome.referenceTokenId, "Portfolio position lost selected token.");
  assert(recentTrade, "Expected recent trade from Home-selected line market.");
  assert(portfolio.selectionSourceSummary?.positions?.lineMarkets?.status === "contract-fixture", "Portfolio summary did not classify position line as contract-fixture.");
  assert(history.selectionSourceSummary?.recentTrades?.lineMarkets?.status === "contract-fixture", "History summary did not classify recent trade line as contract-fixture.");

  const summary = {
    pass: true,
    generatedAt: new Date().toISOString(),
    cycle,
    scope: "home-to-portfolio-route-journey",
    routes: {
      home: homeUrl,
      detail: detailUrl,
      order: "/api/orders",
      portfolio: "/api/portfolio",
      history: "/api/portfolio/history",
    },
    home: {
      selectedSlug: selectedHomeEvent.slug,
      selectedTitle: selectedHomeEvent.title,
      marketSourceSummary: selectedHomeEvent.marketSourceSummary,
    },
    detail: {
      eventSlug: detail.event?.slug,
      eventTitle: detail.event?.title,
      marketSourceSummary: detail.event?.marketSourceSummary,
      marketCount: detail.markets?.length ?? 0,
    },
    selection,
    maker: {
      userId: maker.user.id,
      orderId: maker.makerOrder.order.id,
      status: maker.makerOrder.order.status,
    },
    order: {
      id: order.id,
      status: order.status,
      side: order.side,
      selection: order.selection,
    },
    portfolio: {
      position: position
        ? {
            marketId: position.market.id,
            outcomeId: position.outcomeId,
            shares: position.shares,
            selection: position.selection,
          }
        : null,
      selectionSourceSummary: portfolio.selectionSourceSummary,
    },
    history: {
      recentTrade: recentTrade
        ? {
            id: recentTrade.id,
            side: recentTrade.side,
            selection: recentTrade.selection,
          }
        : null,
      selectionSourceSummary: history.selectionSourceSummary,
    },
    assertions: {
      homeSelectedMvpReadyEvent: Boolean(selectedHomeEvent),
      detailSourceSummaryMatchesHome:
        detail.event?.marketSourceSummary?.regulationWinner?.status === selectedHomeEvent.marketSourceSummary?.regulationWinner?.status &&
        detail.event?.marketSourceSummary?.lineMarkets?.status === selectedHomeEvent.marketSourceSummary?.lineMarkets?.status,
      routeOrderFilled: order.status === "FILLED",
      portfolioPositionPresent: Boolean(position),
      historyRecentTradePresent: Boolean(recentTrade),
      selectedLinePreserved: position?.selection?.line === selectedMarket.line,
      selectedTokenPreserved: position?.selection?.referenceTokenId === selectedOutcome.referenceTokenId,
      portfolioLineSourceSummary: portfolio.selectionSourceSummary?.positions?.lineMarkets?.status,
      historyLineSourceSummary: history.selectionSourceSummary?.recentTrades?.lineMarkets?.status,
      androidProof: "not-run-in-this-backend-route-cycle",
    },
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main()
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = await import("@/lib/db");
    await prisma.$disconnect();
  });
