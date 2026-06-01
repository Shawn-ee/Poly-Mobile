import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { listAdminPolygonDeposits } from "@/lib/deposits/polygonDeposits";

export async function GET() {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const data = await listAdminPolygonDeposits();
  return NextResponse.json({
    pending: data.pending.map((deposit) => ({
      id: deposit.id,
      userId: deposit.userId,
      username: deposit.user.username,
      userEmail: deposit.user.email,
      depositAddress: deposit.depositAddress.address,
      amount: deposit.amount.toFixed(6),
      txHash: deposit.txHash,
      status: deposit.status,
      confirmations: deposit.confirmations,
      blockNumber: deposit.blockNumber,
      detectedAt: deposit.detectedAt,
      creditedAt: deposit.creditedAt,
      fromAddress: deposit.fromAddress,
      toAddress: deposit.toAddress,
    })),
    recent: data.recent.map((deposit) => ({
      id: deposit.id,
      userId: deposit.userId,
      username: deposit.user.username,
      userEmail: deposit.user.email,
      depositAddress: deposit.depositAddress.address,
      amount: deposit.amount.toFixed(6),
      txHash: deposit.txHash,
      status: deposit.status,
      confirmations: deposit.confirmations,
      blockNumber: deposit.blockNumber,
      detectedAt: deposit.detectedAt,
      creditedAt: deposit.creditedAt,
      fromAddress: deposit.fromAddress,
      toAddress: deposit.toAddress,
    })),
  });
}

