import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/db";
import { placeOrderAndMatch, cancelOrderAndUnlock } from "../src/server/services/matching";

const ZERO = new Prisma.Decimal(0);
const ORDERBOOK_RESERVE_USERNAME = "__orderbook_settlement_reserve__";

type SimUser = { id: string; username: string };

const dec = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);
const n = (v: Prisma.Decimal | number | string | null | undefined) => Number(v ?? 0);
const fmt = (v: Prisma.Decimal | number | string) => n(v).toFixed(6);

const rng = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
};

async function ensureUser(username: string): Promise<SimUser> {
  const user = await prisma.user.upsert({
    where: { username },
    update: {},
    create: { username, email: `${username}@sim.local` },
    select: { id: true, username: true },
  });
  await prisma.userBalance.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });
  return user;
}

async function setBalance(userId: string, availableUSDC: Prisma.Decimal.Value) {
  await prisma.userBalance.update({
    where: { userId },
    data: {
      availableUSDC: dec(availableUSDC),
      lockedUSDC: ZERO,
    },
  });
}

async function setPosition(params: {
  userId: string;
  marketId: string;
  outcomeId: string;
  shares: Prisma.Decimal.Value;
  avgCost?: Prisma.Decimal.Value;
}) {
  await prisma.position.upsert({
    where: {
      userId_marketId_outcomeId: {
        userId: params.userId,
        marketId: params.marketId,
        outcomeId: params.outcomeId,
      },
    },
    update: {
      shares: dec(params.shares),
      avgCost: dec(params.avgCost ?? "0.500000"),
      reservedShares: ZERO,
      realizedPnl: ZERO,
    },
    create: {
      userId: params.userId,
      marketId: params.marketId,
      outcomeId: params.outcomeId,
      shares: dec(params.shares),
      avgCost: dec(params.avgCost ?? "0.500000"),
      reservedShares: ZERO,
      realizedPnl: ZERO,
    },
  });
}

