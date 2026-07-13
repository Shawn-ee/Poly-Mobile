import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const source = readFileSync(join(process.cwd(), "mobile/src/components/MarketLists.tsx"), "utf8");

describe("MarketLists retail ticket side contract", () => {
  test("home retail outcome buttons always open buy tickets", () => {
    const retailOpenCalls = source.match(/openTicket\([^;\n]+event,\s*"buy"\);/g) ?? [];

    expect(retailOpenCalls.length).toBeGreaterThanOrEqual(3);
    expect(source).not.toContain("openTicket(market, outcome, event);");
    expect(source).not.toContain("openTicket(winner, outcome, event);");
  });
});
