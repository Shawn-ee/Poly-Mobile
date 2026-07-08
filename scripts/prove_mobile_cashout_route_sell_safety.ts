import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { submitCanonicalOrder } from "@/server/services/canonicalOrderSubmission";
import { mintCompleteSetForPublicOrderbook } from "@/server/services/orderbookCollateral";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const output =
  argValue("output") ??
  "docs/mobile/harness/cycle-JS-cashout-route-sell-safety/cycle-JS-cashout-route-sell-safety.json";

const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createUser = (name: string) =>
  prisma.user.create({
    data: {
      username: `${name}-${unique}`,
      email: `${name}-${unique}@test.local`,
    },
  });

const fundUser = async (userId: string, amount: string) => {
  await prisma.userBalance.upsert({
    where: { userId },
    update: { availableUSDC: amount, lockedUSDC: "0" },
    create: { userId, availableUSDC: amount, lockedUSDC: "0" },
  });
};

const createMarket = () =>
  prisma.market.create({
    data: {
      title: `Cycle JS cashout route safety ${unique}`,
      description: "Disposable mobile cashout route safety proof market",
      status: "LIVE",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      kind: "ORDERBOOK",
      isCanceled: false,
      isListed: true,
      outcomes: {
        create: [
          { name: "YES", slug: `cycle-js-yes-${unique}`, displayOrder: 0, isActive: true },
          { name: "NO", slug: `cycle-js-no-${unique}`, displayOrder: 1, isActive: true },
        ],
      },
    },
    include: { outcomes: true },
  });

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function main() {
  const user = await createUser("cycle-js-cashout-user");
  const market = await createMarket();
  await fundUser(user.id, "100.000000");

  const outcomeId = market.outcomes[0]?.id;
  assert(outcomeId, "Proof market did not create an outcome.");

  const nakedSell = await submitCanonicalOrder({
    userId: user.id,
    apiCredentialId: null,
    apiKeyId: null,
    body: {
      marketId: market.id,
      outcomeId,
      side: "SELL",
      type: "LIMIT",
      price: "0.45",
      size: "1.000000",
    },
    idempotencyKeyHeader: `cycle-js-naked-sell-${unique}`,
  });

  assert(nakedSell.status === 409, `Expected naked sell 409, got ${nakedSell.status}.`);
  assert(
    "error" in nakedSell.body &&
      nakedSell.body.error.code === "INSUFFICIENT_BALANCE" &&
      nakedSell.body.error.message === "Insufficient shares",
    "Expected naked sell to return insufficient shares.",
  );

  await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: user.id, quantity: "2.000000" });

  const oversell = await submitCanonicalOrder({
    userId: user.id,
    apiCredentialId: null,
    apiKeyId: null,
    body: {
      marketId: market.id,
      outcomeId,
      side: "SELL",
      type: "LIMIT",
      price: "0.45",
      size: "3.000000",
    },
    idempotencyKeyHeader: `cycle-js-oversell-${unique}`,
  });

  assert(oversell.status === 409, `Expected oversell 409, got ${oversell.status}.`);
  assert(
    "error" in oversell.body &&
      oversell.body.error.code === "INSUFFICIENT_BALANCE" &&
      oversell.body.error.message === "Insufficient available shares",
    "Expected oversell to return insufficient available shares.",
  );

  const validSell = await submitCanonicalOrder({
    userId: user.id,
    apiCredentialId: null,
    apiKeyId: null,
    body: {
      marketId: market.id,
      outcomeId,
      side: "SELL",
      type: "LIMIT",
      price: "0.45",
      size: "2.000000",
    },
    idempotencyKeyHeader: `cycle-js-valid-sell-${unique}`,
  });

  assert(validSell.status === 200, `Expected valid sell 200, got ${validSell.status}.`);
  assert("order" in validSell.body && validSell.body.order.side === "SELL", "Expected valid SELL order response.");

  const requests = await prisma.apiOrderRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: {
      idempotencyKey: true,
      status: true,
      responseStatus: true,
      errorCode: true,
      errorMessage: true,
      orderId: true,
    },
  });
  const position = await prisma.position.findUnique({
    where: { userId_marketId_outcomeId: { userId: user.id, marketId: market.id, outcomeId } },
    select: { shares: true, reservedShares: true },
  });

  const proof = {
    cycle: "JS",
    scope: "cashout-route-sell-safety",
    generatedAt: new Date().toISOString(),
    marketId: market.id,
    outcomeId,
    checks: {
      noPositionSellRejected: nakedSell.status === 409,
      oversellRejected: oversell.status === 409,
      validFullPositionSellAccepted: validSell.status === 200,
      failedAttemptsStored: requests.filter((request) => request.status === "FAILED").length === 2,
    },
    responses: {
      nakedSell: nakedSell.body,
      oversell: oversell.body,
      validSell: validSell.body,
    },
    apiOrderRequests: requests,
    remainingPosition: position
      ? {
          shares: position.shares.toString(),
          reservedShares: position.reservedShares.toString(),
        }
      : null,
  };

  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(proof, null, 2)}\n`);
  console.log(JSON.stringify(proof, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
