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
        savedEventIds: ["mexico-ecuador"],
      }),
    ).toEqual({
      locale: "zh",
      ticketDefaultAmount: "500",
      ticketDefaultSide: "SELL",
      savedEventIds: ["mexico-ecuador"],
    });
  });

  test("maps server preferences back to local app state", () => {
    expect(
      fromProfilePreferencesPayload({
        locale: "en",
        ticketDefaultAmount: "100",
        ticketDefaultSide: "BUY",
        savedEventIds: ["world-cup-winner"],
      }),
    ).toEqual({
      locale: "en",
      ticketDefaultAmount: "100",
      ticketDefaultSide: "buy",
      savedEventIds: ["world-cup-winner"],
    });
  });
});
