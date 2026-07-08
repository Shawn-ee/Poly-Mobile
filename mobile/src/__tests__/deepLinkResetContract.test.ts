import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const appSource = () => readFileSync("App.tsx", "utf8");

describe("deep link reset contract", () => {
  test("does not wipe forced Search/Home query launch state with the delayed reset", () => {
    const source = appSource();
    expect(source).toContain('const forcedSearchQuery = url.match(/[?&,]forceSearchQuery=([^&,]+)/)?.[1];');
    expect(source).toContain('const forcedHomeQuery = url.match(/[?&,]forceHomeQuery=([^&,]+)/)?.[1];');
    expect(source).toContain('const shouldForceSearch = url.includes("forceSearch=1");');
    expect(source).toContain("!forcedSearchQuery");
    expect(source).toContain("!forcedHomeQuery");
    expect(source).toContain("!shouldForceSearch");
    expect(source.indexOf("!forcedSearchQuery")).toBeLessThan(source.indexOf("setTimeout(resetRuntimeState, 750)"));
    expect(source.indexOf("!shouldForceSearch")).toBeLessThan(source.indexOf("setTimeout(resetRuntimeState, 750)"));
  });
});
