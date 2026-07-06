import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath =
  process.argv.find((arg) => arg.startsWith("--summaryPath="))?.slice("--summaryPath=".length) ??
  "docs/mobile/harness/cycle-LF-event-detail-no-chat-stats-contract/cycle-LF-event-detail-no-chat-stats-contract.json";

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const source = readFileSync("mobile/src/components/EventDetail.tsx", "utf8");

const checks = {
  removesChatUi:
    !source.includes("event-detail-chat") &&
    !source.includes("chatPage") &&
    !source.includes("Message this market") &&
    !source.includes("3 traders typing"),
  removesInventedStats:
    !source.includes("stats.volume") &&
    !source.includes("stats.liquidity") &&
    !source.includes("stats.traders") &&
    !source.includes("event-detail-volume-hidden") &&
    !source.includes("event-detail-stats") &&
    !source.includes("18250") &&
    !source.includes("9400"),
  keepsFocusedEventDetailSurface:
    source.includes("event-detail-game-lines") &&
    source.includes("event-detail-player-props") &&
    source.includes("event-detail-market-summary") &&
    source.includes("event-detail-primary-outcomes"),
};

for (const [name, pass] of Object.entries(checks)) {
  assert(pass, `Event Detail no chat/stats proof failed: ${name}`);
}

const summary = {
  cycle: "LF",
  scope: "event-detail-no-chat-stats-contract",
  generatedAt: new Date().toISOString(),
  pass: true,
  decision:
    "Event Detail no longer carries chat UI or frontend-invented volume/liquidity/trader stats. The focused Event Detail surface keeps primary outcomes, Game Lines, Player Props placeholder, and backend market summary metadata.",
  checks,
  evidence: {
    eventDetail: "mobile/src/components/EventDetail.tsx",
    test: "mobile/src/__tests__/eventDetailNoChatStatsContract.test.ts",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
