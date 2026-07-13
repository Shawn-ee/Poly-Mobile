import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { approveLocalLiveRuntimeSettlementReview } from "@/server/services/liveRuntimeSettlementApproval";

export async function POST(
  _request: Request,
  context: { params: Promise<{ reviewId: string }> },
) {
  if (process.env.NODE_ENV === "production" || process.env.HOLIWYN_DISABLE_INTERNAL_OPERATOR_CONTROLS === "1") {
    return NextResponse.json(
      { error: "Internal settlement approval is unavailable." },
      { status: 404 },
    );
  }

  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { reviewId } = await context.params;
  const result = await approveLocalLiveRuntimeSettlementReview({
    reviewId,
    operator: {
      id: admin.user.id,
      email: admin.user.email,
      username: admin.user.username,
      roles: ["admin", "settlement_operator"],
    },
  });

  if (result.status !== "ready") {
    return NextResponse.json(
      { error: result.error, status: result.status, reviewId: result.reviewId },
      { status: result.httpStatus },
    );
  }

  return NextResponse.json(result, {
    status: result.httpStatus,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
