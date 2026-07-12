import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("cashout generic Sell ticket contract", () => {
  test("uses TradeTicket close-position mode instead of a dormant separate sheet", () => {
    expect(existsSync("mobile/src/components/CashoutTicket.tsx")).toBe(false);

    const app = read("mobile/App.tsx");
    const ticket = read("mobile/src/components/TradeTicket.tsx");

    expect(app).not.toContain("CashoutTicket");
    expect(app).not.toContain("openCashoutPosition");
    expect(app).toContain("closePosition:");
    expect(app).toContain("availableShares: availablePositionShares(position)");
    expect(app).toContain("sizeShares: closeShares");
    expect(ticket).toContain("cashout-ticket-no-yes-no-selector");
    expect(ticket).toContain("cashout-max-owned-shares");
  });

  test("cashout ticket is share/proceeds based, not wallet-balance based", () => {
    const ticket = read("mobile/src/components/TradeTicket.tsx");

    expect(ticket).toContain("cashout-share-quantity-display");
    expect(ticket).toContain("cashout-available-owned-shares");
    expect(ticket).toContain("estimatedProceeds");
    expect(ticket).toContain("closeAvailableShares.toFixed(6)");
    expect(ticket).toContain("numericAmount > closeAvailableShares");
  });
});
