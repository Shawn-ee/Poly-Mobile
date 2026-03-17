import { NextResponse } from "next/server";
import { getExistingUserId } from "@/lib/auth";
import { getCustodyBalance, WalletUserProvisioningError } from "@/lib/wallet";

const parseMoney = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (
    typeof value === "object" &&
    value &&
    "toNumber" in value &&
    typeof (value as { toNumber?: unknown }).toNumber === "function"
  ) {
    const n = (value as { toNumber: () => number }).toNumber();
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(value as unknown);
  return Number.isFinite(n) ? n : 0;
};

// LEGACY: retained for current UI compatibility. External agents should use GET /api/account/balance.
export async function GET() {
  const userId = await getExistingUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const balance = await getCustodyBalance(userId);
    const availableUSDC = parseMoney(balance.availableUSDC);
    const lockedUSDC = parseMoney(balance.lockedUSDC);
    const totalUSDC = parseMoney(balance.totalUSDC);

    return NextResponse.json({
      balance: availableUSDC,
      availableUSDC,
      lockedUSDC,
      totalUSDC,
      updatedAt: balance.updatedAt,
    });
  } catch (error) {
    if (error instanceof WalletUserProvisioningError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[wallet/balance] failed", error);
    return NextResponse.json({ error: "Failed to load wallet balance." }, { status: 500 });
  }
}
