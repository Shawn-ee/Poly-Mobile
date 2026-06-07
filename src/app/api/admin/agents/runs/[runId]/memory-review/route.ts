import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { reviewRunMemoryProposal } from "@/server/services/agentOrchestratorRuns";

type MemoryReviewAction = "review" | "apply" | "reject";

export async function POST(
  request: Request,
  context: { params: Promise<{ runId: string }> }
) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const { runId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action ?? "review") as MemoryReviewAction;
    if (!["review", "apply", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid memory review action." }, { status: 400 });
    }

    const result = await reviewRunMemoryProposal(runId, action, body?.confirm === true);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Memory review failed." },
      { status: 400 }
    );
  }
}
