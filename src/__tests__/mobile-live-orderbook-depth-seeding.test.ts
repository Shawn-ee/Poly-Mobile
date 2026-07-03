import { buildMobileLiveOrderbookDepthRows } from "@/server/services/mobileLiveOrderbookDepthSeeding";

describe("mobile live orderbook depth seeding", () => {
  test("builds backend-shaped bid and ask levels for each outcome", () => {
    const rows = buildMobileLiveOrderbookDepthRows([
      { id: "home", displayOrder: 0 },
      { id: "away", displayOrder: 1 },
    ]);

    expect(rows).toHaveLength(8);
    expect(rows.map((row) => row.outcomeId)).toEqual([
      "home",
      "home",
      "home",
      "home",
      "away",
      "away",
      "away",
      "away",
    ]);

    const homeBids = rows.filter((row) => row.outcomeId === "home" && row.side === "BUY");
    const homeAsks = rows.filter((row) => row.outcomeId === "home" && row.side === "SELL");
    expect(homeBids).toHaveLength(2);
    expect(homeAsks).toHaveLength(2);
    expect(homeBids[0]!.price.lt(homeAsks[0]!.price)).toBe(true);
    expect(homeBids[0]!.amount.gt(0)).toBe(true);
    expect(homeAsks[0]!.amount.gt(0)).toBe(true);
  });
});
