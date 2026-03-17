import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const group = url.searchParams.get("group");

  const tags = await prisma.tag.findMany({
    where: {
      isActive: true,
      ...(group ? { group } : {}),
    },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ tags });
}
