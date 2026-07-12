import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const source = () => readFileSync("mobile/src/components/EventDetail.tsx", "utf8");

describe("EventDetail contract-side identity", () => {
  test("trusts backend yes/no outcome side before index fallback", () => {
    const eventDetail = source();

    expect(eventDetail).toContain('if (outcome.side === "yes" || outcome.side === "no") return outcome.side;');
    expect(eventDetail).toContain('market.outcomes.findIndex((item) => item.id === outcome.id), "Outrights"');
  });

  test("exposes regulation winner No-side tickets when provider binary markets include them", () => {
    const eventDetail = source();

    expect(eventDetail).toContain("const noOutcome = noOutcomeForMarket(selection.market);");
    expect(eventDetail).toContain("noTicketSelection: noOutcome ? orderBookTicketSelection");
    expect(eventDetail).toContain("no-selection ticket-source-");
  });

  test("renders multi-line spread and totals selectors as a horizontal tick rail", () => {
    const eventDetail = source();

    expect(eventDetail).toContain("selectable-line-tick-rail horizontal-scroll");
    expect(eventDetail).toContain("horizontal");
    expect(eventDetail).toContain("lineRailScroll");
  });
});
