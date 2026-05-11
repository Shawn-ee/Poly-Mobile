import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { assertMarketVisibleToUser } from "@/lib/marketAccess";
import { toGuardResponse } from "@/lib/marketGuards";
import { marketReadInclude, serializeMarketReadModel } from "@/server/services/marketReadModel";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const userId = await getUserId();
  const { id } = await context.params;

  const market = await prisma.market.findUnique({
    where: { id },
    include: marketReadInclude,
  });

  if (!market) {
    return NextResponse.json({ error: "Market not found." }, { status: 404 });
  }

  try {
    await assertMarketVisibleToUser({ market, userId });
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const payload = await serializeMarketReadModel(market);

  return NextResponse.json({
    market: {
      ...payload,
      ownerId: market.ownerId,
      isCanceled: market.isCanceled,
      betCloseTime: market.betCloseTime,
      isListed: market.isListed,
    },
  });
}
