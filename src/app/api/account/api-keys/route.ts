import { NextRequest } from "next/server";
import { apiErrorFromUnknown, apiOk } from "@/lib/canonicalApi";
import {
  createApiCredential,
  listApiCredentials,
  requireSessionActor,
} from "@/lib/canonicalAuth";

export async function GET() {
  try {
    const actor = await requireSessionActor();
    const result = await listApiCredentials(actor.userId);
    return apiOk(result);
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to load API keys.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireSessionActor();
    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name : "";
    const result = await createApiCredential({
      userId: actor.userId,
      name,
      scopes: body?.scopes,
    });
    return apiOk(result, 201);
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to create API key.");
  }
}
