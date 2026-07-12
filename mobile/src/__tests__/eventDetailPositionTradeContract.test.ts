import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const eventDetailSource = () => readFileSync("mobile/src/components/EventDetail.tsx", "utf8");

describe("Event Detail position trade actions", () => {
  test("routes Cash out through close-position TradeTicket mode", () => {
    const source = eventDetailSource();
    const app = readFileSync("mobile/App.tsx", "utf8");
    const cashOutActionIndex = source.indexOf("event-detail-position-cash-out");
    const cashOutActionBlock = source.slice(cashOutActionIndex, cashOutActionIndex + 600);

    expect(cashOutActionIndex).toBeGreaterThan(0);
    expect(cashOutActionBlock).toContain('openPositionTrade?.(position, "sell")');
    expect(cashOutActionBlock).not.toContain("event-detail-position-cash-out-generic-sell-ticket");
    expect(app).toContain("closePosition:");
    expect(app).toContain("availableShares: availablePositionShares(position)");
    expect(source).not.toContain("openCashoutPosition");
  });
});
