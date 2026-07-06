import fs from "node:fs/promises";
import path from "node:path";
import { loadPortfolioValueHistory } from "../mobile/src/services/portfolioValueHistoryService";
import type { PortfolioValueHistoryRange } from "../mobile/src/types";

const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/cycle-JY-portfolio-value-history-service-contract/cycle-JY-portfolio-value-history-service-contract.json";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function main() {
  const routeApi = {
    getPortfolioValueHistory: async (range: "1W") => ({
      range,
      ranges: ["1D", "1W", "1M", "All"] satisfies PortfolioValueHistoryRange[],
      source: "portfolio-value-history-route" as const,
      status: "ready" as const,
      generatedAt: "2026-07-06T12:00:00.000Z",
      lastUpdated: "2026-07-06T12:00:00.000Z",
      emptyState: null,
      points: [
        {
          timestamp: "2026-07-06T12:00:00.000Z",
          value: 140.86,
          cash: 40.8,
          positionsValue: 100.06,
          pnl: 37.9,
        },
      ],
    }),
  };

  const serverHistory = await loadPortfolioValueHistory({
    api: routeApi,
    range: "1W",
    cash: 100,
    positionsValue: 20,
    pnl: 5,
  });
  assert(serverHistory.source === "portfolio-value-history-route", "Expected route source when API succeeds.");
  assert(serverHistory.points[0]?.value === 140.86, "Expected route point value to survive service loading.");

  const fallbackHistory = await loadPortfolioValueHistory({
    api: {
      getPortfolioValueHistory: async () => {
        throw new Error("route unavailable");
      },
    },
    range: "1D",
    cash: 100,
    positionsValue: 25,
    pnl: 3,
    now: "2026-07-06T12:00:00.000Z",
  });
  assert(fallbackHistory.source === "deterministic-mobile-fallback", "Expected fallback source when route fails.");
  assert(fallbackHistory.points.length === 6, "Expected 1D fallback point count.");

  const summary = {
    pass: true,
    createdAt: new Date().toISOString(),
    scope: "portfolio value-history service route loading",
    serverRoute: {
      source: serverHistory.source,
      range: serverHistory.range,
      pointCount: serverHistory.points.length,
      lastValue: serverHistory.points.at(-1)?.value,
    },
    fallback: {
      source: fallbackHistory.source,
      range: fallbackHistory.range,
      pointCount: fallbackHistory.points.length,
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
