import { Prisma } from "@prisma/client";
import { getAddress } from "ethers";
import { config } from "@/lib/config";
import { prisma } from "@/lib/db";
import {
  USDC_DECIMALS,
  formatUsdcFromRaw,
  getNormalizedPolygonUsdcAddress,
  getPolygonRpcProvider,
  normalizeEvmAddress,
  polygonUsdcTransferInterface,
  polygonUsdcTransferTopic,
  type PolygonUsdcTransferLog,
} from "@/lib/blockchain/polygonUsdc";
import { applyDepositTx } from "@/server/services/ledger";

const POLYGON = "POLYGON";
const USDC = "USDC";
const POLYGON_CHAIN_ID = 137;
const TRANSFER_TOPIC = polygonUsdcTransferTopic;
const MAX_TOPIC_ADDRESS_BATCH = 100;
const BLOCK_CHUNK_SIZE = 2_000;

const toUsdcDecimal = (value: string | number | Prisma.Decimal) =>
  new Prisma.Decimal(value).toDecimalPlaces(USDC_DECIMALS);

const depositIdempotencyKey = (txHash: string, logIndex: number) =>
  `polygon-usdc:${txHash.toLowerCase()}:${logIndex}`;

const normalizeAddress = (address: string) => getAddress(address).toLowerCase();

const getMinimumDeposit = () => new Prisma.Decimal(config.polygonDepositMinUsd).toDecimalPlaces(USDC_DECIMALS);

function toAddressTopic(address: string) {
  return `0x${address.replace(/^0x/, "").padStart(64, "0")}`;
}

