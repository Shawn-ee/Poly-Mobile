import { prisma } from "@/lib/db";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const decimalString = (value: { toString(): string } | null | undefined) =>
  value == null ? null : value.toString();

async function main() {
  const username = argValue("username") ?? process.env.MOBILE_DEV_USERNAME;
  if (!username) {
    throw new Error("Missing --username or MOBILE_DEV_USERNAME.");
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true },
  });

  if (!user) {
    throw new Error(`Mobile proof user not found: ${username}`);
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: 10,
    include: {
      market: { select: { id: true, title: true } },
      outcome: { select: { id: true, name: true } },
      createdApiCredential: { select: { keyId: true } },
      canceledByApiCredential: { select: { keyId: true } },
    },
  });

  const statusCounts = orders.reduce<Record<string, number>>((counts, order) => {
    counts[order.status] = (counts[order.status] ?? 0) + 1;
    return counts;
  }, {});

  const mapOrder = (order: (typeof orders)[number]) => ({
    id: order.id,
    status: order.status,
    side: order.side,
    market: {
      id: order.market.id,
      title: order.market.title,
    },
    outcome: {
      id: order.outcome.id,
      name: order.outcome.name,
    },
    price: decimalString(order.price),
    size: decimalString(order.amount),
    remaining: decimalString(order.remaining),
    reservedNotional: decimalString(order.reservedNotional),
    notional: order.price.mul(order.amount).toString(),
    remainingNotional: order.price.mul(order.remaining).toString(),
    apiKeyId: order.createdApiCredential?.keyId ?? null,
    canceledByApiKeyId: order.canceledByApiCredential?.keyId ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  });

  const canceledOrders = orders.filter((order) => order.status === "CANCELED").map(mapOrder);

  console.log(
    JSON.stringify(
      {
        username: user.username,
        userId: user.id,
        orderCount: orders.length,
        statusCounts,
        latestOrder: orders[0] ? mapOrder(orders[0]) : null,
        latestCanceledOrder: canceledOrders[0] ?? null,
        recentOrders: orders.map(mapOrder),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
