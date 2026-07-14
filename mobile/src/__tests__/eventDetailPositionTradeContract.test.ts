import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (path: string) => readFileSync(resolve(repoRoot, path), "utf8");
const eventDetailSource = () => read("mobile/src/components/EventDetail.tsx");

describe("Event Detail position trade actions", () => {
  test("routes Cash out through close-position TradeTicket mode", () => {
    const source = eventDetailSource();
    const app = read("mobile/App.tsx");
    const cashOutActionIndex = source.indexOf("event-detail-position-cash-out");
    const cashOutActionBlock = source.slice(cashOutActionIndex, cashOutActionIndex + 600);

    expect(cashOutActionIndex).toBeGreaterThan(0);
    expect(cashOutActionBlock).toContain('openPositionTrade?.(position, "sell")');
    expect(cashOutActionBlock).not.toContain("event-detail-position-cash-out-generic-sell-ticket");
    expect(app).toContain("closePosition:");
    expect(app).toContain("serverCashoutAvailableShares");
    expect(app).toContain("const positionAvailableShares = serverCashoutAvailableShares && serverCashoutAvailableShares > 0");
    expect(app).toContain(": availablePositionShares(position)");
    expect(app).toContain("availableShares: positionAvailableShares");
    expect(source).not.toContain("openCashoutPosition");
  });
});
