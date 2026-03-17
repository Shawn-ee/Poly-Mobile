import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  reconcileBalances,
  reconcileWithdrawals,
} from "@/server/services/opsReconciliation";
import { resetPublicSchema } from "./dbTestUtils";

describe("ops reconciliation helpers", () => {
  beforeEach(async () => {
    await resetPublicSchema();
  });

  test("reconcileBalances detects ledger/userBalance mismatch", async () => {
    const user = await prisma.user.create({
      data: {
        username: `recon_user_${Date.now()}`,
        email: `recon_${Date.now()}@test.local`,
      },
    });
    await prisma.ledgerEntry.create({
      data: {
        userId: user.id,
        reason: "DEPOSIT",
        operation: "DEPOSIT",
        amountDelta: new Prisma.Decimal("10"),
        deltaAvailableUSDC: new Prisma.Decimal("10"),
        deltaLockedUSDC: new Prisma.Decimal("0"),
        idempotencyKey: `recon-bal-${user.id}`,
      },
    });
    await prisma.userBalance.create({
      data: {
        userId: user.id,
        availableUSDC: new Prisma.Decimal("9"),
        lockedUSDC: new Prisma.Decimal("0"),
      },
    });

    const result = await reconcileBalances();
    expect(result.pass).toBe(false);
    expect(result.mismatches.length).toBeGreaterThan(0);
  });

  test("reconcileWithdrawals detects invalid pending state", async () => {
    const user = await prisma.user.create({
      data: {
        username: `recon_w_user_${Date.now()}`,
        email: `recon_w_${Date.now()}@test.local`,
      },
    });
    await prisma.userBalance.create({
      data: {
        userId: user.id,
        availableUSDC: new Prisma.Decimal("100"),
        lockedUSDC: new Prisma.Decimal("20"),
      },
    });
    await prisma.withdrawalRequest.create({
      data: {
        id: `w_${Date.now()}`,
        userId: user.id,
        amountUSDC: new Prisma.Decimal("10"),
        status: "PENDING",
        completedTxHash: "0xbad",
      },
    });

    const result = await reconcileWithdrawals();
    expect(result.pass).toBe(false);
    expect(result.mismatches.length).toBeGreaterThan(0);
  });
});

