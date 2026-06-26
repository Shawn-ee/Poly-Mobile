import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { MarketGuardError } from "@/lib/marketGuards";

const ZERO = new Prisma.Decimal(0);
const MONEY_SCALE = 6;

type LegState = "win" | "lose" | "void" | "push" | "pending";
type SettlementOutcome = "win" | "lose" | "void" | "pending";

const toMoney = (value: Prisma.Decimal) =>
  value.toDecimalPlaces(MONEY_SCALE, Prisma.Decimal.ROUND_DOWN);

const normalizeResult = (value: string | null | undefined) => value?.trim().toLowerCase() ?? null;

const evaluateLeg = (leg: {
  outcomeId: string;
  market: {
    status: string;
    isCanceled: boolean;
    resolvedOutcomeId: string | null;
    voidReason: string | null;
  };
  outcome: {
    resolvedResult: string | null;
  };
}): LegState => {
  const explicit = normalizeResult(leg.outcome.resolvedResult);
  if (explicit === "void") return "void";
  if (explicit === "push") return "push";
  if (explicit === "win") return "win";
  if (explicit === "lose") return "lose";
  if (leg.market.isCanceled || leg.market.status === "CANCELED" || leg.market.voidReason) {
    return "void";
  }
  if (leg.market.status !== "RESOLVED" || !leg.market.resolvedOutcomeId) {
    return "pending";
  }
  return leg.market.resolvedOutcomeId === leg.outcomeId ? "win" : "lose";
};

const deriveOutcome = (states: LegState[]): SettlementOutcome => {
  if (states.some((state) => state === "pending")) return "pending";
  if (states.some((state) => state === "void" || state === "push")) return "void";
  if (states.every((state) => state === "win")) return "win";
  return "lose";
};

