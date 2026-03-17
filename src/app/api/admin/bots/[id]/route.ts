import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getAdminBotMonitorDetail } from "@/server/services/adminBotMonitor";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { id } = await context.params;
  const detail = await getAdminBotMonitorDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "Bot not found." }, { status: 404 });
  }

  return NextResponse.json(detail, { status: 200 });
}
