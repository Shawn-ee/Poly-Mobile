import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const intentId = url.searchParams.get("intentId");
  const txHash = url.searchParams.get("txHash");
  if (!intentId && !txHash) {
    return NextResponse.json(
      { error: "intentId or txHash is required." },
      { status: 400 }
    );
  }

  const intent = await prisma.depositIntent.findFirst({
    where: {
      userId,
      ...(intentId ? { id: intentId } : {}),
      ...(txHash ? { txHash } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  if (!intent) {
    return NextResponse.json({ error: "Deposit intent not found." }, { status: 404 });
  }

  return NextResponse.json({
    intentId: intent.id,
    status: intent.status,
    amount: intent.amount,
    txHash: intent.txHash,
    createdAt: intent.createdAt,
    confirmedAt: intent.confirmedAt,
  });
}
