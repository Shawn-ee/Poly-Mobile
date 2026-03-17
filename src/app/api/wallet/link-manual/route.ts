import { NextResponse } from "next/server";
import { getAddress } from "ethers";
import { getUserId } from "@/lib/auth";
import { config } from "@/lib/config";
import { prisma } from "@/lib/db";

const normalizeAddress = (value: string) => getAddress(value).toLowerCase();

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const rawAddress = typeof body?.address === "string" ? body.address.trim() : "";
  if (!rawAddress) {
    return NextResponse.json({ error: "Wallet address is required." }, { status: 400 });
  }

  let address: string;
  try {
    address = normalizeAddress(rawAddress);
  } catch {
    return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  }

  const existing = await prisma.wallet.findUnique({ where: { address } });
  if (existing && existing.userId !== userId) {
    return NextResponse.json(
      { error: "Wallet is already linked to another user." },
      { status: 409 }
    );
  }

  const wallet = await prisma.wallet.upsert({
    where: { address },
    create: {
      userId,
      address,
      chainId: config.baseChainId,
      isActive: true,
      isVerified: false,
      linkMethod: "MANUAL",
    },
    update: {
      userId,
      chainId: config.baseChainId,
      isActive: true,
      isVerified: false,
      linkMethod: "MANUAL",
    },
  });

  return NextResponse.json({
    ok: true,
    wallet: {
      id: wallet.id,
      address: wallet.address,
      chainId: wallet.chainId,
      isActive: wallet.isActive,
      isVerified: wallet.isVerified,
      linkMethod: wallet.linkMethod,
      createdAt: wallet.createdAt,
    },
  });
}
