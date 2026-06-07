import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { readAgentActivityEvents } from "@/server/services/agentOrchestratorRuns";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const url = new URL(request.url);
    const agentName = url.searchParams.get("agentName") ?? undefined;
    const runId = url.searchParams.get("runId") ?? undefined;
    const limit = Number(url.searchParams.get("limit") ?? 100);
    const events = await readAgentActivityEvents({ agentName, runId, limit });
    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load agent activity." },
      { status: 500 }
    );
  }
}
