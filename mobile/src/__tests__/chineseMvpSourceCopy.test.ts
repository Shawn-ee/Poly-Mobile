import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("Chinese MVP source copy", () => {
  test("localizes Event Detail, Trade Ticket, and Portfolio source labels without hiding internal markers", () => {
    const eventDetail = read("mobile/src/components/EventDetail.tsx");
    const tradeTicket = read("mobile/src/components/TradeTicket.tsx");
    const portfolio = read("mobile/src/components/Portfolio.tsx");

    expect(eventDetail).toContain("\u5e02\u573a\u6765\u6e90");
    expect(eventDetail).toContain("\u80dc\u8d1f: Polymarket\u3002\u76d8\u53e3: \u5229\u4e91\u4f53\u80b2\u3002");
    expect(eventDetail).toContain("\u5229\u4e91\u4f53\u80b2\u76d8\u53e3");
    expect(eventDetail).toContain("line-source-local-test-fake-token");

    expect(tradeTicket).toContain("\u5229\u4e91\u4f53\u80b2\u76d8\u53e3");
    expect(tradeTicket).toContain("Polymarket \u5e02\u573a");
    expect(tradeTicket).toContain("ticket-local-test-pricing");

    expect(portfolio).toContain("\u6765\u6e90");
    expect(portfolio).toContain("Polymarket \u80dc\u8d1f / \u5229\u4e91\u4f53\u80b2\u76d8\u53e3");
    expect(portfolio).toContain("\u5229\u4e91\u4f53\u80b2\u76d8\u53e3");
    expect(portfolio).toContain("portfolio-local-test-pricing");
  });
});
