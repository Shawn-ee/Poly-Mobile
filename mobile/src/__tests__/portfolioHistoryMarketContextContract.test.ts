import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const portfolioSource = () => readFileSync("mobile/src/components/Portfolio.tsx", "utf8");

describe("Portfolio history market context", () => {
  test("derives event and market context for backend titles shaped as event colon market", () => {
    const source = portfolioSource();

    expect(source).toContain("splitBackendMarketTitle");
    expect(source).toContain('title.split(":")');
    expect(source).toContain("portfolio-history-event-context-${activityEventSubline(activity)}");
    expect(source).toContain("portfolio-history-market-context-${activityMarketSubline(activity)}");
    expect(source).toContain("splitBackendMarketTitle(activity.title)?.marketTitle ?? \"Match Winner\"");
  });

  test("shows selected spread outcome labels instead of generic spread titles", () => {
    const source = portfolioSource();
    const spreadBlock = source.slice(
      source.indexOf('if (item.selection?.marketType === "spread" && line)'),
      source.indexOf('if (item.selection?.marketType === "team-total" && line)'),
    );

    expect(spreadBlock).toContain("item.selection.referenceOutcomeLabel");
    expect(spreadBlock).toContain("!/^yes$|^no$|^spread$/i.test(outcomeLabel)");
    expect(spreadBlock).toContain("outcomeLabel.includes(line) ? outcomeLabel : `${outcomeLabel} ${line}`");
    expect(source).toContain("portfolio-history-visible-label-${activityDisplayTitle(activity)}");
    expect(source).toContain("portfolio-position-visible-label-${displayPositionChoice(position)}");
    expect(source).toContain("open-order-visible-label-${openOrderDisplayTitle(order)}");
  });

  test("renders realized positive history amounts like retail winnings", () => {
    const source = portfolioSource();

    expect(source).toContain("isPositiveRealizedActivity");
    expect(source).toContain("activityAmountDisplay");
    expect(source).toContain("portfolio-history-realized-positive");
    expect(source).toContain("activityAmountPositive");
  });
});
