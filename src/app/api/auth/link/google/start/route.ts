import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";

export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const baseUrl = process.env.NEXTAUTH_URL || url.origin;
  return NextResponse.redirect(`${baseUrl}/api/auth/google/start?mode=link`);
}
