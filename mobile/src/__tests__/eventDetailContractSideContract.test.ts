import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const source = () => readFileSync("mobile/src/components/EventDetail.tsx", "utf8");

describe("EventDetail contract-side identity", () => {
  test("trusts backend yes/no outcome side before index fallback", () => {
    const eventDetail = source();

    expect(eventDetail).toContain('if (outcome.side === "yes" || outcome.side === "no") return outcome.side;');
    expect(eventDetail).toContain('market.outcomes.findIndex((item) => item.id === outcome.id), "Outrights"');
  });
});
