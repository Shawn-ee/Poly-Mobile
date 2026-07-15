import { NextRequest } from "next/server";

const mockPrisma = {
  event: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  market: {
    create: jest.fn(),
    count: jest.fn(),
  },
};

jest.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

jest.mock("@/lib/orderbookPricing", () => ({
  getOutcomeQuotes: jest.fn().mockResolvedValue(new Map()),
}));

jest.mock("@/server/services/polymarketReferenceImport", () => ({
  parseReferenceReview: jest.fn().mockReturnValue({}),
}));

jest.mock("@/server/services/referenceQuoteSnapshots", () => ({
  getReferenceSummaryForMarket: jest.fn().mockResolvedValue(null),
}));

import { GET as listEvents } from "@/app/api/events/route";
import { GET as getEventDetail } from "@/app/api/events/[slug]/route";
import { getOutcomeQuotes } from "@/lib/orderbookPricing";
import { parseReferenceReview } from "@/server/services/polymarketReferenceImport";
import { getReferenceSummaryForMarket } from "@/server/services/referenceQuoteSnapshots";
import {
  createMarketsFromSportsTemplate,
  isSportsMarketTemplate,
} from "@/server/services/sportsMarketTemplates";

const now = new Date("2026-06-15T12:00:00.000Z");

const baseEvent = {
  id: "event-1",
  slug: "france-vs-argentina",
  title: "France vs Argentina",
  description: "Demo soccer event",
  category: "sports",
  sportKey: "soccer",
  leagueKey: "world_cup",
  eventType: "match",
  homeTeamName: "France",
  awayTeamName: "Argentina",
  startTime: now,
  status: "scheduled",
  source: null,
  externalEventId: null,
  externalSlug: null,
  image: null,
  imageUrl: null,
  icon: null,
  metadata: {},
  createdAt: now,
  updatedAt: now,
};

beforeEach(() => {
  mockPrisma.event.findMany.mockReset();
  mockPrisma.event.findUnique.mockReset();
  mockPrisma.market.create.mockReset();
  mockPrisma.market.count.mockReset();
  mockPrisma.market.count.mockResolvedValue(0);
  jest.mocked(getOutcomeQuotes).mockResolvedValue(new Map());
  jest.mocked(parseReferenceReview).mockReturnValue({});
  jest.mocked(getReferenceSummaryForMarket).mockResolvedValue(null);
});

