import { parseProviderSlugReviewInput } from "@/lib/mobileProviderReviewInput";

describe("parseProviderSlugReviewInput", () => {
  test("parses line input with equals and comma-separated slugs", () => {
    expect(parseProviderSlugReviewInput("market-1=fifwc-col-gha-2026-07-03-col, fifwc-col-gha-2026-07-03-draw")).toEqual([
      {
        marketId: "market-1",
        slugs: ["fifwc-col-gha-2026-07-03-col", "fifwc-col-gha-2026-07-03-draw"],
      },
    ]);
  });

  test("parses JSON array input", () => {
    expect(parseProviderSlugReviewInput(JSON.stringify([
      { marketId: "market-1", slugs: ["slug-1"] },
      { marketId: "market-2", slug: "slug-2" },
    ]))).toEqual([
      { marketId: "market-1", slugs: ["slug-1"] },
      { marketId: "market-2", slugs: ["slug-2"] },
    ]);
  });

  test("rejects missing slugs", () => {
    expect(() => parseProviderSlugReviewInput("market-1=")).toThrow("must include at least one Polymarket slug");
  });
});
