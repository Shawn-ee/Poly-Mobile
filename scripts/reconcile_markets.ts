import { reconcilePublicMarkets } from "@/server/services/opsReconciliation";

async function main() {
  const result = await reconcilePublicMarkets();
  if (result.pass) {
    console.info(`[reconcile:markets] PASS checkedMarkets=${result.checkedMarkets}`);
    return;
  }
  console.error(
    `[reconcile:markets] FAIL checkedMarkets=${result.checkedMarkets} mismatches=${result.mismatches.length}`
  );
  for (const mismatch of result.mismatches.slice(0, 50)) {
    console.error("[reconcile:markets] mismatch", mismatch);
  }
  process.exit(1);
}

main().catch((error) => {
  console.error("[reconcile:markets] fatal", error);
  process.exit(1);
});

