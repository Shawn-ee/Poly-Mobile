import { describe, expect, test } from "vitest";
import {
  buildListedReferenceMetadata,
  derivePolymarketLocalEventSlug,
} from "@/server/services/polymarketEventImport";

describe("polymarket grouped event import metadata", () => {
  test("maps current World Cup Winner provider slug to the mobile event slug", () => {
    expect(
      derivePolymarketLocalEventSlug({
        externalSlug: "world-cup-winner",
        title: "World Cup Winner",
      }),
    ).toBe("mobile-fj-real-world-cup-winner");
    expect(
      derivePolymarketLocalEventSlug({
        externalSlug: "2026-fifa-world-cup-winner-595",
        title: "World Cup Winner",
      }),
    ).toBe("mobile-fj-real-world-cup-winner");
  });

  test("preserves reference review fields when attaching listed group metadata", () => {
    const metadata = buildListedReferenceMetadata({
      teamLabel: "France",
      current: {
        importedFrom: "polymarket",
        importStatus: "approved",
        referenceOnly: true,
        tradable: true,
        mmEnabled: true,
        reviewedAt: "2026-07-07T00:00:00.000Z",
        reviewedBy: "admin-user",
        reviewNotes: "Approved for local liquidity runtime.",
        sourceMarket: {
          acceptingOrders: true,
        },
      },
    }) as Record<string, unknown>;

    expect(metadata.importStatus).toBe("approved");
    expect(metadata.referenceOnly).toBe(true);
    expect(metadata.tradable).toBe(true);
    expect(metadata.mmEnabled).toBe(true);
    expect(metadata.reviewedBy).toBe("admin-user");
    expect(metadata.group).toMatchObject({ outcomeLabel: "France" });
  });
});
