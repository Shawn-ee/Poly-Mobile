import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import {
  DepositVerificationError,
  verifyUsdcDepositForUser,
} from "@/lib/deposits/verifyUsdcDeposit";

const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

export async function POST(request: Request) {
  const isDev = (process.env.APP_ENV ?? process.env.NODE_ENV ?? "development") !== "production";
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const txHash = typeof body?.txHash === "string" ? body.txHash.trim() : "";
  if (!TX_HASH_REGEX.test(txHash)) {
    return NextResponse.json({ error: "Invalid txHash." }, { status: 400 });
  }

  try {
    const result = await verifyUsdcDepositForUser({
      userId,
      txHash,
    });
    return NextResponse.json({
      ok: true,
      txHash,
      credited: result.credited,
      amount: result.totalMatchedAmount,
      blockNumber: result.blockNumber,
      confirmations: result.confirmations,
      depositEventId: result.depositEventId,
      depositEventIds: result.depositEventIds,
      matchedCount: result.matchedTransfers.length,
      creditedCount: result.creditedTransfers.length,
      ...(isDev
        ? {
            debug: {
              txFrom: result.txFrom,
              usdcTransfers: result.usdcTransfers.map((item) => ({
                logIndex: item.logIndex,
                from: item.from,
                to: item.to,
                amount: item.amountDecimal,
                amountRaw: item.amountRaw,
              })),
            },
          }
        : {}),
    });
  } catch (error) {
    if (error instanceof DepositVerificationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Deposit verification failed." },
      { status: 400 }
    );
  }
}
