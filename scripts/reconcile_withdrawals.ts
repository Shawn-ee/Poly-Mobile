import { reconcileWithdrawals } from "@/server/services/opsReconciliation";

async function main() {
  const result = await reconcileWithdrawals();
  if (result.pass) {
    console.info(
      `[reconcile:withdrawals] PASS checkedPendingUsers=${result.checkedPendingUsers} checkedRequests=${result.checkedRequests}`
    );
    return;
  }
  console.error(
    `[reconcile:withdrawals] FAIL checkedPendingUsers=${result.checkedPendingUsers} checkedRequests=${result.checkedRequests} mismatches=${result.mismatches.length}`
  );
  for (const mismatch of result.mismatches.slice(0, 50)) {
    console.error("[reconcile:withdrawals] mismatch", mismatch);
  }
  process.exit(1);
}

main().catch((error) => {
  console.error("[reconcile:withdrawals] fatal", error);
  process.exit(1);
});

