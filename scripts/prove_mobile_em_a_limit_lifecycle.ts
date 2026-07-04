import fs from "node:fs";
import path from "node:path";
import { buildTicketSelectionMetadata } from "@/server/services/ticketSelectionMetadata";
import { submitTicketOrder } from "../mobile/src/services/orderService";
import { loadPortfolioSnapshot } from "../mobile/src/services/portfolioSnapshotService";
import { canceledOrdersToActivity, recentTradesToActivity } from "../mobile/src/services/portfolioHistoryService";
import type { PolyApi } from "../mobile/src/api";
import type { PortfolioSnapshot } from "../mobile/src/types";

const OUTPUT_PATH = "docs/mobile/harness/cycle-EM-A-limit-lifecycle/proof.json";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const summaryPath = argValue("summaryPath") ?? argValue("output") ?? OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

const expectedLimit = {
  limitPrice: 0.44,
  limitSide: "ask",
  limitShares: 125.5,
} as const;

const selectedMarket = {
  id: "em-a-mexico-ecuador-total-3.5-2h",
  title: "Mexico vs Ecuador total 3.5 2H",
  zhTitle: "Mexico vs Ecuador total 3.5 2H",
  type: "game-line" as const,
  marketType: "totals",
  marketGroupId: "totals",
  line: "3.5",
  period: "2H",
  referenceSource: "polymarket",
  externalSlug: "em-a-mexico-ecuador-total",
  externalMarketId: "gamma-em-a-total",
  conditionId: "condition-em-a-total",
  outcomes: [],
};

const selectedOutcome = {
  id: "em-a-total-over",
  label: "Over 3.5 2H",
  zhLabel: "Over 3.5 2H",
  probability: 44,
  color: "#0a8f61",
  side: "over",
  referenceTokenId: "token-em-a-total-over",
  referenceOutcomeLabel: "Over 3.5",
};

const selectedSelection = {
  marketType: "totals" as const,
  marketId: selectedMarket.id,
  outcomeId: selectedOutcome.id,
  marketGroupId: "totals",
  line: "3.5",
  period: "2H",
  side: "over",
  displayLabel: "Over 3.5 2H",
  contractSide: "yes" as const,
  referenceSource: "polymarket",
  externalSlug: "em-a-mexico-ecuador-total",
  externalMarketId: "gamma-em-a-total",
  conditionId: "condition-em-a-total",
  referenceTokenId: "token-em-a-total-over",
  referenceOutcomeLabel: "Over 3.5",
  ...expectedLimit,
};

const assertLimitFields = (label: string, selection: Record<string, unknown> | null | undefined) => {
  for (const [field, expected] of Object.entries(expectedLimit)) {
    assert(selection?.[field] === expected, `${label}.${field} expected ${expected}, got ${String(selection?.[field])}`);
  }
};

const pickSelection = (selection: Record<string, unknown> | null | undefined) => ({
  marketId: selection?.marketId,
  outcomeId: selection?.outcomeId,
  marketType: selection?.marketType,
  marketGroupId: selection?.marketGroupId,
  line: selection?.line,
  period: selection?.period,
  side: selection?.side,
  displayLabel: selection?.displayLabel,
  contractSide: selection?.contractSide,
  referenceSource: selection?.referenceSource,
  externalSlug: selection?.externalSlug,
  externalMarketId: selection?.externalMarketId,
  conditionId: selection?.conditionId,
  referenceTokenId: selection?.referenceTokenId,
  referenceOutcomeLabel: selection?.referenceOutcomeLabel,
  limitPrice: selection?.limitPrice,
  limitSide: selection?.limitSide,
  limitShares: selection?.limitShares,
});

