import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { placeOrderAndMatch, cancelOrderAndUnlock } from "@/server/services/matching";
import {
  cancelPrivatePool,
  resolveOrderbookMarket,
  resolvePrivatePool,
} from "@/server/services/settlement";
import {
  getPublicOrderbookCollateralSnapshot,
  mintCompleteSetForPublicOrderbook,
} from "@/server/services/orderbookCollateral";
import { resetPublicSchema } from "./dbTestUtils";

const dec = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);
const num = (v: Prisma.Decimal | string | number | null | undefined) => Number(v ?? 0);

const createUser = async (name: string, isAdmin = false) =>
  prisma.user.create({
    data: {
      username: `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      email: `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.local`,
      isAdmin,
    },
  });

const fundUser = async (userId: string, amount: Prisma.Decimal.Value) => {
  await prisma.userBalance.upsert({
    where: { userId },
    update: { availableUSDC: dec(amount), lockedUSDC: dec(0) },
    create: { userId, availableUSDC: dec(amount), lockedUSDC: dec(0) },
  });
};

const createPublicOrderbookMarket = async () => {
  return prisma.market.create({
    data: {
      title: "Phase7 Public Market",
      description: "kalshi-style test",
      status: "LIVE",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      kind: "ORDERBOOK",
      isCanceled: false,
      isListed: true,
      outcomes: {
        create: [
          { name: "YES", slug: `p7-yes-${Math.random()}`, displayOrder: 0, isActive: true },
          { name: "NO", slug: `p7-no-${Math.random()}`, displayOrder: 1, isActive: true },
        ],
      },
    },
    include: { outcomes: true },
  });
};

const createPrivatePoolMarket = async (ownerId: string) => {
  return prisma.market.create({
    data: {
      title: "Phase7 Private Pool",
      description: "private pool settlement test",
      status: "LIVE",
      mechanism: "POOL",
      visibility: "PRIVATE",
      kind: "POOL",
      isCanceled: false,
      isListed: false,
      ownerId,
      outcomes: {
        create: [
          { name: "A", slug: `p7-a-${Math.random()}`, displayOrder: 0, isActive: true },
          { name: "B", slug: `p7-b-${Math.random()}`, displayOrder: 1, isActive: true },
        ],
      },
    },
    include: { outcomes: true },
  });
};

const getBest = async (marketId: string, outcomeId: string, side: "BUY" | "SELL") => {
  const row = await prisma.order.findFirst({
    where: {
      marketId,
      outcomeId,
      side,
      status: { in: ["OPEN", "PARTIAL"] },
      remaining: { gt: dec(0) },
    },
    orderBy:
      side === "BUY"
        ? [{ price: "desc" }, { createdAt: "asc" }]
        : [{ price: "asc" }, { createdAt: "asc" }],
    select: { price: true },
  });
  return row ? num(row.price) : null;
};

describe("Phase 7 Kalshi-style public model", () => {
  beforeEach(async () => {
    await resetPublicSchema();
  });

  test("cannot place naked SELL without owned shares", async () => {
    const user = await createUser("naked_seller");
    const market = await createPublicOrderbookMarket();

    await expect(
      placeOrderAndMatch({
        marketId: market.id,
        userId: user.id,
        outcomeId: market.outcomes[0].id,
        side: "SELL",
        price: "0.50",
        size: "1",
      })
    ).rejects.toThrow("Insufficient shares");
  });

  test("cannot sell more than owned shares", async () => {
    const user = await createUser("oversell");
    const market = await createPublicOrderbookMarket();
    await fundUser(user.id, "10");
    await mintCompleteSetForPublicOrderbook({
      marketId: market.id,
      userId: user.id,
      quantity: "2",
    });

    await expect(
      placeOrderAndMatch({
        marketId: market.id,
        userId: user.id,
        outcomeId: market.outcomes[0].id,
        side: "SELL",
        price: "0.52",
        size: "3",
      })
    ).rejects.toThrow("Insufficient available shares");
  });

  test("BUY rejected when insufficient USDC", async () => {
    const user = await createUser("insufficient_buy");
    const market = await createPublicOrderbookMarket();

    await expect(
      placeOrderAndMatch({
        marketId: market.id,
        userId: user.id,
        outcomeId: market.outcomes[0].id,
        side: "BUY",
        price: "0.70",
        size: "10",
      })
    ).rejects.toThrow("Insufficient available USDC");
  });

  test("price outside [0,1] is rejected", async () => {
    const buyer = await createUser("price_bounds");
    const market = await createPublicOrderbookMarket();
    await fundUser(buyer.id, "100");

    await expect(
      placeOrderAndMatch({
        marketId: market.id,
        userId: buyer.id,
        outcomeId: market.outcomes[0].id,
        side: "BUY",
        price: "1.01",
        size: "1",
      })
    ).rejects.toThrow("Price must be between 0 and 1");

    await expect(
      placeOrderAndMatch({
        marketId: market.id,
        userId: buyer.id,
        outcomeId: market.outcomes[0].id,
        side: "BUY",
        price: "-0.01",
        size: "1",
      })
    ).rejects.toThrow("Price must be between 0 and 1");
  });

  test("valid buy then sell owned shares works", async () => {
    const sellerA = await createUser("seller_a");
    const buyerB = await createUser("buyer_b");
    const buyerC = await createUser("buyer_c");
    const market = await createPublicOrderbookMarket();
    const outcomeId = market.outcomes[0].id;

    await fundUser(sellerA.id, "10");
    await fundUser(buyerB.id, "100");
    await fundUser(buyerC.id, "100");
    await mintCompleteSetForPublicOrderbook({
      marketId: market.id,
      userId: sellerA.id,
      quantity: "5",
    });

    const beforeMarket = await prisma.market.findUniqueOrThrow({ where: { id: market.id } });

    await placeOrderAndMatch({
      marketId: market.id,
      userId: sellerA.id,
      outcomeId,
      side: "SELL",
      price: "0.50",
      size: "2",
    });
    await placeOrderAndMatch({
      marketId: market.id,
      userId: buyerB.id,
      outcomeId,
      side: "BUY",
      price: "0.50",
      size: "2",
    });

    const buyerPosAfterBuy = await prisma.position.findUniqueOrThrow({
      where: { userId_marketId_outcomeId: { userId: buyerB.id, marketId: market.id, outcomeId } },
    });
    expect(num(buyerPosAfterBuy.shares)).toBe(2);

    await placeOrderAndMatch({
      marketId: market.id,
      userId: buyerC.id,
      outcomeId,
      side: "BUY",
      price: "0.50",
      size: "1",
    });
    await placeOrderAndMatch({
      marketId: market.id,
      userId: buyerB.id,
      outcomeId,
      side: "SELL",
      price: "0.50",
      size: "1",
    });

    const buyerPosAfterSell = await prisma.position.findUniqueOrThrow({
      where: { userId_marketId_outcomeId: { userId: buyerB.id, marketId: market.id, outcomeId } },
    });
    expect(num(buyerPosAfterSell.shares)).toBe(1);
    const afterMarket = await prisma.market.findUniqueOrThrow({ where: { id: market.id } });
    expect(num(afterMarket.collateralUSDC)).toBe(num(beforeMarket.collateralUSDC));
  });

  test("partial fill preserves reservedShares and cancel releases remaining reservation", async () => {
    const seller = await createUser("partial_seller");
    const buyer = await createUser("partial_buyer");
    const market = await createPublicOrderbookMarket();
    const outcomeId = market.outcomes[0].id;

    await fundUser(seller.id, "20");
    await fundUser(buyer.id, "100");
    await mintCompleteSetForPublicOrderbook({
      marketId: market.id,
      userId: seller.id,
      quantity: "10",
    });

    const sell = await placeOrderAndMatch({
      marketId: market.id,
      userId: seller.id,
      outcomeId,
      side: "SELL",
      price: "0.60",
      size: "10",
    });
    let sellerPos = await prisma.position.findUniqueOrThrow({
      where: { userId_marketId_outcomeId: { userId: seller.id, marketId: market.id, outcomeId } },
    });
    expect(num(sellerPos.reservedShares)).toBe(10);

    await placeOrderAndMatch({
      marketId: market.id,
      userId: buyer.id,
      outcomeId,
      side: "BUY",
      price: "0.60",
      size: "4",
    });
    sellerPos = await prisma.position.findUniqueOrThrow({
      where: { userId_marketId_outcomeId: { userId: seller.id, marketId: market.id, outcomeId } },
    });
    expect(num(sellerPos.shares)).toBe(6);
    expect(num(sellerPos.reservedShares)).toBe(6);

    await cancelOrderAndUnlock({ orderId: sell.order.id, userId: seller.id });
    sellerPos = await prisma.position.findUniqueOrThrow({
      where: { userId_marketId_outcomeId: { userId: seller.id, marketId: market.id, outcomeId } },
    });
    expect(num(sellerPos.shares)).toBe(6);
    expect(num(sellerPos.reservedShares)).toBe(0);
  });

  test("collateralized contract creation and conservation snapshot", async () => {
    const user = await createUser("mint_user");
    const market = await createPublicOrderbookMarket();
    await fundUser(user.id, "50");

    await mintCompleteSetForPublicOrderbook({
      marketId: market.id,
      userId: user.id,
      quantity: "7",
    });
    const snapshot = await getPublicOrderbookCollateralSnapshot(market.id);
    const yesId = market.outcomes[0].id;
    const noId = market.outcomes[1].id;
    expect(snapshot.collateralUSDC).toBe("7");
    expect(snapshot.byOutcome[yesId]).toBe("7");
    expect(snapshot.byOutcome[noId]).toBe("7");
  });

  test("rejects invalid non-collateralized inventory seeding", async () => {
    const user = await createUser("seed_attacker");
    const buyer = await createUser("honest_buyer");
    const market = await createPublicOrderbookMarket();
    await fundUser(buyer.id, "10");

    await prisma.position.create({
      data: {
        userId: user.id,
        marketId: market.id,
        outcomeId: market.outcomes[0].id,
        shares: dec("1"),
        avgCost: dec("0.1"),
      },
    });

    await expect(
      placeOrderAndMatch({
        marketId: market.id,
        userId: buyer.id,
        outcomeId: market.outcomes[0].id,
        side: "BUY",
        price: "0.50",
        size: "1",
      })
    ).rejects.toThrow("collateral invariant");
  });

  test("public resolve pays exactly $1/share from market collateral without external reserve", async () => {
    const admin = await createUser("admin", true);
    const winner = await createUser("winner");
    const loser = await createUser("loser");
    const market = await createPublicOrderbookMarket();
    const winningOutcomeId = market.outcomes[0].id;
    const noOutcomeId = market.outcomes[1].id;

    await fundUser(winner.id, "10");
    await fundUser(loser.id, "10");
    await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: winner.id, quantity: "3" });
    await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: loser.id, quantity: "2" });

    // Transfer NO so winner keeps YES and loser keeps NO.
    await placeOrderAndMatch({
      marketId: market.id,
      userId: winner.id,
      outcomeId: noOutcomeId,
      side: "SELL",
      price: "0.45",
      size: "3",
    });
    await placeOrderAndMatch({
      marketId: market.id,
      userId: loser.id,
      outcomeId: noOutcomeId,
      side: "BUY",
      price: "0.45",
      size: "3",
    });

    const beforeWinner = await prisma.userBalance.findUniqueOrThrow({ where: { userId: winner.id } });
    const beforeLoser = await prisma.userBalance.findUniqueOrThrow({ where: { userId: loser.id } });
    const beforeMarket = await prisma.market.findUniqueOrThrow({ where: { id: market.id } });

    const result = await resolveOrderbookMarket({
      marketId: market.id,
      winningOutcomeId,
      actorUserId: admin.id,
    });

    expect(result.totalPoolPayout).toBe("5");
    expect(result.totalWinningShares).toBe("5");

    const afterWinner = await prisma.userBalance.findUniqueOrThrow({ where: { userId: winner.id } });
    const afterLoser = await prisma.userBalance.findUniqueOrThrow({ where: { userId: loser.id } });
    const afterMarket = await prisma.market.findUniqueOrThrow({ where: { id: market.id } });

    expect(num(afterWinner.availableUSDC) - num(beforeWinner.availableUSDC)).toBe(3);
    expect(num(afterLoser.availableUSDC) - num(beforeLoser.availableUSDC)).toBe(2);
    expect(num(beforeMarket.collateralUSDC) - num(afterMarket.collateralUSDC)).toBe(5);
    expect(num(afterMarket.collateralUSDC)).toBe(0);
  });

  test("double resolution is rejected", async () => {
    const admin = await createUser("admin2", true);
    const user = await createUser("winner2");
    const market = await createPublicOrderbookMarket();
    const winningOutcomeId = market.outcomes[0].id;

    await fundUser(user.id, "5");
    await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: user.id, quantity: "2" });

    await resolveOrderbookMarket({
      marketId: market.id,
      winningOutcomeId,
      actorUserId: admin.id,
    });

    await expect(
      resolveOrderbookMarket({
        marketId: market.id,
        winningOutcomeId,
        actorUserId: admin.id,
      })
    ).rejects.toThrow("Market has already been resolved");
  });

  test("private pool behavior remains: proportional resolve and cancel refunds", async () => {
    const owner = await createUser("pool_owner");
    const userA = await createUser("pool_a");
    const userB = await createUser("pool_b");
    const userC = await createUser("pool_c");

    await fundUser(userA.id, "100");
    await fundUser(userB.id, "100");
    await fundUser(userC.id, "100");

    const marketResolve = await createPrivatePoolMarket(owner.id);
    const outcomeA = marketResolve.outcomes[0].id;
    const outcomeB = marketResolve.outcomes[1].id;

    await prisma.poolBet.createMany({
      data: [
        { userId: userA.id, marketId: marketResolve.id, outcomeId: outcomeA, amount: dec("30") },
        { userId: userB.id, marketId: marketResolve.id, outcomeId: outcomeA, amount: dec("10") },
        { userId: userC.id, marketId: marketResolve.id, outcomeId: outcomeB, amount: dec("60") },
      ],
    });

    const beforeA = await prisma.userBalance.findUniqueOrThrow({ where: { userId: userA.id } });
    const beforeB = await prisma.userBalance.findUniqueOrThrow({ where: { userId: userB.id } });
    const beforeC = await prisma.userBalance.findUniqueOrThrow({ where: { userId: userC.id } });

    const resolved = await resolvePrivatePool({
      poolId: marketResolve.id,
      winningOutcomeId: outcomeA,
      actorUserId: owner.id,
    });
    expect(num(resolved.totalPoolPayout)).toBe(100);

    const afterA = await prisma.userBalance.findUniqueOrThrow({ where: { userId: userA.id } });
    const afterB = await prisma.userBalance.findUniqueOrThrow({ where: { userId: userB.id } });
    const afterC = await prisma.userBalance.findUniqueOrThrow({ where: { userId: userC.id } });
    expect(num(afterA.availableUSDC) - num(beforeA.availableUSDC)).toBe(75);
    expect(num(afterB.availableUSDC) - num(beforeB.availableUSDC)).toBe(25);
    expect(num(afterC.availableUSDC) - num(beforeC.availableUSDC)).toBe(0);

    const marketCancel = await createPrivatePoolMarket(owner.id);
    await prisma.poolBet.createMany({
      data: [
        {
          userId: userA.id,
          marketId: marketCancel.id,
          outcomeId: marketCancel.outcomes[0].id,
          amount: dec("12"),
        },
        {
          userId: userB.id,
          marketId: marketCancel.id,
          outcomeId: marketCancel.outcomes[1].id,
          amount: dec("8"),
        },
      ],
    });
    const cancelBeforeA = await prisma.userBalance.findUniqueOrThrow({ where: { userId: userA.id } });
    const cancelBeforeB = await prisma.userBalance.findUniqueOrThrow({ where: { userId: userB.id } });
    await cancelPrivatePool({ poolId: marketCancel.id, actorUserId: owner.id });
    const cancelAfterA = await prisma.userBalance.findUniqueOrThrow({ where: { userId: userA.id } });
    const cancelAfterB = await prisma.userBalance.findUniqueOrThrow({ where: { userId: userB.id } });
    expect(num(cancelAfterA.availableUSDC) - num(cancelBeforeA.availableUSDC)).toBe(12);
    expect(num(cancelAfterB.availableUSDC) - num(cancelBeforeB.availableUSDC)).toBe(8);
  });

  test("order rejected if bid_yes + bid_no > 1", async () => {
    const u1 = await createUser("bid_u1");
    const u2 = await createUser("bid_u2");
    const market = await createPublicOrderbookMarket();
    const yesId = market.outcomes[0].id;
    const noId = market.outcomes[1].id;
    await fundUser(u1.id, "100");
    await fundUser(u2.id, "100");
    await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: u1.id, quantity: "1" });
    await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: u2.id, quantity: "1" });

    await placeOrderAndMatch({
      marketId: market.id,
      userId: u1.id,
      outcomeId: yesId,
      side: "BUY",
      price: "0.70",
      size: "1",
    });

    await expect(
      placeOrderAndMatch({
        marketId: market.id,
        userId: u2.id,
        outcomeId: noId,
        side: "BUY",
        price: "0.40",
        size: "1",
      })
    ).rejects.toThrow("best_bid_yes + best_bid_no");
  });

  test("order rejected if ask_yes + ask_no < 1", async () => {
    const u1 = await createUser("ask_u1");
    const u2 = await createUser("ask_u2");
    const market = await createPublicOrderbookMarket();
    const yesId = market.outcomes[0].id;
    const noId = market.outcomes[1].id;
    await fundUser(u1.id, "10");
    await fundUser(u2.id, "10");
    await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: u1.id, quantity: "2" });
    await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: u2.id, quantity: "2" });

    await placeOrderAndMatch({
      marketId: market.id,
      userId: u1.id,
      outcomeId: yesId,
      side: "SELL",
      price: "0.40",
      size: "1",
    });

    await expect(
      placeOrderAndMatch({
        marketId: market.id,
        userId: u2.id,
        outcomeId: noId,
        side: "SELL",
        price: "0.50",
        size: "1",
      })
    ).rejects.toThrow("best_ask_yes + best_ask_no");
  });

  test("valid binary-book orders still execute normally", async () => {
    const seller = await createUser("valid_seller");
    const buyer = await createUser("valid_buyer");
    const market = await createPublicOrderbookMarket();
    const yesId = market.outcomes[0].id;
    const noId = market.outcomes[1].id;
    await fundUser(seller.id, "10");
    await fundUser(buyer.id, "100");
    await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: seller.id, quantity: "3" });

    await placeOrderAndMatch({
      marketId: market.id,
      userId: seller.id,
      outcomeId: yesId,
      side: "SELL",
      price: "0.60",
      size: "1",
    });
    await placeOrderAndMatch({
      marketId: market.id,
      userId: buyer.id,
      outcomeId: yesId,
      side: "BUY",
      price: "0.60",
      size: "1",
    });
    await placeOrderAndMatch({
      marketId: market.id,
      userId: seller.id,
      outcomeId: noId,
      side: "SELL",
      price: "0.40",
      size: "1",
    });

    const bestAskYes = await getBest(market.id, yesId, "SELL");
    const bestAskNo = await getBest(market.id, noId, "SELL");
    expect(bestAskYes === null || bestAskNo === null || bestAskYes + bestAskNo >= 1).toBe(true);
  });

  test("binary invariant holds after partial fills", async () => {
    const sellerYes = await createUser("partial_yes");
    const sellerNo = await createUser("partial_no");
    const buyer = await createUser("partial_buyer");
    const market = await createPublicOrderbookMarket();
    const yesId = market.outcomes[0].id;
    const noId = market.outcomes[1].id;
    await fundUser(sellerYes.id, "10");
    await fundUser(sellerNo.id, "10");
    await fundUser(buyer.id, "100");
    await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: sellerYes.id, quantity: "5" });
    await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: sellerNo.id, quantity: "5" });

    await placeOrderAndMatch({
      marketId: market.id,
      userId: sellerYes.id,
      outcomeId: yesId,
      side: "SELL",
      price: "0.62",
      size: "4",
    });
    await placeOrderAndMatch({
      marketId: market.id,
      userId: sellerNo.id,
      outcomeId: noId,
      side: "SELL",
      price: "0.38",
      size: "4",
    });

    await placeOrderAndMatch({
      marketId: market.id,
      userId: buyer.id,
      outcomeId: yesId,
      side: "BUY",
      price: "0.62",
      size: "2",
    });

    const bestBidYes = await getBest(market.id, yesId, "BUY");
    const bestBidNo = await getBest(market.id, noId, "BUY");
    const bestAskYes = await getBest(market.id, yesId, "SELL");
    const bestAskNo = await getBest(market.id, noId, "SELL");

    expect(bestBidYes === null || bestBidNo === null || bestBidYes + bestBidNo <= 1).toBe(true);
    expect(bestAskYes === null || bestAskNo === null || bestAskYes + bestAskNo >= 1).toBe(true);
  });
});
