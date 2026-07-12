import { NextRequest, NextResponse } from "next/server";
import { getLocalLiveRuntimeLifecycle } from "@/server/services/liveRuntimeLifecycle";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production" || process.env.HOLIWYN_DISABLE_INTERNAL_RUNTIME_STATUS === "1") {
    return NextResponse.json(
      { error: "Local live runtime lifecycle status is unavailable in production." },
      { status: 404 },
    );
  }

  const status = await getLocalLiveRuntimeLifecycle({
    eventSlug: request.nextUrl.searchParams.get("eventSlug"),
  });

  return NextResponse.json(status, {
    status: status.status === "ready" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
