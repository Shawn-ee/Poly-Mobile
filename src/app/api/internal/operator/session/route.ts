import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { buildLocalLiveRuntimeOperatorSession } from "@/server/services/liveRuntimeOperatorSession";

export async function GET() {
  if (process.env.HOLIWYN_DISABLE_INTERNAL_OPERATOR_CONTROLS === "1") {
    return NextResponse.json(
      { error: "Internal operator controls are disabled." },
      { status: 404 },
    );
  }

  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const status = buildLocalLiveRuntimeOperatorSession({
    id: admin.user.id,
    email: admin.user.email,
    username: admin.user.username,
    isAdmin: admin.user.isAdmin,
  });

  return NextResponse.json(status, {
    status: status.status === "ready" ? 200 : 403,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
