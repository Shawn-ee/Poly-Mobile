import { NextResponse } from "next/server";
import { getAddress } from "ethers";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wallets = await prisma.wallet.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    wallets: wallets.map((wallet) => ({
      id: wallet.id,
      address: wallet.address,
      checksumAddress: getAddress(wallet.address),
      chainId: wallet.chainId,
      linkMethod: wallet.linkMethod,
      isVerified: wallet.isVerified,
      isActive: wallet.isActive,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    })),
  });
}
