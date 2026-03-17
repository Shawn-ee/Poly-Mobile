import { prisma } from "@/lib/db";
import { getPublicBinaryInvariantState, mintCompleteSetForPublicOrderbook } from "@/server/services/orderbookCollateral";
import { resetPublicSchema } from "./dbTestUtils";

const createUser = async (name: string) =>
  prisma.user.create({
    data: {
      username: `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      email: `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@test.local`,
    },
  });

const fundUser = async (userId: string, amount: string) => {
  await prisma.userBalance.upsert({
    where: { userId },
    update: { availableUSDC: amount, lockedUSDC: "0" },
    create: { userId, availableUSDC: amount, lockedUSDC: "0" },
  });
};

const createBinaryMarket = async () => {
  return prisma.market.create({
    data: {
      title: "Invariant monitor market",
      description: "test",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      status: "LIVE",
      kind: "ORDERBOOK",
      outcomes: {
        create: [
          { name: "YES", slug: `im-yes-${Math.random()}`, displayOrder: 0, isActive: true },
          { name: "NO", slug: `im-no-${Math.random()}`, displayOrder: 1, isActive: true },
        ],
      },
    },
    include: { outcomes: true },
  });
};

describe("orderbook invariant monitor service", () => {
  beforeEach(async () => {
    await resetPublicSchema();
  });

  test("binary market returns expected fields for empty book", async () => {
    const market = await createBinaryMarket();
    const state = await getPublicBinaryInvariantState(market.id);

    expect(state.marketId).toBe(market.id);
    expect(state.bestBidOutcome1).toBeNull();
    expect(state.bestBidOutcome2).toBeNull();
    expect(state.bestAskOutcome1).toBeNull();
    expect(state.bestAskOutcome2).toBeNull();
    expect(state.bidSum).toBeNull();
    expect(state.askSum).toBeNull();
    expect(state.bidInvariantPass).toBe(true);
    expect(state.askInvariantPass).toBe(true);
    expect(state.outstandingSharesOutcome1).toBe("0");
    expect(state.outstandingSharesOutcome2).toBe("0");
  });

  test("one-sided book is handled with nulls and conservative pass", async () => {
    const user = await createUser("one_sided");
    const market = await createBinaryMarket();
    await fundUser(user.id, "10");
    await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: user.id, quantity: "2" });

    await prisma.order.create({
      data: {
        marketId: market.id,
        userId: user.id,
        outcomeId: market.outcomes[0].id,
        side: "BUY",
        price: "0.60",
        amount: "1",
        remaining: "1",
        reservedNotional: "0.60",
        status: "OPEN",
      },
    });

    const state = await getPublicBinaryInvariantState(market.id);
    expect(state.bestBidOutcome1).toBe("0.6");
    expect(state.bestBidOutcome2).toBeNull();
    expect(state.bidSum).toBeNull();
    expect(state.bidInvariantPass).toBe(true);
  });

  test("non-binary market returns clear error", async () => {
    const market = await prisma.market.create({
      data: {
        title: "non-binary",
        description: "test",
        mechanism: "ORDERBOOK",
        visibility: "PUBLIC",
        status: "LIVE",
        kind: "ORDERBOOK",
        outcomes: {
          create: [
            { name: "A", slug: `nba-${Math.random()}`, displayOrder: 0, isActive: true },
            { name: "B", slug: `nbb-${Math.random()}`, displayOrder: 1, isActive: true },
            { name: "C", slug: `nbc-${Math.random()}`, displayOrder: 2, isActive: true },
          ],
        },
      },
    });

    await expect(getPublicBinaryInvariantState(market.id)).rejects.toThrow(
      "binary markets only"
    );
  });

  test("collateral/outstanding summary is correct", async () => {
    const user = await createUser("summary_user");
    const market = await createBinaryMarket();
    await fundUser(user.id, "20");
    await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: user.id, quantity: "5" });

    const state = await getPublicBinaryInvariantState(market.id);
    expect(state.marketCollateralUSDC).toBe("5");
    expect(state.outstandingSharesOutcome1).toBe("5");
    expect(state.outstandingSharesOutcome2).toBe("5");
    expect(state.outstandingSharesEqual).toBe(true);
    expect(state.collateralMatchesOutstanding).toBe(true);
  });
});
