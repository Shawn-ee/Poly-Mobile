import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { listRunFiles, readRunFile } from "@/server/services/agentOrchestratorRuns";

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
    const filePath = request.nextUrl.searchParams.get("path");
    if (filePath) {
      return NextResponse.json(await readRunFile(runId, filePath), { status: 200 });
    }
    return NextResponse.json(await listRunFiles(runId), { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Files not found." },
      { status: 404 }
    );
  }
}
