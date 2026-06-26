import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { previewComboSettlement, settleComboOrder } from "@/server/services/comboSettlement";
import { applySportsMarketResolution } from "@/server/services/sportsMarketResolution";
import { resetPublicSchema } from "./dbTestUtils";

const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const createUser = async (name: string, isAdmin = false) =>
  prisma.user.create({
    data: {
      username: `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      email: `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.local`,
      isAdmin,
    },
  });

const createMarket = async (title: string) =>
  prisma.market.create({
    data: {
      title,
      description: `${title} test market`,
      status: "LIVE",
      mechanism: "ORDERBOOK",
      visibility: "PUBLIC",
      kind: "ORDERBOOK",
      isListed: true,
      outcomes: {
        create: [
          { name: "YES", slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-yes-${Math.random()}`, displayOrder: 0 },
          { name: "NO", slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-no-${Math.random()}`, displayOrder: 1 },
        ],
      },
    },
    include: { outcomes: true },
  });

const createLockedCombo = async (params: {
  userId: string;
  stakeUSDC?: string;
  potentialPayout?: string;
  legs: Array<{ marketId: string; outcomeId: string; label: string; price: string }>;
}) => {
  const stakeUSDC = dec(params.stakeUSDC ?? "10");
  await prisma.userBalance.upsert({
    where: { userId: params.userId },
    update: { availableUSDC: dec("90"), lockedUSDC: stakeUSDC },
    create: { userId: params.userId, availableUSDC: dec("90"), lockedUSDC: stakeUSDC },
  });
  return prisma.comboOrder.create({
    data: {
      userId: params.userId,
      stakeUSDC,
      comboPrice: dec("0.2"),
      potentialPayout: dec(params.potentialPayout ?? "50"),
      idempotencyKey: `combo-${Date.now()}-${Math.random()}`,
      requestFingerprint: `fingerprint-${Date.now()}-${Math.random()}`,
      legs: {
        create: params.legs.map((leg, index) => ({
          ...leg,
          price: dec(leg.price),
          displayOrder: index,
        })),
      },
    },
    include: { legs: true },
  });
};

describe("combo settlement", () => {
  beforeEach(async () => {
    await resetPublicSchema();
  });

  test("previews and settles an all-winning combo by releasing stake lock and crediting payout", async () => {
    const [admin, user] = await Promise.all([createUser("combo_admin", true), createUser("combo_user")]);
    const [winner, total] = await Promise.all([createMarket("Winner"), createMarket("Total")]);
    const combo = await createLockedCombo({
      userId: user.id,
      legs: [
        { marketId: winner.id, outcomeId: winner.outcomes[0].id, label: "ECU", price: "0.5" },
        { marketId: total.id, outcomeId: total.outcomes[0].id, label: "Over 2.5", price: "0.4" },
      ],
    });

    await applySportsMarketResolution({
      marketId: winner.id,
      actorUserId: admin.id,
      action: "resolve",
      winningOutcomeId: winner.outcomes[0].id,
      resolutionNote: "Internal drill result.",
    });
    await applySportsMarketResolution({
      marketId: total.id,
      actorUserId: admin.id,
      action: "resolve",
      winningOutcomeId: total.outcomes[0].id,
      resolutionNote: "Internal drill result.",
    });

    const preview = await previewComboSettlement({ comboOrderId: combo.id });
    expect(preview).toEqual(expect.objectContaining({
      outcome: "win",
      payoutUSDC: "50",
      lockedToReleaseUSDC: "10",
      blockers: [],
    }));

    const result = await settleComboOrder({ comboOrderId: combo.id, actorUserId: admin.id });
    expect(result).toEqual(expect.objectContaining({
      applied: true,
      status: "SETTLED",
      outcome: "win",
      payoutUSDC: "50",
    }));

    const [balance, settled, ledger] = await Promise.all([
      prisma.userBalance.findUniqueOrThrow({ where: { userId: user.id } }),
      prisma.comboOrder.findUniqueOrThrow({ where: { id: combo.id } }),
      prisma.ledgerEntry.findUniqueOrThrow({ where: { idempotencyKey: `combo-settle:${combo.id}` } }),
    ]);
    expect(balance.availableUSDC.toString()).toBe("140");
    expect(balance.lockedUSDC.toString()).toBe("0");
    expect(settled.status).toBe("SETTLED");
    expect(ledger.reason).toBe("MARKET_SETTLEMENT");
    expect(ledger.operation).toBe("OTHER");
    expect(ledger.deltaAvailableUSDC?.toString()).toBe("50");
    expect(ledger.deltaLockedUSDC?.toString()).toBe("-10");
  });

  test("settles a losing combo by consuming only the locked stake", async () => {
    const [admin, user] = await Promise.all([createUser("combo_admin", true), createUser("combo_user")]);
    const [winner, total] = await Promise.all([createMarket("Winner"), createMarket("Total")]);
    const combo = await createLockedCombo({
      userId: user.id,
      legs: [
        { marketId: winner.id, outcomeId: winner.outcomes[0].id, label: "ECU", price: "0.5" },
        { marketId: total.id, outcomeId: total.outcomes[0].id, label: "Over 2.5", price: "0.4" },
      ],
    });

    await applySportsMarketResolution({
      marketId: winner.id,
      actorUserId: admin.id,
      action: "resolve",
      winningOutcomeId: winner.outcomes[1].id,
    });
    await applySportsMarketResolution({
      marketId: total.id,
      actorUserId: admin.id,
      action: "resolve",
      winningOutcomeId: total.outcomes[0].id,
    });

    const result = await settleComboOrder({ comboOrderId: combo.id, actorUserId: admin.id });
    const balance = await prisma.userBalance.findUniqueOrThrow({ where: { userId: user.id } });
    expect(result).toEqual(expect.objectContaining({ status: "SETTLED", outcome: "lose", payoutUSDC: "0" }));
    expect(balance.availableUSDC.toString()).toBe("90");
    expect(balance.lockedUSDC.toString()).toBe("0");
  });

  test("voids and refunds the whole combo when any leg is pushed or voided", async () => {
    const [admin, user] = await Promise.all([createUser("combo_admin", true), createUser("combo_user")]);
    const [winner, spread] = await Promise.all([createMarket("Winner"), createMarket("Spread")]);
    const combo = await createLockedCombo({
      userId: user.id,
      legs: [
        { marketId: winner.id, outcomeId: winner.outcomes[0].id, label: "ECU", price: "0.5" },
        { marketId: spread.id, outcomeId: spread.outcomes[0].id, label: "ECU +1.5", price: "0.4" },
      ],
    });

    await applySportsMarketResolution({
      marketId: winner.id,
      actorUserId: admin.id,
      action: "resolve",
      winningOutcomeId: winner.outcomes[0].id,
    });
    await applySportsMarketResolution({
      marketId: spread.id,
      actorUserId: admin.id,
      action: "push",
      pushOutcomeId: spread.outcomes[0].id,
      resolutionNote: "Spread landed exactly on the line.",
    });

    const result = await settleComboOrder({ comboOrderId: combo.id, actorUserId: admin.id });
    const balance = await prisma.userBalance.findUniqueOrThrow({ where: { userId: user.id } });
    expect(result).toEqual(expect.objectContaining({ status: "VOIDED", outcome: "void", payoutUSDC: "10" }));
    expect(balance.availableUSDC.toString()).toBe("100");
    expect(balance.lockedUSDC.toString()).toBe("0");
  });

  test("blocks settlement until all combo legs are terminal and prevents duplicate settlement", async () => {
    const [admin, user] = await Promise.all([createUser("combo_admin", true), createUser("combo_user")]);
    const [winner, total] = await Promise.all([createMarket("Winner"), createMarket("Total")]);
    const combo = await createLockedCombo({
      userId: user.id,
      legs: [
        { marketId: winner.id, outcomeId: winner.outcomes[0].id, label: "ECU", price: "0.5" },
        { marketId: total.id, outcomeId: total.outcomes[0].id, label: "Over 2.5", price: "0.4" },
      ],
    });

    await applySportsMarketResolution({
      marketId: winner.id,
      actorUserId: admin.id,
      action: "resolve",
      winningOutcomeId: winner.outcomes[0].id,
    });
    await expect(settleComboOrder({ comboOrderId: combo.id, actorUserId: admin.id }))
      .rejects.toThrow("All combo legs must be resolved");

    await applySportsMarketResolution({
      marketId: total.id,
      actorUserId: admin.id,
      action: "resolve",
      winningOutcomeId: total.outcomes[0].id,
    });
    await settleComboOrder({ comboOrderId: combo.id, actorUserId: admin.id });
    const duplicate = await settleComboOrder({ comboOrderId: combo.id, actorUserId: admin.id });
    expect(duplicate).toEqual(expect.objectContaining({ applied: false, status: "SETTLED" }));
    expect(await prisma.ledgerEntry.count({ where: { referenceType: "ComboOrder", referenceId: combo.id } })).toBe(1);
  });

  test("metadata-only sports resolution refuses markets with normal orderbook exposure", async () => {
    const [admin, user] = await Promise.all([createUser("combo_admin", true), createUser("combo_user")]);
    const market = await createMarket("Winner");
    await prisma.position.create({
      data: {
        userId: user.id,
        marketId: market.id,
        outcomeId: market.outcomes[0].id,
        shares: dec("1"),
        avgCost: dec("0.5"),
      },
    });

    await expect(applySportsMarketResolution({
      marketId: market.id,
      actorUserId: admin.id,
      action: "resolve",
      winningOutcomeId: market.outcomes[0].id,
    })).rejects.toThrow("Use the orderbook settlement workflow");
  });
});
