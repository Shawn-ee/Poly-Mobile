import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const eventDetailSource = () => readFileSync("mobile/src/components/EventDetail.tsx", "utf8");

describe("Event Detail Exact Score copy", () => {
  test("uses ASCII cents copy to avoid Android mojibake in game lines", () => {
    const source = eventDetailSource();

    expect(source).toContain("event-detail-exact-score");
    expect(source).toContain("{[11, 14, 13, 16][index]}c");
    expect(source).not.toContain("{[11, 14, 13, 16][index]}\u00a2");
    expect(source).not.toMatch(/\u00c2\u00a2|\u00c3|\u00c2/);
  });
});
