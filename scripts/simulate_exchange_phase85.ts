import { runPhase85Simulation } from "@/server/services/simulationPhase85";

const getArg = (name: string, fallback?: string) => {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  if (!arg) return fallback;
  return arg.slice(prefix.length);
};

const hasFlag = (name: string) => process.argv.includes(`--${name}`);

async function main() {
  const seed = getArg("seed", "phase85-seed-001")!;
  const users = Number(getArg("users", "12"));
  const actions = Number(getArg("actions", "180"));
  const checkEvery = Number(getArg("checkEvery", "5"));
  const initial = getArg("initial", "2500")!;
  const withWithdrawals = hasFlag("withWithdrawals");
  const verbose = !hasFlag("quiet");

  console.info(`[phase85] starting seed=${seed} users=${users} actions=${actions} checkEvery=${checkEvery}`);
  const report = await runPhase85Simulation({
    seed,
    userCount: users,
    actionCount: actions,
    checkEvery,
    initialBalanceUSDC: initial,
    withWithdrawalScenario: withWithdrawals,
    verbose,
  });

  console.info("");
  console.info("===== Phase 8.5 Simulation Report =====");
  console.info(`seed: ${report.seed}`);
  console.info(`users: ${report.users}`);
  console.info(`actions requested/executed: ${report.actionsRequested}/${report.actionsExecuted}`);
  console.info(
    `action counts: MINT=${report.actionCounts.MINT} BUY=${report.actionCounts.BUY} SELL=${report.actionCounts.SELL} CANCEL=${report.actionCounts.CANCEL} HOLD=${report.actionCounts.HOLD}`
  );
  console.info(`fills/trades/openOrders: ${report.fillsCount}/${report.tradesCount}/${report.openOrdersCount}`);
  console.info(
    `pre-resolution: collateral=${report.preResolution.collateralUSDC} yes=${report.preResolution.outcomeYesShares} no=${report.preResolution.outcomeNoShares} invariant=${report.preResolution.invariantSummary}`
  );
  console.info(
    `settlement: winner=${report.settlement.winningOutcomeId} payout=${report.settlement.totalPoolPayout} collateralDebited=${report.settlement.collateralDebitedUSDC}`
  );
  console.info(
    `checks: invariantsRun=${report.invariantChecks.checksRun} payoutConservation=${report.settlement.payoutConservationPass} collateralZeroAfter=${report.settlement.collateralZeroAfterPass} positionsFinalized=${report.settlement.positionsFinalizedPass}`
  );
  console.info(
    `balances: minAvailable=${report.finalBalanceSummary.minAvailableUSDC} minLocked=${report.finalBalanceSummary.minLockedUSDC} anyNegative=${report.finalBalanceSummary.anyNegativeBalances} anyStuckLocksAfterSettlement=${report.finalBalanceSummary.anyStuckLocksAfterSettlement}`
  );
  if (report.withdrawals) {
    console.info(
      `withdrawals: pass=${report.withdrawals.pass} completed=${report.withdrawals.requestCompletedId} rejected=${report.withdrawals.requestRejectedId}`
    );
  }

  if (report.failure) {
    console.error("FAIL");
    console.error(`failure step=${report.failure.step} reason=${report.failure.reason}`);
    if (report.failure.lastAction) {
      console.error(
        `last action: step=${report.failure.lastAction.step} action=${report.failure.lastAction.action} user=${report.failure.lastAction.userId}`
      );
    }
    if (report.failure.invariantSnapshot) {
      console.error(`snapshot=${JSON.stringify(report.failure.invariantSnapshot, null, 2)}`);
    }
    process.exit(1);
  }

  console.info(report.pass ? "PASS" : "FAIL");
  if (!report.pass) process.exit(1);
}

main().catch((error) => {
  console.error("[phase85] fatal", error);
  process.exit(1);
});

