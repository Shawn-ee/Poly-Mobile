import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { scanPolygonUsdcDeposits } from "@/lib/deposits/polygonDeposits";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const body = await request.json().catch(() => null);
  const fromBlock =
    typeof body?.fromBlock === "number" && Number.isFinite(body.fromBlock)
      ? body.fromBlock
      : null;

  try {
    const summary = await scanPolygonUsdcDeposits({ fromBlock });
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Deposit rescan failed." },
      { status: 500 },
    );
  }
}

