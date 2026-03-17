import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { createApiCredential } from "@/lib/canonicalAuth";
import { placeOrderAndMatch } from "@/server/services/matching";
import { mintCompleteSetForPublicOrderbook } from "@/server/services/orderbookCollateral";
import {
  BOT_E2E_BASE_URL,
  BOT_E2E_FIXTURE_PATH,
  BOT_E2E_MARKET_SLUG,
  BOT_E2E_USER_PREFIX,
  type BotE2EFixture,
} from "./shared";

const upsertUserWithBalance = async (params: {
  username: string;
  email: string;
  availableUSDC: string;
}) => {
  const user = await prisma.user.create({
    data: {
      username: params.username,
      email: params.email,
    },
  });

  await prisma.userBalance.upsert({
    where: { userId: user.id },
    update: {
      availableUSDC: params.availableUSDC,
      lockedUSDC: "0",
    },
    create: {
      userId: user.id,
      availableUSDC: params.availableUSDC,
      lockedUSDC: "0",
    },
  });

  return user;
};

async function main() {
  const runSuffix = Date.now().toString();
  const marketSlug = `${BOT_E2E_MARKET_SLUG}-${runSuffix}`;

  const trader = await upsertUserWithBalance({
    username: `${BOT_E2E_USER_PREFIX}_trader_${runSuffix}`,
    email: `bot-e2e-trader-${runSuffix}@test.local`,
    availableUSDC: "100.000000",
  });
  const maker = await upsertUserWithBalance({
    username: `${BOT_E2E_USER_PREFIX}_maker_${runSuffix}`,
    email: `bot-e2e-maker-${runSuffix}@test.local`,
    availableUSDC: "100.000000",
  });

  const market = await prisma.market.create({
    data: {
      slug: marketSlug,
      title: "Bot E2E Canonical Market",
      description: "Deterministic market for canonical bot E2E validation.",
      status: "LIVE",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      kind: "ORDERBOOK",
      type: "BINARY",
      isCanceled: false,
      isListed: true,
      createdBy: trader.id,
      outcomes: {
        create: [
          {
            name: "YES",
            slug: `${marketSlug}-yes`,
            displayOrder: 0,
            isActive: true,
          },
          {
            name: "NO",
            slug: `${marketSlug}-no`,
            displayOrder: 1,
            isActive: true,
          },
        ],
      },
    },
    include: {
      outcomes: {
        orderBy: [{ displayOrder: "asc" }],
      },
    },
  });

  const traderKey = await createApiCredential({
    userId: trader.id,
    name: "bot-e2e-trader",
    scopes: ["orders:read", "orders:write", "fills:read", "account:read"],
  });

  const limitedKey = await createApiCredential({
    userId: trader.id,
    name: "bot-e2e-limited",
    scopes: ["orders:read", "orders:write", "fills:read", "account:read"],
  });
  await prisma.apiCredential.update({
    where: { id: limitedKey.apiKey.id },
    data: {
      maxOrderSize: "1.000000",
      maxOrderNotional: "0.200000",
      maxOpenOrders: 1,
    },
  });

  const readonlyKey = await createApiCredential({
    userId: trader.id,
    name: "bot-e2e-readonly",
    scopes: ["orders:read", "fills:read", "account:read"],
  });

  await mintCompleteSetForPublicOrderbook({
    marketId: market.id,
    userId: maker.id,
    quantity: "10.000000",
  });

  await placeOrderAndMatch({
    marketId: market.id,
    userId: maker.id,
    outcomeId: market.outcomes[0].id,
    side: "SELL",
    price: "0.60000000",
    size: "5.000000",
  });

  const fixture: BotE2EFixture = {
    baseUrl: BOT_E2E_BASE_URL,
    marketId: market.id,
    marketSlug: market.slug ?? marketSlug,
    yesOutcomeId: market.outcomes[0].id,
    noOutcomeId: market.outcomes[1].id,
    traderUserId: trader.id,
    makerUserId: maker.id,
    apiKeys: {
      trader: {
        credentialId: traderKey.apiKey.id,
        keyId: traderKey.apiKey.keyId,
        token: traderKey.token,
      },
      limited: {
        credentialId: limitedKey.apiKey.id,
        keyId: limitedKey.apiKey.keyId,
        token: limitedKey.token,
      },
      readonly: {
        credentialId: readonlyKey.apiKey.id,
        keyId: readonlyKey.apiKey.keyId,
        token: readonlyKey.token,
      },
    },
    seededAt: new Date().toISOString(),
  };

  await fs.mkdir(path.dirname(BOT_E2E_FIXTURE_PATH), {
    recursive: true,
  });
  await fs.writeFile(BOT_E2E_FIXTURE_PATH, JSON.stringify(fixture, null, 2), "utf8");

  console.info("[bot-e2e:seed] fixture written", {
    path: BOT_E2E_FIXTURE_PATH,
    marketId: fixture.marketId,
    traderUserId: fixture.traderUserId,
    traderKeyId: fixture.apiKeys.trader.keyId,
    limitedKeyId: fixture.apiKeys.limited.keyId,
    readonlyKeyId: fixture.apiKeys.readonly.keyId,
  });
}

main()
  .catch((error) => {
    console.error("[bot-e2e:seed] fatal", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
