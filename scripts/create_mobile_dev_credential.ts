import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { API_KEY_SCOPES, createApiCredential, updateApiCredential } from "@/lib/canonicalAuth";
import { applyDeposit, getOrCreateUserBalance } from "@/server/services/ledger";

const USERNAME = "holiwyn-mobile-dev";
const DEFAULT_TARGET_BALANCE = "10000.000000";
const DEFAULT_MAX_ORDER_SIZE = "1000.000000";
const DEFAULT_MAX_ORDER_NOTIONAL = "1000.000000";
const DEFAULT_MAX_OPEN_ORDERS = 20;
const DEFAULT_DAILY_NOTIONAL = "10000.000000";
const DEFAULT_CHAIN_ID = 8453;
const isDryRun = process.argv.includes("--dry-run");

async function fundUserToTarget(userId: string, targetBalance: Prisma.Decimal) {
  const balance = await getOrCreateUserBalance(userId);
  const currentTotal = new Prisma.Decimal(balance.availableUSDC).add(balance.lockedUSDC);
  const topUpAmount = targetBalance.sub(currentTotal).toDecimalPlaces(6);

  if (topUpAmount.lte(0)) {
    return { applied: false, amount: "0.000000" };
  }

  const nonce = `${Date.now().toString(16)}${randomBytes(4).toString("hex")}`;
  await applyDeposit({
    eventKey: `mobile-dev-funding:${userId}:${nonce}`,
    userId,
    amount: topUpAmount,
    chainId: DEFAULT_CHAIN_ID,
    txHash: `0x${nonce.padEnd(64, "0").slice(0, 64)}`,
    logIndex: 0,
    token: "USDC",
    referenceType: "MOBILE_DEV_FAKE_TOKEN",
    referenceId: userId,
  });

  return { applied: true, amount: topUpAmount.toFixed(6) };
}

async function main() {
  const targetBalance = new Prisma.Decimal(
    process.env.MOBILE_DEV_TARGET_BALANCE_USDT || DEFAULT_TARGET_BALANCE,
  ).toDecimalPlaces(6);

  if (isDryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          username: USERNAME,
          targetBalanceUSDT: targetBalance.toFixed(6),
          scopes: [...API_KEY_SCOPES],
          policy: {
            maxOrderSize: process.env.MOBILE_DEV_MAX_ORDER_SIZE || DEFAULT_MAX_ORDER_SIZE,
            maxOrderNotional:
              process.env.MOBILE_DEV_MAX_ORDER_NOTIONAL || DEFAULT_MAX_ORDER_NOTIONAL,
            maxOpenOrders: Number(
              process.env.MOBILE_DEV_MAX_OPEN_ORDERS || DEFAULT_MAX_OPEN_ORDERS,
            ),
            maxDailySubmittedNotional:
              process.env.MOBILE_DEV_DAILY_NOTIONAL || DEFAULT_DAILY_NOTIONAL,
            allowedMarketIds: [],
          },
          mobileEnv: {
            EXPO_PUBLIC_ORDER_MODE: "server",
            EXPO_PUBLIC_API_KEY: "[generated-on-real-run]",
          },
        },
        null,
        2,
      ),
    );
    return;
  }

  const user = await prisma.user.upsert({
    where: { username: USERNAME },
    update: {
      email: `${USERNAME}@local.test`,
      displayName: "Holiwyn Mobile Dev",
    },
    create: {
      username: USERNAME,
      email: `${USERNAME}@local.test`,
      displayName: "Holiwyn Mobile Dev",
    },
  });

  const funding = await fundUserToTarget(user.id, targetBalance);

  const created = await createApiCredential({
    userId: user.id,
    name: `holiwyn-mobile-dev-${new Date().toISOString()}`,
    scopes: [...API_KEY_SCOPES],
  });

  await updateApiCredential({
    userId: user.id,
    id: created.apiKey.id,
    body: {
      isDisabled: false,
      readOnly: false,
      maxOrderSize: process.env.MOBILE_DEV_MAX_ORDER_SIZE || DEFAULT_MAX_ORDER_SIZE,
      maxOrderNotional: process.env.MOBILE_DEV_MAX_ORDER_NOTIONAL || DEFAULT_MAX_ORDER_NOTIONAL,
      maxOpenOrders: Number(process.env.MOBILE_DEV_MAX_OPEN_ORDERS || DEFAULT_MAX_OPEN_ORDERS),
      maxDailySubmittedNotional:
        process.env.MOBILE_DEV_DAILY_NOTIONAL || DEFAULT_DAILY_NOTIONAL,
      allowedMarketIds: [],
    },
  });

  console.log(
    JSON.stringify(
      {
        userId: user.id,
        username: user.username,
        keyId: created.apiKey.keyId,
        token: created.token,
        targetBalanceUSDT: targetBalance.toFixed(6),
        funding,
        mobileEnv: {
          EXPO_PUBLIC_ORDER_MODE: "server",
          EXPO_PUBLIC_API_KEY: created.token,
        },
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
