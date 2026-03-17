import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Username login is disabled. Use Google or wallet sign-in.",
    },
    { status: 410 }
  );
}
