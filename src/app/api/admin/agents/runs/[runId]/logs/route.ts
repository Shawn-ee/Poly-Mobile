import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { readRunLogs } from "@/server/services/agentOrchestratorRuns";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ runId: string }> }
) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const { runId } = await context.params;
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? 100);
    return NextResponse.json(await readRunLogs(runId, Number.isFinite(limit) ? limit : 100), { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Logs not found." },
      { status: 404 }
    );
  }
}
