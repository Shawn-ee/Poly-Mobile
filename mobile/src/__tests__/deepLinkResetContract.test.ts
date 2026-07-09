import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const appSource = () => readFileSync("mobile/App.tsx", "utf8");

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

  test("re-applies forced Portfolio after reset so proof launches land on Portfolio", () => {
    const source = appSource();
    expect(source).toContain('const shouldForcePortfolio = url.includes("forcePortfolio=1");');
    expect(source).toContain("!shouldForcePortfolio");
    expect(source).toContain('if (shouldForcePortfolio) {');
    expect(source).toContain('setMainTab("portfolio");');
    expect(source).toContain("setTimeout(() => {");
    expect(source.indexOf("if (shouldForcePortfolio) {")).toBeLessThan(source.lastIndexOf('setMainTab("portfolio");'));
  });

  test("supports proof-only initial tab override when Expo Go does not deliver launch query params", () => {
    const source = appSource();
    expect(source).toContain("EXPO_PUBLIC_PROOF_INITIAL_TAB");
    expect(source).toContain("const PROOF_INITIAL_TAB");
    expect(source).toContain('const [mainTab, setMainTab] = useState<MainTab>(PROOF_INITIAL_TAB);');
  });
});
