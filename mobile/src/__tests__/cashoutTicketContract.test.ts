import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const cashoutSource = () => readFileSync("mobile/src/components/CashoutTicket.tsx", "utf8");

describe("Cashout ticket retail contract", () => {
  test("keeps the cashout flow visually aligned with the retail swipe ticket", () => {
    const source = cashoutSource();

    expect(source).toContain("cashout-retail-reference-layout");
    expect(source).toContain("cashout-dark-panel-rounded-above-swipe");
    expect(source).toContain("cashout-red-swipe-area-fixed-bottom");
    expect(source).toContain("cashout-proceeds-large");
    expect(source).toContain("swipe-submit-handle-translate-y-");
    expect(source).toContain("Swipe up to cash out");
    expect(source).toContain("cashout-full-position");
    expect(source).toContain("cashout-current-price");
    expect(source).toContain("cashout-estimated-proceeds");
  });
});
