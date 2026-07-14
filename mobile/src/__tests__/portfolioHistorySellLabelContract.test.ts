import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const portfolioSource = () =>
  readFileSync(join(process.cwd(), "mobile", "src", "components", "Portfolio.tsx"), "utf8");

describe("portfolio history sell label contract", () => {
  test("does not label every close-position sell as No", () => {
    const source = portfolioSource();
    expect(source).toContain('const activitySideLabel = (activity: PortfolioActivity) =>');
    expect(source).toContain('(activity.contractSide ?? activity.selection?.contractSide) === "no" ? "No" : "Yes"');
    expect(source).not.toContain('activity.side === "sell" ? "No"');
    expect(source).not.toContain('activity.side === "sell" ? "No" : "Yes"');
    expect(source).not.toContain('|| activity.side === "sell" ? "No"');
  });
});
