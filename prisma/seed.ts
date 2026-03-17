import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

type SeedMarket = {
  title: string;
  description: string;
  categorySlug: "sports" | "crypto" | "finance";
  tagSlugs: string[];
  outcomes: string[];
  resolveDaysFromNow: number;
};

const ensureCategory = async (data: { name: string; slug: string; order: number }) =>
  prisma.category.upsert({
    where: { slug: data.slug },
    update: { name: data.name, order: data.order, isActive: true },
    create: { name: data.name, slug: data.slug, order: data.order, isActive: true },
  });

const ensureTag = async (data: { name: string; slug: string; group: string; order: number }) =>
  prisma.tag.upsert({
    where: { slug: data.slug },
    update: { name: data.name, group: data.group, order: data.order, isActive: true },
    create: {
      name: data.name,
      slug: data.slug,
      group: data.group,
      order: data.order,
      isActive: true,
    },
  });

const getSeedMarkets = (): SeedMarket[] => {
  const markets: SeedMarket[] = [];

  const btcThresholds = [80, 85, 90, 95, 100, 105, 110, 115, 120, 125];
  btcThresholds.forEach((threshold, index) => {
    markets.push({
      title: `Will BTC be above $${threshold}k by Dec 31, 2026?`,
      description: `Orderbook market on whether BTC closes above $${threshold},000 on December 31, 2026 UTC.`,
      categorySlug: "crypto",
      tagSlugs: ["crypto", "bitcoin"],
      outcomes: ["YES", "NO"],
      resolveDaysFromNow: 90 + index,
    });
  });

  const nbaTitles = [
    "2026 NBA Champion",
    "2027 NBA Champion",
    "2026 Western Conference Champion",
    "2026 Eastern Conference Champion",
    "2026 NBA MVP",
    "2026 NBA Finals MVP",
    "2026 NBA Rookie of the Year",
    "2026 NBA Defensive Player of the Year",
    "2026 NBA Sixth Man of the Year",
    "2026 NBA Most Improved Player",
  ];
  nbaTitles.forEach((title, index) => {
    const outcomes =
      title.includes("MVP") || title.includes("Rookie") || title.includes("Defensive") || title.includes("Sixth") || title.includes("Improved")
        ? ["Nikola Jokic", "Shai Gilgeous-Alexander", "Jayson Tatum", "Luka Doncic", "Other"]
        : ["Celtics", "Nuggets", "Warriors", "Lakers", "Other"];

    markets.push({
      title,
      description: `Orderbook market for ${title}.`,
      categorySlug: "sports",
      tagSlugs: ["sports", "nba"],
      outcomes,
      resolveDaysFromNow: 25 + index,
    });
  });

  const fedMeetings = [
    "March 2026",
    "May 2026",
    "June 2026",
    "July 2026",
    "September 2026",
    "November 2026",
    "December 2026",
    "January 2027",
  ];
  fedMeetings.forEach((meeting, index) => {
    markets.push({
      title: `US Fed decision next meeting (${meeting})`,
      description: `Orderbook market on the FOMC policy decision for the ${meeting} meeting.`,
      categorySlug: "finance",
      tagSlugs: ["finance", "fed"],
      outcomes: ["Hike", "Hold", "Cut"],
      resolveDaysFromNow: 15 + index,
    });
  });

  const inflowMonths = [
    "June 2026",
    "July 2026",
    "August 2026",
    "September 2026",
    "October 2026",
    "November 2026",
    "December 2026",
  ];
  inflowMonths.forEach((month, index) => {
    markets.push({
      title: `Will ETH spot ETF inflows be positive in ${month}?`,
      description: `Orderbook market on net ETH spot ETF inflows for ${month}.`,
      categorySlug: "crypto",
      tagSlugs: ["crypto", "ethereum"],
      outcomes: ["YES", "NO"],
      resolveDaysFromNow: 35 + index,
    });
  });

  if (markets.length !== 35) {
    throw new Error(`Expected 35 markets, got ${markets.length}.`);
  }

  return markets;
};

