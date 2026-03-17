import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const intentId = typeof body?.intentId === "string" ? body.intentId : "";
  const txHash = typeof body?.txHash === "string" ? body.txHash : "";
  if (!intentId || !txHash || !TX_HASH_REGEX.test(txHash)) {
    return NextResponse.json({ error: "Invalid intent/tx hash." }, { status: 400 });
  }

  const intent = await prisma.depositIntent.findUnique({ where: { id: intentId } });
  if (!intent || intent.userId !== userId) {
    return NextResponse.json({ error: "Deposit intent not found." }, { status: 404 });
  }
  if (intent.status === "CONFIRMED") {
    return NextResponse.json({ status: "CONFIRMED", alreadyConfirmed: true });
  }

  const submitted = await prisma.$transaction(async (tx) => {
    const updatedIntent = await tx.depositIntent.update({
      where: { id: intentId },
      data: { status: "SUBMITTED", txHash },
    });
    await tx.ledgerTransaction.updateMany({
      where: {
        userId,
        referenceType: "DepositIntent",
        referenceId: intentId,
      },
      data: {
        status: "SUBMITTED",
        txHash,
      },
    });
    return updatedIntent;
  });

  return NextResponse.json({
    status: submitted.status,
    txHash: submitted.txHash,
    note: "Use /api/wallet/deposit-verify for on-chain Base USDC verification and crediting.",
  });
}
