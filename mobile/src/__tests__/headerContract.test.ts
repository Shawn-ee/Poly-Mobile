import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const headerSource = () => readFileSync("mobile/src/components/Header.tsx", "utf8");
const appSource = () => readFileSync("mobile/App.tsx", "utf8");

describe("Header visible action contract", () => {
  test("does not expose unsupported promo or notification actions", () => {
    const header = headerSource();
    const app = appSource();

    expect(header).not.toContain("header-promo-action");
    expect(header).not.toContain("header-notifications-action");
    expect(header).not.toContain("header-action-feedback");
    expect(header).not.toContain("setFeedback");
    expect(header).not.toContain("50 USDT demo credit queued");
    expect(header).not.toContain("No new notifications");
    expect(app).not.toContain("promo={t.promo}");
    expect(header).toContain("toggleLanguage");
    expect(header).toContain("language-outline");
  });
});
