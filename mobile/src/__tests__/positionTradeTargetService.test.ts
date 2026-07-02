import { describe, expect, test } from "vitest";
import type { Position } from "../components/Portfolio";
import { worldCupEvents, worldCupFutures } from "../mocks/worldCup";
import { resolvePositionTradeTarget } from "../services/positionTradeTargetService";

const futurePosition: Position = {
  id: "server-world-cup-winner-France",
  mode: "server",
  marketId: "world-cup-winner",
  outcomeId: "france",
  title: "World Cup winner",
  outcome: "France",
  side: "buy",
  amount: 210,
  probability: 42,
  shares: 500,
};

describe("position trade target service", () => {
  test("resolves a futures position by market and outcome id", () => {
    const target = resolvePositionTradeTarget({
      position: futurePosition,
      futures: worldCupFutures,
      events: worldCupEvents,
    });

    expect(target).toMatchObject({
      market: { id: "world-cup-winner" },
      outcome: { id: "france", label: "France" },
    });
    expect(target?.event).toBeUndefined();
  });

  test("resolves an event-market position by title and outcome label fallback", () => {
    const target = resolvePositionTradeTarget({
      position: {
        ...futurePosition,
        marketId: undefined,
        outcomeId: undefined,
        title: "Match winner",
        outcome: "Mexico",
      },
      futures: worldCupFutures,
      events: worldCupEvents,
    });

    expect(target).toMatchObject({
      event: { id: "mexico-ecuador" },
      market: { id: "mexico-ecuador-winner" },
      outcome: { id: "mexico" },
    });
  });

  test("returns undefined when no matching market outcome exists", () => {
    expect(
      resolvePositionTradeTarget({
        position: { ...futurePosition, marketId: "missing", title: "Missing", outcome: "Nobody" },
        futures: worldCupFutures,
        events: worldCupEvents,
      }),
    ).toBeUndefined();
  });
});