async function main() {
  const placeLimitOrder = async (input: unknown) => ({
    order: {
      id: "server-em-a-book-limit-open",
      status: "OPEN",
      size: "125.50",
      remaining: "125.50",
      selection: (input as { selection?: unknown }).selection,
    },
  });
  const api = { placeLimitOrder } as unknown as PolyApi;

  const orderResult = await submitTicketOrder({
    mode: "server",
    api,
    event: {
      id: "mexico-ecuador",
      title: "Mexico vs Ecuador",
      zhTitle: "Mexico vs Ecuador",
      league: "World Cup",
      startsAt: "Today 8:00 PM",
      status: "today",
      tag: "Group Stage",
      zhTag: "Group Stage",
      teams: [],
      markets: [],
    },
    market: selectedMarket,
    outcome: selectedOutcome,
    selection: selectedSelection,
    side: "buy",
    amount: 55.22,
  });
  assertLimitFields("orderResult.selection", orderResult.selection as Record<string, unknown>);

  const backendSelection = buildTicketSelectionMetadata({
    requestBody: { selection: selectedSelection },
    market: {
      id: selectedMarket.id,
      title: "Mexico vs Ecuador current fallback",
      marketGroupKey: "moneyline",
      marketType: "match_winner_1x2",
      line: null,
      period: "regulation",
      referenceSource: "polymarket",
      externalSlug: "fallback-slug",
      externalMarketId: "fallback-market",
      conditionId: "fallback-condition",
    },
    outcome: {
      id: selectedOutcome.id,
      name: "YES",
      label: "Fallback label",
      side: "home",
      referenceTokenId: "fallback-token",
      referenceOutcomeLabel: "Fallback",
    },
  });
  assertLimitFields("backendSelection", backendSelection);

  const portfolioSnapshot: PortfolioSnapshot = {
    walletAvailableUSDC: 10000,
    walletLockedUSDC: 55.22,
    walletTotalUSDC: 10055.22,
    walletBalance: 10055.22,
    totalValue: 55.22,
    totalCostBasis: 55.22,
    totalRealizedPnl: 0,
    totalPnl: 0,
    comboOrders: [],
    positions: [
      {
        market: {
          id: selectedMarket.id,
          title: selectedMarket.title,
          status: "ACTIVE",
          resolveTime: null,
          createdAt: "2026-07-04T12:00:00.000Z",
        },
        outcomeId: selectedOutcome.id,
        outcome: "YES",
        selection: backendSelection,
        shares: 125.5,
        avgCost: 0.44,
        currentPrice: 0.44,
        valueTokens: 55.22,
        costBasisTokens: 55.22,
        totalCostBasisTokens: 55.22,
        pnlTokens: 0,
      },
    ],
    openOrders: [
      {
        id: "server-em-a-book-limit-open",
        market: {
          id: selectedMarket.id,
          title: selectedMarket.title,
          status: "ACTIVE",
        },
        outcome: {
          id: selectedOutcome.id,
          name: "YES",
        },
        selection: backendSelection,
        side: "BUY",
        status: "OPEN",
        price: 0.44,
        size: 125.5,
        remaining: 125.5,
        reservedNotional: 55.22,
        createdAt: "2026-07-04T12:00:00.000Z",
        updatedAt: "2026-07-04T12:00:00.000Z",
      },
    ],
  };
  const portfolio = await loadPortfolioSnapshot({ getPortfolio: async () => portfolioSnapshot } as unknown as PolyApi);
  assertLimitFields("portfolio.positions[0].selection", portfolio.positions[0]?.selection as Record<string, unknown>);
  assertLimitFields("portfolio.openOrders[0].selection", portfolio.openOrders[0]?.selection as Record<string, unknown>);

  const recentTrade = recentTradesToActivity([
    {
      id: "trade-em-a-book-limit",
      market: { id: selectedMarket.id, title: selectedMarket.title, status: "ACTIVE" },
      outcome: { id: selectedOutcome.id, name: "YES" },
      selection: backendSelection,
      side: "BUY",
      shares: 125.5,
      cost: 55.22,
      fee: 0,
      createdAt: "2026-07-04T12:02:00.000Z",
    },
  ])[0];
  assertLimitFields("recentTrade.selection", recentTrade.selection as Record<string, unknown>);

  const canceledOrder = canceledOrdersToActivity([
    {
      id: "server-em-a-book-limit-open",
      market: { id: selectedMarket.id, title: selectedMarket.title, status: "ACTIVE" },
      outcome: { id: selectedOutcome.id, name: "YES" },
      selection: backendSelection,
      side: "BUY",
      status: "CANCELED",
      price: 0.44,
      size: 125.5,
      remaining: 125.5,
      canceledAt: "2026-07-04T12:03:00.000Z",
    },
  ])[0];
  assertLimitFields("canceledOrder.selection", canceledOrder.selection as Record<string, unknown>);

  const summary = {
    pass: true,
    proof: "EM-A Book-staged limit fields survive order creation, backend selection metadata, mobile portfolio snapshot mapping, and mobile history/activity mapping.",
    limitation: "This is a local service-contract proof, not an Android UI or live database route proof.",
    expectedLimit,
    orderResult: pickSelection(orderResult.selection as Record<string, unknown>),
    backendSelection: pickSelection(backendSelection),
    portfolioPosition: pickSelection(portfolio.positions[0]?.selection as Record<string, unknown>),
    portfolioOpenOrder: pickSelection(portfolio.openOrders[0]?.selection as Record<string, unknown>),
    recentTrade: pickSelection(recentTrade.selection as Record<string, unknown>),
    canceledOrder: pickSelection(canceledOrder.selection as Record<string, unknown>),
    assertions: {
      orderResultPreservesLimitFields: true,
      backendSelectionPreservesLimitFields: true,
      portfolioPositionPreservesLimitFields: true,
      portfolioOpenOrderPreservesLimitFields: true,
      recentTradePreservesLimitFields: true,
      canceledOrderPreservesLimitFields: true,
    },
  };

  const resolved = path.resolve(summaryPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
