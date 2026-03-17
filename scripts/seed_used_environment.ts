import { generateUsedEnvironment } from "@/server/services/seedUsedEnvironment";

const getArg = (name: string, fallback?: string) => {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  if (!arg) return fallback;
  return arg.slice(prefix.length);
};

const hasFlag = (name: string) => process.argv.includes(`--${name}`);
const asOptionalNumber = (value: string | undefined) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

async function main() {
  const mode = (getArg("mode", "light") as "light" | "heavy") ?? "light";
  const seed = getArg("seed", `used-env-${mode}-001`)!;
  const reset = hasFlag("reset");
  const withWithdrawals = hasFlag("withWithdrawals")
    ? true
    : hasFlag("withoutWithdrawals")
      ? false
      : undefined;
  const withResolutions = hasFlag("withResolutions")
    ? true
    : hasFlag("withoutResolutions")
      ? false
      : undefined;
  const users = asOptionalNumber(getArg("users"));
  const publicMarkets = asOptionalNumber(getArg("publicMarkets"));
  const privateMarkets = asOptionalNumber(getArg("privateMarkets"));

  const summary = await generateUsedEnvironment({
    mode,
    seed,
    reset,
    withWithdrawals,
    withResolutions,
    users,
    publicMarkets,
    privateMarkets,
    verbose: !hasFlag("quiet"),
  });

  console.info("");
  console.info("===== Seed Used Environment Summary =====");
  console.info(`seed=${summary.seed}`);
  console.info(`mode=${summary.mode}`);
  console.info(`users ensured=${summary.users.ensured}/${summary.users.target} admin=${summary.users.adminUserId}`);
  console.info(
    `markets created public=${summary.markets.publicCreated} private=${summary.markets.privateCreated}`
  );
  console.info(
    `market states active=${summary.markets.active} resolved=${summary.markets.resolved} canceled=${summary.markets.canceled}`
  );
  console.info(
    `activity openOrders=${summary.activity.openOrders} fills=${summary.activity.fills} trades=${summary.activity.trades} poolBets=${summary.activity.poolBets}`
  );
  console.info(
    `withdrawals pending=${summary.withdrawals.pending} completed=${summary.withdrawals.completed} rejected=${summary.withdrawals.rejected}`
  );
  console.info(
    `reconcile balances=${summary.reconciliation.balances.pass} markets=${summary.reconciliation.markets.pass} withdrawals=${summary.reconciliation.withdrawals.pass}`
  );
  if (!summary.reconciliation.pass) {
    console.error("FAIL: reconciliation mismatch detected");
    console.error(JSON.stringify(summary.reconciliation, null, 2));
    process.exit(1);
  }
  console.info("PASS");
}

main().catch((error) => {
  console.error("[seed:used] fatal", error);
  process.exit(1);
});
