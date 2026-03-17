import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { applyDeposit } from "@/server/services/ledger";
import {
  completeWithdrawalByAdmin,
  rejectWithdrawalByAdmin,
  requestWithdrawal,
} from "@/server/services/withdrawals";
import { createDeterministicUser, resetPublicSchema } from "./dbTestUtils";

const decToNum = (value: Prisma.Decimal) => Number(value.toFixed(6));

const createAdmin = async () => {
  return prisma.user.create({
    data: {
      username: `admin_${process.pid}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      email: `admin_${process.pid}_${Date.now()}@test.local`,
      isAdmin: true,
    },
  });
};

const seedBalance = async (userId: string, amount: string) => {
  await applyDeposit({
    eventKey: `phase8:deposit:${userId}:${amount}:${Date.now()}`,
    userId,
    amount,
    chainId: 8453,
    txHash: `0x${"a".repeat(62)}${Math.floor(Math.random() * 90 + 10).toString(16).padStart(2, "0")}`,
    logIndex: 1,
    token: "USDC",
  });
};

describe("Phase 8 withdrawals", () => {
  beforeEach(async () => {
    await resetPublicSchema();
  });

  test("1) successful withdrawal request locks funds", async () => {
    const user = await createDeterministicUser();
    await seedBalance(user.id, "100");

    const result = await requestWithdrawal({
      userId: user.id,
      amount: "25",
      destinationAddress: "0x1111111111111111111111111111111111111111",
    });

    expect(result.request.status).toBe("PENDING");
    expect(decToNum(result.balance.availableUSDC)).toBe(75);
    expect(decToNum(result.balance.lockedUSDC)).toBe(25);
  });

  test("2) insufficient availableUSDC is rejected", async () => {
    const user = await createDeterministicUser();
    await seedBalance(user.id, "10");

    await expect(
      requestWithdrawal({
        userId: user.id,
        amount: "11",
        destinationAddress: "0x1111111111111111111111111111111111111111",
      })
    ).rejects.toThrow("Insufficient available USDC.");
  });

  test("3) invalid destination address is rejected", async () => {
    const user = await createDeterministicUser();
    await seedBalance(user.id, "100");

    await expect(
      requestWithdrawal({
        userId: user.id,
        amount: "25",
        destinationAddress: "not-an-address",
      })
    ).rejects.toThrow("Invalid destination address.");
  });

  test("4) per-user daily limit enforced", async () => {
    const user = await createDeterministicUser();
    await seedBalance(user.id, "7000");

    await requestWithdrawal({
      userId: user.id,
      amount: "3000",
      destinationAddress: "0x1111111111111111111111111111111111111111",
    });

    await expect(
      requestWithdrawal({
        userId: user.id,
        amount: "3000",
        destinationAddress: "0x1111111111111111111111111111111111111111",
      })
    ).rejects.toThrow("Per-user daily withdrawal limit exceeded.");
  });

  test("5) global daily limit enforced", async () => {
    const users = await Promise.all(Array.from({ length: 11 }, () => createDeterministicUser()));
    await Promise.all(users.map((user) => seedBalance(user.id, "6000")));

    for (let i = 0; i < 10; i += 1) {
      await requestWithdrawal({
        userId: users[i].id,
        amount: "5000",
        destinationAddress: `0x${String(i + 1).padStart(40, "1")}`,
      });
    }

    await expect(
      requestWithdrawal({
        userId: users[10].id,
        amount: "5",
        destinationAddress: "0x2222222222222222222222222222222222222222",
      })
    ).rejects.toThrow("Global daily withdrawal limit exceeded.");
  });

  test("6) completion stores txHash and consumes locked funds", async () => {
    const user = await createDeterministicUser();
    const admin = await createAdmin();
    await seedBalance(user.id, "100");
    const request = await requestWithdrawal({
      userId: user.id,
      amount: "25",
      destinationAddress: "0x1111111111111111111111111111111111111111",
    });

    const done = await completeWithdrawalByAdmin({
      adminUserId: admin.id,
      withdrawalRequestId: request.request.id,
      txHash: `0x${"b".repeat(64)}`,
      notes: "manual payout sent",
    });

    expect(done.request.status).toBe("COMPLETED");
    expect(done.request.completedTxHash).toBe(`0x${"b".repeat(64)}`);
    expect(decToNum(done.balance.availableUSDC)).toBe(75);
    expect(decToNum(done.balance.lockedUSDC)).toBe(0);
  });

  test("7) rejection returns locked funds to available", async () => {
    const user = await createDeterministicUser();
    const admin = await createAdmin();
    await seedBalance(user.id, "100");
    const request = await requestWithdrawal({
      userId: user.id,
      amount: "20",
      destinationAddress: "0x1111111111111111111111111111111111111111",
    });

    const rejected = await rejectWithdrawalByAdmin({
      adminUserId: admin.id,
      withdrawalRequestId: request.request.id,
      reason: "compliance hold",
    });

    expect(rejected.request.status).toBe("REJECTED");
    expect(decToNum(rejected.balance.availableUSDC)).toBe(100);
    expect(decToNum(rejected.balance.lockedUSDC)).toBe(0);
  });

  test("8) double completion rejected", async () => {
    const user = await createDeterministicUser();
    const admin = await createAdmin();
    await seedBalance(user.id, "100");
    const request = await requestWithdrawal({
      userId: user.id,
      amount: "30",
      destinationAddress: "0x1111111111111111111111111111111111111111",
    });

    await completeWithdrawalByAdmin({
      adminUserId: admin.id,
      withdrawalRequestId: request.request.id,
      txHash: `0x${"c".repeat(64)}`,
    });

    await expect(
      completeWithdrawalByAdmin({
        adminUserId: admin.id,
        withdrawalRequestId: request.request.id,
        txHash: `0x${"d".repeat(64)}`,
      })
    ).rejects.toThrow("already completed");
  });

  test("9) complete-after-reject rejected", async () => {
    const user = await createDeterministicUser();
    const admin = await createAdmin();
    await seedBalance(user.id, "100");
    const request = await requestWithdrawal({
      userId: user.id,
      amount: "30",
      destinationAddress: "0x1111111111111111111111111111111111111111",
    });
    await rejectWithdrawalByAdmin({
      adminUserId: admin.id,
      withdrawalRequestId: request.request.id,
      reason: "manual reject",
    });

    await expect(
      completeWithdrawalByAdmin({
        adminUserId: admin.id,
        withdrawalRequestId: request.request.id,
        txHash: `0x${"e".repeat(64)}`,
      })
    ).rejects.toThrow("not pending");
  });

  test("10) reject-after-complete rejected", async () => {
    const user = await createDeterministicUser();
    const admin = await createAdmin();
    await seedBalance(user.id, "100");
    const request = await requestWithdrawal({
      userId: user.id,
      amount: "30",
      destinationAddress: "0x1111111111111111111111111111111111111111",
    });
    await completeWithdrawalByAdmin({
      adminUserId: admin.id,
      withdrawalRequestId: request.request.id,
      txHash: `0x${"f".repeat(64)}`,
    });

    await expect(
      rejectWithdrawalByAdmin({
        adminUserId: admin.id,
        withdrawalRequestId: request.request.id,
        reason: "too late",
      })
    ).rejects.toThrow("not pending");
  });

  test("11) ledger entries are written for request/complete/reject", async () => {
    const userA = await createDeterministicUser();
    const userB = await createDeterministicUser();
    const admin = await createAdmin();
    await seedBalance(userA.id, "100");
    await seedBalance(userB.id, "100");

    const reqA = await requestWithdrawal({
      userId: userA.id,
      amount: "10",
      destinationAddress: "0x1111111111111111111111111111111111111111",
    });
    await completeWithdrawalByAdmin({
      adminUserId: admin.id,
      withdrawalRequestId: reqA.request.id,
      txHash: `0x${"1".repeat(64)}`,
    });

    const reqB = await requestWithdrawal({
      userId: userB.id,
      amount: "12",
      destinationAddress: "0x2222222222222222222222222222222222222222",
    });
    await rejectWithdrawalByAdmin({
      adminUserId: admin.id,
      withdrawalRequestId: reqB.request.id,
      reason: "reject test",
    });

    const reasonsA = await prisma.ledgerEntry.findMany({
      where: { userId: userA.id, referenceId: reqA.request.id },
      select: { reason: true },
    });
    const reasonsB = await prisma.ledgerEntry.findMany({
      where: { userId: userB.id, referenceId: reqB.request.id },
      select: { reason: true },
    });
    expect(reasonsA.map((x) => x.reason).sort()).toEqual([
      "WITHDRAWAL_COMPLETE",
      "WITHDRAWAL_REQUEST",
    ]);
    expect(reasonsB.map((x) => x.reason).sort()).toEqual([
      "WITHDRAWAL_REJECT",
      "WITHDRAWAL_REQUEST",
    ]);
  });
});
