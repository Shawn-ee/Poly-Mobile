import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const marketListsSource = () => readFileSync("mobile/src/components/MarketLists.tsx", "utf8");

describe("Home card Chinese source copy", () => {
  test("uses Holiwyn-branded line copy instead of local/test-token wording", () => {
    const source = marketListsSource();

    expect(source).toContain("胜负: Polymarket / 盘口: 利云体育");
    expect(source).toContain("利云体育盘口");
    expect(source).not.toContain("盘口: 本地测试");
    expect(source).not.toContain("本地测试代币盘口");
    expect(source).toContain("home-card-source-local-test-fake-token");
  });
});
