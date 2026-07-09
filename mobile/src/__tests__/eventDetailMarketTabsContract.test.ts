import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

describe("Event Detail market tabs contract", () => {
  test("hides inline market tabs when the sticky compact header is visible", () => {
    const source = readFileSync("mobile/src/components/EventDetail.tsx", "utf8");

    expect(source).toContain("{renderMarketTabs(\"sticky\")}");
    expect(source).toContain("{!isOutrightEvent && !compactHeaderVisible && renderMarketTabs()}");
  });
});
