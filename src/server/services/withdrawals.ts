import { Prisma, type UserBalance, type WithdrawalRequest, type WithdrawalRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { LedgerServiceError } from "@/server/services/ledger";

const USDC_DECIMALS = 6;

const toUsdcDecimal = (value: Prisma.Decimal.Value, fieldName: string): Prisma.Decimal => {
  let decimal: Prisma.Decimal;
  try {
    decimal = new Prisma.Decimal(value);
  } catch {
    throw new LedgerServiceError(`Invalid ${fieldName}.`, 400);
  }
  if (!decimal.isFinite() || decimal.lte(0)) {
    throw new LedgerServiceError(`${fieldName} must be greater than zero.`, 400);
  }
  if ((decimal.decimalPlaces() ?? 0) > USDC_DECIMALS) {
    throw new LedgerServiceError(`${fieldName} supports up to ${USDC_DECIMALS} decimals.`, 400);
  }
  return decimal.toDecimalPlaces(USDC_DECIMALS);
};

const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

const normalizeAddress = (address: string) => address.trim().toLowerCase();

const ensureBalanceRowLocked = async (
  tx: Prisma.TransactionClient,
  userId: string
): Promise<UserBalance> => {
  await tx.userBalance.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const rows = await tx.$queryRaw<UserBalance[]>`
    SELECT *
    FROM "UserBalance"
    WHERE "userId" = ${userId}
    FOR UPDATE
  `;
  const balance = rows[0];
  if (!balance) {
    throw new LedgerServiceError("User balance row lock failed.", 500);
  }
  return balance;
};

const startOfDayUtc = (now: Date) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

const endOfDayUtc = (now: Date) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));

const guardedStatuses: WithdrawalRequestStatus[] = ["PENDING", "COMPLETED"];

export async function requestWithdrawal(params: {
  userId: string;
  amount: Prisma.Decimal.Value;
  destinationAddress: string;
  withdrawalRequestId?: string;
}): Promise<{ created: boolean; request: WithdrawalRequest; balance: UserBalance }> {
  console.info("[withdrawals] request received", {
    userId: params.userId,
    withdrawalRequestId: params.withdrawalRequestId ?? null,
  });
  const amount = toUsdcDecimal(params.amount, "amount");
  if (!EVM_ADDRESS_REGEX.test(params.destinationAddress.trim())) {
    throw new LedgerServiceError("Invalid destination address.", 400);
  }
  if (amount.lt(new Prisma.Decimal(config.withdrawalMinUSDC))) {
    throw new LedgerServiceError(
      `Minimum withdrawal is ${new Prisma.Decimal(config.withdrawalMinUSDC).toFixed(2)}.`,
      400
    );
  }

  const destinationAddress = normalizeAddress(params.destinationAddress);
  const withdrawalRequestId = params.withdrawalRequestId?.trim() || crypto.randomUUID();
  const idempotencyKey = `withdrawal-request:${withdrawalRequestId}`;

  return prisma.$transaction(async (tx) => {
    const existingRequest = await tx.withdrawalRequest.findUnique({
      where: { id: withdrawalRequestId },
    });
    if (existingRequest) {
      const sameAddress = normalizeAddress(existingRequest.destinationAddress ?? "") === destinationAddress;
      if (
        existingRequest.userId !== params.userId ||
        !existingRequest.amountUSDC.eq(amount) ||
        !sameAddress
      ) {
        throw new LedgerServiceError("Withdrawal request id already used with different payload.", 409);
      }
      const current = await ensureBalanceRowLocked(tx, params.userId);
      return { created: false, request: existingRequest, balance: current };
    }

    const now = new Date();
    const dayStart = startOfDayUtc(now);
    const dayEnd = endOfDayUtc(now);
    const current = await ensureBalanceRowLocked(tx, params.userId);

    const pendingCount = await tx.withdrawalRequest.count({
      where: { userId: params.userId, status: "PENDING" },
    });
    if (pendingCount >= config.withdrawalMaxPendingPerUser) {
      throw new LedgerServiceError("Too many pending withdrawal requests.", 429);
    }

    const [userDailyAgg, globalDailyAgg] = await Promise.all([
      tx.withdrawalRequest.aggregate({
        where: {
          userId: params.userId,
          requestedAt: { gte: dayStart, lt: dayEnd },
          status: { in: guardedStatuses },
        },
        _sum: { amountUSDC: true },
      }),
      tx.withdrawalRequest.aggregate({
        where: {
          requestedAt: { gte: dayStart, lt: dayEnd },
          status: { in: guardedStatuses },
        },
        _sum: { amountUSDC: true },
      }),
    ]);

    const userToday = userDailyAgg._sum.amountUSDC ?? new Prisma.Decimal(0);
    const globalToday = globalDailyAgg._sum.amountUSDC ?? new Prisma.Decimal(0);
    const userLimit = new Prisma.Decimal(config.withdrawalUserDailyLimitUSDC);
    const globalLimit = new Prisma.Decimal(config.withdrawalGlobalDailyLimitUSDC);

    if (userToday.add(amount).gt(userLimit)) {
      throw new LedgerServiceError("Per-user daily withdrawal limit exceeded.", 429);
    }
    if (globalToday.add(amount).gt(globalLimit)) {
      throw new LedgerServiceError("Global daily withdrawal limit exceeded.", 429);
    }
    if (current.availableUSDC.lt(amount)) {
      throw new LedgerServiceError("Insufficient available USDC.", 409);
    }

    const request = await tx.withdrawalRequest.create({
      data: {
        id: withdrawalRequestId,
        userId: params.userId,
        amountUSDC: amount,
        destinationAddress,
        status: "PENDING",
      },
    });

    await tx.ledgerEntry.create({
      data: {
        userId: params.userId,
        reason: "WITHDRAWAL_REQUEST",
        operation: "WITHDRAWAL_REQUEST",
        idempotencyKey,
        referenceType: "WithdrawalRequest",
        referenceId: request.id,
        deltaAvailableUSDC: amount.neg(),
        deltaLockedUSDC: amount,
        amountDelta: new Prisma.Decimal(0),
      },
    });

    const balance = await tx.userBalance.update({
      where: { userId: params.userId },
      data: {
        version: { increment: 1 },
        availableUSDC: { decrement: amount },
        lockedUSDC: { increment: amount },
      },
    });

    console.info("[withdrawals] request locked", {
      withdrawalRequestId: request.id,
      userId: params.userId,
      amountUSDC: request.amountUSDC.toString(),
      status: request.status,
    });
    return { created: true, request, balance };
  });
}

