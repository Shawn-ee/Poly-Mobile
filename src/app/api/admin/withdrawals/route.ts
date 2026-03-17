import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { listAdminWithdrawals } from "@/server/services/withdrawals";

export async function GET(_request: NextRequest) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const data = await listAdminWithdrawals();
  return NextResponse.json({
    pending: data.pending.map((request) => ({
      id: request.id,
      userId: request.userId,
      userEmail: request.user.email,
      username: request.user.username,
      amountUSDC: request.amountUSDC.toFixed(6),
      destinationAddress: request.destinationAddress,
      status: request.status,
      requestedAt: request.requestedAt,
    })),
    recent: data.recent.map((request) => ({
      id: request.id,
      userId: request.userId,
      userEmail: request.user.email,
      username: request.user.username,
      amountUSDC: request.amountUSDC.toFixed(6),
      destinationAddress: request.destinationAddress,
      status: request.status,
      requestedAt: request.requestedAt,
      completedAt: request.completedAt,
      rejectedAt: request.rejectedAt,
      txHash: request.completedTxHash,
      adminNotes: request.adminNotes,
    })),
  });
}

