-- Phase 4: market model split lifecycle + mechanism hardening

-- 1) MarketStatus enum migration
ALTER TYPE "MarketStatus" RENAME TO "MarketStatus_old";

CREATE TYPE "MarketStatus" AS ENUM ('UPCOMING', 'LIVE', 'CLOSED', 'RESOLVED');

ALTER TABLE "Market"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Market"
ALTER COLUMN "status" TYPE "MarketStatus"
USING (
  CASE "status"::text
    WHEN 'ACTIVE' THEN 'LIVE'
    WHEN 'PAUSED' THEN 'CLOSED'
    WHEN 'CANCELED' THEN 'CLOSED'
    WHEN 'RESOLVED' THEN 'RESOLVED'
    ELSE 'UPCOMING'
  END
)::"MarketStatus";

ALTER TABLE "Market"
ALTER COLUMN "status" SET DEFAULT 'UPCOMING';

DROP TYPE "MarketStatus_old";

-- 2) MarketMechanism enum migration
ALTER TYPE "MarketMechanism" RENAME TO "MarketMechanism_old";

CREATE TYPE "MarketMechanism" AS ENUM ('ORDERBOOK', 'POOL');

-- Drop dependent checks before enum type rewrite to avoid old/new enum comparisons.
ALTER TABLE "Market" DROP CONSTRAINT IF EXISTS market_visibility_mechanism_check;
ALTER TABLE "Market" DROP CONSTRAINT IF EXISTS market_pool_owner_required_check;

ALTER TABLE "Market"
ALTER COLUMN "mechanism" DROP DEFAULT;

-- Normalize legacy AMM values while column is still MarketMechanism_old.
UPDATE "Market"
SET "mechanism" = 'ORDERBOOK'::"MarketMechanism_old"
WHERE "mechanism"::text = 'AMM';

ALTER TABLE "Market"
ALTER COLUMN "mechanism" TYPE "MarketMechanism"
USING ("mechanism"::text::"MarketMechanism");

ALTER TABLE "Market"
ALTER COLUMN "mechanism" SET DEFAULT 'ORDERBOOK';

DROP TYPE "MarketMechanism_old";

-- 3) Constraints
ALTER TABLE "Market"
ADD CONSTRAINT market_visibility_mechanism_check
CHECK (NOT ("mechanism"::text = 'POOL' AND "visibility"::text = 'PUBLIC'));

ALTER TABLE "Market"
ADD CONSTRAINT market_pool_owner_required_check
CHECK ("mechanism"::text <> 'POOL' OR "ownerId" IS NOT NULL);
