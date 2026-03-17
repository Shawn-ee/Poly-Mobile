-- Phase 4 hard cutover: remove AMM state, add limit order model

-- 1) MarketKind AMM -> ORDERBOOK
ALTER TYPE "MarketKind" RENAME TO "MarketKind_old";
CREATE TYPE "MarketKind" AS ENUM ('ORDERBOOK', 'POOL');

ALTER TABLE "Market" ALTER COLUMN "kind" DROP DEFAULT;

ALTER TABLE "Market"
ALTER COLUMN "kind" TYPE "MarketKind"
USING (
  CASE "kind"::text
    WHEN 'POOL' THEN 'POOL'
    ELSE 'ORDERBOOK'
  END
)::"MarketKind";

ALTER TABLE "Market" ALTER COLUMN "kind" SET DEFAULT 'ORDERBOOK';
DROP TYPE "MarketKind_old";

-- 2) Remove AMM runtime tables
DROP TABLE IF EXISTS "AmmOutcomeState";
DROP TABLE IF EXISTS "AmmState";

-- 3) Add orderbook order model
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderStatus') THEN
    CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'PARTIAL', 'FILLED', 'CANCELED');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "Order" (
  "id" TEXT NOT NULL,
  "marketId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "outcomeId" TEXT NOT NULL,
  "side" "TradeSide" NOT NULL,
  "price" DECIMAL(20,8) NOT NULL,
  "amount" DECIMAL(36,6) NOT NULL,
  "remaining" DECIMAL(36,6) NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Order_marketId_outcomeId_side_price_idx"
ON "Order"("marketId", "outcomeId", "side", "price");

CREATE INDEX IF NOT EXISTS "Order_userId_marketId_status_idx"
ON "Order"("userId", "marketId", "status");

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_marketId_fkey"
  FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_outcomeId_fkey"
  FOREIGN KEY ("outcomeId") REFERENCES "Outcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;
