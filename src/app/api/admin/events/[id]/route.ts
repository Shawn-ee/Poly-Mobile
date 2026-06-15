import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertAdmin, toGuardResponse } from "@/lib/marketGuards";
import { enforceSensitiveRateLimit } from "@/server/services/orderRateLimiter";
import { serializeEventSummary } from "@/server/services/eventReadModel";

type Ctx = { params: Promise<{ id: string }> };

const parseDate = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const parseMetadata = (value: unknown): Prisma.InputJsonValue | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Prisma.InputJsonObject)
    : undefined;

export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    const admin = await assertAdmin();
    enforceSensitiveRateLimit(admin.id, "admin_market_mutation");
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const startTime = parseDate(body?.startTime);
  const metadata = parseMetadata(body?.metadata);

  const event = await prisma.event.update({
    where: { id },
    data: {
      ...(typeof body?.title === "string" ? { title: body.title.trim() } : {}),
      ...(typeof body?.description === "string" ? { description: body.description.trim() } : {}),
      ...(typeof body?.category === "string" ? { category: body.category.trim() } : {}),
      ...(typeof body?.sportKey === "string" ? { sportKey: body.sportKey.trim() || null } : {}),
      ...(typeof body?.leagueKey === "string" ? { leagueKey: body.leagueKey.trim() || null } : {}),
      ...(typeof body?.eventType === "string" ? { eventType: body.eventType.trim() || null } : {}),
      ...(typeof body?.homeTeamName === "string" ? { homeTeamName: body.homeTeamName.trim() || null } : {}),
      ...(typeof body?.awayTeamName === "string" ? { awayTeamName: body.awayTeamName.trim() || null } : {}),
      ...(startTime !== undefined ? { startTime } : {}),
      ...(typeof body?.status === "string" ? { status: body.status.trim() } : {}),
      ...(typeof body?.imageUrl === "string" ? { imageUrl: body.imageUrl.trim() || null, image: body.imageUrl.trim() || null } : {}),
      ...(metadata !== undefined ? { metadata } : {}),
    },
    include: {
      _count: { select: { markets: true } },
      markets: { select: { status: true } },
    },
  });

  return NextResponse.json({ event: serializeEventSummary(event) });
}
