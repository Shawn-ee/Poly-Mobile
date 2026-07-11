import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("S23 unavailable ticket proof contract", () => {
  test("launches the deterministic read-only ticket and asserts disabled controls", () => {
    const pkg = read("mobile/package.json");
    const script = read("mobile/scripts/s23-unavailable-ticket-proof.ps1");

    expect(pkg).toContain("proof:s23:unavailable-ticket");
    expect(script).toContain("forceResetState=1&forceUnavailableTradeTicket=1");
    expect(script).toContain("ticket-market-status-visible");
    expect(script).toContain("ticket-readonly-market-state");
    expect(script).toContain("ticket-amount-entry-disabled");
    expect(script).toContain("ticket-availability-unavailable");
    expect(script).toContain("ticket-market-status-PROOF_UNAVAILABLE");
    expect(script).toContain("ticket-side-disabled-readonly");
    expect(script).toContain("ticket-preset-disabled-readonly");
    expect(script).toContain("ticket-keypad-readonly-disabled");
    expect(script).toContain("ticket-keypad-disabled-readonly");
    expect(script).toContain("Market unavailable");
    expect(script).toContain("Trading is disabled for this market.");
    expect(script).toContain("Stop-ProofNodeProcesses");
  });
});
