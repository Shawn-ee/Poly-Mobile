import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertAdmin, toGuardResponse } from "@/lib/marketGuards";
import {
  buildImportedReferenceMetadata,
  parseReferenceReview,
} from "@/server/services/polymarketReferenceImport";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Params) {
  let adminUserId = "";
  try {
    const admin = await assertAdmin();
    adminUserId = admin.id;
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const market = await prisma.market.findUnique({
    where: { id },
    include: { outcomes: true },
  });
  if (!market) {
    return NextResponse.json({ error: "Market not found." }, { status: 404 });
  }

  const currentReview = parseReferenceReview(market.referenceMetadata);
  const nextImportStatus =
    body?.action === "approve"
      ? "approved"
      : body?.action === "reject"
        ? "rejected"
        : body?.action === "reset"
          ? "pending_review"
          : body?.importStatus === "pending_review" ||
              body?.importStatus === "approved" ||
              body?.importStatus === "rejected"
            ? body.importStatus
            : currentReview.importStatus ?? "pending_review";

  const referenceOnly =
    typeof body?.referenceOnly === "boolean"
      ? body.referenceOnly
      : nextImportStatus === "approved"
        ? currentReview.referenceOnly ?? true
        : true;
  const tradable =
    typeof body?.tradable === "boolean"
      ? body.tradable
      : nextImportStatus === "approved"
        ? currentReview.tradable ?? false
        : false;
  const mmEnabled =
    typeof body?.mmEnabled === "boolean"
      ? body.mmEnabled
      : nextImportStatus === "approved"
        ? currentReview.mmEnabled ?? false
        : false;
  const isListed =
    typeof body?.isListed === "boolean"
      ? body.isListed
      : nextImportStatus === "approved"
        ? market.isListed
        : false;
  const reviewNotes =
    typeof body?.reviewNotes === "string"
      ? body.reviewNotes.trim() || null
      : currentReview.reviewNotes ?? null;

  const referenceMetadata = buildImportedReferenceMetadata(market.referenceMetadata, {
    importStatus: nextImportStatus,
    referenceOnly,
    tradable,
    mmEnabled,
    reviewedAt: new Date().toISOString(),
    reviewedBy: adminUserId,
    reviewNotes,
  });

  const updated = await prisma.$transaction(async (tx) => {
    const nextMarket = await tx.market.update({
      where: { id: market.id },
      data: {
        isListed,
        referenceMetadata,
      },
    });

    if (typeof body?.tradable === "boolean") {
      await tx.outcome.updateMany({
        where: { marketId: market.id },
        data: { isTradable: body.tradable },
      });
    } else if (!tradable) {
      await tx.outcome.updateMany({
        where: { marketId: market.id },
        data: { isTradable: false },
      });
    }

    return nextMarket;
  });

  return NextResponse.json({
    ok: true,
    marketId: updated.id,
    importStatus: nextImportStatus,
    referenceOnly,
    tradable,
    mmEnabled,
    isListed,
    reviewedAt: (referenceMetadata as Record<string, unknown>).reviewedAt ?? null,
    reviewedBy: (referenceMetadata as Record<string, unknown>).reviewedBy ?? null,
    reviewNotes,
  });
}
