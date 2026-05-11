import { NextRequest, NextResponse } from "next/server";
import { assertAdmin, toGuardResponse } from "@/lib/marketGuards";
import { enforceSensitiveRateLimit } from "@/server/services/orderRateLimiter";
import {
  PolymarketImportRequest,
  upsertPolymarketReferenceMarket,
} from "@/server/services/polymarketReferenceImport";
import {
  buildPolymarketImportRequestFromPreview,
  extractPolymarketSlug,
  fetchPolymarketMarketPreview,
} from "@/server/services/polymarketReferencePreview";

type PreviewImportRequest = {
  slug?: string | null;
  url?: string | null;
  dryRun?: boolean;
  createLocalMarkets?: boolean;
  createEvents?: boolean;
  notes?: string | null;
};

export async function POST(request: NextRequest) {
  let adminUserId = "";
  try {
    const admin = await assertAdmin();
    adminUserId = admin.id;
    enforceSensitiveRateLimit(admin.id, "admin_market_mutation");
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const body = (await request.json().catch(() => null)) as
    | PolymarketImportRequest
    | PreviewImportRequest
    | null;

  if (isDirectImportRequest(body)) {
    try {
      const result = await upsertPolymarketReferenceMarket(body, adminUserId);
      return NextResponse.json({ ok: true, imported: true, ...result });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Import failed." },
        { status: 500 },
      );
    }
  }

  try {
    const slugInput = body?.slug ?? body?.url ?? "";
    const slug = typeof slugInput === "string" ? extractPolymarketSlug(slugInput) : null;
    if (!slug) {
      return NextResponse.json({ error: "Invalid Polymarket slug or URL." }, { status: 400 });
    }

    const dryRun = body?.dryRun !== false;
    const createLocalMarkets = body?.createLocalMarkets === true;
    const createEvents = body?.createEvents !== false;
    const preview = await fetchPolymarketMarketPreview(slug);

    if (dryRun || !createLocalMarkets) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        slug,
        preview,
        warning:
          "Preview only. No local Event, Market, or Outcome records were created.",
      });
    }

    const importRequest = buildPolymarketImportRequestFromPreview(preview, {
      createEvents,
      notes: typeof body?.notes === "string" ? body.notes : null,
    });
    const result = await upsertPolymarketReferenceMarket(importRequest, adminUserId);
    return NextResponse.json({
      ok: true,
      dryRun: false,
      slug,
      preview,
      imported: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error && /not found/i.test(error.message)
        ? error.message
        : error instanceof Error
          ? error.message
          : "Import failed.";
    return NextResponse.json(
      { error: message },
      {
        status:
          error instanceof Error && /not found/i.test(error.message)
            ? 404
            : 500,
      },
    );
  }
}

function isDirectImportRequest(body: unknown): body is PolymarketImportRequest {
  return Boolean(
    body &&
      typeof body === "object" &&
      "market" in body &&
      body.market &&
      typeof body.market === "object" &&
      "title" in body.market &&
      Array.isArray((body.market as { outcomes?: unknown }).outcomes),
  );
}
