import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { getLatestReferenceQuotePlansForMarket } from "@/server/services/referenceQuoteSnapshots";

export async function GET() {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    // Listed market counts
    const totalListed = await prisma.market.count({
      where: { visibility: "PUBLIC", isListed: true },
    });
    const liveListed = await prisma.market.count({
      where: { visibility: "PUBLIC", isListed: true, status: "LIVE" },
    });
    const hiddenCount = await prisma.market.count({
      where: { visibility: "PUBLIC", isListed: false },
    });

    // Reference freshness: count markets with fresh reference data
    const listedMarkets = await prisma.market.findMany({
      where: { visibility: "PUBLIC", isListed: true, status: "LIVE" },
      select: { id: true, title: true, referenceMetadata: true },
    });

    let freshCount = 0;
    let staleCount = 0;
    const staleReasons: string[] = [];

    for (const market of listedMarkets) {
      const plans = await getLatestReferenceQuotePlansForMarket(market.id);
      const yesPlan = plans.find((p) => p.outcomeName.trim().toUpperCase() === "YES") ?? plans[0];
      if (yesPlan?.isFresh) {
        freshCount++;
      } else {
        staleCount++;
        const reason = yesPlan?.qualityStatus ?? "no reference data";
        staleReasons.push(`${market.title.slice(0, 40)}: ${reason}`);
      }
    }

    // Open order count (all open orders - since only bot and test users trade right now)
    const openOrders = await prisma.order.count({
      where: { status: "OPEN" },
    });

    // Total orders
    const totalOrders = await prisma.order.count();

    return NextResponse.json({
      listedMarketCount: totalListed,
      liveMarketCount: liveListed,
      hiddenMarketCount: hiddenCount,
      freshMarketCount: freshCount,
      staleMarketCount: staleCount,
      openOrderCount: openOrders,
      totalOrders,
      staleReasons: staleReasons.slice(0, 20),
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load market ops stats." },
      { status: 500 }
    );
  }
}
