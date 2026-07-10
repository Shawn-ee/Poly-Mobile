import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const copySource = () => readFileSync("mobile/src/localization/appCopy.ts", "utf8");
const portfolioSource = () => readFileSync("mobile/src/components/Portfolio.tsx", "utf8");

describe("Demo trading copy contract", () => {
  test("keeps visible retail copy out of fake/mock wording while preserving hidden proof markers", () => {
    const copy = copySource();
    const portfolio = portfolioSource();

    expect(copy).toContain('balance: "Balance"');
    expect(copy).toContain("Place a trade to see it here.");
    expect(copy).toContain("Trading remains available during MVP testing.");
    expect(copy).toContain('tradingModeMock: "Local mode"');
    expect(copy).not.toContain('balance: "Demo balance"');
    expect(copy).not.toContain("Place a practice trade to see it here.");
    expect(copy).not.toContain("Demo trading stays available during MVP testing.");
    expect(copy).not.toContain('tradingModeMock: "Demo mode"');
    expect(copy).not.toContain("Fake balance");
    expect(copy).not.toContain("Place a mock trade");
    expect(copy).not.toContain("Showing local fake-token portfolio.");
    expect(copy).not.toContain("Fake-token trading stays available");
    expect(copy).not.toContain("Fake-token mock");

    expect(portfolio).toContain("fake-token-test");
    expect(portfolio).toContain("latest-order-snapshot");
    expect(portfolio).toContain("styles.a11yOnly");
    expect(portfolio).not.toContain("Demo trade");
    expect(portfolio).not.toContain("Fake-token test");
  });
});
