import { Wallet, getAddress } from "ethers";
import { getDepositConfigIssues } from "@/lib/config";
import { prisma } from "@/lib/db";
import { encryptPrivateKey } from "@/lib/wallets/depositWalletCrypto";

const POLYGON = "POLYGON";
const USDC = "USDC";

const normalizeAddress = (address: string) => getAddress(address).toLowerCase();

export async function getActivePolygonUsdcDepositAddress(userId: string) {
  return prisma.userDepositAddress.findFirst({
    where: {
      userId,
      chain: POLYGON,
      token: USDC,
      status: "ACTIVE",
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function ensurePolygonUsdcDepositAddress(userId: string) {
  const existing = await getActivePolygonUsdcDepositAddress(userId);
  if (existing) {
    return existing;
  }

  const depositConfig = getDepositConfigIssues(process.env);
  if (depositConfig.errors.length > 0 || !process.env.DEPOSIT_WALLET_ENCRYPTION_KEY?.trim()) {
    console.error("[deposits] wallet_generation_blocked", {
      userId,
      errors: depositConfig.errors,
      warnings: depositConfig.warnings,
    });
    throw new Error("Deposit system is not configured.");
  }

  const wallet = Wallet.createRandom();
  const created = await prisma.userDepositAddress.create({
    data: {
      userId,
      chain: POLYGON,
      token: USDC,
      address: normalizeAddress(wallet.address),
      encryptedPrivateKey: encryptPrivateKey(wallet.privateKey),
      status: "ACTIVE",
    },
  });

  console.info("[deposits] deposit_address_created", {
    userId,
    depositAddressId: created.id,
    chain: created.chain,
    token: created.token,
    address: created.address,
  });

  return created;
}
