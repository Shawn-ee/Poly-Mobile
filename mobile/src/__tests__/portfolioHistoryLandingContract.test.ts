import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const portfolioSource = () => readFileSync("mobile/src/components/Portfolio.tsx", "utf8");

describe("Portfolio history landing", () => {
  test("auto-focuses History for completed sell/close/cancel activity without hijacking buy positions", () => {
    const source = portfolioSource();
    const effectStart = source.indexOf('latestActivity?.action === "canceled"');
    const effectBlock = source.slice(effectStart, effectStart + 420);

    expect(effectStart).toBeGreaterThan(0);
    expect(effectBlock).toContain('latestActivity?.action === "sold"');
    expect(effectBlock).toContain('latestActivity?.action === "closed"');
    expect(effectBlock).toContain("openOrders.length === 0");
    expect(effectBlock).toContain('setActiveTab("history")');
    expect(effectBlock).not.toContain('latestActivity?.action === "opened"');
  });
});
