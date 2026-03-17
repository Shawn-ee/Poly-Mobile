import { NextResponse } from "next/server";
import { getExistingUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getWalletBalance } from "@/lib/wallet";

export async function GET() {
  const userId = await getExistingUserId();
  if (!userId) {
    return NextResponse.json({ user: null });
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      accounts: true,
      wallets: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!user) {
    return NextResponse.json({ user: null });
  }
  const walletAccount = user.accounts.find((account) => account.provider === "wallet");
  const primaryWallet = user.wallets[0] ?? null;
  const hasGoogleLinked = user.accounts.some((account) => account.provider === "google");
  const hasWalletLinked = user.wallets.length > 0 || Boolean(walletAccount);
  const tokenBalance = await getWalletBalance(user.id);
  const pendingDeposits = await prisma.depositIntent.aggregate({
    where: {
      userId: user.id,
      status: { in: ["CREATED", "SUBMITTED"] },
    },
    _sum: { amount: true },
  });
  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      image: user.image,
      hasCustomAvatar: user.hasCustomAvatar,
      walletAddress: primaryWallet?.address ?? walletAccount?.providerAccountId ?? null,
      hasGoogleLinked,
      hasWalletLinked,
      email: user.email,
      isAdmin: user.isAdmin,
      uBalance: tokenBalance,
      tokenBalance,
      pendingDeposits: pendingDeposits._sum.amount ?? 0,
    },
  });
}
