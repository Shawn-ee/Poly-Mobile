import { NextRequest } from "next/server";
import { getUserId } from "@/lib/auth";
import { apiError, apiErrorFromUnknown, apiOk } from "@/lib/canonicalApi";
import { getCanonicalMarketQuote } from "@/server/services/canonicalApi";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Ctx) {
  const { id } = await context.params;
  if (!id) {
    return apiError(400, "INVALID_REQUEST", "Market id is required.");
  }

  const userId = await getUserId();
  const outcomeId = request.nextUrl.searchParams.get("outcomeId");

  try {
    const result = await getCanonicalMarketQuote({
      marketId: id,
      outcomeId,
      userId,
    });
    return apiOk(result);
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to load market quote.");
  }
}
