import { beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for Phase 3 DB tests.");
  }
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});
