-- CreateEnum
CREATE TYPE "MarketMechanism" AS ENUM ('ORDERBOOK', 'AMM', 'POOL');

-- AlterTable
ALTER TABLE "Market"
ADD COLUMN "mechanism" "MarketMechanism" NOT NULL DEFAULT 'AMM';

-- Ensure visibility defaults to PUBLIC going forward
ALTER TABLE "Market"
ALTER COLUMN "visibility" SET DEFAULT 'PUBLIC';

-- Backfill existing rows
UPDATE "Market"
SET "visibility" = 'PRIVATE',
    "mechanism" = 'POOL'
WHERE "kind" = 'POOL';

UPDATE "Market"
SET "visibility" = 'PUBLIC'
WHERE "kind" <> 'POOL';
