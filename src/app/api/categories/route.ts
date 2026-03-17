import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { parentId: null, isActive: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      children: {
        where: { isActive: true },
        orderBy: [{ order: "asc" }, { name: "asc" }],
      },
    },
  });

  return NextResponse.json({ categories });
}
