import { buildMobileLiveChartSnapshotRows } from "@/server/services/mobileLiveChartSnapshotSeeding";

describe("mobile live chart snapshot seeding", () => {
  test("builds backend-shaped probability rows for every outcome over time", () => {
    const rows = buildMobileLiveChartSnapshotRows(
      [
        { id: "home", displayOrder: 0 },
        { id: "draw", displayOrder: 1 },
        { id: "away", displayOrder: 2 },
      ],
      new Date("2026-06-15T12:00:00.000Z"),
    );

    expect(rows).toHaveLength(24);
    expect(rows[0]).toMatchObject({
      outcomeId: "home",
      timestamp: new Date("2026-06-15T10:15:00.000Z"),
    });
    expect(rows.at(-1)).toMatchObject({
      outcomeId: "away",
      timestamp: new Date("2026-06-15T12:00:00.000Z"),
    });
    for (const row of rows) {
      expect(row.probability).toBeGreaterThanOrEqual(1);
      expect(row.probability).toBeLessThanOrEqual(99);
      expect(row.price.toNumber()).toBeCloseTo(row.probability / 100, 6);
    }
  });

  test("returns no rows when a market has no outcomes", () => {
    expect(buildMobileLiveChartSnapshotRows([], new Date("2026-06-15T12:00:00.000Z"))).toEqual([]);
  });
});