export async function listUserPolygonDeposits(userId: string) {
  return prisma.deposit.findMany({
    where: { userId, chain: POLYGON, token: USDC },
    orderBy: [{ detectedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
}

export async function listAdminPolygonDeposits() {
  const [pending, recent] = await Promise.all([
    prisma.deposit.findMany({
      where: {
        chain: POLYGON,
        token: USDC,
        status: { in: ["DETECTED", "CONFIRMING", "FAILED", "IGNORED"] },
      },
      include: {
        user: { select: { email: true, username: true } },
        depositAddress: { select: { address: true } },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 200,
    }),
    prisma.deposit.findMany({
      where: { chain: POLYGON, token: USDC, status: "CREDITED" },
      include: {
        user: { select: { email: true, username: true } },
        depositAddress: { select: { address: true } },
      },
      orderBy: [{ creditedAt: "desc" }, { updatedAt: "desc" }],
      take: 200,
    }),
  ]);

  return { pending, recent };
}

export async function creditPolygonDepositIfEligible(params: {
  depositId: string;
  confirmations: number;
}) {
  return prisma.$transaction(async (tx) => {
    const deposit = await tx.deposit.findUnique({
      where: { id: params.depositId },
      include: { depositAddress: true },
    });
    if (!deposit) {
      throw new Error(`Deposit ${params.depositId} not found.`);
    }

    const nextStatus =
      params.confirmations >= config.polygonDepositConfirmations ? "CREDITED" : "CONFIRMING";

    if (deposit.status === "CREDITED") {
      return { deposit, credited: false, reason: "already_credited" as const };
    }

    if (params.confirmations < config.polygonDepositConfirmations) {
      const updated = await tx.deposit.update({
        where: { id: deposit.id },
        data: {
          confirmations: params.confirmations,
          status: "CONFIRMING",
        },
      });
      console.info("[deposits] deposit_confirming", {
        depositId: updated.id,
        txHash: updated.txHash,
        confirmations: updated.confirmations,
      });
      return { deposit: updated, credited: false, reason: "confirming" as const };
    }

    const applyResult = await applyDepositTx(tx, {
      userId: deposit.userId,
      amount: new Prisma.Decimal(deposit.amount),
      eventKey: depositIdempotencyKey(deposit.txHash, deposit.logIndex),
      chainId: POLYGON_CHAIN_ID,
      txHash: deposit.txHash,
      logIndex: deposit.logIndex,
      token: getNormalizedPolygonUsdcAddress(),
      referenceType: "Deposit",
      referenceId: deposit.id,
    });

    const updated = await tx.deposit.update({
      where: { id: deposit.id },
      data: {
        confirmations: params.confirmations,
        status: nextStatus,
        creditedAt: applyResult.applied ? new Date() : deposit.creditedAt ?? new Date(),
      },
    });

    console.info("[deposits] deposit_credited", {
      depositId: updated.id,
      txHash: updated.txHash,
      amount: updated.amount.toString(),
      applied: applyResult.applied,
    });

    return { deposit: updated, credited: applyResult.applied, reason: "credited" as const };
  });
}

export async function upsertPolygonDepositFromTransfer(params: {
  transfer: PolygonUsdcTransferLog;
  depositAddressId: string;
  userId: string;
}) {
  const amount = toUsdcDecimal(params.transfer.amountDecimal);
  const minimum = getMinimumDeposit();
  const initialStatus = amount.gte(minimum) ? "DETECTED" : "IGNORED";

  const deposit = await prisma.deposit.upsert({
    where: {
      chain_txHash_logIndex: {
        chain: POLYGON,
        txHash: params.transfer.txHash.toLowerCase(),
        logIndex: params.transfer.logIndex,
      },
    },
    create: {
      userId: params.userId,
      depositAddressId: params.depositAddressId,
      chain: POLYGON,
      token: USDC,
      txHash: params.transfer.txHash.toLowerCase(),
      logIndex: params.transfer.logIndex,
      fromAddress: normalizeAddress(params.transfer.fromAddress),
      toAddress: normalizeAddress(params.transfer.toAddress),
      amount,
      blockNumber: params.transfer.blockNumber,
      confirmations: 0,
      status: initialStatus,
      rawEventJson: params.transfer as Prisma.InputJsonValue,
    },
    update: {
      userId: params.userId,
      depositAddressId: params.depositAddressId,
      fromAddress: normalizeAddress(params.transfer.fromAddress),
      toAddress: normalizeAddress(params.transfer.toAddress),
      amount,
      blockNumber: params.transfer.blockNumber,
      rawEventJson: params.transfer as Prisma.InputJsonValue,
    },
  });

  if (initialStatus === "IGNORED") {
    console.info("[deposits] deposit_ignored", {
      depositId: deposit.id,
      txHash: deposit.txHash,
      amount: deposit.amount.toString(),
      reason: "below_minimum",
    });
  } else {
    console.info("[deposits] deposit_detected", {
      depositId: deposit.id,
      txHash: deposit.txHash,
      amount: deposit.amount.toString(),
      userId: params.userId,
      addressId: params.depositAddressId,
    });
  }

  return deposit;
}

export async function processPolygonTransferForKnownAddress(params: {
  transfer: PolygonUsdcTransferLog;
  currentBlock: number;
  userAddressMap: Map<string, { depositAddressId: string; userId: string }>;
}) {
  const destination = normalizeAddress(params.transfer.toAddress);
  const owner = params.userAddressMap.get(destination);
  if (!owner) {
    return { matched: false as const, status: "unmatched" as const };
  }

  const deposit = await upsertPolygonDepositFromTransfer({
    transfer: params.transfer,
    depositAddressId: owner.depositAddressId,
    userId: owner.userId,
  });

  const confirmations = Math.max(params.currentBlock - params.transfer.blockNumber + 1, 0);
  if (deposit.status === "IGNORED") {
    await prisma.deposit.update({
      where: { id: deposit.id },
      data: { confirmations },
    });
    return { matched: true as const, status: "ignored" as const, depositId: deposit.id };
  }

  await creditPolygonDepositIfEligible({
    depositId: deposit.id,
    confirmations,
  });
  return { matched: true as const, status: "processed" as const, depositId: deposit.id };
}

export async function ingestObservedDepositTransfer(params: {
  chainId: number;
  tokenAddress: string;
  transfer: PolygonUsdcTransferLog;
  currentBlock: number;
  userAddressMap: Map<string, { depositAddressId: string; userId: string }>;
}) {
  if (params.chainId !== POLYGON_CHAIN_ID) {
    return { matched: false as const, status: "wrong_chain" as const };
  }

  if (normalizeAddress(params.tokenAddress) !== getNormalizedPolygonUsdcAddress()) {
    return { matched: false as const, status: "unsupported_token" as const };
  }

  return processPolygonTransferForKnownAddress({
    transfer: params.transfer,
    currentBlock: params.currentBlock,
    userAddressMap: params.userAddressMap,
  });
}

function splitIntoChunks<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function scanPolygonUsdcDeposits(params?: {
  fromBlock?: number | null;
  eventSlug?: string | null;
}) {
  const provider = getPolygonRpcProvider();
  const latestBlock = await provider.getBlockNumber();
  const usdcAddress = getNormalizedPolygonUsdcAddress();

  const depositAddresses = await prisma.userDepositAddress.findMany({
    where: {
      chain: POLYGON,
      token: USDC,
      status: "ACTIVE",
    },
    include: {
      user: { select: { id: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (depositAddresses.length === 0) {
    return {
      latestBlock,
      fromBlock: params?.fromBlock ?? latestBlock,
      toBlock: latestBlock,
      addressesTracked: 0,
      transfersSeen: 0,
      depositsDetected: 0,
      depositsCredited: 0,
      ignoredCount: 0,
      confirmingCount: 0,
      errors: [] as string[],
    };
  }

  const normalizedAddresses = depositAddresses.map((row) => normalizeAddress(row.address));
  const userAddressMap = new Map(
    depositAddresses.map((row) => [
      normalizeAddress(row.address),
      { depositAddressId: row.id, userId: row.userId },
    ]),
  );

  const defaultFromBlock = Math.max(
    0,
    Number(
      depositAddresses.reduce<bigint>(
        (min, row) => {
          if (row.lastScannedBlock == null) return min;
          return row.lastScannedBlock < min ? row.lastScannedBlock : min;
        },
        BigInt(Math.max(latestBlock - BLOCK_CHUNK_SIZE, 0)),
      ),
    ),
  );

  const fromBlock = params?.fromBlock ?? defaultFromBlock;
  const addressTopicChunks = splitIntoChunks(
    normalizedAddresses.map((address) => toAddressTopic(address)),
    MAX_TOPIC_ADDRESS_BATCH,
  );

  const allTransfers: PolygonUsdcTransferLog[] = [];
  const errors: string[] = [];

  for (let start = fromBlock; start <= latestBlock; start += BLOCK_CHUNK_SIZE) {
    const end = Math.min(start + BLOCK_CHUNK_SIZE - 1, latestBlock);
    for (const topicChunk of addressTopicChunks) {
      try {
        const logs = await provider.getLogs({
          address: usdcAddress,
          topics: [TRANSFER_TOPIC, null, topicChunk],
          fromBlock: start,
          toBlock: end,
        });

        for (const log of logs) {
          const decoded = polygonUsdcTransferInterface.decodeEventLog(
            "Transfer",
            log.data,
            log.topics,
          );
          const value = decoded.value as bigint;
          allTransfers.push({
            txHash: log.transactionHash.toLowerCase(),
            logIndex: log.index,
            blockNumber: log.blockNumber,
            fromAddress: normalizeEvmAddress(decoded.from as string),
            toAddress: normalizeEvmAddress(decoded.to as string),
            amountRaw: value.toString(),
            amountDecimal: formatUsdcFromRaw(value),
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown Polygon log fetch error";
        errors.push(message);
      }
    }
  }

  const deduped = Array.from(
    new Map(
      allTransfers.map((transfer) => [
        `${transfer.txHash}:${transfer.logIndex}`,
        transfer,
      ]),
    ).values(),
  ).sort((a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex);

  let depositsDetected = 0;
  let depositsCredited = 0;
  let ignoredCount = 0;
  let confirmingCount = 0;

  for (const transfer of deduped) {
    const result = await ingestObservedDepositTransfer({
      chainId: POLYGON_CHAIN_ID,
      tokenAddress: usdcAddress,
      transfer,
      currentBlock: latestBlock,
      userAddressMap,
    });
    if (!result.matched) {
      continue;
    }
    const deposit = result.depositId
      ? await prisma.deposit.findUnique({ where: { id: result.depositId } })
      : null;
    if (deposit) {
      depositsDetected += 1;
      if (deposit.status === "CREDITED") depositsCredited += 1;
      if (deposit.status === "IGNORED") ignoredCount += 1;
      if (deposit.status === "CONFIRMING" || deposit.status === "DETECTED") confirmingCount += 1;
    }
  }

  await prisma.userDepositAddress.updateMany({
    where: {
      id: { in: depositAddresses.map((row) => row.id) },
    },
    data: {
      lastScannedBlock: BigInt(latestBlock),
    },
  });

  return {
    latestBlock,
    fromBlock,
    toBlock: latestBlock,
    addressesTracked: depositAddresses.length,
    transfersSeen: deduped.length,
    depositsDetected,
    depositsCredited,
    ignoredCount,
    confirmingCount,
    errors,
  };
}

export async function runPolygonDepositMonitorLoop(params?: {
  pollMs?: number;
  durationSeconds?: number | null;
}) {
  const pollMs = params?.pollMs ?? config.depositMonitorPollIntervalMs;
  const startedAt = Date.now();
  let cycle = 0;
  let stopped = false;

  const handleSignal = () => {
    stopped = true;
  };

  process.once("SIGINT", handleSignal);
  process.once("SIGTERM", handleSignal);

  try {
    while (!stopped) {
      cycle += 1;
      const summary = await scanPolygonUsdcDeposits();
      console.info("[deposits] monitor_cycle", {
        cycle,
        ...summary,
      });

      if (
        params?.durationSeconds != null &&
        Date.now() - startedAt >= params.durationSeconds * 1000
      ) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, pollMs));
    }
  } finally {
    process.removeListener("SIGINT", handleSignal);
    process.removeListener("SIGTERM", handleSignal);
  }
}
