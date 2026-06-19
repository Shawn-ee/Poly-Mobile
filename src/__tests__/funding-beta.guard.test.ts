import {
  FundingAccessError,
  assertAutoDepositCreditAllowed,
  assertFundingNotKilled,
  isInternalFundingAllowedForUser,
  requireInternalFundingUser,
} from "@/lib/fundingBeta";

const flags = {
  internalFundingBetaEnabled: true,
  fundingKillSwitch: false,
  allowAutoDepositCredit: true,
  allowlistEmails: ["internal@example.com"],
};

describe("funding beta guard", () => {
  test("anonymous funding access is blocked", () => {
    expect(() => requireInternalFundingUser(null, flags)).toThrow(FundingAccessError);
  });

  test("authenticated non-allowlisted users are blocked", () => {
    expect(
      isInternalFundingAllowedForUser({ id: "u1", email: "public@example.com" }, flags),
    ).toBe(false);
    expect(() =>
      requireInternalFundingUser({ id: "u1", email: "public@example.com" }, flags),
    ).toThrow("allowlisted");
  });

  test("allowlisted internal users are allowed when funding is enabled and kill switch is off", () => {
    const user = { id: "u1", email: "Internal@Example.com" };
    expect(isInternalFundingAllowedForUser(user, flags)).toBe(true);
    expect(requireInternalFundingUser(user, flags)).toEqual(user);
  });

  test("admins are allowed while funding beta is enabled", () => {
    expect(
      isInternalFundingAllowedForUser({ id: "admin", email: null, isAdmin: true }, flags),
    ).toBe(true);
  });

  test("funding beta disabled blocks allowlisted users", () => {
    expect(() =>
      requireInternalFundingUser(
        { id: "u1", email: "internal@example.com" },
        { ...flags, internalFundingBetaEnabled: false },
      ),
    ).toThrow("not enabled");
  });

  test("kill switch blocks funding mutations and auto-credit", () => {
    const killed = { ...flags, fundingKillSwitch: true };
    expect(() => assertFundingNotKilled(killed)).toThrow("temporarily disabled");
    expect(() => assertAutoDepositCreditAllowed(killed)).toThrow("temporarily disabled");
  });

  test("auto-credit flag blocks deposit monitor crediting", () => {
    expect(() =>
      assertAutoDepositCreditAllowed({ ...flags, allowAutoDepositCredit: false }),
    ).toThrow("Automatic deposit crediting is disabled");
  });
});
