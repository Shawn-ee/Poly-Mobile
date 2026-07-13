import "./load_local_env_side_effect";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { API_KEY_SCOPES, createApiCredential } from "@/lib/canonicalAuth";
import { mintCompleteSetForPublicOrderbook } from "@/server/services/orderbookCollateral";
import { cancelOrderAndUnlock, placeOrderAndMatch } from "@/server/services/matching";
import { oddsApiSingleEventSlug } from "@/server/services/theOddsApiSingleEventProvider";
import { submitTicketOrder } from "../mobile/src/services/orderService";
import { closePositionOnServer } from "../mobile/src/services/positionCloseService";
import { loadPortfolioSnapshot } from "../mobile/src/services/portfolioSnapshotService";
import type { PolyApi } from "../mobile/src/api";

const DEFAULT_BASE_URL = "http://127.0.0.1:3002";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/the-odds-api-single-event/mobile-flow-proof.redacted.json";

const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  assert(response.ok, `Expected ${url} ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function createUser(prefix: string, balance = "10000") {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `${prefix}_${suffix}`,
      email: `${prefix}_${suffix}@local.test`,
      isAdmin: true,
    },
  });
  await prisma.userBalance.create({
    data: { userId: user.id, availableUSDC: dec(balance), lockedUSDC: dec("0") },
  });
  return user;
}

async function cancelRestingOrders(params: {
  marketId: string;
  outcomeId: string;
  side: "BUY" | "SELL";
  price: number;
}) {
  const orders = await prisma.order.findMany({
    where: {
      marketId: params.marketId,
      outcomeId: params.outcomeId,
      side: params.side,
      status: { in: ["OPEN", "PARTIAL"] },
      price:
        params.side === "SELL"
          ? { lte: dec(params.price.toFixed(2)) }
          : { gte: dec(params.price.toFixed(2)) },
    },
    select: { id: true, userId: true },
  });
  for (const order of orders) {
    await cancelOrderAndUnlock({ orderId: order.id, userId: order.userId });
  }
  return orders.length;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run The Odds API mobile flow proof in production.");
  }
  const baseUrl = argValue("baseUrl") ?? DEFAULT_BASE_URL;
  const eventSlug = argValue("eventSlug") ?? oddsApiSingleEventSlug();
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const amount = Number(argValue("amount") ?? "1.25");

  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      markets: {
        where: {
          referenceSource: "sportsbook-odds",
          isListed: true,
          visibility: "PUBLIC",
          status: "LIVE",
          outcomes: { some: { isActive: true, isTradable: true, referenceTokenId: { not: null } } },
        },
        include: {
          outcomes: {
            where: { isActive: true, isTradable: true, referenceTokenId: { not: null } },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          },
          referenceQuoteSnapshots: {
            orderBy: [{ fetchedAt: "desc" }, { updatedAt: "desc" }],
            take: 10,
          },
        },
        orderBy: [{ marketGroupKey: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  assert(event, `Missing seeded event ${eventSlug}. Run mobile:the-odds-api-single-event first.`);

  const [homePayload, detailPayload] = await Promise.all([
    fetchJson(`${baseUrl}/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10`),
    fetchJson(`${baseUrl}/api/mobile/events/${encodeURIComponent(eventSlug)}/live-detail`),
  ]);
  assert(
    Array.isArray(homePayload.events) && homePayload.events.some((item: { slug?: string }) => item.slug === eventSlug),
    "Home route did not expose the seeded sportsbook event.",
  );
  assert(Array.isArray(detailPayload.markets) && detailPayload.markets.length > 0, "Event Detail route exposed no markets.");

  const visibleMarket =
    detailPayload.markets.find(
      (item: { referenceSource?: string; marketType?: string; line?: string | number | null }) =>
        item.referenceSource === "sportsbook-odds" &&
        item.marketType === "total_goals" &&
        String(item.line ?? "") === "2.5",
    ) ??
    detailPayload.markets.find(
      (item: { referenceSource?: string; marketType?: string }) =>
        item.referenceSource === "sportsbook-odds" && item.marketType === "total_goals",
    ) ??
    detailPayload.markets.find((item: { marketType?: string }) => item.marketType === "total_goals") ??
    detailPayload.markets.find((item: { marketType?: string }) => item.marketType === "spread") ??
    detailPayload.markets[0];
  assert(visibleMarket?.id, "Event Detail route did not expose a selectable mobile market.");

  const market = await prisma.market.findFirst({
    where: {
      id: visibleMarket.id,
      eventId: event.id,
      isListed: true,
      visibility: "PUBLIC",
      status: "LIVE",
      outcomes: { some: { isActive: true, isTradable: true } },
    },
    include: {
      outcomes: {
        where: { isActive: true, isTradable: true },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
      referenceQuoteSnapshots: {
        orderBy: [{ fetchedAt: "desc" }, { updatedAt: "desc" }],
        take: 10,
      },
    },
  });
  assert(market, `Mobile-visible market ${visibleMarket.id} is not tradable in the database.`);
  const visibleOutcomeId = Array.isArray(visibleMarket.outcomes) ? visibleMarket.outcomes[0]?.id : null;
  const outcome = market.outcomes.find((item) => item.id === visibleOutcomeId) ?? market.outcomes[0];
  assert(outcome, `Selected market ${market.id} has no tradable outcome.`);
  const quote = market.referenceQuoteSnapshots.find((snapshot) => snapshot.outcomeId === outcome.id) ?? null;
  const price = Number(quote?.bestAsk ?? quote?.outcomePrice ?? "0.55");
  assert(Number.isFinite(price) && price > 0 && price < 1, "Selected sportsbook reference price is invalid.");

  const canceledBlockingAsksBeforeBuy = await cancelRestingOrders({
    marketId: market.id,
    outcomeId: outcome.id,
    side: "SELL",
    price,
  });
  const maker = await createUser("odds_api_single_event_maker", "1000");
  await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: maker.id, quantity: "200" });
  const makerOrder = await placeOrderAndMatch({
    marketId: market.id,
    userId: maker.id,
    outcomeId: outcome.id,
    side: "SELL",
    price: price.toFixed(2),
    size: "200",
    type: "LIMIT",
  });
  assert(
    makerOrder.order.status === "OPEN" || makerOrder.order.status === "PARTIAL",
    "Expected local maker sell quote to rest for the fake-token mobile buy.",
  );

  const buyer = await createUser("odds_api_single_event_buyer");
  const credential = await createApiCredential({
    userId: buyer.id,
    name: "The Odds API single-event mobile flow proof",
    scopes: API_KEY_SCOPES,
  });
  const api = {
    placeLimitOrder: async (input: unknown) =>
      fetchJson(`${baseUrl}/api/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credential.token}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `odds-api-single-event-${randomUUID()}`,
        },
        body: JSON.stringify({
          ...(input as Record<string, unknown>),
          type: "LIMIT",
          clientOrderId: `odds-api-single-event-${randomUUID()}`,
        }),
      }),
    getPortfolio: async () =>
      fetchJson(`${baseUrl}/api/portfolio`, {
        headers: { Authorization: `Bearer ${credential.token}` },
      }),
  } as unknown as PolyApi;

  const quotePayload = await fetchJson(`${baseUrl}/api/markets/${encodeURIComponent(market.id)}/quote`);

  const probability = Math.max(1, Math.min(99, Math.round(price * 100)));
  const orderResult = await submitTicketOrder({
    mode: "server",
    api,
    event: {
      id: event.id,
      title: event.title,
      status: "live",
      homeTeam: event.homeTeamName ?? "Home",
      awayTeam: event.awayTeamName ?? "Away",
      homeFlag: "",
      awayFlag: "",
      time: "Live",
      markets: [],
    },
    market: {
      id: market.id,
      title: market.title,
      type: "game-line",
      marketType: market.marketType === "spread" ? "spread" : market.marketType === "total_goals" ? "totals" : "moneyline",
      marketGroupId: market.marketGroupKey ?? undefined,
      line: market.line?.toString() ?? undefined,
      period: market.period ?? undefined,
      referenceSource: market.referenceSource ?? undefined,
      externalSlug: market.externalSlug ?? undefined,
      externalMarketId: market.externalMarketId ?? undefined,
      conditionId: market.conditionId ?? undefined,
      outcomes: [],
    },
    outcome: {
      id: outcome.id,
      label: outcome.label ?? outcome.name,
      probability,
      color: "#16a34a",
      side: outcome.side ?? "yes",
      referenceTokenId: outcome.referenceTokenId ?? undefined,
      referenceOutcomeLabel: outcome.referenceOutcomeLabel ?? outcome.name,
      bestAsk: probability,
      bestBid: Math.max(1, probability - 4),
    },
    selection: {
      marketType: market.marketType === "spread" ? "spread" : market.marketType === "total_goals" ? "totals" : "winner",
      marketId: market.id,
      outcomeId: outcome.id,
      marketGroupId: market.marketGroupKey ?? undefined,
      line: market.line?.toString() ?? undefined,
      period: market.period ?? undefined,
      side: outcome.side ?? undefined,
      displayLabel: outcome.label ?? outcome.name,
      contractSide: "yes",
      referenceSource: market.referenceSource ?? undefined,
      externalSlug: market.externalSlug ?? undefined,
      externalMarketId: market.externalMarketId ?? undefined,
      conditionId: market.conditionId ?? undefined,
      referenceTokenId: outcome.referenceTokenId ?? undefined,
      referenceOutcomeLabel: outcome.referenceOutcomeLabel ?? outcome.name,
      limitPrice: price,
      limitSide: "ask",
    },
    contractSide: "yes",
    side: "buy",
    amount,
  });
  assert(orderResult.status === "FILLED", `Expected fake-token order FILLED, got ${orderResult.status}.`);

  const portfolio = await loadPortfolioSnapshot(api);
  const position = portfolio.positions.find((item) => item.marketId === market.id && item.outcomeId === outcome.id);
  assert(position, "Portfolio did not show the filled sportsbook-derived position.");

  await cancelOrderAndUnlock({ orderId: makerOrder.order.id, userId: maker.id });
  const canceledBlockingBidsBeforeCashout = await cancelRestingOrders({
    marketId: market.id,
    outcomeId: outcome.id,
    side: "BUY",
    price,
  });
  const cashoutMaker = await createUser("odds_api_single_event_cashout_maker", "1000");
  const cashoutBid = await placeOrderAndMatch({
    marketId: market.id,
    userId: cashoutMaker.id,
    outcomeId: outcome.id,
    side: "BUY",
    price: price.toFixed(2),
    size: "200",
    type: "LIMIT",
  });
  assert(
    cashoutBid.order.status === "OPEN" || cashoutBid.order.status === "PARTIAL",
    "Expected local maker buy bid to rest for the fake-token mobile cashout.",
  );
  await closePositionOnServer({ mode: "server", api, position });

  const portfolioAfterCashout = await loadPortfolioSnapshot(api);
  const positionAfterCashout = portfolioAfterCashout.positions.find(
    (item) => item.marketId === market.id && item.outcomeId === outcome.id,
  );
  assert(
    !positionAfterCashout || positionAfterCashout.shares < position.shares,
    "Portfolio position did not reduce after sportsbook-derived cashout sell.",
  );
  const historyPayload = await fetchJson(`${baseUrl}/api/portfolio/history`, {
    headers: { Authorization: `Bearer ${credential.token}` },
  });
  const matchingHistoryTrades = (Array.isArray(historyPayload.recentTrades) ? historyPayload.recentTrades : []).filter(
    (item: { market?: { id?: string }; outcome?: { id?: string } }) =>
      item.market?.id === market.id && item.outcome?.id === outcome.id,
  );
  const buyHistoryTrade = matchingHistoryTrades.find((item: { side?: string }) => item.side === "BUY");
  const sellHistoryTrade = matchingHistoryTrades.find((item: { side?: string }) => item.side === "SELL");
  assert(buyHistoryTrade, "Portfolio history did not show the filled sportsbook-derived buy trade.");
  assert(sellHistoryTrade, "Portfolio history did not show the filled sportsbook-derived cashout sell trade.");

  const summary = {
    pass: true,
    generatedAt: new Date().toISOString(),
    scope: "the-odds-api-single-event-mobile-fake-token-flow",
    policy: {
      providerSource: "the-odds-api",
      referenceSource: "sportsbook-odds",
      fakeTokenOnly: true,
      doesNotClaimPolymarketBacked: true,
    },
    routes: {
      home: "/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1",
      detail: "/api/mobile/events/:slug/live-detail",
      quote: "/api/markets/:marketId/quote",
      order: "POST /api/orders",
      portfolio: "/api/portfolio",
      history: "/api/portfolio/history",
    },
    event: { id: event.id, slug: event.slug, title: event.title },
    market: {
      id: market.id,
      slug: market.slug,
      title: market.title,
      marketType: market.marketType,
      marketGroupTitle: market.marketGroupTitle,
      line: market.line?.toString() ?? null,
      referenceSource: market.referenceSource,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
    },
    outcome: {
      id: outcome.id,
      name: outcome.name,
      referenceTokenId: outcome.referenceTokenId,
      referenceOutcomeLabel: outcome.referenceOutcomeLabel,
    },
    makerQuote: {
      orderId: makerOrder.order.id,
      price: makerOrder.order.price,
      remaining: makerOrder.order.remaining,
      canceledBlockingAsksBeforeBuy,
    },
    checks: {
      homeVisible: true,
      detailVisible: true,
      quoteVisible: Array.isArray(quotePayload.quotes) && quotePayload.quotes.length > 0,
      ticketOrderSubmitted: true,
      fakeTokenOrderFilled: orderResult.status === "FILLED",
      portfolioPositionVisible: Boolean(position),
      cashoutEligible: true,
      cashoutSellSubmitted: true,
      portfolioPositionReducedAfterCashout: !positionAfterCashout || positionAfterCashout.shares < position.shares,
      buyHistoryTradeVisible: Boolean(buyHistoryTrade),
      sellHistoryTradeVisible: Boolean(sellHistoryTrade),
    },
    orderResult,
    portfolioPosition: position,
    cashout: {
      makerBidOrderId: cashoutBid.order.id,
      makerBidPrice: cashoutBid.order.price,
      makerBidRemaining: cashoutBid.order.remaining,
      canceledBlockingBidsBeforeCashout,
      positionSharesBefore: position.shares,
      positionSharesAfter: positionAfterCashout?.shares ?? 0,
    },
    historyTrades: {
      buy: buyHistoryTrade,
      sell: sellHistoryTrade,
    },
  };
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