describe("sports event market model", () => {
  test("GET /api/events applies sports filters and returns sports metadata", async () => {
    mockPrisma.event.findMany.mockResolvedValue([
      {
        ...baseEvent,
        markets: [{ status: "LIVE", title: "Match Winner", referenceMetadata: null }],
      },
    ]);
    mockPrisma.market.count.mockResolvedValueOnce(1);

    const response = await listEvents(
      new NextRequest("http://localhost/api/events?category=sports&sportKey=soccer&leagueKey=world_cup&status=scheduled"),
    );

    expect(response.status).toBe(200);
    expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              category: "sports",
              sportKey: { in: ["soccer", "soccer_fifa_world_cup"] },
              leagueKey: { in: ["world_cup", "soccer_fifa_world_cup"] },
              status: "scheduled",
            }),
          ]),
        }),
      }),
    );
    const body = await response.json();
    expect(body.events[0]).toMatchObject({
      slug: "france-vs-argentina",
      category: "sports",
      sportKey: "soccer",
      leagueKey: "world_cup",
      marketCount: 1,
      activeMarketCount: 1,
    });
  });

  test("GET /api/events/[slug] returns event detail with markets and outcomes", async () => {
    jest.mocked(getOutcomeQuotes).mockResolvedValue(
      new Map([
        [
          "home",
          { bestBid: 0.46, bestAsk: 0.5, bestBidSize: 120, bestAskSize: 90, mid: 0.48, spread: 0.04 },
        ],
      ]),
    );
    mockPrisma.event.findUnique.mockResolvedValue({
      ...baseEvent,
      liveStatus: "LIVE",
      period: "first_half",
      clock: "24:12",
      homeScore: 0,
      awayScore: 1,
      metadata: {
        liveStats: [{ statId: "possession", label: "Possession", home: "47", away: "53" }],
        chartHistory: [{ outcomeId: "home", timestamp: "2026-06-15T12:00:00.000Z", probability: 12 }],
      },
      _count: { markets: 1 },
      markets: [
        {
          id: "market-1",
          title: "Match Winner",
          description: "Who will win?",
          status: "LIVE",
          marketGroupKey: "game-lines",
          marketGroupTitle: "Game Lines",
          displayOrder: 0,
          line: null,
          unit: null,
          period: "regulation",
          participantType: null,
          participantName: null,
          participantId: null,
          propCategory: null,
          resolveTime: null,
          rulesText: null,
          sourceUpdatedAt: now,
          createdAt: now,
          outcomeSnapshots: [
            { outcomeId: "home", ts: new Date("2026-06-15T12:05:00.000Z"), price: "0.48" },
            { outcomeId: "away", ts: new Date("2026-06-15T12:05:00.000Z"), price: "0.52" },
          ],
          outcomes: [
            { id: "home", name: "France", code: "HOME", side: "home", displayOrder: 0, status: "active", isTradable: true, referenceTokenId: null, referenceOutcomeLabel: null, metadata: {} },
            { id: "draw", name: "Draw", code: "DRAW", side: "draw", displayOrder: 1, status: "active", isTradable: true, referenceTokenId: null, referenceOutcomeLabel: null, metadata: {} },
            { id: "away", name: "Argentina", code: "AWAY", side: "away", displayOrder: 2, status: "active", isTradable: true, referenceTokenId: null, referenceOutcomeLabel: null, metadata: {} },
          ],
          event: baseEvent,
          category: null,
          tags: [],
          externalMarketId: null,
          conditionId: null,
          referenceSource: null,
          externalSlug: null,
          referenceMetadata: null,
          type: "MULTI_WINNER",
          marketType: "match_winner_1x2",
          kind: "ORDERBOOK",
          visibility: "PUBLIC",
          mechanism: "ORDERBOOK",
        },
      ],
    });
    mockPrisma.market.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    const response = await getEventDetail(new Request("http://localhost/api/events/france-vs-argentina"), {
      params: Promise.resolve({ slug: "france-vs-argentina" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.event).toMatchObject({
      slug: "france-vs-argentina",
      sportKey: "soccer",
      marketCount: 1,
      liveStats: [{ statId: "possession", label: "Possession", home: "47", away: "53" }],
      chartHistory: [
        { outcomeId: "home", timestamp: "2026-06-15T12:05:00.000Z", probability: 48 },
        { outcomeId: "away", timestamp: "2026-06-15T12:05:00.000Z", probability: 52 },
      ],
    });
    expect(body.markets[0]).toMatchObject({
      marketGroupId: "game-lines",
      marketGroupKey: "game-lines",
      marketGroupTitle: "Game Lines",
      marketType: "match_winner_1x2",
      period: "regulation",
      orderbookDepth: [
        { outcomeId: "home", side: "bid", price: 0.46, shares: 120, total: 55.2 },
        { outcomeId: "home", side: "ask", price: 0.5, shares: 90, total: 45 },
      ],
      outcomes: [
        { name: "France", code: "HOME", side: "home", bestBid: 0.46, bestAsk: 0.5 },
        { name: "Draw", code: "DRAW" },
        { name: "Argentina", code: "AWAY" },
      ],
    });
  });

  test("sports template guard accepts only known templates", () => {
    expect(isSportsMarketTemplate("MATCH_WINNER_1X2")).toBe(true);
    expect(isSportsMarketTemplate("PLAYER_PROP")).toBe(false);
  });

  test("MATCH_WINNER_1X2 creates one market with three outcomes", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(baseEvent);
    mockPrisma.market.create.mockResolvedValue({
      id: "market-1",
      outcomes: [{ code: "HOME" }, { code: "DRAW" }, { code: "AWAY" }],
    });

    const markets = await createMarketsFromSportsTemplate({
      eventId: "event-1",
      template: "MATCH_WINNER_1X2",
      createdBy: "admin-1",
    });

    expect(markets).toHaveLength(1);
    expect(mockPrisma.market.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          marketType: "match_winner_1x2",
          type: "MULTI_WINNER",
          outcomes: {
            create: expect.arrayContaining([
              expect.objectContaining({ name: "France", code: "HOME" }),
              expect.objectContaining({ name: "Draw", code: "DRAW" }),
              expect.objectContaining({ name: "Argentina", code: "AWAY" }),
            ]),
          },
        }),
      }),
    );
  });

  test("TOTAL_GOALS and BTTS templates create two-outcome binary markets", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(baseEvent);
    mockPrisma.market.create.mockResolvedValue({ id: "market-1", outcomes: [] });

    await createMarketsFromSportsTemplate({ eventId: "event-1", template: "TOTAL_GOALS_2_5" });
    await createMarketsFromSportsTemplate({ eventId: "event-1", template: "BOTH_TEAMS_TO_SCORE" });

    expect(mockPrisma.market.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          marketType: "total_goals",
          type: "BINARY",
          outcomes: {
            create: [
              expect.objectContaining({ name: "Over 2.5", code: "OVER_2_5" }),
              expect.objectContaining({ name: "Under 2.5", code: "UNDER_2_5" }),
            ],
          },
        }),
      }),
    );
    expect(mockPrisma.market.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          marketType: "both_teams_to_score",
          type: "BINARY",
          outcomes: {
            create: [
              expect.objectContaining({ name: "Yes", code: "YES" }),
              expect.objectContaining({ name: "No", code: "NO" }),
            ],
          },
        }),
      }),
    );
  });
});
