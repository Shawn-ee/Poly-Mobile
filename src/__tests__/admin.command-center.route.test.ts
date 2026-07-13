import { GET } from "@/app/api/admin/command-center/route";

const requireAdmin = jest.fn();
const getAdminCommandCenterSnapshot = jest.fn();

jest.mock("@/lib/admin", () => ({
  requireAdmin: () => requireAdmin(),
}));

jest.mock("@/server/services/adminCommandCenter", () => ({
  getAdminCommandCenterSnapshot: () => getAdminCommandCenterSnapshot(),
}));

describe("admin command-center route", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    getAdminCommandCenterSnapshot.mockReset();
  });

  test("rejects unauthenticated callers", async () => {
    requireAdmin.mockResolvedValue({ error: "Unauthorized", status: 401 });

    const res = await GET();

    expect(res.status).toBe(401);
    expect(getAdminCommandCenterSnapshot).not.toHaveBeenCalled();
  });

  test("rejects non-admin callers", async () => {
    requireAdmin.mockResolvedValue({ error: "Forbidden", status: 403 });

    const res = await GET();

    expect(res.status).toBe(403);
    expect(getAdminCommandCenterSnapshot).not.toHaveBeenCalled();
  });

  test("returns admin-safe command center payload without secrets or exact confirmation text", async () => {
    requireAdmin.mockResolvedValue({ user: { id: "admin-1", isAdmin: true } });
    getAdminCommandCenterSnapshot.mockResolvedValue({
      generatedAt: "2026-07-13T00:00:00.000Z",
      status: "blocked",
      environment: {
        envPresence: {
          DATABASE_URL: true,
          THE_ODDS_API_KEY: true,
        },
      },
      overview: {
        statuses: [
          {
            id: "settlement",
            status: "blocked",
            lastUpdated: "2026-07-13T00:00:00.000Z",
            blocker: "market_not_closed",
            nextAction: "wait_for_market_close",
            localOnly: true,
            productionSafe: false,
          },
        ],
      },
    });

    const res = await GET();
    const body = await res.json();
    const serialized = JSON.stringify(body);

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(body.environment.envPresence.THE_ODDS_API_KEY).toBe(true);
    expect(serialized).not.toContain("THE_ODDS_API_KEY=");
    expect(serialized).not.toContain("SETTLE:");
    expect(serialized).not.toContain("SETTLE_FROM_RESULT:");
    expect(serialized).not.toContain("exactConfirmation");
  });
});
