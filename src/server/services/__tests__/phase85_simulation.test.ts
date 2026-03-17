import { prisma } from "@/lib/db";
import {
  runPhase85Simulation,
  validatePhase85Invariants,
} from "@/server/services/simulationPhase85";
import { resetPublicSchema } from "./dbTestUtils";

describe("Phase 8.5 simulation harness", () => {
  beforeEach(async () => {
    await resetPublicSchema();
  });

  test("deterministic seeded run completes with settlement reconciliation", async () => {
    const report = await runPhase85Simulation({
      seed: "phase85-test-seed",
      userCount: 6,
      actionCount: 50,
      checkEvery: 5,
      initialBalanceUSDC: "500",
      verbose: false,
    });

    expect(report.pass).toBe(true);
    expect(report.failure).toBeUndefined();
    expect(report.settlement.payoutConservationPass).toBe(true);
    expect(report.settlement.collateralZeroAfterPass).toBe(true);
    expect(report.settlement.positionsFinalizedPass).toBe(true);
  });

  test("invariant validator fails when market state is tampered", async () => {
    const report = await runPhase85Simulation({
      seed: "phase85-invariant-seed",
      userCount: 5,
      actionCount: 20,
      checkEvery: 4,
      initialBalanceUSDC: "200",
      verbose: false,
    });
    expect(report.pass).toBe(true);

    const market = await prisma.market.findUniqueOrThrow({
      where: { slug: "phase85-sim-phase85-invariant-seed" },
      include: { outcomes: { orderBy: { displayOrder: "asc" } } },
    });
    const user = await prisma.user.findFirstOrThrow({
      where: { username: { startsWith: "phase85_phase85-invariant-seed_u" } },
    });
    const yesOutcome = market.outcomes[0];

    await prisma.position.upsert({
      where: {
        userId_marketId_outcomeId: {
          userId: user.id,
          marketId: market.id,
          outcomeId: yesOutcome.id,
        },
      },
      update: { shares: { increment: "1.000000" } },
      create: {
        userId: user.id,
        marketId: market.id,
        outcomeId: yesOutcome.id,
        shares: "1.000000",
        avgCost: "0.500000",
      },
    });

    const simUsers = await prisma.user.findMany({
      where: { username: { startsWith: "phase85_phase85-invariant-seed_u" } },
      select: { id: true },
      orderBy: { username: "asc" },
    });

    await expect(
      validatePhase85Invariants({
        marketId: market.id,
        outcomeYesId: market.outcomes[0].id,
        outcomeNoId: market.outcomes[1].id,
        userIds: simUsers.map((u) => u.id),
      })
    ).rejects.toThrow();
  });
});

