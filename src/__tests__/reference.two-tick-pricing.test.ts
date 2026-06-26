const mockPrisma = {
  market: {
    findUnique: jest.fn(),
  },
};

jest.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

import { getLatestReferenceQuotePlansForMarket } from "@/server/services/referenceQuoteSnapshots";

const fetchedAt = new Date();

const baseMarket = {
  id: "world-cup-market-1",
  referenceMetadata: {
    importStatus: "approved",
    referenceOnly: true,
    tradable: false,
    mmEnabled: true,
  },
  outcomes: [
    {
      id: "outcome-ecu",
      name: "ECU +1.5",
      displayOrder: 0,
      createdAt: new Date("2026-06-01T00:00:00.000Z"),
      isActive: true,
    },
  ],
  referenceQuoteSnapshots: [
    {
      marketId: "world-cup-market-1",
      outcomeId: "outcome-ecu",
      source: "polymarket",
      externalSlug: "ecuador-vs-germany-world-cup",
      externalMarketId: "pm-ecu-ger",
      conditionId: "cond-ecu-ger",
      tokenId: "tok-ecu-spread",
      outcomeLabel: "ECU +1.5",
      outcomePrice: 0.65,
      bestBid: 0.64,
      bestAsk: 0.66,
      spread: 0.02,
      lastTradePrice: 0.65,
      volume: 1200,
      volume24hr: 300,
      liquidity: 5000,
      liquidityClob: 2500,
      acceptingOrders: true,
      qualityStatus: "high_quality",
      mmEligible: true,
      reason: null,
      fetchedAt,
    },
  ],
};

describe("reference two-tick pricing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SYSTEM_LIQUIDITY_DRY_RUN;
    delete process.env.LIVE_SYSTEM_LIQUIDITY_ENABLED;
  });

  test("prices bot bid two ticks below reference bid and bot ask two ticks above reference ask", async () => {
    mockPrisma.market.findUnique.mockResolvedValue(baseMarket);

    const plans = await getLatestReferenceQuotePlansForMarket("world-cup-market-1");

    expect(plans).toHaveLength(1);
    expect(plans[0]).toMatchObject({
      referenceBid: 0.64,
      referenceAsk: 0.66,
      tickSize: "0.01",
      quoteOffsetTicks: 2,
      plannedBotBid: 0.62,
      plannedBotAsk: 0.68,
      quotePreviewAvailable: true,
      quotePlanEnabled: true,
      dryRun: true,
      liveOrdersEnabled: false,
    });
  });

  test("clamps two-tick prices to valid prediction-share bounds", async () => {
    mockPrisma.market.findUnique.mockResolvedValue({
      ...baseMarket,
      referenceQuoteSnapshots: [
        {
          ...baseMarket.referenceQuoteSnapshots[0],
          bestBid: 0.02,
          bestAsk: 0.98,
          spread: 0.02,
        },
      ],
    });

    const plans = await getLatestReferenceQuotePlansForMarket("world-cup-market-1");

    expect(plans[0]?.plannedBotBid).toBe(0.01);
    expect(plans[0]?.plannedBotAsk).toBe(0.99);
  });

  test("does not produce a quote preview when the reference book is missing", async () => {
    mockPrisma.market.findUnique.mockResolvedValue({
      ...baseMarket,
      referenceQuoteSnapshots: [
        {
          ...baseMarket.referenceQuoteSnapshots[0],
          bestBid: null,
          bestAsk: null,
          spread: null,
          reason: "reference_missing_book",
        },
      ],
    });

    const plans = await getLatestReferenceQuotePlansForMarket("world-cup-market-1");

    expect(plans[0]).toMatchObject({
      referenceBid: null,
      referenceAsk: null,
      plannedBotBid: null,
      plannedBotAsk: null,
      quotePreviewAvailable: false,
      quotePlanEnabled: false,
      reason: "reference_missing_book",
    });
  });
});
