import { GET } from "@/app/api/internal/operator/session/route";

const requireAdmin = jest.fn();

jest.mock("@/lib/admin", () => ({
  requireAdmin: () => requireAdmin(),
}));

describe("internal operator session route", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    delete process.env.HOLIWYN_DISABLE_INTERNAL_OPERATOR_CONTROLS;
  });

  afterEach(() => {
    delete process.env.HOLIWYN_DISABLE_INTERNAL_OPERATOR_CONTROLS;
  });

  test("returns authenticated operator identity without settlement secrets", async () => {
    requireAdmin.mockResolvedValue({
      user: {
        id: "admin-user-1",
        email: "admin@example.test",
        username: "admin",
        isAdmin: true,
      },
    });

    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");

    const body = await res.json();
    expect(body).toMatchObject({
      status: "ready",
      route: "GET /api/internal/operator/session",
      mutatesState: false,
      providerQuotaRequired: false,
      publicMobileRoute: false,
      exactConfirmationExposed: false,
      operator: {
        id: "admin-user-1",
        roles: ["admin", "settlement_operator"],
        durableIdentityAvailable: true,
      },
      capabilities: {
        canReviewSettlementQueue: true,
        canApproveSettlement: false,
        canExecuteSettlement: false,
        canViewExactConfirmation: false,
      },
    });
    expect(JSON.stringify(body)).not.toContain("SETTLE_FROM_RESULT:");
    expect(JSON.stringify(body)).not.toContain("THE_ODDS_API_KEY");
  });

  test("requires admin authentication", async () => {
    requireAdmin.mockResolvedValue({ error: "Unauthorized", status: 401 });

    const res = await GET();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  test("can be disabled explicitly", async () => {
    process.env.HOLIWYN_DISABLE_INTERNAL_OPERATOR_CONTROLS = "1";

    const res = await GET();
    expect(res.status).toBe(404);
    expect(requireAdmin).not.toHaveBeenCalled();
  });
});
