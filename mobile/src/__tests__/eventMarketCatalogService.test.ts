import { describe, expect, test, vi } from "vitest";
import { loadEventMarketCatalog } from "../services/eventMarketCatalogService";
import type { Market as BackendMarket } from "../types";
import type { Market } from "../mocks/worldCup";

const backendMarket = (overrides: Partial<BackendMarket>): BackendMarket => ({
  id: overrides.id ?? "market-1",
  title: overrides.title ?? "Spread",
  description: overrides.description ?? null,
  status: overrides.status ?? "LIVE",
  outcomes: overrides.outcomes ?? [
    {
      id: "home",
      name: "Home -1.5",
      label: "Home -1.5",
      side: "home",
      price: 0.52,
      bestBid: 0.51,
      bestAsk: 0.53,
      isTradable: true,
    },
    {
      id: "away",
      name: "Away +1.5",
      label: "Away +1.5",
      side: "away",
      price: 0.48,
      bestBid: 0.47,
      bestAsk: 0.49,
      isTradable: true,
    },
  ],
  event: null,
  rulesText: overrides.rulesText ?? null,
  marketGroupTitle: overrides.marketGroupTitle ?? "Spread",
  marketType: overrides.marketType ?? "spread",
  period: overrides.period ?? "regulation",
  line: overrides.line ?? "1.5",
  propCategory: overrides.propCategory ?? null,
  ...overrides,
});

const fallbackMarket: Market = {
  id: "fallback-spread",
  title: "Fallback Spread",
  zhTitle: "Fallback Spread",
  type: "game-line",
  marketType: "spread",
  period: "regulation",
  line: "0.5",
  outcomes: [
    { id: "yes", label: "Yes", zhLabel: "Yes", probability: 50, color: "#22c55e" },
    { id: "no", label: "No", zhLabel: "No", probability: 50, color: "#ef4444" },
  ],
};

describe("eventMarketCatalogService", () => {
  test("loads and normalizes Event Detail markets from the backend route", async () => {
    const getEventMarkets = vi.fn(async () => ({
      markets: [
        backendMarket({ id: "spread-15", marketType: "spread", period: "regulation", line: "1.5" }),
        backendMarket({ id: "total-25", title: "Total goals 2.5", marketType: "total_goals", period: "full-game", line: "2.5" }),
      ],
    }));

    const result = await loadEventMarketCatalog({
      api: { getEventMarkets },
      slug: "mex-eng",
      fallbackMarkets: [fallbackMarket],
    });

    expect(getEventMarkets).toHaveBeenCalledWith("mex-eng");
    expect(result.source).toBe("server-route");
    expect(result.markets.map((market) => ({
      id: market.id,
      marketType: market.marketType,
      period: market.period,
      line: market.line,
    }))).toEqual([
      { id: "spread-15", marketType: "spread", period: "regulation", line: "1.5" },
      { id: "total-25", marketType: "totals", period: "full-game", line: "2.5" },
    ]);
  });

  test("does not invent markets when the backend route succeeds with no rows", async () => {
    const result = await loadEventMarketCatalog({
      api: { getEventMarkets: vi.fn(async () => ({ markets: [] })) },
      slug: "empty-event",
      fallbackMarkets: [fallbackMarket],
    });

    expect(result).toEqual({ source: "server-route", markets: [] });
  });

  test("drops closed backend markets before Event Detail can render or tap them", async () => {
    const result = await loadEventMarketCatalog({
      api: {
        getEventMarkets: vi.fn(async () => ({
          markets: [
            backendMarket({ id: "closed-provider-total", status: "CLOSED", title: "Total Goals 2.5", marketType: "total_goals", line: "2.5" }),
            backendMarket({ id: "live-contract-total", status: "LIVE", title: "Total goals 2.5", marketType: "total_goals", line: "2.5" }),
          ],
        })),
      },
      slug: "spain-france",
      fallbackMarkets: [fallbackMarket],
    });

    expect(result.source).toBe("server-route");
    expect(result.markets.map((market) => market.id)).toEqual(["live-contract-total"]);
  });

  test("uses explicit local fallback only when route loading is unavailable", async () => {
    await expect(
      loadEventMarketCatalog({
        api: { getEventMarkets: vi.fn(async () => { throw new Error("offline"); }) },
        slug: "mex-eng",
        fallbackMarkets: [fallbackMarket],
      }),
    ).resolves.toEqual({ source: "local-fallback", markets: [fallbackMarket] });
  });
});
