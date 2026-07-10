import { NextRequest } from "next/server";
import { clearUserIdCookie } from "@/lib/auth";
import { apiErrorFromUnknown, apiOk } from "@/lib/canonicalApi";
import { requireCanonicalActor, revokeApiCredential } from "@/lib/canonicalAuth";

export async function POST(request: NextRequest) {
  try {
    const actor = await requireCanonicalActor(request, ["account:write"]);
    let revokedApiCredential = false;

    if (actor.apiCredentialId) {
      await revokeApiCredential({
        userId: actor.userId,
        id: actor.apiCredentialId,
      });
      revokedApiCredential = true;
    }

    await clearUserIdCookie();
    return apiOk({ ok: true, revokedApiCredential });
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to sign out mobile session.");
  }
}
