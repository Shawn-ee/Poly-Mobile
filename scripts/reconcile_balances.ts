import { reconcileBalances } from "@/server/services/opsReconciliation";

async function main() {
  const result = await reconcileBalances();
  if (result.pass) {
    console.info(`[reconcile:balances] PASS checkedUsers=${result.checkedUsers}`);
    return;
  }
  console.error(
    `[reconcile:balances] FAIL checkedUsers=${result.checkedUsers} mismatches=${result.mismatches.length}`
  );
  for (const mismatch of result.mismatches.slice(0, 50)) {
    console.error("[reconcile:balances] mismatch", mismatch);
  }
  process.exit(1);
}

main().catch((error) => {
  console.error("[reconcile:balances] fatal", error);
  process.exit(1);
});

