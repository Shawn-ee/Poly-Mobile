import fs from "node:fs/promises";
import path from "node:path";
import { recentTradesToActivity } from "../mobile/src/services/portfolioHistoryService";
import { loadPortfolioSnapshot } from "../mobile/src/services/portfolioSnapshotService";
import type { PolyApi } from "../mobile/src/api";

const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/cycle-JW-portfolio-activity-mapper-contract/cycle-JW-portfolio-activity-mapper-contract.json";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

const advanceSelection = {
  marketId: "mexico-england-advance",
  outcomeId: "mexico-advance",
  marketGroupId: "to-advance",
  marketType: "to_advance",
  period: "full-game",
  side: "home",
  displayLabel: "Who Advances",
  referenceSource: "polymarket",
  externalSlug: "mexico-england-advance",
  externalMarketId: "gamma-advance",
  conditionId: "condition-advance",
  referenceTokenId: "token-mexico-advance",
  referenceOutcomeLabel: "Mexico to advance",
};

async function main() {
  const groupedActivities = recentTradesToActivity([
    {
      id: "fill-1",
      orderId: "order-123",
      market: { id: "paraguay-france-total", title: "Paraguay vs. France", status: "LIVE" },
      outcome: { id: "over", name: "YES" },
      selection: {
        marketId: "paraguay-france-total",
        outcomeId: "over",
        marketGroupId: "live-game-lines",
        marketType: "totals",
        line: "2.5",
        period: "Reg. Time",
        side: "over",
        displayLabel: "Over 2.5 RT",
        referenceTokenId: "token-total-over",
        limitPrice: 0.46,
        limitSide: "ask",
      },
      side: "BUY",
      shares: 43.043478,
      cost: 19.8,
      fee: 0,
      createdAt: "2026-07-02T06:10:00.000Z",
    },
    {
      id: "fill-2",
      orderId: "order-123",
      market: { id: "paraguay-france-total", title: "Paraguay vs. France", status: "LIVE" },
      outcome: { id: "over", name: "YES" },
      selection: {
        marketId: "paraguay-france-total",
        outcomeId: "over",
        marketGroupId: "live-game-lines",
        marketType: "totals",
        line: "2.5",
        period: "Reg. Time",
        side: "over",
        displayLabel: "Over 2.5 RT",
        referenceTokenId: "token-total-over",
        limitPrice: 0.46,
        limitSide: "ask",
      },
      side: "BUY",
      shares: 60,
      cost: 27.6,
      fee: 0,
      createdAt: "2026-07-02T06:10:04.000Z",
    },
  ]);

  assert(groupedActivities.length === 1, "Expected multi-fill trades from one order to aggregate into one activity.");
  assert(groupedActivities[0]?.id === "trade-order-order-123", "Expected grouped activity id to use backend order id.");
  assert(groupedActivities[0]?.fillCount === 2, "Expected grouped activity to expose fillCount.");
  assert(
    Math.abs((groupedActivities[0]?.amount ?? 0) - 47.4) < 0.000001,
    "Expected grouped activity amount to sum fill cost.",
  );

  const advanceActivities = recentTradesToActivity([
    {
      id: "advance-trade-1",
      market: { id: "mexico-england-advance", title: "Mexico vs. England", status: "ACTIVE" },
      outcome: { id: "mexico-advance", name: "YES" },
      selection: advanceSelection,
      side: "BUY",
      shares: 1000,
      cost: 30,
      fee: 0,
      createdAt: "2026-07-02T06:10:00.000Z",
    },
  ]);

  assert(advanceActivities[0]?.selection?.marketType === "to_advance", "Expected activity mapper to preserve advance market type.");
  assert(advanceActivities[0]?.selection?.referenceTokenId === "token-mexico-advance", "Expected activity mapper to preserve provider token.");

  const api = {
    getPortfolio: async () => ({
      positions: [
        {
          market: {
            id: "mexico-england-advance",
            title: "Mexico vs. England",
            status: "ACTIVE",
            resolveTime: null,
            createdAt: "2026-06-01T12:00:00.000Z",
          },
          outcomeId: "mexico-advance",
          outcome: "YES",
          selection: advanceSelection,
          shares: 1000,
          avgCost: 0.03,
          currentPrice: 0.04,
          valueTokens: 40,
          costBasisTokens: 30,
          totalCostBasisTokens: 30,
          pnlTokens: 10,
        },
      ],
      openOrders: [],
    }),
  } as unknown as PolyApi;

  const snapshot = await loadPortfolioSnapshot(api);
  assert(snapshot.positions[0]?.selection?.marketType === "to_advance", "Expected snapshot mapper to preserve advance market type.");
  assert(snapshot.positions[0]?.selection?.displayLabel === "Who Advances", "Expected snapshot mapper to preserve advance display label.");

  const summary = {
    pass: true,
    createdAt: new Date().toISOString(),
    scope: "portfolio route mapper contract",
    groupedActivity: {
      id: groupedActivities[0]?.id,
      amount: groupedActivities[0]?.amount,
      shares: groupedActivities[0]?.shares,
      fillCount: groupedActivities[0]?.fillCount,
      marketType: groupedActivities[0]?.selection?.marketType,
      orderBacked: true,
    },
    advanceActivity: {
      marketType: advanceActivities[0]?.selection?.marketType,
      displayLabel: advanceActivities[0]?.selection?.displayLabel,
      providerToken: advanceActivities[0]?.selection?.referenceTokenId,
    },
    advancePosition: {
      marketType: snapshot.positions[0]?.selection?.marketType,
      displayLabel: snapshot.positions[0]?.selection?.displayLabel,
      providerToken: snapshot.positions[0]?.selection?.referenceTokenId,
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
