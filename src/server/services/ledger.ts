import {
  Prisma,
  type LedgerOperation,
  type LedgerReason,
  type UserBalance,
  type WithdrawalRequest,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { CUSTODY_LEDGER_OPERATIONS } from "@/server/services/ledgerCustodyOps";

const USDC_DECIMALS = 6;
type TxClient = Prisma.TransactionClient;

type LedgerTestHookStage =
  | "applyDeposit.afterLedgerBeforeBalance"
  | "lockFundsForOrder.afterLedgerBeforeBalance"
  | "unlockFundsForCancel.afterLedgerBeforeBalance"
  | "applyFill.afterLedgerBeforeBalance"
  | "createWithdrawalRequest.afterLedgerBeforeBalance"
  | "completeWithdrawal.afterLedgerBeforeBalance";

let ledgerTestHook: ((stage: LedgerTestHookStage) => void | Promise<void>) | null = null;

const runLedgerTestHook = async (stage: LedgerTestHookStage) => {
  if (process.env.NODE_ENV !== "test" || !ledgerTestHook) {
    return;
  }
  await ledgerTestHook(stage);
};

const setLedgerTestHookInternal = (
  hook: ((stage: LedgerTestHookStage) => void | Promise<void>) | null
) => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      "__setLedgerTestHook is test-only and cannot be used in non-test environments"
    );
  }
  ledgerTestHook = hook;
};

export const __setLedgerTestHook =
  process.env.NODE_ENV === "test" ? setLedgerTestHookInternal : undefined;

export class LedgerServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "LedgerServiceError";
    this.status = status;
  }
}

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

