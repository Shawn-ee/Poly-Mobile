import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import {
  toGuardResponse,
} from "@/lib/marketGuards";
import { cancelPrivatePool } from "@/server/services/settlement";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const result = await cancelPrivatePool({
      poolId: id,
      actorUserId: userId,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
