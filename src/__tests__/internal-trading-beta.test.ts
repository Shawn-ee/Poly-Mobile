import { CanonicalApiError } from "@/lib/canonicalApi";
import {
  assertTradingNotKilled,
  isInternalTradingAllowedForUser,
  requireInternalTradingUser,
} from "@/lib/internalTradingBeta";

const enabledFlags = {
  internalTradingBetaEnabled: true,
  tradingKillSwitch: false,
  allowlistEmails: ["allowed@test.local"],
};

describe("internal trading beta guards", () => {
  test("blocks when beta flag is disabled", () => {
    expect(() =>
      requireInternalTradingUser(
        { id: "u1", email: "allowed@test.local" },
        { ...enabledFlags, internalTradingBetaEnabled: false },
      ),
    ).toThrow(expect.objectContaining({ code: "TRADING_BETA_DISABLED" }) as CanonicalApiError);
  });

  test("blocks when trading kill switch is active", () => {
    expect(() => assertTradingNotKilled({ ...enabledFlags, tradingKillSwitch: true })).toThrow(
      expect.objectContaining({ code: "TRADING_KILL_SWITCH_ACTIVE" }) as CanonicalApiError,
    );
  });

  test("blocks non-allowlisted users", () => {
    expect(isInternalTradingAllowedForUser({ id: "u1", email: "other@test.local" }, enabledFlags)).toBe(false);
    expect(() => requireInternalTradingUser({ id: "u1", email: "other@test.local" }, enabledFlags)).toThrow(
      expect.objectContaining({ code: "TRADING_NOT_ALLOWLISTED" }) as CanonicalApiError,
    );
  });

  test("allows explicitly allowlisted users and admins when beta is enabled and kill switch is off", () => {
    expect(isInternalTradingAllowedForUser({ id: "u1", email: "allowed@test.local" }, enabledFlags)).toBe(true);
    expect(isInternalTradingAllowedForUser({ id: "admin", email: null, isAdmin: true }, enabledFlags)).toBe(true);
  });
});
