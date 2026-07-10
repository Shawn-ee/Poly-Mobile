import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("cashout generic Sell ticket contract", () => {
  test("removes the dormant dedicated cashout sheet from the default mobile source", () => {
    expect(existsSync("mobile/src/components/CashoutTicket.tsx")).toBe(false);

    const app = read("mobile/App.tsx");
    const portfolio = read("mobile/src/components/Portfolio.tsx");
    const eventDetail = read("mobile/src/components/EventDetail.tsx");

    expect(app).not.toContain("CashoutTicket");
    expect(app).not.toContain("openCashoutPosition");
    expect(portfolio).not.toContain("openCashoutPosition");
    expect(eventDetail).not.toContain("openCashoutPosition");
  });

  test("keeps provider-winner cashout proof on the generic Sell ticket path", () => {
    const proof = read("scripts/prove_mobile_provider_winner_s23_visible_flow.ps1");

    expect(proof).toContain('"trade-ticket", "ticket-side-sell", "swipe-to-submit-order"');
    expect(proof).toContain('"Swipe to sell", \'$25\', "swipe-submit-gesture-required"');
    expect(proof).toContain('"cashout-ticket", "swipe-to-cashout", "Order Book", "Chat"');
    expect(proof).toContain("cycle-$Cycle-provider-winner-cashout-ticket-ready.xml");
    expect(proof).not.toContain('"cashout-ticket", "cashout-full-position"');
  });
});