async function createMarket(title: string) {
  const slug = `${title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
  return prisma.market.create({
    data: {
      slug,
      title,
      description: "Funding simulation",
      kind: "ORDERBOOK",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      status: "LIVE",
      isCanceled: false,
      isListed: true,
      outcomes: {
        create: [
          { name: "YES", slug: `${slug}-yes`, displayOrder: 0, isActive: true },
          { name: "NO", slug: `${slug}-no`, displayOrder: 1, isActive: true },
        ],
      },
    },
    include: { outcomes: true },
  });
}

async function getBalance(userId: string) {
  const balance = await prisma.userBalance.findUniqueOrThrow({ where: { userId } });
  return {
    available: balance.availableUSDC,
    locked: balance.lockedUSDC,
  };
}

async function getOutcomePosition(userId: string, marketId: string, outcomeId: string) {
  const pos = await prisma.position.findUnique({
    where: { userId_marketId_outcomeId: { userId, marketId, outcomeId } },
  });
  return {
    shares: pos?.shares ?? ZERO,
    reservedShares: pos?.reservedShares ?? ZERO,
  };
}

async function logState(label: string, users: SimUser[], marketId: string, yesId: string, noId: string) {
  console.log(`\n${label}`);
  for (const user of users) {
    const [bal, yes, no] = await Promise.all([
      getBalance(user.id),
      getOutcomePosition(user.id, marketId, yesId),
      getOutcomePosition(user.id, marketId, noId),
    ]);
    console.log(
      [
        `- ${user.username}`,
        `cash=${fmt(bal.available)} locked=${fmt(bal.locked)}`,
        `YES=${fmt(yes.shares)}(res=${fmt(yes.reservedShares)})`,
        `NO=${fmt(no.shares)}(res=${fmt(no.reservedShares)})`,
      ].join(" | ")
    );
  }
}

async function executeCross(params: {
  marketId: string;
  outcomeId: string;
  seller: SimUser;
  buyer: SimUser;
  price: string;
  qty: string;
  tag: string;
}) {
  const buyerBefore = await getBalance(params.buyer.id);
  const sellerBefore = await getBalance(params.seller.id);
  const sellerOrder = await placeOrderAndMatch({
    marketId: params.marketId,
    userId: params.seller.id,
    outcomeId: params.outcomeId,
    side: "SELL",
    price: params.price,
    size: params.qty,
  });
  const takerResult = await placeOrderAndMatch({
    marketId: params.marketId,
    userId: params.buyer.id,
    outcomeId: params.outcomeId,
    side: "BUY",
    price: params.price,
    size: params.qty,
  });
  const [buyerAfter, sellerAfter] = await Promise.all([
    getBalance(params.buyer.id),
    getBalance(params.seller.id),
  ]);

  const firstFill = takerResult.fills[0];
  console.log(`\n[${params.tag}]`);
  console.log(
    [
      `buyer=${params.buyer.username}`,
      `seller=${params.seller.username}`,
      `outcomeId=${params.outcomeId}`,
      `price=${params.price}`,
      `quantity=${params.qty}`,
      `buyerCashChange=${fmt(buyerAfter.available.sub(buyerBefore.available))}`,
      `sellerCashChange=${fmt(sellerAfter.available.sub(sellerBefore.available))}`,
      `fillId=${firstFill?.id ?? "none"}`,
      `makerOrder=${sellerOrder.order.id}`,
      `takerOrder=${takerResult.order.id}`,
    ].join(" | ")
  );

  return { sellerOrderId: sellerOrder.order.id };
}

async function marketSummary(params: {
  name: string;
  marketId: string;
  users: SimUser[];
  yesId: string;
  noId: string;
}) {
  const positions = await prisma.position.findMany({
    where: { marketId: params.marketId, shares: { gt: 0 } },
    include: { user: { select: { username: true } }, outcome: { select: { name: true } } },
    orderBy: [{ outcomeId: "asc" }, { userId: "asc" }],
  });
  const trades = await prisma.trade.findMany({
    where: { marketId: params.marketId },
    include: { user: { select: { username: true } } },
  });

  const yesByUser = new Map<string, number>();
  const noByUser = new Map<string, number>();
  for (const p of positions) {
    const map = p.outcomeId === params.yesId ? yesByUser : noByUser;
    map.set(p.user.username, (map.get(p.user.username) ?? 0) + n(p.shares));
  }

  const totalYes = Array.from(yesByUser.values()).reduce((a, b) => a + b, 0);
  const totalNo = Array.from(noByUser.values()).reduce((a, b) => a + b, 0);
  const totalBuyCost = trades
    .filter((t) => t.side === "BUY")
    .reduce((acc, t) => acc + n(t.cost), 0);

  const allBalances = await prisma.userBalance.findMany({
    where: { userId: { in: params.users.map((u) => u.id) } },
  });
  const totalLocked = allBalances.reduce((acc, b) => acc + n(b.lockedUSDC), 0);

  const reserveUser = await prisma.user.findUnique({
    where: { username: ORDERBOOK_RESERVE_USERNAME },
    select: { id: true },
  });
  const reserveBal = reserveUser
    ? await prisma.userBalance.findUnique({ where: { userId: reserveUser.id } })
    : null;
  const reserveAvailable = n(reserveBal?.availableUSDC ?? 0);

  const possibleYesPayout = totalYes;
  const possibleNoPayout = totalNo;
  const marketRetainedFunds = totalLocked + reserveAvailable;

  console.log(`\n===== ${params.name} Final Summary =====`);
  console.log(`YES shares outstanding by user: ${JSON.stringify(Object.fromEntries(yesByUser), null, 2)}`);
  console.log(`NO shares outstanding by user: ${JSON.stringify(Object.fromEntries(noByUser), null, 2)}`);
  console.log(`Total YES shares outstanding: ${possibleYesPayout.toFixed(6)}`);
  console.log(`Total NO shares outstanding: ${possibleNoPayout.toFixed(6)}`);
  console.log(`Total BUY notional paid over trade history: ${totalBuyCost.toFixed(6)}`);
  console.log(`Total currently locked user funds (open BUY orders): ${totalLocked.toFixed(6)}`);
  console.log(`Settlement reserve available: ${reserveAvailable.toFixed(6)}`);
  console.log(`Possible payout if YES wins ($1/share): ${possibleYesPayout.toFixed(6)}`);
  console.log(`Possible payout if NO wins ($1/share): ${possibleNoPayout.toFixed(6)}`);
  console.log(`Funds immediately available for settlement (locked + reserve): ${marketRetainedFunds.toFixed(6)}`);
  console.log(
    `Is YES payout fully backed by retained funds alone? ${
      marketRetainedFunds + 1e-9 >= possibleYesPayout ? "YES" : "NO"
    }`
  );
  console.log(
    `Is NO payout fully backed by retained funds alone? ${
      marketRetainedFunds + 1e-9 >= possibleNoPayout ? "YES" : "NO"
    }`
  );
  console.log(
    `Would settlement reserve be required (with zero open-order locks)? ${
      reserveAvailable + 1e-9 >= Math.max(possibleYesPayout, possibleNoPayout) ? "NO" : "YES"
    }`
  );
}

async function scenarioOne() {
  console.log("\n================ Scenario 1: Scripted deterministic flow ================");
  const [alice, bob, carol, dave] = await Promise.all([
    ensureUser("sim_alice"),
    ensureUser("sim_bob"),
    ensureUser("sim_carol"),
    ensureUser("sim_dave"),
  ]);
  const users = [alice, bob, carol, dave];
  for (const u of users) {
    await setBalance(u.id, "200");
  }

  const market = await createMarket("SIM Scenario 1");
  const yesId = market.outcomes.find((o) => o.name === "YES")!.id;
  const noId = market.outcomes.find((o) => o.name === "NO")!.id;

  // Seed initial holders so SELL flow is valid (no naked shorts).
  await setPosition({ userId: bob.id, marketId: market.id, outcomeId: yesId, shares: "12", avgCost: "0.35" });
  await setPosition({ userId: carol.id, marketId: market.id, outcomeId: noId, shares: "15", avgCost: "0.60" });

  await logState("Initial state", users, market.id, yesId, noId);

  await executeCross({
    marketId: market.id,
    outcomeId: yesId,
    seller: bob,
    buyer: alice,
    price: "0.40",
    qty: "5",
    tag: "T1 Alice buys YES from Bob",
  });
  await logState("After T1", users, market.id, yesId, noId);

  await executeCross({
    marketId: market.id,
    outcomeId: yesId,
    seller: alice,
    buyer: dave,
    price: "0.70",
    qty: "3",
    tag: "T2 Dave buys YES from Alice (buy-low/sell-high realized for Alice)",
  });
  await logState("After T2", users, market.id, yesId, noId);

  const partial = await executeCross({
    marketId: market.id,
    outcomeId: noId,
    seller: carol,
    buyer: bob,
    price: "0.55",
    qty: "5",
    tag: "T3 Bob buys NO from Carol (partial scenario start)",
  });

  // Carol posts extra resting sell then partial fill + cancel remainder.
  const carolResting = await placeOrderAndMatch({
    marketId: market.id,
    userId: carol.id,
    outcomeId: noId,
    side: "SELL",
    price: "0.58",
    size: "8",
  });
  await placeOrderAndMatch({
    marketId: market.id,
    userId: dave.id,
    outcomeId: noId,
    side: "BUY",
    price: "0.58",
    size: "3",
  });
  await cancelOrderAndUnlock({ orderId: carolResting.order.id, userId: carol.id });
  console.log(
    `\n[T4 Partial fill + cancel] makerOrder=${carolResting.order.id} partially filled then canceled remaining.`
  );

  await logState("After T3/T4", users, market.id, yesId, noId);
  await marketSummary({
    name: "Scenario 1",
    marketId: market.id,
    users,
    yesId,
    noId,
  });
  void partial;
}

async function scenarioTwoStress() {
  console.log("\n================ Scenario 2: Deterministic stress run ================");
  const r = rng(1337);
  const users = await Promise.all([
    ensureUser("sim_s2_u1"),
    ensureUser("sim_s2_u2"),
    ensureUser("sim_s2_u3"),
    ensureUser("sim_s2_u4"),
    ensureUser("sim_s2_u5"),
  ]);
  for (const u of users) {
    await setBalance(u.id, "500");
  }

  const market = await createMarket("SIM Scenario 2 Stress");
  const yesId = market.outcomes.find((o) => o.name === "YES")!.id;
  const noId = market.outcomes.find((o) => o.name === "NO")!.id;

  // Intentionally large both-side outstanding inventory to stress settlement funding needs.
  await setPosition({ userId: users[0].id, marketId: market.id, outcomeId: yesId, shares: "80", avgCost: "0.30" });
  await setPosition({ userId: users[1].id, marketId: market.id, outcomeId: yesId, shares: "40", avgCost: "0.45" });
  await setPosition({ userId: users[2].id, marketId: market.id, outcomeId: noId, shares: "70", avgCost: "0.55" });
  await setPosition({ userId: users[3].id, marketId: market.id, outcomeId: noId, shares: "50", avgCost: "0.65" });

  for (let i = 0; i < 20; i += 1) {
    const sideOutcome = r() < 0.5 ? yesId : noId;
    const qty = (1 + Math.floor(r() * 6)).toString();
    const priceBase = sideOutcome === yesId ? 0.35 : 0.45;
    const price = (priceBase + r() * 0.35).toFixed(2);

    const sellerCandidates = [];
    for (const u of users) {
      const pos = await getOutcomePosition(u.id, market.id, sideOutcome);
      if (n(pos.shares.sub(pos.reservedShares)) >= Number(qty)) sellerCandidates.push(u);
    }
    if (sellerCandidates.length === 0) continue;

    const seller = sellerCandidates[Math.floor(r() * sellerCandidates.length)];
    const buyerCandidates = users.filter((u) => u.id !== seller.id);
    const buyer = buyerCandidates[Math.floor(r() * buyerCandidates.length)];

    try {
      await executeCross({
        marketId: market.id,
        outcomeId: sideOutcome,
        seller,
        buyer,
        price,
        qty,
        tag: `S2-T${i + 1}`,
      });
    } catch (error) {
      console.log(`[S2-T${i + 1}] skipped (${error instanceof Error ? error.message : "unknown error"})`);
    }
  }

  await logState("Scenario 2 end state", users, market.id, yesId, noId);
  await marketSummary({
    name: "Scenario 2 Stress",
    marketId: market.id,
    users,
    yesId,
    noId,
  });
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run funding simulation in production.");
  }

  console.log("Public ORDERBOOK funding investigation");
  console.log("Deterministic run with scripted + seeded-random scenarios.\n");
  await scenarioOne();
  await scenarioTwoStress();

  console.log("\n================ Conclusion ================");
  console.log(
    [
      "The current public ORDERBOOK model is not automatically self-balanced like Kalshi.",
      "Trades transfer cash between users, but settlement redeems winners at $1/share and therefore needs an external backing source.",
      `In this codebase, that source is user '${ORDERBOOK_RESERVE_USERNAME}'.`,
      "If reserve funds are insufficient, resolution fails.",
    ].join("\n")
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

