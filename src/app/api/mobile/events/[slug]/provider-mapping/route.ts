import { NextResponse } from "next/server";
import { assertReferenceBotAdmin } from "@/lib/internalAdminAuth";
import { toGuardResponse } from "@/lib/marketGuards";
import { getMobileLiveProviderMappingReadiness } from "@/server/services/mobileLiveProviderMapping";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Params) {
  try {
    await assertReferenceBotAdmin();
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const { slug } = await context.params;
  const readiness = await getMobileLiveProviderMappingReadiness(slug);

  return NextResponse.json({
    ok: true,
    readiness,
  });
}
