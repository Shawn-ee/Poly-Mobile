import { Interface, JsonRpcProvider, formatUnits, getAddress } from "ethers";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { config } from "../config";
import { applyDeposit } from "@/server/services/ledger";

const transferAbi = ["event Transfer(address indexed from, address indexed to, uint256 value)"];
const transferIface = new Interface(transferAbi);
const transferTopic = transferIface.getEvent("Transfer")?.topicHash ?? "";
const isDev = (config.appEnv ?? process.env.NODE_ENV ?? "development") !== "production";

type MatchedTransfer = {
  logIndex: number;
  from: string;
  to: string;
  amountRaw: string;
  amountDecimal: string;
};

type CreditedTransfer = MatchedTransfer & {
  depositEventId: string;
};

export type VerifyUsdcDepositResult = {
  txHash: string;
  txFrom: string;
  chainId: number;
  networkChainId: number;
  receiptStatus: number;
  blockNumber: number;
  confirmations: number;
  totalMatchedAmount: string;
  creditedAmount: string;
  credited: boolean;
  matchedTransfers: MatchedTransfer[];
  creditedTransfers: CreditedTransfer[];
  alreadyCreditedTransfers: CreditedTransfer[];
  usdcTransfers: MatchedTransfer[];
  depositEventIds: string[];
  depositEventId: string;
};

export class DepositVerificationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "DepositVerificationError";
    this.status = status;
  }
}

const normalizeAddress = (value: string) => getAddress(value);
const sameAddress = (a: string, b: string) => normalizeAddress(a) === normalizeAddress(b);
const normalizeLowerAddress = (value: string) => value.trim().toLowerCase();

const ensureDepositConfig = () => {
  if (!config.baseRpcUrl) throw new DepositVerificationError("BASE_RPC_URL is not configured.", 500);
  if (!config.usdcBaseAddress) {
    throw new DepositVerificationError("USDC_BASE_ADDRESS is not configured.", 500);
  }
  if (!config.projectDepositAddress) {
    throw new DepositVerificationError("PROJECT_DEPOSIT_ADDRESS is not configured.", 500);
  }
};

const toLogIndex = (value: unknown) => Number(value);

