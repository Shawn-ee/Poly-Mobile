import { NextResponse } from "next/server";
import { assertAdmin, toGuardResponse } from "@/lib/marketGuards";
import { LedgerServiceError } from "@/server/services/ledger";
import { completeWithdrawalByAdmin } from "@/server/services/withdrawals";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const withdrawalRequestId =
    typeof body?.withdrawalRequestId === "string" ? body.withdrawalRequestId.trim() : "";
  const txHash = typeof body?.txHash === "string" ? body.txHash.trim() : "";
  const notes = typeof body?.notes === "string" ? body.notes : undefined;
  if (!withdrawalRequestId) {
    return NextResponse.json({ error: "withdrawalRequestId is required." }, { status: 400 });
  }

  try {
    const adminUser = await assertAdmin();
    const result = await completeWithdrawalByAdmin({
      withdrawalRequestId,
      txHash,
      notes,
      adminUserId: adminUser.id,
    });
    return NextResponse.json({
      ok: true,
      completed: result.completed,
      withdrawalRequestId: result.request.id,
      status: result.request.status,
      txHash: result.request.completedTxHash,
      availableUSDC: result.balance.availableUSDC.toFixed(6),
      lockedUSDC: result.balance.lockedUSDC.toFixed(6),
    });
  } catch (error) {
    if (error instanceof LedgerServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
