import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const eventDetailSource = () => readFileSync("mobile/src/components/EventDetail.tsx", "utf8");

describe("Event Detail position trade actions", () => {
  test("routes Cash out through the generic Sell ticket instead of the dedicated cashout sheet", () => {
    const source = eventDetailSource();
    const cashOutActionIndex = source.indexOf("event-detail-position-cash-out");
    const cashOutActionBlock = source.slice(cashOutActionIndex, cashOutActionIndex + 600);

    expect(cashOutActionIndex).toBeGreaterThan(0);
    expect(cashOutActionBlock).toContain('openPositionTrade?.(position, "sell")');
    expect(cashOutActionBlock).toContain("event-detail-position-cash-out-generic-sell-ticket");
    expect(source).not.toContain("openCashoutPosition");
  });
});
