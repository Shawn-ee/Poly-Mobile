import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getAgentDashboardSnapshot } from "@/server/services/agentOrchestratorRuns";

export async function GET() {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const snapshot = await getAgentDashboardSnapshot();
    return NextResponse.json(snapshot, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load agent runs." },
      { status: 500 }
    );
  }
}
