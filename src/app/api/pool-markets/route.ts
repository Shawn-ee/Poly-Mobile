import { NextRequest, NextResponse } from "next/server";
import { MarketVisibility } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { assertMarketRoutingInvariant } from "@/lib/marketRouting";
import { upsertMarketMember } from "@/lib/marketAccess";
import {
  assertMarketMechanism,
  assertMarketStatusTransition,
  MarketGuardError,
  toGuardResponse,
} from "@/lib/marketGuards";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : "";
  const sportLeague =
    typeof body?.sportLeague === "string" ? body.sportLeague.trim() : "";
  const sideA = typeof body?.sideA === "string" ? body.sideA.trim() : "";
  const sideB = typeof body?.sideB === "string" ? body.sideB.trim() : "";
  const presetsRaw: unknown[] = Array.isArray(body?.stakePresets) ? body.stakePresets : [];
  const betCloseTimeRaw =
    typeof body?.betCloseTime === "string" ? body.betCloseTime : "";
  const resolveTimeRaw =
    typeof body?.resolveTime === "string" ? body.resolveTime : "";
  const maxParticipants = Number(body?.maxParticipants ?? 100);
  const hidePicksUntilClose = Boolean(body?.hidePicksUntilClose);
  const mechanismInput = body?.mechanism === "POOL" || body?.mechanism === "ORDERBOOK"
    ? body.mechanism
    : "POOL";
  const visibilityInput =
    body?.visibility === "PUBLIC" || body?.visibility === "PRIVATE"
      ? body.visibility
      : "PRIVATE";

  const betCloseTime = new Date(betCloseTimeRaw);
  const resolveTime = new Date(resolveTimeRaw);

  const presetValues = presetsRaw
    .map((value: unknown) => Number(value))
    .filter((value): value is number => Number.isFinite(value) && value > 0);
  const presets = Array.from(new Set<number>(presetValues)).sort((a, b) => a - b);

  if (!title || !sportLeague || !sideA || !sideB) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }
  if (sideA.toLowerCase() === sideB.toLowerCase()) {
    return NextResponse.json(
      { error: "Side A and Side B must be different." },
      { status: 400 }
    );
  }
  if (
    !Number.isFinite(betCloseTime.getTime()) ||
    !Number.isFinite(resolveTime.getTime())
  ) {
    return NextResponse.json({ error: "Invalid dates." }, { status: 400 });
  }
  if (resolveTime <= betCloseTime) {
    return NextResponse.json(
      { error: "Resolve time must be after bet close time." },
      { status: 400 }
    );
  }
  if (!presets.length) {
    return NextResponse.json(
      { error: "At least one stake preset is required." },
      { status: 400 }
    );
  }

  const openOwnedCount = await prisma.market.count({
    where: {
      ownerId: userId,
      mechanism: "POOL",
      status: { in: ["UPCOMING", "LIVE", "CLOSED"] },
    },
  });
  if (openOwnedCount >= 10) {
    return NextResponse.json(
      { error: "You already own 10 active/locked pool markets." },
      { status: 400 }
    );
  }

  const mechanism = mechanismInput;
  const visibility =
    mechanism === "POOL" ? MarketVisibility.PRIVATE : (visibilityInput as MarketVisibility);
  try {
    assertMarketMechanism(mechanism, "POOL");
    assertMarketRoutingInvariant({ visibility, mechanism });
    assertMarketStatusTransition({
      mechanism,
      current: "UPCOMING",
      next: "LIVE",
    });
  } catch (error) {
    if (error instanceof MarketGuardError) {
      const response = toGuardResponse(error);
      return NextResponse.json(response.body, { status: response.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid market routing." },
      { status: 400 }
    );
  }

  const market = await prisma.market.create({
    data: {
      slug: `${slugify(title)}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      description: description || `${sportLeague} private pool bet`,
      categoryLegacy: sportLeague.toLowerCase(),
      type: "BINARY",
      kind: "POOL",
      mechanism,
      status: "LIVE" as never,
      ownerId: userId,
      isCanceled: false,
      createdBy: userId,
      betCloseTime,
      resolveTime,
      visibility,
      isListed: false,
      maxParticipants:
        Number.isFinite(maxParticipants) && maxParticipants > 0
          ? Math.floor(maxParticipants)
          : 100,
      hidePicksUntilClose,
      outcomes: {
        create: [
          { name: sideA, displayOrder: 0 },
          { name: sideB, displayOrder: 1 },
        ],
      },
      poolStakePresets: {
        create: presets.map((amount) => ({ amount })),
      },
    },
    select: { id: true },
  });

  await upsertMarketMember({
    marketId: market.id,
    userId,
    role: "OWNER",
  });

  return NextResponse.json({ marketId: market.id });
}
