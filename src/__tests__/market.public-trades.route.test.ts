import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { GET } from "@/app/api/markets/[id]/trades/route";
import { placeOrderAndMatch } from "@/server/services/matching";
import { mintCompleteSetForPublicOrderbook } from "@/server/services/orderbookCollateral";
import { resetPublicSchema } from "@/server/services/__tests__/dbTestUtils";

jest.mock("@/lib/auth", () => ({
  getUserId: jest.fn().mockResolvedValue(null),
}));

const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const createUser = async (name: string) =>
  prisma.user.create({
    data: {
      username: `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      email: `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.local`,
    },
  });

const fundUser = async (userId: string, amount: Prisma.Decimal.Value) => {
  await prisma.userBalance.upsert({
    where: { userId },
    update: { availableUSDC: dec(amount), lockedUSDC: dec(0) },
    create: { userId, availableUSDC: dec(amount), lockedUSDC: dec(0) },
  });
};

const createPublicOrderbookMarket = async () =>
  prisma.market.create({
    data: {
      title: "Public Tape Test Market",
      description: "public tape route test",
      status: "LIVE",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      kind: "ORDERBOOK",
      outcomes: {
        create: [
          { name: "YES", slug: `public-tape-yes-${Math.random()}`, displayOrder: 0, isActive: true },
          { name: "NO", slug: `public-tape-no-${Math.random()}`, displayOrder: 1, isActive: true },
        ],
      },
    },
    include: { outcomes: true },
  });

describe("public market trades route", () => {
  beforeEach(async () => {
    await resetPublicSchema();
  });

  test("one matched execution appears once and exposes no user identity fields", async () => {
    const seller = await createUser("public_tape_seller");
    const buyer = await createUser("public_tape_buyer");
    const market = await createPublicOrderbookMarket();
    const yesId = market.outcomes[0].id;

    await fundUser(seller.id, "10");
    await fundUser(buyer.id, "10");
    await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: seller.id, quantity: "2" });

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

    expect(await prisma.trade.count({ where: { marketId: market.id } })).toBe(2);
    expect(await prisma.fill.count({ where: { marketId: market.id } })).toBe(1);

    const response = await GET(
      new NextRequest(`http://localhost/api/markets/${market.id}/trades`),
      { params: Promise.resolve({ id: market.id }) }
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { trades: Array<Record<string, unknown>> };

    expect(body.trades).toHaveLength(1);
    expect(body.trades[0]).toMatchObject({
      marketId: market.id,
      outcomeId: yesId,
      outcome: "YES",
      outcomeName: "YES",
      side: "BUY",
      quantity: 1,
      shares: 1,
      price: 0.6,
      cost: 0.6,
    });
    expect(body.trades[0]).not.toHaveProperty("user");
    expect(body.trades[0]).not.toHaveProperty("userId");
    expect(body.trades[0]).not.toHaveProperty("makerUserId");
    expect(body.trades[0]).not.toHaveProperty("takerUserId");
  });
});
