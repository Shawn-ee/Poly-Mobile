import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-LG-home-card-stats-contract/cycle-LG-home-card-stats-contract.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const homeSource = readFileSync("mobile/src/components/HomeScreen.tsx", "utf8");
const marketListsSource = readFileSync("mobile/src/components/MarketLists.tsx", "utf8");

const checks = {
  removesHomeCardLocalStats:
    !marketListsSource.includes("marketCardStats") &&
    !marketListsSource.includes("event-card-stats-hidden-local-mvp") &&
    !marketListsSource.includes("event-card-volume-") &&
    !marketListsSource.includes("event-card-liquidity-"),
  removesHomeStatsCopyContract:
    !homeSource.includes("statsCopy={{ volume: t.volume, liquidity: t.liquidity }}") &&
    !homeSource.includes("volume: string") &&
    !homeSource.includes("liquidity: string"),
  keepsBackendDrivenMatchCardOutcomes:
    marketListsSource.includes("homeCardMarket(event)") &&
    marketListsSource.includes("usesAdvanceDisplay(event, winner)") &&
    marketListsSource.includes("event-card-retail-outcome-rail"),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Home card stats contract proof failed: ${name}`);
}

const summary = {
  cycle: "LG",
  scope: "home-card-stats-contract",
  generatedAt: new Date().toISOString(),
  pass: true,
  decision:
    "Home match cards no longer attach frontend-invented volume/liquidity stats. The active Home flow keeps event-feed identity, backend-driven market profile selection, filters, pagination, and ticket navigation.",
  checks,
  evidence: {
    homeScreen: "mobile/src/components/HomeScreen.tsx",
    marketLists: "mobile/src/components/MarketLists.tsx",
    test: "mobile/src/__tests__/homeCardStatsContract.test.ts",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
