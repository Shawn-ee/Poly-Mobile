import { NextRequest, NextResponse } from "next/server";
import { assertAdmin, toGuardResponse } from "@/lib/marketGuards";
import { seedReferenceLiquidityBotForMarket } from "@/server/services/referenceLiquiditySeeding";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Params) {
  let adminUserId = "";
  try {
    const admin = await assertAdmin();
    adminUserId = admin.id;
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const { id } = await context.params;
    const capitalDollars = Number(body.capitalDollars ?? 1000);
    const mintDollars = Number(body.mintDollars ?? 200);
    const dryRun = body.dryRun !== false;
    const confirmSeed = body.confirmSeed === true;

    const result = await seedReferenceLiquidityBotForMarket({
      marketId: id,
      capitalDollars,
      mintDollars,
      dryRun,
      confirmSeed,
      initializedBy: adminUserId,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to seed reference liquidity bot.",
      },
      { status: 400 },
    );
  }
}
