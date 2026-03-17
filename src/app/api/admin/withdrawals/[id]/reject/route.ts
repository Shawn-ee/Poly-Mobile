import { NextRequest, NextResponse } from "next/server";
import { assertAdmin, toGuardResponse } from "@/lib/marketGuards";
import { LedgerServiceError } from "@/server/services/ledger";
import { enforceSensitiveRateLimit } from "@/server/services/orderRateLimiter";
import { rejectWithdrawalByAdmin } from "@/server/services/withdrawals";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Ctx) {
  const body = await request.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? body.reason : undefined;
  const { id } = await context.params;

  try {
    const adminUser = await assertAdmin();
    enforceSensitiveRateLimit(adminUser.id, "admin_withdraw_reject");
    const result = await rejectWithdrawalByAdmin({
      withdrawalRequestId: id,
      reason,
      adminUserId: adminUser.id,
    });
    return NextResponse.json({
      ok: true,
      rejected: result.rejected,
      request: {
        id: result.request.id,
        status: result.request.status,
        rejectedAt: result.request.rejectedAt,
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
