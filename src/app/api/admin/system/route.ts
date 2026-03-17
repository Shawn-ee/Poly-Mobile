import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { validateConfig } from "@/lib/config";
import {
  reconcileBalances,
  reconcilePublicMarkets,
  reconcileWithdrawals,
} from "@/server/services/opsReconciliation";

export async function GET(_request: NextRequest) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const configSummary = validateConfig(process.env);
  const [dbOk, activePublicMarkets, pendingWithdrawals, recentProcessed, balancesRec, marketsRec, withdrawalsRec] =
    await Promise.all([
      prisma.$queryRaw`SELECT 1`
        .then(() => true)
        .catch((error) => {
          console.error("[admin.system] db health check failed", {
            error: error instanceof Error ? error.message : String(error),
          });
          return false;
        }),
      prisma.market.count({
        where: {
          mechanism: "ORDERBOOK",
          visibility: "PUBLIC",
          status: "LIVE",
          isCanceled: false,
        },
      }),
      prisma.withdrawalRequest.count({ where: { status: "PENDING" } }),
      prisma.withdrawalRequest.count({ where: { status: { in: ["COMPLETED", "REJECTED"] } } }),
      reconcileBalances(),
      reconcilePublicMarkets(),
      reconcileWithdrawals(),
    ]);

  return NextResponse.json({
    status: dbOk ? "ok" : "degraded",
    db: dbOk ? "connected" : "error",
    env: configSummary.env,
    timestamp: new Date().toISOString(),
    config: {
      strict: configSummary.strict,
      valid: configSummary.ok,
      warnings: configSummary.warnings,
      errors: configSummary.strict ? configSummary.errors : [],
    },
    metrics: {
      activePublicMarkets,
      pendingWithdrawals,
      recentProcessedWithdrawals: recentProcessed,
    },
    reconciliation: {
      balances: {
        pass: balancesRec.pass,
        checkedUsers: balancesRec.checkedUsers,
        mismatches: balancesRec.mismatches.length,
      },
      publicMarkets: {
        pass: marketsRec.pass,
        checkedMarkets: marketsRec.checkedMarkets,
        mismatches: marketsRec.mismatches.length,
      },
      withdrawals: {
        pass: withdrawalsRec.pass,
        checkedRequests: withdrawalsRec.checkedRequests,
        mismatches: withdrawalsRec.mismatches.length,
      },
    },
    links: {
      withdrawals: "/admin/withdrawals",
      system: "/admin/system",
    },
  });
}

