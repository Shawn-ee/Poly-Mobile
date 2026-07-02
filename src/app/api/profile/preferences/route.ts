import { NextRequest } from "next/server";
import { runCanonicalRoute } from "@/lib/canonicalRoute";
import {
  getProfilePreferences,
  parseProfilePreferencesInput,
  saveProfilePreferences,
} from "@/server/services/profilePreferences";

export async function GET(request: NextRequest) {
  return runCanonicalRoute({
    request,
    scopes: ["account:read"],
    routeId: "account:preferences",
    fallbackMessage: "Failed to load profile preferences.",
    handler: async (actor) => getProfilePreferences({ userId: actor.userId }),
  });
}

export async function PUT(request: NextRequest) {
  return runCanonicalRoute({
    request,
    scopes: ["account:write"],
    routeId: "account:preferences",
    fallbackMessage: "Failed to save profile preferences.",
    handler: async (actor) => {
      const body = await request.json().catch(() => null);
      const preferences = parseProfilePreferencesInput(body);
      return saveProfilePreferences({ userId: actor.userId, preferences });
    },
  });
}
