-- DropIndex
DROP INDEX "Order_marketId_outcomeId_side_price_idx";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "reservedNotional" DECIMAL(36,6) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Fill" (
    "id" TEXT NOT NULL,
    "takerOrderId" TEXT NOT NULL,
    "makerOrderId" TEXT NOT NULL,
    "takerUserId" TEXT NOT NULL,
    "makerUserId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "outcomeId" TEXT NOT NULL,
    "side" "TradeSide" NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "size" DECIMAL(36,6) NOT NULL,
    "notionalUSDC" DECIMAL(36,6) NOT NULL,
    "feeUSDC" DECIMAL(36,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Fill_marketId_outcomeId_createdAt_idx" ON "Fill"("marketId", "outcomeId", "createdAt");

-- CreateIndex
CREATE INDEX "Fill_takerOrderId_idx" ON "Fill"("takerOrderId");

-- CreateIndex
CREATE INDEX "Fill_makerOrderId_idx" ON "Fill"("makerOrderId");

-- CreateIndex
CREATE INDEX "Fill_takerUserId_createdAt_idx" ON "Fill"("takerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Fill_makerUserId_createdAt_idx" ON "Fill"("makerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_marketId_outcomeId_side_price_createdAt_idx" ON "Order"("marketId", "outcomeId", "side", "price", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_marketId_outcomeId_side_price_idx" ON "Order"("status", "marketId", "outcomeId", "side", "price");

-- AddForeignKey
ALTER TABLE "Fill" ADD CONSTRAINT "Fill_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fill" ADD CONSTRAINT "Fill_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;
