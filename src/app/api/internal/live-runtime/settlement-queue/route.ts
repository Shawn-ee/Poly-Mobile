import { NextResponse } from "next/server";
import { getLocalLiveRuntimeSettlementQueue } from "@/server/services/liveRuntimeSettlementQueue";

export async function GET() {
  if (process.env.NODE_ENV === "production" || process.env.HOLIWYN_DISABLE_INTERNAL_RUNTIME_STATUS === "1") {
    return NextResponse.json(
      { error: "Local live runtime settlement queue is unavailable in production." },
      { status: 404 },
    );
  }

  const status = await getLocalLiveRuntimeSettlementQueue();

  return NextResponse.json(status, {
    status: status.status === "ready" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
