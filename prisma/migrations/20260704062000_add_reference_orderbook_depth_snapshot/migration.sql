-- Provider-owned orderbook ladder snapshots for mobile live-detail parity.
-- These rows are distinct from local Holiwyn orders and from top-quote
-- ReferenceQuoteSnapshot rows so the mobile Book can expose real provider
-- depth when a provider supplies it.
CREATE TABLE "ReferenceOrderbookDepthSnapshot" (
  "id" TEXT NOT NULL,
  "marketId" TEXT NOT NULL,
  "outcomeId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "externalSlug" TEXT,
  "externalMarketId" TEXT,
  "conditionId" TEXT,
  "tokenId" TEXT,
  "side" TEXT NOT NULL,
  "price" DECIMAL(20,8) NOT NULL,
  "size" DECIMAL(36,6) NOT NULL,
  "levelIndex" INTEGER NOT NULL,
  "fetchedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReferenceOrderbookDepthSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReferenceOrderbookDepthSnapshot_marketId_outcomeId_source_side_price_key"
  ON "ReferenceOrderbookDepthSnapshot"("marketId", "outcomeId", "source", "side", "price");

CREATE INDEX "ReferenceOrderbookDepthSnapshot_marketId_source_fetchedAt_idx"
  ON "ReferenceOrderbookDepthSnapshot"("marketId", "source", "fetchedAt");

CREATE INDEX "ReferenceOrderbookDepthSnapshot_outcomeId_source_fetchedAt_idx"
  ON "ReferenceOrderbookDepthSnapshot"("outcomeId", "source", "fetchedAt");

ALTER TABLE "ReferenceOrderbookDepthSnapshot"
  ADD CONSTRAINT "ReferenceOrderbookDepthSnapshot_marketId_fkey"
  FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReferenceOrderbookDepthSnapshot"
  ADD CONSTRAINT "ReferenceOrderbookDepthSnapshot_outcomeId_fkey"
  FOREIGN KEY ("outcomeId") REFERENCES "Outcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;
