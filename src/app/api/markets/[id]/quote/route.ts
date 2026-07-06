import { NextRequest } from "next/server";
import { getUserId } from "@/lib/auth";
import { apiError, apiErrorFromUnknown, apiOk } from "@/lib/canonicalApi";
import { getCanonicalMarketQuote } from "@/server/services/canonicalApi";

type Ctx = { params: Promise<{ id: string }> };

async function optionalUserIdForPublicQuoteRoute() {
  try {
    return await getUserId();
  } catch (error) {
    if (error instanceof Error && error.message.includes("outside a request scope")) {
      return null;
    }
    throw error;
  }
}

export async function GET(request: NextRequest, context: Ctx) {
  const { id } = await context.params;
  if (!id) {
    return apiError(400, "INVALID_REQUEST", "Market id is required.");
  }

  const userId = await optionalUserIdForPublicQuoteRoute();
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
