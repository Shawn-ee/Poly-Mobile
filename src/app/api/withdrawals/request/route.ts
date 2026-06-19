import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import {
  assertFundingNotKilled,
  requireInternalFundingUserById,
  toFundingAccessResponse,
} from "@/lib/fundingBeta";
import { toGuardResponse } from "@/lib/marketGuards";
import { LedgerServiceError } from "@/server/services/ledger";
import { enforceSensitiveRateLimit } from "@/server/services/orderRateLimiter";
import { requestWithdrawal } from "@/server/services/withdrawals";

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const amount = body?.amount;
  const address = typeof body?.address === "string" ? body.address : "";
  const withdrawalRequestId =
    typeof body?.withdrawalRequestId === "string" && body.withdrawalRequestId.trim().length > 0
      ? body.withdrawalRequestId.trim()
      : undefined;

  try {
    await requireInternalFundingUserById(userId);
    assertFundingNotKilled();
    enforceSensitiveRateLimit(userId, "withdraw_request");
    const result = await requestWithdrawal({
      userId,
      amount,
      destinationAddress: address,
      withdrawalRequestId,
    });

    return NextResponse.json({
      ok: true,
      created: result.created,
      request: {
        id: result.request.id,
        amountUSDC: result.request.amountUSDC.toFixed(6),
        destinationAddress: result.request.destinationAddress,
        status: result.request.status,
        requestedAt: result.request.requestedAt,
      },
      balance: {
        availableUSDC: result.balance.availableUSDC.toFixed(6),
        lockedUSDC: result.balance.lockedUSDC.toFixed(6),
      },
    });
  } catch (error) {
    const fundingResponse = toFundingAccessResponse(error);
    if (fundingResponse) {
      return NextResponse.json(fundingResponse.body, { status: fundingResponse.status });
    }
    if (error instanceof LedgerServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
