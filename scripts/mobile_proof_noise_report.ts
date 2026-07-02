import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { prisma } from "@/lib/db";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const argFlag = (name: string) => process.argv.includes(`--${name}`);

const summaryPath =
  argValue("summaryPath") ?? "docs/mobile/harness/cycle-current-mobile-proof-noise-report.json";
const failOnOpenOrders = argFlag("failOnOpenOrders");
const failOnLockedBalance = argFlag("failOnLockedBalance");

const proofPrefixes = ["holiwyn-mobile-proof-", "holiwyn-mobile-open-cancel-"];

const startsWithAnyProofPrefix = proofPrefixes.map((prefix) => ({ username: { startsWith: prefix } }));

const increment = (counts: Record<string, number>, key: string | null | undefined) => {
  const normalizedKey = key || "UNKNOWN";
  counts[normalizedKey] = (counts[normalizedKey] ?? 0) + 1;
};

async function main() {
  const users = await prisma.user.findMany({
    where: { OR: startsWithAnyProofPrefix },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      createdAt: true,
      balance: { select: { availableUSDC: true, lockedUSDC: true } },
      _count: {
        select: {
          orders: true,
          trades: true,
          apiCredentials: true,
        },
      },
    },
  });

  const userIds = users.map((user) => user.id);

  const [orders, takerFills, makerFills] =
    userIds.length > 0
      ? await Promise.all([
          prisma.order.findMany({
            where: { userId: { in: userIds } },
            orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
            select: {
              id: true,
              userId: true,
              side: true,
              status: true,
              price: true,
              amount: true,
              remaining: true,
              createdAt: true,
              updatedAt: true,
            },
          }),
          prisma.fill.findMany({
            where: { takerUserId: { in: userIds } },
            select: { id: true, takerUserId: true, price: true, size: true, notionalUSDC: true },
          }),
          prisma.fill.findMany({
            where: { makerUserId: { in: userIds } },
            select: { id: true, makerUserId: true, price: true, size: true, notionalUSDC: true },
          }),
        ])
      : [[], [], []];

  const userById = new Map(users.map((user) => [user.id, user]));
  const prefixCounts: Record<string, number> = {};
  const orderStatusCounts: Record<string, number> = {};
  const orderSideCounts: Record<string, number> = {};
  const openOrderCountsByUser: Record<string, number> = {};
  const lockedBalanceUsers = users.filter((user) => user.balance && user.balance.lockedUSDC.gt(0));

  for (const user of users) {
    const prefix = proofPrefixes.find((candidate) => user.username.startsWith(candidate)) ?? "other";
    increment(prefixCounts, prefix);
  }

  for (const order of orders) {
    increment(orderStatusCounts, order.status);
    increment(orderSideCounts, order.side);
    if (order.status === "OPEN" || order.status === "PARTIAL") {
      const username = userById.get(order.userId)?.username ?? order.userId;
      openOrderCountsByUser[username] = (openOrderCountsByUser[username] ?? 0) + 1;
    }
  }

  const latestUsers = users.slice(0, 12).map((user) => ({
    username: user.username,
    userId: user.id,
    createdAt: user.createdAt.toISOString(),
    availableUSDC: user.balance?.availableUSDC.toString() ?? null,
    lockedUSDC: user.balance?.lockedUSDC.toString() ?? null,
    orders: user._count.orders,
    trades: user._count.trades,
    apiCredentials: user._count.apiCredentials,
  }));

  const latestOrders = orders.slice(0, 12).map((order) => ({
    id: order.id,
    username: userById.get(order.userId)?.username ?? order.userId,
    side: order.side,
    status: order.status,
    price: order.price.toString(),
    size: order.amount.toString(),
    remaining: order.remaining.toString(),
    notional: order.price.mul(order.amount).toString(),
    remainingNotional: order.price.mul(order.remaining).toString(),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }));

  const report = {
    generatedAt: new Date().toISOString(),
    proofPrefixes,
    totals: {
      users: users.length,
      orders: orders.length,
      trades: users.reduce((total, user) => total + user._count.trades, 0),
      takerFills: takerFills.length,
      makerFills: makerFills.length,
      apiCredentials: users.reduce((total, user) => total + user._count.apiCredentials, 0),
    },
    prefixCounts,
    orderStatusCounts,
    orderSideCounts,
    fillRoleCounts: {
      taker: takerFills.length,
      maker: makerFills.length,
    },
    openOrderCountsByUser,
    harnessGate: {
      enabled: failOnOpenOrders || failOnLockedBalance,
      passed:
        (!failOnOpenOrders || Object.keys(openOrderCountsByUser).length === 0) &&
        (!failOnLockedBalance || lockedBalanceUsers.length === 0),
      checks: {
        openOrders: {
          enabled: failOnOpenOrders,
          passed: Object.keys(openOrderCountsByUser).length === 0,
          affectedUsers: Object.keys(openOrderCountsByUser).length,
        },
        lockedBalance: {
          enabled: failOnLockedBalance,
          passed: lockedBalanceUsers.length === 0,
          affectedUsers: lockedBalanceUsers.length,
          users: lockedBalanceUsers.map((user) => ({
            username: user.username,
            lockedUSDC: user.balance?.lockedUSDC.toString() ?? "0",
          })),
        },
      },
    },
    latestUsers,
    latestOrders,
    cleanupGuidance: {
      destructiveActionTaken: false,
      recommendation:
        users.length > 25
          ? "Proof state is noisy enough to justify a disposable-market or explicit cleanup cycle."
          : "Proof state is still manageable; keep using isolated proof usernames.",
    },
  };

  await mkdir(dirname(summaryPath), { recursive: true });
  await writeFile(summaryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));

  if (report.harnessGate.enabled && !report.harnessGate.passed) {
    console.error("Mobile proof noise gate failed.");
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
