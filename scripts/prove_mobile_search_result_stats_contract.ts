import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-LE-search-result-stats-contract/cycle-LE-search-result-stats-contract.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const searchSource = readFileSync("mobile/src/components/SearchScreen.tsx", "utf8");

const checks = {
  removesFrontendInventedVolumeLiquidity:
    !searchSource.includes("8200 +") &&
    !searchSource.includes("4200 +") &&
    !searchSource.includes("outcomeCount *") &&
    !searchSource.includes("t.volume") &&
    !searchSource.includes("t.liquidity"),
  removesVisibleChatCount:
    !searchSource.includes("Chat {") &&
    !searchSource.includes("420 +") &&
    !searchSource.includes("today</Text>"),
  keepsRouteBackedSearchRowActions:
    searchSource.includes("search-result-") &&
    searchSource.includes("save-event-") &&
    searchSource.includes("event.startsAt") &&
    searchSource.includes("topOutcome.probability"),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Search result stats contract proof failed: ${name}`);
}

const summary = {
  cycle: "LE",
  scope: "search-result-stats-contract",
  generatedAt: new Date().toISOString(),
  pass: true,
  decision:
    "Search results no longer display frontend-invented volume, liquidity, today-volume, or chat counts. Rows keep backend/search-route event identity, start time, top outcome, save action, and navigation.",
  checks,
  evidence: {
    searchScreen: "mobile/src/components/SearchScreen.tsx",
    test: "mobile/src/__tests__/searchResultStatsContract.test.ts",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
