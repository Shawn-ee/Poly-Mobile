import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-LI-inactive-futures-surface-contract/cycle-LI-inactive-futures-surface-contract.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const appSource = readFileSync("mobile/App.tsx", "utf8");
const homeSource = readFileSync("mobile/src/components/HomeScreen.tsx", "utf8");
const marketListsSource = readFileSync("mobile/src/components/MarketLists.tsx", "utf8");

const checks = {
  removesInactiveHomeFuturesTab:
    !existsSync("mobile/src/components/WorldCupSegmented.tsx") &&
    !appSource.includes("worldCupTab") &&
    !appSource.includes("setWorldCupTab") &&
    !homeSource.includes("WorldCupTab"),
  removesInactiveHomeFuturesList:
    !existsSync("mobile/src/components/FeaturedFuture.tsx") &&
    !appSource.includes("futures={futures}") &&
    !homeSource.includes("futures: Market[]") &&
    !marketListsSource.includes("FutureList"),
  removesFrontendInventedFuturesChartAndStats:
    !marketListsSource.includes("futureCardStats") &&
    !marketListsSource.includes("futureOutcomeVolume") &&
    !marketListsSource.includes("future-market-chart"),
  keepsBackendDrivenHomeMatchCards:
    marketListsSource.includes("homeCardMarket(event)") &&
    marketListsSource.includes("usesAdvanceDisplay(event, winner)") &&
    marketListsSource.includes("event-card-retail-outcome-rail"),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Inactive Futures surface proof failed: ${name}`);
}

const summary = {
  cycle: "LI",
  scope: "inactive-futures-surface-contract",
  generatedAt: new Date().toISOString(),
  pass: true,
  decision:
    "The old Home Futures tab/list/chart surface is no longer wired into the visible app. Home keeps backend-driven match cards; Futures catalog browsing remains future scope unless backed by a route contract.",
  checks,
  evidence: {
    app: "mobile/App.tsx",
    homeScreen: "mobile/src/components/HomeScreen.tsx",
    marketLists: "mobile/src/components/MarketLists.tsx",
    test: "mobile/src/__tests__/inactiveFuturesSurfaceContract.test.ts",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
