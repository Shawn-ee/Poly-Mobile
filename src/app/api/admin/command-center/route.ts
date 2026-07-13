import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getAdminCommandCenterSnapshot } from "@/server/services/adminCommandCenter";

export async function GET() {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const snapshot = await getAdminCommandCenterSnapshot();
  return NextResponse.json(snapshot, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
