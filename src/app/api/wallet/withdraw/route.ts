import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { LedgerServiceError } from "@/server/services/ledger";
import { requestWithdrawal } from "@/server/services/withdrawals";

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const amount = body?.amount as string | number | undefined;
  const address = typeof body?.address === "string" ? body.address : "";
  const withdrawalRequestId =
    typeof body?.withdrawalRequestId === "string" && body.withdrawalRequestId.trim().length > 0
      ? body.withdrawalRequestId.trim()
      : crypto.randomUUID();

  try {
    const result = await requestWithdrawal({
      withdrawalRequestId,
      userId,
      amount: amount ?? "0",
      destinationAddress: address,
    });
    return NextResponse.json({
      ok: true,
      created: result.created,
      withdrawalRequestId: result.request.id,
      status: result.request.status,
      amountUSDC: result.request.amountUSDC.toFixed(6),
      destinationAddress: result.request.destinationAddress,
      availableUSDC: result.balance.availableUSDC.toFixed(6),
      lockedUSDC: result.balance.lockedUSDC.toFixed(6),
    });
  } catch (error) {
    if (error instanceof LedgerServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create withdrawal request." },
      { status: 400 }
    );
  }
}