const ensureBalanceRowLocked = async (tx: TxClient, userId: string): Promise<UserBalance> => {
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

const incrementVersion = { version: { increment: 1 } } as const;

const createLedgerEntry = async (
  tx: TxClient,
  data: {
    userId: string;
    reason: LedgerReason;
    operation: LedgerOperation;
    idempotencyKey?: string;
    referenceType?: string;
    referenceId?: string;
    chainId?: number;
    txHash?: string;
    logIndex?: number;
    tokenAddress?: string;
    deltaAvailableUSDC?: Prisma.Decimal;
    deltaLockedUSDC?: Prisma.Decimal;
    amountDelta?: Prisma.Decimal;
  }
) => {
  return tx.ledgerEntry.create({
    data: {
      userId: data.userId,
      reason: data.reason,
      operation: data.operation,
      idempotencyKey: data.idempotencyKey,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      chainId: data.chainId,
      txHash: data.txHash,
      logIndex: data.logIndex,
      tokenAddress: data.tokenAddress,
      deltaAvailableUSDC: data.deltaAvailableUSDC,
      deltaLockedUSDC: data.deltaLockedUSDC,
      amountDelta: data.amountDelta ?? new Prisma.Decimal(0),
    },
  });
};

export async function getOrCreateUserBalance(userId: string): Promise<UserBalance> {
  return prisma.userBalance.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function applyDeposit(params: {
  eventKey: string;
  userId: string;
  amount: Prisma.Decimal.Value;
  chainId: number;
  txHash: string;
  logIndex: number;
  token: string;
  referenceType?: string;
  referenceId?: string;
}): Promise<{ applied: boolean; balance: UserBalance }> {
  const amount = toUsdcDecimal(params.amount, "amount");

  try {
    return await prisma.$transaction(async (tx) => {
      await ensureBalanceRowLocked(tx, params.userId);

      const existing = await tx.ledgerEntry.findUnique({
        where: { idempotencyKey: params.eventKey },
      });
      if (existing) {
        const balance = await tx.userBalance.findUniqueOrThrow({ where: { userId: params.userId } });
        return { applied: false, balance };
      }

      await createLedgerEntry(tx, {
        userId: params.userId,
        reason: "DEPOSIT",
        operation: "DEPOSIT",
        idempotencyKey: params.eventKey,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        chainId: params.chainId,
        txHash: params.txHash,
        logIndex: params.logIndex,
        tokenAddress: params.token,
        deltaAvailableUSDC: amount,
        deltaLockedUSDC: new Prisma.Decimal(0),
        amountDelta: amount,
      });
      await runLedgerTestHook("applyDeposit.afterLedgerBeforeBalance");

      const balance = await tx.userBalance.update({
        where: { userId: params.userId },
        data: {
          ...incrementVersion,
          availableUSDC: { increment: amount },
        },
      });
      return { applied: true, balance };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const balance = await getOrCreateUserBalance(params.userId);
      return { applied: false, balance };
    }
    throw error;
  }
}

export async function lockFundsForOrder(params: {
  orderId: string;
  userId: string;
  amount: Prisma.Decimal.Value;
}): Promise<{ applied: boolean; balance: UserBalance }> {
  const amount = toUsdcDecimal(params.amount, "amount");
  const idempotencyKey = `lock:${params.orderId}`;

  return prisma.$transaction(async (tx) => {
    const balance = await ensureBalanceRowLocked(tx, params.userId);
    const existing = await tx.ledgerEntry.findUnique({ where: { idempotencyKey } });
    if (existing) {
      const current = await tx.userBalance.findUniqueOrThrow({ where: { userId: params.userId } });
      return { applied: false, balance: current };
    }
    if (balance.availableUSDC.lt(amount)) {
      throw new LedgerServiceError("Insufficient available USDC.", 409);
    }

    await createLedgerEntry(tx, {
      userId: params.userId,
      reason: "LOCK",
      operation: "LOCK",
      idempotencyKey,
      referenceType: "Order",
      referenceId: params.orderId,
      deltaAvailableUSDC: amount.neg(),
      deltaLockedUSDC: amount,
      amountDelta: new Prisma.Decimal(0),
    });
    await runLedgerTestHook("lockFundsForOrder.afterLedgerBeforeBalance");

    const updated = await tx.userBalance.update({
      where: { userId: params.userId },
      data: {
        ...incrementVersion,
        availableUSDC: { decrement: amount },
        lockedUSDC: { increment: amount },
      },
    });
    return { applied: true, balance: updated };
  });
}

export async function unlockFundsForCancel(params: {
  orderId: string;
  userId: string;
  amount: Prisma.Decimal.Value;
}): Promise<{ applied: boolean; balance: UserBalance }> {
  const amount = toUsdcDecimal(params.amount, "amount");
  const idempotencyKey = `unlock:${params.orderId}`;

  return prisma.$transaction(async (tx) => {
    const balance = await ensureBalanceRowLocked(tx, params.userId);
    const existing = await tx.ledgerEntry.findUnique({ where: { idempotencyKey } });
    if (existing) {
      const current = await tx.userBalance.findUniqueOrThrow({ where: { userId: params.userId } });
      return { applied: false, balance: current };
    }
    if (balance.lockedUSDC.lt(amount)) {
      throw new LedgerServiceError("Insufficient locked USDC.", 409);
    }

    await createLedgerEntry(tx, {
      userId: params.userId,
      reason: "UNLOCK",
      operation: "UNLOCK",
      idempotencyKey,
      referenceType: "Order",
      referenceId: params.orderId,
      deltaAvailableUSDC: amount,
      deltaLockedUSDC: amount.neg(),
      amountDelta: new Prisma.Decimal(0),
    });
    await runLedgerTestHook("unlockFundsForCancel.afterLedgerBeforeBalance");

    const updated = await tx.userBalance.update({
      where: { userId: params.userId },
      data: {
        ...incrementVersion,
        availableUSDC: { increment: amount },
        lockedUSDC: { decrement: amount },
      },
    });
    return { applied: true, balance: updated };
  });
}

export async function applyFill(params: {
  fillId: string;
  orderId: string;
  userId: string;
  costUSDC: Prisma.Decimal.Value;
}): Promise<{ applied: boolean; balance: UserBalance }> {
  const costUSDC = toUsdcDecimal(params.costUSDC, "costUSDC");
  const idempotencyKey = `fill:${params.fillId}`;

  try {
    return await prisma.$transaction(async (tx) => {
      const balance = await ensureBalanceRowLocked(tx, params.userId);
      const existing = await tx.ledgerEntry.findUnique({ where: { idempotencyKey } });
      if (existing) {
        const current = await tx.userBalance.findUniqueOrThrow({ where: { userId: params.userId } });
        return { applied: false, balance: current };
      }
      if (balance.lockedUSDC.lt(costUSDC)) {
        throw new LedgerServiceError("Insufficient locked USDC for fill.", 409);
      }

      await createLedgerEntry(tx, {
        userId: params.userId,
        reason: "FILL",
        operation: "FILL",
        idempotencyKey,
        referenceType: "OrderFill",
        referenceId: params.fillId,
        deltaAvailableUSDC: new Prisma.Decimal(0),
        deltaLockedUSDC: costUSDC.neg(),
        amountDelta: costUSDC.neg(),
      });
      await runLedgerTestHook("applyFill.afterLedgerBeforeBalance");

      const updated = await tx.userBalance.update({
        where: { userId: params.userId },
        data: {
          ...incrementVersion,
          lockedUSDC: { decrement: costUSDC },
        },
      });
      return { applied: true, balance: updated };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const balance = await getOrCreateUserBalance(params.userId);
      return { applied: false, balance };
    }
    throw error;
  }
}

export async function createWithdrawalRequest(params: {
  withdrawalRequestId: string;
  userId: string;
  amount: Prisma.Decimal.Value;
}): Promise<{ created: boolean; request: WithdrawalRequest; balance: UserBalance }> {
  const amount = toUsdcDecimal(params.amount, "amount");
  const idempotencyKey = `withdrawal-request:${params.withdrawalRequestId}`;

  return prisma.$transaction(async (tx) => {
    const existingRequest = await tx.withdrawalRequest.findUnique({
      where: { id: params.withdrawalRequestId },
    });
    if (existingRequest) {
      if (
        existingRequest.userId !== params.userId ||
        !existingRequest.amountUSDC.eq(amount)
      ) {
        throw new LedgerServiceError("Withdrawal request id already used with different payload.", 409);
      }
      const current = await ensureBalanceRowLocked(tx, params.userId);
      return { created: false, request: existingRequest, balance: current };
    }

    const current = await ensureBalanceRowLocked(tx, params.userId);
    if (current.availableUSDC.lt(amount)) {
      throw new LedgerServiceError("Insufficient available USDC.", 409);
    }

    const request = await tx.withdrawalRequest.create({
      data: {
        id: params.withdrawalRequestId,
        userId: params.userId,
        amountUSDC: amount,
        status: "PENDING",
      },
    });

    await createLedgerEntry(tx, {
      userId: params.userId,
      reason: "WITHDRAWAL_REQUEST",
      operation: "WITHDRAWAL_REQUEST",
      idempotencyKey,
      referenceType: "WithdrawalRequest",
      referenceId: request.id,
      deltaAvailableUSDC: amount.neg(),
      deltaLockedUSDC: amount,
      amountDelta: new Prisma.Decimal(0),
    });
    await runLedgerTestHook("createWithdrawalRequest.afterLedgerBeforeBalance");

    const balance = await tx.userBalance.update({
      where: { userId: params.userId },
      data: {
        ...incrementVersion,
        availableUSDC: { decrement: amount },
        lockedUSDC: { increment: amount },
      },
    });

    return { created: true, request, balance };
  });
}

export async function completeWithdrawal(params: {
  withdrawalRequestId: string;
  txHash: string;
}): Promise<{ completed: boolean; request: WithdrawalRequest; balance: UserBalance }> {
  const completionKey = `withdrawal-complete:${params.txHash.toLowerCase()}`;

  return prisma.$transaction(async (tx) => {
    const conflictingCompletion = await tx.withdrawalRequest.findFirst({
      where: { completedTxHash: params.txHash },
    });
    if (conflictingCompletion && conflictingCompletion.id !== params.withdrawalRequestId) {
      throw new LedgerServiceError("Withdrawal txHash already used by another request.", 409);
    }

    const requestRows = await tx.$queryRaw<WithdrawalRequest[]>`
      SELECT *
      FROM "WithdrawalRequest"
      WHERE "id" = ${params.withdrawalRequestId}
      FOR UPDATE
    `;
    const request = requestRows[0];
    if (!request) {
      throw new LedgerServiceError("Withdrawal request not found.", 404);
    }

    const balance = await ensureBalanceRowLocked(tx, request.userId);
    if (request.status === "COMPLETED") {
      if (request.completedTxHash === params.txHash) {
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
        completedTxHash: params.txHash,
        completedAt: new Date(),
      },
    });

    await createLedgerEntry(tx, {
      userId: request.userId,
      reason: "WITHDRAWAL_COMPLETE",
      operation: "WITHDRAWAL_COMPLETE",
      idempotencyKey: completionKey,
      referenceType: "WithdrawalRequest",
      referenceId: request.id,
      txHash: params.txHash,
      deltaAvailableUSDC: new Prisma.Decimal(0),
      deltaLockedUSDC: request.amountUSDC.neg(),
      amountDelta: request.amountUSDC.neg(),
    });
    await runLedgerTestHook("completeWithdrawal.afterLedgerBeforeBalance");

    const updatedBalance = await tx.userBalance.update({
      where: { userId: request.userId },
      data: {
        ...incrementVersion,
        lockedUSDC: { decrement: request.amountUSDC },
      },
    });

    return { completed: true, request: updatedRequest, balance: updatedBalance };
  });
}

export async function recomputeBalanceFromLedger(userId: string): Promise<{
  availableUSDC: Prisma.Decimal;
  lockedUSDC: Prisma.Decimal;
  totalUSDC: Prisma.Decimal;
}> {
  const entries = await prisma.ledgerEntry.findMany({
    where: {
      userId,
      operation: { in: CUSTODY_LEDGER_OPERATIONS },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      deltaAvailableUSDC: true,
      deltaLockedUSDC: true,
    },
  });

  let available = new Prisma.Decimal(0);
  let locked = new Prisma.Decimal(0);

  for (const entry of entries) {
    available = available.add(entry.deltaAvailableUSDC ?? new Prisma.Decimal(0));
    locked = locked.add(entry.deltaLockedUSDC ?? new Prisma.Decimal(0));
  }

  return {
    availableUSDC: available,
    lockedUSDC: locked,
    totalUSDC: available.add(locked),
  };
}
