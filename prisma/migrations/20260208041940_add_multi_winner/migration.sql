-- CreateEnum
CREATE TYPE "MarketType" AS ENUM ('BINARY', 'MULTI_WINNER');

-- AlterTable
ALTER TABLE "Market" ADD COLUMN     "type" "MarketType" NOT NULL DEFAULT 'BINARY';

-- CreateTable
CREATE TABLE "AmmOutcomeState" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "outcomeId" TEXT NOT NULL,
    "q" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmmOutcomeState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AmmOutcomeState_marketId_idx" ON "AmmOutcomeState"("marketId");

-- CreateIndex
CREATE UNIQUE INDEX "AmmOutcomeState_marketId_outcomeId_key" ON "AmmOutcomeState"("marketId", "outcomeId");

-- AddForeignKey
ALTER TABLE "AmmOutcomeState" ADD CONSTRAINT "AmmOutcomeState_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmmOutcomeState" ADD CONSTRAINT "AmmOutcomeState_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
