import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BOT_COUNT = 20;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const TARGET_ORDERS_PER_SIDE = 30;

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomFloat = (min: number, max: number, decimals = 2) => {
  const v = Math.random() * (max - min) + min;
  return Number(v.toFixed(decimals));
};

const botStartingBalance = (index: number) => {
  const seed = (index * 9301 + 49297) % 233280;
  const normalized = seed / 233280;
  return Number((500 + normalized * 4500).toFixed(6));
};

type MarketSeed = {
  slug: string;
  title: string;
  description: string;
  categorySlug: "crypto" | "sports" | "finance";
  tagSlugs: string[];
  outcomes: string[];
};

const marketSeeds: MarketSeed[] = [
  {
    slug: "btc-above-100k-dec-31-2026",
    title: "Will BTC be above $100k by Dec 31, 2026?",
    description:
      "Orderbook market on whether BTC settles above $100,000 by December 31, 2026.",
    categorySlug: "crypto",
    tagSlugs: ["crypto", "bitcoin"],
    outcomes: ["YES", "NO"],
  },
  {
    slug: "nba-champion-2026-orderbook",
    title: "2026 NBA Champion",
    description: "Orderbook market for the 2026 NBA championship winner.",
    categorySlug: "sports",
    tagSlugs: ["sports", "nba"],
    outcomes: ["Celtics", "Nuggets", "Warriors", "Lakers", "Other"],
  },
  {
    slug: "next-fed-decision-orderbook",
    title: "Next Fed decision",
    description: "Orderbook market for the next FOMC policy decision.",
    categorySlug: "finance",
    tagSlugs: ["finance", "fed"],
    outcomes: ["Hike", "Hold", "Cut"],
  },
];

const ensureCategory = async (name: string, slug: string, order: number) =>
  prisma.category.upsert({
    where: { slug },
    update: { name, order, isActive: true },
    create: { name, slug, order, isActive: true },
  });

const ensureTag = async (name: string, slug: string, group: string, order: number) =>
  prisma.tag.upsert({
    where: { slug },
    update: { name, group, order, isActive: true },
    create: { name, slug, group, order, isActive: true },
  });

const ensureUsersAndBalances = async () => {
  let botsCreated = 0;
  let balancesFunded = 0;

  const bots: { id: string; username: string; email: string }[] = [];

  for (let i = 1; i <= BOT_COUNT; i += 1) {
    const suffix = String(i).padStart(3, "0");
    const email = `bot+${suffix}@kaoshi.local`;
    const username = `bot${suffix}`;
    const displayName = `Bot ${suffix}`;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) botsCreated += 1;

    const user = await prisma.user.upsert({
      where: { email },
      update: { username, displayName },
      create: { email, username, displayName, isAdmin: false },
      select: { id: true, username: true, email: true },
    });

    const amount = botStartingBalance(i);
    const idempotencyKey = `seed:random:bot-fund:${username}:v1`;

    await prisma.ledgerEntry.createMany({
      data: [
        {
          userId: user.id,
          amountDelta: amount,
          reason: "FAUCET",
          operation: "FAUCET",
          deltaAvailableUSDC: amount,
          deltaLockedUSDC: 0,
          idempotencyKey,
          referenceType: "SEED",
          referenceId: username,
        },
      ],
      skipDuplicates: true,
    });

    const balance = await prisma.userBalance.findUnique({ where: { userId: user.id } });
    const minAvailable = new Prisma.Decimal(amount);
    if (!balance) {
      await prisma.userBalance.create({
        data: {
          userId: user.id,
          availableUSDC: minAvailable,
          lockedUSDC: new Prisma.Decimal(0),
        },
      });
      balancesFunded += 1;
    } else if (balance.availableUSDC.lt(minAvailable)) {
      await prisma.userBalance.update({
        where: { userId: user.id },
        data: { availableUSDC: minAvailable },
      });
      balancesFunded += 1;
    }

    bots.push(user);
  }

  return { bots, botsCreated, balancesFunded };
};

const syncOutcomes = async (marketId: string, marketSlug: string, outcomes: string[]) => {
  const desired = new Set<string>();

  for (let index = 0; index < outcomes.length; index += 1) {
    const name = outcomes[index];
    const outcomeSlug = `${marketSlug}-${slugify(name)}`;
    desired.add(outcomeSlug);

    await prisma.outcome.upsert({
      where: { slug: outcomeSlug },
      update: {
        name,
        displayOrder: index,
        isActive: true,
      },
      create: {
        marketId,
        name,
        slug: outcomeSlug,
        displayOrder: index,
        isActive: true,
      },
    });
  }

  const existing = await prisma.outcome.findMany({ where: { marketId } });
  for (const outcome of existing) {
    if (!outcome.slug || !desired.has(outcome.slug)) {
      await prisma.outcome.update({
        where: { id: outcome.id },
        data: { isActive: false },
      });
    }
  }
};

