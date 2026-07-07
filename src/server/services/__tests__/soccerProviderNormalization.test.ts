import { describe, expect, test } from "vitest";
import {
  normalizePolymarketSoccerEvent,
  normalizePolymarketSoccerMarket,
  normalizedSoccerMetadata,
} from "@/server/services/soccerProviderNormalization";

describe("soccer provider normalization", () => {
  test("normalizes World Cup winner as an outright one-winner event", () => {
    const event = normalizePolymarketSoccerEvent({
      externalSlug: "world-cup-winner",
      title: "World Cup Winner",
      description: "Which team will win the 2026 FIFA World Cup?",
      tags: ["Soccer", "World Cup"],
    });

    expect(event).toMatchObject({
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "future",
      marketProfile: "outright",
      resultMode: "one_winner",
      homeTeamName: "World Cup",
      awayTeamName: "Winner",
    });
    expect(event.gameRules.allowDraw).toBe(false);
    expect(event.supportedMarketTypes).toEqual(["outright"]);
  });

  test("normalizes World Cup winner child markets as outright participant markets", () => {
    const event = normalizePolymarketSoccerEvent({
      externalSlug: "world-cup-winner",
      title: "World Cup Winner",
    });
    const market = normalizePolymarketSoccerMarket(event, {
      question: "Will England win the 2026 FIFA World Cup?",
      slug: "will-england-win-the-2026-fifa-world-cup-937",
      groupItemTitle: "England",
      outcomes: ["Yes", "No"],
    }, "England");

    expect(market).toMatchObject({
      marketType: "outright",
      marketGroupKey: "outrights",
      marketGroupTitle: "Outrights",
      period: "futures",
      participantType: "team",
      participantName: "England",
      participantId: "england",
    });
    expect(market.rules).toMatchObject({ template: "SOCCER_OUTRIGHT_WINNER" });
  });

  test("normalizes soccer award winner events as outright futures without pretending they are World Cup", () => {
    const event = normalizePolymarketSoccerEvent({
      externalSlug: "ballon-dor-winner-2026",
      title: "Ballon d'Or Winner 2026",
      tags: ["Soccer"],
    });
    const market = normalizePolymarketSoccerMarket(event, {
      question: "Will Kylian Mbappé win the 2026 Ballon d'Or?",
      slug: "will-kylian-mbapp-win-the-2026-ballon-dor",
      outcomes: ["Yes", "No"],
    }, "Kylian Mbappé");

    expect(event).toMatchObject({
      sportKey: "soccer",
      leagueKey: "soccer_awards",
      eventType: "future",
      marketProfile: "outright",
      resultMode: "one_winner",
      homeTeamName: "Ballon d'Or Winner 2026",
      awayTeamName: "Winner",
    });
    expect(market).toMatchObject({
      marketType: "outright",
      participantType: "player",
      participantName: "Kylian Mbappé",
    });
  });

  test("normalizes regulation match events as draw-allowed by default", () => {
    const event = normalizePolymarketSoccerEvent({
      externalSlug: "mexico-vs-england",
      title: "Mexico vs England",
      description: "World Cup match",
    });

    expect(event).toMatchObject({
      eventType: "match",
      marketProfile: "regulation_90",
      resultMode: "can_draw",
      homeTeamName: "Mexico",
      awayTeamName: "England",
    });
    expect(event.gameRules.allowDraw).toBe(true);
  });

  test("normalizes advance markets as no-draw", () => {
    const event = normalizePolymarketSoccerEvent({
      externalSlug: "mexico-vs-england-to-advance",
      title: "Mexico vs England to advance",
      description: "Which team advances?",
    });
    const market = normalizePolymarketSoccerMarket(event, {
      question: "Will England advance?",
      slug: "will-england-advance",
      outcomes: ["Yes", "No"],
    }, "England");

    expect(event).toMatchObject({ marketProfile: "to_advance", resultMode: "no_draw" });
    expect(market).toMatchObject({ marketType: "to_advance", marketGroupKey: "advance" });
  });

  test("normalizes penalty shootout markets as no-draw advance-style markets", () => {
    const event = normalizePolymarketSoccerEvent({
      externalSlug: "mexico-vs-england-penalty-shootout",
      title: "Mexico vs England penalty shootout",
      description: "Which team wins on penalties?",
    });

    expect(event).toMatchObject({
      marketProfile: "to_advance",
      resultMode: "no_draw",
    });
    expect(event.gameRules.allowDraw).toBe(false);
  });

  test("serializes normalized metadata for backend and bot consumers", () => {
    const event = normalizePolymarketSoccerEvent({
      externalSlug: "world-cup-winner",
      title: "World Cup Winner",
    });
    const market = normalizePolymarketSoccerMarket(event, {
      question: "Will France win the 2026 FIFA World Cup?",
      slug: "will-france-win-the-2026-fifa-world-cup-924",
    }, "France");

    expect(normalizedSoccerMetadata({ event, market })).toMatchObject({
      normalizedSoccer: {
        sportKey: "soccer",
        leagueKey: "world_cup",
        marketProfile: "outright",
        resultMode: "one_winner",
        market: {
          marketType: "outright",
          participantName: "France",
        },
      },
    });
  });
});