const syncOutcomes = async (marketId: string, marketSlug: string, outcomes: string[]) => {
  const desiredSlugs: string[] = [];

  for (let index = 0; index < outcomes.length; index += 1) {
    const name = outcomes[index];
    const outcomeSlug = `${marketSlug}-${slugify(name)}`;
    desiredSlugs.push(outcomeSlug);

    await prisma.outcome.upsert({
      where: { slug: outcomeSlug },
      update: {
        name,
        isActive: true,
        displayOrder: index,
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

  const existing = await prisma.outcome.findMany({
    where: { marketId },
    select: { id: true, slug: true },
  });

  const desired = new Set(desiredSlugs);
  const toDeactivate = existing.filter((outcome) => !outcome.slug || !desired.has(outcome.slug));

  for (const outcome of toDeactivate) {
    await prisma.outcome.update({
      where: { id: outcome.id },
      data: { isActive: false },
    });
  }
};

const run = async () => {
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: { isAdmin: true, email: "admin@example.com" },
    create: { username: "admin", email: "admin@example.com", isAdmin: true },
  });

  const categories = {
    sports: await ensureCategory({ name: "Sports", slug: "sports", order: 1 }),
    crypto: await ensureCategory({ name: "Crypto", slug: "crypto", order: 2 }),
    finance: await ensureCategory({ name: "Finance", slug: "finance", order: 3 }),
  };

  const tagDefs = [
    { name: "Sports", slug: "sports", group: "top-nav", order: 1 },
    { name: "Crypto", slug: "crypto", group: "top-nav", order: 2 },
    { name: "Finance", slug: "finance", group: "top-nav", order: 3 },
    { name: "NBA", slug: "nba", group: "sports", order: 1 },
    { name: "Bitcoin", slug: "bitcoin", group: "topic", order: 1 },
    { name: "Ethereum", slug: "ethereum", group: "topic", order: 2 },
    { name: "Fed", slug: "fed", group: "topic", order: 3 },
  ] as const;

  const tags = new Map<string, string>();
  for (const tag of tagDefs) {
    const created = await ensureTag(tag);
    tags.set(created.slug, created.id);
  }

  const seedMarkets = getSeedMarkets();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const createdMarketIds: string[] = [];

  for (let index = 0; index < seedMarkets.length; index += 1) {
    const seedMarket = seedMarkets[index];
    const slug = `${slugify(seedMarket.title)}-${String(index + 1).padStart(2, "0")}`;
    const now = new Date();
    const resolveTime = new Date(now.getTime() + seedMarket.resolveDaysFromNow * 24 * 60 * 60 * 1000);
    const betCloseTime = new Date(resolveTime.getTime() - 24 * 60 * 60 * 1000);

    const market = await prisma.market.upsert({
      where: { slug },
      update: {
        title: seedMarket.title,
        description: seedMarket.description,
        mechanism: "ORDERBOOK",
        kind: "ORDERBOOK",
        visibility: "PUBLIC",
        status: "LIVE",
        ownerId: null,
        type: seedMarket.outcomes.length > 2 ? "MULTI_WINNER" : "BINARY",
        categoryId: categories[seedMarket.categorySlug].id,
        categoryLegacy: seedMarket.categorySlug,
        createdBy: admin.id,
        betCloseTime,
        resolveTime,
        isListed: true,
        isCanceled: false,
      },
      create: {
        slug,
        title: seedMarket.title,
        description: seedMarket.description,
        mechanism: "ORDERBOOK",
        kind: "ORDERBOOK",
        visibility: "PUBLIC",
        status: "LIVE",
        ownerId: null,
        type: seedMarket.outcomes.length > 2 ? "MULTI_WINNER" : "BINARY",
        categoryId: categories[seedMarket.categorySlug].id,
        categoryLegacy: seedMarket.categorySlug,
        createdBy: admin.id,
        betCloseTime,
        resolveTime,
        isListed: true,
        isCanceled: false,
      },
      select: { id: true, title: true, slug: true },
    });

    await syncOutcomes(market.id, market.slug ?? slug, seedMarket.outcomes);

    for (const tagSlug of seedMarket.tagSlugs) {
      const tagId = tags.get(tagSlug);
      if (!tagId) continue;
      await prisma.marketTag.upsert({
        where: { marketId_tagId: { marketId: market.id, tagId } },
        update: {},
        create: { marketId: market.id, tagId },
      });
    }

    createdMarketIds.push(market.id);
    console.log(
      `Created market: ${market.title} id=${market.id} url=${baseUrl}/markets/${market.id}`
    );
  }

  const summary = {
    createdOrUpdated: createdMarketIds.length,
    totalOrderbookPublicMarkets: await prisma.market.count({
      where: { mechanism: "ORDERBOOK", visibility: "PUBLIC" },
    }),
    totalOutcomes: await prisma.outcome.count({
      where: { market: { mechanism: "ORDERBOOK", visibility: "PUBLIC" } },
    }),
  };

  console.log("ORDERBOOK seed summary:", summary);
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