export async function completeWithdrawalByAdmin(params: {
  withdrawalRequestId: string;
  txHash: string;
  adminUserId: string;
  notes?: string | null;
}): Promise<{ completed: boolean; request: WithdrawalRequest; balance: UserBalance }> {
  console.info("[withdrawals] completion requested", {
    withdrawalRequestId: params.withdrawalRequestId,
    adminUserId: params.adminUserId,
  });
  const withdrawalRequestId = params.withdrawalRequestId.trim();
  const txHash = params.txHash.trim();
  if (!withdrawalRequestId) {
    throw new LedgerServiceError("withdrawalRequestId is required.", 400);
  }
  if (!TX_HASH_REGEX.test(txHash)) {
    throw new LedgerServiceError("Invalid txHash.", 400);
  }
  const completionKey = `withdrawal-complete:${withdrawalRequestId}`;

  return prisma.$transaction(async (tx) => {
    const conflictingCompletion = await tx.withdrawalRequest.findFirst({
      where: { completedTxHash: txHash },
    });
    if (conflictingCompletion && conflictingCompletion.id !== withdrawalRequestId) {
      throw new LedgerServiceError("Withdrawal txHash already used by another request.", 409);
    }

    const requestRows = await tx.$queryRaw<WithdrawalRequest[]>`
      SELECT *
      FROM "WithdrawalRequest"
      WHERE "id" = ${withdrawalRequestId}
      FOR UPDATE
    `;
    const request = requestRows[0];
    if (!request) {
      throw new LedgerServiceError("Withdrawal request not found.", 404);
    }

    const balance = await ensureBalanceRowLocked(tx, request.userId);
    if (request.status === "COMPLETED") {
      if (request.completedTxHash === txHash) {
        return { completed: false, request, balance };
      }
      throw new LedgerServiceError("Withdrawal request already completed with another txHash.", 409);
    }
    if (request.status !== "PENDING") {
      throw new LedgerServiceError("Withdrawal request is not pending.", 409);
    }
    if (balance.lockedUSDC.lt(request.amountUSDC)) {
      throw new LedgerServiceError("Insufficient locked USDC for withdrawal completion.", 409);
    }

    const updatedRequest = await tx.withdrawalRequest.update({
      where: { id: request.id },
      data: {
        status: "COMPLETED",
        completedTxHash: txHash,
        completedAt: new Date(),
        adminNotes: params.notes?.trim() || null,
        processedByAdminId: params.adminUserId,
      },
    });

    await tx.ledgerEntry.create({
      data: {
        userId: request.userId,
        reason: "WITHDRAWAL_COMPLETE",
        operation: "WITHDRAWAL_COMPLETE",
        idempotencyKey: completionKey,
        referenceType: "WithdrawalRequest",
        referenceId: request.id,
        txHash,
        deltaAvailableUSDC: new Prisma.Decimal(0),
        deltaLockedUSDC: request.amountUSDC.neg(),
        amountDelta: request.amountUSDC.neg(),
      },
    });

    const updatedBalance = await tx.userBalance.update({
      where: { userId: request.userId },
      data: {
        version: { increment: 1 },
        lockedUSDC: { decrement: request.amountUSDC },
      },
    });

    console.info("[withdrawals] completion applied", {
      withdrawalRequestId: updatedRequest.id,
      adminUserId: params.adminUserId,
      txHash,
      amountUSDC: updatedRequest.amountUSDC.toString(),
    });
    return { completed: true, request: updatedRequest, balance: updatedBalance };
  });
}

