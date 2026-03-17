-- CreateTable
CREATE TABLE "MarketOutcomeSnapshot" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "outcomeId" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "price" DOUBLE PRECISION NOT NULL,
    "sharesOutstanding" DOUBLE PRECISION,
    "volumeDelta" DOUBLE PRECISION,

    CONSTRAINT "MarketOutcomeSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketOutcomeSnapshot_marketId_ts_idx" ON "MarketOutcomeSnapshot"("marketId", "ts");

-- CreateIndex
CREATE INDEX "MarketOutcomeSnapshot_marketId_outcomeId_ts_idx" ON "MarketOutcomeSnapshot"("marketId", "outcomeId", "ts");

-- AddForeignKey
ALTER TABLE "MarketOutcomeSnapshot" ADD CONSTRAINT "MarketOutcomeSnapshot_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketOutcomeSnapshot" ADD CONSTRAINT "MarketOutcomeSnapshot_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
