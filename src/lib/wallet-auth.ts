import { getAddress, verifyMessage } from "ethers";
import { prisma } from "@/lib/db";
import { ensureUniqueUsername } from "@/lib/auth";
import { randomBytes } from "crypto";
import { config } from "@/lib/config";

export const normalizeAddress = (value: string) => getAddress(value).toLowerCase();

export const defaultWalletAvatar = (address: string) =>
  `https://api.dicebear.com/9.x/identicon/svg?seed=${address}`;

const shortAddressLabel = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

export const verifyWalletSignature = (message: string, signature: string) =>
  normalizeAddress(verifyMessage(message, signature));

export const createWalletSignMessage = (params: {
  address: string;
  nonce: string;
  domain: string;
  uri: string;
  chainId: number;
  mode: "login" | "link";
}) => {
  const issuedAt = new Date().toISOString();
  const statement =
    params.mode === "link"
      ? "Link wallet to your Poly Market account."
      : "Sign in to Poly Market.";
  return [
    `${params.domain} wants you to sign in with your Ethereum account:`,
    params.address,
    "",
    statement,
    "",
    `URI: ${params.uri}`,
    "Version: 1",
    `Chain ID: ${params.chainId}`,
    `Nonce: ${params.nonce}`,
    `Issued At: ${issuedAt}`,
  ].join("\n");
};

export const issueWalletNonce = async (params: {
  address: string;
  mode: "login" | "link";
  userId?: string | null;
}) => {
  const address = normalizeAddress(params.address);
  const nonce = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.walletNonce.upsert({
    where: { address },
    update: { nonce, expiresAt, mode: params.mode, userId: params.userId ?? null },
    create: { address, nonce, expiresAt, mode: params.mode, userId: params.userId ?? null },
  });
  return { address, nonce, expiresAt };
};

export const getOrCreateUserForWallet = async (params: {
  address: string;
  currentUserId: string | null;
}) => {
  const providerAccountId = normalizeAddress(params.address);
  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "wallet",
        providerAccountId,
      },
    },
  });

  if (existingAccount) {
    if (
      params.currentUserId &&
      existingAccount.userId !== params.currentUserId
    ) {
      throw new Error("Wallet is already linked to another user.");
    }
    return existingAccount.userId;
  }

  const currentUser =
    params.currentUserId
      ? await prisma.user.findUnique({ where: { id: params.currentUserId } })
      : null;

  if (params.currentUserId && currentUser) {
    await prisma.$transaction(async (tx) => {
      await tx.account.create({
        data: {
          userId: params.currentUserId!,
          provider: "wallet",
          providerAccountId,
        },
      });
      await tx.wallet.upsert({
        where: { address: providerAccountId },
        update: {
          userId: params.currentUserId!,
          chainId: config.baseChainId,
          linkMethod: "SIGNATURE",
          isVerified: true,
          isActive: true,
        },
        create: {
          userId: params.currentUserId!,
          address: providerAccountId,
          chainId: config.baseChainId,
          linkMethod: "SIGNATURE",
          isVerified: true,
          isActive: true,
        },
      });
    });
    return params.currentUserId;
  }

  const username = await ensureUniqueUsername(`wallet_${providerAccountId.slice(2, 8)}`);
  const createdUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username,
        displayName: shortAddressLabel(providerAccountId),
        image: defaultWalletAvatar(providerAccountId),
        accounts: {
          create: {
            provider: "wallet",
            providerAccountId,
          },
        },
      },
    });
    await tx.wallet.create({
      data: {
        userId: user.id,
        address: providerAccountId,
        chainId: config.baseChainId,
        linkMethod: "SIGNATURE",
        isVerified: true,
        isActive: true,
      },
    });
    return user;
  });
  return createdUser.id;
};
