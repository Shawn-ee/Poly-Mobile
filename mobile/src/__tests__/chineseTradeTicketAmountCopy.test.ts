import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("Chinese Trade Ticket amount copy", () => {
  test("routes visible amount-entry labels through localized copy", () => {
    const ticket = read("mobile/src/components/TradeTicket.tsx");
    const copy = read("mobile/src/localization/appCopy.ts");

    expect(ticket).toContain("t.chooseAmount");
    expect(ticket).toContain("t.toWin");
    expect(ticket).toContain("t.odds");
    expect(ticket).toContain("t.available");
    expect(ticket).toContain("t.tradingDisabledForMarket");
    expect(ticket).not.toContain('numericAmount <= 0 ? "Choose an amount"');
    expect(ticket).not.toContain(">to win <");
    expect(ticket).not.toContain("Odds {contractProbability}%");
    expect(ticket).not.toContain("available</Text>");

    expect(copy).toContain("\\u8bf7\\u9009\\u62e9\\u91d1\\u989d");
    expect(copy).toContain("\\u9884\\u8ba1\\u53ef\\u8d62");
    expect(copy).toContain("\\u6982\\u7387");
    expect(copy).toContain("\\u53ef\\u7528");
  });
});
