import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getLocalLiveRuntimeResultReview } from "@/server/services/liveRuntimeResultReview";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production" || process.env.HOLIWYN_DISABLE_INTERNAL_RUNTIME_STATUS === "1") {
    return NextResponse.json(
      { error: "Local live runtime result review is unavailable in production." },
      { status: 404 },
    );
  }

  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const status = await getLocalLiveRuntimeResultReview({
    eventSlug: request.nextUrl.searchParams.get("eventSlug"),
    marketId: request.nextUrl.searchParams.get("marketId"),
  });

  return NextResponse.json(status, {
    status: status.status === "ready" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
