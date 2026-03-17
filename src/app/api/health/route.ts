import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertRuntimeConfig, config } from "@/lib/config";

export async function GET(_request: NextRequest) {
  try {
    const cfg = assertRuntimeConfig();
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "connected",
      env: cfg.env ?? config.appEnv,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[health] check failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        status: "error",
        db: "disconnected",
        env: config.appEnv,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

