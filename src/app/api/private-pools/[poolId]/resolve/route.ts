import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { toGuardResponse } from "@/lib/marketGuards";
import { resolvePrivatePool } from "@/server/services/settlement";

type Ctx = { params: Promise<{ poolId: string }> };

export async function POST(request: NextRequest, context: Ctx) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const winningOutcomeId =
    typeof body?.winningOutcomeId === "string" ? body.winningOutcomeId : "";
  const { poolId } = await context.params;

  if (!poolId || !winningOutcomeId) {
    return NextResponse.json(
      { error: "Missing poolId or winningOutcomeId." },
      { status: 400 }
    );
  }

  try {
    const result = await resolvePrivatePool({
      poolId,
      winningOutcomeId,
      actorUserId: userId,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}

