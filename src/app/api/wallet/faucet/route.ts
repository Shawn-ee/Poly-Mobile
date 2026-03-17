import { NextResponse } from "next/server";
import { getExistingUserId } from "@/lib/auth";
import { config } from "@/lib/config";
import { prisma } from "@/lib/db";
import { getCustodyBalance } from "@/lib/wallet";
import { applyDeposit } from "@/server/services/ledger";

export async function POST() {
  const userId = await getExistingUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const now = new Date();
  if (user.lastFaucetAt) {
    const secondsSince =
      (now.getTime() - user.lastFaucetAt.getTime()) / 1000;
    if (secondsSince < config.faucetCooldownSeconds) {
      return NextResponse.json(
        { error: "Faucet cooldown active." },
        { status: 429 }
      );
    }
  }

  const custodyBefore = await getCustodyBalance(userId);
  const balance = Number(custodyBefore.totalUSDC);
  if (balance >= config.walletCap) {
    return NextResponse.json(
      { error: "Wallet cap reached." },
      { status: 400 }
    );
  }

  const credit = Math.min(config.faucetAmount, config.walletCap - balance);

  await applyDeposit({
    eventKey: `faucet:${userId}:${now.getTime()}`,
    userId,
    amount: String(credit),
    chainId: config.baseChainId,
    txHash: `faucet-${userId}-${now.getTime()}`,
    logIndex: 0,
    token: "FAUCET_USDC",
    referenceType: "FAUCET",
    referenceId: userId,
  });
  await prisma.user.update({
    where: { id: userId },
    data: { lastFaucetAt: now },
  });

  const custodyAfter = await getCustodyBalance(userId);
  return NextResponse.json({
    balance: Number(custodyAfter.totalUSDC),
    availableUSDC: Number(custodyAfter.availableUSDC),
    lockedUSDC: Number(custodyAfter.lockedUSDC),
    totalUSDC: Number(custodyAfter.totalUSDC),
    credited: credit,
  });
}
