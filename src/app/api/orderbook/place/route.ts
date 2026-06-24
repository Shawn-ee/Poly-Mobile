import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { normalizeApiError } from "@/lib/canonicalApi";
import { requireInternalTradingUserById } from "@/lib/internalTradingBeta";

// LEGACY: retained for current UI compatibility. External agents should use POST /api/orders.
export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await requireInternalTradingUserById(userId);
  } catch (error) {
    const normalized = normalizeApiError(error, "Failed to place order.");
    return NextResponse.json(normalized.body, { status: normalized.status });
  }

  return NextResponse.json(
    {
      error: {
        code: "LEGACY_ORDER_PLACEMENT_DISABLED",
        message: "Use POST /api/orders for guarded internal beta order placement.",
      },
    },
    { status: 410 },
  );
}
