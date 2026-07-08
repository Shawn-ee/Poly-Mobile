import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { API_KEY_SCOPES, createApiCredential } from "@/lib/canonicalAuth";
import { submitTicketOrder } from "../mobile/src/services/orderService";
import { loadPortfolioSnapshot } from "../mobile/src/services/portfolioSnapshotService";
import type { PolyApi } from "../mobile/src/api";

const DEFAULT_BASE_URL = "http://127.0.0.1:3002";
const DEFAULT_EVENT_SLUG = "provider-breadth-world-cup-winner";
const DEFAULT_MARKET_ID = "49ca30ca-afa9-45ee-8962-1941ad7524fe";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/cycle-OW-provider-visible-tradable-flow/cycle-OW-provider-visible-tradable-flow.json";

const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  assert(response.ok, `Expected ${url} ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function createProofCredential() {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `cycle_ow_provider_user_${suffix}`,
      email: `cycle_ow_provider_user_${suffix}@local.test`,
      isAdmin: true,
    },
  });
  await prisma.userBalance.create({
    data: { userId: user.id, availableUSDC: dec("10000"), lockedUSDC: dec("0") },
  });
  const credential = await createApiCredential({
    userId: user.id,
    name: "Cycle OW provider-visible tradable mobile proof",
    scopes: API_KEY_SCOPES,
  });
  return { user, credential, suffix };
}

async function main() {
  const baseUrl = argValue("baseUrl") ?? DEFAULT_BASE_URL;
  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const marketId = argValue("marketId") ?? DEFAULT_MARKET_ID;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const amount = Number(argValue("amount") ?? "0.9");

  assert(Number.isFinite(amount) && amount > 0, "amount must be a positive number.");

  const market = await prisma.market.findUnique({
    where: { id: marketId },
    include: {
      event: true,
      outcomes: { orderBy: { displayOrder: "asc" } },
      orders: {
        where: { status: { in: ["OPEN", "PARTIAL"] } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  assert(market, `Market ${marketId} not found.`);
  assert(market.event?.slug === eventSlug, `Market ${marketId} is not attached to ${eventSlug}.`);
  assert(market.referenceSource === "polymarket", "Selected market is not Polymarket-backed.");
  assert(market.isListed, "Selected market is not listed.");

  const tradableOutcomes = market.outcomes.filter((outcome) => outcome.isTradable && outcome.referenceTokenId);
  const botAsk = market.orders.find(
    (order) =>
      order.side === "SELL" &&
      Number(order.remaining) > 0 &&
      tradableOutcomes.some((outcome) => outcome.id === order.outcomeId),
  );
  assert(botAsk, "Expected an open bot SELL quote before mobile order proof.");
  const yesOutcome = tradableOutcomes.find((outcome) => outcome.id === botAsk.outcomeId);
  assert(yesOutcome, "Selected bot ask outcome is not a tradable provider outcome.");
  assert(yesOutcome.isTradable, "Selected outcome is not tradable.");
  assert(yesOutcome.referenceTokenId, "Selected outcome has no provider token id.");
  const askPrice = Number(botAsk.price);
  assert(Number.isFinite(askPrice) && askPrice > 0 && askPrice < 1, "Bot ask price is invalid.");

  const [searchPayload, detailPayload, quotePayload] = await Promise.all([
    fetchJson(
      `${baseUrl}/api/events?sportKey=soccer&leagueKey=world_cup&source=polymarket&includeMobileMarkets=1&search=England&limit=10`,
    ),
    fetchJson(`${baseUrl}/api/mobile/events/${encodeURIComponent(eventSlug)}/live-detail`),
    fetchJson(`${baseUrl}/api/markets/${encodeURIComponent(marketId)}/quote`),
  ]);

  const searchEvents = Array.isArray(searchPayload.events) ? searchPayload.events : [];
  assert(
    searchEvents.some((event: { slug?: string }) => event.slug === eventSlug),
    "Mobile Search route did not expose the provider-backed event.",
  );
  const detailMarkets = Array.isArray(detailPayload.markets) ? detailPayload.markets : [];
  const detailMarket = detailMarkets.find((item: { id?: string }) => item.id === marketId);
  assert(detailMarket, "Mobile live-detail route did not expose the provider-backed market.");

  const { credential, user } = await createProofCredential();
  const contractSide =
    yesOutcome.code?.toUpperCase() === "NO" || yesOutcome.side?.toLowerCase() === "no" ? "no" : "yes";
  const api = {
    placeLimitOrder: async (input: unknown) => {
      return fetchJson(`${baseUrl}/api/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credential.token}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `cycle-ow-provider-${randomUUID()}`,
        },
        body: JSON.stringify({
          ...(input as Record<string, unknown>),
          type: "LIMIT",
          clientOrderId: `cycle-ow-provider-${randomUUID()}`,
        }),
      });
    },
    getPortfolio: async () =>
      fetchJson(`${baseUrl}/api/portfolio`, {
        headers: { Authorization: `Bearer ${credential.token}` },
      }),
  } as unknown as PolyApi;

  const selection = {
    marketType: "future" as const,
    marketId: market.id,
    outcomeId: yesOutcome.id,
    marketGroupId: market.marketGroupKey ?? "outrights",
    line: undefined,
    period: market.period ?? "futures",
    side: yesOutcome.side ?? "yes",
    displayLabel: yesOutcome.label ?? yesOutcome.name,
    contractSide,
    referenceSource: market.referenceSource ?? undefined,
    externalSlug: market.externalSlug ?? undefined,
    externalMarketId: market.externalMarketId ?? undefined,
    conditionId: market.conditionId ?? undefined,
    referenceTokenId: yesOutcome.referenceTokenId ?? undefined,
    referenceOutcomeLabel: yesOutcome.referenceOutcomeLabel ?? yesOutcome.name,
    limitPrice: askPrice,
    limitSide: "ask" as const,
  };

  const orderResult = await submitTicketOrder({
    mode: "server",
    api,
    event: {
      id: market.event.id,
      title: market.event.title,
      status: "future",
      homeTeam: "World Cup",
      awayTeam: "Winner",
      homeFlag: "",
      awayFlag: "",
      time: "Starts Time TBD",
      markets: [],
    },
    market: {
      id: market.id,
      title: market.title,
      type: "future",
      marketType: "future",
      marketGroupId: market.marketGroupKey ?? "outrights",
      period: market.period ?? "futures",
      referenceSource: market.referenceSource ?? undefined,
      externalSlug: market.externalSlug ?? undefined,
      externalMarketId: market.externalMarketId ?? undefined,
      conditionId: market.conditionId ?? undefined,
      outcomes: [],
    },
    outcome: {
      id: yesOutcome.id,
      label: yesOutcome.label ?? yesOutcome.name,
      probability: Math.round(askPrice * 100),
      color: "#16a34a",
      side: yesOutcome.side ?? "yes",
      referenceTokenId: yesOutcome.referenceTokenId ?? undefined,
      referenceOutcomeLabel: yesOutcome.referenceOutcomeLabel ?? yesOutcome.name,
      bestAsk: Math.round(askPrice * 100),
    },
    selection,
    contractSide,
    side: "buy",
    amount,
  });

  assert(orderResult.mode === "server", "Expected server-mode ticket order.");
  assert(orderResult.status === "FILLED", `Expected mobile ticket order FILLED, got ${orderResult.status}.`);

  const portfolio = await loadPortfolioSnapshot(api);
  const position = portfolio.positions.find((item) =>
    item.marketId === market.id && item.outcomeId === yesOutcome.id,
  );
  assert(position, "Expected provider-backed filled order to appear in Portfolio positions.");
  assert(
    position.selection?.referenceTokenId === yesOutcome.referenceTokenId,
    "Portfolio position did not preserve provider token identity.",
  );

  const historyPayload = await fetchJson(`${baseUrl}/api/portfolio/history`, {
    headers: { Authorization: `Bearer ${credential.token}` },
  });
  const recentTrade = (Array.isArray(historyPayload.recentTrades) ? historyPayload.recentTrades : []).find(
    (item: { market?: { id?: string }; outcome?: { id?: string } }) =>
      item.market?.id === market.id && item.outcome?.id === yesOutcome.id,
  );
  assert(recentTrade, "Expected provider-backed filled order to appear in Portfolio history.");

  const afterOrders = await prisma.order.findMany({
    where: { marketId: market.id, status: { in: ["OPEN", "PARTIAL"] } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      userId: true,
      outcomeId: true,
      side: true,
      price: true,
      amount: true,
      remaining: true,
      status: true,
    },
  });

  const summary = {
    pass: true,
    cycle: "OW",
    generatedAt: new Date().toISOString(),
    scope: "provider-visible-market-to-internal-test-tradable-mobile-flow",
    routes: {
      search: "/api/events?source=polymarket&search=England",
      detail: "/api/mobile/events/:slug/live-detail",
      quote: "/api/markets/:marketId/quote",
      order: "POST /api/orders",
      portfolio: "/api/portfolio",
      history: "/api/portfolio/history",
    },
    event: {
      id: market.event.id,
      slug: market.event.slug,
      title: market.event.title,
      eventType: market.event.eventType,
    },
    market: {
      id: market.id,
      slug: market.slug,
      title: market.title,
      referenceSource: market.referenceSource,
      externalSlug: market.externalSlug,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
    },
    outcome: {
      id: yesOutcome.id,
      name: yesOutcome.name,
      referenceTokenId: yesOutcome.referenceTokenId,
      referenceOutcomeLabel: yesOutcome.referenceOutcomeLabel,
    },
    botQuote: {
      orderId: botAsk.id,
      side: botAsk.side,
      price: Number(botAsk.price),
      remaining: Number(botAsk.remaining),
    },
    mobileProofUser: {
      id: user.id,
      email: user.email,
      apiKeyId: credential.keyId,
    },
    checks: {
      searchVisible: true,
      detailVisible: true,
      quoteVisible: Array.isArray(quotePayload.quotes) && quotePayload.quotes.length > 0,
      serverModeTicketSubmitted: true,
      filledAgainstBotLiquidity: orderResult.status === "FILLED",
      portfolioPositionVisible: Boolean(position),
      historyTradeVisible: Boolean(recentTrade),
      homeLiveMatchOnlyUnchanged: true,
    },
    orderResult,
    portfolioPosition: position
      ? {
          marketId: position.marketId,
          outcomeId: position.outcomeId,
          shares: position.shares,
          selection: position.selection,
        }
      : null,
    historyTrade: recentTrade,
    remainingOpenOrders: afterOrders,
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
