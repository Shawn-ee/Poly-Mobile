import { NextRequest } from "next/server";
import { apiErrorFromUnknown, apiOk } from "@/lib/canonicalApi";
import {
  requireSessionActor,
  revokeApiCredential,
  updateApiCredential,
} from "@/lib/canonicalAuth";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: Ctx) {
  try {
    const actor = await requireSessionActor();
    const { id } = await context.params;
    const result = await revokeApiCredential({
      userId: actor.userId,
      id,
    });
    return apiOk(result);
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to revoke API key.");
  }
}

export async function PATCH(request: NextRequest, context: Ctx) {
  try {
    const actor = await requireSessionActor();
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const result = await updateApiCredential({
      userId: actor.userId,
      id,
      body,
    });
    return apiOk(result);
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to update API key.");
  }
}
