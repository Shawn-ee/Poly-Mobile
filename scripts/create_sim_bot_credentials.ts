import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { API_KEY_SCOPES, createApiCredential, updateApiCredential } from "@/lib/canonicalAuth";

const BOT_COUNT = 20;
const DEFAULT_BASE_URL = "http://localhost:3000";
const DEFAULT_AVAILABLE_USDC = "100.000000";
const DEFAULT_MAX_ORDER_SIZE = "1.000000";
const DEFAULT_MAX_OPEN_ORDERS = 6;
const DEFAULT_DAILY_NOTIONAL = "25.000000";
const DEFAULT_STALE_ORDER_MS = 12000;
const DEFAULT_TICK_SIZE = "0.01";
const DEFAULT_MAX_POSITION_SHARES = "5.000000";
const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_DECISION_COOLDOWN_MS = 1500;
const DEFAULT_CAP_BACKOFF_MS = 8000;
const DEFAULT_SIMILAR_ORDER_TICKS = 1;
const DEFAULT_MAX_SIMILAR_OPEN_ORDERS = 1;
const DEFAULT_MAX_ORDERS_PER_SIDE_PER_OUTCOME = 1;
const PLACEHOLDER_MARKET_ID = "replace-with-live-market-id";

type GeneratedBot = {
  name: string;
  baseUrl: string;
  apiKey: string;
  strategy: "passiveBuyer";
  marketIds: string[];
  pollIntervalMs: number;
  maxOrderSize: string;
  maxOpenOrders: number;
  priceOffsetTicks: number;
  staleOrderMs: number;
  decisionCooldownMs: number;
  capBackoffMs: number;
  similarOrderTicks: number;
  maxSimilarOpenOrders: number;
  maxOrdersPerSidePerOutcome: number;
  tickSize: string;
  maxPositionShares: string;
};

async function main() {
  const markets = await prisma.market.findMany({
    where: {
      status: "LIVE",
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      isCanceled: false,
      isListed: true,
    },
    orderBy: [{ createdAt: "desc" }],
    select: { id: true, title: true },
    take: 5,
  });

  const detectedMarketIds = markets.map((market) => market.id);
  const configMarketIds = detectedMarketIds.length > 0 ? [detectedMarketIds[0]] : [PLACEHOLDER_MARKET_ID];
  const allowedMarketIds = detectedMarketIds.length > 0 ? [detectedMarketIds[0]] : [];

  const bots: GeneratedBot[] = [];
  const createdSummary: Array<{ name: string; userId: string; keyId: string }> = [];

  for (let index = 1; index <= BOT_COUNT; index += 1) {
    const botName = `sim-bot-${String(index).padStart(2, "0")}`;
    const user = await prisma.user.upsert({
      where: { username: botName },
      update: {
        email: `${botName}@local.test`,
        displayName: botName,
      },
      create: {
        username: botName,
        email: `${botName}@local.test`,
        displayName: botName,
      },
    });

    await prisma.userBalance.upsert({
      where: { userId: user.id },
      update: {
        availableUSDC: DEFAULT_AVAILABLE_USDC,
      },
      create: {
        userId: user.id,
        availableUSDC: DEFAULT_AVAILABLE_USDC,
        lockedUSDC: "0",
      },
    });

    const created = await createApiCredential({
      userId: user.id,
      name: botName,
      scopes: [...API_KEY_SCOPES],
    });

    await updateApiCredential({
      userId: user.id,
      id: created.apiKey.id,
      body: {
        isDisabled: false,
        readOnly: false,
        maxOrderSize: DEFAULT_MAX_ORDER_SIZE,
        maxOpenOrders: DEFAULT_MAX_OPEN_ORDERS,
        maxDailySubmittedNotional: DEFAULT_DAILY_NOTIONAL,
        allowedMarketIds,
      },
    });

    bots.push({
      name: botName,
      baseUrl: DEFAULT_BASE_URL,
      apiKey: created.token,
      strategy: "passiveBuyer",
      marketIds: configMarketIds,
      pollIntervalMs: DEFAULT_POLL_INTERVAL_MS,
      maxOrderSize: DEFAULT_MAX_ORDER_SIZE,
      maxOpenOrders: DEFAULT_MAX_OPEN_ORDERS,
      priceOffsetTicks: 0,
      staleOrderMs: DEFAULT_STALE_ORDER_MS,
      decisionCooldownMs: DEFAULT_DECISION_COOLDOWN_MS,
      capBackoffMs: DEFAULT_CAP_BACKOFF_MS,
      similarOrderTicks: DEFAULT_SIMILAR_ORDER_TICKS,
      maxSimilarOpenOrders: DEFAULT_MAX_SIMILAR_OPEN_ORDERS,
      maxOrdersPerSidePerOutcome: DEFAULT_MAX_ORDERS_PER_SIDE_PER_OUTCOME,
      tickSize: DEFAULT_TICK_SIZE,
      maxPositionShares: DEFAULT_MAX_POSITION_SHARES,
    });

    createdSummary.push({
      name: botName,
      userId: user.id,
      keyId: created.apiKey.keyId,
    });
  }

  const outputPath = path.resolve(process.cwd(), "..", "poly-bot", "generated.bots.json");
  await fs.writeFile(outputPath, `${JSON.stringify(bots, null, 2)}\n`, "utf8");

  console.info("[sim-bots] generated credentials", {
    outputPath,
    botCount: bots.length,
    detectedMarketIds,
    usingMarketIds: configMarketIds,
    credentials: createdSummary,
  });
}

main()
  .catch((error) => {
    console.error("[sim-bots] fatal", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
