import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getAdminBotMonitorSnapshot } from "@/server/services/adminBotMonitor";

export async function GET() {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const snapshot = await getAdminBotMonitorSnapshot();
  return NextResponse.json(snapshot, { status: 200 });
}