const ensureMarkets = async () => {
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: { isAdmin: true, email: "admin@example.com" },
    create: { username: "admin", email: "admin@example.com", isAdmin: true },
    select: { id: true },
  });

  const categories = {
    crypto: await ensureCategory("Crypto", "crypto", 1),
    sports: await ensureCategory("Sports", "sports", 2),
    finance: await ensureCategory("Finance", "finance", 3),
  };

  const tags = new Map<string, string>();
  const tagDefs = [
    ["Crypto", "crypto", "top-nav", 1],
    ["Sports", "sports", "top-nav", 2],
    ["Finance", "finance", "top-nav", 3],
    ["NBA", "nba", "sports", 1],
    ["Bitcoin", "bitcoin", "topic", 1],
    ["Fed", "fed", "topic", 2],
  ] as const;

  for (const [name, slug, group, order] of tagDefs) {
    const tag = await ensureTag(name, slug, group, order);
    tags.set(tag.slug, tag.id);
  }

  const marketIds: string[] = [];
  let marketsCreated = 0;
  let outcomesCreatedOrUpdated = 0;

  for (const seed of marketSeeds) {
    const now = new Date();
    const betCloseTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const resolveTime = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const existing = await prisma.market.findUnique({ where: { slug: seed.slug } });
    if (!existing) marketsCreated += 1;

    const market = await prisma.market.upsert({
      where: { slug: seed.slug },
      update: {
        title: seed.title,
        description: seed.description,
        mechanism: "ORDERBOOK",
        kind: "ORDERBOOK",
        visibility: "PUBLIC",
        status: "LIVE",
        type: seed.outcomes.length > 2 ? "MULTI_WINNER" : "BINARY",
        categoryId: categories[seed.categorySlug].id,
        categoryLegacy: seed.categorySlug,
        createdBy: admin.id,
        betCloseTime,
        resolveTime,
        isListed: true,
        isCanceled: false,
        ownerId: null,
      },
      create: {
        slug: seed.slug,
        title: seed.title,
        description: seed.description,
        mechanism: "ORDERBOOK",
        kind: "ORDERBOOK",
        visibility: "PUBLIC",
        status: "LIVE",
        type: seed.outcomes.length > 2 ? "MULTI_WINNER" : "BINARY",
        categoryId: categories[seed.categorySlug].id,
        categoryLegacy: seed.categorySlug,
        createdBy: admin.id,
        betCloseTime,
        resolveTime,
        isListed: true,
        isCanceled: false,
        ownerId: null,
      },
      select: { id: true, slug: true, title: true },
    });

    await syncOutcomes(market.id, market.slug ?? seed.slug, seed.outcomes);
    outcomesCreatedOrUpdated += seed.outcomes.length;

    for (const tagSlug of seed.tagSlugs) {
      const tagId = tags.get(tagSlug);
      if (!tagId) continue;
      await prisma.marketTag.upsert({
        where: { marketId_tagId: { marketId: market.id, tagId } },
        update: {},
        create: { marketId: market.id, tagId },
      });
    }

    marketIds.push(market.id);
  }

  return { marketIds, marketsCreated, outcomesCreatedOrUpdated };
};

const createDepthOrders = async (marketIds: string[], botIds: string[]) => {
  let ordersCreated = 0;

  for (const marketId of marketIds) {
    const outcomes = await prisma.outcome.findMany({
      where: { marketId, isActive: true },
      select: { id: true },
      orderBy: { displayOrder: "asc" },
    });

    for (const outcome of outcomes) {
      const [buyCount, sellCount] = await Promise.all([
        prisma.order.count({
          where: {
            marketId,
            outcomeId: outcome.id,
            side: "BUY",
            status: { in: ["OPEN", "PARTIAL"] },
          },
        }),
        prisma.order.count({
          where: {
            marketId,
            outcomeId: outcome.id,
            side: "SELL",
            status: { in: ["OPEN", "PARTIAL"] },
          },
        }),
      ]);

      const buyToCreate = Math.max(0, TARGET_ORDERS_PER_SIDE - buyCount);
      const sellToCreate = Math.max(0, TARGET_ORDERS_PER_SIDE - sellCount);

      const newOrders: Prisma.OrderCreateManyInput[] = [];

      for (let i = 0; i < buyToCreate; i += 1) {
        const amount = randomFloat(1, 50, 6);
        const price = randomFloat(0.3, 0.55, 2);
        const userId = botIds[randomInt(0, botIds.length - 1)];

        newOrders.push({
          marketId,
          outcomeId: outcome.id,
          userId,
          side: "BUY",
          price: new Prisma.Decimal(price.toFixed(8)),
          amount: new Prisma.Decimal(amount.toFixed(6)),
          remaining: new Prisma.Decimal(amount.toFixed(6)),
          status: "OPEN",
          createdAt: new Date(Date.now() - randomInt(0, 72) * 60 * 60 * 1000),
        });
      }

      for (let i = 0; i < sellToCreate; i += 1) {
        const amount = randomFloat(1, 50, 6);
        const price = randomFloat(0.56, 0.85, 2);
        const userId = botIds[randomInt(0, botIds.length - 1)];

        newOrders.push({
          marketId,
          outcomeId: outcome.id,
          userId,
          side: "SELL",
          price: new Prisma.Decimal(price.toFixed(8)),
          amount: new Prisma.Decimal(amount.toFixed(6)),
          remaining: new Prisma.Decimal(amount.toFixed(6)),
          status: "OPEN",
          createdAt: new Date(Date.now() - randomInt(0, 72) * 60 * 60 * 1000),
        });
      }

      if (newOrders.length) {
        await prisma.order.createMany({ data: newOrders });
        ordersCreated += newOrders.length;
      }
    }
  }

  return { ordersCreated };
};

