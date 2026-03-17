import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { listUserWithdrawals } from "@/server/services/withdrawals";

export async function GET(_request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await listUserWithdrawals(userId);
  return NextResponse.json({
    items: requests.map((request) => ({
      id: request.id,
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

