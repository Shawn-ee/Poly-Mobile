import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/db";
import { cancelOrderAndUnlock, placeOrderAndMatch } from "../src/server/services/matching";

const ZERO = new Prisma.Decimal(0);
const ORDERBOOK_RESERVE_USERNAME = "__orderbook_settlement_reserve__";

type SimUser = { id: string; username: string };
type Breakpoint = {
  scenario: string;
  event: string;
  requiredCollateral: number;
  retainedCollateral: number;
  gap: number;
};

const dec = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);
const n = (v: Prisma.Decimal | string | number | null | undefined) => Number(v ?? 0);
const f6 = (v: number | Prisma.Decimal | string) => n(v).toFixed(6);

const rng = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
};

const breakpoints: Breakpoint[] = [];

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
    data: { availableUSDC: dec(availableUSDC), lockedUSDC: ZERO },
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

async function createMarket(name: string) {
  const slug = `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
  return prisma.market.create({
    data: {
      slug,
      title: name,
      description: "Collateral ledger investigation",
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
  const bal = await prisma.userBalance.findUniqueOrThrow({ where: { userId } });
  return { available: bal.availableUSDC, locked: bal.lockedUSDC };
}

async function getPos(userId: string, marketId: string, outcomeId: string) {
  const pos = await prisma.position.findUnique({
    where: { userId_marketId_outcomeId: { userId, marketId, outcomeId } },
  });
  return {
    shares: pos?.shares ?? ZERO,
    reserved: pos?.reservedShares ?? ZERO,
  };
}

async function analyzeEvent(params: {
  scenario: string;
  event: string;
  marketId: string;
  yesId: string;
  noId: string;
  users: SimUser[];
  buyer?: SimUser;
  seller?: SimUser;
  price?: string;
  qty?: string;
  buyerCashDelta?: Prisma.Decimal;
  sellerCashDelta?: Prisma.Decimal;
  prevRequiredCollateral: number;
}) {
  const [yesAgg, noAgg, openBuyOrders] = await Promise.all([
    prisma.position.aggregate({
      where: { marketId: params.marketId, outcomeId: params.yesId, shares: { gt: 0 } },
      _sum: { shares: true },
    }),
    prisma.position.aggregate({
      where: { marketId: params.marketId, outcomeId: params.noId, shares: { gt: 0 } },
      _sum: { shares: true },
    }),
    prisma.order.aggregate({
      where: {
        marketId: params.marketId,
        side: "BUY",
        status: { in: ["OPEN", "PARTIAL"] },
      },
      _sum: { reservedNotional: true },
    }),
  ]);

  const totalYes = n(yesAgg._sum.shares ?? 0);
  const totalNo = n(noAgg._sum.shares ?? 0);
  const payoutIfYes = totalYes;
  const payoutIfNo = totalNo;
  const requiredCollateral = Math.max(payoutIfYes, payoutIfNo);
  const retainedCollateral = n(openBuyOrders._sum.reservedNotional ?? 0);
  const gapYes = payoutIfYes - retainedCollateral;
  const gapNo = payoutIfNo - retainedCollateral;
  const contractCreated = Math.max(0, requiredCollateral - params.prevRequiredCollateral);

  console.log(`\n[${params.scenario}] ${params.event}`);
  if (params.buyer && params.seller) {
    console.log(
      [
        `trade buyer=${params.buyer.username}`,
        `seller=${params.seller.username}`,
        `price=${params.price}`,
        `qty=${params.qty}`,
        `buyerCashDelta=${f6(params.buyerCashDelta ?? 0)}`,
        `sellerCashDelta=${f6(params.sellerCashDelta ?? 0)}`,
      ].join(" | ")
    );
  }
  console.log(
    [
      `totalYES=${f6(totalYes)}`,
      `totalNO=${f6(totalNo)}`,
      `marketLinkedRetained=${f6(retainedCollateral)}`,
      `payoutIfYES=${f6(payoutIfYes)}`,
      `payoutIfNO=${f6(payoutIfNo)}`,
      `gapYES=${f6(gapYes)}`,
      `gapNO=${f6(gapNo)}`,
    ].join(" | ")
  );
  console.log(
    `redeemableContractsCreatedThisEvent=${f6(contractCreated)} | fullyBackedByMarketLinkedFunds=${
      requiredCollateral <= retainedCollateral + 1e-9 ? "YES" : "NO"
    }`
  );

  for (const u of params.users) {
    const [bal, y, nPos] = await Promise.all([
      getBalance(u.id),
      getPos(u.id, params.marketId, params.yesId),
      getPos(u.id, params.marketId, params.noId),
    ]);
    console.log(
      `  - ${u.username}: cash=${f6(bal.available)} lock=${f6(bal.locked)} YES=${f6(
        y.shares
      )}(res=${f6(y.reserved)}) NO=${f6(nPos.shares)}(res=${f6(nPos.reserved)})`
    );
  }

  if (requiredCollateral > retainedCollateral + 1e-9) {
    breakpoints.push({
      scenario: params.scenario,
      event: params.event,
      requiredCollateral,
      retainedCollateral,
      gap: requiredCollateral - retainedCollateral,
    });
  }

  return requiredCollateral;
}

async function crossTrade(params: {
  scenario: string;
  tag: string;
  marketId: string;
  outcomeId: string;
  seller: SimUser;
  buyer: SimUser;
  price: string;
  qty: string;
  yesId: string;
  noId: string;
  users: SimUser[];
  prevRequiredCollateral: number;
}) {
  const [buyerBefore, sellerBefore] = await Promise.all([
    getBalance(params.buyer.id),
    getBalance(params.seller.id),
  ]);

  await placeOrderAndMatch({
    marketId: params.marketId,
    userId: params.seller.id,
    outcomeId: params.outcomeId,
    side: "SELL",
    price: params.price,
    size: params.qty,
  });
  await placeOrderAndMatch({
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

  return analyzeEvent({
    scenario: params.scenario,
    event: params.tag,
    marketId: params.marketId,
    yesId: params.yesId,
    noId: params.noId,
    users: params.users,
    buyer: params.buyer,
    seller: params.seller,
    price: params.price,
    qty: params.qty,
    buyerCashDelta: buyerAfter.available.sub(buyerBefore.available),
    sellerCashDelta: sellerAfter.available.sub(sellerBefore.available),
    prevRequiredCollateral: params.prevRequiredCollateral,
  });
}

async function scenarioScripted() {
  const scenario = "Scenario A (scripted realistic flow)";
  console.log(`\n================ ${scenario} ================`);
  const [alice, bob, carol, dave] = await Promise.all([
    ensureUser("collat_a_alice"),
    ensureUser("collat_a_bob"),
    ensureUser("collat_a_carol"),
    ensureUser("collat_a_dave"),
  ]);
  const users = [alice, bob, carol, dave];
  for (const u of users) {
    await setBalance(u.id, "200");
  }
  const market = await createMarket("Collateral Scenario A");
  const yesId = market.outcomes.find((o) => o.name === "YES")!.id;
  const noId = market.outcomes.find((o) => o.name === "NO")!.id;

  let required = 0;
  required = await analyzeEvent({
    scenario,
    event: "Initial empty market",
    marketId: market.id,
    yesId,
    noId,
    users,
    prevRequiredCollateral: required,
  });

  await setPosition({ userId: bob.id, marketId: market.id, outcomeId: yesId, shares: "10", avgCost: "0.30" });
  required = await analyzeEvent({
    scenario,
    event: "Seed YES inventory (Bob +10 YES)",
    marketId: market.id,
    yesId,
    noId,
    users,
    prevRequiredCollateral: required,
  });

  await setPosition({ userId: carol.id, marketId: market.id, outcomeId: noId, shares: "8", avgCost: "0.55" });
  required = await analyzeEvent({
    scenario,
    event: "Seed NO inventory (Carol +8 NO)",
    marketId: market.id,
    yesId,
    noId,
    users,
    prevRequiredCollateral: required,
  });

  required = await crossTrade({
    scenario,
    tag: "T1 Alice buys 4 YES @0.40 from Bob",
    marketId: market.id,
    outcomeId: yesId,
    seller: bob,
    buyer: alice,
    price: "0.40",
    qty: "4",
    yesId,
    noId,
    users,
    prevRequiredCollateral: required,
  });

  required = await crossTrade({
    scenario,
    tag: "T2 Dave buys 2 YES @0.72 from Alice (buy-low/sell-high)",
    marketId: market.id,
    outcomeId: yesId,
    seller: alice,
    buyer: dave,
    price: "0.72",
    qty: "2",
    yesId,
    noId,
    users,
    prevRequiredCollateral: required,
  });

  required = await crossTrade({
    scenario,
    tag: "T3 Bob buys 3 NO @0.58 from Carol",
    marketId: market.id,
    outcomeId: noId,
    seller: carol,
    buyer: bob,
    price: "0.58",
    qty: "3",
    yesId,
    noId,
    users,
    prevRequiredCollateral: required,
  });

  const restingSell = await placeOrderAndMatch({
    marketId: market.id,
    userId: carol.id,
    outcomeId: noId,
    side: "SELL",
    price: "0.60",
    size: "5",
  });
  required = await analyzeEvent({
    scenario,
    event: "T4 Carol posts resting SELL 5 NO @0.60",
    marketId: market.id,
    yesId,
    noId,
    users,
    prevRequiredCollateral: required,
  });
  const daveBefore = await getBalance(dave.id);
  const carolBefore = await getBalance(carol.id);
  await placeOrderAndMatch({
    marketId: market.id,
    userId: dave.id,
    outcomeId: noId,
    side: "BUY",
    price: "0.60",
    size: "2",
  });
  const daveAfter = await getBalance(dave.id);
  const carolAfter = await getBalance(carol.id);
  required = await analyzeEvent({
    scenario,
    event: "T5 Dave partially fills 2 NO @0.60 from Carol resting order",
    marketId: market.id,
    yesId,
    noId,
    users,
    buyer: dave,
    seller: carol,
    price: "0.60",
    qty: "2",
    buyerCashDelta: daveAfter.available.sub(daveBefore.available),
    sellerCashDelta: carolAfter.available.sub(carolBefore.available),
    prevRequiredCollateral: required,
  });
  await cancelOrderAndUnlock({ orderId: restingSell.order.id, userId: carol.id });
  await analyzeEvent({
    scenario,
    event: "T6 Carol cancels remaining NO sell",
    marketId: market.id,
    yesId,
    noId,
    users,
    prevRequiredCollateral: required,
  });
}

async function scenarioStress() {
  const scenario = "Scenario B (deterministic stress)";
  console.log(`\n================ ${scenario} ================`);
  const r = rng(424242);
  const users = await Promise.all([
    ensureUser("collat_b_u1"),
    ensureUser("collat_b_u2"),
    ensureUser("collat_b_u3"),
    ensureUser("collat_b_u4"),
    ensureUser("collat_b_u5"),
  ]);
  for (const u of users) {
    await setBalance(u.id, "500");
  }
  const market = await createMarket("Collateral Scenario B");
  const yesId = market.outcomes.find((o) => o.name === "YES")!.id;
  const noId = market.outcomes.find((o) => o.name === "NO")!.id;

  let required = 0;
  required = await analyzeEvent({
    scenario,
    event: "Initial empty market",
    marketId: market.id,
    yesId,
    noId,
    users,
    prevRequiredCollateral: required,
  });

  await setPosition({ userId: users[0].id, marketId: market.id, outcomeId: yesId, shares: "60", avgCost: "0.35" });
  required = await analyzeEvent({
    scenario,
    event: "Seed YES 60 to u1",
    marketId: market.id,
    yesId,
    noId,
    users,
    prevRequiredCollateral: required,
  });

  await setPosition({ userId: users[1].id, marketId: market.id, outcomeId: yesId, shares: "40", avgCost: "0.45" });
  required = await analyzeEvent({
    scenario,
    event: "Seed YES 40 to u2",
    marketId: market.id,
    yesId,
    noId,
    users,
    prevRequiredCollateral: required,
  });

  await setPosition({ userId: users[2].id, marketId: market.id, outcomeId: noId, shares: "55", avgCost: "0.55" });
  required = await analyzeEvent({
    scenario,
    event: "Seed NO 55 to u3",
    marketId: market.id,
    yesId,
    noId,
    users,
    prevRequiredCollateral: required,
  });

  await setPosition({ userId: users[3].id, marketId: market.id, outcomeId: noId, shares: "45", avgCost: "0.62" });
  required = await analyzeEvent({
    scenario,
    event: "Seed NO 45 to u4",
    marketId: market.id,
    yesId,
    noId,
    users,
    prevRequiredCollateral: required,
  });

  for (let i = 0; i < 12; i += 1) {
    const outcomeId = r() < 0.5 ? yesId : noId;
    const qty = (1 + Math.floor(r() * 6)).toString();
    const priceBase = outcomeId === yesId ? 0.34 : 0.47;
    const price = (priceBase + r() * 0.34).toFixed(2);

    const sellerCandidates: SimUser[] = [];
    for (const u of users) {
      const pos = await getPos(u.id, market.id, outcomeId);
      if (n(pos.shares.sub(pos.reserved)) >= Number(qty)) {
        sellerCandidates.push(u);
      }
    }
    if (sellerCandidates.length === 0) continue;
    const seller = sellerCandidates[Math.floor(r() * sellerCandidates.length)];
    const buyers = users.filter((u) => u.id !== seller.id);
    const buyer = buyers[Math.floor(r() * buyers.length)];

    required = await crossTrade({
      scenario,
      tag: `S${i + 1} ${buyer.username} buys ${qty} ${
        outcomeId === yesId ? "YES" : "NO"
      } @${price} from ${seller.username}`,
      marketId: market.id,
      outcomeId,
      seller,
      buyer,
      price,
      qty,
      yesId,
      noId,
      users,
      prevRequiredCollateral: required,
    });
  }
}

async function finalReport() {
  console.log("\n================ Collateralization Breakpoints ================");
  if (breakpoints.length === 0) {
    console.log("No collateral gap breakpoints detected.");
  } else {
    breakpoints.forEach((bp, idx) => {
      console.log(
        `${idx + 1}. ${bp.scenario} | ${bp.event} | required=${f6(
          bp.requiredCollateral
        )} retained=${f6(bp.retainedCollateral)} gap=${f6(bp.gap)}`
      );
    });
  }

  const reserveUser = await prisma.user.findUnique({
    where: { username: ORDERBOOK_RESERVE_USERNAME },
    select: { id: true },
  });
  const reserveBal = reserveUser
    ? await prisma.userBalance.findUnique({ where: { userId: reserveUser.id } })
    : null;

  console.log("\n================ Investigation Conclusion ================");
  console.log("1) Current source of truth for public market payout backing:");
  console.log(
    `   External reserve user '${ORDERBOOK_RESERVE_USERNAME}' + any transient open BUY locked funds.`
  );
  console.log("2) Point where market fails to retain enough collateral:");
  console.log(
    "   Immediately when redeemable YES/NO shares are outstanding without corresponding market-held collateral bucket; this appears at initial share seeding and persists through transfers."
  );
  console.log(
    `   Current reserve balance observed: ${f6(n(reserveBal?.availableUSDC ?? 0))}`
  );
  console.log("3) Minimum redesign to remove reserve dependence:");
  console.log("   a) Add complete-set mint/redeem accounting (YES+NO contract collateralization).");
  console.log("   b) Add a market-level collateral bucket as settlement source of truth.");
  console.log(
    "   c) Restrict share creation paths so outstanding redeemable shares can only come from collateralized mint/convert flows, not free inventory grants."
  );
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run collateral investigation in production.");
  }
  console.log("Public ORDERBOOK formal collateral-ledger investigation");
  await scenarioScripted();
  await scenarioStress();
  await finalReport();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
