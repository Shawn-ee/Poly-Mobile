import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { submitCanonicalOrder } from "@/server/services/canonicalOrderSubmission";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outputDir = path.resolve(args.outputDir ?? "../agent-orchestrator/runs/run_20260607_014713");
  await mkdir(outputDir, { recursive: true });

  const user = await prisma.user.findFirst({
    where: {
      isAdmin: false,
      username: { not: { startsWith: "system-liquidity-bot" } },
      balance: { availableUSDC: { gte: new Prisma.Decimal("1") } },
    },
    select: {
      id: true,
      username: true,
      balance: { select: { availableUSDC: true, lockedUSDC: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  if (!user) {
    throw new Error("No non-admin user with at least 1 USDC available was found.");
  }

  const market = await prisma.market.findFirst({
    where: {
      referenceSource: "polymarket",
      isListed: true,
      status: "LIVE",
      orders: {
        some: {
          side: "SELL",
          status: { in: ["OPEN", "PARTIAL"] },
          remaining: { gte: new Prisma.Decimal("1") },
        },
      },
    },
    orderBy: { title: "asc" },
    include: {
      outcomes: {
        where: { name: "YES" },
        select: { id: true, name: true },
      },
    },
  });
  const outcome = market?.outcomes[0] ?? null;
  if (!market || !outcome) {
    throw new Error("No launch market with a YES outcome and bot ask was found.");
  }

  const ask = await prisma.order.findFirst({
    where: {
      marketId: market.id,
      outcomeId: outcome.id,
      side: "SELL",
      status: { in: ["OPEN", "PARTIAL"] },
      remaining: { gte: new Prisma.Decimal("1") },
    },
    orderBy: [{ price: "asc" }, { createdAt: "asc" }],
    select: { price: true, remaining: true },
  });
  if (!ask) throw new Error("No bot ask found.");

  const startedAt = new Date().toISOString();
  const buy = await submitCanonicalOrder({
    userId: user.id,
    apiCredentialId: null,
    apiKeyId: null,
    idempotencyKeyHeader: `launch-qa-buy-${Date.now()}`,
    body: {
      marketId: market.id,
      outcomeId: outcome.id,
      side: "BUY",
      type: "LIMIT",
      price: ask.price.toString(),
      size: "1.000000",
      clientOrderId: `launch-qa-buy-${Date.now()}`,
    },
  });

  const bid = await prisma.order.findFirst({
    where: {
      marketId: market.id,
      outcomeId: outcome.id,
      side: "BUY",
      status: { in: ["OPEN", "PARTIAL"] },
      remaining: { gte: new Prisma.Decimal("0.5") },
    },
    orderBy: [{ price: "desc" }, { createdAt: "asc" }],
    select: { price: true, remaining: true },
  });

  let sell: Awaited<ReturnType<typeof submitCanonicalOrder>> | null = null;
  if (bid && buy.status === 200) {
    sell = await submitCanonicalOrder({
      userId: user.id,
      apiCredentialId: null,
      apiKeyId: null,
      idempotencyKeyHeader: `launch-qa-sell-${Date.now()}`,
      body: {
        marketId: market.id,
        outcomeId: outcome.id,
        side: "SELL",
        type: "LIMIT",
        price: bid.price.toString(),
        size: "0.500000",
        clientOrderId: `launch-qa-sell-${Date.now()}`,
      },
    });
  }

  const [endingBalance, position, openOrders, fills] = await Promise.all([
    prisma.userBalance.findUnique({ where: { userId: user.id } }),
    prisma.position.findFirst({
      where: { userId: user.id, marketId: market.id, outcomeId: outcome.id },
    }),
    prisma.order.count({
      where: {
        userId: user.id,
        marketId: market.id,
        status: { in: ["OPEN", "PARTIAL"] },
      },
    }),
    prisma.fill.findMany({
      where: {
        marketId: market.id,
        OR: [{ takerUserId: user.id }, { makerUserId: user.id }],
      },
      orderBy: [{ createdAt: "desc" }],
      take: 5,
      select: { id: true, price: true, size: true, side: true, createdAt: true },
    }),
  ]);

  const report = {
    startedAt,
    endedAt: new Date().toISOString(),
    user: {
      id: user.id,
      username: user.username,
      startingAvailableUSDC: user.balance?.availableUSDC?.toString() ?? "0",
      startingLockedUSDC: user.balance?.lockedUSDC?.toString() ?? "0",
      endingAvailableUSDC: endingBalance?.availableUSDC.toString() ?? null,
      endingLockedUSDC: endingBalance?.lockedUSDC.toString() ?? null,
    },
    market: {
      id: market.id,
      title: market.title,
      outcomeId: outcome.id,
      outcomeName: outcome.name,
    },
    buy: summarizeOrderResponse(buy),
    sell: sell ? summarizeOrderResponse(sell) : null,
    position: position
      ? {
          shares: position.shares.toString(),
          reservedShares: position.reservedShares.toString(),
          avgCost: position.avgCost.toString(),
          realizedPnl: position.realizedPnl.toString(),
        }
      : null,
    openOrdersForUserInMarket: openOrders,
    recentFills: fills.map((fill) => ({
      id: fill.id,
      side: fill.side,
      price: fill.price.toString(),
      size: fill.size.toString(),
      createdAt: fill.createdAt.toISOString(),
    })),
  };

  await writeFile(path.join(outputDir, "TRADING_QA_REPORT.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(path.join(outputDir, "TRADING_QA_REPORT.md"), renderMarkdown(report), "utf8");
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

function summarizeOrderResponse(response: Awaited<ReturnType<typeof submitCanonicalOrder>>) {
  if (response.status !== 200 || !("order" in response.body)) {
    return response;
  }
  return {
    status: response.status,
    order: response.body.order,
    fills: response.body.fills,
    balance: response.body.balance,
    position: response.body.position,
  };
}

function renderMarkdown(report: Record<string, any>) {
  return [
    "# Trading QA Report",
    "",
    `Started: ${report.startedAt}`,
    `Ended: ${report.endedAt}`,
    "",
    `- User: ${report.user.username} (${report.user.id})`,
    `- Market: ${report.market.title} (${report.market.id})`,
    `- Outcome: ${report.market.outcomeName}`,
    `- Buy status: ${report.buy.status}`,
    `- Buy fills: ${report.buy.fills?.length ?? 0}`,
    `- Sell status: ${report.sell?.status ?? "not_run"}`,
    `- Sell fills: ${report.sell?.fills?.length ?? 0}`,
    `- Ending available: ${report.user.endingAvailableUSDC}`,
    `- Ending locked: ${report.user.endingLockedUSDC}`,
    `- Position shares: ${report.position?.shares ?? "0"}`,
    `- Open orders for user in market: ${report.openOrdersForUserInMarket}`,
    "",
  ].join("\n");
}

function parseArgs(argv: string[]) {
  const args = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key?.startsWith("--")) continue;
    const next = argv[index + 1];
    args.set(key.slice(2), next && !next.startsWith("--") ? next : "true");
  }
  return {
    outputDir: args.get("outputDir"),
  };
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
