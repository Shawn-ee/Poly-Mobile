import fs from "fs";
import path from "path";

const eventPage = fs.readFileSync(
  path.join(process.cwd(), "src", "app", "events", "[slug]", "page.tsx"),
  "utf8",
);

describe("live sports UX polish display-only contract", () => {
  test("sports event page includes market search, status summary, and sticky outcome preview", () => {
    expect(eventPage).toContain("Search markets");
    expect(eventPage).toContain("summarizeMarketStatuses");
    expect(eventPage).toContain("SportsOutcomePreview");
    expect(eventPage).toContain("lg:sticky lg:top-6");
  });

  test("event-page outcome preview remains display-only", () => {
    expect(eventPage).toContain("Event-page controls remain preview-only and do not submit orders.");
    expect(eventPage).toContain("Open the market detail page for the guarded internal beta ticket.");
    expect(eventPage).not.toContain("fetch(`/api/orders`");
    expect(eventPage).not.toContain("fetch(\"/api/orders\"");
  });
});
