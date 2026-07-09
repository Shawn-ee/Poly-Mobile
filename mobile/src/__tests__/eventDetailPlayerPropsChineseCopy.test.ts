import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const eventDetailSource = () => readFileSync("mobile/src/components/EventDetail.tsx", "utf8");
const copySource = () => readFileSync("mobile/src/localization/appCopy.ts", "utf8");

describe("Event Detail Player Props localized blank state", () => {
  test("uses app copy for tabs and the intentionally blank Player Props state", () => {
    const eventDetail = eventDetailSource();
    const copy = copySource();

    expect(eventDetail).toContain("t.gameLines");
    expect(eventDetail).toContain("t.playerProps");
    expect(eventDetail).toContain("t.playerPropsUnavailable");
    expect(eventDetail).not.toContain(">Player Props unavailable for this match<");
    expect(copy).toContain('gameLines: "Game Lines"');
    expect(copy).toContain('playerProps: "Player Props"');
    expect(copy).toContain('playerPropsUnavailable: "Player Props unavailable for this match"');
    expect(copy).toContain("\\u6bd4\\u8d5b\\u76d8\\u53e3");
    expect(copy).toContain("\\u7403\\u5458\\u7279\\u6b8a\\u76d8");
    expect(copy).toContain("\\u672c\\u573a\\u6682\\u65e0\\u7403\\u5458\\u7279\\u6b8a\\u76d8");
  });
});
