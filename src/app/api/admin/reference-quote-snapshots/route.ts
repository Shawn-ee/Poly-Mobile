import { NextRequest, NextResponse } from "next/server";
import { assertAdmin, toGuardResponse } from "@/lib/marketGuards";
import {
  ReferenceSnapshotUpsertInput,
  upsertReferenceQuoteSnapshots,
} from "@/server/services/referenceQuoteSnapshots";

export async function POST(request: NextRequest) {
  try {
    await assertAdmin();
  } catch (error) {
    const response = toGuardResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }

  const body = (await request.json().catch(() => null)) as
    | { snapshots?: ReferenceSnapshotUpsertInput[] }
    | null;
  const snapshots = Array.isArray(body?.snapshots) ? body.snapshots : [];
  if (snapshots.length === 0) {
    return NextResponse.json({ error: "At least one snapshot is required." }, { status: 400 });
  }

  const results = await upsertReferenceQuoteSnapshots(snapshots);
  return NextResponse.json({
    ok: true,
    updated: results.length,
  });
}
