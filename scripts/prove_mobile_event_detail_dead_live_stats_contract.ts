import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-LH-event-detail-dead-live-stats-contract/cycle-LH-event-detail-dead-live-stats-contract.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const source = readFileSync("mobile/src/components/EventDetail.tsx", "utf8");

const checks = {
  removesFakeLiveStatsPanel:
    !source.includes("event-detail-live-stats-panel") &&
    !source.includes("event-detail-live-stats-timeline") &&
    !source.includes("liveStatRows"),
  removesInventedSportsStats:
    !source.includes("Possession") &&
    !source.includes("Shots on target") &&
    !source.includes("Expected goals") &&
    !source.includes("Match flow") &&
    !source.includes("USA pressure"),
  keepsFocusedEventDetailSurface:
    source.includes("event-detail-game-lines") &&
    source.includes("event-detail-player-props") &&
    source.includes("event-detail-live-data-inline") &&
    source.includes("event-detail-primary-outcomes"),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Event Detail dead live stats contract proof failed: ${name}`);
}

const summary = {
  cycle: "LH",
  scope: "event-detail-dead-live-stats-contract",
  generatedAt: new Date().toISOString(),
  pass: true,
  decision:
    "Event Detail no longer carries the dead fake live sports stats panel or match-flow timeline. The MVP surface keeps backend route-status markers plus primary outcomes, Game Lines, and Player Props placeholder.",
  checks,
  evidence: {
    eventDetail: "mobile/src/components/EventDetail.tsx",
    test: "mobile/src/__tests__/eventDetailDeadLiveStatsContract.test.ts",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