export async function verifyUsdcDepositForUser({
  userId,
  txHash,
}: {
  userId: string;
  txHash: string;
}): Promise<VerifyUsdcDepositResult> {
  ensureDepositConfig();

  const wallets = await prisma.wallet.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
  const walletAccounts = await prisma.account.findMany({
    where: {
      userId,
      provider: "wallet",
    },
    orderBy: { createdAt: "desc" },
  });
  if (wallets.length === 0 && walletAccounts.length === 0) {
    throw new DepositVerificationError("Link a wallet before verifying deposits.", 400);
  }

  let normalizedToken: string;
  let normalizedDeposit: string;
  try {
    normalizedToken = normalizeAddress(config.usdcBaseAddress);
    normalizedDeposit = normalizeAddress(config.projectDepositAddress);
  } catch {
    throw new DepositVerificationError(
      "USDC_BASE_ADDRESS or PROJECT_DEPOSIT_ADDRESS is invalid.",
      500
    );
  }

  const provider = new JsonRpcProvider(config.baseRpcUrl);
  const network = await provider.getNetwork();
  const networkChainId = Number(network.chainId);
  if (networkChainId !== config.baseChainId) {
    throw new DepositVerificationError(
      `RPC chainId mismatch. Expected ${config.baseChainId}, got ${networkChainId}.`,
      500
    );
  }

  const [tx, receipt] = await Promise.all([
    provider.getTransaction(txHash),
    provider.getTransactionReceipt(txHash),
  ]);
  if (!tx || !receipt) {
    throw new DepositVerificationError("Transaction receipt not found.", 404);
  }
  if (receipt.status !== 1) {
    throw new DepositVerificationError("Transaction failed on-chain.", 400);
  }
  if (!tx.from || !tx.to) {
    throw new DepositVerificationError("Transaction sender/recipient is missing.", 400);
  }
  if (!receipt.blockNumber) {
    throw new DepositVerificationError("Transaction is not mined yet.", 400);
  }
  const txFromLower = normalizeLowerAddress(tx.from);
  const walletAddressCandidates = Array.from(
    new Set([
      ...wallets.map((item) => normalizeLowerAddress(item.address)),
      ...walletAccounts.map((item) => normalizeLowerAddress(item.providerAccountId)),
    ])
  );

  const currentBlock = await provider.getBlockNumber();
  const confirmations = currentBlock - Number(receipt.blockNumber) + 1;
  if (confirmations < config.depositMinConfirmations) {
    throw new DepositVerificationError(
      `Not enough confirmations yet (${confirmations}/${config.depositMinConfirmations}).`,
      400
    );
  }

  const usdcTransfers = receipt.logs
    .filter((log) => log.topics[0] === transferTopic && sameAddress(log.address, normalizedToken))
    .map((log) => {
      const decoded = transferIface.decodeEventLog("Transfer", log.data, log.topics);
      const logIndex = toLogIndex(
        (log as { index?: number; logIndex?: number }).index ??
          (log as { logIndex?: number }).logIndex
      );
      const value = decoded.value as bigint;
      return {
        logIndex,
        from: normalizeAddress(decoded.from as string),
        to: normalizeAddress(decoded.to as string),
        amountRaw: value.toString(),
        amountDecimal: formatUnits(value, 6),
      };
    })
    .filter((log) => Number.isInteger(log.logIndex) && log.logIndex >= 0)
    .sort((a, b) => a.logIndex - b.logIndex);

  const matchedTransfers = usdcTransfers
    .filter((log) => sameAddress(log.to, normalizedDeposit) && BigInt(log.amountRaw) > 0n)
    .sort((a, b) => a.logIndex - b.logIndex);

  if (!matchedTransfers.length) {
    throw new DepositVerificationError(
      "No USDC transfer to project deposit address found in tx.",
      400
    );
  }
  const unmatchedDepositors = matchedTransfers
    .map((transfer) => normalizeLowerAddress(transfer.from))
    .filter((from) => !walletAddressCandidates.includes(from));
  if (unmatchedDepositors.length > 0) {
    if (isDev) {
      console.error("[deposit-verify] transfer.from mismatch", {
        userId,
        txHash,
        txFromRaw: tx.from,
        txFromLower,
        normalizedLinkedWallets: walletAddressCandidates,
        unmatchedDepositors,
        matchedTransfers,
        verifyBaseChainId: config.baseChainId,
        rpcNetworkChainId: networkChainId,
      });
    }
    throw new DepositVerificationError(
      `Transfer.from ${unmatchedDepositors[0]} not in linked wallets ${JSON.stringify(walletAddressCandidates)}`,
      400
    );
  }

  const totalMatchedRaw = matchedTransfers.reduce((sum, transfer) => {
    return sum + BigInt(transfer.amountRaw);
  }, 0n);

  const blockNumber = Number(receipt.blockNumber);
  const confirmedAt = new Date();

  const creditedTransfers: CreditedTransfer[] = [];
  const alreadyCreditedTransfers: CreditedTransfer[] = [];

  for (const transfer of matchedTransfers) {
    const event = await prisma.chainDepositEvent.upsert({
      where: {
        chainId_txHash_logIndex: {
          chainId: config.baseChainId,
          txHash,
          logIndex: transfer.logIndex,
        },
      },
      create: {
        chainId: config.baseChainId,
        txHash,
        logIndex: transfer.logIndex,
        blockNumber,
        tokenAddress: normalizedToken,
        fromAddress: transfer.from,
        toAddress: transfer.to,
        amountRaw: transfer.amountRaw,
        amountDecimal: transfer.amountDecimal,
        userId,
      },
      update: {
        userId,
      },
    });

    try {
      await prisma.ledgerTransaction.create({
        data: {
          userId,
          type: "DEPOSIT",
          amount: new Prisma.Decimal(transfer.amountDecimal),
          status: "CONFIRMED",
          txHash,
          chainId: config.baseChainId,
          logIndex: transfer.logIndex,
          tokenAddress: normalizedToken,
          amountRaw: transfer.amountRaw,
          referenceType: "ChainDepositEvent",
          referenceId: event.id,
          metadata: {
            fromAddress: transfer.from,
            toAddress: transfer.to,
            blockNumber,
          },
        },
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
        throw error;
      }
    }

    const eventKey = `${config.baseChainId}:${txHash.toLowerCase()}:${transfer.logIndex}`;
    const depositResult = await applyDeposit({
      eventKey,
      userId,
      amount: transfer.amountDecimal,
      chainId: config.baseChainId,
      txHash,
      logIndex: transfer.logIndex,
      token: normalizedToken,
      referenceType: "ChainDepositEvent",
      referenceId: event.id,
    });

    const mapped = {
      ...transfer,
      depositEventId: event.id,
    };

    if (depositResult.applied) {
      creditedTransfers.push(mapped);
    } else {
      alreadyCreditedTransfers.push(mapped);
    }
  }

  if (creditedTransfers.length > 0) {
    const existingIntent = await prisma.depositIntent.findFirst({
      where: { txHash },
      orderBy: { createdAt: "desc" },
    });
    if (existingIntent && existingIntent.userId !== userId) {
      throw new DepositVerificationError("Deposit intent already linked to another user.", 409);
    }

    const totalAmountDecimal = formatUnits(totalMatchedRaw, 6);
    if (existingIntent) {
      await prisma.depositIntent.update({
        where: { id: existingIntent.id },
        data: {
          walletAddress: txFromLower,
          chainId: config.baseChainId,
          amount: new Prisma.Decimal(totalAmountDecimal),
          status: "CONFIRMED",
          txHash,
          confirmedAt,
        },
      });
    } else {
      await prisma.depositIntent.create({
        data: {
          userId,
          walletAddress: txFromLower,
          chainId: config.baseChainId,
          amount: new Prisma.Decimal(totalAmountDecimal),
          status: "CONFIRMED",
          txHash,
          confirmedAt,
        },
      });
    }
  }

  const creditedRaw = creditedTransfers.reduce((sum, transfer) => {
    return sum + BigInt(transfer.amountRaw);
  }, 0n);
  const allEventIds = matchedTransfers.map((transfer) => {
    const credited = creditedTransfers.find((item) => item.logIndex === transfer.logIndex);
    const already = alreadyCreditedTransfers.find((item) => item.logIndex === transfer.logIndex);
    return credited?.depositEventId ?? already?.depositEventId ?? "";
  }).filter(Boolean);

  return {
    txHash,
    txFrom: tx.from,
    chainId: config.baseChainId,
    networkChainId,
    receiptStatus: Number(receipt.status),
    blockNumber,
    confirmations,
    totalMatchedAmount: formatUnits(totalMatchedRaw, 6),
    creditedAmount: formatUnits(creditedRaw, 6),
    credited: creditedTransfers.length > 0,
    matchedTransfers,
    creditedTransfers,
    alreadyCreditedTransfers,
    usdcTransfers,
    depositEventIds: allEventIds,
    depositEventId: allEventIds[0] ?? "",
  };
}
