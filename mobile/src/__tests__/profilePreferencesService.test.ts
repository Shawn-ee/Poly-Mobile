import { describe, expect, test } from "vitest";
import {
  fromProfilePreferencesPayload,
  toProfilePreferencesPayload,
} from "../services/profilePreferencesService";

describe("Holiwyn profile preferences service", () => {
  test("maps local preferences to the canonical server payload", () => {
    expect(
      toProfilePreferencesPayload({
        locale: "zh",
        ticketDefaultAmount: "500",
        ticketDefaultSide: "sell",
        ticketDefaultSlippage: "2%",
        savedEventIds: ["mexico-ecuador"],
      }),
    ).toEqual({
      locale: "zh",
      ticketDefaultAmount: "500",
      ticketDefaultSide: "SELL",
      ticketDefaultSlippage: "2%",
      savedEventIds: ["mexico-ecuador"],
    });
  });

  test("maps server preferences back to local app state", () => {
    expect(
      fromProfilePreferencesPayload({
        locale: "en",
        ticketDefaultAmount: "100",
        ticketDefaultSide: "BUY",
        ticketDefaultSlippage: "0.5%",
        savedEventIds: ["world-cup-winner"],
      }),
    ).toEqual({
      locale: "en",
      ticketDefaultAmount: "100",
      ticketDefaultSide: "buy",
      ticketDefaultSlippage: "0.5%",
      savedEventIds: ["world-cup-winner"],
    });
  });

  test("defaults missing server slippage to 1 percent for older profile payloads", () => {
    expect(
      fromProfilePreferencesPayload({
        locale: "en",
        ticketDefaultAmount: "100",
        ticketDefaultSide: "BUY",
        savedEventIds: [],
      }),
    ).toEqual({
      locale: "en",
      ticketDefaultAmount: "100",
      ticketDefaultSide: "buy",
      ticketDefaultSlippage: "1%",
      savedEventIds: [],
    });
  });
});
