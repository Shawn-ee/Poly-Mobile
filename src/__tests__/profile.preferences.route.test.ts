import { NextRequest, NextResponse } from "next/server";
import { CanonicalApiError } from "@/lib/canonicalApi";

const getProfilePreferences = jest.fn();
const saveProfilePreferences = jest.fn();
const observedRouteScopes: Record<string, string[]> = {};

jest.mock("@/server/services/profilePreferences", () => ({
  getProfilePreferences: (...args: unknown[]) => getProfilePreferences(...args),
  parseProfilePreferencesInput: jest.requireActual("@/server/services/profilePreferences").parseProfilePreferencesInput,
  saveProfilePreferences: (...args: unknown[]) => saveProfilePreferences(...args),
}));

jest.mock("@/lib/canonicalRoute", () => ({
  runCanonicalRoute: async (params: {
    request: NextRequest;
    scopes: string[];
    routeId: string;
    handler: (actor: { userId: string }) => Promise<unknown>;
  }) => {
    observedRouteScopes[params.request.method] = params.scopes;
    try {
      const body = await params.handler({ userId: "user-1" });
      return NextResponse.json(body);
    } catch (error) {
      if (error instanceof CanonicalApiError) {
        return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
      }
      return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed" } }, { status: 500 });
    }
  },
}));

import { GET, PUT } from "@/app/api/profile/preferences/route";

describe("profile preferences route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(observedRouteScopes)) delete observedRouteScopes[key];
    getProfilePreferences.mockResolvedValue({
      preferences: {
        locale: "en",
        ticketDefaultAmount: "100",
        ticketDefaultSide: "BUY",
        ticketDefaultSlippage: "1%",
        savedEventIds: [],
      },
    });
    saveProfilePreferences.mockImplementation(async ({ preferences }) => ({ preferences }));
  });

  test("GET loads preferences for the authenticated actor", async () => {
    const response = await GET(new NextRequest("http://localhost/api/profile/preferences"));

    expect(response.status).toBe(200);
    expect(observedRouteScopes.GET).toEqual(["account:read"]);
    expect(getProfilePreferences).toHaveBeenCalledWith({ userId: "user-1" });
  });

  test("PUT saves canonical mobile preferences including slippage", async () => {
    const response = await PUT(
      new NextRequest("http://localhost/api/profile/preferences", {
        method: "PUT",
        body: JSON.stringify({
          locale: "zh",
          ticketDefaultAmount: "500",
          ticketDefaultSide: "SELL",
          ticketDefaultSlippage: "2%",
          savedEventIds: ["world-cup-winner"],
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(observedRouteScopes.PUT).toEqual(["account:write"]);
    expect(saveProfilePreferences).toHaveBeenCalledWith({
      userId: "user-1",
      preferences: {
        locale: "zh",
        ticketDefaultAmount: "500",
        ticketDefaultSide: "SELL",
        ticketDefaultSlippage: "2%",
        savedEventIds: ["world-cup-winner"],
      },
    });
  });

  test("PUT rejects incomplete preference payloads before storage", async () => {
    const response = await PUT(
      new NextRequest("http://localhost/api/profile/preferences", {
        method: "PUT",
        body: JSON.stringify({
          locale: "en",
          ticketDefaultAmount: "100",
          ticketDefaultSide: "BUY",
          savedEventIds: [],
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(saveProfilePreferences).not.toHaveBeenCalled();
  });
});
