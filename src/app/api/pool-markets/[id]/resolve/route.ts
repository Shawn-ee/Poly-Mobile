import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import {
  toGuardResponse,
} from "@/lib/marketGuards";
import { resolvePrivatePool } from "@/server/services/settlement";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const winningOutcomeId =
    typeof body?.winningOutcomeId === "string" ? body.winningOutcomeId : "";

  if (!winningOutcomeId) {
    return NextResponse.json({ error: "Missing winning outcome." }, { status: 400 });
  }

  try {
    const result = await resolvePrivatePool({
      poolId: id,
      winningOutcomeId,
      actorUserId: userId,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
