-- AlterEnum
ALTER TYPE "MarketStatus" ADD VALUE IF NOT EXISTS 'CANCELED';

-- CreateEnum
CREATE TYPE "MarketKind" AS ENUM ('AMM', 'POOL');

-- CreateEnum
CREATE TYPE "MarketVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- AlterEnum
ALTER TYPE "LedgerReason" ADD VALUE IF NOT EXISTS 'POOL_BET';

-- AlterTable
ALTER TABLE "Market"
ADD COLUMN "kind" "MarketKind" NOT NULL DEFAULT 'AMM',
ADD COLUMN "ownerId" TEXT,
ADD COLUMN "betCloseTime" TIMESTAMP(3),
ADD COLUMN "maxParticipants" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN "hidePicksUntilClose" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "visibility" "MarketVisibility" NOT NULL DEFAULT 'PRIVATE',
ADD COLUMN "isListed" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "PoolBet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "outcomeId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PoolBet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolStakePreset" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "PoolStakePreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PoolBet_marketId_createdAt_idx" ON "PoolBet"("marketId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PoolBet_userId_marketId_key" ON "PoolBet"("userId", "marketId");

-- CreateIndex
CREATE INDEX "PoolStakePreset_marketId_idx" ON "PoolStakePreset"("marketId");

-- CreateIndex
CREATE UNIQUE INDEX "PoolStakePreset_marketId_amount_key" ON "PoolStakePreset"("marketId", "amount");

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolBet" ADD CONSTRAINT "PoolBet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PoolBet" ADD CONSTRAINT "PoolBet_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PoolBet" ADD CONSTRAINT "PoolBet_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolStakePreset" ADD CONSTRAINT "PoolStakePreset_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
