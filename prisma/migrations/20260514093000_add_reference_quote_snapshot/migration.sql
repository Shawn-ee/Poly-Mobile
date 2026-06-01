-- CreateTable
CREATE TABLE "ReferenceQuoteSnapshot" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "outcomeId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalSlug" TEXT,
    "externalMarketId" TEXT,
    "conditionId" TEXT,
    "tokenId" TEXT,
    "outcomeLabel" TEXT,
    "outcomePrice" DECIMAL(20,8),
    "bestBid" DECIMAL(20,8),
    "bestAsk" DECIMAL(20,8),
    "spread" DECIMAL(20,8),
    "lastTradePrice" DECIMAL(20,8),
    "volume" DECIMAL(36,6),
    "volume24hr" DECIMAL(36,6),
    "liquidity" DECIMAL(36,6),
    "liquidityClob" DECIMAL(36,6),
    "acceptingOrders" BOOLEAN NOT NULL DEFAULT false,
    "qualityStatus" TEXT,
    "mmEligible" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenceQuoteSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceQuoteSnapshot_marketId_outcomeId_source_key" ON "ReferenceQuoteSnapshot"("marketId", "outcomeId", "source");

-- CreateIndex
CREATE INDEX "ReferenceQuoteSnapshot_marketId_updatedAt_idx" ON "ReferenceQuoteSnapshot"("marketId", "updatedAt");

-- CreateIndex
CREATE INDEX "ReferenceQuoteSnapshot_outcomeId_updatedAt_idx" ON "ReferenceQuoteSnapshot"("outcomeId", "updatedAt");

-- CreateIndex
CREATE INDEX "ReferenceQuoteSnapshot_source_updatedAt_idx" ON "ReferenceQuoteSnapshot"("source", "updatedAt");

-- AddForeignKey
ALTER TABLE "ReferenceQuoteSnapshot" ADD CONSTRAINT "ReferenceQuoteSnapshot_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenceQuoteSnapshot" ADD CONSTRAINT "ReferenceQuoteSnapshot_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;
