import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import {
  executeLocalLiveRuntimeSettlementReview,
  requestLocalLiveRuntimeSettlementExecutionDryRun,
} from "@/server/services/liveRuntimeSettlementExecution";

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
  const executeRequested = body && typeof body === "object" && "execute" in body && body.execute === true;
  const exactConfirmation =
    body && typeof body === "object" && typeof body.exactConfirmation === "string"
      ? body.exactConfirmation
      : body && typeof body === "object" && typeof body.confirm === "string"
        ? body.confirm
        : null;

  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { reviewId } = await context.params;
  const operator = {
    id: admin.user.id,
    email: admin.user.email,
    username: admin.user.username,
    roles: ["admin", "settlement_operator"],
  };
  const result = executeRequested
    ? await executeLocalLiveRuntimeSettlementReview({
        reviewId,
        operator,
        exactConfirmation,
      })
    : await requestLocalLiveRuntimeSettlementExecutionDryRun({
        reviewId,
        operator,
      });

  return NextResponse.json(result, {
    status: result.httpStatus,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
