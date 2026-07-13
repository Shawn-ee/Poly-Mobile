import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { requestLocalLiveRuntimeSettlementExecutionDryRun } from "@/server/services/liveRuntimeSettlementExecution";

export async function POST(
  request: Request,
  context: { params: Promise<{ reviewId: string }> },
) {
  if (process.env.NODE_ENV === "production" || process.env.HOLIWYN_DISABLE_INTERNAL_OPERATOR_CONTROLS === "1") {
    return NextResponse.json(
      { error: "Internal settlement execution is unavailable." },
      { status: 404 },
    );
  }

  const body = await request.json().catch(() => ({}));
  if (body && typeof body === "object" && "execute" in body && body.execute === true) {
    return NextResponse.json(
      {
        error: "Direct settlement execution is disabled for the local internal route.",
        status: "execution_disabled",
        providerQuotaUsed: false,
        mutatesSettlement: false,
        exactConfirmationExposed: false,
        exactConfirmationStored: false,
        activeMarketExecutionAttempted: false,
      },
      { status: 409 },
    );
  }

  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { reviewId } = await context.params;
  const result = await requestLocalLiveRuntimeSettlementExecutionDryRun({
    reviewId,
    operator: {
      id: admin.user.id,
      email: admin.user.email,
      username: admin.user.username,
      roles: ["admin", "settlement_operator"],
    },
  });

  return NextResponse.json(result, {
    status: result.httpStatus,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
