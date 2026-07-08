import fs from "node:fs/promises";
import path from "node:path";
import {
  lineOptionsFor,
  matchingBackendLineMarket,
  periodOptionsFor,
} from "../mobile/src/services/marketLineOptionsService";
import type { Market } from "../mobile/src/mocks/worldCup";

const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/cycle-JX-line-options-contract/cycle-JX-line-options-contract.json";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

const market = (overrides: Partial<Market>): Market => ({
  id: overrides.id ?? "market",
  title: overrides.title ?? "Market",
  zhTitle: overrides.zhTitle ?? overrides.title ?? "Market",
  type: "game-line",
  outcomes: overrides.outcomes ?? [
    { id: "yes", label: "Yes", zhLabel: "Yes", probability: 52, color: "#0a8f61" },
    { id: "no", label: "No", zhLabel: "No", probability: 48, color: "#ef4444" },
  ],
  ...overrides,
});

async function main() {
  const markets = [
    market({ id: "spread-rt-05", marketType: "spread", period: "full-game", line: "0.5" }),
    market({ id: "spread-rt-15", marketType: "spread", period: "regulation", line: "1.5" }),
    market({ id: "spread-1h-05", marketType: "spread", period: "first-half", line: "0.5" }),
    market({ id: "provider-total-25", marketType: "total_goals" as Market["marketType"], period: "full-game", line: "2.5" }),
  ];

  const spreadPeriods = periodOptionsFor(markets, "spread");
  const spreadRegLines = lineOptionsFor(markets, "spread", "Reg. Time");
  const spreadFirstHalfLines = lineOptionsFor(markets, "spread", "1st Half");
  const spreadSecondHalfLines = lineOptionsFor(markets, "spread", "2nd Half");
  const totalsPeriods = periodOptionsFor(markets, "totals");
  const totalsRegLines = lineOptionsFor(markets, "totals", "Reg. Time");

  assert(JSON.stringify(spreadPeriods) === JSON.stringify(["Reg. Time", "1st Half"]), "Expected only backend-backed spread periods.");
  assert(JSON.stringify(spreadRegLines) === JSON.stringify(["0.5", "1.5"]), "Expected sorted backend-backed regulation spread lines.");
  assert(JSON.stringify(spreadFirstHalfLines) === JSON.stringify(["0.5"]), "Expected one backend-backed first-half spread line.");
  assert(spreadSecondHalfLines.length === 0, "Expected no invented second-half spread lines.");
  assert(matchingBackendLineMarket(markets, "spread", "1.5", "Reg. Time")?.id === "spread-rt-15", "Expected matching regulation spread market.");
  assert(matchingBackendLineMarket(markets, "spread", "1.5", "1st Half") === undefined, "Expected wrong-period spread market to be rejected.");
  assert(JSON.stringify(totalsPeriods) === JSON.stringify(["Reg. Time"]), "Expected provider totals alias to map to regulation totals.");
  assert(JSON.stringify(totalsRegLines) === JSON.stringify(["2.5"]), "Expected provider totals alias line.");
  assert(matchingBackendLineMarket(markets, "totals", "2.5", "Reg. Time")?.id === "provider-total-25", "Expected provider totals alias to match backend market.");

  const summary = {
    pass: true,
    createdAt: new Date().toISOString(),
    scope: "backend-backed line option availability",
    spread: {
      periods: spreadPeriods,
      regulationLines: spreadRegLines,
      firstHalfLines: spreadFirstHalfLines,
      secondHalfLines: spreadSecondHalfLines,
      regulationMatch: matchingBackendLineMarket(markets, "spread", "1.5", "Reg. Time")?.id,
      wrongPeriodRejected: matchingBackendLineMarket(markets, "spread", "1.5", "1st Half") === undefined,
    },
    totals: {
      periods: totalsPeriods,
      regulationLines: totalsRegLines,
      aliasMatch: matchingBackendLineMarket(markets, "totals", "2.5", "Reg. Time")?.id,
    },
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
