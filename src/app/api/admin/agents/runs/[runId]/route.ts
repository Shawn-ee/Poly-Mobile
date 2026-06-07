import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { readRun } from "@/server/services/agentOrchestratorRuns";

export async function GET(
  _request: Request,
  context: { params: Promise<{ runId: string }> }
) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const { runId } = await context.params;
    const run = await readRun(runId);
    return NextResponse.json({ run }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Run not found." },
      { status: 404 }
    );
  }
}
