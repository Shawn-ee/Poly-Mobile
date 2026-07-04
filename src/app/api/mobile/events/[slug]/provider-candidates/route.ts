import { NextRequest, NextResponse } from "next/server";
import { assertReferenceBotAdmin } from "@/lib/internalAdminAuth";
import { toGuardResponse } from "@/lib/marketGuards";
import {
  discoverMobileLiveProviderCandidates,
  previewMobileLiveProviderCandidatesBySlug,
} from "@/server/services/mobileLiveProviderCandidates";

type Params = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, context: Params) {
  try {
    await assertReferenceBotAdmin();
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const { slug } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const result = await discoverMobileLiveProviderCandidates({
    eventSlug: slug,
    marketId: searchParams.get("marketId"),
    fetchProvider: searchParams.get("fetchProvider") !== "false",
    maxCandidatesPerMarket: numberParam(searchParams.get("maxCandidatesPerMarket")),
  });

  return NextResponse.json({
    ok: true,
    result,
  });
}

export async function POST(request: NextRequest, context: Params) {
  try {
    await assertReferenceBotAdmin();
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const { slug } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | {
        marketId?: string;
        slugs?: string[];
      }
    | null;

  const result = await previewMobileLiveProviderCandidatesBySlug({
    eventSlug: slug,
    marketId: typeof body?.marketId === "string" ? body.marketId : "",
    slugs: Array.isArray(body?.slugs) ? body.slugs.filter((value): value is string => typeof value === "string") : [],
  });

  return NextResponse.json({
    ok: true,
    result,
  });
}

function numberParam(value: string | null) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}
