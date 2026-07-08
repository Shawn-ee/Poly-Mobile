import { describe, expect, test } from "vitest";
import type { Position } from "../components/Portfolio";
import { buildPositionTradeTicketIdentity } from "../services/positionTradeTicketService";

const basePosition: Position = {
  id: "position-1",
  mode: "server",
  marketId: "arg-egy-spread-15",
  outcomeId: "arg-egy-spread-15-yes",
  title: "Argentina vs. Egypt",
  outcome: "ARG -1.5",
  side: "buy",
  amount: 25,
  probability: 52,
  shares: 48.08,
  contractSide: "yes",
  selection: {
    marketType: "spread",
    marketId: "arg-egy-spread-15",
    outcomeId: "arg-egy-spread-15-yes",
    line: "1.5",
    period: "Reg. Time",
    side: "yes",
    displayLabel: "ARG -1.5",
    contractSide: "yes",
    referenceSource: "contract-fixture",
  },
};

describe("position trade ticket identity", () => {
  test("preserves owned Yes contract identity for position sell tickets", () => {
    const identity = buildPositionTradeTicketIdentity(basePosition);

    expect(identity.contractSide).toBe("yes");
    expect(identity.selection).toMatchObject({
      marketId: "arg-egy-spread-15",
      outcomeId: "arg-egy-spread-15-yes",
      line: "1.5",
      period: "Reg. Time",
      side: "yes",
      displayLabel: "ARG -1.5",
      contractSide: "yes",
    });
  });

  test("preserves owned No contract identity without inventing a Yes ticket", () => {
    const identity = buildPositionTradeTicketIdentity({
      ...basePosition,
      outcomeId: "arg-egy-spread-15-no",
      outcome: "No - ARG -1.5",
      contractSide: "no",
      selection: {
        ...basePosition.selection!,
        outcomeId: "arg-egy-spread-15-no",
        side: "no",
        displayLabel: "ARG -1.5",
        contractSide: "no",
      },
    });

    expect(identity.contractSide).toBe("no");
    expect(identity.selection).toMatchObject({
      outcomeId: "arg-egy-spread-15-no",
      side: "no",
      contractSide: "no",
    });
  });

  test("falls back to Yes for legacy positions without explicit contract side", () => {
    const positionWithoutContractSide: Position = {
      ...basePosition,
      contractSide: undefined,
    };
    const identity = buildPositionTradeTicketIdentity({
      ...positionWithoutContractSide,
      selection: undefined,
    });

    expect(identity.contractSide).toBe("yes");
    expect(identity.selection).toBeUndefined();
  });
});
