import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { GET as getMarketQuoteRoute } from "@/app/api/markets/[id]/quote/route";
import { loadTicketQuotes } from "../mobile/src/services/quoteService";
import type { PolyApi } from "../mobile/src/api";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KF-ticket-quote-route-contract/cycle-KF-ticket-quote-route-contract.json";
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function seedTicketQuoteMarket() {
  const suffix = randomUUID().slice(0, 8);
  const [bidUser, askUser] = await Promise.all([
    prisma.user.create({
      data: {
        username: `mobile_kf_bid_${suffix}`,
        email: `mobile-kf-bid-${suffix}@example.test`,
      },
    }),
    prisma.user.create({
      data: {
        username: `mobile_kf_ask_${suffix}`,
        email: `mobile-kf-ask-${suffix}@example.test`,
      },
    }),
  ]);

  const market = await prisma.market.create({
    data: {
      title: `KF Ticket Quote ${suffix}`,
      description: "Disposable ticket quote route contract market.",
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
      externalSlug: `kf-ticket-quote-${suffix}`,
      externalMarketId: `gamma-kf-ticket-quote-${suffix}`,
      conditionId: `condition-kf-ticket-quote-${suffix}`,
      isListed: true,
      outcomes: {
        create: [
          {
            name: "Home -1.5",
            label: "Home -1.5",
            side: "home",
            code: "HOME",
            slug: `kf-ticket-quote-home-${suffix}`,
            displayOrder: 0,
            isActive: true,
            isTradable: true,
            referenceTokenId: `token-kf-home-${suffix}`,
            referenceOutcomeLabel: "Home -1.5",
          },
          {
            name: "Away +1.5",
            label: "Away +1.5",
            side: "away",
            code: "AWAY",
            slug: `kf-ticket-quote-away-${suffix}`,
            displayOrder: 1,
            isActive: true,
            isTradable: true,
            referenceTokenId: `token-kf-away-${suffix}`,
            referenceOutcomeLabel: "Away +1.5",
          },
        ],
      },
    },
    include: { outcomes: { orderBy: { displayOrder: "asc" } } },
  });

  const outcome = market.outcomes[0];
  assert(outcome, "Expected proof market to create an outcome.");

  const bidOrder = await prisma.order.create({
    data: {
      userId: bidUser.id,
      marketId: market.id,
      outcomeId: outcome.id,
      side: "BUY",
      price: dec("0.41"),
      amount: dec("200"),
      remaining: dec("120"),
      reservedNotional: dec("49.2"),
      status: "OPEN",
    },
  });
  const askOrder = await prisma.order.create({
    data: {
      userId: askUser.id,
      marketId: market.id,
      outcomeId: outcome.id,
      side: "SELL",
      price: dec("0.45"),
      amount: dec("160"),
      remaining: dec("80"),
      reservedNotional: dec("0"),
      status: "OPEN",
    },
  });
  await prisma.fill.create({
    data: {
      takerOrderId: bidOrder.id,
      makerOrderId: askOrder.id,
      takerUserId: bidUser.id,
      makerUserId: askUser.id,
      marketId: market.id,
      outcomeId: outcome.id,
      side: "BUY",
      price: dec("0.42"),
      size: dec("10"),
      notionalUSDC: dec("4.2"),
      feeUSDC: dec("0"),
    },
  });

  return { market, outcome };
}

async function main() {
  const seeded = await seedTicketQuoteMarket();
  const routeApi = {
    getMarketQuote: async (marketId: string, outcomeId?: string) => {
      const params = new URLSearchParams();
      if (outcomeId) params.set("outcomeId", outcomeId);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const response = await getMarketQuoteRoute(
        new NextRequest(`http://localhost/api/markets/${encodeURIComponent(marketId)}/quote${suffix}`),
        { params: Promise.resolve({ id: marketId }) },
      );
      const body = await response.json();
      assert(response.status === 200, `Expected quote route 200, received ${response.status}: ${JSON.stringify(body)}`);
      return body;
    },
  };

  const filteredQuotes = await loadTicketQuotes(
    routeApi as Pick<PolyApi, "getMarketQuote">,
    seeded.market.id,
    seeded.outcome.id,
  );
  const quote = filteredQuotes[0];

  assert(filteredQuotes.length === 1, `Expected one filtered quote, received ${filteredQuotes.length}.`);
  assert(quote.outcomeId === seeded.outcome.id, "Expected quote outcome id to match filtered outcome.");
  assert(quote.probability === 43, `Expected midpoint probability 43, received ${quote.probability}.`);
  assert(quote.bestBid === 41, `Expected best bid 41, received ${quote.bestBid}.`);
  assert(quote.bestAsk === 45, `Expected best ask 45, received ${quote.bestAsk}.`);
  assert(quote.bestBidSize === 120, `Expected best bid size 120, received ${quote.bestBidSize}.`);
  assert(quote.bestAskSize === 80, `Expected best ask size 80, received ${quote.bestAskSize}.`);
  assert(quote.lastPrice === 42, `Expected last trade price 42, received ${quote.lastPrice}.`);

  const allQuotes = await loadTicketQuotes(routeApi as Pick<PolyApi, "getMarketQuote">, seeded.market.id);
  assert(allQuotes.length === 2, `Expected all-outcome quote load to return 2 outcomes, received ${allQuotes.length}.`);

  const summary = {
    pass: true,
    createdAt: new Date().toISOString(),
    route: "/api/markets/:id/quote?outcomeId=<outcome-id>",
    service: "loadTicketQuotes",
    marketId: seeded.market.id,
    filteredQuote: {
      outcomeId: quote.outcomeId,
      outcomeName: quote.outcomeName,
      probability: quote.probability,
      bestBid: quote.bestBid,
      bestAsk: quote.bestAsk,
      bestBidSize: quote.bestBidSize,
      bestAskSize: quote.bestAskSize,
      midPrice: quote.midPrice,
      lastPrice: quote.lastPrice,
    },
    allOutcomeQuoteCount: allQuotes.length,
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