const ensureSellPositions = async (botIds: string[]) => {
  const sellOrders = await prisma.order.findMany({
    where: {
      userId: { in: botIds },
      side: "SELL",
      status: { in: ["OPEN", "PARTIAL"] },
    },
    select: {
      userId: true,
      marketId: true,
      outcomeId: true,
      remaining: true,
    },
  });

  const requiredByKey = new Map<string, Prisma.Decimal>();
  for (const order of sellOrders) {
    const key = `${order.userId}:${order.marketId}:${order.outcomeId}`;
    const current = requiredByKey.get(key) ?? new Prisma.Decimal(0);
    requiredByKey.set(key, current.add(order.remaining));
  }

  for (const [key, required] of requiredByKey.entries()) {
    const [userId, marketId, outcomeId] = key.split(":");
    const bufferedRequired = required.add(new Prisma.Decimal(10));

    const existing = await prisma.position.findUnique({
      where: {
        userId_marketId_outcomeId: { userId, marketId, outcomeId },
      },
    });

    if (!existing) {
      await prisma.position.create({
        data: {
          userId,
          marketId,
          outcomeId,
          shares: Number(bufferedRequired.toFixed(6)),
          avgCost: 0.6,
        },
      });
      continue;
    }

    if (new Prisma.Decimal(existing.shares).lt(bufferedRequired)) {
      await prisma.position.update({
        where: { id: existing.id },
        data: { shares: Number(bufferedRequired.toFixed(6)) },
      });
    }
  }
};

const ensureBuyerBalances = async (botIds: string[]) => {
  const buyOrders = await prisma.order.findMany({
    where: {
      userId: { in: botIds },
      side: "BUY",
      status: { in: ["OPEN", "PARTIAL"] },
    },
    select: { userId: true, price: true, remaining: true },
  });

  const notionalByUser = new Map<string, Prisma.Decimal>();
  for (const order of buyOrders) {
    const notional = order.price.mul(order.remaining);
    const current = notionalByUser.get(order.userId) ?? new Prisma.Decimal(0);
    notionalByUser.set(order.userId, current.add(notional));
  }

  for (const userId of botIds) {
    const required = (notionalByUser.get(userId) ?? new Prisma.Decimal(0)).add(new Prisma.Decimal(500));
    const balance = await prisma.userBalance.findUnique({ where: { userId } });

    if (!balance) {
      await prisma.userBalance.create({
        data: {
          userId,
          availableUSDC: required,
          lockedUSDC: new Prisma.Decimal(0),
        },
      });
      continue;
    }

    if (balance.availableUSDC.lt(required)) {
      await prisma.userBalance.update({
        where: { userId },
        data: { availableUSDC: required },
      });
    }
  }
};

const run = async () => {
  const { bots, botsCreated, balancesFunded } = await ensureUsersAndBalances();
  const botIds = bots.map((bot) => bot.id);

  const { marketIds, marketsCreated, outcomesCreatedOrUpdated } = await ensureMarkets();
  const { ordersCreated } = await createDepthOrders(marketIds, botIds);

  await ensureSellPositions(botIds);
  await ensureBuyerBalances(botIds);

  console.log("Random ORDERBOOK seed summary:", {
    bots: botIds.length,
    botsCreated,
    balancesFunded,
    markets: marketIds.length,
    marketsCreated,
    outcomesCreatedOrUpdated,
    ordersCreated,
  });

  const markets = await prisma.market.findMany({
    where: { id: { in: marketIds } },
    select: { id: true, title: true },
    orderBy: { createdAt: "asc" },
  });

  for (const market of markets) {
    console.log(`Created market: ${market.title} id=${market.id} url=${BASE_URL}/markets/${market.id}`);
  }
};

run()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
