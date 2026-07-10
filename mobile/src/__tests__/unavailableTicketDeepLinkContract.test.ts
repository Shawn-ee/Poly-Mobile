import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const appSource = () => readFileSync("mobile/App.tsx", "utf8");

describe("unavailable Trade Ticket deep-link fixture", () => {
  test("opens a deterministic unavailable ticket for Android proof", () => {
    const source = appSource();

    expect(source).toContain("forceUnavailableTradeTicket=1");
    expect(source).toContain("shouldForceUnavailableTradeTicket");
    expect(source).toContain("!shouldForceUnavailableTradeTicket");
    expect(source).toContain('source: "local-mvp-proof"');
    expect(source).toContain('status: "unavailable" as const');
    expect(source).toContain('marketStatus: "PROOF_UNAVAILABLE"');
    expect(source).toContain("Proof market unavailable for read-only ticket validation.");
    expect(source).toContain("setTicket({");
    expect(source).toContain("selection: {");
  });
});
