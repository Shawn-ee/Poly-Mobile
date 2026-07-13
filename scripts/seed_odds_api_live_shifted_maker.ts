import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { mintCompleteSetForPublicOrderbook } from "@/server/services/orderbookCollateral";
import { cancelOrderAndUnlock, placeOrderAndMatch } from "@/server/services/matching";
import { writeMarketMakerQuoteRun } from "@/server/services/marketMakerQuoteRun";

const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";
const DEFAULT_SUMMARY_PATH = "docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json";
const DEFAULT_BASE_URL = "http://127.0.0.1:3002";
const MAKER_USERNAME_PREFIX = "odds_live_runtime_shifted_maker";
const TICK_SIZE = 0.01;

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const boolFlag = (name: string) => process.argv.includes(`--${name}`);

const intArg = (name: string, fallback: number) => {
  const value = Number(argValue(name));
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const decimalToNumber = (value: Prisma.Decimal | null | undefined) => {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const clampPrice = (value: number) => Number(Math.max(0.01, Math.min(0.99, value)).toFixed(2));

async function writeJson(outputPath: string, value: unknown) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function fetchRaw(url: string) {
  const response = await fetch(url);
  const body = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, body };
}

async function cleanupPreviousMakerOrders(marketId: string) {
  const makers = await prisma.user.findMany({
    where: { username: { startsWith: MAKER_USERNAME_PREFIX } },
    select: { id: true, username: true },
  });
  if (makers.length === 0) return [];

  const orders = await prisma.order.findMany({
    where: {
      marketId,
      userId: { in: makers.map((maker) => maker.id) },
      status: { in: ["OPEN", "PARTIAL"] },
    },
    select: { id: true, userId: true, side: true, price: true, remaining: true, status: true },
  });

  const canceled = [];
  for (const order of orders) {
    const result = await cancelOrderAndUnlock({ orderId: order.id, userId: order.userId });
    canceled.push({
      orderId: order.id,
      side: order.side,
      price: order.price.toString(),
      remaining: order.remaining.toString(),
      statusBefore: order.status,
      canceled: result.order.status === "CANCELED",
    });
  }
  return canceled;
}

async function createMaker(balance = "10000") {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `${MAKER_USERNAME_PREFIX}_${suffix}`,
      email: `${MAKER_USERNAME_PREFIX}_${suffix}@local.test`,
      isAdmin: true,
    },
  });
  await prisma.userBalance.create({
    data: { userId: user.id, availableUSDC: dec(balance), lockedUSDC: dec("0") },
  });
  return user;
}

