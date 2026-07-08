import { serializeEventSummary } from "@/server/services/eventReadModel";

const baseEvent = {
  id: "event-rules-base",
  slug: "event-rules-base",
  title: "Rules Home vs Rules Away",
  description: "World Cup backend market rules proof.",
  category: "Sports / Soccer",
  sportKey: "soccer",
  leagueKey: "world_cup",
  eventType: "match",
  homeTeamName: "Rules Home",
  awayTeamName: "Rules Away",
  startTime: new Date("2026-07-10T20:00:00.000Z"),
  status: "upcoming",
  liveStatus: null,
  period: null,
  clock: null,
  homeScore: null,
  awayScore: null,
  source: null,
  externalEventId: null,
  externalSlug: null,
  venue: null,
  image: null,
  imageUrl: null,
  icon: null,
  metadata: {},
  sourceUpdatedAt: null,
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  updatedAt: new Date("2026-07-01T00:00:00.000Z"),
};

const market = (overrides: Record<string, unknown>) => ({
  status: "LIVE",
  title: "Rules market",
  marketType: "moneyline",
  marketGroupKey: "main",
  marketGroupTitle: "Regulation Time Winner",
  period: "regulation",
  propCategory: null,
  outcomes: [],
  referenceMetadata: {},
  outcomeSnapshots: [],
  ...overrides,
});

