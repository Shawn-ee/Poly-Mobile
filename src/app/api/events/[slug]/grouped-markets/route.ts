import { NextResponse } from "next/server";
import { getGroupedEventMarkets } from "@/server/services/eventGroupedMarkets";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { slug } = await context.params;
  const grouped = await getGroupedEventMarkets(slug);
  if (!grouped) {
    return NextResponse.json({ error: "Grouped event not found." }, { status: 404 });
  }
  return NextResponse.json(grouped);
}
