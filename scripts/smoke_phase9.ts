import { prisma } from "@/lib/db";
import { validateConfig } from "@/lib/config";
import {
  reconcileBalances,
  reconcilePublicMarkets,
  reconcileWithdrawals,
} from "@/server/services/opsReconciliation";
import { runPhase85Simulation } from "@/server/services/simulationPhase85";

async function main() {
  console.info("[smoke:phase9] start");

  const cfg = validateConfig(process.env);
  if (!cfg.ok && cfg.strict) {
    throw new Error(`Config invalid: ${cfg.errors.join("; ")}`);
  }
  console.info("[smoke:phase9] config", { env: cfg.env, strict: cfg.strict, warnings: cfg.warnings });

  await prisma.$queryRaw`SELECT 1`;
  console.info("[smoke:phase9] db connectivity ok");

  const [balances, markets, withdrawals] = await Promise.all([
    reconcileBalances(),
    reconcilePublicMarkets(),
    reconcileWithdrawals(),
  ]);
  console.info("[smoke:phase9] reconciliation", {
    balancesPass: balances.pass,
    marketsPass: markets.pass,
    withdrawalsPass: withdrawals.pass,
  });
  if (!balances.pass || !markets.pass || !withdrawals.pass) {
    throw new Error("One or more reconciliation checks failed");
  }

  const sim = await runPhase85Simulation({
    seed: `smoke-${Date.now()}`,
    userCount: 4,
    actionCount: 20,
    checkEvery: 5,
    initialBalanceUSDC: "200",
    verbose: false,
  });
  if (!sim.pass) {
    throw new Error(`Simulation failed: ${sim.failure?.reason ?? "unknown"}`);
  }
  console.info("[smoke:phase9] simulation pass", {
    fills: sim.fillsCount,
    trades: sim.tradesCount,
  });

  console.info("[smoke:phase9] PASS");
}

main()
  .catch((error) => {
    console.error("[smoke:phase9] FAIL", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

