import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transactions = await prisma.ledgerTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    transactions,
  });
}
