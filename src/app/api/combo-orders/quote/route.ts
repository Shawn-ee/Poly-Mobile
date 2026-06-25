import { NextRequest } from "next/server";
import { runCanonicalRoute } from "@/lib/canonicalRoute";
import { quoteComboOrder } from "@/server/services/comboOrders";

export async function POST(request: NextRequest) {
  return runCanonicalRoute({
    request,
    scopes: ["orders:read"],
    routeId: "combo-orders:quote",
    fallbackMessage: "Failed to quote combo order.",
    handler: async () => {
      const body = await request.json().catch(() => null);
      return {
        body: await quoteComboOrder({ body }),
      };
    },
  });
}