describe("mobile event market rules contract", () => {
  test("emits display status for stale provider-dated live summaries", () => {
    const event = serializeEventSummary({
      ...baseEvent,
      startTime: null,
      status: "active",
      liveStatus: "LIVE",
      period: "Regulation",
      clock: null,
      externalSlug: "fifwc-arg-egy-2026-07-07",
      metadata: {
        mobileLiveDetail: {
          status: "stale",
          isStale: true,
          reason: "Latest provider update is older than 90 seconds.",
        },
      },
      markets: [market({})],
    });

    expect(event.displayStatus).toEqual({
      mobileStatus: "future",
      label: "Active",
      startsAt: "Time TBD",
      reason: "Latest provider update is older than 90 seconds.",
    });
  });

  test("emits regulation 90 profile with draw and line-market availability", () => {
    const event = serializeEventSummary({
      ...baseEvent,
      markets: [
        market({
          title: "Rules Home vs Rules Away - 90 Minute Winner",
          outcomes: [
            { side: "home", label: "Rules Home", name: "Rules Home" },
            { side: "draw", label: "Tie", name: "Tie" },
            { side: "away", label: "Rules Away", name: "Rules Away" },
          ],
        }),
        market({
          title: "Rules Home -1.5",
          marketType: "spread",
          marketGroupKey: "spread",
          marketGroupTitle: "Spread",
          outcomes: [
            { side: "home", label: "Rules Home -1.5", name: "Home spread" },
            { side: "away", label: "Rules Away +1.5", name: "Away spread" },
          ],
        }),
        market({
          title: "Total Goals 2.5",
          marketType: "total_goals",
          marketGroupKey: "totals",
          marketGroupTitle: "Totals",
          outcomes: [
            { side: "over", label: "Over 2.5", name: "Over" },
            { side: "under", label: "Under 2.5", name: "Under" },
          ],
        }),
      ],
    } as never);

    expect(event.marketProfile).toBe("regulation_90");
    expect(event.resultMode).toBe("can_draw");
    expect(event.gameRules).toMatchObject({ allowDraw: true, includesOvertime: false });
    expect(event.supportedMarketTypes).toEqual(expect.arrayContaining(["regulation_90", "spread", "totals"]));
    expect(event.supportedMarketTypes).not.toContain("to_advance");
  });

  test("emits separate advance and regulation availability for knockout profiles", () => {
    const event = serializeEventSummary({
      ...baseEvent,
      id: "event-rules-advance",
      slug: "event-rules-advance",
      title: "Advance Home vs Advance Away",
      markets: [
        market({
          title: "Advance Home vs Advance Away - 90 Minute Winner",
          marketGroupKey: "regulation-winner",
          marketGroupTitle: "Regulation Time Winner",
          outcomes: [
            { side: "home", label: "Advance Home", name: "Home" },
            { side: "draw", label: "Tie", name: "Tie" },
            { side: "away", label: "Advance Away", name: "Away" },
          ],
        }),
        market({
          title: "Advance Home vs Advance Away - To Advance",
          marketType: "to_advance",
          marketGroupKey: "to-advance",
          marketGroupTitle: "To Advance",
          period: "full-match",
          outcomes: [
            { side: "home", label: "Advance Home", name: "Home" },
            { side: "away", label: "Advance Away", name: "Away" },
          ],
        }),
      ],
    } as never);

    expect(event.marketProfile).toBe("full_match_with_overtime");
    expect(event.resultMode).toBe("can_draw");
    expect(event.gameRules).toMatchObject({ allowDraw: true, includesOvertime: true });
    expect(event.supportedMarketTypes).toEqual(expect.arrayContaining(["full_match_with_overtime", "to_advance", "regulation_90"]));
  });

  test("trusts normalized soccer metadata for imported binary provider match markets", () => {
    const event = serializeEventSummary({
      ...baseEvent,
      metadata: {
        normalizedSoccer: {
          marketProfile: "regulation_90",
          resultMode: "can_draw",
          gameRules: {
            allowDraw: true,
            includesOvertime: false,
            description: "Regulation-time soccer market can settle as home win, draw, or away win.",
          },
          supportedMarketTypes: ["regulation_90"],
        },
      },
      markets: [
        market({
          title: "Will Rules Home win on 2026-07-07?",
          marketType: "match_winner_1x2",
          outcomes: [
            { side: "yes", label: "Rules Home", name: "Yes" },
            { side: "no", label: "No", name: "No" },
          ],
        }),
        market({
          title: "Will Rules Home vs Rules Away end in a draw?",
          marketType: "match_winner_1x2",
          outcomes: [
            { side: "yes", label: "Draw (Rules Home vs Rules Away)", name: "Yes" },
            { side: "no", label: "No", name: "No" },
          ],
        }),
        market({
          title: "Will Rules Away win on 2026-07-07?",
          marketType: "match_winner_1x2",
          outcomes: [
            { side: "yes", label: "Rules Away", name: "Yes" },
            { side: "no", label: "No", name: "No" },
          ],
        }),
      ],
    } as never);

    expect(event.marketProfile).toBe("regulation_90");
    expect(event.resultMode).toBe("can_draw");
    expect(event.gameRules).toMatchObject({ allowDraw: true, includesOvertime: false });
    expect(event.supportedMarketTypes).toEqual(["regulation_90"]);
  });

  test("reconciles stale no-draw metadata when imported binary provider markets include draw", () => {
    const event = serializeEventSummary({
      ...baseEvent,
      metadata: {
        normalizedSoccer: {
          marketProfile: "full_match_with_overtime",
          resultMode: "no_draw",
          gameRules: {
            allowDraw: false,
            includesOvertime: true,
            description: "Stale imported metadata.",
          },
          supportedMarketTypes: ["full_match_with_overtime", "regulation_90"],
        },
      },
      markets: [
        market({
          title: "Will Rules Home win on 2026-07-07?",
          marketType: "match_winner_1x2",
          outcomes: [
            { side: "yes", label: "Rules Home", name: "Yes" },
            { side: "no", label: "No", name: "No" },
          ],
        }),
        market({
          title: "Will Rules Home vs Rules Away end in a draw?",
          marketType: "match_winner_1x2",
          outcomes: [
            { side: "yes", label: "Draw (Rules Home vs Rules Away)", name: "Yes" },
            { side: "no", label: "No", name: "No" },
          ],
        }),
        market({
          title: "Will Rules Away win on 2026-07-07?",
          marketType: "match_winner_1x2",
          outcomes: [
            { side: "yes", label: "Rules Away", name: "Yes" },
            { side: "no", label: "No", name: "No" },
          ],
        }),
      ],
    } as never);

    expect(event.marketProfile).toBe("regulation_90");
    expect(event.resultMode).toBe("can_draw");
    expect(event.gameRules).toMatchObject({ allowDraw: true, includesOvertime: false });
    expect(event.supportedMarketTypes).toEqual(["regulation_90"]);
  });
});
