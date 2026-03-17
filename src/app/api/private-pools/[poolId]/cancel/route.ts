import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { toGuardResponse } from "@/lib/marketGuards";
import { cancelPrivatePool } from "@/server/services/settlement";

type Ctx = { params: Promise<{ poolId: string }> };

export async function POST(_request: NextRequest, context: Ctx) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poolId } = await context.params;
  if (!poolId) {
    return NextResponse.json({ error: "Missing poolId." }, { status: 400 });
  }

  try {
    const result = await cancelPrivatePool({
      poolId,
      actorUserId: userId,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}