export async function rejectWithdrawalByAdmin(params: {
  withdrawalRequestId: string;
  adminUserId: string;
  reason?: string | null;
}): Promise<{ rejected: boolean; request: WithdrawalRequest; balance: UserBalance }> {
  console.info("[withdrawals] rejection requested", {
    withdrawalRequestId: params.withdrawalRequestId,
    adminUserId: params.adminUserId,
  });
  const withdrawalRequestId = params.withdrawalRequestId.trim();
  if (!withdrawalRequestId) {
    throw new LedgerServiceError("withdrawalRequestId is required.", 400);
  }
  const rejectKey = `withdrawal-reject:${withdrawalRequestId}`;

  return prisma.$transaction(async (tx) => {
    const requestRows = await tx.$queryRaw<WithdrawalRequest[]>`
      SELECT *
      FROM "WithdrawalRequest"
      WHERE "id" = ${withdrawalRequestId}
      FOR UPDATE
    `;
    const request = requestRows[0];
    if (!request) {
      throw new LedgerServiceError("Withdrawal request not found.", 404);
    }

    const balance = await ensureBalanceRowLocked(tx, request.userId);
    if (request.status === "REJECTED") {
      return { rejected: false, request, balance };
    }
    if (request.status !== "PENDING") {
      throw new LedgerServiceError("Withdrawal request is not pending.", 409);
    }
    if (balance.lockedUSDC.lt(request.amountUSDC)) {
      throw new LedgerServiceError("Insufficient locked USDC for withdrawal rejection.", 409);
    }

    const updatedRequest = await tx.withdrawalRequest.update({
      where: { id: request.id },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        adminNotes: params.reason?.trim() || null,
        processedByAdminId: params.adminUserId,
      },
    });

    await tx.ledgerEntry.create({
      data: {
        userId: request.userId,
        reason: "WITHDRAWAL_REJECT",
        operation: "WITHDRAWAL_REJECT",
        idempotencyKey: rejectKey,
        referenceType: "WithdrawalRequest",
        referenceId: request.id,
        deltaAvailableUSDC: request.amountUSDC,
        deltaLockedUSDC: request.amountUSDC.neg(),
        amountDelta: new Prisma.Decimal(0),
      },
    });

    const updatedBalance = await tx.userBalance.update({
      where: { userId: request.userId },
      data: {
        version: { increment: 1 },
        availableUSDC: { increment: request.amountUSDC },
        lockedUSDC: { decrement: request.amountUSDC },
      },
    });

    console.info("[withdrawals] rejection applied", {
      withdrawalRequestId: updatedRequest.id,
      adminUserId: params.adminUserId,
      amountUSDC: updatedRequest.amountUSDC.toString(),
    });
    return { rejected: true, request: updatedRequest, balance: updatedBalance };
  });
}

export async function listUserWithdrawals(userId: string) {
  return prisma.withdrawalRequest.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }],
    take: 100,
  });
}

export async function listAdminWithdrawals() {
  const [pending, recent] = await Promise.all([
    prisma.withdrawalRequest.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { email: true, username: true } } },
      orderBy: [{ requestedAt: "asc" }],
      take: 200,
    }),
    prisma.withdrawalRequest.findMany({
      where: { status: { in: ["COMPLETED", "REJECTED"] } },
      include: { user: { select: { email: true, username: true } } },
      orderBy: [{ updatedAt: "desc" }],
      take: 200,
    }),
  ]);
  return { pending, recent };
}
