import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertAdmin, toGuardResponse } from "@/lib/marketGuards";
import {
  buildImportedReferenceMetadata,
  parseReferenceReview,
} from "@/server/services/polymarketReferenceImport";
import {
  BotInitializationMetadataPatch,
  parseBotInitializationMetadata,
  mergeBotInitializationMetadata,
} from "@/server/services/referenceBotInitialization";
import { refreshPolymarketReferenceSnapshots } from "@/server/services/polymarketReferenceSnapshots";
import {
  buildAdminLifecycleActionUpdate,
  buildBotInitializationUpdate,
  evaluateReferenceBotReadiness,
} from "@/server/services/referenceBotReadiness";

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
  let botInitialization =
    body?.botInitialization && typeof body.botInitialization === "object" && !Array.isArray(body.botInitialization)
      ? (body.botInitialization as BotInitializationMetadataPatch)
      : undefined;
  const currentBotInitialization = parseBotInitializationMetadata(market.referenceMetadata);

  if (body?.action === "refresh_snapshot") {
    await refreshPolymarketReferenceSnapshots({ marketId: market.id });
  }
  if (body?.action === "run_readiness_check" || body?.action === "mark_live_ready" || body?.action === "mark_live_enabled") {
    if (body?.action === "mark_live_ready" || body?.action === "mark_live_enabled") {
      await refreshPolymarketReferenceSnapshots({ marketId: market.id });
    }
    const latestMarket = await prisma.market.findUnique({
      where: { id: market.id },
      include: { outcomes: true },
    });
    if (!latestMarket) {
      return NextResponse.json({ error: "Market not found." }, { status: 404 });
    }
    const readiness = await evaluateReferenceBotReadiness({
      market: latestMarket,
      dryRun: body?.action === "run_readiness_check",
    });
    if ((body?.action === "mark_live_ready" || body?.action === "mark_live_enabled") && !readiness.ready) {
      const result = buildAdminLifecycleActionUpdate({
        action: body.action,
        current: currentBotInitialization,
        readiness,
      });
      return NextResponse.json({ error: result.error, reasons: "reasons" in result ? result.reasons : [] }, { status: 400 });
    }
    if (body?.action === "run_readiness_check") {
      botInitialization = buildBotInitializationUpdate({
        current: currentBotInitialization,
        readiness,
      });
    } else {
      const result = buildAdminLifecycleActionUpdate({
        action: body.action,
        current: currentBotInitialization,
        readiness,
      });
      if (!result.ok) {
        return NextResponse.json({ error: result.error, reasons: "reasons" in result ? result.reasons : [] }, { status: 400 });
      }
      botInitialization = result.update;
    }
  } else if (body?.action === "mark_dry_run_running") {
    const result = buildAdminLifecycleActionUpdate({
      action: "mark_dry_run_running",
      current: currentBotInitialization,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    botInitialization = result.update;
  } else if (body?.action === "pause_bot") {
    const result = buildAdminLifecycleActionUpdate({
      action: "pause_bot",
      current: currentBotInitialization,
      pauseReason: typeof body?.pauseReason === "string" ? body.pauseReason : null,
    });
    botInitialization = result.update;
  } else if (body?.action === "reset_bot_initialization") {
    const result = buildAdminLifecycleActionUpdate({
      action: "reset_bot_initialization",
      current: currentBotInitialization,
    });
    botInitialization = result.update;
  } else if (body?.action === "emergency_stop") {
    botInitialization = {
      status: "paused",
      lastCheckedAt: new Date().toISOString(),
      reason: "Emergency stop requested by admin.",
      runtime: {
        liveOrdersEnabled: false,
        emergencyStop: true,
        cancelRequestedAt: new Date().toISOString(),
      },
    };
  } else if (body?.action === "cancel_bot_quotes") {
    botInitialization = {
      status: currentBotInitialization?.status ?? "paused",
      lastCheckedAt: new Date().toISOString(),
      reason: currentBotInitialization?.reason ?? "Bot quote cancellation requested by admin.",
      runtime: {
        liveOrdersEnabled: currentBotInitialization?.runtime?.liveOrdersEnabled ?? false,
        emergencyStop: currentBotInitialization?.runtime?.emergencyStop ?? false,
        cancelRequestedAt: new Date().toISOString(),
      },
    };
  }

  let referenceMetadata = buildImportedReferenceMetadata(market.referenceMetadata, {
    importStatus: nextImportStatus,
    referenceOnly,
    tradable,
    mmEnabled,
    reviewedAt: new Date().toISOString(),
    reviewedBy: adminUserId,
    reviewNotes,
  });
  if (botInitialization) {
    referenceMetadata = mergeBotInitializationMetadata(referenceMetadata, botInitialization);
  }

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
    botInitialization:
      (referenceMetadata as Record<string, unknown>).botInitialization ?? null,
  });
}
