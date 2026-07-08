import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createApiCredential } from "@/lib/canonicalAuth";
import { GET as getProfileSummaryRoute } from "@/app/api/profile/summary/route";
import { PolyApi } from "../mobile/src/api";
import { loadProfileSummary } from "../mobile/src/services/profileSummaryService";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-KC-profile-summary-contract/cycle-KC-profile-summary-contract.json";
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function seedProfileSummaryAccount() {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `mobile_kc_${suffix}`,
      email: `mobile-kc-${suffix}@example.test`,
      displayName: "Mobile KC Summary",
      balance: {
        create: {
          availableUSDC: dec("40.8"),
          lockedUSDC: dec("0"),
        },
      },
      profilePreferences: {
        create: {
          preferences: {
            locale: "zh",
            ticketDefaultAmount: "250",
            ticketDefaultSide: "SELL",
            ticketDefaultSlippage: "2%",
            savedEventIds: [`kc-saved-${suffix}`],
          },
        },
      },
    },
  });

  const event = await prisma.event.create({
    data: {
      slug: `mobile-kc-summary-event-${suffix}`,
      title: `KC Summary Home vs Away ${suffix}`,
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      status: "upcoming",
      markets: {
        create: [{
          slug: `mobile-kc-summary-market-${suffix}`,
          title: `KC Summary Winner ${suffix}`,
          description: "Disposable profile summary proof market.",
          status: "LIVE",
          mechanism: "ORDERBOOK",
          visibility: "PUBLIC",
          kind: "ORDERBOOK",
          type: "BINARY",
          marketType: "moneyline",
          marketGroupKey: "main",
          marketGroupTitle: "Regulation Time Winner",
          period: "regulation",
          line: dec("0"),
          isListed: true,
          outcomes: {
            create: [
              {
                name: "Home",
                label: "Home",
                side: "home",
                code: "HOME",
                slug: `mobile-kc-summary-home-${suffix}`,
                isActive: true,
                isTradable: true,
              },
              {
                name: "Away",
                label: "Away",
                side: "away",
                code: "AWAY",
                slug: `mobile-kc-summary-away-${suffix}`,
                isActive: true,
                isTradable: true,
              },
            ],
          },
        }],
      },
    },
    include: {
      markets: {
        include: { outcomes: true },
      },
    },
  });

  const market = event.markets[0];
  const outcome = market.outcomes[0];
  await prisma.position.create({
    data: {
      userId: user.id,
      marketId: market.id,
      outcomeId: outcome.id,
      shares: dec("2"),
      avgCost: dec("0.5"),
    },
  });
  await prisma.order.create({
    data: {
      userId: user.id,
      marketId: market.id,
      outcomeId: outcome.id,
      side: "BUY",
      price: dec("0.41"),
      amount: dec("50"),
      remaining: dec("50"),
      reservedNotional: dec("20.5"),
      status: "OPEN",
    },
  });

  const credential = await createApiCredential({
    userId: user.id,
    name: `mobile-kc-summary-${suffix}`,
    scopes: ["account:read"],
  });

  return { user, token: credential.token };
}

async function main() {
  const seeded = await seedProfileSummaryAccount();

  const response = await getProfileSummaryRoute(
    new NextRequest("http://localhost/api/profile/summary", {
      headers: { Authorization: `Bearer ${seeded.token}` },
    }),
  );
  assert(response.status === 200, `Expected profile summary route 200, received ${response.status}.`);
  const routeBody = await response.json();

  const routeApi = {
    getProfileSummary: async () => routeBody,
  };
  const viewModel = await loadProfileSummary(routeApi as Pick<PolyApi, "getProfileSummary">);

  assert(viewModel.source === "server-route", "Expected mobile profile summary source to be server-route.");
  assert(viewModel.profileId === seeded.user.id, "Expected route profile id to match seeded user.");
  assert(viewModel.balance === 40.8, `Expected balance 40.8, received ${viewModel.balance}.`);
  assert(viewModel.portfolioValue === 1, `Expected portfolio value 1, received ${viewModel.portfolioValue}.`);
  assert(viewModel.openPositionCount === 1, "Expected one open position.");
  assert(viewModel.openOrderCount === 1, "Expected one open order.");
  assert(viewModel.openOrderValue === 20.5, `Expected open order value 20.5, received ${viewModel.openOrderValue}.`);
  assert(viewModel.totalExposure === 21.5, `Expected total exposure 21.5, received ${viewModel.totalExposure}.`);
  assert(viewModel.savedMarketCount === 1, "Expected saved market count from profile preferences.");
  assert(viewModel.ticketDefaultSide === "sell", "Expected SELL preference to map to local sell.");

  const summary = {
    pass: true,
    createdAt: new Date().toISOString(),
    route: "/api/profile/summary",
    auth: "canonical account:read API key",
    profileId: viewModel.profileId,
    username: viewModel.username,
    account: {
      balance: viewModel.balance,
      portfolioValue: viewModel.portfolioValue,
      openPositionCount: viewModel.openPositionCount,
      openOrderCount: viewModel.openOrderCount,
      openOrderValue: viewModel.openOrderValue,
      totalExposure: viewModel.totalExposure,
      tradingMode: viewModel.tradingMode,
    },
    preferences: {
      locale: viewModel.locale,
      savedMarketCount: viewModel.savedMarketCount,
      ticketDefaultAmount: viewModel.ticketDefaultAmount,
      ticketDefaultSide: viewModel.ticketDefaultSide,
      ticketDefaultSlippage: viewModel.ticketDefaultSlippage,
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
