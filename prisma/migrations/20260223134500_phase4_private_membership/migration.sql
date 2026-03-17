-- Phase 4: private visibility membership guard support

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MarketMemberRole') THEN
    CREATE TYPE "MarketMemberRole" AS ENUM ('OWNER', 'MEMBER');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "MarketMember" (
  "id" TEXT NOT NULL,
  "marketId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "MarketMemberRole" NOT NULL DEFAULT 'MEMBER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MarketMember_marketId_userId_key"
ON "MarketMember"("marketId", "userId");

CREATE INDEX IF NOT EXISTS "MarketMember_userId_createdAt_idx"
ON "MarketMember"("userId", "createdAt");

ALTER TABLE "MarketMember"
  ADD CONSTRAINT "MarketMember_marketId_fkey"
  FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MarketMember"
  ADD CONSTRAINT "MarketMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill owners for existing pool markets
INSERT INTO "MarketMember" ("id", "marketId", "userId", "role", "createdAt")
SELECT md5(m."id" || ':' || m."ownerId"), m."id", m."ownerId", 'OWNER', CURRENT_TIMESTAMP
FROM "Market" m
WHERE m."ownerId" IS NOT NULL
ON CONFLICT ("marketId", "userId") DO NOTHING;
