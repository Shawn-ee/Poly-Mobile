import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoPath = (path: string) => resolve(repoRoot, path);
const read = (path: string) => readFileSync(repoPath(path), "utf8");

describe("cashout generic Sell ticket contract", () => {
  test("uses TradeTicket close-position mode instead of a dormant separate sheet", () => {
    expect(existsSync(repoPath("mobile/src/components/CashoutTicket.tsx"))).toBe(false);

    const app = read("mobile/App.tsx");
    const ticket = read("mobile/src/components/TradeTicket.tsx");

    expect(app).not.toContain("CashoutTicket");
    expect(app).not.toContain("openCashoutPosition");
    expect(app).toContain("closePosition:");
    expect(app).toContain("availableShares: positionAvailableShares");
    expect(app).toContain("sizeShares: closeShares");
    expect(app).toContain("await api.getCashOutEstimate({");
    expect(app).toContain("await loadTicketQuotes(api, position.marketId, position.outcomeId)");
    expect(app).toContain("serverCashoutAvailableShares");
    expect(app).toContain("serverCashoutSellPrice");
    expect(app).toContain(": availablePositionShares(position)");
    expect(app).toContain("cashoutSellPriceFromQuote(latestCashoutQuote, fallbackPositionSellPrice)");
    expect(app).toContain("outcomeWithCashoutQuote(target.outcome, latestCashoutQuote)");
    expect(app).toContain("ticket.sourcePositionId &&");
    expect(app).toContain('ticket.side === "sell"');
    expect(app).toContain("ticket.closePosition || typeof ticket.selection?.limitShares === \"number\"");
    expect(app).toContain('const effectiveSide = hasClosePositionPayload ? "sell" : side;');
    expect(app).toContain("side: effectiveSide");
    expect(ticket).toContain("cashout-ticket-no-yes-no-selector");
    expect(ticket).toContain("cashout-max-owned-shares");
    expect(ticket).toContain("cashout-close-position-outcome");
  });

  test("cashout ticket is share/proceeds based, not wallet-balance based", () => {
    const ticket = read("mobile/src/components/TradeTicket.tsx");

    expect(ticket).toContain("cashout-share-quantity-display");
    expect(ticket).toContain("cashout-available-owned-shares");
    expect(ticket).toContain("estimatedProceeds");
    expect(ticket).toContain("closeAvailableShares.toFixed(6)");
    expect(ticket).toContain("numericAmount > closeAvailableShares");
    expect(ticket).toContain("const closePositionAvailableShares = (ticket: Ticket)");
    expect(ticket).toContain("ticket.selection?.limitShares");
    expect(ticket).toContain('ticket.sourcePositionId && ticket.side === "sell"');
    expect(ticket).toContain("function trimShareAmount");
    expect(ticket).toContain("trimShareAmount(closeAvailableShares)");
    expect(ticket).toContain('const effectiveSide = isClosePositionTicket ? "sell" : side;');
    expect(ticket).toContain("onSubmit={() => placeOrder(numericAmount, effectiveSide, contractSide)}");
    expect(ticket).not.toContain('closeAvailableShares.toFixed(6).replace(/\\.?0+$/, "")');
  });
});