export const previewComboSettlement = async (params: { comboOrderId: string }) => {
  const combo = await prisma.comboOrder.findUnique({
    where: { id: params.comboOrderId },
    include: {
      legs: {
        include: {
          market: {
            select: {
              id: true,
              title: true,
              status: true,
              isCanceled: true,
              resolvedOutcomeId: true,
              voidReason: true,
            },
          },
          outcome: {
            select: {
              id: true,
              name: true,
              label: true,
              code: true,
              side: true,
              resolvedResult: true,
            },
          },
        },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!combo) {
    throw new MarketGuardError("Combo order not found.", 404);
  }

  const legPreviews = combo.legs.map((leg) => {
    const state = evaluateLeg(leg);
    return {
      legId: leg.id,
      marketId: leg.marketId,
      marketTitle: leg.market.title,
      marketStatus: leg.market.status,
      outcomeId: leg.outcomeId,
      outcomeName: leg.outcome.label ?? leg.outcome.name,
      line: leg.line,
      label: leg.label,
      price: leg.price.toString(),
      state,
    };
  });
  const outcome = deriveOutcome(legPreviews.map((leg) => leg.state));
  const payoutUSDC =
    outcome === "win"
      ? toMoney(combo.potentialPayout)
      : outcome === "void"
        ? toMoney(combo.stakeUSDC)
        : ZERO;
  const lockedToReleaseUSDC =
    combo.status === "OPEN" && outcome !== "pending" ? toMoney(combo.stakeUSDC) : ZERO;
  const blockers: string[] = [];
  if (combo.status !== "OPEN") blockers.push("COMBO_NOT_OPEN");
  if (outcome === "pending") blockers.push("LEGS_NOT_TERMINAL");

  return {
    comboOrderId: combo.id,
    userId: combo.userId,
    status: combo.status,
    stakeUSDC: combo.stakeUSDC.toString(),
    comboPrice: combo.comboPrice.toString(),
    potentialPayout: combo.potentialPayout.toString(),
    outcome,
    payoutUSDC: payoutUSDC.toString(),
    lockedToReleaseUSDC: lockedToReleaseUSDC.toString(),
    blockers,
    mutation: "none" as const,
    legs: legPreviews,
  };
};

export const settleComboOrder = async (params: { comboOrderId: string; actorUserId: string }) => {
  return prisma.$transaction(async (tx) => {
    const lockedRows = await tx.$queryRaw<Array<{
      id: string;
      userId: string;
      stakeUSDC: Prisma.Decimal;
      comboPrice: Prisma.Decimal;
      potentialPayout: Prisma.Decimal;
      status: string;
    }>>`
      SELECT "id", "userId", "stakeUSDC", "comboPrice", "potentialPayout", "status"
      FROM "ComboOrder"
      WHERE "id" = ${params.comboOrderId}
      FOR UPDATE
    `;
    const lockedCombo = lockedRows[0];
    if (!lockedCombo) {
      throw new MarketGuardError("Combo order not found.", 404);
    }
    if (lockedCombo.status !== "OPEN") {
      const existing = await tx.ledgerEntry.findUnique({
        where: { idempotencyKey: `combo-settle:${lockedCombo.id}` },
      });
      return {
        applied: false,
        comboOrderId: lockedCombo.id,
        status: lockedCombo.status,
        ledgerEntryId: existing?.id ?? null,
      };
    }

    const combo = await tx.comboOrder.findUniqueOrThrow({
      where: { id: lockedCombo.id },
      include: {
        legs: {
          include: {
            market: {
              select: {
                id: true,
                title: true,
                status: true,
                isCanceled: true,
                resolvedOutcomeId: true,
                voidReason: true,
              },
            },
            outcome: {
              select: {
                id: true,
                name: true,
                label: true,
                code: true,
                side: true,
                resolvedResult: true,
              },
            },
          },
          orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });
    const states = combo.legs.map(evaluateLeg);
    const outcome = deriveOutcome(states);
    if (outcome === "pending") {
      throw new MarketGuardError("All combo legs must be resolved, voided, or pushed before settlement.", 409);
    }

    const balanceRows = await tx.$queryRaw<Array<{ availableUSDC: Prisma.Decimal; lockedUSDC: Prisma.Decimal }>>`
      SELECT "availableUSDC", "lockedUSDC"
      FROM "UserBalance"
      WHERE "userId" = ${lockedCombo.userId}
      FOR UPDATE
    `;
    const balance = balanceRows[0];
    if (!balance || new Prisma.Decimal(balance.lockedUSDC).lt(lockedCombo.stakeUSDC)) {
      throw new MarketGuardError("Insufficient locked USDC for combo settlement.", 409);
    }

    const existing = await tx.ledgerEntry.findUnique({
      where: { idempotencyKey: `combo-settle:${lockedCombo.id}` },
    });
    if (existing) {
      return {
        applied: false,
        comboOrderId: lockedCombo.id,
        status: lockedCombo.status,
        ledgerEntryId: existing.id,
      };
    }

    const payoutUSDC =
      outcome === "win"
        ? toMoney(lockedCombo.potentialPayout)
        : outcome === "void"
          ? toMoney(lockedCombo.stakeUSDC)
          : ZERO;
    const status = outcome === "void" ? "VOIDED" : "SETTLED";
    const deltaAvailableUSDC = payoutUSDC;
    const deltaLockedUSDC = toMoney(lockedCombo.stakeUSDC).neg();
    const amountDelta = payoutUSDC.add(deltaLockedUSDC);

    await tx.comboOrder.update({
      where: { id: lockedCombo.id },
      data: { status },
    });
    const ledger = await tx.ledgerEntry.create({
      data: {
        userId: lockedCombo.userId,
        asset: "USDC",
        status: "APPLIED",
        reason: "MARKET_SETTLEMENT",
        operation: "OTHER",
        idempotencyKey: `combo-settle:${lockedCombo.id}`,
        referenceType: "ComboOrder",
        referenceId: lockedCombo.id,
        deltaAvailableUSDC,
        deltaLockedUSDC,
        amountDelta,
      },
    });
    await tx.userBalance.update({
      where: { userId: lockedCombo.userId },
      data: {
        version: { increment: 1 },
        availableUSDC: { increment: deltaAvailableUSDC },
        lockedUSDC: { decrement: lockedCombo.stakeUSDC },
      },
    });

    return {
      applied: true,
      comboOrderId: lockedCombo.id,
      status,
      outcome,
      payoutUSDC: payoutUSDC.toString(),
      lockedReleasedUSDC: lockedCombo.stakeUSDC.toString(),
      ledgerEntryId: ledger.id,
      actorUserId: params.actorUserId,
    };
  });
};
