import { NextRequest, NextResponse } from "next/server";
import { getLocalLiveRuntimeStatus } from "@/server/services/liveRuntimeStatus";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production" || process.env.HOLIWYN_DISABLE_INTERNAL_RUNTIME_STATUS === "1") {
    return NextResponse.json(
      { error: "Local live runtime status is unavailable in production." },
      { status: 404 },
    );
  }

  const status = await getLocalLiveRuntimeStatus({
    phaseAuditInProgress: request.nextUrl.searchParams.get("phaseAuditInProgress") === "1",
  });
  return NextResponse.json(status, {
    status: status.status === "ready" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
