import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const marketListsSource = () => readFileSync("mobile/src/components/MarketLists.tsx", "utf8");

describe("MarketList Chinese source copy", () => {
  test("renders clean Chinese source labels through the exported readiness helper", () => {
    const source = marketListsSource();

    expect(source).toContain('const rawEventSourceReadiness');
    expect(source).toContain('export const eventSourceReadiness');
    expect(source).toContain("\\u80dc\\u8d1f: Polymarket / \\u76d8\\u53e3: \\u5229\\u4e91\\u4f53\\u80b2");
    expect(source).toContain("\\u5e02\\u573a: Polymarket");
    expect(source).toContain("\\u5229\\u4e91\\u4f53\\u80b2\\u76d8\\u53e3");
    expect(source).toContain('locale !== "zh"');
  });
});