async function loadMarket(params: { eventSlug: string; marketId?: string }) {
  const event = await prisma.event.findUnique({
    where: { slug: params.eventSlug },
    include: {
      markets: {
        where: {
          ...(params.marketId ? { id: params.marketId } : {}),
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
            where: { source: "sportsbook-odds" },
            orderBy: [{ fetchedAt: "desc" }, { updatedAt: "desc" }],
          },
        },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  assert(event, `Event ${params.eventSlug} was not found.`);
  const market =
    event.markets.find((item) => item.marketType === "total_goals" && item.line?.toString() === "2.5") ??
    event.markets.find((item) => item.marketType === "spread") ??
    event.markets[0];
  assert(market, `Event ${params.eventSlug} has no live sportsbook-odds market.`);
  const outcome = market.outcomes[0];
  assert(outcome, `Market ${market.id} has no tradable outcome.`);
  const snapshot = market.referenceQuoteSnapshots.find((item) => item.outcomeId === outcome.id) ?? null;
  assert(snapshot, `Outcome ${outcome.id} has no sportsbook-odds reference snapshot.`);
  return { event, market, outcome, snapshot };
}

function pricePlan(snapshot: Awaited<ReturnType<typeof loadMarket>>["snapshot"], offsetTicks: number) {
  const outcomePrice = decimalToNumber(snapshot.outcomePrice) ?? 0.5;
  const referenceBid = decimalToNumber(snapshot.bestBid) ?? Math.max(0.01, outcomePrice - TICK_SIZE);
  const referenceAsk = decimalToNumber(snapshot.bestAsk) ?? Math.min(0.99, outcomePrice + TICK_SIZE);
  let plannedBid = clampPrice(referenceBid - offsetTicks * TICK_SIZE);
  let plannedAsk = clampPrice(referenceAsk + offsetTicks * TICK_SIZE);
  if (plannedBid >= plannedAsk) {
    plannedBid = clampPrice(outcomePrice - offsetTicks * TICK_SIZE);
    plannedAsk = clampPrice(outcomePrice + offsetTicks * TICK_SIZE);
  }
  if (plannedBid >= plannedAsk) {
    plannedBid = clampPrice(outcomePrice - 0.03);
    plannedAsk = clampPrice(outcomePrice + 0.03);
  }
  return { outcomePrice, referenceBid, referenceAsk, plannedBid, plannedAsk };
}

async function currentOutcomeBook(marketId: string, outcomeId: string) {
  const orders = await prisma.order.findMany({
    where: {
      marketId,
      outcomeId,
      status: { in: ["OPEN", "PARTIAL"] },
    },
    select: { side: true, price: true, remaining: true, user: { select: { username: true } } },
  });
  const bids = orders.filter((order) => order.side === "BUY").map((order) => decimalToNumber(order.price)).filter((value): value is number => value !== null);
  const asks = orders.filter((order) => order.side === "SELL").map((order) => decimalToNumber(order.price)).filter((value): value is number => value !== null);
  return {
    bestBid: bids.length ? Math.max(...bids) : null,
    bestAsk: asks.length ? Math.min(...asks) : null,
    openOrderCount: orders.length,
    orders: orders.map((order) => ({
      side: order.side,
      price: order.price.toString(),
      remaining: order.remaining.toString(),
      username: order.user.username,
    })),
  };
}

function avoidCrossingOpenBook(plan: ReturnType<typeof pricePlan>, book: Awaited<ReturnType<typeof currentOutcomeBook>>) {
  let plannedBid = plan.plannedBid;
  let plannedAsk = plan.plannedAsk;
  const adjustments: string[] = [];

  if (book.bestAsk !== null && plannedBid >= book.bestAsk) {
    plannedBid = clampPrice(book.bestAsk - TICK_SIZE);
    adjustments.push(`plannedBid moved below existing best ask ${book.bestAsk.toFixed(2)}`);
  }
  if (book.bestBid !== null && plannedAsk <= book.bestBid) {
    plannedAsk = clampPrice(book.bestBid + TICK_SIZE);
    adjustments.push(`plannedAsk moved above existing best bid ${book.bestBid.toFixed(2)}`);
  }
  if (plannedBid >= plannedAsk) {
    plannedBid = clampPrice(plannedAsk - TICK_SIZE);
    adjustments.push("plannedBid moved below adjusted ask to keep a non-crossing spread");
  }

  return { ...plan, plannedBid, plannedAsk, adjustments };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed local shifted maker liquidity in production.");
  }

  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const marketId = argValue("marketId");
  const baseUrl = argValue("baseUrl") ?? DEFAULT_BASE_URL;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_SUMMARY_PATH;
  const startedAt = new Date();
  const quoteOffsetTicks = intArg("quoteOffsetTicks", 2);
  const size = argValue("size") ?? "200";
  const mintQuantity = argValue("mintQuantity") ?? size;
  const maxSnapshotAgeMs = intArg("maxSnapshotAgeMs", 24 * 60 * 60 * 1000);
  const allowStale = boolFlag("allowStale");
  const cleanupOnly = boolFlag("cleanupOnly");

  const selected = await loadMarket({ eventSlug, marketId });
  const snapshotAgeMs = Date.now() - selected.snapshot.fetchedAt.getTime();
  const snapshotFresh = snapshotAgeMs >= 0 && snapshotAgeMs <= maxSnapshotAgeMs;
  assert(
    allowStale || snapshotFresh,
    `Provider snapshot is stale (${Math.round(snapshotAgeMs / 1000)}s old). Refresh provider odds first or pass --allowStale for a local diagnostic.`,
  );

  const canceled = await cleanupPreviousMakerOrders(selected.market.id);
  const preSeedBook = await currentOutcomeBook(selected.market.id, selected.outcome.id);
  const plan = avoidCrossingOpenBook(pricePlan(selected.snapshot, quoteOffsetTicks), preSeedBook);
  let maker: Awaited<ReturnType<typeof createMaker>> | null = null;
  let bidOrder = null;
  let askOrder = null;

  if (!cleanupOnly) {
    maker = await createMaker("10000");
    await mintCompleteSetForPublicOrderbook({
      marketId: selected.market.id,
      userId: maker.id,
      quantity: mintQuantity,
    });
    const bid = await placeOrderAndMatch({
      marketId: selected.market.id,
      userId: maker.id,
      outcomeId: selected.outcome.id,
      side: "BUY",
      price: plan.plannedBid.toFixed(2),
      size,
      type: "LIMIT",
    });
    const ask = await placeOrderAndMatch({
      marketId: selected.market.id,
      userId: maker.id,
      outcomeId: selected.outcome.id,
      side: "SELL",
      price: plan.plannedAsk.toFixed(2),
      size,
      type: "LIMIT",
    });
    assert(["OPEN", "PARTIAL"].includes(bid.order.status), `Expected maker bid to rest, got ${bid.order.status}.`);
    assert(["OPEN", "PARTIAL"].includes(ask.order.status), `Expected maker ask to rest, got ${ask.order.status}.`);
    bidOrder = bid.order;
    askOrder = ask.order;
  }

  const restingOrders = await prisma.order.findMany({
    where: {
      marketId: selected.market.id,
      outcomeId: selected.outcome.id,
      status: { in: ["OPEN", "PARTIAL"] },
      user: { username: { startsWith: MAKER_USERNAME_PREFIX } },
    },
    orderBy: [{ side: "asc" }, { price: "asc" }],
    select: { id: true, side: true, price: true, remaining: true, status: true, user: { select: { username: true } } },
  });
  const quoteRoute = await fetchRaw(`${baseUrl}/api/markets/${encodeURIComponent(selected.market.id)}/quote`);
  const selectedQuote = Array.isArray(quoteRoute.body?.quotes)
    ? quoteRoute.body.quotes.find((quote: { outcomeId?: string }) => quote.outcomeId === selected.outcome.id)
    : null;

  const checks = {
    eventLoaded: Boolean(selected.event.id),
    marketLive: selected.market.status === "LIVE",
    snapshotFresh: allowStale || snapshotFresh,
    shiftedBidWorseThanProvider: plan.plannedBid < plan.referenceBid,
    shiftedAskWorseThanProvider: plan.plannedAsk > plan.referenceAsk,
    makerBidResting: cleanupOnly || Boolean(bidOrder && ["OPEN", "PARTIAL"].includes(bidOrder.status)),
    makerAskResting: cleanupOnly || Boolean(askOrder && ["OPEN", "PARTIAL"].includes(askOrder.status)),
    quoteRouteShowsBid:
      cleanupOnly ||
      selectedQuote?.bestBid === plan.plannedBid.toFixed(2) ||
      restingOrders.some((order) => order.side === "BUY" && order.price.toString() === plan.plannedBid.toFixed(2)),
    quoteRouteShowsAsk:
      cleanupOnly ||
      selectedQuote?.bestAsk === plan.plannedAsk.toFixed(2) ||
      restingOrders.some((order) => order.side === "SELL" && order.price.toString() === plan.plannedAsk.toFixed(2)),
  };

  const summary = {
    pass: Object.values(checks).every(Boolean),
    generatedAt: new Date().toISOString(),
    startedAt: startedAt.toISOString(),
    scope: "odds-api-one-event-shifted-maker-seed",
    mode: cleanupOnly ? "cleanup-only" : "seed-resting-shifted-maker-quotes",
    event: {
      id: selected.event.id,
      slug: selected.event.slug,
      title: selected.event.title,
      startTime: selected.event.startTime?.toISOString() ?? null,
    },
    selectedMarket: {
      id: selected.market.id,
      slug: selected.market.slug,
      title: selected.market.title,
      marketType: selected.market.marketType,
      marketGroupKey: selected.market.marketGroupKey,
      line: selected.market.line?.toString() ?? null,
      outcomeId: selected.outcome.id,
      outcomeName: selected.outcome.name,
      referenceTokenId: selected.outcome.referenceTokenId,
    },
    providerSnapshot: {
      fetchedAt: selected.snapshot.fetchedAt.toISOString(),
      ageMs: snapshotAgeMs,
      maxSnapshotAgeMs,
      allowStale,
      source: selected.snapshot.source,
      referenceBid: plan.referenceBid,
      referenceAsk: plan.referenceAsk,
      outcomePrice: plan.outcomePrice,
    },
    maker: maker ? { id: maker.id, username: maker.username } : null,
    plan: {
      quoteOffsetTicks,
      plannedBid: plan.plannedBid,
      plannedAsk: plan.plannedAsk,
      adjustments: plan.adjustments,
      preSeedBook,
      size,
      mintQuantity,
    },
    canceledPreviousOrders: canceled,
    restingOrders: restingOrders.map((order) => ({
      id: order.id,
      username: order.user.username,
      side: order.side,
      price: order.price.toString(),
      remaining: order.remaining.toString(),
      status: order.status,
    })),
    quoteRoute: {
      url: `${baseUrl}/api/markets/${selected.market.id}/quote`,
      ok: quoteRoute.ok,
      status: quoteRoute.status,
      selectedOutcomeQuote: selectedQuote,
    },
    checks,
    gaps: {
      p0: Object.entries(checks).filter(([, value]) => !value).map(([key]) => key),
      p1: [
        "this command seeds resting shifted maker quotes once; it is reusable but not an unattended daemon by itself",
        "provider refresh still comes from the bounded live proof or future daemon",
      ],
      p2: ["multi-market inventory-aware quoting remains future work"],
    },
  };

  await writeJson(outputPath, summary);
  await writeMarketMakerQuoteRun({
    marketId: summary.selectedMarket.id,
    outcomeId: summary.selectedMarket.outcomeId,
    eventSlug: summary.event.slug,
    status: summary.pass ? "passed" : "failed",
    mode: summary.mode,
    startedAt,
    finishedAt: summary.generatedAt,
    makerUserId: summary.maker?.id ?? null,
    bidOrderId: summary.restingOrders.find((order) => order.side === "BUY")?.id ?? null,
    askOrderId: summary.restingOrders.find((order) => order.side === "SELL")?.id ?? null,
    providerSource: summary.providerSnapshot.source,
    referenceBid: summary.providerSnapshot.referenceBid,
    referenceAsk: summary.providerSnapshot.referenceAsk,
    outcomePrice: summary.providerSnapshot.outcomePrice,
    plannedBid: summary.plan.plannedBid,
    plannedAsk: summary.plan.plannedAsk,
    quoteOffsetTicks: summary.plan.quoteOffsetTicks,
    size: summary.plan.size,
    mintQuantity: summary.plan.mintQuantity,
    canceledOrderCount: summary.canceledPreviousOrders.length,
    restingOrderCount: summary.restingOrders.length,
    quoteRouteStatus: summary.quoteRoute.status,
    shiftedBidWorseThanProvider: summary.checks.shiftedBidWorseThanProvider,
    shiftedAskWorseThanProvider: summary.checks.shiftedAskWorseThanProvider,
    quoteRouteShowsBid: summary.checks.quoteRouteShowsBid,
    quoteRouteShowsAsk: summary.checks.quoteRouteShowsAsk,
    snapshotFresh: summary.checks.snapshotFresh,
    installedOsService: false,
    metadata: {
      source: "local-shifted-maker-proof",
      emittedBy: "scripts/seed_odds_api_live_shifted_maker.ts",
      localOnly: true,
      summaryPath: outputPath,
      selectedMarket: summary.selectedMarket,
      checks,
      gaps: summary.gaps,
    },
  });
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.pass) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
