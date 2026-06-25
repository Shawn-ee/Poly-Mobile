-- CreateEnum
CREATE TYPE "ComboOrderStatus" AS ENUM ('OPEN', 'CANCELED', 'SETTLED', 'VOIDED');

-- CreateTable
CREATE TABLE "ComboOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stakeUSDC" DECIMAL(36,6) NOT NULL,
    "comboPrice" DECIMAL(20,8) NOT NULL,
    "potentialPayout" DECIMAL(36,6) NOT NULL,
    "status" "ComboOrderStatus" NOT NULL DEFAULT 'OPEN',
    "idempotencyKey" TEXT NOT NULL,
    "clientOrderId" TEXT,
    "requestFingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComboOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComboOrderLeg" (
    "id" TEXT NOT NULL,
    "comboOrderId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "outcomeId" TEXT NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "line" TEXT,
    "label" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComboOrderLeg_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ComboOrder_userId_idempotencyKey_key" ON "ComboOrder"("userId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "ComboOrder_userId_clientOrderId_key" ON "ComboOrder"("userId", "clientOrderId");

-- CreateIndex
CREATE INDEX "ComboOrder_userId_status_createdAt_idx" ON "ComboOrder"("userId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ComboOrderLeg_comboOrderId_marketId_key" ON "ComboOrderLeg"("comboOrderId", "marketId");

-- CreateIndex
CREATE INDEX "ComboOrderLeg_comboOrderId_displayOrder_idx" ON "ComboOrderLeg"("comboOrderId", "displayOrder");

-- CreateIndex
CREATE INDEX "ComboOrderLeg_marketId_outcomeId_idx" ON "ComboOrderLeg"("marketId", "outcomeId");

-- AddForeignKey
ALTER TABLE "ComboOrder" ADD CONSTRAINT "ComboOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboOrderLeg" ADD CONSTRAINT "ComboOrderLeg_comboOrderId_fkey" FOREIGN KEY ("comboOrderId") REFERENCES "ComboOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboOrderLeg" ADD CONSTRAINT "ComboOrderLeg_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboOrderLeg" ADD CONSTRAINT "ComboOrderLeg_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;
