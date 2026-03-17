import { NextResponse } from "next/server";
import { clearUserIdCookie } from "@/lib/auth";

export async function POST() {
  await clearUserIdCookie();
  return NextResponse.json({ ok: true });
}
