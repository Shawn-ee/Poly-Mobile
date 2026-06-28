import { NextResponse } from "next/server";
import { resolveAuthenticatedUser } from "@/lib/auth";
import { listUserPolygonDeposits } from "@/lib/deposits/polygonDeposits";
import { requireInternalFundingUser, toFundingAccessResponse } from "@/lib/fundingBeta";

export async function GET() {
  const auth = await resolveAuthenticatedUser();
  if (!auth.user) {
    console.warn("[deposits] deposit_history_auth_failed", {
      reason: auth.reason,
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    requireInternalFundingUser(auth.user);
  } catch (error) {
    const fundingResponse = toFundingAccessResponse(error);
    if (fundingResponse) {
      return NextResponse.json(fundingResponse.body, { status: fundingResponse.status });
    }
    throw error;
  }

  const deposits = await listUserPolygonDeposits(auth.user.id);
  return NextResponse.json({
    items: deposits.map((deposit) => ({
      id: deposit.id,
      amount: deposit.amount.toFixed(6),
      txHash: deposit.txHash,
      fromAddress: deposit.fromAddress,
      toAddress: deposit.toAddress,
      status: deposit.status,
      confirmations: deposit.confirmations,
      detectedAt: deposit.detectedAt,
      creditedAt: deposit.creditedAt,
      createdAt: deposit.createdAt,
      updatedAt: deposit.updatedAt,
    })),
  });
}
