import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { resetPublicSchema } from "@/server/services/__tests__/dbTestUtils";
import { POST as createMarket } from "@/app/api/admin/markets/create/route";
import { GET as getAdminMarket, PATCH as patchAdminMarket } from "@/app/api/admin/markets/[id]/route";
import { PATCH as patchOutcomes } from "@/app/api/admin/markets/[id]/outcomes/route";
import { POST as pauseMarket } from "@/app/api/admin/markets/[id]/pause/route";
import { POST as closeMarket } from "@/app/api/admin/markets/[id]/close/route";
import { GET as listEventMarkets } from "@/app/api/events/[slug]/markets/route";

const requireAdmin = jest.fn();
const enforceSensitiveRateLimit = jest.fn();

jest.mock("@/lib/admin", () => ({
  requireAdmin: () => requireAdmin(),
}));

jest.mock("@/server/services/orderRateLimiter", () => ({
  enforceSensitiveRateLimit: (...args: unknown[]) => enforceSensitiveRateLimit(...args),
}));

const createAdminUser = async () =>
  prisma.user.create({
    data: {
      username: `admin_event_market_${process.pid}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      email: `admin_event_market_${process.pid}_${Date.now()}@test.local`,
      isAdmin: true,
    },
  });

describe("admin event market management", () => {
  beforeEach(async () => {
    await resetPublicSchema();
    jest.clearAllMocks();
  });

  test("blocks non-admin market creation", async () => {
    requireAdmin.mockResolvedValue({ error: "Forbidden", status: 403 });

    const response = await createMarket(
      new NextRequest("http://localhost/api/admin/markets/create", {
        method: "POST",
        body: JSON.stringify({ title: "Blocked", description: "Blocked" }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(403);
    expect(enforceSensitiveRateLimit).not.toHaveBeenCalled();
  });

  test("admin can create, edit, pause, and close a grouped sports prop market", async () => {
    const admin = await createAdminUser();
    requireAdmin.mockResolvedValue({ user: admin });

    const event = await prisma.event.create({
      data: {
        slug: "lakers-warriors-phase-h",
        title: "Lakers vs Warriors",
        category: "sports",
        sportKey: "basketball",
        leagueKey: "nba",
        eventType: "game",
        homeTeamName: "Lakers",
        awayTeamName: "Warriors",
        status: "scheduled",
        createdBy: admin.id,
      },
    });

    const createResponse = await createMarket(
      new NextRequest("http://localhost/api/admin/markets/create", {
        method: "POST",
        body: JSON.stringify({
          eventId: event.id,
          title: "LeBron over 26.5 points",
          description: "Internal beta player prop for Phase H.",
          type: "BINARY",
          visibility: "PUBLIC",
          mechanism: "ORDERBOOK",
          marketGroupKey: "player_prop",
          marketGroupTitle: "Player Props",
          marketType: "player_prop",
          line: "26.5",
          unit: "points",
          period: "full_game",
          participantType: "player",
          participantName: "LeBron James",
          propCategory: "points",
          rulesText: "Manual internal beta grading only.",
          displayOrder: 40,
          outcomes: [
            { name: "Over 26.5", code: "OVER", side: "over", displayOrder: 0 },
            { name: "Under 26.5", code: "UNDER", side: "under", displayOrder: 1 },
          ],
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(createResponse.status).toBe(200);
    const { marketId } = await createResponse.json();

    const detailResponse = await getAdminMarket(
      new NextRequest(`http://localhost/api/admin/markets/${marketId}`),
      { params: Promise.resolve({ id: marketId }) },
    );
    expect(detailResponse.status).toBe(200);
    const detailBody = await detailResponse.json();
    expect(detailBody.market).toMatchObject({
      id: marketId,
      eventId: event.id,
      marketGroupKey: "player_prop",
      marketGroupTitle: "Player Props",
      marketType: "player_prop",
      line: "26.5",
      unit: "points",
      period: "full_game",
      participantType: "player",
      participantName: "LeBron James",
      propCategory: "points",
      rulesText: "Manual internal beta grading only.",
      status: "UPCOMING",
    });
    expect(detailBody.market.outcomes).toEqual([
      expect.objectContaining({ name: "Over 26.5", code: "OVER", side: "over", displayOrder: 0 }),
      expect.objectContaining({ name: "Under 26.5", code: "UNDER", side: "under", displayOrder: 1 }),
    ]);

    const patchResponse = await patchAdminMarket(
      new NextRequest(`http://localhost/api/admin/markets/${marketId}`, {
        method: "PATCH",
        body: JSON.stringify({
          marketGroupTitle: "Star Props",
          participantName: "LeBron James",
          displayOrder: 41,
          line: "27.5",
        }),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ id: marketId }) },
    );
    expect(patchResponse.status).toBe(200);
    const patchBody = await patchResponse.json();
    expect(patchBody.market.marketGroupTitle).toBe("Star Props");
    expect(patchBody.market.displayOrder).toBe(41);
    expect(patchBody.market.line.toString()).toBe("27.5");

    const outcomes = detailBody.market.outcomes as Array<{ id: string; name: string }>;
    const outcomeResponse = await patchOutcomes(
      new NextRequest(`http://localhost/api/admin/markets/${marketId}/outcomes`, {
        method: "PATCH",
        body: JSON.stringify({
          outcomes: [
            { id: outcomes[0].id, name: "Over 27.5", code: "OVER", side: "over", displayOrder: 0 },
            { id: outcomes[1].id, name: "Under 27.5", code: "UNDER", side: "under", displayOrder: 1 },
          ],
        }),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ id: marketId }) },
    );
    expect(outcomeResponse.status).toBe(200);

    const pauseResponse = await pauseMarket(
      new NextRequest(`http://localhost/api/admin/markets/${marketId}/pause`, { method: "POST" }),
      { params: Promise.resolve({ id: marketId }) },
    );
    expect(pauseResponse.status).toBe(200);
    expect(await pauseResponse.json()).toMatchObject({ marketId, status: "PAUSED" });

    const closeResponse = await closeMarket(
      new NextRequest(`http://localhost/api/admin/markets/${marketId}/close`, { method: "POST" }),
      { params: Promise.resolve({ id: marketId }) },
    );
    expect(closeResponse.status).toBe(200);
    expect(await closeResponse.json()).toMatchObject({ marketId, status: "CLOSED" });

    const publicResponse = await listEventMarkets(
      new Request("http://localhost/api/events/lakers-warriors-phase-h/markets"),
      { params: Promise.resolve({ slug: "lakers-warriors-phase-h" }) },
    );
    expect(publicResponse.status).toBe(200);
    const publicBody = await publicResponse.json();
    expect(publicBody.markets[0]).toMatchObject({
      id: marketId,
      marketGroupKey: "player_prop",
      marketGroupTitle: "Star Props",
      marketType: "player_prop",
      line: "27.5",
      participantName: "LeBron James",
      propCategory: "points",
    });
    expect(JSON.stringify(publicBody)).not.toContain(admin.email);
    expect(JSON.stringify(publicBody)).not.toContain("createdBy");
  });
});
