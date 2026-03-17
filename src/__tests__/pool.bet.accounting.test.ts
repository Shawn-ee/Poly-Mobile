import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { POST } from "@/app/api/pool-markets/[id]/bet/route";
import { resetPublicSchema } from "@/server/services/__tests__/dbTestUtils";

const getUserId = jest.fn();

jest.mock("@/lib/auth", () => ({
  getUserId: () => getUserId(),
}));

describe("Pool bet accounting consistency", () => {
  beforeEach(async () => {
    await resetPublicSchema();
    getUserId.mockReset();
  });

  test("pool bet decrements availableUSDC and writes custody deltas in ledger", async () => {
    const user = await prisma.user.create({
      data: {
        username: `pool_bet_user_${Date.now()}`,
        email: `pool_bet_user_${Date.now()}@test.local`,
      },
    });
    getUserId.mockResolvedValue(user.id);

    await prisma.userBalance.upsert({
      where: { userId: user.id },
      update: { availableUSDC: "100.000000" },
      create: { userId: user.id, availableUSDC: "100.000000" },
    });

    const market = await prisma.market.create({
      data: {
        title: "Pool bet route accounting",
        description: "test",
        mechanism: "POOL",
        visibility: "PRIVATE",
        kind: "POOL",
        status: "LIVE",
        ownerId: user.id,
        outcomes: {
          create: [
            { name: "A", slug: `pba-${Math.random()}`, displayOrder: 0, isActive: true },
            { name: "B", slug: `pbb-${Math.random()}`, displayOrder: 1, isActive: true },
          ],
        },
        poolStakePresets: {
          create: [{ amount: "10.000000", isActive: true }],
        },
      },
      include: { outcomes: true },
    });

    const req = new NextRequest(`http://localhost/api/pool-markets/${market.id}/bet`, {
      method: "POST",
      body: JSON.stringify({
        outcomeId: market.outcomes[0].id,
        amount: 10,
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: market.id }) });
    expect(res.status).toBe(200);

    const balance = await prisma.userBalance.findUniqueOrThrow({ where: { userId: user.id } });
    expect(Number(balance.availableUSDC)).toBe(90);

    const ledger = await prisma.ledgerEntry.findFirst({
      where: {
        userId: user.id,
        reason: "POOL_BET",
        referenceId: market.id,
      },
      orderBy: { createdAt: "desc" },
    });
    expect(ledger).not.toBeNull();
    expect(ledger?.operation).toBe("POOL_BET");
    expect(Number(ledger?.deltaAvailableUSDC ?? 0)).toBe(-10);
    expect(Number(ledger?.amountDelta ?? 0)).toBe(-10);
  });
});
