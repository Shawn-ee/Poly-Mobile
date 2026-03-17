import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { MarketStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim() ?? "";
  const statusParam = url.searchParams.get("status")?.toUpperCase() ?? "ALL";
  const page = Math.max(Number(url.searchParams.get("page") ?? 1), 1);
  const pageSizeRaw = Number(url.searchParams.get("pageSize") ?? 20);
  const pageSize = Math.min(Math.max(pageSizeRaw, 1), 100);
  const statusValues = Object.values(MarketStatus);
  const status =
    statusParam !== "ALL" && statusValues.includes(statusParam as MarketStatus)
      ? (statusParam as MarketStatus)
      : null;

  const where: Prisma.MarketWhereInput = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.MarketOrderByWithRelationInput[] =
    status === "RESOLVED"
      ? [{ resolveTime: Prisma.SortOrder.desc }, { createdAt: Prisma.SortOrder.desc }]
      : [{ createdAt: "desc" }];

  const [total, items] = await Promise.all([
    prisma.market.count({ where }),
    prisma.market.findMany({
      where,
      orderBy,
      include: { outcomes: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return NextResponse.json({
    items,
    page,
    pageSize,
    total,
    totalPages,
  });
}
