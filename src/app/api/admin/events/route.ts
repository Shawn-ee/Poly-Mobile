import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertAdmin, toGuardResponse } from "@/lib/marketGuards";
import { enforceSensitiveRateLimit } from "@/server/services/orderRateLimiter";
import { serializeEventSummary } from "@/server/services/eventReadModel";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const parseDate = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseMetadata = (value: unknown): Prisma.InputJsonValue =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Prisma.InputJsonObject)
    : {};

export async function POST(request: NextRequest) {
  let adminUserId = "";
  try {
    const admin = await assertAdmin();
    adminUserId = admin.id;
    enforceSensitiveRateLimit(admin.id, "admin_market_mutation");
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const slugInput = typeof body?.slug === "string" ? body.slug.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const slug = slugify(slugInput || title);
  if (!slug) {
    return NextResponse.json({ error: "Valid slug is required." }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      slug,
      title,
      description: typeof body?.description === "string" ? body.description.trim() : null,
      category: typeof body?.category === "string" ? body.category.trim() : "general",
      sportKey: typeof body?.sportKey === "string" ? body.sportKey.trim() : null,
      leagueKey: typeof body?.leagueKey === "string" ? body.leagueKey.trim() : null,
      eventType: typeof body?.eventType === "string" ? body.eventType.trim() : null,
      homeTeamName: typeof body?.homeTeamName === "string" ? body.homeTeamName.trim() : null,
      awayTeamName: typeof body?.awayTeamName === "string" ? body.awayTeamName.trim() : null,
      startTime: parseDate(body?.startTime),
      status: typeof body?.status === "string" ? body.status.trim() : "scheduled",
      imageUrl: typeof body?.imageUrl === "string" ? body.imageUrl.trim() : null,
      image: typeof body?.imageUrl === "string" ? body.imageUrl.trim() : null,
      metadata: parseMetadata(body?.metadata),
      createdBy: adminUserId,
    },
    include: {
      _count: { select: { markets: true } },
      markets: { select: { status: true } },
    },
  });

  return NextResponse.json({ event: serializeEventSummary(event) });
}
