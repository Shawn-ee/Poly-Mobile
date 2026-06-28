import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { MarketGuardError } from "@/lib/marketGuards";

type ResolutionAction = "resolve" | "void" | "push";

type MarketResolutionParams = {
  marketId: string;
  actorUserId: string;
  action: ResolutionAction;
  winningOutcomeId?: string | null;
  pushOutcomeId?: string | null;
  resolutionNote?: string | null;
  resolutionSourceUrl?: string | null;
  voidReason?: string | null;
};

const normalizeText = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const assertNoOrderbookExposure = async (tx: Prisma.TransactionClient, marketId: string) => {
  const [openOrderCount, positionCount] = await Promise.all([
    tx.order.count({
      where: {
        marketId,
        status: { in: ["OPEN", "PARTIAL"] },
        remaining: { gt: new Prisma.Decimal(0) },
      },
    }),
    tx.position.count({
      where: {
        marketId,
        OR: [
          { shares: { gt: new Prisma.Decimal(0) } },
          { reservedShares: { gt: new Prisma.Decimal(0) } },
        ],
      },
    }),
  ]);

  if (openOrderCount > 0 || positionCount > 0) {
    throw new MarketGuardError(
      "Use the orderbook settlement workflow for markets with open orders or positions.",
      409,
    );
  }
};

export const applySportsMarketResolution = async (params: MarketResolutionParams) => {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{
      id: string;
      status: string;
      mechanism: string;
      visibility: string;
      isCanceled: boolean;
      resolvedOutcomeId: string | null;
    }>>`
      SELECT "id", "status", "mechanism", "visibility", "isCanceled", "resolvedOutcomeId"
      FROM "Market"
      WHERE "id" = ${params.marketId}
      FOR UPDATE
    `;
    const market = rows[0];
    if (!market) {
      throw new MarketGuardError("Market not found.", 404);
    }
    if (market.mechanism !== "ORDERBOOK" || market.visibility !== "PUBLIC") {
      throw new MarketGuardError("Sports resolution metadata supports public orderbook markets only.", 400);
    }
    if (market.status === "RESOLVED" || market.resolvedOutcomeId || market.isCanceled) {
      throw new MarketGuardError("Market is already terminal.", 409);
    }

    await assertNoOrderbookExposure(tx, params.marketId);

    const note = normalizeText(params.resolutionNote);
    const sourceUrl = normalizeText(params.resolutionSourceUrl);
    const now = new Date();

    if (params.action === "resolve") {
      const winningOutcomeId = normalizeText(params.winningOutcomeId);
      if (!winningOutcomeId) {
        throw new MarketGuardError("winningOutcomeId is required.", 400);
      }
      const winningOutcome = await tx.outcome.findFirst({
        where: { id: winningOutcomeId, marketId: params.marketId, isActive: true },
        select: { id: true },
      });
      if (!winningOutcome) {
        throw new MarketGuardError("Invalid winning outcome for market.", 400);
      }

      await tx.outcome.updateMany({
        where: { marketId: params.marketId },
        data: { resolvedResult: "lose" },
      });
      await tx.outcome.update({
        where: { id: winningOutcome.id },
        data: { resolvedResult: "win" },
      });
      const updated = await tx.market.update({
        where: { id: params.marketId },
        data: {
          status: "RESOLVED",
          resolvedOutcomeId: winningOutcome.id,
          resolutionTime: now,
          resolutionEvidenceText: note,
          resolutionEvidenceUrl: sourceUrl,
          settlementStatus: "metadata_resolved",
        },
        select: {
          id: true,
          status: true,
          resolvedOutcomeId: true,
          resolutionTime: true,
          resolutionEvidenceText: true,
          resolutionEvidenceUrl: true,
          settlementStatus: true,
        },
      });
      return { market: updated, action: params.action, actorUserId: params.actorUserId };
    }

    if (params.action === "push") {
      const pushOutcomeId = normalizeText(params.pushOutcomeId);
      if (!pushOutcomeId) {
        throw new MarketGuardError("pushOutcomeId is required.", 400);
      }
      const pushedOutcome = await tx.outcome.findFirst({
        where: { id: pushOutcomeId, marketId: params.marketId, isActive: true },
        select: { id: true },
      });
      if (!pushedOutcome) {
        throw new MarketGuardError("Invalid push outcome for market.", 400);
      }
      await tx.outcome.update({
        where: { id: pushedOutcome.id },
        data: { resolvedResult: "push" },
      });
      const updated = await tx.market.update({
        where: { id: params.marketId },
        data: {
          status: "RESOLVED",
          resolutionTime: now,
          resolutionEvidenceText: note,
          resolutionEvidenceUrl: sourceUrl,
          settlementStatus: "metadata_push",
        },
        select: {
          id: true,
          status: true,
          resolvedOutcomeId: true,
          resolutionTime: true,
          resolutionEvidenceText: true,
          resolutionEvidenceUrl: true,
          settlementStatus: true,
        },
      });
      return { market: updated, action: params.action, actorUserId: params.actorUserId };
    }

    const voidReason = normalizeText(params.voidReason) ?? note ?? "Voided by admin.";
    await tx.outcome.updateMany({
      where: { marketId: params.marketId },
      data: { resolvedResult: "void" },
    });
    const updated = await tx.market.update({
      where: { id: params.marketId },
      data: {
        status: "CANCELED",
        isCanceled: true,
        resolutionTime: now,
        resolutionEvidenceText: note,
        resolutionEvidenceUrl: sourceUrl,
        voidReason,
        settlementStatus: "metadata_void",
      },
      select: {
        id: true,
        status: true,
        isCanceled: true,
        voidReason: true,
        resolutionTime: true,
        resolutionEvidenceText: true,
        resolutionEvidenceUrl: true,
        settlementStatus: true,
      },
    });
    return { market: updated, action: params.action, actorUserId: params.actorUserId };
  });
};
