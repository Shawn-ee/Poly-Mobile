import { NextRequest, NextResponse } from "next/server";
import { assertAdmin, toGuardResponse } from "@/lib/marketGuards";
import { enforceSensitiveRateLimit } from "@/server/services/orderRateLimiter";
import {
  createMarketsFromSportsTemplates,
  isSportsMarketTemplate,
} from "@/server/services/sportsMarketTemplates";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Ctx) {
  let adminUserId = "";
  try {
    const admin = await assertAdmin();
    adminUserId = admin.id;
    enforceSensitiveRateLimit(admin.id, "admin_market_mutation");
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const templates = Array.isArray(body?.templates) ? body.templates : [];
  if (!templates.length || !templates.every(isSportsMarketTemplate)) {
    return NextResponse.json({ error: "Invalid sports market templates." }, { status: 400 });
  }

  const markets = await createMarketsFromSportsTemplates({
    eventId: id,
    templates,
    createdBy: adminUserId,
    status: body?.status === "LIVE" ? "LIVE" : "UPCOMING",
  });

  return NextResponse.json({ markets });
}
