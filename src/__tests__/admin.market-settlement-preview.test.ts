import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { resetPublicSchema } from "@/server/services/__tests__/dbTestUtils";
import { POST as previewSettlement } from "@/app/api/admin/markets/[id]/settlement-preview/route";

const assertAdmin = jest.fn();
const enforceSensitiveRateLimit = jest.fn();

jest.mock("@/lib/marketGuards", () => {
  const actual = jest.requireActual("@/lib/marketGuards");
  return {
    ...actual,
    assertAdmin: () => assertAdmin(),
  };
});

jest.mock("@/server/services/orderRateLimiter", () => ({
  enforceSensitiveRateLimit: (...args: unknown[]) => enforceSensitiveRateLimit(...args),
}));

const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const createUser = (label: string, isAdmin = false) =>
  prisma.user.create({
    data: {
      username: `${label}_${process.pid}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      email: `${label}_${process.pid}_${Date.now()}@test.local`,
      isAdmin,
    },
  });

const createPreviewMarket = async () => {
  const market = await prisma.market.create({
    data: {
      title: "Settlement preview market",
      description: "Preview-only settlement test market.",
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      status: "CLOSED",
      collateralUSDC: dec("3"),
      outcomes: {
        create: [
          { name: "YES", code: "YES", displayOrder: 0 },
          { name: "NO", code: "NO", displayOrder: 1 },
        ],
      },
    },
    include: { outcomes: true },
  });
  return {
    market,
    yes: market.outcomes.find((outcome) => outcome.code === "YES")!,
    no: market.outcomes.find((outcome) => outcome.code === "NO")!,
  };
};

describe("admin settlement preview", () => {
  beforeEach(async () => {
    await resetPublicSchema();
    jest.clearAllMocks();
  });

  test("blocks non-admin preview before reading market data", async () => {
    const { market, yes } = await createPreviewMarket();
    const { MarketGuardError } = jest.requireActual("@/lib/marketGuards");
    assertAdmin.mockRejectedValue(new MarketGuardError("Forbidden", 403));

    const response = await previewSettlement(
      new NextRequest(`http://localhost/api/admin/markets/${market.id}/settlement-preview`, {
        method: "POST",
        body: JSON.stringify({ winningOutcomeId: yes.id }),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ id: market.id }) },
    );

    expect(response.status).toBe(403);
    expect(enforceSensitiveRateLimit).not.toHaveBeenCalled();
  });

  test("previews orderbook settlement without mutating ledger, balances, orders, positions, or market", async () => {
    const admin = await createUser("preview_admin", true);
    const winner = await createUser("preview_winner");
    const buyer = await createUser("preview_buyer");
    const { market, yes } = await createPreviewMarket();
    assertAdmin.mockResolvedValue(admin);

    await prisma.userBalance.create({
      data: {
        userId: winner.id,
        availableUSDC: dec("4"),
        lockedUSDC: dec("0"),
      },
    });
    await prisma.userBalance.create({
      data: {
        userId: buyer.id,
        availableUSDC: dec("8.75"),
        lockedUSDC: dec("1.25"),
      },
    });
    await prisma.position.create({
      data: {
        userId: winner.id,
        marketId: market.id,
        outcomeId: yes.id,
        shares: dec("3"),
        avgCost: dec("0.42"),
      },
    });
    await prisma.order.create({
      data: {
        marketId: market.id,
        userId: buyer.id,
        outcomeId: yes.id,
        side: "BUY",
        price: dec("0.625"),
        amount: dec("2"),
        remaining: dec("2"),
        reservedNotional: dec("1.25"),
        status: "OPEN",
      },
    });

    const before = {
      market: await prisma.market.findUniqueOrThrow({ where: { id: market.id } }),
      balances: await prisma.userBalance.findMany({ orderBy: { userId: "asc" } }),
      positions: await prisma.position.findMany({ orderBy: { userId: "asc" } }),
      orders: await prisma.order.findMany({ orderBy: { userId: "asc" } }),
      ledgerCount: await prisma.ledgerEntry.count(),
    };

    const response = await previewSettlement(
      new NextRequest(`http://localhost/api/admin/markets/${market.id}/settlement-preview`, {
        method: "POST",
        body: JSON.stringify({ winningOutcomeId: yes.id }),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ id: market.id }) },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      ok: true,
      preview: {
        marketId: market.id,
        winningOutcomeId: yes.id,
        collateralUSDC: "3",
        totalWinningShares: "3",
        totalPayout: "3",
        payoutConservationPass: true,
        blockers: [],
        mutation: "none",
        openOrderCleanup: {
          openOrderCount: 1,
          buyOrderLockedUSDCToRelease: "1.25",
          sellOrderSharesToRelease: "0",
        },
      },
    });
    expect(body.preview.payouts).toEqual([
      expect.objectContaining({
        userId: winner.id,
        outcomeId: yes.id,
        shares: "3",
        amountPreview: "3",
      }),
    ]);

    expect(await prisma.ledgerEntry.count()).toBe(before.ledgerCount);
    expect(await prisma.market.findUniqueOrThrow({ where: { id: market.id } })).toMatchObject({
      status: before.market.status,
      resolvedOutcomeId: before.market.resolvedOutcomeId,
      collateralUSDC: before.market.collateralUSDC,
    });
    expect(await prisma.userBalance.findMany({ orderBy: { userId: "asc" } })).toEqual(before.balances);
    expect(await prisma.position.findMany({ orderBy: { userId: "asc" } })).toEqual(before.positions);
    expect(await prisma.order.findMany({ orderBy: { userId: "asc" } })).toEqual(before.orders);
    expect(enforceSensitiveRateLimit).toHaveBeenCalledWith(admin.id, "admin_market_resolve");
  });
});
