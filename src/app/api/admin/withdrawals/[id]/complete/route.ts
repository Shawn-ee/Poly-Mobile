import { NextRequest, NextResponse } from "next/server";
import { assertAdmin, toGuardResponse } from "@/lib/marketGuards";
import { LedgerServiceError } from "@/server/services/ledger";
import { enforceSensitiveRateLimit } from "@/server/services/orderRateLimiter";
import { completeWithdrawalByAdmin } from "@/server/services/withdrawals";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Ctx) {
  const body = await request.json().catch(() => null);
  const txHash = typeof body?.txHash === "string" ? body.txHash.trim() : "";
  const notes = typeof body?.notes === "string" ? body.notes : undefined;
  const { id } = await context.params;

  try {
    const adminUser = await assertAdmin();
    enforceSensitiveRateLimit(adminUser.id, "admin_withdraw_complete");
    const result = await completeWithdrawalByAdmin({
      withdrawalRequestId: id,
      txHash,
      notes,
      adminUserId: adminUser.id,
    });
    return NextResponse.json({
      ok: true,
      completed: result.completed,
      request: {
        id: result.request.id,
        status: result.request.status,
        txHash: result.request.completedTxHash,
        completedAt: result.request.completedAt,
      },
      balance: {
        availableUSDC: result.balance.availableUSDC.toFixed(6),
        lockedUSDC: result.balance.lockedUSDC.toFixed(6),
      },
    });
  } catch (error) {
    if (error instanceof LedgerServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
